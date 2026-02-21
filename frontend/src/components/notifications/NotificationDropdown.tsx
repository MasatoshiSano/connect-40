import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { useNotificationStore } from '../../stores/notification';
import type { NotificationType } from '../../stores/notification';

interface NotificationDropdownProps {
  onClose: () => void;
}

const typeIconMap: Record<NotificationType, string> = {
  activity_reminder: 'event',
  new_message: 'chat',
  activity_joined: 'group_add',
  new_review: 'rate_review',
  badge_earned: 'emoji_events',
  system: 'info',
};

const formatTimeAgo = (dateStr: string): string => {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'たった今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間前`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}日前`;

  return new Date(dateStr).toLocaleDateString('ja-JP');
};

export const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    if (link) {
      navigate(link);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 max-h-[480px] bg-elevated-light dark:bg-elevated-dark shadow-lg border border-border-light dark:border-border-dark z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
        <h3 className="font-serif font-light tracking-wide text-text-primary dark:text-text-dark-primary text-sm">
          通知
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-gold hover:text-gold/80 transition-colors duration-base"
          >
            すべて既読
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Icon name="notifications_none" size="lg" className="text-text-secondary dark:text-text-dark-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary dark:text-text-dark-muted font-light">
              通知はありません
            </p>
          </div>
        ) : (
          notifications.slice(0, 20).map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id, notification.link)}
              className={`w-full px-4 py-3 text-left flex items-start gap-3 border-b border-border-light dark:border-border-dark/50 hover:bg-gold/5 transition-colors duration-base ${
                !notification.read ? 'bg-gold/5' : ''
              }`}
            >
              <div className="shrink-0 mt-0.5">
                <Icon
                  name={typeIconMap[notification.type]}
                  size="sm"
                  className={notification.read ? 'text-text-secondary dark:text-text-dark-muted' : 'text-gold'}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-light ${notification.read ? 'text-text-secondary dark:text-text-dark-secondary' : 'text-text-primary dark:text-text-dark-primary'}`}>
                  {notification.title}
                </p>
                <p className="text-xs text-text-secondary dark:text-text-dark-muted mt-0.5 truncate">
                  {notification.message}
                </p>
                <p className="text-xs text-text-secondary dark:text-text-dark-muted mt-1">
                  {formatTimeAgo(notification.createdAt)}
                </p>
              </div>
              {!notification.read && (
                <div className="shrink-0 w-2 h-2 bg-gold mt-1.5" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
