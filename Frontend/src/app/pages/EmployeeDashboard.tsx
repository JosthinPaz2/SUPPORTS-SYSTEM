import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LogOut, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import TicketForm from '../components/TicketForm';
import TicketDetailsModal from '../components/TicketDetailsModal';
import { Ticket } from '../types/ticket';

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const { tickets } = useTickets();
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const myTickets = tickets.filter((ticket) => 
    String(ticket.createdBy) === String(user?.id)
  );

  const handleCloseForm = () => {
    setShowForm(false);
  };

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
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3 text-gray-600">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Total Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{myTickets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3 text-blue-600">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" /> In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {myTickets.filter((t) => t.status === 'in-progress').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3 text-green-600">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {myTickets.filter((t) => t.status === 'resolved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LISTA DE TICKETS AÑADIDA */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-lg">Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {myTickets.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 italic">You haven't created any tickets yet.</p>
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
                    {myTickets.map((ticket) => (
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