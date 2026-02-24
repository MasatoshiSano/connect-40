import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Icon } from '../components/ui/Icon';
import { ActivityCard } from '../components/activities/ActivityCard';
import { BadgeGrid } from '../components/badges/BadgeGrid';
import { BadgeLoginPopup } from '../components/badges/BadgeLoginPopup';
import { RecommendedActivities } from '../components/recommendations/RecommendedActivities';
import { RecommendedUsers } from '../components/recommendations/RecommendedUsers';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';
import type { Activity } from '../types/activity';
import type { UserProfile } from '../services/api';
import { BADGES, getEarnedBadges } from '../constants/badges';
import type { UserStats } from '../constants/badges';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { userId, nickname } = useAuthStore();
  const chatCredits = useAuthStore((state) => state.chatCredits);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hostedActivities, setHostedActivities] = useState<Activity[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendedActivities, setRecommendedActivities] = useState<{
    activityId: string; title: string; category: string; dateTime: string;
    location: { latitude: number; longitude: number; address: string };
    hostNickname: string; imageUrl?: string; tags: string[];
    currentParticipants: number; maxParticipants: number; score: number;
  }[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<{
    userId: string; nickname: string; profilePhoto: string;
    interests: string[]; matchScore: number;
  }[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { getUserProfile, getActivities, getRecommendations } = await import('../services/api');

        // Parallelize all API calls instead of awaiting them sequentially
        const [profileResult, activitiesResult, recommendationsResult] = await Promise.allSettled([
          getUserProfile(),
          userId ? getActivities() : Promise.resolve(null),
          getRecommendations(),
        ]);

        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value);
        } else {
          console.error('Failed to load profile:', profileResult.reason);
        }

        if (activitiesResult.status === 'fulfilled' && activitiesResult.value && userId) {
          const { activities } = activitiesResult.value;
          setHostedActivities(activities.filter((a) => a.hostUserId === userId));
          setJoinedActivities(
            activities.filter((a) => a.participants.includes(userId) && a.hostUserId !== userId)
          );
        } else if (activitiesResult.status === 'rejected') {
          console.error('Failed to load activities:', activitiesResult.reason);
        }

        if (recommendationsResult.status === 'fulfilled') {
          setRecommendedActivities(recommendationsResult.value.recommendedActivities);
          setRecommendedUsers(recommendationsResult.value.recommendedUsers);
        } else {
          console.error('Failed to load recommendations:', recommendationsResult.reason);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
        setIsRecommendationsLoading(false);
      }
    };

    loadDashboardData();
  }, [userId]);

  const handleOpenPortal = async () => {
    if (profile?.membershipTier !== 'premium') {
      navigate('/subscription/plans');
      return;
    }
    setIsPortalLoading(true);
    try {
      const { createPortalSession } = await import('../services/payment');
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      console.error('Failed to open portal:', err);
      setIsPortalLoading(false);
    }
  };

  const chatRooms = useChatStore((state) => state.rooms);

  const userStats: UserStats = useMemo(() => {
    const daysSinceRegistration = profile?.createdAt
      ? Math.floor(
          (Date.now() - new Date(profile.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const totalParticipants = hostedActivities.reduce(
      (sum, a) => sum + (a.participants?.length || 0),
      0
    );

    return {
      activitiesJoined: joinedActivities.length,
      activitiesHosted: hostedActivities.length,
      totalParticipants,
      reviewsWritten: 0,
      chatRooms: chatRooms.length,
      daysSinceRegistration,
    };
  }, [joinedActivities, hostedActivities, chatRooms, profile]);

  const reminderActivities = useMemo(() => {
    const REMINDER_STORAGE_KEY = 'connect40_reminders';
    try {
      const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
      const reminders: Record<string, boolean> = stored ? JSON.parse(stored) : {};
      const enabledIds = Object.keys(reminders).filter((id) => reminders[id]);
      if (enabledIds.length === 0) return [];
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const allActivities = [...hostedActivities, ...joinedActivities];
      return allActivities.filter(
        (a) =>
          enabledIds.includes(a.activityId) &&
          new Date(a.dateTime) > now &&
          new Date(a.dateTime) <= in24h
      );
    } catch {
      return [];
    }
  }, [hostedActivities, joinedActivities]);

  if (isLoading) {
    return (
      <Layout isAuthenticated={true}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Icon name="sync" size="xl" className="text-gold animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isAuthenticated={true}>
      {userId && (
        <BadgeLoginPopup
          userStats={userStats}
          userId={userId}
          nickname={nickname ?? ''}
        />
      )}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-ryokan mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary">
                    ダッシュボード
                  </h1>
                  {profile?.membershipTier === 'premium' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gold/10 border border-gold/30 text-gold text-sm">
                      <Icon name="workspace_premium" size="sm" />
                      プレミアム
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted text-sm">
                      無料プラン
                    </span>
                  )}
                </div>
                <p className="text-text-secondary dark:text-text-dark-secondary">
                  {nickname}さん、お帰りなさい
                </p>
              </div>
              <button
                onClick={handleOpenPortal}
                disabled={isPortalLoading}
                className="px-4 py-2 border border-gold/30 text-gold text-sm hover:bg-gold/10 transition-all duration-base ease-elegant flex items-center gap-2 disabled:opacity-50"
              >
                {isPortalLoading ? (
                  <Icon name="sync" size="sm" className="animate-spin" />
                ) : (
                  <Icon name="credit_card" size="sm" />
                )}
                プラン管理
              </button>
            </div>
          </div>

          {/* Activity Reminder Banner (Feature 5) */}
          {reminderActivities.length > 0 && (
            <div className="mb-8 space-y-3">
              {reminderActivities.map((a) => {
                const time = new Date(a.dateTime).toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={a.activityId}
                    onClick={() => navigate(`/activities/${a.activityId}`)}
                    className="p-4 bg-gold/10 border border-gold/30 cursor-pointer hover:bg-gold/15 transition-all duration-base ease-elegant"
                  >
                    <div className="flex items-center gap-3">
                      <Icon name="notifications_active" className="text-gold" />
                      <div className="flex-1">
                        <p className="text-sm font-light text-text-primary dark:text-text-dark-primary">
                          明日のアクティビティ: {a.title} @ {time}
                        </p>
                      </div>
                      <Icon name="chevron_right" size="sm" className="text-gold" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chat Credits */}
          {profile?.membershipTier !== 'premium' && chatCredits !== null && (
            <div className="mb-8 p-4 border border-border-light dark:border-border-dark">
              <h3 className="text-sm font-light text-text-secondary dark:text-text-dark-muted mb-2">チャット残り回数</h3>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-light text-gold">{chatCredits}</span>
                <span className="text-sm text-text-secondary dark:text-text-dark-muted">回</span>
              </div>
              <p className="text-xs text-text-secondary dark:text-text-dark-muted mt-1">
                毎日3回 · アクティビティ参加で+20回
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-1">主催中</p>
                  <p className="text-3xl font-serif font-light text-gold">
                    {hostedActivities.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gold/10 flex items-center justify-center">
                  <Icon name="event" size="lg" className="text-gold" />
                </div>
              </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-1">参加予定</p>
                  <p className="text-3xl font-serif font-light text-gold">
                    {joinedActivities.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gold/10 flex items-center justify-center">
                  <Icon name="group" size="lg" className="text-gold" />
                </div>
              </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-1">興味・関心</p>
                  <p className="text-3xl font-serif font-light text-gold">
                    {profile?.interests.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gold/10 flex items-center justify-center">
                  <Icon name="favorite" size="lg" className="text-gold" />
                </div>
              </div>
            </div>
          </div>

          {/* Hosted Activities */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light tracking-ryokan text-text-primary dark:text-text-dark-primary">
                主催中のアクティビティ
              </h2>
              <button
                onClick={() => navigate('/activities/create')}
                className="px-4 py-2 text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light flex items-center gap-2"
              >
                <Icon name="add" size="sm" />
                新規作成
              </button>
            </div>

            {hostedActivities.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8">
                {hostedActivities.slice(0, 4).map((activity) => (
                  <ActivityCard key={activity.activityId} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-12 text-center">
                <Icon name="event_busy" size="xl" className="text-text-muted mb-4 mx-auto" />
                <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
                  まだアクティビティを主催していません
                </p>
                <button
                  onClick={() => navigate('/activities/create')}
                  className="px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light inline-flex items-center gap-2"
                >
                  <Icon name="add" size="sm" />
                  アクティビティを作成
                </button>
              </div>
            )}
          </div>

          {/* Joined Activities */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light tracking-ryokan text-text-primary dark:text-text-dark-primary">参加予定</h2>
              <button
                onClick={() => navigate('/activities')}
                className="px-4 py-2 text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light"
              >
                すべて見る
              </button>
            </div>

            {joinedActivities.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8">
                {joinedActivities.slice(0, 4).map((activity) => (
                  <ActivityCard key={activity.activityId} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-12 text-center">
                <Icon name="search" size="xl" className="text-text-muted mb-4 mx-auto" />
                <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
                  まだアクティビティに参加していません
                </p>
                <button
                  onClick={() => navigate('/activities')}
                  className="px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light inline-flex items-center gap-2"
                >
                  <Icon name="search" size="sm" />
                  アクティビティを探す
                </button>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="mb-12">
            <RecommendedActivities activities={recommendedActivities} isLoading={isRecommendationsLoading} />
          </div>

          <div className="mb-12">
            <RecommendedUsers users={recommendedUsers} isLoading={isRecommendationsLoading} />
          </div>

          {/* Badges */}
          <div>
            <h2 className="text-xl font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-4">
              バッジ
            </h2>

            {/* Badge status message */}
            {(() => {
              const earnedBadges = getEarnedBadges(userStats);
              const badgeCount = earnedBadges.length;
              const statusMessages = [
                { min: 0, message: '最初のバッジを獲得しよう！アクティビティに参加してみましょう' },
                { min: 1, message: 'コミュニティの第一歩を踏み出しました！' },
                { min: 3, message: '常連メンバーとして認められています！' },
                { min: 5, message: 'コミュニティリーダーです！おめでとうございます！' },
              ];
              const statusMessage = [...statusMessages].reverse().find(s => badgeCount >= s.min)?.message;
              const earnedIds = new Set(earnedBadges.map(b => b.id));
              const unearnedBadges = BADGES.filter(b => !earnedIds.has(b.id));
              const nextBadge = unearnedBadges[0];

              return (
                <div className="mb-4 p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="emoji_events" size="sm" className="text-gold" />
                    <p className="text-sm font-light text-text-primary dark:text-text-dark-primary">
                      {badgeCount} / {BADGES.length} バッジ獲得
                    </p>
                  </div>
                  {statusMessage && (
                    <p className="text-xs text-gold font-light mb-2">{statusMessage}</p>
                  )}
                  {nextBadge && (
                    <p className="text-xs text-text-secondary dark:text-text-dark-muted font-light">
                      次のバッジまで: {nextBadge.name} — {nextBadge.description}
                    </p>
                  )}
                </div>
              );
            })()}

            <BadgeGrid stats={userStats} />
          </div>
        </div>
      </div>
    </Layout>
  );
};
