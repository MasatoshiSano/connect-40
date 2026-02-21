import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { useAuthStore } from '../../stores/auth';
import { getVerificationStatus, createVerificationCheckout } from '../../services/api';
import type { VerificationStatus } from '../../services/api';

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/dev';

interface JwtPayload {
  email: string;
  sub: string;
}

interface PresignedUrlResponse {
  data?: {
    presignedUrl: string;
    publicUrl: string;
  };
}

export const VerificationPage = () => {
  const { idToken } = useAuthStore();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    getVerificationStatus().then(setStatus).catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setDocumentUrl(null);
  };

  const handleUpload = async () => {
    if (!file || !idToken) return;
    setUploading(true);
    setError(null);
    try {
      const presignedRes = await fetch(`${API_BASE_URL}/uploads/presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, uploadType: 'verification' }),
      });
      if (!presignedRes.ok) throw new Error('Failed to get upload URL');
      const presignedData = await presignedRes.json() as PresignedUrlResponse;
      const { presignedUrl, publicUrl } = presignedData.data!;
      await fetch(presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setDocumentUrl(publicUrl);
    } catch {
      setError('アップロードに失敗しました。もう一度お試しください。');
    } finally {
      setUploading(false);
    }
  };

  const handlePayment = async () => {
    if (!documentUrl || !idToken) return;
    setIsProcessing(true);
    setError(null);
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1])) as JwtPayload;
      const { url } = await createVerificationCheckout({ documentUrl, email: payload.email });
      window.location.href = url;
    } catch {
      setError('決済の開始に失敗しました。もう一度お試しください。');
      setIsProcessing(false);
    }
  };

  const renderStatusBadge = () => {
    if (!status) return null;
    switch (status.status) {
      case 'approved':
        return (
          <div className="text-center py-16">
            <Icon name="verified" className="!text-[64px] text-gold mx-auto mb-4 block" />
            <h2 className="font-serif text-2xl font-light text-text-primary dark:text-text-dark-primary mb-2">本人確認済み</h2>
            <p className="text-text-secondary dark:text-text-dark-secondary">チャット機能をご利用いただけます</p>
            <Link to="/dashboard" className="inline-block mt-8 px-8 py-3 border border-gold text-gold hover:bg-gold/10 transition">
              ダッシュボードへ
            </Link>
          </div>
        );
      case 'pending':
        return (
          <div className="text-center py-16">
            <Icon name="hourglass_empty" className="!text-[64px] text-gold mx-auto mb-4 block" />
            <h2 className="font-serif text-2xl font-light text-text-primary dark:text-text-dark-primary mb-2">審査中</h2>
            <p className="text-text-secondary dark:text-text-dark-secondary">通常2〜3営業日で審査が完了します</p>
          </div>
        );
      case 'payment_pending':
        return (
          <div className="text-center py-16">
            <Icon name="schedule" className="!text-[64px] text-gold mx-auto mb-4 block" />
            <h2 className="font-serif text-2xl font-light text-text-primary dark:text-text-dark-primary mb-2">決済待ち</h2>
            <p className="text-text-secondary dark:text-text-dark-secondary">Stripeでの支払いが完了していません</p>
          </div>
        );
      case 'rejected':
        return (
          <div className="text-center py-16">
            <Icon name="cancel" className="!text-[64px] text-red-400 mx-auto mb-4 block" />
            <h2 className="font-serif text-2xl font-light text-text-primary dark:text-text-dark-primary mb-2">審査却下</h2>
            {status.reviewNote && (
              <p className="text-text-secondary dark:text-text-dark-secondary mb-4">{status.reviewNote}</p>
            )}
            <p className="text-sm text-text-muted dark:text-text-dark-muted">再度お申し込みいただけます</p>
          </div>
        );
      default:
        return null;
    }
  };

  const showForm = !status || status.status === 'unverified' || status.status === 'rejected';

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <span className="section-label">IDENTITY VERIFICATION</span>
            <h1 className="font-serif font-light text-3xl tracking-ryokan mt-2 text-text-primary dark:text-text-dark-primary">
              本人確認
            </h1>
            <p className="mt-4 text-text-secondary dark:text-text-dark-secondary leading-loose">
              本人確認を完了すると、チャット機能が利用可能になります。
              <br />審査手数料は1,000円（一回限り）です。
            </p>
          </div>

          {renderStatusBadge()}

          {showForm && (
            <div>
              {/* ステップ1: 書類アップロード */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-serif font-light text-gold/30">01</span>
                  <h3 className="font-serif text-lg font-light text-text-primary dark:text-text-dark-primary">身分証をアップロード</h3>
                </div>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
                  運転免許証・マイナンバーカード・パスポートのいずれかの写真またはPDF
                </p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-sm text-text-secondary dark:text-text-dark-secondary file:mr-4 file:py-2 file:px-4 file:border file:border-gold/40 file:text-gold file:bg-transparent file:cursor-pointer"
                />
                {file && !documentUrl && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="mt-3 px-6 py-2 text-sm border border-gold text-gold hover:bg-gold/10 transition disabled:opacity-50"
                  >
                    {uploading ? 'アップロード中...' : 'アップロードする'}
                  </button>
                )}
                {documentUrl && (
                  <p className="mt-2 text-sm text-green-subtle flex items-center gap-1">
                    <Icon name="check_circle" />
                    アップロード完了
                  </p>
                )}
              </div>

              {/* ステップ2: 支払い */}
              <div className="border-t border-border-light dark:border-border-dark pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-serif font-light text-gold/30">02</span>
                  <h3 className="font-serif text-lg font-light text-text-primary dark:text-text-dark-primary">審査手数料を支払う</h3>
                </div>
                <div className="mb-6 p-4 bg-gold/5 border border-gold/20 inline-block">
                  <p className="text-3xl font-serif text-gold">¥1,000</p>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">一回限り・クレジットカード払い</p>
                </div>
                <button
                  onClick={handlePayment}
                  disabled={!documentUrl || isProcessing}
                  className="block w-full py-4 border border-gold text-gold hover:bg-gold/10 transition font-light tracking-ryokan disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '処理中...' : '本人確認を申請する（¥1,000）'}
                </button>
                {!documentUrl && (
                  <p className="mt-2 text-xs text-text-muted dark:text-text-dark-muted">
                    先に身分証をアップロードしてください
                  </p>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-900/10 border border-red-800/30">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
