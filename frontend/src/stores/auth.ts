import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CognitoUser } from 'amazon-cognito-identity-js';

interface AuthState {
  user: CognitoUser | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (tokens: { accessToken: string; idToken: string; refreshToken: string }) => void;
  setUser: (user: CognitoUser | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      idToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          idToken: tokens.idToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        }),
      setUser: (user) => set({ user }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          idToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        idToken: state.idToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
