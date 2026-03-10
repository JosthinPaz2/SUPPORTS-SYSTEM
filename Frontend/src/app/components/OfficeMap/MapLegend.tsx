import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { User, MoreVertical, Plus, Edit2, Eye, Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { apiService, FloorOption, LocationOption } from '../../utils/api';
import { toast } from 'sonner';

interface MapLegendProps {
  onModeChange?: (mode: 'add' | 'edit' | 'view') => void;
  onBackToMenu?: () => void;
  onZoneSelected?: (zoneId: number) => void;
  viewOnly?: boolean;
  autoOpenViewModal?: boolean;
}

export default function MapLegend({
  onModeChange,
  onBackToMenu,
  onZoneSelected,
  viewOnly = false,
  autoOpenViewModal = false,
}: MapLegendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Estados para los modales
  const [addMapModal, setAddMapModal] = useState(false);
  const [editMapModal, setEditMapModal] = useState(false);
  const [viewMapModal, setViewMapModal] = useState(false);

  // Estados para agregar mapa
  const [addSeat, setAddSeat] = useState('');
  const [addFloor, setAddFloor] = useState('');

  // Estados para editar mapa
  const [editSeat, setEditSeat] = useState('');
  const [editFloor, setEditFloor] = useState('');

  // Estados para ver mapa
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedSeat, setSelectedSeat] = useState('');

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [floors, setFloors] = useState<FloorOption[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [creatingFloor, setCreatingFloor] = useState(false);

  const editFloors = editSeat
    ? floors.filter((floor) => floor.id_location === Number(editSeat))
    : [];

  const viewFloors = selectedSeat
    ? floors.filter((floor) => floor.id_location === Number(selectedSeat))
    : [];

  // Cerrar el menú si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !(menuRef.current as HTMLElement).contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!addMapModal && !editMapModal && !viewMapModal) return;

    const loadMetadata = async () => {
      setLoadingLocations(true);
      setLoadingFloors(true);
      try {
        const [locationData, floorData] = await Promise.all([
          apiService.getLocations(),
          apiService.getFloors(),
        ]);
        setLocations(locationData);
        setFloors(floorData);
      } catch (error) {
        console.error('Error loading map metadata:', error);
        setLocations([]);
        setFloors([]);
      } finally {
        setLoadingLocations(false);
        setLoadingFloors(false);
      }
    };

    loadMetadata();
  }, [addMapModal, editMapModal, viewMapModal]);

  useEffect(() => {
    if (autoOpenViewModal) {
      setViewMapModal(true);
    }
  }, [autoOpenViewModal]);

  // Funciones del menú
  const handleAddMap = () => {
    setAddMapModal(true);
    setIsOpen(false);
  };

  const handleEditMap = () => {
    setEditMapModal(true);
    setIsOpen(false);
  };

  const handleViewMap = () => {
    setViewMapModal(true);
    setIsOpen(false);
  };

  const handleConfirmAddMap = async () => {
    const floorInput = addFloor.trim();
    const locationId = Number(addSeat);

    if (!locationId || !floorInput) {
      toast.error('Select a location and enter the floor number');
      return;
    }

    const floorName = /^piso\s+/i.test(floorInput) ? floorInput : `Floor ${floorInput}`;
    const normalizedFloorName = floorName.trim().toLowerCase();

    const floorAlreadyExists = floors.some(
      (floor) =>
        floor.id_location === locationId &&
        floor.floor_name.trim().toLowerCase() === normalizedFloorName,
    );

    if (floorAlreadyExists) {
      toast.error('This floor is already mapped. Go to Edit Map to modify it.');
      return;
    }

    try {
      setCreatingFloor(true);
      const createdFloor = await apiService.createFloor({
        floor_name: floorName,
        id_location: locationId,
      });

      toast.success('Floor created successfully');
      onZoneSelected?.(createdFloor.id_floor);
      setAddMapModal(false);
      setAddSeat('');
      setAddFloor('');
      onModeChange?.('add');
    } catch (error) {
      toast.error((error as Error).message || 'Could not create the floor');
    } finally {
      setCreatingFloor(false);
    }
  };

  const handleConfirmEditMap = () => {
    if (!editSeat || !editFloor) {
      toast.error('Select a location and a floor');
      return;
    }

    onZoneSelected?.(Number(editFloor));
    setEditMapModal(false);
    setEditSeat('');
    setEditFloor('');
    if (onModeChange) onModeChange('edit');
  };

  const handleConfirmViewMap = () => {
    if (!selectedSeat || !selectedFloor) {
      toast.error('Select a location and a floor');
      return;
    }

    onZoneSelected?.(Number(selectedFloor));
    setViewMapModal(false);
    if (onModeChange) onModeChange('view');
  };

  return (
    <>
      <Card className="relative overflow-visible z-40 shadow-md border border-gray-200">
        <CardContent className="flex flex-wrap items-center gap-6 py-4 pr-12">
          
          {/* Indicadores existentes */}
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

          {/* --- MENÚ DESPLEGABLE MEJORADO --- */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2" ref={menuRef}>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-full transition-all duration-300 ${
                isOpen 
                  ? 'bg-blue-600 text-white shadow-lg scale-110' 
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
              }`}
              title="Options menu"
            >
              <MoreVertical size={24} strokeWidth={2} />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-9999 py-2 border border-gray-200 overflow-hidden">
                {!viewOnly && (
                  <>
                    <button 
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 gap-3 transition-colors duration-150"
                      onClick={handleAddMap}
                    >
                      <Plus size={18} className="text-blue-500 shrink-0" /> 
                      <span>Add Map</span>
                    </button>
                    
                    <button 
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 gap-3 transition-colors duration-150"
                      onClick={handleEditMap}
                    >
                      <Edit2 size={18} className="text-green-500 shrink-0" /> 
                      <span>Edit Map</span>
                    </button>
                  </>
                )}

                <button 
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 gap-3 transition-colors duration-150"
                  onClick={handleViewMap}
                >
                  <Eye size={18} className="text-purple-500 shrink-0" /> 
                  <span>View Map</span>
                </button>

                <div className="border-t border-gray-200 my-1"></div>

                <button 
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 gap-3 transition-colors duration-150"
                  onClick={() => {
                    setIsOpen(false);
                    onBackToMenu?.();
                  }}
                >
                  <Home size={18} className="text-red-500 shrink-0" /> 
                  <span>Back to Menu</span>
                </button>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* MODAL: AGREGAR MAPA */}
      <Dialog open={addMapModal} onOpenChange={setAddMapModal}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Add Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="addSeat">Select Location</Label>
              <Select
                value={addSeat}
                onValueChange={setAddSeat}
                disabled={loadingLocations}
              >
                <SelectTrigger id="addSeat" className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-none">
                  <SelectValue placeholder={loadingLocations ? 'Loading locations...' : 'Select a location'} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id_location} value={String(location.id_location)}>
                      {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addFloor">Floor Number</Label>
              <Input
                id="addFloor"
                value={addFloor}
                onChange={(e) => setAddFloor(e.target.value)}
                placeholder="Type floor number. Ex: 1"
                className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMapModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAddMap} disabled={creatingFloor || loadingLocations}>
              {creatingFloor ? 'Creating...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR MAPA */}
      <Dialog open={editMapModal} onOpenChange={setEditMapModal}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Edit Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editSeat">Select Location</Label>
              <Select
                value={editSeat}
                onValueChange={(value) => {
                  setEditSeat(value);
                  setEditFloor('');
                }}
                disabled={loadingLocations}
              >
                <SelectTrigger id="editSeat" className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-none">
                  <SelectValue placeholder={loadingLocations ? 'Loading locations...' : 'Select a location'} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id_location} value={String(location.id_location)}>
                      {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFloor">Select Floor</Label>
              <Select
                value={editFloor}
                onValueChange={setEditFloor}
                disabled={!editSeat || loadingFloors}
              >
                <SelectTrigger id="editFloor" className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-none">
                  <SelectValue placeholder={loadingFloors ? 'Loading floors...' : 'Select a floor'} />
                </SelectTrigger>
                <SelectContent>
                  {editFloors.map((floor) => (
                    <SelectItem key={floor.id_floor} value={String(floor.id_floor)}>
                      {floor.floor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMapModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmEditMap}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: VER MAPA */}
      <Dialog open={viewMapModal} onOpenChange={setViewMapModal}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>View Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="selectSeat">Select Location</Label>
              <Select
                value={selectedSeat}
                onValueChange={(value) => {
                  setSelectedSeat(value);
                  setSelectedFloor('');
                }}
                disabled={loadingLocations}
              >
                <SelectTrigger id="selectSeat" className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-none">
                  <SelectValue placeholder={loadingLocations ? 'Loading locations...' : 'Select a location'} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id_location} value={String(location.id_location)}>
                      {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="selectFloor">Select Floor</Label>
              <Select
                value={selectedFloor}
                onValueChange={setSelectedFloor}
                disabled={!selectedSeat || loadingFloors}
              >
                <SelectTrigger id="selectFloor" className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-none">
                  <SelectValue placeholder={loadingFloors ? 'Loading floors...' : 'Select a floor'} />
                </SelectTrigger>
                <SelectContent>
                  {viewFloors.map((floor) => (
                    <SelectItem key={floor.id_floor} value={String(floor.id_floor)}>
                      {floor.floor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewMapModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmViewMap}>
              View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}