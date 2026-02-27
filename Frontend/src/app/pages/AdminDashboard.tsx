import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { LogOut } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const role = user?.role ?? '';
  const isIT = role.toLowerCase() === 'it';
  const isOperador = role.toLowerCase() === 'operador';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.name}
              </h1>
              <p className="text-sm text-gray-600">
                {isIT ? 'IT Admin Panel' : isOperador ? 'Operator Panel' : 'Dashboard'}
              </p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Kanban Board (only for IT role) */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isIT ? (
          <KanbanBoard />
        ) : (
          <div className="rounded-md border bg-white p-6 text-center">
            <h2 className="text-lg font-medium text-gray-900">Access Restricted</h2>
            <p className="text-sm text-gray-600 mt-2">You do not have permission to view the Kanban board.</p>
          </div>
        )}
      </main>
    </div>
  );
}
