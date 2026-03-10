import { useState, useMemo } from 'react'; // Añadimos useMemo para optimizar
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LogOut, Plus, Clock, CheckCircle2, AlertCircle, Map, FilterX } from 'lucide-react';
import TicketForm from '../components/TicketForm';
import TicketDetailsModal from '../components/TicketDetailsModal';
import NotificationsButton from '../components/NotificationsButton';
import { Ticket } from '../types/ticket';

type FilterStatus = 'all' | 'in-progress' | 'resolved' | 'pending';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { tickets } = useTickets();
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
 
  const [filter, setFilter] = useState<FilterStatus>('all');

  const myTicketsBase = tickets.filter((ticket) => 
    String(ticket.createdBy) === String(user?.id)
  );

  const filteredTickets = useMemo(() => {
    if (filter === 'all') return myTicketsBase;
    return myTicketsBase.filter(t => t.status === filter);
  }, [myTicketsBase, filter]);

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const expandibleClass = "group flex items-center overflow-hidden transition-all duration-300 ease-in-out";
  const textClass = "max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs group-hover:ml-2";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
            </div>
            
            <div className="flex items-center gap-3">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* STATS / FILTER BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Botón Total */}
          <button 
            onClick={() => setFilter('all')}
            className={`text-left transition-all transform hover:scale-[1.02] active:scale-95 ${filter === 'all' ? 'ring-0 ring' : ''}`}
          >
            <Card className={filter === 'all' ? 'bg-white' : 'bg-white'}>
              <CardHeader className="pb-3 text-gray-600">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Total Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{myTicketsBase.length}</div>
              </CardContent>
            </Card>
          </button>

          {/* Botón In Progress */}
          <button 
            onClick={() => setFilter('in-progress')}
            className={`text-left transition-all transform hover:scale-[1.02] active:scale-95 ${filter === 'in-progress' ? 'ring-0 ring' : ''}`}
          >
            <Card className={filter === 'in-progress' ? 'bg-blue-50 border-blue-200' : 'bg-white'}>
              <CardHeader className="pb-3 text-blue-600">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {myTicketsBase.filter((t) => t.status === 'in-progress').length}
                </div>
              </CardContent>
            </Card>
          </button>

          {/* Botón Resolved */}
          <button 
            onClick={() => setFilter('resolved')}
            className={`text-left transition-all transform hover:scale-[1.02] active:scale-95 ${filter === 'resolved' ? 'ring-0 ring' : ''}`}
          >
            <Card className={filter === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-white'}>
              <CardHeader className="pb-3 text-green-600">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {myTicketsBase.filter((t) => t.status === 'resolved').length}
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* LISTA DE TICKETS */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {filter === 'all' ? 'Recent Tickets' : `Tickets: ${filter.replace('-', ' ')}`}
            </CardTitle>
           
          </CardHeader>
          <CardContent className="p-0">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 italic">No tickets found with this status.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
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
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modales se mantienen igual */}
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
          onClose={() => setSelectedTicket(null)}
          isAdmin={false}
        />
      )}
    </div>
  );
}