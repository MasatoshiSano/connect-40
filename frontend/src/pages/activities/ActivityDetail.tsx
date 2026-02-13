import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { ACTIVITY_CATEGORIES } from '../../constants/activities';
import { useAuthStore } from '../../stores/auth';
import type { Activity } from '../../types/activity';

export const ActivityDetail = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const loadActivity = async () => {
      if (!activityId) {
        setError('アクティビティが見つかりません');
        setIsLoading(false);
        return;
      }

      try {
        // TODO: Fetch activity from API
        // const { getActivity } = await import('../../services/api');
        // const data = await getActivity(activityId);
        // setActivity(data);

        // Mock delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setError('アクティビティが見つかりません（API未実装）');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'アクティビティの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadActivity();
  }, [activityId]);

  const handleJoin = async () => {
    if (!activity) return;

    setIsJoining(true);
    try {
      // TODO: Join activity API call
      // const { joinActivity } = await import('../../services/api');
      // await joinActivity(activity.activityId);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Reload activity data
    } catch (err) {
      setError(err instanceof Error ? err.message : '参加申込に失敗しました');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen flex items-center justify-center">
          <Icon name="sync" size="xl" className="text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !activity) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon name="error" size="xl" className="text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {error || 'アクティビティが見つかりません'}
                </h2>
                <button
                  onClick={() => navigate('/activities')}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold"
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

  const category = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);
  const activityDate = new Date(activity.dateTime);
  const isHost = user?.userId === activity.hostUserId;
  const isParticipant = activity.participants.includes(user?.userId || '');
  const isFull = activity.currentParticipants >= activity.maxParticipants;
  const canJoin = !isHost && !isParticipant && !isFull && activity.status === 'upcoming';

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

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate('/activities')}
              className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              <Icon name="arrow_back" size="sm" />
              <span>一覧に戻る</span>
            </button>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-lg overflow-hidden">
              {/* Image */}
              {activity.imageUrl ? (
                <div className="h-96 overflow-hidden">
                  <img
                    src={activity.imageUrl}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`h-96 ${category?.color || 'bg-gray-400'} flex items-center justify-center`}>
                  <Icon name={category?.icon || 'event'} size="xl" className="text-white opacity-50" />
                </div>
              )}

              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${category?.color || 'bg-gray-500'}`}>
                        {category?.name || activity.category}
                      </span>
                      {isFull && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          満員
                        </span>
                      )}
                      {isParticipant && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                          参加中
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {activity.title}
                    </h1>
                  </div>

                  {isHost && (
                    <button
                      onClick={() => navigate(`/activities/${activity.activityId}/edit`)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium flex items-center gap-2"
                    >
                      <Icon name="edit" size="sm" />
                      編集
                    </button>
                  )}
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    詳細
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {activity.description}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        日時
                      </h3>
                      <div className="flex items-start gap-2">
                        <Icon name="schedule" className="text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{dateStr}</p>
                          <p className="text-gray-600 dark:text-gray-400">{timeStr}〜 ({durationStr})</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        場所
                      </h3>
                      <div className="flex items-start gap-2">
                        <Icon name="location_on" className="text-gray-600 dark:text-gray-400 mt-0.5" />
                        <p className="text-gray-900 dark:text-white">{activity.location.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        参加者
                      </h3>
                      <div className="flex items-center gap-2">
                        <Icon name="group" className="text-gray-600 dark:text-gray-400" />
                        <p className="text-gray-900 dark:text-white font-medium">
                          {activity.currentParticipants}/{activity.maxParticipants}人
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        主催者
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <Icon name="person" className="text-primary" />
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {activity.hostNickname}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {activity.tags && activity.tags.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      タグ
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {activity.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Map Placeholder */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    地図
                  </h3>
                  <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="map" size="xl" className="text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        地図表示は後ほど実装されます
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {canJoin && (
                  <button
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isJoining ? (
                      <>
                        <Icon name="sync" className="animate-spin" />
                        参加申込中...
                      </>
                    ) : (
                      <>
                        <Icon name="check" />
                        このアクティビティに参加する
                      </>
                    )}
                  </button>
                )}

                {isParticipant && !isHost && (
                  <button
                    className="w-full py-4 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <Icon name="cancel" />
                    参加をキャンセル
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
