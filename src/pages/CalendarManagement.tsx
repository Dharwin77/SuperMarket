import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  CalendarDays,
  Plus,
  Edit,
  Trash2,
  PackageCheck,
  Truck,
  Users as UsersIcon,
  Wrench,
  MoreHorizontal,
  Phone,
  Building2,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '@/services/adminApi';
import type { Event, EventFormData } from '@/types/admin';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '@/types/admin';

export default function CalendarManagement() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Form states
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '',
    agency_name: '',
    contact_person: '',
    contact_phone: '',
    product_name: '',
    quantity: undefined,
    event_type: 'Other',
    notes: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      const data = await fetchEvents();
      setEvents(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      event_date: new Date().toISOString().split('T')[0],
      event_time: '',
      agency_name: '',
      contact_person: '',
      contact_phone: '',
      product_name: '',
      quantity: undefined,
      event_type: 'Other',
      notes: '',
    });
  }

  async function handleAddEvent() {
    if (!formData.title || !formData.event_date) {
      toast({
        title: 'Validation Error',
        description: 'Title and date are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await createEvent(formData);
      toast({
        title: 'Success',
        description: 'Event created successfully',
      });
      setShowAddDialog(false);
      resetForm();
      loadEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditEvent() {
    if (!selectedEvent) return;

    try {
      setSubmitting(true);
      await updateEvent(selectedEvent.id, formData);
      toast({
        title: 'Success',
        description: 'Event updated successfully',
      });
      setShowEditDialog(false);
      setSelectedEvent(null);
      resetForm();
      loadEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEvent(event: Event) {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await deleteEvent(event.id);
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
      setShowDetailsDialog(false);
      loadEvents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  }

  function openEditDialog(event: Event) {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      event_date: event.event_date,
      event_time: event.event_time || '',
      agency_name: event.agency_name || '',
      contact_person: event.contact_person || '',
      contact_phone: event.contact_phone || '',
      product_name: event.product_name || '',
      quantity: event.quantity,
      event_type: event.event_type || 'Other',
      notes: event.notes || '',
    });
    setShowDetailsDialog(false);
    setShowEditDialog(true);
  }

  function openDetailsDialog(event: Event) {
    setSelectedEvent(event);
    setShowDetailsDialog(true);
  }

  function handleDateClick(arg: any) {
    setSelectedDate(arg.dateStr);
    setFormData({ ...formData, event_date: arg.dateStr });
    setShowAddDialog(true);
  }

  function handleEventClick(clickInfo: any) {
    const event = events.find((e) => e.id === clickInfo.event.id);
    if (event) {
      openDetailsDialog(event);
    }
  }

  function getEventTypeIcon(type?: string) {
    switch (type) {
      case 'Product Arrival':
        return <PackageCheck className="h-4 w-4" />;
      case 'Delivery':
        return <Truck className="h-4 w-4" />;
      case 'Staff Meeting':
        return <UsersIcon className="h-4 w-4" />;
      case 'Maintenance':
        return <Wrench className="h-4 w-4" />;
      default:
        return <MoreHorizontal className="h-4 w-4" />;
    }
  }

  // Transform events for FullCalendar
  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    date: event.event_date,
    backgroundColor: event.event_type ? EVENT_TYPE_COLORS[event.event_type] : EVENT_TYPE_COLORS.Other,
    borderColor: event.event_type ? EVENT_TYPE_COLORS[event.event_type] : EVENT_TYPE_COLORS.Other,
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-primary" />
              Calendar Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Schedule and manage store events, deliveries, and meetings
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Event
          </Button>
        </div>

        {/* Event Type Legend */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              {EVENT_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: EVENT_TYPE_COLORS[type] }}
                  />
                  <span className="text-sm flex items-center gap-1">
                    {getEventTypeIcon(type)}
                    {type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading calendar...</p>
              </div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={calendarEvents}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                height="auto"
                editable={false}
                selectable={true}
              />
            )}
          </CardContent>
        </Card>
        </div>

        {/* Add Event Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>Create a new calendar event</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event_date">Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="event_time">Time</Label>
                <Input
                  id="event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(type)}
                        {type}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agency_name">Agency Name</Label>
                <Input
                  id="agency_name"
                  value={formData.agency_name}
                  onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                  placeholder="Enter agency name"
                />
              </div>

              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Enter contact name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+91-9876543210"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_name">Product Name</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  placeholder="Enter quantity"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_title">Event Title *</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_event_date">Date *</Label>
                <Input
                  id="edit_event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit_event_time">Time</Label>
                <Input
                  id="edit_event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_event_type">Event Type</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(type)}
                        {type}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_agency_name">Agency Name</Label>
                <Input
                  id="edit_agency_name"
                  value={formData.agency_name}
                  onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit_contact_person">Contact Person</Label>
                <Input
                  id="edit_contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_contact_phone">Contact Phone</Label>
              <Input
                id="edit_contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_product_name">Product Name</Label>
                <Input
                  id="edit_product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit_quantity">Quantity</Label>
                <Input
                  id="edit_quantity"
                  type="number"
                  value={formData.quantity || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedEvent(null);
                resetForm();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditEvent} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

        {/* Event Details Dialog */}
        {selectedEvent && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getEventTypeIcon(selectedEvent.event_type)}
                {selectedEvent.title}
              </DialogTitle>
              <DialogDescription>
                <Badge
                  style={{
                    backgroundColor: selectedEvent.event_type
                      ? EVENT_TYPE_COLORS[selectedEvent.event_type]
                      : EVENT_TYPE_COLORS.Other,
                  }}
                  className="text-white"
                >
                  {selectedEvent.event_type}
                </Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {new Date(selectedEvent.event_date).toLocaleDateString()}
                  {selectedEvent.event_time && ` at ${selectedEvent.event_time}`}
                </span>
              </div>

              {selectedEvent.agency_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEvent.agency_name}</span>
                </div>
              )}

              {selectedEvent.contact_person && (
                <div className="flex items-center gap-2 text-sm">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEvent.contact_person}</span>
                </div>
              )}

              {selectedEvent.contact_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEvent.contact_phone}</span>
                </div>
              )}

              {selectedEvent.product_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedEvent.product_name}
                    {selectedEvent.quantity && ` (Qty: ${selectedEvent.quantity})`}
                  </span>
                </div>
              )}

              {selectedEvent.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                  <p className="text-sm">{selectedEvent.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailsDialog(false)}
              >
                Close
              </Button>
              <Button variant="outline" onClick={() => openEditDialog(selectedEvent)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteEvent(selectedEvent)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}
