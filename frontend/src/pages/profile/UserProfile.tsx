import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { useAuthStore } from '../../stores/auth';

interface PublicProfile {
  userId: string;
  nickname: string;
  age: number;
  bio: string;
  interests: string[];
  profilePhoto: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const UserProfile = () => {
  const { userId: targetUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { userId: myUserId } = useAuthStore();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Redirect to own profile edit if viewing self
  useEffect(() => {
    if (targetUserId && targetUserId === myUserId) {
      navigate('/profile/edit', { replace: true });
    }
  }, [targetUserId, myUserId, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!targetUserId) {
        setError('ユーザーが見つかりません');
        setIsLoading(false);
        return;
      }

      try {
        const { getUserPublicProfile } = await import('../../services/api');
        const data = await getUserPublicProfile(targetUserId);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'プロフィールの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [targetUserId]);

  const handleBlock = async () => {
    if (!targetUserId) return;
    setActionLoading(true);
    try {
      const { blockUser } = await import('../../services/api');
      await blockUser(targetUserId);
      setShowBlockConfirm(false);
      setActionMessage('ユーザーをブロックしました');
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ブロックに失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReport = async () => {
    if (!targetUserId || !reportReason.trim()) return;
    setActionLoading(true);
    try {
      const { reportUser } = await import('../../services/api');
      await reportUser(targetUserId, reportReason.trim());
      setShowReportModal(false);
      setReportReason('');
      setActionMessage('報告を送信しました。ご協力ありがとうございます。');
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '報告の送信に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen flex items-center justify-center">
          <Icon name="sync" size="xl" className="text-gold animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error && !profile) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-base-50 dark:bg-base py-8">
          <div className="container mx-auto px-4 text-center py-20">
            <div className="w-20 h-20 bg-red-900/30 flex items-center justify-center mx-auto mb-6">
              <Icon name="error" size="xl" className="text-red-400" />
            </div>
            <h2 className="text-xl font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-3">
              {error}
            </h2>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light"
            >
              戻る
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) return null;

  const memberSince = new Date(profile.createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-base-50 dark:bg-base py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="mb-6 flex items-center gap-2 text-text-secondary dark:text-text-secondary dark:text-text-dark-secondary hover:text-gold transition-all duration-base ease-elegant"
            >
              <Icon name="arrow_back" size="sm" />
              <span>戻る</span>
            </button>

            {/* Action Message */}
            {actionMessage && (
              <div className="mb-6 p-4 bg-green-subtle/10 border border-green-subtle/30">
                <div className="flex items-center gap-3">
                  <Icon name="check_circle" className="text-green-subtle" />
                  <p className="text-sm text-green-subtle">{actionMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/10 border border-red-800/30">
                <div className="flex items-center gap-3">
                  <Icon name="error" className="text-red-400" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark overflow-hidden">
              {/* Profile Header */}
              <div className="p-8 flex flex-col items-center text-center">
                {/* Profile Photo */}
                <div className="w-28 h-28 mb-6 overflow-hidden border-2 border-gold/30">
                  {profile.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt={profile.nickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-elevated-light dark:bg-elevated-dark flex items-center justify-center">
                      <Icon name="person" size="xl" className="text-gold/40" />
                    </div>
                  )}
                </div>

                {/* Name and Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-primary dark:text-text-dark-primary">
                    {profile.nickname}
                  </h1>
                  {profile.verificationStatus === 'approved' && (
                    <Icon name="verified" className="text-gold" />
                  )}
                </div>

                {/* Age and Member Since */}
                <div className="flex items-center gap-4 text-text-secondary dark:text-text-secondary dark:text-text-dark-secondary text-sm mb-4">
                  <span>{profile.age}歳</span>
                  <span className="text-border-dark">|</span>
                  <span>{memberSince}から利用</span>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-text-secondary dark:text-text-secondary dark:text-text-dark-secondary max-w-md leading-relaxed mb-6">
                    {profile.bio}
                  </p>
                )}

                {/* Interests */}
                {profile.interests.length > 0 && (
                  <div className="mb-6 w-full">
                    <h3 className="text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-muted uppercase mb-3">
                      興味・関心
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {profile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 border border-gold/20 text-gold text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-border-light dark:border-border-dark p-6 flex gap-3 justify-center">
                <button
                  onClick={() => setShowBlockConfirm(true)}
                  className="px-4 py-2 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-warm hover:text-warm transition-all duration-base ease-elegant text-sm flex items-center gap-2"
                >
                  <Icon name="block" size="sm" />
                  ブロック
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-warm hover:text-warm transition-all duration-base ease-elegant text-sm flex items-center gap-2"
                >
                  <Icon name="flag" size="sm" />
                  報告
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Block Confirmation Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark max-w-md w-full p-8">
            <h2 className="text-lg font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-4">
              ユーザーをブロック
            </h2>
            <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
              {profile.nickname}さんをブロックしますか？ブロックすると、このユーザーからのメッセージや活動への参加通知が表示されなくなります。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBlockConfirm(false)}
                disabled={actionLoading}
                className="px-4 py-2 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 transition-all duration-base ease-elegant"
              >
                キャンセル
              </button>
              <button
                onClick={handleBlock}
                disabled={actionLoading}
                className="px-4 py-2 border border-warm text-warm hover:bg-warm/10 transition-all duration-base ease-elegant disabled:opacity-50"
              >
                {actionLoading ? 'ブロック中...' : 'ブロックする'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark max-w-md w-full p-8">
            <h2 className="text-lg font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-4">
              ユーザーを報告
            </h2>
            <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
              {profile.nickname}さんについて、問題のある行為を報告してください。
            </p>
            <label className="block text-xs text-text-secondary dark:text-text-dark-secondary tracking-ryokan-wide uppercase mb-2">
              報告理由
            </label>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full bg-transparent border border-border-light dark:border-border-dark focus:border-gold focus:outline-none text-text-primary dark:text-text-dark-primary p-3 mb-1 resize-none transition-colors duration-fast"
              placeholder="具体的な理由を記載してください..."
            />
            <p className="text-xs text-text-secondary dark:text-text-dark-muted mb-6 text-right">
              {reportReason.length}/1000
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 transition-all duration-base ease-elegant"
              >
                キャンセル
              </button>
              <button
                onClick={handleReport}
                disabled={actionLoading || !reportReason.trim()}
                className="px-4 py-2 border border-warm text-warm hover:bg-warm/10 transition-all duration-base ease-elegant disabled:opacity-50"
              >
                {actionLoading ? '送信中...' : '報告する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
