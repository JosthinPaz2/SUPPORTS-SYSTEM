import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { LogOut, LayoutDashboard, BarChart3, Map } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import ReportsPanel from '../components/ReportsPanel';
import OfficeMap from './OfficeMap';
import NotificationsButton from '../components/NotificationsButton';
import TicketDetailsModal from '../components/TicketDetailsModal';
import { Ticket } from '../types/ticket';
import DownloadButtons from '../components/DownloadButtons';
import TipBox from '../components/OfficeMap/TipBox';

type AdminTab = 'kanban' | 'reports' | 'map';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { tickets } = useTickets();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>('kanban');
  const [manualSelectedTicket, setManualSelectedTicket] = useState<Ticket | null>(null);
  const isIT = user?.id_role === 1;

  const querySelectedTicket = useMemo(() => {
    const ticketId = searchParams.get('ticketId');
    if (!ticketId) {
      return null;
    }

    return tickets.find((ticket) => String(ticket.id) === String(ticketId)) ?? null;
  }, [searchParams, tickets]);

  const selectedTicket = manualSelectedTicket ?? querySelectedTicket;

  const handleCloseTicketModal = () => {
    setManualSelectedTicket(null);
    if (searchParams.has('ticketId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('ticketId');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const tabs = [
    { id: 'kanban' as const, label: 'Kanban Board', icon: LayoutDashboard },
    { id: 'reports' as const, label: 'Reports', icon: BarChart3 },
    { id: 'map' as const, label: 'Office Map', icon: Map },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'kanban': return <KanbanBoard />;
      case 'reports': return <ReportsPanel />;
      case 'map': return <OfficeMap />;
      default: return <KanbanBoard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
              <p className="text-sm text-gray-600">
                {isIT ? 'IT Admin Panel' : 'Dashboard'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationsButton />
               <DownloadButtons tickets={tickets} />
              {/* BOTÓN CON TEXTO DESPLEGABLE */}
              <Button 
                variant="outline" 
                onClick={logout}
                className="group flex items-center overflow-hidden transition-all duration-300 ease-in-out hover:bg-black-50 hover:text-black-600 border-black-100"
              >
                <LogOut className="w-2 h-2" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs group-hover:ml-">
                  Logout
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 transition-all ${
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

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={handleCloseTicketModal}
          isAdmin
        />
      )}
      <TipBox />
    </div>
  );
}