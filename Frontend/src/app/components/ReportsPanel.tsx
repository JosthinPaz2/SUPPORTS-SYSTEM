import { useTickets } from '../context/TicketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = {
  pending: '#fbbf24',
  'in-progress': '#3b82f6',
  resolved: '#10b981',
  hardware: '#8b5cf6',
  software: '#ec4899',
  other: '#f97316',
};

export default function ReportsPanel() {
  const { tickets } = useTickets();

  // Estadísticas por estado
  const byStatus = {
    pending: tickets.filter((t) => t.status === 'pending').length,
    'in-progress': tickets.filter((t) => t.status === 'in-progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  const statusData = [
    { name: 'Pending', value: byStatus.pending, color: COLORS.pending },
    { name: 'In Progress', value: byStatus['in-progress'], color: COLORS['in-progress'] },
    { name: 'Resolved', value: byStatus.resolved, color: COLORS.resolved },
  ];

  // Estadísticas por categoría
  const byCategory = {
    hardware: tickets.filter((t) => t.category === 'hardware').length,
    software: tickets.filter((t) => t.category === 'software').length,
    other: tickets.filter((t) => t.category === 'other').length,
  };

  const categoryData = [
    { name: 'Hardware', value: byCategory.hardware, color: COLORS.hardware },
    { name: 'Software', value: byCategory.software, color: COLORS.software },
    { name: 'Other', value: byCategory.other, color: COLORS.other },
  ];

  // Estadísticas por prioridad
  const byPriority = {
    high: tickets.filter((t) => t.priority === 'high').length,
    medium: tickets.filter((t) => t.priority === 'medium').length,
    low: tickets.filter((t) => t.priority === 'low').length,
  };

  const priorityData = [
    { name: 'High', Tickets: byPriority.high },
    { name: 'Medium', Tickets: byPriority.medium },
    { name: 'Low', Tickets: byPriority.low },
  ];

  // Tickets por estado y categoría
  const statusCategoryData = [
    {
      category: 'Hardware',
      Pending: tickets.filter((t) => t.category === 'hardware' && t.status === 'pending').length,
      'In Progress': tickets.filter((t) => t.category === 'hardware' && t.status === 'in-progress').length,
      Resolved: tickets.filter((t) => t.category === 'hardware' && t.status === 'resolved').length,
    },
    {
      category: 'Software',
      Pending: tickets.filter((t) => t.category === 'software' && t.status === 'pending').length,
      'In Progress': tickets.filter((t) => t.category === 'software' && t.status === 'in-progress').length,
      Resolved: tickets.filter((t) => t.category === 'software' && t.status === 'resolved').length,
    },
    {
      category: 'Other',
      Pending: tickets.filter((t) => t.category === 'other' && t.status === 'pending').length,
      'In Progress': tickets.filter((t) => t.category === 'other' && t.status === 'in-progress').length,
      Resolved: tickets.filter((t) => t.category === 'other' && t.status === 'resolved').length,
    },
  ];

  // Tickets más recientes
  const recentTickets = [...tickets]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {byStatus.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {byStatus['in-progress']}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {byStatus.resolved}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tickets por Prioridad */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Tickets" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Estado por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Status by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Pending" fill={COLORS.pending} />
                <Bar dataKey="In Progress" fill={COLORS['in-progress']} />
                <Bar dataKey="Resolved" fill={COLORS.resolved} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Most Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{ticket.title}</h4>
                  <p className="text-sm text-gray-600">
                    {ticket.createdByName} - {formatDateTime(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 capitalize">
                    {ticket.category}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ticket.status === 'pending' ? 'Pending' :
                     ticket.status === 'in-progress' ? 'In Progress' :
                     'Resolved'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}