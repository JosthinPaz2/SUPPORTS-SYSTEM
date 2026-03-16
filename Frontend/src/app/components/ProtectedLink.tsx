import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

interface ProtectedLinkProps {
  to: string;
  requiredRole?: UserRole | UserRole[];
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  title?: string;
}

/**
 ProtectedLink Component
 
 A navigation element that only allows navigation to routes
 the user has permission to access.
 
 If user doesn't have permission:
 - Button becomes disabled
 - Shows tooltip with message
 - Prevents navigation
 
 @example
 <ProtectedLink to="/admin" requiredRole="admin">
   Go to Admin Dashboard
 </ProtectedLink>
 */
export function ProtectedLink({
  to,
  requiredRole,
  children,
  onClick,
  className = '',
  disabled = false,
  title
}: ProtectedLinkProps) {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Determine if user has permission
  let hasPermission = true;
  if (!isLoading && requiredRole) {
    if (!user) {
      hasPermission = false;
    } else {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      hasPermission = roles.includes(user.role);
    }
  }

  const isDisabled = disabled || !hasPermission;
  const tooltipTitle = !hasPermission 
    ? 'No tienes permiso para acceder a esta página'
    : title;

  const handleClick = () => {
    if (!isDisabled) {
      onClick?.();
      navigate(to);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      title={tooltipTitle}
      className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}
