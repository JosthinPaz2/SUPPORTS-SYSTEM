import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

interface RoleBasedProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

/**
 RoleBasedRender Component
 
 Conditionally renders children based on user's role.
 Useful for showing/hiding buttons, links, or entire sections.
 
 @example
 <RoleBasedRender requiredRole="admin">
   <button>Admin Only</button>
 </RoleBasedRender>
 
 @example
 <RoleBasedRender requiredRole={['admin', 'employee']}>
   <div>Both can see this</div>
 </RoleBasedRender>
 */
export function RoleBasedRender({ children, requiredRole, fallback }: RoleBasedProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // If no role requirement, always render
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Check if user is authenticated and has required role
  if (!user) {
    return <>{fallback || null}</>;
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const hasPermission = roles.includes(user.role);

  return hasPermission ? <>{children}</> : <>{fallback || null}</>;
}
