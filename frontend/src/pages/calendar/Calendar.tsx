import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { ACTIVITY_CATEGORIES } from '../../constants/activities';
import type { Activity } from '../../types/activity';

type ViewMode = 'monthly' | 'weekly';

const CATEGORY_COLORS: Record<string, string> = {
  sports: 'bg-blue-500',
  outdoor: 'bg-green-500',
  hobby: 'bg-purple-500',
  food: 'bg-orange-500',
  culture: 'bg-pink-500',
  business: 'bg-indigo-500',
  other: 'bg-gray-500',
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: daysInPrevMonth - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: i, month, year, isCurrentMonth: true });
  }

  // Next month leading days
  const remaining = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  return days;
};

const getWeekDays = (baseDate: Date) => {
  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const days: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    days.push({
      date: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      isCurrentMonth: d.getMonth() === baseDate.getMonth(),
    });
  }
  return days;
};

export const Calendar = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const { getActivities } = await import('../../services/api');
        const { activities: data } = await getActivities();
        setActivities(data);
      } catch (err) {
        console.error('Failed to load activities:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadActivities();
  }, []);

  const activityMap = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const activity of activities) {
      if (!activity.dateTime) continue;
      const dateKey = activity.dateTime.split('T')[0];
      const existing = map.get(dateKey) || [];
      existing.push(activity);
      map.set(dateKey, existing);
    }
    return map;
  }, [activities]);

  const days = useMemo(() => {
    if (viewMode === 'monthly') {
      return getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
    }
    return getWeekDays(currentDate);
  }, [currentDate, viewMode]);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'monthly') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setDate(newDate.getDate() + direction * 7);
    }
    setCurrentDate(newDate);
  };

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const selectedActivities = selectedDate ? activityMap.get(selectedDate) || [] : [];

  const monthLabel = currentDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  });

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
      <div className="min-h-screen bg-base-50 dark:bg-base py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary">
                カレンダー
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-3 py-1 text-sm border transition-all duration-base ${
                    viewMode === 'monthly'
                      ? 'border-gold text-gold bg-gold/10'
                      : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted hover:border-gold/40'
                  }`}
                >
                  月
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-3 py-1 text-sm border transition-all duration-base ${
                    viewMode === 'weekly'
                      ? 'border-gold text-gold bg-gold/10'
                      : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted hover:border-gold/40'
                  }`}
                >
                  週
                </button>
              </div>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors"
              >
                <Icon name="chevron_left" />
              </button>
              <h2 className="text-lg font-light text-text-primary dark:text-text-dark-primary">
                {monthLabel}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors"
              >
                <Icon name="chevron_right" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark mb-6">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-border-light dark:border-border-dark">
                {WEEKDAYS.map((day, idx) => (
                  <div
                    key={day}
                    className={`p-2 text-center text-xs tracking-ryokan-wide uppercase ${
                      idx === 0 ? 'text-warm' : idx === 6 ? 'text-blue-400' : 'text-text-secondary dark:text-text-dark-muted'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {days.map((day, idx) => {
                  const dateKey = `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;
                  const dayActivities = activityMap.get(dateKey) || [];
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === selectedDate;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
                      className={`min-h-[60px] md:min-h-[80px] p-1 border-b border-r border-border-light dark:border-border-dark text-left transition-all duration-base ${
                        !day.isCurrentMonth ? 'opacity-30' : ''
                      } ${isSelected ? 'bg-gold/10' : 'hover:bg-gold/5'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm inline-flex items-center justify-center w-6 h-6 ${
                            isToday
                              ? 'bg-gold text-base font-medium'
                              : 'text-text-primary dark:text-text-dark-primary'
                          }`}
                        >
                          {day.date}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {dayActivities.slice(0, 3).map((act) => (
                          <span
                            key={act.activityId}
                            className={`w-2 h-2 ${CATEGORY_COLORS[act.category] || 'bg-gray-500'}`}
                            title={act.title}
                          />
                        ))}
                        {dayActivities.length > 3 && (
                          <span className="text-[10px] text-text-dark-muted">
                            +{dayActivities.length - 3}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category legend */}
            <div className="flex flex-wrap gap-3 mb-6">
              {ACTIVITY_CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex items-center gap-1">
                  <span className={`w-3 h-3 ${CATEGORY_COLORS[cat.id] || 'bg-gray-500'}`} />
                  <span className="text-xs text-text-secondary dark:text-text-dark-muted">{cat.name}</span>
                </div>
              ))}
            </div>

            {/* Selected date activities */}
            {selectedDate && (
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6">
                <h3 className="text-lg font-light text-text-primary dark:text-text-dark-primary mb-4">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                </h3>

                {selectedActivities.length > 0 ? (
                  <div className="space-y-3">
                    {selectedActivities.map((activity) => {
                      const category = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);
                      const time = new Date(activity.dateTime).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <button
                          key={activity.activityId}
                          onClick={() => navigate(`/activities/${activity.activityId}`)}
                          className="w-full flex items-center gap-4 p-3 border border-border-light dark:border-border-dark hover:border-gold/40 transition-all duration-base text-left"
                        >
                          <span className={`w-3 h-full min-h-[40px] ${CATEGORY_COLORS[activity.category] || 'bg-gray-500'}`} />
                          <div className="flex-1">
                            <h4 className="text-sm font-light text-text-primary dark:text-text-dark-primary">
                              {activity.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary dark:text-text-dark-muted">
                              <span className="flex items-center gap-1">
                                <Icon name="schedule" size="sm" />
                                {time}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon name="location_on" size="sm" />
                                {activity.location?.address || '未設定'}
                              </span>
                              <span className="border border-gold/20 text-gold px-2 py-0.5">
                                {category?.name || activity.category}
                              </span>
                            </div>
                          </div>
                          <Icon name="chevron_right" className="text-text-secondary dark:text-text-dark-muted" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary dark:text-text-dark-muted text-center py-4">
                    この日のアクティビティはありません
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
