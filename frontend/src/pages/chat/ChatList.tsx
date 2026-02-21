import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { useAuthStore } from '../../stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/dev';

interface ChatRoom {
  chatRoomId: string;
  name?: string;
  participantIds: string[];
  type: 'direct' | 'group';
  activityId?: string;
  lastMessageAt: string;
  lastMessage?: string;
}

export const ChatList = () => {
  const navigate = useNavigate();
  const { idToken } = useAuthStore();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChatRooms = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
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
  }, [idToken]);

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-base-50 dark:bg-base py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-2">
                チャット
              </h1>
              <p className="text-text-secondary dark:text-text-dark-secondary font-light">
                マッチした仲間とメッセージを交換しよう
              </p>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Icon name="sync" size="xl" className="text-gold animate-spin" />
              </div>
            )}

            {!isLoading && chatRooms.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gold/10 flex items-center justify-center mx-auto mb-6">
                  <Icon name="chat_bubble" size="xl" className="text-gold" />
                </div>
                <h2 className="text-2xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-3">
                  チャットがありません
                </h2>
                <p className="text-text-secondary dark:text-text-dark-secondary font-light mb-6">
                  アクティビティに参加してチャットを始めましょう
                </p>
                <button
                  onClick={() => navigate('/activities')}
                  className="px-6 py-3 border border-gold text-gold hover:bg-gold/10 transition duration-base font-light tracking-ryokan-wide uppercase text-sm"
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
                    className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-gold/40 transition duration-base cursor-pointer p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Icon name={room.type === 'direct' ? 'person' : 'group'} className="text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-light tracking-wide text-text-primary dark:text-text-dark-primary truncate">
                          {room.name || (room.type === 'direct' ? 'ダイレクトメッセージ' : 'グループチャット')}
                        </h3>
                        <div className="flex items-center gap-2">
                          {room.lastMessage && (
                            <p className="text-sm text-text-secondary dark:text-text-dark-secondary font-light truncate flex-1">
                              {room.lastMessage}
                            </p>
                          )}
                          <span className="text-xs text-text-muted dark:text-text-dark-muted flex-shrink-0">
                            {new Date(room.lastMessageAt).toLocaleString('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted dark:text-text-dark-muted mt-1 font-light">
                          {room.participantIds.length}人のメンバー
                        </p>
                      </div>
                      <Icon name="chevron_right" className="text-text-muted dark:text-text-dark-muted flex-shrink-0" />
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
