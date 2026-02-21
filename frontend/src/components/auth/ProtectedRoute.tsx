import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { getCurrentUser } from '../../services/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireProfile?: boolean;
}

/**
 * Protected route component that enforces authentication
 * - Redirects to /login if not authenticated
 * - Optionally requires profile completion
 */
export const ProtectedRoute = ({ children, requireProfile = true }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setUser, clearAuth } = useAuthStore();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // First check local auth state
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }

      // Verify session with Cognito
      try {
        const user = await getCurrentUser();
        if (!user) {
          clearAuth();
          navigate('/login', { replace: true });
          return;
        }
        setUser(user);

        // Check if user has completed profile (if required)
        if (requireProfile) {
          // Don't check profile if already on profile creation pages
          const isOnProfilePage = location.pathname.startsWith('/profile/create');

          if (!isOnProfilePage) {
            try {
              const { getUserProfile } = await import('../../services/api');
              await getUserProfile();
              // Profile exists, continue
              setIsCheckingProfile(false);
            } catch (error) {
              // Profile doesn't exist (404) or other error
              const errorMessage = error instanceof Error ? error.message : String(error);
              if (errorMessage.toLowerCase().includes('profile not found') ||
                  errorMessage.toLowerCase().includes('not found') ||
                  errorMessage.includes('404')) {
                console.log('Profile not found, redirecting to profile creation');
                navigate('/profile/create/step1', { replace: true });
                return;
              }
              // Other errors, let user continue but log the error
              console.error('Profile check failed:', error);
              setIsCheckingProfile(false);
            }
          } else {
            setIsCheckingProfile(false);
          }
        } else {
          setIsCheckingProfile(false);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        clearAuth();
        navigate('/login', { replace: true });
      }
    };

    checkAuth();
  }, [isAuthenticated, navigate, setUser, clearAuth, requireProfile, location.pathname]);

  // Show nothing while checking auth or profile (avoid flash of protected content)
  if (!isAuthenticated || isCheckingProfile) {
    return null;
  }

  return <>{children}</>;
};
