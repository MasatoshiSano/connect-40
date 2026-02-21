import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CognitoUser } from 'amazon-cognito-identity-js';

type VerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected';

interface AuthState {
  user: CognitoUser | null;
  userId: string | null;
  nickname: string | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  verificationStatus: VerificationStatus;
  chatCredits: number | null;
  setTokens: (tokens: { accessToken: string; idToken: string; refreshToken: string }) => void;
  setUser: (user: CognitoUser | null, userId?: string | null) => void;
  setNickname: (nickname: string) => void;
  setVerificationStatus: (status: VerificationStatus) => void;
  setChatCredits: (credits: number | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      userId: null,
      nickname: null,
      accessToken: null,
      idToken: null,
      refreshToken: null,
      isAuthenticated: false,
      verificationStatus: 'unverified',
      chatCredits: null,
      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          idToken: tokens.idToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        }),
      setUser: (user, userId = null) => set({ user, userId }),
      setNickname: (nickname) => set({ nickname }),
      setVerificationStatus: (status) => set({ verificationStatus: status }),
      setChatCredits: (credits) => set({ chatCredits: credits }),
      clearAuth: () =>
        set({
          user: null,
          userId: null,
          nickname: null,
          accessToken: null,
          idToken: null,
          refreshToken: null,
          isAuthenticated: false,
          verificationStatus: 'unverified',
          chatCredits: null,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        userId: state.userId,
        nickname: state.nickname,
        accessToken: state.accessToken,
        idToken: state.idToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        verificationStatus: state.verificationStatus,
        chatCredits: state.chatCredits,
      }),
    }
  )
);
