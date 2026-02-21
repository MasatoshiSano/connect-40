import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { confirmSignUp, resendConfirmationCode } from '../../services/auth';
import { Icon } from '../../components/ui/Icon';

const verifySchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  code: z.string().length(6, '確認コードは6桁です'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export const VerifyEmail = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const email = watch('email');

  const onSubmit = async (data: VerifyFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await confirmSignUp(data.email, data.code);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '確認に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    setResending(true);
    setError(null);

    try {
      await resendConfirmationCode(email);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '再送信に失敗しました');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-50 dark:bg-base px-4">
        <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 text-center">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="check_circle" size="xl" className="text-gold" />
          </div>
          <h2 className="text-2xl font-light tracking-ryokan mb-4 text-text-primary dark:text-text-dark-primary">
            メール確認完了！
          </h2>
          <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
            アカウントが有効化されました。ログインしてプロフィールを作成しましょう。
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base font-light tracking-wide"
          >
            ログインページへ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-50 dark:bg-base px-4">
      <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8">
        <div className="text-center mb-8">
          <span className="font-serif text-2xl text-gold tracking-ryokan-brand block mb-4">Connect40</span>
          <h2 className="text-2xl font-light text-text-primary dark:text-text-dark-primary tracking-ryokan mb-2">
            メール確認
          </h2>
          <p className="text-text-secondary dark:text-text-dark-secondary">
            登録したメールアドレスに送信された6桁の確認コードを入力してください
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

          <div>
            <label className="block text-xs text-text-secondary dark:text-text-dark-secondary tracking-ryokan-wide uppercase mb-2">
              確認コード
            </label>
            <input
              type="text"
              {...register('code')}
              maxLength={6}
              autoComplete="one-time-code"
              className="w-full py-3 bg-transparent border-b border-border-light dark:border-border-dark focus:border-b-gold focus:outline-none text-text-primary dark:text-text-dark-primary placeholder:text-text-secondary dark:text-text-dark-muted text-center text-2xl tracking-widest transition-colors duration-fast"
              placeholder="000000"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-400">
                {errors.code.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base font-light tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '確認中...' : 'メールを確認'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-gold hover:text-gold/80 transition-colors duration-base disabled:opacity-50"
            >
              {resending ? '再送信中...' : '確認コードを再送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
