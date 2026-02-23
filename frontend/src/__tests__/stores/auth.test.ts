import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../stores/auth';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      userId: null,
      nickname: null,
      accessToken: null,
      idToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  describe('initial state', () => {
    it('should start with unauthenticated state', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.idToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.nickname).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('should set all tokens and mark as authenticated', () => {
      useAuthStore.getState().setTokens({
        accessToken: 'access-123',
        idToken: 'id-456',
        refreshToken: 'refresh-789',
      });

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('access-123');
      expect(state.idToken).toBe('id-456');
      expect(state.refreshToken).toBe('refresh-789');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should update tokens when called again (e.g. token refresh)', () => {
      const { setTokens } = useAuthStore.getState();
      setTokens({
        accessToken: 'old-access',
        idToken: 'old-id',
        refreshToken: 'old-refresh',
      });
      setTokens({
        accessToken: 'new-access',
        idToken: 'new-id',
        refreshToken: 'new-refresh',
      });

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.idToken).toBe('new-id');
      expect(state.refreshToken).toBe('new-refresh');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setUser', () => {
    it('should set user without userId', () => {
      const mockUser = { getUsername: () => 'test@example.com' };
      // CognitoUser is complex, so we just set a minimal mock
      useAuthStore.getState().setUser(mockUser as never);

      const state = useAuthStore.getState();
      expect(state.user).toBe(mockUser);
      expect(state.userId).toBeNull();
    });

    it('should set user with userId', () => {
      const mockUser = { getUsername: () => 'test@example.com' };
      useAuthStore.getState().setUser(mockUser as never, 'user-abc');

      const state = useAuthStore.getState();
      expect(state.user).toBe(mockUser);
      expect(state.userId).toBe('user-abc');
    });

    it('should clear user when passed null', () => {
      useAuthStore.getState().setUser({ getUsername: () => 'x' } as never, 'u1');
      useAuthStore.getState().setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.userId).toBeNull();
    });
  });

  describe('setNickname', () => {
    it('should set nickname', () => {
      useAuthStore.getState().setNickname('TestUser');
      expect(useAuthStore.getState().nickname).toBe('TestUser');
    });
  });

  describe('clearAuth', () => {
    it('should clear all auth state', () => {
      // First set up authenticated state
      const { setTokens, setUser, setNickname } = useAuthStore.getState();
      setTokens({
        accessToken: 'a',
        idToken: 'i',
        refreshToken: 'r',
      });
      setUser({ getUsername: () => 'user' } as never, 'uid');
      setNickname('Nick');

      // Verify it's set
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Clear
      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.nickname).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.idToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login -> logout flow', () => {
    it('should handle full login then logout cycle', () => {
      const store = useAuthStore.getState();

      // Login
      store.setTokens({
        accessToken: 'access',
        idToken: 'id',
        refreshToken: 'refresh',
      });
      store.setUser({ getUsername: () => 'test' } as never, 'u1');
      store.setNickname('TestUser');

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().nickname).toBe('TestUser');

      // Logout
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().nickname).toBeNull();
    });
  });
});
