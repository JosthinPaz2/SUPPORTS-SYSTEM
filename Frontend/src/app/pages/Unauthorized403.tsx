import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

/**
 * Unauthorized 403 Page
 * 
 * Displayed when user is logged in but tries to access
 * a route that requires different permissions
 */
export default function Unauthorized403() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoHome = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/employee');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="max-w-md w-full">
        {/* Icon Section */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-full p-6">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">403</h1>
          <h2 className="text-2xl font-semibold text-slate-100">Acceso Denegado</h2>
          <p className="text-slate-400">
            Lo sentimos, no tienes permisos para acceder a esta página.
          </p>

          {user && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mt-6 text-sm text-slate-300">
              <p className="font-medium text-slate-200 mb-2">Tu información:</p>
              <p>Usuario: <span className="text-blue-400">{user.name}</span></p>
              <p>Rol: <span className="text-blue-400 capitalize">{user.role === 'admin' ? 'Administrador' : 'Empleado'}</span></p>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="space-y-3 mt-8">
          <Button
            onClick={handleGoHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Volver al Inicio
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-medium py-2 rounded-lg"
          >
            Cerrar Sesión
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Si crees que esto es un error, contacta al administrador.</p>
        </div>
      </div>
    </div>
  );
}
