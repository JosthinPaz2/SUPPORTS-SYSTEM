import React, { useEffect, useMemo, useState } from 'react';
import { useTickets } from '../context/TicketContext';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { TicketCategory } from '../types/ticket';
import { toast } from 'sonner';
import { apiService, CategoryOption, FloorOption, LocationOption, StationOption } from '../utils/api';

interface TicketFormProps {
  onClose: () => void;
  userId: string;
  userName: string;
  presetLocationId?: string;
  presetLocationName?: string;
  presetFloorId?: string;
  presetFloorName?: string;
  presetStationId?: string;
  hideStationSelectors?: boolean;
}

export default function TicketForm({
  onClose,
  userId,
  userName,
  presetLocationId,
  presetLocationName,
  presetFloorId,
  presetFloorName,
  presetStationId,
  hideStationSelectors = false,
}: TicketFormProps) {
  const { addTicket } = useTickets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [otherCategoryDetail, setOtherCategoryDetail] = useState('');
  const [location, setLocation] = useState(presetStationId || '');
  const [selectedLocationId, setSelectedLocationId] = useState(presetLocationId || '');
  const [selectedFloorId, setSelectedFloorId] = useState(presetFloorId || '');

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [floors, setFloors] = useState<FloorOption[]>([]);
  const [stations, setStations] = useState<StationOption[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedLocationId(presetLocationId || '');
    setSelectedFloorId(presetFloorId || '');
    setLocation(presetStationId || '');
  }, [presetFloorId, presetLocationId, presetStationId]);

  useEffect(() => {
    const loadMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const requests = [apiService.getCategories()];

        if (hideStationSelectors) {
          const [categoryData] = await Promise.all(requests);
          setCategories(categoryData);
          return;
        }

        const [categoryData, locationData, floorData, stationData] = await Promise.all([
          apiService.getCategories(),
          apiService.getLocations(),
          apiService.getFloors(),
          apiService.getStations(),
        ]);

        setCategories(categoryData);
        setLocations(locationData);
        setFloors(floorData);
        setStations(stationData);
      } catch (error) {
        toast.error((error as Error).message || 'Could not load ticket metadata');
      } finally {
        setLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, [hideStationSelectors]);

  useEffect(() => {
    if (hideStationSelectors) {
      return;
    }

    if (!presetLocationId && !presetFloorId && !presetStationId) {
      return;
    }
  }, [hideStationSelectors, presetFloorId, presetLocationId, presetStationId]);

  const availableFloors = useMemo(() => {
    if (!selectedLocationId) return [];
    return floors.filter((floor) => floor.id_location === Number(selectedLocationId));
  }, [floors, selectedLocationId]);

  const availableStations = useMemo(() => {
    if (!selectedLocationId || !selectedFloorId) return [];

    const selectedFloor = floors.find((floor) => floor.id_floor === Number(selectedFloorId));
    if (!selectedFloor || selectedFloor.id_location !== Number(selectedLocationId)) {
      return [];
    }

    return stations
      .filter((station) => station.id_floor === Number(selectedFloorId))
      .sort((a, b) => a.id_station.localeCompare(b.id_station));
  }, [floors, selectedFloorId, selectedLocationId, stations]);

  const handleLocationChange = (value: string) => {
    setSelectedLocationId(value);
    setSelectedFloorId('');
    setLocation('');
  };

  const handleFloorChange = (value: string) => {
    setSelectedFloorId(value);
    setLocation('');
  };

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id_category === Number(selectedCategoryId)),
    [categories, selectedCategoryId],
  );

  const normalizeCategoryName = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const isOtherCategory = ['other', 'otro'].includes(
    normalizeCategoryName(selectedCategory?.category_name || ''),
  );

  const normalizeCategory = (name: string): TicketCategory => {
    const normalized = name.trim().toLowerCase();
    if (normalized === 'hardware') return 'hardware';
    if (normalized === 'software') return 'software';
    return 'other';
  };

  const normalizeStatus = (status: string): 'pending' | 'in-progress' | 'resolved' => {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'in progress' || normalized === 'in-progress') return 'in-progress';
    if (normalized === 'resolved') return 'resolved';
    return 'pending';
  };

  const normalizePriority = (priority?: string): 'low' | 'medium' | 'high' => {
    const normalized = (priority || '').trim().toLowerCase();
    if (normalized === 'high' || normalized === 'urgent') return 'high';
    if (normalized === 'medium') return 'medium';
    return 'low';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      return;
    }

    if (!selectedCategoryId) {
      toast.error('Please select a category');
      return;
    }

    if (isOtherCategory && !otherCategoryDetail.trim()) {
      toast.error('Please describe the "Other" category');
      return;
    }

    const creatorId = Number(userId);
    if (!Number.isFinite(creatorId)) {
      toast.error('Invalid user identifier. Please sign in again.');
      return;
    }

    try {
      setSubmitting(true);

      const createdTicket = await apiService.createTicket({
        title: title.trim(),
        description: description.trim(),
        id_category: Number(selectedCategoryId),
        created_by: creatorId,
        id_station: location || undefined,
        category_detail: isOtherCategory ? otherCategoryDetail.trim() : undefined,
      });

      addTicket({
        id: String(createdTicket.id_ticket),
        title: createdTicket.title,
        description: createdTicket.description,
        category: normalizeCategory(selectedCategory?.category_name || 'other'),
        status: normalizeStatus(createdTicket.status),
        priority: normalizePriority(createdTicket.priority),
        createdBy: userId,
        createdByName: userName,
        reportedBy: userName,
        location: createdTicket.id_station || undefined,
        createdAt: new Date(createdTicket.created_at),
        updatedAt: new Date(createdTicket.created_at),
      });

      toast.success('Ticket created successfully', {
        description: `The ticket "${title.trim()}" has been created successfully`,
        duration: 5000,
      });

      onClose();
    } catch (error) {
      toast.error((error as Error).message || 'Could not create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-teal-500/40 shadow-[0_0_20px_rgba(20,184,166,0.15)] w-full z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-bold text-slate-100 leading-tight">
            Create New Ticket
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300 text-sm font-medium">
              Issue Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Computer won't turn on"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-600 text-sm font-medium">
              Detailed Description *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem in as much detail as possible..."
              rows={5}
              className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20 resize-none"
              required
            />
          </div>

          {hideStationSelectors ? (
            <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Selected Station
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="text-sm font-medium text-slate-200">{presetLocationName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Floor</p>
                  <p className="text-sm font-medium text-slate-200">{presetFloorName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Desk</p>
                  <p className="text-sm font-medium text-slate-200">{presetStationId || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="siteLocation" className="text-slate-300 text-sm font-medium">
                  Select Location
                </Label>
                <Select value={selectedLocationId} onValueChange={handleLocationChange}>
                  <SelectTrigger 
                    id="siteLocation"
                    className="bg-slate-900/50 border-slate-700 text-slate-100 focus:border-teal-500 focus:ring-teal-500/20 "
                  >
                    <SelectValue placeholder={loadingMetadata ? 'Loading locations...' : 'Select location'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 z-[11000]">
                    {locations.map((loc) => (
                      <SelectItem 
                        key={loc.id_location} 
                        value={String(loc.id_location)}
                        className="text-slate-100 focus:bg-slate-800 focus:text-teal-400"
                      >
                        {loc.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor" className="text-slate-300 text-sm font-medium">
                  Select Floor
                </Label>
                <Select
                  value={selectedFloorId}
                  onValueChange={handleFloorChange}
                  disabled={!selectedLocationId}
                >
                  <SelectTrigger 
                    id="floor"
                    className="bg-slate-900/50 border-slate-700 text-slate-100 focus:border-teal-500 focus:ring-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SelectValue placeholder={!selectedLocationId ? 'Select location first' : 'Select floor'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 z-[11000]">
                    {availableFloors.map((floor) => (
                      <SelectItem 
                        key={floor.id_floor} 
                        value={String(floor.id_floor)}
                        className="text-slate-100 focus:bg-slate-800 focus:text-teal-400"
                      >
                        {floor.floor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-slate-300 text-sm font-medium">
                  Desk Location
                </Label>
                <Select value={location} onValueChange={setLocation} disabled={!selectedFloorId}>
                  <SelectTrigger 
                    id="location"
                    className="bg-slate-900/50 border-slate-700 text-slate-100 focus:border-teal-500 focus:ring-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SelectValue placeholder={!selectedFloorId ? 'Select floor first' : 'Select your desk'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 z-[11000]">
                    {availableStations.map((station) => (
                      <SelectItem 
                        key={station.id_station} 
                        value={station.id_station}
                        className="text-slate-100 focus:bg-slate-800 focus:text-teal-400"
                      >
                        {station.id_station}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Select the desk where the issue occurs (filtered by location and floor)
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="category" className="text-slate-300 text-sm font-medium">
              Category *
            </Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger 
                id="category"
                className="bg-slate-900/50 border-slate-700 text-slate-100 focus:border-teal-500 focus:ring-teal-500/20"
              >
                <SelectValue placeholder={loadingMetadata ? 'Loading categories...' : 'Select category'} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 z-[11000]">
                {categories.map((category) => (
                  <SelectItem 
                    key={category.id_category} 
                    value={String(category.id_category)}
                    className="text-slate-100 focus:bg-slate-800 focus:text-teal-400"
                  >
                    {category.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOtherCategory && (
            <div className="space-y-2">
              <Label htmlFor="otherCategory" className="text-slate-300 text-sm font-medium">
                What is "Other"? *
              </Label>
              <Input
                id="otherCategory"
                value={otherCategoryDetail}
                onChange={(e) => setOtherCategoryDetail(e.target.value)}
                placeholder="Describe the specific category"
                className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 hover:border-slate-600"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
            >
              {submitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
