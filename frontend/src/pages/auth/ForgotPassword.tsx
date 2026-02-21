import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPassword, confirmPassword } from '../../services/auth';
import { Icon } from '../../components/ui/Icon';

const emailSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

const resetSchema = z.object({
  code: z.string().min(1, '確認コードを入力してください'),
  newPassword: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/[A-Z]/, '大文字を1文字以上含めてください')
    .regex(/[a-z]/, '小文字を1文字以上含めてください')
    .regex(/[0-9]/, '数字を1文字以上含めてください'),
  confirmNewPassword: z.string().min(1, 'パスワードの確認を入力してください'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmNewPassword'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

export const ForgotPassword = () => {
  const [step, setStep] = useState<'email' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onEmailSubmit = async (data: EmailFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await forgotPassword(data.email);
      setEmail(data.email);
      setStep('reset');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '確認コードの送信に失敗しました'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResetSubmit = async (data: ResetFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await confirmPassword(email, data.code, data.newPassword);
      setStep('success');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'パスワードの再設定に失敗しました'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-50 dark:bg-base px-4">
      <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-10 md:p-12">
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-serif font-light text-gold tracking-ryokan-brand">
              Connect40
            </h1>
          </div>
          <h2 className="text-xl font-light text-text-primary dark:text-text-dark-primary tracking-ryokan mb-2">
            {step === 'success' ? 'パスワード再設定完了' : 'パスワードの再設定'}
          </h2>
          <p className="text-text-secondary dark:text-text-dark-secondary">
            {step === 'email' && '登録したメールアドレスに確認コードを送信します'}
            {step === 'reset' && `${email} に確認コードを送信しました`}
            {step === 'success' && '新しいパスワードでログインできます'}
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

        {/* Step 1: Email Input */}
        {step === 'email' && (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs text-text-secondary dark:text-text-dark-secondary tracking-ryokan-wide uppercase mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                {...emailForm.register('email')}
                autoComplete="email"
                className="w-full py-3 bg-transparent border-b border-border-light dark:border-border-dark focus:border-b-gold focus:outline-none text-text-primary dark:text-text-dark-primary placeholder:text-text-secondary dark:text-text-dark-muted transition-colors duration-fast"
                placeholder="email@example.com"
              />
              {emailForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-400">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base font-light tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '送信中...' : '確認コードを送信'}
            </button>
          </form>
        )}

        {/* Step 2: Code + New Password */}
        {step === 'reset' && (
          <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs text-text-secondary dark:text-text-dark-secondary tracking-ryokan-wide uppercase mb-2">
                確認コード
              </label>
              <input
                type="text"
                {...resetForm.register('code')}
                autoComplete="one-time-code"
                className="w-full py-3 bg-transparent border-b border-border-light dark:border-border-dark focus:border-b-gold focus:outline-none text-text-primary dark:text-text-dark-primary placeholder:text-text-secondary dark:text-text-dark-muted transition-colors duration-fast"
                placeholder="確認コードを入力"
              />
              {resetForm.formState.errors.code && (
                <p className="mt-1 text-sm text-red-400">
                  {resetForm.formState.errors.code.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-text-secondary dark:text-text-dark-secondary tracking-ryokan-wide uppercase mb-2">
                新しいパスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...resetForm.register('newPassword')}
                  autoComplete="new-password"
                  className="w-full py-3 pr-12 bg-transparent border-b border-border-light dark:border-border-dark focus:border-b-gold focus:outline-none text-text-primary dark:text-text-dark-primary placeholder:text-text-secondary dark:text-text-dark-muted transition-colors duration-fast"
                  placeholder="新しいパスワード"
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
              {resetForm.formState.errors.newPassword && (
                <p className="mt-1 text-sm text-red-400">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-text-secondary dark:text-text-dark-secondary tracking-ryokan-wide uppercase mb-2">
                新しいパスワード（確認）
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                {...resetForm.register('confirmNewPassword')}
                autoComplete="new-password"
                className="w-full py-3 bg-transparent border-b border-border-light dark:border-border-dark focus:border-b-gold focus:outline-none text-text-primary dark:text-text-dark-primary placeholder:text-text-secondary dark:text-text-dark-muted transition-colors duration-fast"
                placeholder="パスワードを再入力"
              />
              {resetForm.formState.errors.confirmNewPassword && (
                <p className="mt-1 text-sm text-red-400">
                  {resetForm.formState.errors.confirmNewPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base font-light tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '再設定中...' : 'パスワードを再設定'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError(null);
                resetForm.reset();
              }}
              className="w-full text-sm text-text-secondary dark:text-text-dark-secondary hover:text-gold transition-colors duration-base"
            >
              メールアドレスを変更する
            </button>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-subtle/10 border border-green-subtle/30 flex items-center justify-center mx-auto mb-6">
              <Icon name="check_circle" size="xl" className="text-green-subtle" />
            </div>
            <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
              パスワードが正常に再設定されました。新しいパスワードでログインしてください。
            </p>
            <a
              href="/login"
              className="inline-block w-full py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base font-light tracking-wide text-center"
            >
              ログインページへ
            </a>
          </div>
        )}

        {step !== 'success' && (
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-text-secondary dark:text-text-dark-secondary hover:text-gold transition-colors duration-base text-sm"
            >
              ログインに戻る
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
