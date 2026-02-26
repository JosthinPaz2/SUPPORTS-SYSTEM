import React from 'react';
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
              leave
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Kanban Board */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <KanbanBoard />
      </main>
    </div>
  );
}
