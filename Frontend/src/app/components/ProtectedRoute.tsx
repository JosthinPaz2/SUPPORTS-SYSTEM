import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

/**
 * ProtectedRoute Component
 *
 * Protects routes by checking:
 * 1. If user is authenticated → otherwise redirect to /login
 * 2. If user has the required role → otherwise redirect to their own home
 *
 * Smart redirect on role mismatch:
 *   admin trying /employee → goes to /admin
 *   employee trying /admin → goes to /employee
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show spinner while restoring session from localStorage
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role check: redirect to the user's correct home if they don't have permission
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasPermission = roles.includes(user.role);

    if (!hasPermission) {
      const userHome = user.role === 'admin' ? '/admin' : '/employee';
      return <Navigate to={userHome} replace />;
    }
  }

  return <>{children}</>;
}
