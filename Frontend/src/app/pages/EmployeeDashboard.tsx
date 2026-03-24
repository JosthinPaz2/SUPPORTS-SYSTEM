import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LogOut, Plus, Clock, CheckCircle2, AlertCircle, Map } from 'lucide-react';
import TicketForm from '../components/TicketForm';
import TicketDetailsModal from '../components/TicketDetailsModal';
import NotificationsButton from '../components/NotificationsButton';
import { Ticket } from '../types/ticket';

type FilterStatus = 'all' | 'in-progress' | 'resolved' | 'pending';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { tickets } = useTickets();
  const [showForm, setShowForm] = useState(false);
  const [manualSelectedTicket, setManualSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const myTicketsBase = tickets.filter((ticket) => 
    String(ticket.createdBy) === String(user?.id)
  );

  const filteredTickets = useMemo(() => {
    if (filter === 'all') return myTicketsBase;
    return myTicketsBase.filter(t => t.status === filter);
  }, [myTicketsBase, filter]);

  const querySelectedTicket = useMemo(() => {
    const ticketId = searchParams.get('ticketId');
    if (!ticketId) return null;
    return myTicketsBase.find((ticket) => String(ticket.id) === String(ticketId)) ?? null;
  }, [searchParams, myTicketsBase]);

  const selectedTicket = manualSelectedTicket ?? querySelectedTicket;

  const handleCloseForm = () => setShowForm(false);

  const handleCloseTicketModal = () => {
    setManualSelectedTicket(null);
    if (searchParams.has('ticketId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('ticketId');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const expandibleClass = "group flex items-center overflow-hidden transition-all duration-300 ease-in-out";
  const textClass = "max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs group-hover:ml-2";

  return (
    /* 1. Cambio a w-full para ocupar todo el ancho del computador */
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      <header className="bg-white border-b w-full">
        {/* 2. Eliminado max-w-7xl para diseño fluido */}
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
              <p className="text-sm text-gray-600">My Tickets</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/OfficeMap?viewOnly=true')}
                className={expandibleClass}
              >
                <Map className="w-4 h-4" />
                <span className={textClass}>Office Map</span>
              </Button>

              <Button 
                onClick={() => setShowForm(true)}
                className={`${expandibleClass} bg-black hover:bg-black/90 text-white`}
              >
                <Plus className="w-4 h-4" />
                <span className={textClass}>New Ticket</span>
              </Button>

              <NotificationsButton />

              <Button 
                variant="outline" 
                onClick={logout}
                className={`${expandibleClass} hover:bg-red-50 hover:text-red-600 border-gray-200`}
              >
                <LogOut className="w-4 h-4" />
                <span className={textClass}>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main al 100% del ancho */}
      <main className="w-full flex-grow p-4 md:p-8">
        
        {/* STATS: Ajustadas para que nunca se amontonen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* Botón Total */}
          <button onClick={() => setFilter('all')} className="text-left transition-transform active:scale-95">
            <Card className={`h-full ${filter === 'all' ? 'ring-2 ring-black' : ''}`}>
              <CardHeader className="pb-2 text-gray-600">
                <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Total Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold">{myTicketsBase.length}</div>
              </CardContent>
            </Card>
          </button>

          {/* Botón In Progress */}
          <button onClick={() => setFilter('in-progress')} className="text-left transition-transform active:scale-95">
            <Card className={`h-full ${filter === 'in-progress' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-2 text-blue-600">
                <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold">
                  {myTicketsBase.filter((t) => t.status === 'in-progress').length}
                </div>
              </CardContent>
            </Card>
          </button>

          {/* Botón Resolved */}
          <button onClick={() => setFilter('resolved')} className="text-left transition-transform active:scale-95">
            <Card className={`h-full ${filter === 'resolved' ? 'bg-green-50 border-green-200 ring-2 ring-green-500' : ''}`}>
              <CardHeader className="pb-2 text-green-600">
                <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold">
                  {myTicketsBase.filter((t) => t.status === 'resolved').length}
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* LISTA DE TICKETS FLUIDA */}
        <Card className="w-full overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-lg">
              {filter === 'all' ? 'Recent Tickets' : `Tickets: ${filter.replace('-', ' ')}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              {filteredTickets.length === 0 ? (
                <div className="p-12 text-center text-gray-500 italic">
                  No tickets found with this status.
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                      <th className="px-6 py-3 border-b">Title</th>
                      <th className="px-6 py-3 border-b">Status</th>
                      <th className="px-6 py-3 border-b">Date</th>
                      <th className="px-6 py-3 border-b text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{ticket.title}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : 
                              ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                              'bg-amber-100 text-amber-800'}`}>
                            {ticket.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setManualSelectedTicket(ticket)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modales */}
      {showForm && (
        <TicketForm
          onClose={handleCloseForm}
          userId={user?.id ? String(user.id) : ''}
          userName={user?.name || ''}
        />
      )}

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={handleCloseTicketModal}
          isAdmin={false}
        />
      )}
    </div>
  );
}