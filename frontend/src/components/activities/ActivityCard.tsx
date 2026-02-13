import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { ACTIVITY_CATEGORIES } from '../../constants/activities';
import type { Activity } from '../../types/activity';

interface ActivityCardProps {
  activity: Activity;
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const navigate = useNavigate();

  const category = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);
  const activityDate = new Date(activity.dateTime);
  const now = new Date();
  const isUpcoming = activityDate > now;
  const isFull = activity.currentParticipants >= activity.maxParticipants;

  // Format date
  const dateStr = activityDate.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
  const timeStr = activityDate.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Format duration
  const hours = Math.floor(activity.duration / 60);
  const minutes = activity.duration % 60;
  const durationStr = hours > 0 ? `${hours}時間${minutes > 0 ? minutes + '分' : ''}` : `${minutes}分`;

  const handleClick = () => {
    navigate(`/activities/${activity.activityId}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-surface-dark rounded-xl shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
    >
      {/* Image */}
      {activity.imageUrl ? (
        <div className="h-48 overflow-hidden">
          <img
            src={activity.imageUrl}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`h-48 ${category?.color || 'bg-gray-400'} flex items-center justify-center`}>
          <Icon name={category?.icon || 'event'} size="xl" className="text-white opacity-50" />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Category Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${category?.color || 'bg-gray-500'}`}>
            {category?.name || activity.category}
          </span>
          {isFull && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              満員
            </span>
          )}
          {activity.status === 'cancelled' && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              キャンセル
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {activity.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {activity.description}
        </p>

        {/* Meta Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Icon name="schedule" size="sm" />
            <span>{dateStr} {timeStr} ({durationStr})</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Icon name="location_on" size="sm" />
            <span className="truncate">{activity.location.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Icon name="group" size="sm" />
            <span>
              {activity.currentParticipants}/{activity.maxParticipants}人
            </span>
          </div>
        </div>

        {/* Host */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <Icon name="person" size="sm" className="text-primary" />
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            主催: {activity.hostNickname}
          </span>
        </div>

        {/* Tags */}
        {activity.tags && activity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {activity.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
