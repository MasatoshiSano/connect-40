import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { useAuthStore } from '../../stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/dev';

interface ChatRoom {
  chatRoomId: string;
  participantIds: string[];
  type: 'direct' | 'group';
  activityId?: string;
  lastMessageAt: string;
}

export const ChatList = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChatRooms = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load chat rooms');
        }

        const { data } = await response.json();
        setChatRooms(data.rooms || []);
      } catch (error) {
        console.error('Failed to load chat rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatRooms();
  }, [accessToken]);

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                チャット
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                マッチした仲間とメッセージを交換しよう
              </p>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Icon name="sync" size="xl" className="text-primary animate-spin" />
              </div>
            )}

            {!isLoading && chatRooms.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon name="chat_bubble" size="xl" className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  チャットがありません
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  アクティビティに参加してチャットを始めましょう
                </p>
                <button
                  onClick={() => navigate('/activities')}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold"
                >
                  アクティビティを探す
                </button>
              </div>
            )}

            {!isLoading && chatRooms.length > 0 && (
              <div className="space-y-3">
                {chatRooms.map((room) => (
                  <div
                    key={room.chatRoomId}
                    onClick={() => navigate(`/chat/${room.chatRoomId}`)}
                    className="bg-white dark:bg-surface-dark rounded-xl shadow-sm hover:shadow-md transition cursor-pointer p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                        <Icon name={room.type === 'direct' ? 'person' : 'group'} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {room.type === 'direct' ? 'ダイレクトメッセージ' : 'グループチャット'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(room.lastMessageAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                      <Icon name="chevron_right" className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
