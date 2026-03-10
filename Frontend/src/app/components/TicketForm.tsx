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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Computer won't turn on"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem in as much detail as possible..."
              rows={5}
              required
            />
          </div>

          {hideStationSelectors ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Selected Station
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="text-sm font-medium text-slate-800">{presetLocationName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Floor</p>
                  <p className="text-sm font-medium text-slate-800">{presetFloorName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Desk</p>
                  <p className="text-sm font-medium text-slate-800">{presetStationId || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="siteLocation">Select Location</Label>
                <Select value={selectedLocationId} onValueChange={handleLocationChange}>
                  <SelectTrigger id="siteLocation">
                    <SelectValue placeholder={loadingMetadata ? 'Loading locations...' : 'Select location'} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id_location} value={String(loc.id_location)}>
                        {loc.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Select Floor</Label>
                <Select
                  value={selectedFloorId}
                  onValueChange={handleFloorChange}
                  disabled={!selectedLocationId}
                >
                  <SelectTrigger id="floor">
                    <SelectValue placeholder={!selectedLocationId ? 'Select location first' : 'Select floor'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFloors.map((floor) => (
                      <SelectItem key={floor.id_floor} value={String(floor.id_floor)}>
                        {floor.floor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Desk Location</Label>
                <Select value={location} onValueChange={setLocation} disabled={!selectedFloorId}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder={!selectedFloorId ? 'Select floor first' : 'Select your desk'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStations.map((station) => (
                      <SelectItem key={station.id_station} value={station.id_station}>
                        {station.id_station}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Select the desk where the issue occurs (filtered by location and floor)
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder={loadingMetadata ? 'Loading categories...' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id_category} value={String(category.id_category)}>
                    {category.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOtherCategory && (
            <div className="space-y-2">
              <Label htmlFor="otherCategory">What is "Other"? *</Label>
              <Input
                id="otherCategory"
                value={otherCategoryDetail}
                onChange={(e) => setOtherCategoryDetail(e.target.value)}
                placeholder="Describe the specific category"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
