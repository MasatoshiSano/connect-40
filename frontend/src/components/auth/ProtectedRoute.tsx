import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { getCurrentUser } from '../../services/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireProfile?: boolean;
}

/**
 * Session-level cache to avoid redundant Cognito + profile API calls on every
 * route transition. Each ProtectedRoute instance is newly mounted on navigation,
 * so without this cache every page change would incur 200-600ms of blank screen.
 * Cache is invalidated when the userId changes (i.e. a different user logs in).
 */
let authCache: {
  userId: string;
  verifiedAt: number;
  hasProfile: boolean | null;
} | null = null;

const COGNITO_VERIFY_TTL_MS = 5 * 60 * 1000; // Re-verify with Cognito every 5 minutes

/**
 * Protected route component that enforces authentication
 * - Redirects to /login if not authenticated
 * - Optionally requires profile completion
 */
export const ProtectedRoute = ({ children, requireProfile = true }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userId, setUser, clearAuth } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        authCache = null;
        navigate('/login', { replace: true });
        return;
      }

      const now = Date.now();

      // Invalidate cache if a different user has logged in
      if (authCache && authCache.userId !== userId) {
        authCache = null;
      }

      // Only re-verify with Cognito if cache is stale or missing
      const needsCognitoVerify =
        !authCache || now - authCache.verifiedAt > COGNITO_VERIFY_TTL_MS;

      if (needsCognitoVerify) {
        try {
          const user = await getCurrentUser();
          if (!user) {
            clearAuth();
            authCache = null;
            navigate('/login', { replace: true });
            return;
          }
          setUser(user);
          authCache = {
            userId: userId || '',
            verifiedAt: now,
            hasProfile: authCache?.hasProfile ?? null,
          };
        } catch (error) {
          console.error('Auth verification failed:', error);
          clearAuth();
          authCache = null;
          navigate('/login', { replace: true });
          return;
        }
      }

      if (requireProfile && authCache) {
        const isOnProfilePage = location.pathname.startsWith('/profile/create');

        if (!isOnProfilePage) {
          if (authCache.hasProfile === null) {
            // First time checking profile this session
            try {
              const { getUserProfile } = await import('../../services/api');
              await getUserProfile();
              authCache = { ...authCache, hasProfile: true };
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              if (
                errorMessage.toLowerCase().includes('profile not found') ||
                errorMessage.toLowerCase().includes('not found') ||
                errorMessage.includes('404')
              ) {
                authCache = { ...authCache, hasProfile: false };
                navigate('/profile/create/step1', { replace: true });
                return;
              }
              // Other errors: allow through and log
              console.error('Profile check failed:', error);
            }
          } else if (authCache.hasProfile === false) {
            navigate('/profile/create/step1', { replace: true });
            return;
          }
          // authCache.hasProfile === true → already verified, skip API call
        }
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  // Only re-run when authentication state or user identity changes.
  // navigate, setUser, clearAuth are stable references and do not need to be listed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userId]);

  // Show nothing while verifying auth to avoid flash of protected content
  if (!isAuthenticated || isCheckingAuth) {
    return null;
  }

  return <>{children}</>;
};
