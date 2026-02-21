import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

interface PublicRouteProps {
  children: ReactNode;
  redirectIfAuthenticated?: string;
}

/**
 * Public route component for auth pages (login, signup, etc.)
 * - Redirects authenticated users away from auth pages
 */
export const PublicRoute = ({
  children,
  redirectIfAuthenticated = '/dashboard'
}: PublicRouteProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectIfAuthenticated, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectIfAuthenticated]);

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
