import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInput } from '../../components/chat/MessageInput';
import { ConversationStarters } from '../../components/chat/ConversationStarters';
import { useChatStore, type ChatRoom as ChatRoomType } from '../../stores/chat';
import { useAuthStore } from '../../stores/auth';
import { notify } from '../../stores/notification';
import { getWebSocketService } from '../../services/websocket';
import {
  getChatRooms,
  getChatRoom,
  getPublicProfile,
  markRoomAsRead,
  type ChatRoomSummary,
} from '../../services/api';

const WS_URL = import.meta.env.VITE_WEBSOCKET_ENDPOINT || 'ws://localhost:3001';

// --- Skeleton Components ---

const ChatListSkeleton = () => (
  <div className="space-y-1 p-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
        <div className="w-11 h-11 bg-border-light dark:bg-border-dark rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-border-light dark:bg-border-dark rounded w-3/4" />
          <div className="h-3 bg-border-light dark:bg-border-dark rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const ChatRoomSkeleton = () => (
  <div className="flex-1 flex flex-col">
    <div className="p-4 border-b border-border-light dark:border-border-dark animate-pulse">
      <div className="h-5 bg-border-light dark:bg-border-dark rounded w-48 mb-2" />
      <div className="h-3 bg-border-light dark:bg-border-dark rounded w-24" />
    </div>
    <div className="flex-1 p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}>
          <div className={`flex items-end gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
            {i % 2 === 0 && <div className="w-8 h-8 bg-border-light dark:bg-border-dark rounded-full flex-shrink-0" />}
            <div className="space-y-1">
              <div className={`h-10 bg-border-light dark:bg-border-dark rounded ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
              <div className="h-2 bg-border-light dark:bg-border-dark rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Chat List Sidebar Item ---

interface ChatListItemProps {
  room: ChatRoomSummary;
  isSelected: boolean;
  onSelect: (roomId: string) => void;
}

const ChatListItem = ({ room, isSelected, onSelect }: ChatListItemProps) => {
  const formattedTime = room.lastMessageAt
    ? new Date(room.lastMessageAt).toLocaleString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <button
      onClick={() => onSelect(room.chatRoomId)}
      className={`w-full text-left flex items-center gap-3 p-3 transition duration-base hover:bg-gold/5 ${
        isSelected
          ? 'bg-gold/10 border-l-2 border-gold'
          : 'border-l-2 border-transparent'
      }`}
    >
      <div className="w-11 h-11 bg-gold/10 flex items-center justify-center flex-shrink-0 rounded-full">
        <Icon
          name={room.type === 'direct' ? 'person' : 'group'}
          className="text-gold"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-text-primary dark:text-text-dark-primary truncate">
            {room.name ||
              (room.type === 'direct'
                ? 'ダイレクトメッセージ'
                : 'グループチャット')}
          </h3>
          {(room.unreadCount ?? 0) > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center bg-gold text-base text-xs font-bold rounded-full px-1.5">
              {room.unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {room.lastMessage && (
            <p className="text-xs text-text-secondary dark:text-text-dark-secondary truncate flex-1">
              {room.lastMessage}
            </p>
          )}
          {formattedTime && (
            <span className="text-[10px] text-text-muted dark:text-text-dark-muted flex-shrink-0">
              {formattedTime}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// --- Empty States ---

const EmptyChatList = () => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gold/10 flex items-center justify-center mx-auto mb-4 rounded-full">
          <Icon name="chat_bubble" size="xl" className="text-gold" />
        </div>
        <h2 className="text-lg font-serif font-light tracking-wide text-text-primary dark:text-text-dark-primary mb-2">
          チャットがありません
        </h2>
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary font-light mb-4">
          アクティビティに参加して
          <br />
          チャットを始めましょう
        </p>
        <button
          onClick={() => navigate('/activities')}
          className="px-5 py-2 border border-gold text-gold hover:bg-gold/10 transition duration-base font-light tracking-wide text-sm"
        >
          アクティビティを探す
        </button>
      </div>
    </div>
  );
};

const NoChatSelected = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 bg-gold/10 flex items-center justify-center mx-auto mb-4 rounded-full">
        <Icon name="chat_bubble_outline" size="xl" className="text-gold/60" />
      </div>
      <p className="text-text-secondary dark:text-text-dark-secondary font-light">
        チャットを選択してください
      </p>
    </div>
  </div>
);

// --- Chat Room Panel (right side) ---

interface ChatRoomPanelProps {
  roomId: string;
  onBack: () => void;
  showBackButton: boolean;
}

const ChatRoomPanel = ({ roomId, onBack, showBackButton }: ChatRoomPanelProps) => {
  const { idToken, userId: currentUserId, chatCredits, setChatCredits } = useAuthStore();
  const { currentRoom, messages, setCurrentRoom, setMessages, addMessage, removeMessage, setConnected } =
    useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | undefined>(undefined);
  const [senderProfiles, setSenderProfiles] = useState<Map<string, { nickname: string; profilePhoto: string }>>(
    new Map()
  );
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

  // Load chat room data
  useEffect(() => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);

    getChatRoom(roomId)
      .then((data) => {
        const room: ChatRoomType = {
          chatRoomId: data.chatRoomId,
          name: data.name,
          participantIds: data.participantIds,
          type: data.type,
          activityId: data.activityId,
          createdAt: data.createdAt,
        };
        setCurrentRoom(room);
        setMessages(data.messages || []);
        markRoomAsRead(roomId).catch(() => {});
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'チャットルームの読み込みに失敗しました');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [roomId, setCurrentRoom, setMessages]);

  // Fetch sender profiles
  useEffect(() => {
    if (!currentRoom?.participantIds || !currentUserId) return;
    const otherIds = currentRoom.participantIds.filter((id) => id !== currentUserId);
    Promise.all(
      otherIds.map(async (id) => {
        try {
          const profile = await getPublicProfile(id);
          return { id, nickname: profile.nickname, profilePhoto: profile.profilePhoto };
        } catch {
          return { id, nickname: '不明なユーザー', profilePhoto: '' };
        }
      })
    ).then((profiles) => {
      const map = new Map<string, { nickname: string; profilePhoto: string }>();
      profiles.forEach((p) => map.set(p.id, { nickname: p.nickname, profilePhoto: p.profilePhoto }));
      setSenderProfiles(map);
    });
  }, [currentRoom?.participantIds, currentUserId]);

  // WebSocket connection
  useEffect(() => {
    if (!roomId) return;

    const wsService = getWebSocketService(WS_URL, () => idToken);

    wsService
      .connect()
      .then(() => {
        setConnected(true);
      })
      .catch((wsError) => {
        console.error('WebSocket connection failed:', wsError);
        setError('リアルタイム接続に失敗しました');
      });

    const unsubscribe = wsService.onMessage((message) => {
      if (message.type === 'message' && message.data && typeof message.data === 'object') {
        const data = message.data as Record<string, unknown>;
        if (data.chatRoomId === roomId) {
          addMessage({
            messageId: data.messageId as string,
            chatRoomId: data.chatRoomId as string,
            senderId: data.senderId as string,
            content: data.content as string,
            messageType: data.messageType === 'system' ? 'system' : 'user',
            createdAt: data.createdAt as string,
            readBy: (data.readBy as string[]) || [],
            timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
          });

          const storeUserId = useAuthStore.getState().userId;
          if (data.senderId !== storeUserId && data.messageType !== 'system') {
            const content = typeof data.content === 'string' ? data.content.substring(0, 50) : '';
            notify(
              'new_message',
              '新しいメッセージ',
              content || 'メッセージを受信しました',
              `/chat/${roomId}`
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
  }, [roomId, idToken, addMessage, setConnected]);

  // Visibility change reconnect
  useEffect(() => {
    if (!roomId) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }

      const hiddenMs = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
      const wsService = getWebSocketService(WS_URL, () => idToken);

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
  }, [roomId, idToken, setConnected]);

  // Scroll to bottom
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      isInitialLoad.current = false;
    } else if (!isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Reset initial load flag when room changes
  useEffect(() => {
    isInitialLoad.current = true;
  }, [roomId]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const wsService = getWebSocketService(WS_URL, () => idToken);

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

      addMessage({
        messageId,
        chatRoomId: roomId,
        senderId: userId || '',
        content,
        messageType: 'user',
        readBy: [],
        createdAt: now,
        timestamp: Date.now(),
      });

      if (chatCredits !== null && chatCredits > 0) {
        setChatCredits(chatCredits - 1);
      }

      try {
        wsService.sendMessage('sendMessage', {
          chatRoomId: roomId,
          content,
        });
      } catch (err) {
        console.error('Failed to send message:', err);
        removeMessage(messageId);
        setSendError('メッセージの送信に失敗しました。再度お試しください。');
      }
    },
    [roomId, idToken, addMessage, removeMessage, setConnected, chatCredits, setChatCredits]
  );

  if (isLoading) {
    return <ChatRoomSkeleton />;
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4 font-light">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gold text-gold hover:bg-gold/10 transition duration-base font-light"
          >
            チャット一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary dark:text-text-dark-secondary font-light">
          チャットルームが見つかりません
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Room Header */}
      <div className="shrink-0 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-3">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={onBack}
              className="p-1.5 text-text-secondary dark:text-text-dark-muted hover:text-gold transition duration-base"
            >
              <Icon name="arrow_back" size="md" />
            </button>
          )}
          <div className="w-9 h-9 bg-gold/10 flex items-center justify-center rounded-full flex-shrink-0">
            <Icon
              name={currentRoom.type === 'direct' ? 'person' : 'group'}
              className="text-gold !text-[18px]"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-text-primary dark:text-text-dark-primary truncate">
              {currentRoom.name ||
                (currentRoom.type === 'direct'
                  ? 'ダイレクトメッセージ'
                  : 'グループチャット')}
            </h2>
            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
              {currentRoom.participantIds.length}人のメンバー
            </p>
          </div>
          {currentRoom.activityId && (
            <Link
              to={`/activities/${currentRoom.activityId}`}
              className="flex items-center gap-1 text-xs text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors flex-shrink-0"
            >
              <Icon name="open_in_new" className="!text-[14px]" />
              <span className="hidden sm:inline">アクティビティ</span>
            </Link>
          )}
          {chatCredits !== null && (
            <div className="shrink-0 flex items-center gap-1 px-2 py-1 border border-gold/30 bg-gold/5 rounded">
              <Icon name="chat_bubble_outline" className="!text-[14px] text-gold" />
              <span className="text-xs text-gold font-light">{chatCredits}回</span>
            </div>
          )}
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
        <div className="px-4 py-6">
          {messages.length <= 2 && showStarters && (
            <ConversationStarters onSelect={handleConversationStarterSelect} />
          )}
          {messages.length === 0 ? (
            <div className="text-center text-text-secondary dark:text-text-dark-muted mt-8">
              <p className="font-light">メッセージはまだありません</p>
              <p className="text-sm mt-2 font-light">最初のメッセージを送信してみましょう</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.messageId}
                message={msg}
                isMine={msg.senderId === currentUserId}
                senderNickname={
                  msg.senderId !== currentUserId
                    ? (senderProfiles.get(msg.senderId)?.nickname ?? '')
                    : undefined
                }
                senderPhoto={
                  msg.senderId !== currentUserId
                    ? (senderProfiles.get(msg.senderId)?.profilePhoto ?? '')
                    : undefined
                }
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
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
  );
};

// --- Main Chat Page ---

export const Chat = () => {
  const { chatRoomId: urlRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(urlRoomId ?? null);
  // On mobile: true = show room list, false = show chat room
  const [showList, setShowList] = useState(!urlRoomId);

  // Load chat rooms
  useEffect(() => {
    setIsLoadingRooms(true);
    getChatRooms()
      .then(({ rooms: loadedRooms }) => {
        const sorted = [...loadedRooms].sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
        setRooms(sorted);

        // Auto-select first room if none selected and rooms exist
        if (!selectedRoomId && sorted.length > 0) {
          setSelectedRoomId(sorted[0].chatRoomId);
        }
      })
      .catch((err) => {
        console.error('Failed to load chat rooms:', err);
      })
      .finally(() => {
        setIsLoadingRooms(false);
      });
  }, []);

  // Sync URL param with selection
  useEffect(() => {
    if (urlRoomId && urlRoomId !== selectedRoomId) {
      setSelectedRoomId(urlRoomId);
      setShowList(false);
    }
  }, [urlRoomId, selectedRoomId]);

  const handleSelectRoom = useCallback(
    (roomId: string) => {
      setSelectedRoomId(roomId);
      setShowList(false);
      navigate(`/chat/${roomId}`, { replace: true });
    },
    [navigate]
  );

  const handleBack = useCallback(() => {
    setShowList(true);
    navigate('/chat', { replace: true });
  }, [navigate]);

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="shrink-0 p-4 border-b border-border-light dark:border-border-dark">
        <h1 className="text-lg font-serif font-light tracking-wide text-text-primary dark:text-text-dark-primary">
          チャット
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoadingRooms ? (
          <ChatListSkeleton />
        ) : rooms.length === 0 ? (
          <EmptyChatList />
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {rooms.map((room) => (
              <ChatListItem
                key={room.chatRoomId}
                room={room}
                isSelected={room.chatRoomId === selectedRoomId}
                onSelect={handleSelectRoom}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout isAuthenticated={true} hideFooter fixedHeight>
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop: split layout */}
        {/* Sidebar - hidden on mobile when viewing a chat */}
        <div
          className={`${
            showList ? 'flex' : 'hidden'
          } md:flex flex-col w-full md:w-80 lg:w-96 md:max-w-[380px] border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark overflow-hidden`}
        >
          {sidebarContent}
        </div>

        {/* Main chat area */}
        <div
          className={`${
            showList ? 'hidden' : 'flex'
          } md:flex flex-col flex-1 min-w-0 bg-base-50 dark:bg-base`}
        >
          {selectedRoomId ? (
            <ChatRoomPanel
              key={selectedRoomId}
              roomId={selectedRoomId}
              onBack={handleBack}
              showBackButton={true}
            />
          ) : (
            <NoChatSelected />
          )}
        </div>
      </div>
    </Layout>
  );
};
