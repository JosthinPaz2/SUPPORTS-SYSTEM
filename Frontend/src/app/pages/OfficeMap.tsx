import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { AlertCircle, CheckCircle, ArrowLeft, User, Settings } from 'lucide-react';
import { useTickets } from '../context/TicketContext';
import { Ticket } from '../types/ticket';

// Desk definition based on the exact layout from the image
interface Desk {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'management' | 'store' | 'regular' | 'empty';
}

const desksLayout: Desk[] = [
  // LEFT SIDE - Column 1 (leftmost)
  { id: 'D-073', x: 35, y: 120, width: 28, height: 18 },
  { id: 'D-072', x: 35, y: 140, width: 28, height: 18 },
  { id: 'D-071', x: 35, y: 160, width: 28, height: 18 },
  { id: 'D-070', x: 35, y: 180, width: 28, height: 18 },
  { id: 'D-069', x: 35, y: 200, width: 28, height: 18 },
  { id: 'D-068', x: 35, y: 220, width: 28, height: 18 },
  { id: 'D-067', x: 35, y: 240, width: 28, height: 18 },
  
  // LEFT SIDE - Column 2
  { id: 'D-066', x: 66, y: 120, width: 28, height: 18 },
  { id: 'D-065', x: 66, y: 140, width: 28, height: 18 },
  { id: 'D-064', x: 66, y: 160, width: 28, height: 18 },
  { id: 'D-063', x: 66, y: 180, width: 28, height: 18 },
  { id: 'D-062', x: 66, y: 200, width: 28, height: 18 },
  { id: 'D-061', x: 66, y: 220, width: 28, height: 18 },
  { id: 'D-060', x: 66, y: 240, width: 28, height: 18 },
  
  // LEFT SIDE - Column 3
  { id: 'D-059', x: 122, y: 120, width: 28, height: 18 },
  { id: 'D-058', x: 122, y: 140, width: 28, height: 18 },
  { id: 'D-057', x: 122, y: 160, width: 28, height: 18 },
  { id: 'D-056', x: 122, y: 180, width: 28, height: 18 },
  { id: 'D-055', x: 122, y: 200, width: 28, height: 18 },
  { id: 'D-054', x: 122, y: 220, width: 28, height: 18 },
  
  // LEFT SIDE - Column 4
  { id: 'D-053', x: 153, y: 120, width: 28, height: 18 },
  { id: 'D-052', x: 153, y: 140, width: 28, height: 18 },
  { id: 'D-051', x: 153, y: 160, width: 28, height: 18 },
  { id: 'D-050', x: 153, y: 180, width: 28, height: 18 },
  { id: 'D-049', x: 153, y: 200, width: 28, height: 18 },
  { id: 'D-048', x: 153, y: 220, width: 28, height: 18 },
  { id: 'D-047', x: 153, y: 240, width: 28, height: 18 },
  { id: 'D-046', x: 153, y: 260, width: 28, height: 18 },
  
  // LEFT SIDE - Column 5
  { id: 'D-045', x: 209, y: 120, width: 28, height: 18 },
  { id: 'D-044', x: 209, y: 140, width: 28, height: 18 },
  { id: 'D-043', x: 209, y: 160, width: 28, height: 18 },
  { id: 'D-042', x: 209, y: 180, width: 28, height: 18 },
  { id: 'D-041', x: 209, y: 200, width: 28, height: 18 },
  { id: 'D-040', x: 209, y: 220, width: 28, height: 18 },
  { id: 'D-039', x: 209, y: 240, width: 28, height: 18 },
  { id: 'D-038', x: 209, y: 260, width: 28, height: 18 },
  
  // LEFT SIDE - Column 6
  { id: 'D-037', x: 240, y: 120, width: 28, height: 18 },
  { id: 'D-036', x: 240, y: 140, width: 28, height: 18 },
  { id: 'D-035', x: 240, y: 160, width: 28, height: 18 },
  { id: 'D-034', x: 240, y: 180, width: 28, height: 18 },
  { id: 'D-033', x: 240, y: 200, width: 28, height: 18 },
  { id: 'D-032', x: 240, y: 220, width: 28, height: 18 },
  { id: 'D-031', x: 240, y: 240, width: 28, height: 18 },
  { id: 'D-030', x: 240, y: 260, width: 28, height: 18 },
  
  // LEFT SIDE - Column 7
  { id: 'D-029', x: 296, y: 120, width: 28, height: 18 },
  { id: 'D-028', x: 296, y: 140, width: 28, height: 18 },
  { id: 'D-027', x: 296, y: 160, width: 28, height: 18 },
  { id: 'D-026', x: 296, y: 180, width: 28, height: 18 },
  { id: 'D-025', x: 296, y: 200, width: 28, height: 18 },
  { id: 'D-024', x: 296, y: 220, width: 28, height: 18 },
  { id: 'D-023', x: 296, y: 240, width: 28, height: 18 },
  { id: 'D-022', x: 296, y: 260, width: 28, height: 18 },
  
  // LEFT SIDE - Column 8
  { id: 'D-021', x: 327, y: 120, width: 28, height: 18 },
  { id: 'D-020', x: 327, y: 140, width: 28, height: 18 },
  { id: 'D-019', x: 327, y: 160, width: 28, height: 18 },
  { id: 'D-018', x: 327, y: 180, width: 28, height: 18 },
  { id: 'D-017', x: 327, y: 200, width: 28, height: 18 },
  { id: 'D-016', x: 327, y: 220, width: 28, height: 18 },
  
  // LEFT SIDE - Column 9
  { id: 'D-015', x: 383, y: 120, width: 28, height: 18 },
  { id: 'D-014', x: 383, y: 140, width: 28, height: 18 },
  { id: 'D-013', x: 383, y: 160, width: 28, height: 18 },
  { id: 'D-012', x: 383, y: 180, width: 28, height: 18 },
  { id: 'D-011', x: 383, y: 200, width: 28, height: 18 },
  { id: 'D-010', x: 383, y: 220, width: 28, height: 18 },
  
  // LEFT SIDE - Column 10
  { id: 'D-009', x: 414, y: 120, width: 28, height: 18 },
  { id: 'D-008', x: 414, y: 140, width: 28, height: 18 },
  { id: 'D-007', x: 414, y: 160, width: 28, height: 18 },
  { id: 'D-006', x: 414, y: 180, width: 28, height: 18 },
  { id: 'D-005', x: 414, y: 200, width: 28, height: 18 },
  { id: 'D-004', x: 414, y: 220, width: 28, height: 18 },
  { id: 'D-003', x: 414, y: 240, width: 28, height: 18 },
  { id: 'D-002', x: 414, y: 260, width: 28, height: 18 },
  { id: 'D-001', x: 414, y: 280, width: 28, height: 18 },

  // RIGHT SIDE - Top section (near STORE)
  // Row 1
  { id: 'R-001', x: 730, y: 120, width: 28, height: 18 },
  { id: 'R-002', x: 761, y: 120, width: 28, height: 18 },
  { id: 'R-003', x: 792, y: 120, width: 28, height: 18 },
  { id: 'R-004', x: 823, y: 120, width: 28, height: 18 },
  { id: 'R-005', x: 854, y: 120, width: 28, height: 18 },
  { id: 'R-006', x: 885, y: 120, width: 28, height: 18 },
  { id: 'R-007', x: 916, y: 120, width: 28, height: 18 },
  
  // Row 2
  { id: 'R-008', x: 730, y: 141, width: 28, height: 18 },
  { id: 'R-009', x: 761, y: 141, width: 28, height: 18 },
  { id: 'R-010', x: 792, y: 141, width: 28, height: 18 },
  { id: 'R-011', x: 823, y: 141, width: 28, height: 18 },
  { id: 'R-012', x: 854, y: 141, width: 28, height: 18 },
  { id: 'R-013', x: 885, y: 141, width: 28, height: 18 },
  { id: 'R-014', x: 916, y: 141, width: 28, height: 18 },
  
  // Row 3
  { id: 'R-015', x: 730, y: 162, width: 28, height: 18 },
  { id: 'R-016', x: 761, y: 162, width: 28, height: 18 },
  { id: 'R-017', x: 792, y: 162, width: 28, height: 18 },
  { id: 'R-018', x: 823, y: 162, width: 28, height: 18 },
  { id: 'R-019', x: 854, y: 162, width: 28, height: 18 },
  { id: 'R-020', x: 885, y: 162, width: 28, height: 18 },
  
  // RIGHT SIDE - Section 2
  // Row 4
  { id: 'R-021', x: 730, y: 238, width: 28, height: 18 },
  { id: 'R-022', x: 761, y: 238, width: 28, height: 18 },
  { id: 'R-023', x: 792, y: 238, width: 28, height: 18 },
  { id: 'R-024', x: 823, y: 238, width: 28, height: 18 },
  { id: 'R-025', x: 854, y: 238, width: 28, height: 18 },
  { id: 'R-026', x: 885, y: 238, width: 28, height: 18 },
  { id: 'R-027', x: 916, y: 238, width: 28, height: 18 },
  
  // Row 5
  { id: 'R-028', x: 730, y: 259, width: 28, height: 18 },
  { id: 'R-029', x: 761, y: 259, width: 28, height: 18 },
  { id: 'R-030', x: 792, y: 259, width: 28, height: 18 },
  { id: 'R-031', x: 823, y: 259, width: 28, height: 18 },
  { id: 'R-032', x: 854, y: 259, width: 28, height: 18 },
  { id: 'R-033', x: 885, y: 259, width: 28, height: 18 },
  { id: 'R-034', x: 916, y: 259, width: 28, height: 18 },
  
  // RIGHT SIDE - Section 3
  // Row 6
  { id: 'R-035', x: 730, y: 310, width: 28, height: 18 },
  { id: 'R-036', x: 761, y: 310, width: 28, height: 18 },
  { id: 'R-037', x: 792, y: 310, width: 28, height: 18 },
  { id: 'R-038', x: 823, y: 310, width: 28, height: 18 },
  { id: 'R-039', x: 854, y: 310, width: 28, height: 18 },
  { id: 'R-040', x: 885, y: 310, width: 28, height: 18 },
  
  // RIGHT SIDE - Section 4
  // Row 7
  { id: 'R-041', x: 730, y: 380, width: 28, height: 18 },
  { id: 'R-042', x: 761, y: 380, width: 28, height: 18 },
  { id: 'R-043', x: 792, y: 380, width: 28, height: 18 },
  { id: 'R-044', x: 823, y: 380, width: 28, height: 18 },
  { id: 'R-045', x: 854, y: 380, width: 28, height: 18 },
  { id: 'R-046', x: 885, y: 380, width: 28, height: 18 },
  { id: 'R-047', x: 916, y: 380, width: 28, height: 18 },
  
  // RIGHT SIDE - Section 5
  // Row 8
  { id: 'R-048', x: 730, y: 430, width: 28, height: 18 },
  { id: 'R-049', x: 761, y: 430, width: 28, height: 18 },
  { id: 'R-050', x: 792, y: 430, width: 28, height: 18 },
  { id: 'R-051', x: 823, y: 430, width: 28, height: 18 },
  { id: 'R-052', x: 854, y: 430, width: 28, height: 18 },
  { id: 'R-053', x: 885, y: 430, width: 28, height: 18 },
  { id: 'R-054', x: 916, y: 430, width: 28, height: 18 },
  
  // RIGHT SIDE - Section 6
  // Row 9
  { id: 'R-055', x: 730, y: 480, width: 28, height: 18 },
  { id: 'R-056', x: 761, y: 480, width: 28, height: 18 },
  { id: 'R-057', x: 792, y: 480, width: 28, height: 18 },
  { id: 'R-058', x: 823, y: 480, width: 28, height: 18 },
  { id: 'R-059', x: 854, y: 480, width: 28, height: 18 },
  { id: 'R-060', x: 885, y: 480, width: 28, height: 18 },
  { id: 'R-061', x: 916, y: 480, width: 28, height: 18 },
  
  // RIGHT SIDE - Section 7
  // Row 10
  { id: 'R-062', x: 730, y: 540, width: 28, height: 18 },
  { id: 'R-063', x: 761, y: 540, width: 28, height: 18 },
  { id: 'R-064', x: 792, y: 540, width: 28, height: 18 },
  { id: 'R-065', x: 823, y: 540, width: 28, height: 18 },
  { id: 'R-066', x: 854, y: 540, width: 28, height: 18 },
  { id: 'R-067', x: 885, y: 540, width: 28, height: 18 },
  { id: 'R-068', x: 916, y: 540, width: 28, height: 18 },
  
  // RIGHT SIDE - Section 8
  // Row 11
  { id: 'R-069', x: 730, y: 590, width: 28, height: 18 },
  { id: 'R-070', x: 761, y: 590, width: 28, height: 18 },
  { id: 'R-071', x: 792, y: 590, width: 28, height: 18 },
  { id: 'R-072', x: 823, y: 590, width: 28, height: 18 },
  { id: 'R-073', x: 854, y: 590, width: 28, height: 18 },
  { id: 'R-074', x: 885, y: 590, width: 28, height: 18 },
  { id: 'R-075', x: 916, y: 590, width: 28, height: 18 },
  
  // BOTTOM SECTION (near entrance - blue area)
  // Row 12
  { id: 'E-001', x: 730, y: 690, width: 28, height: 18 },
  { id: 'E-002', x: 761, y: 690, width: 28, height: 18 },
  { id: 'E-003', x: 792, y: 690, width: 28, height: 18 },
  { id: 'E-004', x: 823, y: 690, width: 28, height: 18 },
  { id: 'E-005', x: 854, y: 690, width: 28, height: 18 },
  { id: 'E-006', x: 885, y: 690, width: 28, height: 18 },
  { id: 'E-007', x: 916, y: 690, width: 28, height: 18 },
];

export default function OfficeMap() {
  const navigate = useNavigate();
  const { tickets } = useTickets();
  const [selectedDesk, setSelectedDesk] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [hoveredDesk, setHoveredDesk] = useState<string | null>(null);
  const [, setShowImporter] = useState(false);

  // Filter pending and in-progress tickets by location
  const getTicketsForDesk = (deskId: string): Ticket[] => {
    return tickets.filter(
      (ticket) =>
        ticket.location === deskId &&
        (ticket.status === 'pending' || ticket.status === 'in-progress')
    );
  };

  const handleDeskClick = (deskId: string) => {
    setSelectedDesk(deskId);
    setShowDialog(true);
  };

  const selectedDeskData = desksLayout.find(d => d.id === selectedDesk);
  const selectedDeskTickets = selectedDesk ? getTicketsForDesk(selectedDesk) : [];

  // Count desks with issues
  const desksWithIssues = desksLayout.filter(
    (desk) => getTicketsForDesk(desk.id).length > 0
  ).length;

  const totalDesks = desksLayout.length;

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Office Map - Desk Layout
            </h1>
            <p className="text-gray-600">
              Overview of all desks and active reports
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Desks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalDesks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                With Active Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{desksWithIssues}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                No Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {totalDesks - desksWithIssues}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Legend</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowImporter(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Gestionar Layout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 border border-gray-400 rounded"></div>
              <span className="text-sm">No issues</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 border border-gray-400 rounded"></div>
              <span className="text-sm">With active reports</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 border border-gray-400 rounded"></div>
              <span className="text-sm">Management / Store area</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 border border-gray-400 rounded"></div>
              <span className="text-sm">Entrance area</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-700" />
              <span className="text-sm">Click on any desk to view details</span>
            </div>
          </CardContent>
        </Card>

        {/* Office map */}
        <Card>
          <CardHeader>
            <CardTitle>Office Floor Plan</CardTitle>
            <CardDescription>
              {desksLayout.length} desks mapped - Click on any desk for information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-6 overflow-x-auto">
              <svg
                viewBox="0 0 1000 750"
                className="w-full"
                style={{ minWidth: '900px' }}
              >
                {/* Background areas */}
                {/* Left gray area */}
                <rect x="20" y="100" width="450" height="220" fill="#6b7280" opacity="0.3" />
                
                {/* Right gray area */}
                <rect x="710" y="85" width="260" height="640" fill="#6b7280" opacity="0.3" />
                
                {/* White central area (hallway) */}
                <rect x="480" y="140" width="220" height="540" fill="white" stroke="#9ca3af" strokeWidth="2" />
                
                {/* Blue entrance area */}
                <rect x="710" y="670" width="260" height="50" fill="#3b82f6" opacity="0.5" rx="4" />
                <text x="840" y="697" textAnchor="middle" fill="#1e40af" fontSize="14" fontWeight="bold">
                  ENTRANCE
                </text>
                
                {/* Yellow Management area */}
                <rect x="525" y="15" width="105" height="45" fill="#fbbf24" rx="4" />
                <text x="577" y="32" textAnchor="middle" fill="#78350f" fontSize="11" fontWeight="bold">
                  MANAGE-
                </text>
                <text x="577" y="45" textAnchor="middle" fill="#78350f" fontSize="11" fontWeight="bold">
                  MENT
                </text>
                
                {/* Yellow Store area */}
                <rect x="845" y="15" width="105" height="45" fill="#fbbf24" rx="4" />
                <text x="897" y="42" textAnchor="middle" fill="#78350f" fontSize="14" fontWeight="bold">
                  STORE
                </text>

                {/* Draw all desks */}
                {desksLayout.map((desk) => {
                  const hasIssues = getTicketsForDesk(desk.id).length > 0;
                  const ticketCount = getTicketsForDesk(desk.id).length;
                  const isHovered = hoveredDesk === desk.id;
                  
                  return (
                    <g key={desk.id}>
                      {/* Desk rectangle */}
                      <rect
                        x={desk.x}
                        y={desk.y}
                        width={desk.width}
                        height={desk.height}
                        fill={hasIssues ? '#ef4444' : '#22c55e'}
                        stroke={isHovered ? '#1f2937' : '#374151'}
                        strokeWidth={isHovered ? '2' : '1'}
                        rx="2"
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          opacity: isHovered ? 1 : 0.9
                        }}
                        onClick={() => handleDeskClick(desk.id)}
                        onMouseEnter={() => setHoveredDesk(desk.id)}
                        onMouseLeave={() => setHoveredDesk(null)}
                      />
                      
                      {/* Desk ID */}
                      <text
                        x={desk.x + desk.width / 2}
                        y={desk.y + desk.height / 2 + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="7"
                        fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                      >
                        {desk.id}
                      </text>
                      
                      {/* Ticket count indicator */}
                      {hasIssues && (
                        <>
                          <circle
                            cx={desk.x + desk.width - 5}
                            cy={desk.y + 5}
                            r="5"
                            fill="#7f1d1d"
                            stroke="white"
                            strokeWidth="1"
                            style={{ pointerEvents: 'none' }}
                          />
                          <text
                            x={desk.x + desk.width - 5}
                            y={desk.y + 5}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize="7"
                            fontWeight="bold"
                            style={{ pointerEvents: 'none' }}
                          >
                            {ticketCount}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Desk details dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Desk {selectedDeskData?.id}
              </DialogTitle>
              <DialogDescription>
                Desk location and status information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedDeskTickets.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-900">
                    No Active Reports
                  </p>
                  <p className="text-gray-600">
                    This desk has no reported issues
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="font-medium">
                      {selectedDeskTickets.length} active report(s)
                    </span>
                  </div>
                  {selectedDeskTickets.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {ticket.title}
                            </CardTitle>
                            <CardDescription className="text-sm mt-1">
                              Ticket #{ticket.id} • Created {formatDateTime(ticket.createdAt)}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <Badge
                              variant={
                                ticket.status === 'pending'
                                  ? 'secondary'
                                  : ticket.status === 'in-progress'
                                  ? 'default'
                                  : 'outline'
                              }
                            >
                              {ticket.status === 'pending' && 'Pending'}
                              {ticket.status === 'in-progress' && 'In Progress'}
                              {ticket.status === 'resolved' && 'Resolved'}
                            </Badge>
                            <Badge
                              variant={
                                ticket.priority === 'high'
                                  ? 'destructive'
                                  : ticket.priority === 'medium'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {ticket.priority === 'high' && 'High'}
                              {ticket.priority === 'medium' && 'Medium'}
                              {ticket.priority === 'low' && 'Low'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">{ticket.description}</p>
                        <div className="flex gap-4 mt-3 text-xs text-gray-500">
                          <span>Category: {ticket.category}</span>
                          <span>Reported by: {ticket.reportedBy}</span>
                        </div>
                        {ticket.assignedToName && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span>Assigned to: {ticket.assignedToName}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
