import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { LogOut, LayoutDashboard, BarChart3, Map as MapIcon } from 'lucide-react';
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
    { id: 'map' as const, label: 'Office Map', icon: MapIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'kanban': return <KanbanBoard />;
      case 'reports': return <ReportsPanel />;
      case 'map': return <OfficeMap />;
      default: return null;
    }
  };

  const expandibleClass = "group flex items-center overflow-hidden transition-all duration-300 ease-in-out";
  const textClass = "max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs group-hover:ml-2";

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(160deg,#f7fafc_0%,#eef4ff_55%,#f9fbff_100%)] flex flex-col relative">
      <div aria-hidden="true" style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden',background:'radial-gradient(ellipse at 20% 50%, rgba(20,184,166,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.10) 0%, transparent 55%), #030712'}}>
        <div style={{position:'absolute',borderRadius:'50%',filter:'blur(80px)',width:500,height:500,top:'5%',left:'10%',background:'rgba(20,184,166,0.13)',animation:'floatBg0 18s ease-in-out infinite alternate'}}/>
        <div style={{position:'absolute',borderRadius:'50%',filter:'blur(80px)',width:350,height:350,top:'60%',left:'70%',background:'rgba(59,130,246,0.10)',animation:'floatBg1 24s ease-in-out infinite alternate'}}/>
        <div style={{position:'absolute',borderRadius:'50%',filter:'blur(80px)',width:250,height:250,top:'80%',left:'15%',background:'rgba(20,184,166,0.08)',animation:'floatBg2 30s ease-in-out infinite alternate'}}/>
        <div style={{position:'absolute',borderRadius:'50%',filter:'blur(80px)',width:400,height:400,top:'20%',left:'60%',background:'rgba(99,102,241,0.08)',animation:'floatBg3 20s ease-in-out infinite alternate'}}/>
        <style>{`@keyframes floatBg0{from{transform:translate(0,0) scale(1)}to{transform:translate(40px,30px) scale(1.1)}}@keyframes floatBg1{from{transform:translate(0,0) scale(1)}to{transform:translate(-50px,40px) scale(1.15)}}@keyframes floatBg2{from{transform:translate(0,0) scale(1)}to{transform:translate(30px,-40px) scale(1.05)}}@keyframes floatBg3{from{transform:translate(0,0) scale(1)}to{transform:translate(-30px,20px) scale(1.08)}}`}</style>
      </div>

      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 w-full relative z-[500]">
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                Welcome, {user?.name}
              </h1>
              <p className="text-sm text-teal-300 font-medium">
                {isIT ? 'IT Admin Panel' : 'Dashboard'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <NotificationsButton />
              
              <div className="bg-gray-800/50 rounded-xl px-1 py-1 hover:bg-gray-800 transition-colors shadow-sm">
                <UsersManagementButton canEditRoles={isIT} />
              </div>

              <div className="bg-gray-800/50 rounded-xl px-1 py-1 hover:bg-gray-800 transition-colors shadow-sm">
                <DownloadButtons tickets={tickets} />
              </div>
              
              <Button 
                variant="outline" 
                onClick={logout}
                className={`${expandibleClass} bg-red-600/20 text-red-400 border-red-600 hover:text-red-300 hover:bg-red-600/30 rounded-xl ml-1`}
              >
                <LogOut className="w-4 h-4" />
                <span className={textClass}>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full flex-grow p-4 md:p-8 relative z-10 flex flex-col gap-6">
        <div className="flex flex-col flex-grow">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide z-10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap flex-shrink-0 transition-all duration-300 shadow-sm rounded-xl px-4 py-2 h-auto ${
                    activeTab === tab.id 
                      ? 'bg-teal-500 text-gray-900 hover:bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)] border-transparent font-bold font-semibold cursor-default scale-105' 
                      : 'bg-gray-900/60 text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white hover:border-gray-500 hover:shadow-md'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          <Card className="w-full flex-grow border border-gray-700 shadow-lg bg-gray-900/80 backdrop-blur-sm overflow-hidden flex flex-col">
            <CardContent className="p-0 sm:p-4 md:p-6 w-full flex-grow flex flex-col">
              <div className="w-full h-full overflow-x-auto">
                {renderContent()}
              </div>
            </CardContent>
          </Card>
        </div>
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

