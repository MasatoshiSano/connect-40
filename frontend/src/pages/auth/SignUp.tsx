import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp } from '../../services/auth';
import { Icon } from '../../components/ui/Icon';

const signUpSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/[a-z]/, 'パスワードには小文字を含める必要があります')
    .regex(/[A-Z]/, 'パスワードには大文字を含める必要があります')
    .regex(/[0-9]/, 'パスワードには数字を含める必要があります')
    .regex(/[^a-zA-Z0-9]/, 'パスワードには記号を含める必要があります'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: '利用規約とプライバシーポリシーに同意する必要があります',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignUp = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await signUp({
        email: data.email,
        password: data.password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-50 dark:bg-base px-4">
        <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-10 md:p-12 text-center">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="check_circle" size="xl" className="text-gold" />
          </div>
          <h2 className="text-2xl font-light tracking-ryokan mb-4 text-text-primary dark:text-text-dark-primary">
            登録完了！
          </h2>
          <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
            確認メールを送信しました。メール内のリンクをクリックして、アカウントを有効化してください。
          </p>
          <a
            href="/verify-email"
            className="inline-block px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base font-light tracking-wide"
          >
            確認コードを入力
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-50 dark:bg-base px-4">
      <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-10 md:p-12">
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-serif font-light text-gold tracking-ryokan-brand">Connect40</h1>
          </div>
          <h2 className="text-xl font-light text-text-primary dark:text-text-dark-primary tracking-ryokan mb-2">
            アカウント作成
          </h2>
          <p className="text-text-secondary dark:text-text-dark-secondary">
            第3の居場所を見つけましょう
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
          {/* Email */}
          <div>
            <label className="block text-xs text-text-secondary dark:text-text-dark-secondary tracking-ryokan-wide uppercase mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              {...register('email')}
              autoComplete="email"
              className="w-full py-3 bg-transparent border-b border-border-light dark:border-border-dark focus:border-b-gold focus:outline-none text-text-primary dark:text-text-dark-primary placeholder:text-text-secondary dark:text-text-dark-muted transition-colors duration-fast"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-text-secondary dark:text-text-dark-secondary tracking-ryokan-wide uppercase mb-2">
              パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                autoComplete="new-password"
                className="w-full py-3 pr-12 bg-transparent border-b border-border-light dark:border-border-dark focus:border-b-gold focus:outline-none text-text-primary dark:text-text-dark-primary placeholder:text-text-secondary dark:text-text-dark-muted transition-colors duration-fast"
                placeholder="8文字以上、英大小文字・数字・記号を含む"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors duration-base"
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs text-text-secondary dark:text-text-dark-secondary tracking-ryokan-wide uppercase mb-2">
              パスワード（確認）
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                autoComplete="new-password"
                className="w-full py-3 pr-12 bg-transparent border-b border-border-light dark:border-border-dark focus:border-b-gold focus:outline-none text-text-primary dark:text-text-dark-primary placeholder:text-text-secondary dark:text-text-dark-muted transition-colors duration-fast"
                placeholder="パスワードを再入力"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors duration-base"
                aria-label={showConfirmPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} size="sm" />
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('agreeToTerms')}
              className="mt-1 w-4 h-4 text-gold border-border-light dark:border-border-dark focus:ring-gold"
            />
            <label className="text-sm text-text-secondary dark:text-text-dark-secondary">
              <a href="/terms" className="text-gold hover:text-gold/80 transition-colors duration-base">利用規約</a>
              および
              <a href="/privacy" className="text-gold hover:text-gold/80 transition-colors duration-base">プライバシーポリシー</a>
              に同意します
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-sm text-red-400">
              {errors.agreeToTerms.message}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base font-light tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '登録中...' : 'アカウントを作成'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-secondary dark:text-text-dark-secondary">
            すでにアカウントをお持ちですか？
            <a href="/login" className="ml-1 text-gold hover:text-gold/80 transition-colors duration-base">
              ログイン
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
