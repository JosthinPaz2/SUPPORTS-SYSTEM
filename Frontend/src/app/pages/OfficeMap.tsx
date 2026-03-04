import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, 
  Upload, 
  Search, 
  GripVertical, 
  RotateCw, 
  LayoutGrid, 
  Package, 
  Info, 
  User} from 'lucide-react';

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

  // 📊 Stats
   const totalDesks = desks.filter(d => d.type === 'desk').length;
  const reports = desks.filter(d => d.hasReport).length;
  const noIssues = desks.filter(d => d.type === 'desk' && !d.hasReport).length;

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
          id: id?.trim() || `D-${100 + index}`,
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
    setDesks(prev => 
      prev.map(d => d.id === id ? { ...d, width: d.height, height: d.width } : d)
    );
  };

  const handleSvgDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("objectData"));
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (data.isDefault) {
      const newObj = {
        ...data,
        id: `${data.id}-${Date.now()}`,
        x: x - data.width / 2,
        y: y - data.height / 2,
        placed: true
      };
      setDesks(prev => [...prev, newObj]);
    } else {
      setDesks(prev =>
        prev.map(d =>
          d.id === data.id
            ? { ...d, x: x - d.width / 2, y: y - d.height / 2, placed: true }
            : d
        )
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggingId) {
      setDesks(prev =>
        prev.map(d =>
          d.id === draggingId
            ? { ...d, x: mouseX - d.width / 2, y: mouseY - d.height / 2 }
            : d
        )
      );
    }

    if (resizingId) {
      setDesks(prev =>
        prev.map(d =>
          d.id === resizingId
            ? {
                ...d,
                width: Math.max(40, mouseX - d.x),
                height: Math.max(40, mouseY - d.y)
              }
            : d
        )
      );
    }
  };

  // background layers include zones and frames so they render beneath desks
  const bgLayers = desks.filter(d => d.placed && (d.type === 'zone' || d.type === 'frame'));

  const items = desks.filter(d => d.placed && d.type !== 'zone' && d.type !== 'frame');
  const inventory = desks.filter(d => !d.placed && d.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen select-none"
         onMouseUp={() => { setDraggingId(null); setResizingId(null); }}>

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <div>
           <h1 className="text-xl font-bold text-gray-900">Office Map - Desk Layout</h1>
            <p className="text-sm text-gray-500">Overview of all desks and active reports</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

      </div>

      {/* 📊 Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-gray-600">
              Total Desks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalDesks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-gray-600">
              With Active Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{reports}</div>
          </CardContent>
        </Card>

        

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-gray-600">
              No Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{noIssues}</div>
          </CardContent>
        </Card>
      </div>

      {/* 🎨 NUEVA SECCIÓN: Legend / Map Labels */}
      <Card>
        <CardContent className="flex flex-wrap gap-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 border border-gray-300 rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">No issues</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 border border-gray-300 rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">With active reports</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 border border-gray-300 rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">Management / Store area</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 border border-gray-300 rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">Entrance area</span>
          </div>
          <div className="flex items-center gap-2 border-l pl-4">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-500">Click on any desk to view details</span>
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <div className="flex gap-6 h-[700px]">

        {/* Sidebar */}
   {/* Sidebar */}
<Card className="w-80 flex flex-col border-none shadow-xl bg-white rounded-3xl overflow-hidden h-[700px]">

  {/* Tabs + Search */}
  <div className="p-5 space-y-4">

    <div className="flex p-1 bg-slate-100 rounded-xl">
      <button
        onClick={() => setActiveTab('inventory')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded-lg transition-all ${
          activeTab === 'inventory'
            ? 'bg-white shadow text-blue-600'
            : 'text-slate-400'
        }`}
      >
        <LayoutGrid size={14} /> INVENTORY
      </button>

      <button
        onClick={() => setActiveTab('objects')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded-lg transition-all ${
          activeTab === 'objects'
            ? 'bg-white shadow text-blue-600'
            : 'text-slate-400'
        }`}
      >
        <Package size={14} /> OBJECTS
      </button>
    </div>

    {/* Search */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder="Search item..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
      />
    </div>
  </div>

  {/* List */}
  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">

    {(activeTab === 'inventory' ? inventory : defaultObjects)
      .filter(item =>
        item.id.toLowerCase().includes(search.toLowerCase())
      )
      .map(item => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData(
              "objectData",
              JSON.stringify({
                ...item,
                isDefault: activeTab === 'objects'
              })
            )
          }
          className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-grab hover:border-blue-400 transition-all"
        >
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-slate-300" />
            <span className="text-xs font-bold text-slate-600">
              {item.id}
            </span>
          </div>

          <RotateCw
            size={14}
            className="text-slate-300 group-hover:text-blue-500 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              rotateItem(item.id);
            }}
          />
        </div>
      ))}
  </div>

  {/* Upload */}
  <div className="p-5 border-t">
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileUpload}
      className="hidden"
      accept=".csv"
    />
    <Button
      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 font-bold shadow-lg shadow-blue-100"
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="w-4 h-4 mr-2" /> SUBIR CSV
    </Button>
  </div>

</Card>

        {/* Canvas */}
        <Card className="flex-1 relative overflow-hidden bg-white shadow-inner">

          {/* Badges */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Badge className="bg-green-600 text-white border-none">
              {items.length} Located
            </Badge>
            <Badge variant="outline">
              {inventory.length} Pending
            </Badge>
          </div>

          <div className="w-full h-full"
               onDrop={handleSvgDrop}
               onDragOver={(e) => e.preventDefault()}
               onMouseMove={handleMouseMove}>

            <svg ref={svgRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
              <defs>
                <pattern id="dotGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#CBD5E1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dotGrid)" />

              {/* render zones/frames beneath */}
              {bgLayers.map(el => (
                <g key={el.id} transform={`translate(${el.x}, ${el.y})`}>
                  <rect
                    width={el.width} height={el.height}
                    fill={el.type === 'frame' ? 'transparent' : '#94A3B8'}
                    stroke={el.type === 'frame' ? '#94A3B8' : 'none'}
                    strokeWidth={el.type === 'frame' ? 2 : 0}
                    rx={4}
                    onMouseDown={(e) => { e.stopPropagation(); setDraggingId(el.id); }}
                    className="cursor-move opacity-90 shadow-sm"
                  />
                  {el.type === 'zone' && (
                    <rect width={el.width} height={12} fill="white" fillOpacity={0.8} rx={2} />
                  )}
                  <circle
                    cx={el.width} cy={el.height} r={8} fill="white" stroke="#94A3B8" strokeWidth={2}
                    className="cursor-nwse-resize shadow-md"
                    onMouseDown={(e) => { e.stopPropagation(); setResizingId(el.id); }}
                  />
                </g>
              ))}

              {/* desks & objects */}
              {items.map((item) => {
                let fill = item.hasReport ? "#EF4444" : "#22C55E";
                if (item.type === 'management' || item.type === 'store') fill = "#F59E0B";
                if (item.type === 'entrance') fill = "#3B82F6";

                const adaptiveSize = Math.min(item.width / (item.id.length * 0.7), item.height * 0.4, 14);

                return (
                  <g key={item.id} transform={`translate(${item.x}, ${item.y})`}>
                    <rect
                      width={item.width} height={item.height}
                      fill={fill}
                      rx={6}
                      onMouseDown={(e) => { e.stopPropagation(); setDraggingId(item.id); }}
                      className="cursor-move"
                    />
                    <text
                      x={item.width / 2} y={item.height / 2}
                      textAnchor="middle" dominantBaseline="middle"
                      fill="white" className="text-[10px] font-bold pointer-events-none"
                      style={{ fontSize: adaptiveSize }}
                    >
                      {item.id}
                    </text>
                    <circle
                      cx={item.width} cy={item.height} r={8}
                      fill="white" stroke="#00000033" strokeWidth={1}
                      className="cursor-nwse-resize"
                      onMouseDown={(e) => { e.stopPropagation(); setResizingId(item.id); }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>
      </div>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4 items-center">
        <div className="bg-blue-100 p-2 rounded-full">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-xs text-blue-800">
          <p className="font-bold mb-1">Tip 💡</p>
          <p>
            Drag desks or objects from the sidebar to the map.
            You can resize and rotate items directly on the canvas.
          </p>
        </div>
      </div>

    </div>
  );
}