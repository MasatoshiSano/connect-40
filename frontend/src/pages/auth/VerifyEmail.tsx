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
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark px-4">
        <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="check_circle" size="xl" className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            メール確認完了！
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            アカウントが有効化されました。ログインしてプロフィールを作成しましょう。
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold"
          >
            ログインページへ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark px-4">
      <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Icon name="mark_email_read" size="xl" className="text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            メール確認
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            登録したメールアドレスに送信された6桁の確認コードを入力してください
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="error" className="text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              {...register('email')}
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              確認コード
            </label>
            <input
              type="text"
              {...register('code')}
              maxLength={6}
              autoComplete="one-time-code"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
              placeholder="000000"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.code.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '確認中...' : 'メールを確認'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {resending ? '再送信中...' : '確認コードを再送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
