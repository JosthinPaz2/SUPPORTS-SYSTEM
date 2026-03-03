import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { User } from '../types/auth';
import { apiService } from '../utils/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, campaign: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isLoading: boolean;
  requestPasswordRecovery: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({ ...parsedUser, access_token: token });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ institutional_email: email, password });

      const userData: User = {
        id: response.id_user,
        name: response.full_name,
        email: response.institutional_email,
        role: response.role_name, // use exact role name
        campaign: response.campaign,
        access_token: response.access_token,
      };

      setUser(userData);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const register = async (fullName: string, email: string, password: string, campaign: string) => {
    // simply call API and return, do not log in automatically
    try {
      return await apiService.register({ full_name: fullName, institutional_email: email, password, campaign });
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    // Redirect to login so credentials are cleared and user can sign in again
    try {
      window.location.href = '/login';
    } catch (error) {
      // fallback: do nothing if navigation isn't possible
      console.warn('Could not redirect after logout', error);
    }
  };

  const requestPasswordRecovery = async (email: string) => {
    await apiService.requestPasswordRecovery({ institutional_email: email });
  };

  const verifyCode = async (email: string, code: string) => {
    await apiService.verifyCode({ institutional_email: email, code });
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    await apiService.resetPassword({
      institutional_email: email,
      code,
      new_password: newPassword,
    });
  };

  const isAdmin = user?.role?.toLowerCase() === 'it';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAdmin,
      isLoading,
      requestPasswordRecovery,
      verifyCode,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
