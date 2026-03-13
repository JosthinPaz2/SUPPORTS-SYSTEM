import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { User, UserRole } from '../types/auth';
import { apiService } from '../utils/api';

/* ==========================================
  Definición del tipo de contexto de autenticación
========================================== */
interface AuthContextType {
  user: User | null; // Usuario actualmente logueado
  login: (email: string, password: string) => Promise<User | null>; // Función para iniciar sesión
  register: (fullName: string, email: string, password: string, campaign: string) => Promise<void>; // Registrar usuario
  logout: () => void; // Cerrar sesión
  isAdmin: boolean; // Indica si el usuario es admin
  isLoading: boolean; // Indica si se está cargando el estado de autenticación
  requestPasswordRecovery: (email: string) => Promise<void>; // Solicitar recuperación de contraseña
  verifyCode: (email: string, code: string) => Promise<void>; // Verificar código enviado al email
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>; // Cambiar contraseña
}

/* ==========================================
  Crear el contexto de autenticación
========================================== */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ==========================================
  Provider que envuelve la aplicación
  y maneja la lógica de autenticación
========================================== */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ------------------------------------------
    useEffect para revisar si hay un usuario
    logueado en localStorage al iniciar la app
  ------------------------------------------ */
  useEffect(() => {
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
    setIsLoading(false); // Fin de la carga inicial
  }, []);

  /* ------------------------------------------
    Función para iniciar sesión
    - Llama al API
    - Almacena token y datos en localStorage
  ------------------------------------------ */
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await apiService.login({ institutional_email: email, password });

      const role: UserRole = response.id_role === 1 ? 'admin' : 'employee';

      const userData: User = {
        id: response.id_user,
        name: response.full_name,
        email: response.institutional_email,
        role,
        id_role: response.id_role,
        campaign: response.campaign,
        access_token: response.access_token,
      };

      setUser(userData);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));

      return userData;
    } catch (error) {
      throw error; // Re-lanza el error para manejarlo en el UI
    }
  };

  /* ------------------------------------------
    Función para registrar un nuevo usuario
    - No inicia sesión automáticamente
  ------------------------------------------ */
  const register = async (fullName: string, email: string, password: string, campaign: string) => {
    try {
      await apiService.register({ full_name: fullName, institutional_email: email, password, campaign });
    } catch (error) {
      throw error;
    }
  };

  /* ------------------------------------------
    Función para cerrar sesión
    - Limpia localStorage
    - Redirige al login
  ------------------------------------------ */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');

    try {
      window.location.href = '/login';
    } catch (error) {
      console.warn('Could not redirect after logout', error);
    }
  };

  /* ------------------------------------------
    Funciones de recuperación de contraseña
  ------------------------------------------ */
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

  /* ------------------------------------------
    Determina si el usuario es administrador
  ------------------------------------------ */
  const isAdmin = user?.id_role === 1;

  /* ------------------------------------------
    Provee el contexto a todos los hijos
  ------------------------------------------ */
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

/* ==========================================
  Hook para usar el contexto de autenticación
  - Incluye fallback seguro si no hay Provider
========================================== */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Fallback: intenta recuperar datos desde localStorage
    const stored = localStorage.getItem('user_data');
    let fallbackUser: User | null = null;
    if (stored) {
      try {
        fallbackUser = JSON.parse(stored) as User;
      } catch {
        fallbackUser = null;
      }
    }

    // Devuelve un objeto con funciones vacías y el usuario recuperado
    return {
      user: fallbackUser,
      login: async () => null,
      register: async () => {},
      logout: () => {},
      isAdmin: fallbackUser?.id_role === 1,
      isLoading: false,
      requestPasswordRecovery: async () => {},
      verifyCode: async () => {},
      resetPassword: async () => {},
    };
  }
  return context;
}