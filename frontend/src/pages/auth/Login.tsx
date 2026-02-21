import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from '../../services/auth';
import { useAuthStore } from '../../stores/auth';
import { Icon } from '../../components/ui/Icon';

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const setTokens = useAuthStore((state) => state.setTokens);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const tokens = await signIn(data);
      setTokens(tokens);

      // Extract userId from idToken
      try {
        const payload = JSON.parse(atob(tokens.idToken.split('.')[1]));
        const userId = payload.sub;
        useAuthStore.getState().setUser(null, userId);
      } catch (e) {
        console.error('Failed to extract userId from token:', e);
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="max-w-md w-full bg-surface-dark border border-border-dark p-10 md:p-12">
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-serif font-light text-gold tracking-ryokan-brand">Connect40</h1>
          </div>
          <h2 className="text-xl font-light text-text-dark-primary tracking-ryokan mb-2">
            ログイン
          </h2>
          <p className="text-text-dark-secondary">
            おかえりなさい！
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800">
            <div className="flex items-start gap-3">
              <Icon name="error" className="text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-xs text-text-dark-secondary tracking-ryokan-wide uppercase mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              {...register('email')}
              autoComplete="email"
              className="w-full py-3 bg-transparent border-b border-border-dark focus:border-b-gold focus:outline-none text-text-dark-primary placeholder:text-text-dark-muted transition-colors duration-fast"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-text-dark-secondary tracking-ryokan-wide uppercase mb-2">
              パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                autoComplete="current-password"
                className="w-full py-3 pr-12 bg-transparent border-b border-border-dark focus:border-b-gold focus:outline-none text-text-dark-primary placeholder:text-text-dark-muted transition-colors duration-fast"
                placeholder="パスワード"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-dark-muted hover:text-gold transition-colors duration-base"
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" />
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="text-right">
            <a href="/forgot-password" className="text-sm text-gold hover:text-gold/80 transition-colors duration-base">
              パスワードを忘れた場合
            </a>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base font-light tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-dark-secondary">
            アカウントをお持ちでないですか？
            <a href="/signup" className="ml-1 text-gold hover:text-gold/80 transition-colors duration-base">
              新規登録
            </a>
          </p>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-text-secondary dark:text-text-dark-secondary hover:text-gold transition-colors">
            ← ホームへ
          </a>
        </div>
      </div>
    </div>
  );
};
