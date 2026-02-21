import { memo } from 'react';
import { type Message } from '../../stores/chat';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  senderNickname?: string;
  senderPhoto?: string;
}

export const MessageBubble = memo(({ message, isMine, senderNickname, senderPhoto }: MessageBubbleProps) => {
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

  const time = new Date(message.createdAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isRead = message.readBy.length > 1;

  if (!isMine) {
    return (
      <div className="flex justify-start mb-4">
        <div className="flex items-end gap-2">
          {/* アバター */}
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-gold/20">
            {senderPhoto ? (
              <img src={senderPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-gold font-medium">
                {senderNickname?.[0] ?? '?'}
              </span>
            )}
          </div>
          <div className="max-w-[70%] flex flex-col items-start">
            <p className="text-xs text-text-secondary dark:text-text-dark-muted mb-1">{senderNickname}</p>
            <div className="px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-primary dark:text-text-dark-primary">
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 px-2">
              <span className="text-xs text-text-muted dark:text-text-dark-muted">{time}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[70%] items-end flex flex-col">
        <div className="px-4 py-2 bg-elevated-light dark:bg-elevated-dark text-text-primary dark:text-text-dark-primary">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-text-muted dark:text-text-dark-muted">{time}</span>
          <span className="text-xs text-text-muted dark:text-text-dark-muted">
            {isRead ? '既読' : '未読'}
          </span>
        </div>
      </div>
    </div>
  );
});
