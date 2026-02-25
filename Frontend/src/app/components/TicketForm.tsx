import React, { useState } from 'react';
import { useTickets } from '../context/TicketContext';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { TicketCategory } from '../types/ticket';

interface TicketFormProps {
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function TicketForm({ onClose, userId, userName }: TicketFormProps) {
  const { addTicket } = useTickets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('hardware');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [location, setLocation] = useState('');

  // All available desk locations
  const locations = [
    // D series (Left side)
    ...Array.from({ length: 73 }, (_, i) => {
      const num = String(i + 1).padStart(3, '0');
      return { value: `D-${num}`, label: `D-${num}` };
    }),
    // R series (Right side)
    ...Array.from({ length: 75 }, (_, i) => {
      const num = String(i + 1).padStart(3, '0');
      return { value: `R-${num}`, label: `R-${num}` };
    }),
    // E series (Entrance area)
    ...Array.from({ length: 7 }, (_, i) => {
      const num = String(i + 1).padStart(3, '0');
      return { value: `E-${num}`, label: `E-${num}` };
    }),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      return;
    }

    addTicket({
      title,
      description,
      category,
      status: 'pending',
      priority,
      createdBy: userId,
      createdByName: userName,
      reportedBy: userName,
      location: location || undefined,
    });

    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
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

          <div className="space-y-2">
            <Label htmlFor="location">Desk Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select your desk" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Select the desk where the issue occurs (optional)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
