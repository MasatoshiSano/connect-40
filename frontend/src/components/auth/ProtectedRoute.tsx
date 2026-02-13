import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
export const ProtectedRoute = ({ children, requireProfile = false }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, setUser, clearAuth } = useAuthStore();

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

        // TODO: If requireProfile is true, check if user has completed profile
        // and redirect to /profile/create if not
      } catch (error) {
        console.error('Auth verification failed:', error);
        clearAuth();
        navigate('/login', { replace: true });
      }
    };

    checkAuth();
  }, [isAuthenticated, navigate, setUser, clearAuth, requireProfile]);

  // Show nothing while checking auth (avoid flash of protected content)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
