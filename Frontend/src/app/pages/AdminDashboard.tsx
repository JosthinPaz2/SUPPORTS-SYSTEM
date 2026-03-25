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
import UsersManagementButton from '../components/UsersManagementButton';

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
    if (!ticketId) return null;
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col relative">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm w-full relative z-[9999]">
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                Welcome, {user?.name}
              </h1>
              <p className="text-sm text-teal-600 font-medium">
                {isIT ? 'IT Admin Panel' : 'Dashboard'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-1">
              <NotificationsButton />
              <UsersManagementButton canEditRoles={isIT} />
              <DownloadButtons tickets={tickets} />
              <Button 
                variant="outline" 
                onClick={logout}
                className="group flex items-center transition-all duration-300 hover:bg-red-50 hover:text-red-700 border-gray-300 text-gray-700 overflow-hidden shadow-sm hover:shadow-md"
              >
                <LogOut className="w-4 h-4" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs group-hover:ml-2">
                  Logout
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full flex-grow p-4 md:p-8 relative z-10">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap flex-shrink-0 transition-all shadow-sm ${
                  activeTab === tab.id ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg' : 'text-slate-700 border-slate-200 hover:bg-slate-100 hover:shadow-md'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        <Card className="w-full border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0 sm:p-4 md:p-6 w-full">
            <div className="w-full overflow-x-auto">
              {renderContent()}
            </div>
          </CardContent>
        </Card>
      </main>

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

