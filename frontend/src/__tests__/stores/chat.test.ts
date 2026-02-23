import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../../stores/chat';
import type { Message, ChatRoom } from '../../stores/chat';

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  messageId: 'msg-1',
  chatRoomId: 'room-1',
  senderId: 'user-1',
  content: 'Hello',
  messageType: 'user',
  readBy: [],
  createdAt: '2026-02-20T10:00:00Z',
  timestamp: 1740045600000,
  ...overrides,
});

const makeRoom = (overrides: Partial<ChatRoom> = {}): ChatRoom => ({
  chatRoomId: 'room-1',
  participantIds: ['user-1', 'user-2'],
  type: 'direct',
  createdAt: '2026-02-20T10:00:00Z',
  ...overrides,
});

describe('Chat Store', () => {
  beforeEach(() => {
    useChatStore.setState({
      rooms: [],
      currentRoom: null,
      messages: [],
      isConnected: false,
    });
  });

  describe('initial state', () => {
    it('should start with empty state', () => {
      const state = useChatStore.getState();
      expect(state.rooms).toEqual([]);
      expect(state.currentRoom).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.isConnected).toBe(false);
    });
  });

  describe('setRooms', () => {
    it('should set rooms list', () => {
      const rooms = [makeRoom(), makeRoom({ chatRoomId: 'room-2' })];
      useChatStore.getState().setRooms(rooms);

      expect(useChatStore.getState().rooms).toHaveLength(2);
      expect(useChatStore.getState().rooms[0].chatRoomId).toBe('room-1');
    });

    it('should replace existing rooms', () => {
      useChatStore.getState().setRooms([makeRoom()]);
      useChatStore.getState().setRooms([makeRoom({ chatRoomId: 'room-new' })]);

      expect(useChatStore.getState().rooms).toHaveLength(1);
      expect(useChatStore.getState().rooms[0].chatRoomId).toBe('room-new');
    });
  });

  describe('setCurrentRoom', () => {
    it('should set current room', () => {
      const room = makeRoom();
      useChatStore.getState().setCurrentRoom(room);
      expect(useChatStore.getState().currentRoom).toEqual(room);
    });

    it('should clear current room with null', () => {
      useChatStore.getState().setCurrentRoom(makeRoom());
      useChatStore.getState().setCurrentRoom(null);
      expect(useChatStore.getState().currentRoom).toBeNull();
    });
  });

  describe('setMessages', () => {
    it('should set messages list', () => {
      const messages = [makeMessage(), makeMessage({ messageId: 'msg-2' })];
      useChatStore.getState().setMessages(messages);
      expect(useChatStore.getState().messages).toHaveLength(2);
    });
  });

  describe('addMessage', () => {
    it('should add a new message', () => {
      useChatStore.getState().addMessage(makeMessage());
      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().messages[0].content).toBe('Hello');
    });

    it('should prevent duplicate by messageId', () => {
      const msg = makeMessage({ messageId: 'msg-dup' });
      useChatStore.getState().addMessage(msg);
      useChatStore.getState().addMessage(msg);

      expect(useChatStore.getState().messages).toHaveLength(1);
    });

    it('should prevent duplicate by sender+content within 5 seconds', () => {
      const baseTimestamp = 1740045600000;
      useChatStore.getState().addMessage(
        makeMessage({
          messageId: 'msg-a',
          senderId: 'user-1',
          content: 'Same text',
          timestamp: baseTimestamp,
        })
      );
      useChatStore.getState().addMessage(
        makeMessage({
          messageId: 'msg-b',
          senderId: 'user-1',
          content: 'Same text',
          timestamp: baseTimestamp + 3000, // 3 seconds later
        })
      );

      expect(useChatStore.getState().messages).toHaveLength(1);
    });

    it('should allow same content from different senders', () => {
      const baseTimestamp = 1740045600000;
      useChatStore.getState().addMessage(
        makeMessage({
          messageId: 'msg-a',
          senderId: 'user-1',
          content: 'Same text',
          timestamp: baseTimestamp,
        })
      );
      useChatStore.getState().addMessage(
        makeMessage({
          messageId: 'msg-b',
          senderId: 'user-2',
          content: 'Same text',
          timestamp: baseTimestamp + 1000,
        })
      );

      expect(useChatStore.getState().messages).toHaveLength(2);
    });

    it('should allow same sender+content if more than 5 seconds apart', () => {
      const baseTimestamp = 1740045600000;
      useChatStore.getState().addMessage(
        makeMessage({
          messageId: 'msg-a',
          senderId: 'user-1',
          content: 'Same text',
          timestamp: baseTimestamp,
        })
      );
      useChatStore.getState().addMessage(
        makeMessage({
          messageId: 'msg-b',
          senderId: 'user-1',
          content: 'Same text',
          timestamp: baseTimestamp + 6000, // 6 seconds later
        })
      );

      expect(useChatStore.getState().messages).toHaveLength(2);
    });
  });

  describe('setConnected', () => {
    it('should update connection status', () => {
      useChatStore.getState().setConnected(true);
      expect(useChatStore.getState().isConnected).toBe(true);

      useChatStore.getState().setConnected(false);
      expect(useChatStore.getState().isConnected).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should add userId to readBy array', () => {
      useChatStore.getState().setMessages([makeMessage({ messageId: 'msg-1', readBy: [] })]);
      useChatStore.getState().markAsRead('msg-1', 'user-2');

      const msg = useChatStore.getState().messages[0];
      expect(msg.readBy).toContain('user-2');
    });

    it('should not duplicate userId in readBy', () => {
      useChatStore.getState().setMessages([
        makeMessage({ messageId: 'msg-1', readBy: ['user-2'] }),
      ]);
      useChatStore.getState().markAsRead('msg-1', 'user-2');

      const msg = useChatStore.getState().messages[0];
      expect(msg.readBy).toEqual(['user-2']);
    });

    it('should not affect other messages', () => {
      useChatStore.getState().setMessages([
        makeMessage({ messageId: 'msg-1', readBy: [] }),
        makeMessage({ messageId: 'msg-2', readBy: [] }),
      ]);
      useChatStore.getState().markAsRead('msg-1', 'user-2');

      expect(useChatStore.getState().messages[0].readBy).toContain('user-2');
      expect(useChatStore.getState().messages[1].readBy).toEqual([]);
    });
  });

  describe('updateUnreadCount', () => {
    it('should update unread count for specific room', () => {
      useChatStore.getState().setRooms([
        makeRoom({ chatRoomId: 'room-1', unreadCount: 0 }),
        makeRoom({ chatRoomId: 'room-2', unreadCount: 0 }),
      ]);

      useChatStore.getState().updateUnreadCount('room-1', 5);

      const rooms = useChatStore.getState().rooms;
      expect(rooms.find((r) => r.chatRoomId === 'room-1')?.unreadCount).toBe(5);
      expect(rooms.find((r) => r.chatRoomId === 'room-2')?.unreadCount).toBe(0);
    });

    it('should handle non-existent room gracefully', () => {
      useChatStore.getState().setRooms([makeRoom({ chatRoomId: 'room-1' })]);
      useChatStore.getState().updateUnreadCount('nonexistent', 3);

      // Should not throw and room-1 should be unchanged
      expect(useChatStore.getState().rooms).toHaveLength(1);
    });
  });
});
