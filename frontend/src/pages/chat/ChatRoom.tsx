import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInput } from '../../components/chat/MessageInput';
import { useChatStore } from '../../stores/chat';
import { useAuthStore } from '../../stores/auth';
import { getWebSocketService } from '../../services/websocket';

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/dev';
const WS_URL = import.meta.env.VITE_WEBSOCKET_ENDPOINT || 'ws://localhost:3001';

export const ChatRoom = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const { currentRoom, messages, setCurrentRoom, setMessages, addMessage, setConnected } =
    useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatRoomId) return;

    const loadChatRoom = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/chat/rooms/${chatRoomId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
  }, [chatRoomId, accessToken, setCurrentRoom, setMessages]);

  useEffect(() => {
    if (!chatRoomId) return;

    const wsService = getWebSocketService(WS_URL, () => accessToken);

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
      if (message.type === 'message' && message.data.chatRoomId === chatRoomId) {
        addMessage(message.data);
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
      setConnected(false);
    };
  }, [chatRoomId, accessToken, addMessage, setConnected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    try {
      const wsService = getWebSocketService();
      wsService.sendMessage('sendMessage', {
        chatRoomId,
        content,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('メッセージの送信に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout isAuthenticated={true}>
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
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
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">チャットルームが見つかりません</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isAuthenticated={true}>
      <div className="h-screen flex flex-col bg-bg-light dark:bg-bg-dark">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark p-4">
          <div className="container mx-auto flex items-center gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Icon name="arrow_back" size="md" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentRoom.type === 'direct'
                  ? `メンバー: ${currentRoom.participantIds.length}人`
                  : `グループチャット (${currentRoom.participantIds.length}人)`}
              </h1>
              {currentRoom.activityId && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  アクティビティ関連
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <p>メッセージはまだありません</p>
                <p className="text-sm mt-2">最初のメッセージを送信してみましょう</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.messageId} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <MessageInput onSend={handleSendMessage} />
      </div>
    </Layout>
  );
};
