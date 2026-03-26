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
      <Card className="relative overflow-visible z-40 bg-gray-900/60 backdrop-blur-sm border-gray-700/50 shadow-xl">
        <CardContent className="flex flex-wrap items-center gap-6 py-4 pr-12">

          {/* Indicadores */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500/20 border-emerald-500/50 border rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-200">No issues</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/20 border border-red-500/50 rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-200">With active reports</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500/20 border-amber-500/50 border rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-200">Management / Store area</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500/20 border-blue-500/50 border rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-200">Entrance area</span>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-700/50 pl-4">
            <User className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-gray-400">
              Click on any desk to view details
            </span>
          </div>

          {/* MENÚ */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2" ref={menuRef}>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-full transition-all duration-300 ${
                isOpen 
                  ? 'bg-teal-600 text-white shadow-lg scale-110'
                  : 'bg-gray-800 text-gray-200 hover:bg-teal-500/20 hover:text-teal-400'
              }`}
              title="Options menu"
            >
              <MoreVertical size={24} strokeWidth={2} />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl z-50 py-2 border border-gray-700 bg-gray-900 backdrop-blur-md">

                {!viewOnly && (
                  <>
                    <button 
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-teal-500/10 hover:text-teal-400 gap-3 transition-all"
                      onClick={handleAddMap}
                    >
                      <Plus size={18} className="text-teal-400 shrink-0" /> 
                      <span>Add Map</span>
                    </button>

                    <button 
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-teal-500/10 hover:text-teal-400 gap-3 transition-all"
                      onClick={handleEditMap}
                    >
                      <Edit2 size={18} className="text-teal-400 shrink-0" /> 
                      <span>Edit Map</span>
                    </button>
                  </>
                )}

                <button 
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-teal-500/10 hover:text-teal-400 gap-3 transition-all"
                  onClick={handleViewMap}
               >
                  <Eye size={18} className="text-teal-400 shrink-0" /> 
                  <span>View Map</span>
                </button>

                <div className="border-t border-gray-700 my-1"></div>

                <button 
                  className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 gap-3 transition-all"
                  onClick={() => {
                    setIsOpen(false);
                    onBackToMenu?.();
                  }}
                >
                  <Home size={18} className="text-red-400 shrink-0" /> 
                  <span>Back to Menu</span>
                </button>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* MODAL: AGREGAR MAPA */}
      <Dialog open={addMapModal} onOpenChange={setAddMapModal}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700 text-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="addSeat" className="!text-gray-300">Select Location</Label>
              <Select
                value={addSeat}
                onValueChange={setAddSeat}
                disabled={loadingLocations}
              >
                <SelectTrigger id="addSeat" className="h-11 rounded-xl !bg-gray-800 !border-gray-600 !text-gray-100 shadow-none focus:ring-teal-500">
                  <SelectValue placeholder={loadingLocations ? 'Loading locations...' : 'Select a location'} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {locations.map((location) => (
                    <SelectItem key={location.id_location} value={String(location.id_location)}>
                      {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addFloor" className="text-sm !text-gray-300">Floor Number</Label>
              <Input
                id="addFloor"
                value={addFloor}
                onChange={(e) => setAddFloor(e.target.value)}
                placeholder="Type floor number. Ex: 1"
                className="h-11 rounded-xl !bg-gray-800 !border-gray-600 !text-gray-100 placeholder:!text-gray-500 shadow-none focus-visible:ring-teal-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="default" className="border-gray-600 text-gray-300 hover:bg-gray-800" onClick={() => setAddMapModal(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-600 text-white hover:bg-teal-700 border-none" onClick={handleConfirmAddMap} disabled={creatingFloor || loadingLocations}>
              {creatingFloor ? 'Creating...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR MAPA */}
      <Dialog open={editMapModal} onOpenChange={setEditMapModal}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700 text-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editSeat" className="!text-gray-300">Select Location</Label>
              <Select
                value={editSeat}
                onValueChange={(value) => {
                  setEditSeat(value);
                  setEditFloor('');
                }}
                disabled={loadingLocations}
              >
                <SelectTrigger id="editSeat" className="h-11 rounded-xl !bg-gray-800 !border-gray-600 !text-gray-100 shadow-none focus:ring-teal-500">
                  <SelectValue placeholder={loadingLocations ? 'Loading locations...' : 'Select a location'} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {locations.map((location) => (
                    <SelectItem key={location.id_location} value={String(location.id_location)}>
                      {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFloor" className="!text-gray-300">Select Floor</Label>
              <Select
                value={editFloor}
                onValueChange={setEditFloor}
                disabled={!editSeat || loadingFloors}
              >
                <SelectTrigger id="editFloor" className="h-11 rounded-xl !bg-gray-800 !border-gray-600 !text-gray-100 shadow-none focus:ring-teal-500">
                  <SelectValue placeholder={loadingFloors ? 'Loading floors...' : 'Select a floor'} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
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
            <Button variant="default" className="border-gray-600 text-gray-300 hover:bg-gray-800" onClick={() => setEditMapModal(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-600 text-white hover:bg-teal-700 border-none" onClick={handleConfirmEditMap}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: VER MAPA */}
      <Dialog open={viewMapModal} onOpenChange={setViewMapModal}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700 text-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">View Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="selectSeat" className="text-sm font-medium !text-gray-300">Select Location</Label>
              <Select
                value={selectedSeat}
                onValueChange={(value) => {
                  setSelectedSeat(value);
                  setSelectedFloor('');
                }}
                disabled={loadingLocations}
              >
                <SelectTrigger id="selectSeat" className="h-11 rounded-xl !bg-gray-800 !border-gray-600 !text-gray-100 shadow-none focus:ring-teal-500">
                  <SelectValue placeholder={loadingLocations ? 'Loading locations...' : 'Select a location'} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {locations.map((location) => (
                    <SelectItem key={location.id_location} value={String(location.id_location)}>
                      {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="selectFloor" className="!text-gray-300">Select Floor</Label>
              <Select
                value={selectedFloor}
                onValueChange={setSelectedFloor}
                disabled={!selectedSeat || loadingFloors}
              >
                <SelectTrigger id="selectFloor" className="h-11 rounded-xl !bg-gray-800 !border-gray-600 !text-gray-100 shadow-none focus:ring-teal-500">
                  <SelectValue placeholder={loadingFloors ? 'Loading floors...' : 'Select a floor'} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
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
            <Button variant="default" className="border-gray-600 text-gray-300 hover:bg-gray-800" onClick={() => setViewMapModal(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-600 text-white hover:bg-teal-700 border-none" onClick={handleConfirmViewMap}>
              View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}