import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInput } from '../../components/chat/MessageInput';
import { ConversationStarters } from '../../components/chat/ConversationStarters';
import { useChatStore } from '../../stores/chat';
import { useAuthStore } from '../../stores/auth';
import { notify } from '../../stores/notification';
import { getWebSocketService } from '../../services/websocket';

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/dev';
const WS_URL = import.meta.env.VITE_WEBSOCKET_ENDPOINT || 'ws://localhost:3001';

export const ChatRoom = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();
  const { idToken } = useAuthStore();
  const { currentRoom, messages, setCurrentRoom, setMessages, addMessage, removeMessage, setConnected } =
    useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | undefined>(undefined);
  const [showStarters, setShowStarters] = useState<boolean>(() => {
    const saved = localStorage.getItem('showConversationStarters');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hiddenAtRef = useRef<number | null>(null);

  const handleConversationStarterSelect = useCallback((topic: string) => {
    setPendingMessage(topic);
  }, []);

  const handleExternalMessageConsumed = useCallback(() => {
    setPendingMessage(undefined);
  }, []);

  useEffect(() => {
    if (!chatRoomId) return;

    const loadChatRoom = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/chat/rooms/${chatRoomId}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load chat room');
        }

        const { data } = await response.json();
        setCurrentRoom(data);
        setMessages(data.messages || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chat room');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatRoom();
  }, [chatRoomId, idToken, setCurrentRoom, setMessages]);

  useEffect(() => {
    if (!chatRoomId) return;

    const wsService = getWebSocketService(WS_URL, () => idToken);

    wsService
      .connect()
      .then(() => {
        setConnected(true);
      })
      .catch((error) => {
        console.error('WebSocket connection failed:', error);
        setError('リアルタイム接続に失敗しました');
      });

    const unsubscribe = wsService.onMessage((message) => {
      if (message.type === 'message' && message.data && typeof message.data === 'object') {
        const data = message.data as Record<string, unknown>;
        if (data.chatRoomId === chatRoomId) {
          addMessage({
            messageId: data.messageId as string,
            chatRoomId: data.chatRoomId as string,
            senderId: data.senderId as string,
            content: data.content as string,
            messageType: (data.messageType === 'system' ? 'system' : 'user'),
            createdAt: data.createdAt as string,
            readBy: (data.readBy as string[]) || [],
            timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
          });

          // Notify for messages from others
          const currentUserId = useAuthStore.getState().userId;
          if (data.senderId !== currentUserId && data.messageType !== 'system') {
            const content = typeof data.content === 'string' ? data.content.substring(0, 50) : '';
            notify(
              'new_message',
              '新しいメッセージ',
              content || 'メッセージを受信しました',
              `/chat/${chatRoomId}`
            );
          }
        }
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
      setConnected(false);
    };
  }, [chatRoomId, idToken, addMessage, setConnected]);

  // Reconnect when tab becomes visible after being hidden
  useEffect(() => {
    if (!chatRoomId) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }

      // Tab became visible - check if we need to reconnect
      const hiddenMs = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
      const wsService = getWebSocketService(WS_URL, () => idToken);

      // Reconnect if hidden >30s or connection is gone
      if (hiddenMs > 30000 || !wsService.isConnected()) {
        setIsReconnecting(true);
        try {
          await wsService.connect();
          setConnected(true);
          setSendError(null);
        } catch (e) {
          console.error('Reconnect on visibility change failed:', e);
        } finally {
          setIsReconnecting(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [chatRoomId, idToken, setConnected]);

  // Scroll to bottom: instant on initial load, smooth on new messages
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      isInitialLoad.current = false;
    } else if (!isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (content: string) => {
    const wsService = getWebSocketService(WS_URL, () => idToken);

    // WebSocket接続確認・再接続
    if (!wsService.isConnected()) {
      setIsReconnecting(true);
      setSendError('再接続中...');
      try {
        await wsService.connect();
        setConnected(true);
        setSendError(null);
      } catch {
        setSendError('接続に失敗しました。ページを更新してください。');
        setIsReconnecting(false);
        return;
      } finally {
        setIsReconnecting(false);
      }
    }

    const { userId } = useAuthStore.getState();
    const messageId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Optimistically add message to local state
    addMessage({
      messageId,
      chatRoomId: chatRoomId!,
      senderId: userId || '',
      content,
      messageType: 'user',
      readBy: [],
      createdAt: now,
      timestamp: Date.now(),
    });

    try {
      // Send via WebSocket
      wsService.sendMessage('sendMessage', {
        chatRoomId,
        content,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      // Rollback optimistic message on send failure
      removeMessage(messageId);
      setSendError('メッセージの送信に失敗しました。再度お試しください。');
    }
  }, [chatRoomId, idToken, addMessage, removeMessage, setConnected]);

  if (isLoading) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-base-50 dark:bg-base flex items-center justify-center">
          <Icon name="sync" size="xl" className="text-gold animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-base-50 dark:bg-base flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4 font-light">{error}</p>
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 border border-gold text-gold hover:bg-gold/10 transition duration-base font-light"
            >
              チャット一覧に戻る
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentRoom) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-base-50 dark:bg-base flex items-center justify-center">
          <p className="text-text-secondary dark:text-text-dark-secondary font-light">チャットルームが見つかりません</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isAuthenticated={true} hideFooter>
      <div className="flex-1 flex flex-col min-h-0 bg-base-50 dark:bg-base">
        {/* Header */}
        <div className="shrink-0 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4">
          <div className="container mx-auto flex items-center gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 text-text-secondary dark:text-text-dark-muted hover:text-gold transition duration-base"
            >
              <Icon name="arrow_back" size="md" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-serif font-light tracking-wide text-text-primary dark:text-text-dark-primary">
                {currentRoom.name || (currentRoom.type === 'direct'
                  ? 'ダイレクトメッセージ'
                  : 'グループチャット')}
              </h1>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary font-light">
                {currentRoom.participantIds.length}人のメンバー
              </p>
            </div>
          </div>
        </div>

        {/* Reconnect / send error banner */}
        {(sendError || isReconnecting) && (
          <div className="shrink-0 bg-amber-900/30 border-b border-amber-700/30 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isReconnecting && (
                <Icon name="sync" size="sm" className="text-amber-400 animate-spin" />
              )}
              <span className="text-sm text-amber-300 font-light">
                {sendError || '再接続中...'}
              </span>
            </div>
            {!isReconnecting && sendError && (
              <button
                onClick={() => setSendError(null)}
                className="text-amber-400 hover:text-amber-200 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="container mx-auto px-4 py-6">
            {messages.length <= 2 && showStarters && (
              <ConversationStarters onSelect={handleConversationStarterSelect} />
            )}
            {messages.length === 0 ? (
              <div className="text-center text-text-secondary dark:text-text-dark-muted mt-8">
                <p className="font-light">メッセージはまだありません</p>
                <p className="text-sm mt-2 font-light">最初のメッセージを送信してみましょう</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.messageId} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input - fixed at bottom */}
        <div className="shrink-0">
          {messages.length <= 2 && (
            <button
              onClick={() => {
                const next = !showStarters;
                setShowStarters(next);
                localStorage.setItem('showConversationStarters', JSON.stringify(next));
              }}
              className="flex items-center gap-1 text-xs text-text-secondary dark:text-text-dark-secondary hover:text-gold transition-colors px-4 py-1"
            >
              <Icon name="lightbulb" size="sm" />
              {showStarters ? '会話のきっかけを隠す' : '会話のきっかけを見る'}
            </button>
          )}
          <MessageInput
            onSend={handleSendMessage}
            externalMessage={pendingMessage}
            onExternalMessageConsumed={handleExternalMessageConsumed}
          />
        </div>
      </div>
    </Layout>
  );
};
