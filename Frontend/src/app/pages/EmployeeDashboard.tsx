import { useState, useMemo, useEffect, useRef  } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LogOut, Plus, Clock, CheckCircle2, AlertCircle, ChevronDown, FilePlus2, Map } from 'lucide-react';
import TicketForm from '../components/TicketForm';
import TicketDetailsModal from '../components/TicketDetailsModal';
import NotificationsButton from '../components/NotificationsButton';
import { Ticket } from '../types/ticket';
import { formatBogotaDate } from '../utils/datetime';

type FilterStatus = 'all' | 'in-progress' | 'resolved' | 'pending';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { tickets } = useTickets();
  const [showForm, setShowForm] = useState(false);
  const [manualSelectedTicket, setManualSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
 // Estado del menu desplegable de Create Ticket (nuevo comportamiento visual).
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
      // Cierra el menu al hacer click fuera del boton/lista.
      function handleClickOutside(event: MouseEvent) {
        if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
          setIsCreateMenuOpen(false);
        }
      }
  
      // Mejora UX: permite cerrar el menu con tecla Escape.
      function handleEscape(event: KeyboardEvent) {
        if (event.key === 'Escape') {
          setIsCreateMenuOpen(false);
        }
      }
  
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, []);
  
    const openMapTicketFlow = () => {
      setIsCreateMenuOpen(false);
      // Se conserva la funcionalidad original: abrir OfficeMap en modo solo lectura.
      navigate('/OfficeMap?viewOnly=true');
    };
  
    const openFormTicketFlow = () => {
      setIsCreateMenuOpen(false);
      // Se conserva la funcionalidad original: abrir modal de TicketForm.
      setShowForm(true);
    };
  

    // Clases compartidas de animacion expandible usadas en botones del header.
  const expandibleClass = "group flex items-center overflow-hidden transition-all duration-300 ease-in-out";
  const textClass = "max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs group-hover:ml-2";

  return (
    /* 1. Cambio a w-full para ocupar todo el ancho del computador */
    <div className="min-h-screen w-full bg-[linear-gradient(160deg,#f7fafc_0%,#eef4ff_55%,#f9fbff_100%)] flex flex-col">
      {/* Animated background — fixed so it shows through scroll */}
      <div aria-hidden="true" style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden',background:'radial-gradient(ellipse at 20% 50%, rgba(20,184,166,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.10) 0%, transparent 55%), #030712'}}>
        <div style={{position:'absolute',borderRadius:'50%',filter:'blur(80px)',width:500,height:500,top:'5%',left:'10%',background:'rgba(20,184,166,0.13)',animation:'floatBg0 18s ease-in-out infinite alternate'}}/>
        <div style={{position:'absolute',borderRadius:'50%',filter:'blur(80px)',width:350,height:350,top:'60%',left:'70%',background:'rgba(59,130,246,0.10)',animation:'floatBg1 24s ease-in-out infinite alternate'}}/>
        <div style={{position:'absolute',borderRadius:'50%',filter:'blur(80px)',width:250,height:250,top:'80%',left:'15%',background:'rgba(20,184,166,0.08)',animation:'floatBg2 30s ease-in-out infinite alternate'}}/>
        <div style={{position:'absolute',borderRadius:'50%',filter:'blur(80px)',width:400,height:400,top:'20%',left:'60%',background:'rgba(99,102,241,0.08)',animation:'floatBg3 20s ease-in-out infinite alternate'}}/>
        <style>{`@keyframes floatBg0{from{transform:translate(0,0) scale(1)}to{transform:translate(40px,30px) scale(1.1)}}@keyframes floatBg1{from{transform:translate(0,0) scale(1)}to{transform:translate(-50px,40px) scale(1.15)}}@keyframes floatBg2{from{transform:translate(0,0) scale(1)}to{transform:translate(30px,-40px) scale(1.05)}}@keyframes floatBg3{from{transform:translate(0,0) scale(1)}to{transform:translate(-30px,20px) scale(1.08)}}`}</style>
      </div>
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 w-full relative z-500">
        {/* 2. Eliminado max-w-7xl para diseño fluido */}
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Welcome, {user?.name}</h1>
              <p className="text-sm text-teal-300">My Tickets</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
                 {/* Boton principal con menu: mantiene funcionalidad antigua con UI mejorada. */}
              <div className="relative" ref={createMenuRef}>
                <Button
                  onClick={() => setIsCreateMenuOpen((prev) => !prev)}
                  className={`${expandibleClass} h-10 rounded-xl px-4 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] text-white shadow-[0_10px_22px_-12px_rgba(15,23,42,0.7)] hover:shadow-[0_14px_30px_-12px_rgba(15,23,42,0.8)]`}
                  aria-haspopup="menu"
                  aria-expanded={isCreateMenuOpen}
                >
                  <Plus className="w-4 h-4" />
                  <span className={textClass}>Create Ticket</span>
                  <ChevronDown className={`w-4 h-4 transition-all duration-300 group-hover:ml-2 ${isCreateMenuOpen ? 'rotate-180' : ''}`} />
                </Button>

              {/* Boton principal con menu: mantiene funcionalidad antigua con UI mejorada. */}
        <div
                className={`absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl 
                border border-slate-700/80 bg-slate-900/90 backdrop-blur-md p-2 
                shadow-2xl shadow-black/50 transition-all duration-300 
                ${isCreateMenuOpen 
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                  : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}
                role="menu"
                aria-label="Create ticket options"
              >

                {/* OPCIÓN 1 */}
                <button
                  type="button"
                  onClick={openMapTicketFlow}
                  className="group w-full text-left rounded-xl px-3 py-3 transition-all duration-300
                            bg-transparent 
                            hover:bg-slate-800/70 
                            border border-transparent hover:border-slate-600/60
                            hover:shadow-md hover:shadow-slate-900/50"
                  role="menuitem"
                >
                  <span className="flex items-start gap-3">
      
                  {/* ICON */}
                  <span className="mt-0.5 inline-flex items-center justify-center rounded-lg 
                                   bg-sky-500/10 text-sky-400 
                                   group-hover:bg-sky-500/20 group-hover:text-sky-300
                                   transition-all duration-300 p-2">
                    <Map className="w-4 h-4" />
                  </span>

                  {/* TEXT */}
                  <span>
                    <span className="block text-sm font-semibold text-slate-200 
                                    group-hover:text-white transition-colors duration-300">
                      From Office Map
                    </span>
                    <span className="block text-xs text-slate-400 
                                    group-hover:text-slate-300 transition-colors duration-300">
                      Choose desk/location and report the issue from the map.
                    </span>
                  </span>
                </span>
              </button>

                {/* OPCIÓN 2 */}
                <button
                  type="button"
                  onClick={openFormTicketFlow}
                  className="group mt-1 w-full text-left rounded-xl px-3 py-3 transition-all duration-300
                             bg-transparent 
                             hover:bg-slate-800/70 
                             border border-transparent hover:border-slate-600/60
                             hover:shadow-md hover:shadow-slate-900/50"
                  role="menuitem"
                >
                <span className="flex items-start gap-3">

                {/* ICON */}
                <span className="mt-0.5 inline-flex items-center justify-center rounded-lg 
                                bg-indigo-500/10 text-indigo-400 
                                group-hover:bg-indigo-500/20 group-hover:text-indigo-300
                                transition-all duration-300 p-2">
                  <FilePlus2 className="w-4 h-4" />
                </span>

                      {/* TEXT */}
                      <span>
                        <span className="block text-sm font-semibold text-slate-200 
                                        group-hover:text-white transition-colors duration-300">
                          Quick Form
                        </span>
                        <span className="block text-xs text-slate-400 
                                        group-hover:text-slate-300 transition-colors duration-300">
                          Open the classic form to create the ticket manually.
                        </span>
                      </span>               
                    </span>
                  </button>
                </div>
              </div>

              <NotificationsButton />

              <Button 
                variant="outline" 
                onClick={logout}
                className={`${expandibleClass} bg-red-600/20 text-red-400 border-red-600 hover:text-red-300 hover:bg-red-600/30`}
              >
                <LogOut className="w-4 h-4" />
                <span className={textClass}>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main al 100% del ancho */}
      <main className="w-full flex-grow p-4 md:p-8 relative z-10">
        
        {/* STATS: Ajustadas para que nunca se amontonen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* Botón Total */}
          <button onClick={() => setFilter('all')} className="text-left transition-transform active:scale-95">
            <Card className={`h-full bg-gray-900 border-gray-700 text-white ${filter === 'all' ? 'ring-2 ring-teal-500' : ''}`}>
              <CardHeader className="pb-2 text-teal-300">
                <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Total Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-white">{myTicketsBase.length}</div>
              </CardContent>
            </Card>
          </button>

          {/* Botón In Progress */}
          <button onClick={() => setFilter('in-progress')} className="text-left transition-transform active:scale-95">
            <Card className={`h-full bg-gray-900 border-gray-700 ${filter === 'in-progress' ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-2 text-blue-400">
                <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-white">
                  {myTicketsBase.filter((t) => t.status === 'in-progress').length}
                </div>
              </CardContent>
            </Card>
          </button>

          {/* Botón Resolved */}
          <button onClick={() => setFilter('resolved')} className="text-left transition-transform active:scale-95">
            <Card className={`h-full bg-gray-900 border-gray-700 ${filter === 'resolved' ? 'ring-2 ring-green-500' : ''}`}>
              <CardHeader className="pb-2 text-green-400">
                <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-white">
                  {myTicketsBase.filter((t) => t.status === 'resolved').length}
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* LISTA DE TICKETS FLUIDA */}
        {/* LISTA DE TICKETS FLUIDA */}
        <Card className="w-full overflow-hidden shadow-sm bg-gray-900 border-gray-700">
          <CardHeader className="border-b border-gray-700 bg-gray-900">
            <CardTitle className="text-lg text-white">
              {filter === 'all' ? 'Recent Tickets' : `Tickets: ${filter.replace('-', ' ')}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              {filteredTickets.length === 0 ? (
                <div className="p-12 text-center text-gray-400 italic">
                  No tickets found with this status.
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-800 text-xs uppercase text-gray-400 font-semibold">
                      <th className="px-6 py-3 border-b border-gray-700">Title</th>
                      <th className="px-6 py-3 border-b border-gray-700">Status</th>
                      <th className="px-6 py-3 border-b border-gray-700">Date</th>
                      <th className="px-6 py-3 border-b border-gray-700 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-100">{ticket.title}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : 
                              ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                              'bg-amber-100 text-amber-800'}`}>
                            {ticket.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatBogotaDate(ticket.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-right">
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