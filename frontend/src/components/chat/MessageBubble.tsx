import { memo } from 'react';
import { type Message } from '../../stores/chat';
import { useAuthStore } from '../../stores/auth';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = memo(({ message }: MessageBubbleProps) => {
  const userId = useAuthStore((state) => state.userId);

  // System message
  if (message.messageType === 'system' || message.senderId === 'system') {
    return (
      <div className="flex justify-center mb-4">
        <span className="border-b border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted text-xs py-2 px-4">
          {message.content}
        </span>
      </div>
    );
  }

  const isMine = message.senderId === userId;

  const time = new Date(message.createdAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isRead = message.readBy.length > 1;

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2 ${
            isMine
              ? 'bg-elevated-light dark:bg-elevated-dark text-text-primary dark:text-text-dark-primary'
              : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-primary dark:text-text-dark-primary'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-text-muted dark:text-text-dark-muted">{time}</span>
          {isMine && (
            <span className="text-xs text-text-muted dark:text-text-dark-muted">
              {isRead ? '既読' : '未読'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
