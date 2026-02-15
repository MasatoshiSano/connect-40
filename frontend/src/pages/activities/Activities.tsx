import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { ActivityCard } from '../../components/activities/ActivityCard';
import type { Activity } from '../../types/activity';

export const Activities = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const { getActivities } = await import('../../services/api');
        const data = await getActivities();
        setActivities(data.activities);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'アクティビティの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, []);

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                アクティビティ
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                近くで開催されるアクティビティを探そう
              </p>
            </div>
            <button
              onClick={() => navigate('/activities/create')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold flex items-center gap-2"
            >
              <Icon name="add" size="sm" />
              作成
            </button>
          </div>

          {/* Filter Bar - Placeholder for Task 3.5 */}
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4">
              <Icon name="filter_list" className="text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                フィルター機能は後ほど実装されます
              </span>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-start gap-3">
                <Icon name="error" className="text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                    エラーが発生しました
                  </p>
                  <p className="text-sm text-red-500 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Icon name="sync" size="xl" className="text-primary animate-spin" />
            </div>
          )}

          {/* Activities Grid */}
          {!isLoading && !error && activities.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => (
                <ActivityCard key={activity.activityId} activity={activity} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && activities.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="event_busy" size="xl" className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                アクティビティが見つかりませんでした
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                新しいアクティビティを作成して、仲間を募集しましょう
              </p>
              <button
                onClick={() => navigate('/activities/create')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold inline-flex items-center gap-2"
              >
                <Icon name="add" size="sm" />
                アクティビティを作成
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
