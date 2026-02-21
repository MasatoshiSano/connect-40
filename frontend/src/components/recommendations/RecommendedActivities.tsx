import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { ACTIVITY_CATEGORIES } from '../../constants/activities';

interface RecommendedActivity {
  activityId: string;
  title: string;
  category: string;
  dateTime: string;
  location: { latitude: number; longitude: number; address: string };
  hostNickname: string;
  imageUrl?: string;
  tags: string[];
  currentParticipants: number;
  maxParticipants: number;
  score: number;
}

interface RecommendedActivitiesProps {
  activities: RecommendedActivity[];
  isLoading: boolean;
}

export const RecommendedActivities = ({ activities, isLoading }: RecommendedActivitiesProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon name="sync" size="lg" className="text-gold animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="recommend" className="text-gold" />
        <h2 className="text-xl font-light tracking-ryokan text-text-primary dark:text-text-dark-primary">
          おすすめアクティビティ
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {activities.map((activity) => {
          const category = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);
          const date = new Date(activity.dateTime);

          return (
            <button
              key={activity.activityId}
              onClick={() => navigate(`/activities/${activity.activityId}`)}
              className="flex-shrink-0 w-64 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-gold/40 transition-all duration-base text-left"
            >
              {activity.imageUrl ? (
                <div className="h-32 overflow-hidden">
                  <img
                    src={activity.imageUrl}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-32 bg-elevated-light dark:bg-elevated-dark flex items-center justify-center">
                  <Icon name={category?.icon || 'event'} size="xl" className="text-gold/30" />
                </div>
              )}
              <div className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs border border-gold/20 text-gold px-2 py-0.5">
                    {category?.name || activity.category}
                  </span>
                </div>
                <h3 className="text-sm font-light text-text-primary dark:text-text-dark-primary line-clamp-2 mb-2">
                  {activity.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-text-secondary dark:text-text-dark-muted">
                  <Icon name="schedule" size="sm" />
                  <span>
                    {date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-secondary dark:text-text-dark-muted mt-1">
                  <Icon name="group" size="sm" />
                  <span>{activity.currentParticipants}/{activity.maxParticipants}人</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
