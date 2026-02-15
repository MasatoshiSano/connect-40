import { create } from 'zustand';

export interface Message {
  messageId: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  readBy: string[];
  createdAt: string;
  timestamp: number;
}

export interface ChatRoom {
  chatRoomId: string;
  participantIds: string[];
  type: 'direct' | 'group';
  activityId?: string;
  lastMessageAt?: string;
  lastMessage?: string;
  createdAt: string;
  unreadCount?: number;
}

interface ChatState {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: Message[];
  isConnected: boolean;
  setRooms: (rooms: ChatRoom[]) => void;
  setCurrentRoom: (room: ChatRoom | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setConnected: (connected: boolean) => void;
  markAsRead: (messageId: string, userId: string) => void;
  updateUnreadCount: (chatRoomId: string, count: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  rooms: [],
  currentRoom: null,
  messages: [],
  isConnected: false,
  setRooms: (rooms) => set({ rooms }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setConnected: (connected) => set({ isConnected: connected }),
  markAsRead: (messageId, userId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.messageId === messageId
          ? { ...msg, readBy: [...new Set([...msg.readBy, userId])] }
          : msg
      ),
    })),
  updateUnreadCount: (chatRoomId, count) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.chatRoomId === chatRoomId ? { ...room, unreadCount: count } : room
      ),
    })),
}));
