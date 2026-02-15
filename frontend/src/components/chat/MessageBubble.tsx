import { type Message } from '../../stores/chat';
import { useAuthStore } from '../../stores/auth';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const { userId } = useAuthStore();
  const isMine = message.senderId === userId;

  const time = new Date(message.createdAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isRead = message.readBy.length > 1; // More than just the sender

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isMine
              ? 'bg-primary text-white rounded-br-sm'
              : 'bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100 rounded-bl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{time}</span>
          {isMine && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isRead ? '既読' : '未読'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
