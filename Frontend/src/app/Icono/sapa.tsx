import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Upload, Search, GripVertical, RotateCw, LayoutGrid, Package } from 'lucide-react';

export default function OfficeMap() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [search, setSearch] = useState('');
  const [desks, setDesks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'objects'>('inventory');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);

  const CANVAS_WIDTH = 2400;
  const CANVAS_HEIGHT = 5000;

  // 1. SE AGREGÓ EL OBJETO 'FRAME' AQUÍ
  const [defaultObjects] = useState([
    { id: 'GRAY-ZONE', type: 'zone', width: 600, height: 400, placed: false },
    { id: 'FRAME-OBJECT', type: 'frame', width: 300, height: 600, placed: false },
    { id: 'STORE-AREA', type: 'store', width: 200, height: 100, placed: false },
    { id: 'MANAGEMENT', type: 'management', width: 180, height: 80, placed: false },
    { id: 'ENTRANCE', type: 'entrance', width: 150, height: 60, placed: false },
  ]);

  const stats = {
    total: desks.filter(d => d.type === 'desk').length,
    reports: desks.filter(d => d.hasReport).length,
    noIssues: desks.filter(d => d.type === 'desk' && !d.hasReport).length
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1);
      const parsed = rows.map((row, index) => {
        const [id, x, y, width, height, type] = row.split(',');
        return {
          id: id?.trim() || `D-${100 + index + desks.length}`,
          x: x && x.trim() !== "" ? Number(x) : null,
          y: y && y.trim() !== "" ? Number(y) : null,
          width: Number(width) || 80,
          height: Number(height) || 50,
          type: type?.trim() || 'desk',
          placed: !!(x && x.trim() !== ""),
          hasReport: Math.random() > 0.9
        };
      });
      setDesks(prev => [...prev, ...parsed]);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const rotateItem = (id: string) => {
    setDesks(prev => prev.map(d => d.id === id ? { ...d, width: d.height, height: d.width } : d));
  };

  const handleSvgDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("objectData"));
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (data.isDefault) {
      const newObj = { ...data, id: `${data.id}-${Date.now()}`, x: x - data.width/2, y: y - data.height/2, placed: true };
      setDesks(prev => [...prev, newObj]);
    } else {
      setDesks(prev => prev.map(d => d.id === data.id ? { ...d, x: x - d.width/2, y: y - d.height/2, placed: true } : d));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggingId) {
      setDesks(prev => prev.map(d => d.id === draggingId ? { ...d, x: mouseX - d.width / 2, y: mouseY - d.height / 2 } : d));
    }
    if (resizingId) {
      setDesks(prev => prev.map(d => d.id === resizingId ? { ...d, width: Math.max(40, mouseX - d.x), height: Math.max(40, mouseY - d.y) } : d));
    }
  };

  // 2. SE CORRIGIÓ LA SEPARACIÓN DE CAPAS (Zonas y Marcos van abajo)
  const bgLayers = desks.filter(d => d.placed && (d.type === 'zone' || d.type === 'frame'));
  const items = desks.filter(d => d.placed && d.type !== 'zone' && d.type !== 'frame');
  const inventory = desks.filter(d => !d.placed && d.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans select-none overflow-y-auto" onMouseUp={() => { setDraggingId(null); setResizingId(null); }}>
      <div className="max-w-[1700px] mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Office Map Pro</h1>
            <p className="text-slate-500 text-sm">Gestiona zonas y escritorios importados</p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)} className="rounded-lg bg-white border-slate-200 shadow-sm font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="p-6 border-none shadow-sm flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Desks</span>
            <span className="text-3xl font-black text-slate-800">{stats.total}</span>
          </Card>
          <Card className="p-6 border-none shadow-sm flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">With Active Reports</span>
            <span className="text-3xl font-black text-red-500">{stats.reports}</span>
          </Card>
          <Card className="p-6 border-none shadow-sm flex flex-col gap-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">No Issues</span>
            <span className="text-3xl font-black text-green-500">{stats.noIssues}</span>
          </Card>
        </div>

        <div className="flex gap-8">
          {/* SIDEBAR */}
          <div className="w-80 flex-shrink-0">
            <Card className="flex flex-col border-none shadow-xl bg-white rounded-3xl overflow-hidden h-[700px]">
              <div className="p-5 space-y-4">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button onClick={() => setActiveTab('inventory')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'inventory' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>
                    <LayoutGrid size={14} /> INVENTORY
                  </button>
                  <button onClick={() => setActiveTab('objects')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'objects' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>
                    <Package size={14} /> OBJECTS
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search item..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {(activeTab === 'inventory' ? inventory : defaultObjects).map(item => (
                  <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData("objectData", JSON.stringify({ ...item, isDefault: activeTab === 'objects' }))} 
                       className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-grab hover:border-blue-400 transition-all">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-slate-300" />
                      <span className="text-xs font-bold text-slate-600">{item.id}</span>
                    </div>
                    <RotateCw size={14} className="text-slate-300 group-hover:text-blue-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); rotateItem(item.id); }} />
                  </div>
                ))}
              </div>

              <div className="p-5 border-t">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-blue-100" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> SUBIR CSV
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
              </div>
            </Card>
          </div>

          {/* MAP */}
          <Card className="flex-1 bg-white rounded-3xl shadow-xl border-none overflow-hidden h-[700px] flex flex-col">
            <div className="flex-1 overflow-auto bg-[#F1F5F9]" onDrop={handleSvgDrop} onDragOver={(e) => e.preventDefault()} onMouseMove={handleMouseMove}>
              <svg ref={svgRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="mx-auto shadow-inner">
                <defs>
                  <pattern id="dotGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.5" fill="#CBD5E1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dotGrid)" />

                {/* 3. SE CORRIGIÓ EL RENDERIZADO DE MARCOS Y ZONAS */}
                {bgLayers.map(el => (
                  <g key={el.id} transform={`translate(${el.x}, ${el.y})`}>
                    <rect 
                      width={el.width} height={el.height} 
                      // Si es frame es transparente, si es zone es gris oscuro
                      fill={el.type === 'frame' ? 'transparent' : '#94A3B8'} 
                      stroke={el.type === 'frame' ? '#94A3B8' : 'none'} 
                      strokeWidth={el.type === 'frame' ? '2' : '0'}
                      rx={4}
                      onMouseDown={(e) => { e.stopPropagation(); setDraggingId(el.id); }}
                      className="cursor-move opacity-90 shadow-sm"
                    />
                    {el.type === 'zone' && (
                      <rect width={el.width} height={12} fill="white" fillOpacity={0.8} rx={2} />
                    )}
                    <circle 
                      cx={el.width} cy={el.height} r="8" fill="white" stroke="#94A3B8" strokeWidth="2"
                      className="cursor-nwse-resize shadow-md"
                      onMouseDown={(e) => { e.stopPropagation(); setResizingId(el.id); }}
                    />
                  </g>
                ))}

                {/* 2. RENDERIZAR ESCRITORIOS Y OBJETOS (Encima) */}
                {items.map((item) => {
                  let fill = item.hasReport ? "#EF4444" : "#22C55E";
                  if (item.type === 'management' || item.type === 'store') fill = "#F59E0B";
                  if (item.type === 'entrance') fill = "#3B82F6";

                  const adaptiveSize = Math.min(item.width / (item.id.length * 0.7), item.height * 0.4, 14);

                  return (
                    <g key={item.id} transform={`translate(${item.x}, ${item.y})`}>
                      <rect
                        width={item.width} height={item.height} fill={fill} rx={6}
                        onMouseDown={(e) => { e.stopPropagation(); setDraggingId(item.id); }}
                        className="cursor-move shadow-md"
                      />
                      <foreignObject width={item.width} height={item.height} className="pointer-events-none">
                        <div className="w-full h-full flex items-center justify-center p-1">
                          <span style={{ color: 'white', fontSize: `${adaptiveSize}px`, fontWeight: 800, textAlign: 'center', lineHeight: 1 }}>{item.id}</span>
                        </div>
                      </foreignObject>
                      
                      <g className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); rotateItem(item.id); }}>
                        <circle cx={item.width / 2} cy="-12" r="10" fill="white" className="shadow-sm" />
                        <RotateCw x={item.width / 2 - 6} y="-18" size={12} className="text-blue-500" />
                      </g>

                      <circle cx={item.width} cy={item.height} r="6" fill="white" stroke={fill} strokeWidth="2" className="cursor-nwse-resize shadow-md" onMouseDown={(e) => { e.stopPropagation(); setResizingId(item.id); }} />
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}