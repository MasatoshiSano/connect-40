import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { ACTIVITY_CATEGORIES, RECURRENCE_LABELS } from '../../constants/activities';
import { ActivityMap } from '../../components/map/ActivityMap';
import { ReviewForm } from '../../components/activities/ReviewForm';
import { ReviewList } from '../../components/activities/ReviewList';
import { PhotoGallery } from '../../components/activities/PhotoGallery';
import { useAuthStore } from '../../stores/auth';
import { notify } from '../../stores/notification';
import type { Activity, Review } from '../../types/activity';

const REMINDER_STORAGE_KEY = 'connect40_reminders';

const getReminderPreference = (activityId: string): boolean => {
  try {
    const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!stored) return false;
    const reminders = JSON.parse(stored) as Record<string, boolean>;
    return reminders[activityId] === true;
  } catch {
    return false;
  }
};

const setReminderPreference = (activityId: string, enabled: boolean) => {
  try {
    const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
    const reminders: Record<string, boolean> = stored ? JSON.parse(stored) : {};
    if (enabled) {
      reminders[activityId] = true;
    } else {
      delete reminders[activityId];
    }
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders));
  } catch {
    // localStorage may be unavailable
  }
};

export const ActivityDetail = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { userId, idToken } = useAuthStore();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // Load activity data
  useEffect(() => {
    const loadActivity = async () => {
      if (!activityId) {
        setError('アクティビティが見つかりません');
        setIsLoading(false);
        return;
      }

      try {
        const { getActivity } = await import('../../services/api');
        const data = await getActivity(activityId);
        setActivity(data);
        setReminderEnabled(getReminderPreference(activityId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'アクティビティの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadActivity();
  }, [activityId]);

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!activityId) return;
      try {
        const { getReviews } = await import('../../services/api');
        const data = await getReviews(activityId);
        setReviews(data.reviews);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    loadReviews();
  }, [activityId]);

  const handleToggleReminder = useCallback(() => {
    if (!activityId) return;
    const newValue = !reminderEnabled;
    setReminderEnabled(newValue);
    setReminderPreference(activityId, newValue);
  }, [activityId, reminderEnabled]);

  const handleJoin = async () => {
    if (!activity || !activityId) return;

    setIsJoining(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 有料アクティビティの場合は Stripe Checkout へリダイレクト
      if (activity.entryFee && activity.entryFee > 0) {
        const email = idToken
          ? (JSON.parse(atob(idToken.split('.')[1])) as { email?: string }).email ?? ''
          : '';
        if (!email) {
          setError('メールアドレスの取得に失敗しました');
          setIsJoining(false);
          return;
        }
        const { createActivityJoinCheckout } = await import('../../services/api');
        const { url } = await createActivityJoinCheckout(activityId, email);
        window.location.href = url;
        return;
      }

      const { joinActivity, getActivity } = await import('../../services/api');
      const result = await joinActivity(activity.activityId);

      if (result.chatRoomId) {
        setChatRoomId(result.chatRoomId);
      }

      const updatedActivity = await getActivity(activityId);
      setActivity(updatedActivity);
      setSuccessMessage('アクティビティへの参加が完了しました！');

      notify(
        'activity_joined',
        'アクティビティに参加しました',
        `「${activity.title}」への参加が完了しました`,
        result.chatRoomId ? `/chat/${result.chatRoomId}` : `/activities/${activityId}`
      );

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '参加申込に失敗しました');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!activity || !activityId) return;

    setError(null);

    try {
      const { leaveActivity, getActivity } = await import('../../services/api');
      await leaveActivity(activity.activityId);

      const updatedActivity = await getActivity(activityId);
      setActivity(updatedActivity);
      setChatRoomId(null);
      setSuccessMessage('アクティビティから退出しました');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '退出に失敗しました');
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!activityId) return;
    const { createReview } = await import('../../services/api');
    const review = await createReview(activityId, rating, comment);
    setReviews((prev) => [review, ...prev]);
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

  if (error && !activity) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                  <Icon name="error" size="xl" className="text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-3">
                  {error || 'アクティビティが見つかりません'}
                </h2>
                <button
                  onClick={() => navigate('/activities')}
                  className="px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light"
                >
                  一覧に戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!activity) return null;

  const category = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);
  const activityDate = new Date(activity.dateTime);
  const isHost = userId === activity.hostUserId;
  const isParticipant = activity.participants.includes(userId || '');
  const isFull = activity.currentParticipants >= activity.maxParticipants;
  const canJoin = !isHost && !isParticipant && !isFull && activity.status === 'upcoming';
  const isJoinedOrHost = isParticipant || isHost;
  const isCompleted = activity.status === 'completed';
  const hasUserReviewed = reviews.some((r) => r.userId === userId);
  const canReview = isJoinedOrHost && isCompleted && !hasUserReviewed;

  // Format date
  const dateStr = activityDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  const timeStr = activityDate.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Format duration
  const hours = Math.floor(activity.duration / 60);
  const minutes = activity.duration % 60;
  const durationStr = hours > 0 ? `${hours}時間${minutes > 0 ? minutes + '分' : ''}` : `${minutes}分`;

  // RSVP progress
  const rsvpPercentage = Math.round(
    (activity.currentParticipants / activity.maxParticipants) * 100
  );

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate('/activities')}
              className="mb-6 flex items-center gap-2 text-text-secondary dark:text-text-dark-secondary hover:text-gold transition-all duration-base ease-elegant"
            >
              <Icon name="arrow_back" size="sm" />
              <span>一覧に戻る</span>
            </button>

            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark overflow-hidden">
              {/* Image */}
              {activity.imageUrl ? (
                <div className="h-64 md:h-96 overflow-hidden">
                  <img
                    src={activity.imageUrl}
                    alt={activity.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-64 md:h-96 bg-elevated-dark flex items-center justify-center">
                  <Icon name={category?.icon || 'event'} size="xl" className="text-gold/30" />
                </div>
              )}

              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="border border-gold/30 text-gold text-sm px-3 py-1">
                        {category?.name || activity.category}
                      </span>
                      {activity.recurrence && activity.recurrence !== 'none' && (
                        <span className="border border-green-subtle/30 text-green-subtle text-sm px-3 py-1">
                          {RECURRENCE_LABELS[activity.recurrence]}
                        </span>
                      )}
                      {isHost && (
                        <span className="border border-gold/30 text-gold text-sm px-3 py-1">
                          主催者
                        </span>
                      )}
                      {isFull && (
                        <span className="border border-warm/30 text-warm text-sm px-3 py-1">
                          満員
                        </span>
                      )}
                      {isParticipant && !isHost && (
                        <span className="border border-green-subtle/30 text-green-subtle text-sm px-3 py-1">
                          参加中
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-2">
                      {activity.title}
                    </h1>
                  </div>

                  {isHost && (
                    <button
                      onClick={() => navigate(`/activities/${activity.activityId}/edit`)}
                      className="px-4 py-2 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 transition-all duration-base ease-elegant font-light flex items-center gap-2"
                    >
                      <Icon name="edit" size="sm" />
                      編集
                    </button>
                  )}
                </div>

                {/* RSVP Status Section (Feature 5) */}
                <div className="mb-8 p-6 border border-border-dark">
                  <h3 className="text-xs tracking-ryokan-wide text-text-dark-muted uppercase mb-3">
                    参加状況
                  </h3>
                  <div className="flex items-center gap-4 mb-3">
                    <Icon name="group" size="lg" className="text-gold" />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-serif font-light text-gold">
                          {activity.currentParticipants}
                        </span>
                        <span className="text-text-dark-muted">
                          / {activity.maxParticipants}人
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-border-dark mt-2">
                        <div
                          className="h-full bg-gold transition-all duration-base ease-elegant"
                          style={{ width: `${Math.min(rsvpPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-text-dark-muted">
                      {isFull ? '満員' : `残り${activity.maxParticipants - activity.currentParticipants}席`}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-lg font-light text-text-primary dark:text-text-dark-primary mb-3">
                    詳細
                  </h2>
                  <p className="text-text-secondary dark:text-text-dark-secondary whitespace-pre-wrap">
                    {activity.description}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs tracking-ryokan-wide text-text-dark-muted uppercase mb-2">
                        日時
                      </h3>
                      <div className="flex items-start gap-2">
                        <Icon name="schedule" className="text-gold mt-0.5" />
                        <div>
                          <p className="text-text-primary dark:text-text-dark-primary font-light">{dateStr}</p>
                          <p className="text-text-secondary dark:text-text-dark-secondary">{timeStr}〜 ({durationStr})</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs tracking-ryokan-wide text-text-dark-muted uppercase mb-2">
                        場所
                      </h3>
                      <div className="flex items-start gap-2">
                        <Icon name="location_on" className="text-gold mt-0.5" />
                        <p className="text-text-primary dark:text-text-dark-primary">{activity.location?.address || '場所未設定'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs tracking-ryokan-wide text-text-dark-muted uppercase mb-2">
                        主催者
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gold/10 flex items-center justify-center">
                          <Icon name="person" className="text-gold" />
                        </div>
                        <p className="text-text-primary dark:text-text-dark-primary font-light">
                          {activity.hostNickname}
                        </p>
                      </div>
                    </div>

                    {activity.recurrence && activity.recurrence !== 'none' && (
                      <div>
                        <h3 className="text-xs tracking-ryokan-wide text-text-dark-muted uppercase mb-2">
                          繰り返し
                        </h3>
                        <div className="flex items-center gap-2">
                          <Icon name="repeat" className="text-gold" />
                          <p className="text-text-primary dark:text-text-dark-primary font-light">
                            {RECURRENCE_LABELS[activity.recurrence]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {activity.tags && activity.tags.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs tracking-ryokan-wide text-text-dark-muted uppercase mb-3">
                      タグ
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {activity.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 border border-gold/20 text-gold text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Map (Feature 9) */}
                <div className="mb-8">
                  <h3 className="text-xs tracking-ryokan-wide text-text-dark-muted uppercase mb-3">
                    地図
                  </h3>
                  {activity.location && activity.location.latitude && activity.location.longitude ? (
                    <ActivityMap location={activity.location} title={activity.title} />
                  ) : (
                    <div className="h-64 bg-elevated-dark flex items-center justify-center">
                      <div className="text-center">
                        <Icon name="map" size="xl" className="text-text-muted mx-auto mb-2" />
                        <p className="text-sm text-text-muted dark:text-text-dark-muted">
                          位置情報がありません
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo Gallery (Feature 11) */}
                <div className="mb-8">
                  <PhotoGallery
                    activityId={activity.activityId}
                    isParticipant={isJoinedOrHost}
                  />
                </div>

                {/* Reminder Toggle (Feature 5) */}
                {isJoinedOrHost && activity.status === 'upcoming' && (
                  <div className="mb-8 p-4 border border-border-dark flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon
                        name={reminderEnabled ? 'notifications_active' : 'notifications_none'}
                        className={reminderEnabled ? 'text-gold' : 'text-text-dark-muted'}
                      />
                      <div>
                        <p className="text-sm text-text-dark-primary font-light">
                          リマインダー設定
                        </p>
                        <p className="text-xs text-text-dark-muted">
                          開催24時間前にダッシュボードで通知します
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleReminder}
                      className={`relative w-12 h-6 transition-colors duration-base ease-elegant ${
                        reminderEnabled ? 'bg-gold' : 'bg-border-dark'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white transition-transform duration-base ease-elegant ${
                          reminderEnabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="mb-6 p-4 bg-green-subtle/10 border border-green-subtle/30">
                    <div className="flex items-start gap-3">
                      <Icon name="check_circle" className="text-green-subtle" />
                      <div className="flex-1">
                        <p className="text-sm text-green-subtle font-light">
                          {successMessage}
                        </p>
                        <p className="text-xs text-green-subtle/70 mt-1">
                          チャットページで他の参加者とコミュニケーションできます
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/chat')}
                        className="px-3 py-1 border border-green-subtle text-green-subtle text-sm hover:bg-green-subtle/10 transition-all duration-base ease-elegant"
                      >
                        チャットへ
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-900/10 border border-red-800/30">
                    <div className="flex items-start gap-3">
                      <Icon name="error" className="text-red-600 dark:text-red-400" />
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {/* Entry fee display */}
                {activity.entryFee && activity.entryFee > 0 && (
                  <div className="mb-4 p-4 border border-gold/20 bg-gold/5 flex items-center gap-3">
                    <Icon name="payments" className="text-gold" />
                    <div>
                      <p className="text-sm text-gold font-light">入場料</p>
                      <p className="text-lg font-serif text-gold">
                        ¥{activity.entryFee.toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {canJoin && (
                  <button
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="w-full py-4 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isJoining ? (
                      <>
                        <Icon name="sync" className="animate-spin" />
                        {activity.entryFee && activity.entryFee > 0 ? '決済ページに移動中...' : '参加申込中...'}
                      </>
                    ) : activity.entryFee && activity.entryFee > 0 ? (
                      <>
                        <Icon name="payment" />
                        ¥{activity.entryFee.toLocaleString('ja-JP')}を支払って参加する
                      </>
                    ) : (
                      <>
                        <Icon name="check" />
                        このアクティビティに参加する
                      </>
                    )}
                  </button>
                )}

                {isJoinedOrHost && (
                  <div className="space-y-3 mt-6">
                    <button
                      onClick={() => {
                        if (chatRoomId) {
                          navigate(`/chat/${chatRoomId}`);
                        } else {
                          navigate('/chat');
                        }
                      }}
                      className="w-full py-4 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light flex items-center justify-center gap-2"
                    >
                      <Icon name="chat_bubble" />
                      グループチャットを開く
                    </button>

                    {isParticipant && !isHost && (
                      <button
                        onClick={handleLeave}
                        className="w-full py-4 border border-warm/30 text-warm hover:bg-warm/10 transition-all duration-base ease-elegant font-light flex items-center justify-center gap-2"
                      >
                        <Icon name="cancel" />
                        参加をキャンセル
                      </button>
                    )}
                  </div>
                )}

                {/* Reviews Section (Feature 8) */}
                <div className="mt-8 pt-8 border-t border-border-dark">
                  <h2 className="text-lg font-light text-text-primary dark:text-text-dark-primary mb-6">
                    レビュー
                  </h2>

                  {canReview && (
                    <div className="mb-8 p-6 border border-border-dark">
                      <h3 className="text-sm font-light text-text-dark-primary mb-4">
                        レビューを投稿
                      </h3>
                      <ReviewForm
                        activityId={activity.activityId}
                        onSubmit={handleSubmitReview}
                      />
                    </div>
                  )}

                  <ReviewList reviews={reviews} isLoading={isLoadingReviews} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
