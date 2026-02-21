import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { useAuthStore } from '../../stores/auth';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  externalMessage?: string;
  onExternalMessageConsumed?: () => void;
}

export const MessageInput = ({ onSend, disabled = false, externalMessage, onExternalMessageConsumed }: MessageInputProps) => {
  const verificationStatus = useAuthStore((state) => state.verificationStatus);
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (externalMessage) {
      setMessage(externalMessage);
      onExternalMessageConsumed?.();
      textareaRef.current?.focus();
    }
  }, [externalMessage, onExternalMessageConsumed]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (verificationStatus !== 'approved') {
    return (
      <div className="p-4 border-t border-border-light dark:border-border-dark">
        <div className="flex items-center gap-3 p-3 bg-gold/5 border border-gold/20">
          <Icon name="lock" className="text-gold flex-shrink-0" />
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
            チャットを利用するには{' '}
            <Link to="/profile/verification" className="text-gold underline underline-offset-2">
              本人確認
            </Link>
            {' '}が必要です
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border-dark p-4 bg-base-800">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          disabled={disabled}
          className="flex-1 resize-none min-h-[44px] max-h-[120px] px-4 py-2 border-b border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-dark-primary disabled:opacity-50"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="h-11 w-11 flex items-center justify-center bg-transparent border border-gold text-gold hover:bg-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-base ease-elegant"
        >
          <Icon name="send" size="md" />
        </button>
      </div>
      <p className="text-xs text-text-dark-muted mt-2">
        Enter で送信、Shift + Enter で改行
      </p>
    </div>
  );
};
