import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType =
  | 'activity_reminder'
  | 'new_message'
  | 'activity_joined'
  | 'new_review'
  | 'badge_earned'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      getUnreadCount: () =>
        get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);

export const notify = (
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) => {
  useNotificationStore.getState().addNotification({
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    title,
    message,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  });
};
