import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { LogOut, LayoutDashboard, BarChart3, Map } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import ReportsPanel from '../components/ReportsPanel';
import OfficeMap from './OfficeMap';

type AdminTab = 'kanban' | 'reports' | 'map';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('kanban');
  const role = user?.role ?? '';
  const isIT = role.toLowerCase() === 'it';
  const isOperador = role.toLowerCase() === 'operador';

  const tabs = [
    { id: 'kanban' as const, label: 'Kanban Board', icon: LayoutDashboard },
    { id: 'reports' as const, label: 'Reports', icon: BarChart3 },
    { id: 'map' as const, label: 'Office Map', icon: Map },
  ];

  const renderRestricted = () => (
    <div className="rounded-md border bg-white p-6 text-center">
      <h2 className="text-lg font-medium text-gray-900">Access Restricted</h2>
      <p className="text-sm text-gray-600 mt-2">You do not have permission to view this section.</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'kanban':
        return isIT ? <KanbanBoard /> : renderRestricted();
      case 'reports':
        return isIT ? <ReportsPanel /> : renderRestricted();
      case 'map':
        return <OfficeMap />;
      default:
        return isIT ? <KanbanBoard /> : renderRestricted();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
              <p className="text-sm text-gray-600">
                {isIT ? 'IT Admin Panel' : isOperador ? 'Operador Panel' : 'Dashboard'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 ${
                  activeTab === tab.id ? 'bg-teal-600 hover:bg-teal-700' : 'text-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-6">{renderContent()}</CardContent>
        </Card>
      </div>
    </div>
  );
}
