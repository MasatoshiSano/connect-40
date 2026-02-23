import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { ActivityCard } from '../../components/activities/ActivityCard';
import { ActivitiesMap } from '../../components/map/ActivitiesMap';
import type { Activity, ActivityCategory } from '../../types/activity';

type DateFilter = 'all' | 'today' | 'week' | 'month';

const RADIUS_OPTIONS = [1, 3, 5, 10, 20, 50] as const;
type RadiusKm = typeof RADIUS_OPTIONS[number];
const DEFAULT_RADIUS: RadiusKm = 5;

export const Activities = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState<RadiusKm>(DEFAULT_RADIUS);
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const loadActivities = useCallback(async (location?: { latitude: number; longitude: number }, radius?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const { getActivities } = await import('../../services/api');
      const params = location && radius !== undefined
        ? { radius, latitude: location.latitude, longitude: location.longitude }
        : undefined;
      const data = await getActivities(params);
      setActivities(data.activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アクティビティの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (nearbyEnabled && myLocation) {
      loadActivities(myLocation, nearbyRadius);
    } else {
      loadActivities();
    }
  }, [nearbyEnabled, myLocation, nearbyRadius, loadActivities]);

  const handleNearbyToggle = () => {
    if (!nearbyEnabled) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setNearbyEnabled(true);
          setIsGettingLocation(false);
        },
        () => {
          setIsGettingLocation(false);
        }
      );
    } else {
      setNearbyEnabled(false);
    }
  };

  // Filter activities based on current filter settings
  const filteredActivities = useMemo(() => activities.filter((activity) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.tags.some((tag) => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && activity.category !== selectedCategory) {
      return false;
    }

    // Date filter
    if (dateFilter !== 'all') {
      const activityDate = new Date(activity.dateTime);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (dateFilter === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (activityDate < today || activityDate >= tomorrow) return false;
      } else if (dateFilter === 'week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        if (activityDate < today || activityDate >= nextWeek) return false;
      } else if (dateFilter === 'month') {
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        if (activityDate < today || activityDate >= nextMonth) return false;
      }
    }

    // Available only filter
    if (showAvailableOnly) {
      if (activity.currentParticipants >= activity.maxParticipants) return false;
    }

    return true;
  }), [activities, searchQuery, selectedCategory, dateFilter, showAvailableOnly]);

  const categoryLabels: Record<ActivityCategory | 'all', string> = {
    all: 'すべて',
    sports: 'スポーツ',
    outdoor: 'アウトドア',
    hobby: '趣味',
    food: '食事',
    culture: '文化',
    business: 'ビジネス',
    other: 'その他',
  };

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-base-50 dark:bg-base py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-ryokan mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="text-xs tracking-ryokan-wide text-gold uppercase mb-2">ACTIVITIES</p>
                <h1 className="text-3xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-2">
                  アクティビティ
                </h1>
                <p className="text-text-secondary dark:text-text-dark-secondary">
                  近くで開催されるアクティビティを探そう
                </p>
              </div>
              <button
                onClick={() => navigate('/activities/create')}
                className="px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light flex items-center gap-2"
              >
                <Icon name="add" size="sm" />
                作成
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 mb-8">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="アクティビティを検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-transparent border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                  />
                  <Icon
                    name="search"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="grid md:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    カテゴリー
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ActivityCategory | 'all')}
                    className="w-full px-4 py-2.5 bg-transparent border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                  >
                    {(Object.keys(categoryLabels) as Array<ActivityCategory | 'all'>).map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    期間
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    className="w-full px-4 py-2.5 bg-transparent border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary"
                  >
                    <option value="all">すべて</option>
                    <option value="today">今日</option>
                    <option value="week">今週</option>
                    <option value="month">今月</option>
                  </select>
                </div>

                {/* Nearby Radius Filter */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    近所
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNearbyToggle}
                      disabled={isGettingLocation}
                      className={`flex items-center gap-1 px-4 py-2.5 border-b text-sm font-light transition-all duration-base ease-elegant ${
                        nearbyEnabled
                          ? 'border-gold text-gold'
                          : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40'
                      }`}
                    >
                      <Icon name="near_me" size="sm" />
                      {isGettingLocation ? '取得中...' : nearbyEnabled ? 'ON' : 'OFF'}
                    </button>
                    {nearbyEnabled && (
                      <select
                        value={nearbyRadius}
                        onChange={(e) => setNearbyRadius(Number(e.target.value) as RadiusKm)}
                        className="px-2 py-2.5 bg-transparent border-b border-gold border-t-0 border-l-0 border-r-0 focus:outline-none text-gold text-sm font-light cursor-pointer"
                      >
                        {RADIUS_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}km
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Available Only */}
                <div>
                  <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase mb-2">
                    参加可能
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2.5 border-b border-border-light dark:border-border-dark cursor-pointer hover:border-gold/40 transition-all duration-base ease-elegant">
                    <input
                      type="checkbox"
                      checked={showAvailableOnly}
                      onChange={(e) => setShowAvailableOnly(e.target.checked)}
                      className="w-5 h-5 text-gold border-border-light dark:border-border-dark focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm text-text-secondary dark:text-text-dark-secondary">空きありのみ</span>
                  </label>
                </div>
              </div>

              {/* Results count & Map Toggle */}
              <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark flex items-center justify-between">
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  {filteredActivities.length}件のアクティビティが見つかりました
                </p>
                <button
                  onClick={() => setShowMap((prev) => !prev)}
                  className={`px-4 py-2 border text-sm font-light flex items-center gap-2 transition-all duration-base ease-elegant ${
                    showMap
                      ? 'border-gold text-gold bg-gold/10'
                      : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40'
                  }`}
                >
                  <Icon name={showMap ? 'view_list' : 'map'} size="sm" />
                  {showMap ? 'リストで見る' : '地図で見る'}
                </button>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <Icon name="error" className="text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm font-light text-red-600 dark:text-red-400 mb-1">
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
                <Icon name="sync" size="xl" className="text-gold animate-spin" />
              </div>
            )}

            {/* Map View (Feature 9) */}
            {!isLoading && !error && showMap && filteredActivities.length > 0 && (
              <div className="mb-8">
                <ActivitiesMap activities={filteredActivities} />
              </div>
            )}

            {/* Activities Grid */}
            {!isLoading && !error && !showMap && filteredActivities.length > 0 && (
              <div className="grid md:grid-cols-2 gap-8">
                {filteredActivities.map((activity) => (
                  <ActivityCard key={activity.activityId} activity={activity} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && activities.length > 0 && filteredActivities.length === 0 && (
              <div className="text-center py-24">
                <div className="w-20 h-20 bg-elevated-light dark:bg-elevated-dark flex items-center justify-center mx-auto mb-6">
                  <Icon name="search_off" size="xl" className="text-text-muted" />
                </div>
                <h2 className="text-xl font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-3">
                  条件に合うアクティビティが見つかりませんでした
                </h2>
                <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
                  フィルターを変更して再度お試しください
                </p>
              </div>
            )}

            {/* No Activities at All */}
            {!isLoading && !error && activities.length === 0 && (
              <div className="text-center py-24">
                <div className="w-20 h-20 bg-elevated-light dark:bg-elevated-dark flex items-center justify-center mx-auto mb-6">
                  <Icon name="event_busy" size="xl" className="text-text-muted" />
                </div>
                <h2 className="text-xl font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-3">
                  アクティビティが見つかりませんでした
                </h2>
                <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
                  新しいアクティビティを作成して、仲間を募集しましょう
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
        </div>
      </div>
    </Layout>
  );
};
