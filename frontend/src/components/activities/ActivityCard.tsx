import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { ACTIVITY_CATEGORIES, RECURRENCE_LABELS } from '../../constants/activities';
import { fetchActivityPhoto } from '../../utils/activityPhoto';
import type { Activity } from '../../types/activity';

interface ActivityCardProps {
  activity: Activity;
}

export const ActivityCard = memo(({ activity }: ActivityCardProps) => {
  const navigate = useNavigate();
  const [autoPhotoUrl, setAutoPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!activity.imageUrl && activity.category) {
      fetchActivityPhoto(activity.category).then((url) => {
        if (url) setAutoPhotoUrl(url);
      });
    }
  }, [activity.imageUrl, activity.category]);

  const displayImageUrl = activity.imageUrl || autoPhotoUrl;

  const category = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);
  const activityDate = new Date(activity.dateTime);
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
      className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-gold/40 hover:-translate-y-0.5 transition-all duration-base ease-elegant cursor-pointer overflow-hidden"
    >
      {/* Image */}
      {displayImageUrl ? (
        <div className="h-48 overflow-hidden">
          <img
            src={displayImageUrl}
            alt={activity.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-48 bg-elevated-light dark:bg-elevated-dark flex items-center justify-center">
          <Icon name={category?.icon || 'event'} size="xl" className="text-gold/30" />
        </div>
      )}

      {/* Content */}
      <div className="p-8">
        {/* Category Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="border border-gold/30 text-gold text-xs px-3 py-1">
            {category?.name || activity.category}
          </span>
          {activity.recurrence && activity.recurrence !== 'none' && (
            <span className="border border-green-subtle/30 text-green-subtle text-xs px-3 py-1">
              {RECURRENCE_LABELS[activity.recurrence]}
            </span>
          )}
          {isFull && (
            <span className="border border-warm/30 text-warm text-xs px-3 py-1">
              満員
            </span>
          )}
          {activity.status === 'cancelled' && (
            <span className="border border-text-secondary/30 text-text-secondary dark:border-text-dark-muted/30 dark:text-text-dark-muted text-xs px-3 py-1">
              キャンセル
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-serif font-light tracking-wide text-text-primary dark:text-text-dark-primary mb-2 line-clamp-2">
          {activity.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4 line-clamp-2">
          {activity.description}
        </p>

        {/* Meta Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-dark-secondary">
            <Icon name="schedule" size="sm" />
            <span>{dateStr} {timeStr} ({durationStr})</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-dark-secondary">
            <Icon name="location_on" size="sm" />
            <span className="truncate">{activity.location?.address || '場所未設定'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-dark-secondary">
            <Icon name="group" size="sm" />
            <span>
              {activity.currentParticipants}/{activity.maxParticipants}人
            </span>
          </div>
        </div>

        {/* Host */}
        <div className="flex items-center gap-2 pt-4 border-t border-border-light dark:border-border-dark">
          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
            <Icon name="person" size="sm" className="text-gold" />
          </div>
          <span className="text-sm text-text-secondary dark:text-text-dark-secondary">
            主催: {activity.hostNickname}
          </span>
        </div>

        {/* Tags */}
        {activity.tags && activity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {activity.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="border border-border-light dark:border-border-dark text-xs px-2 py-1 text-text-secondary dark:text-text-dark-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
