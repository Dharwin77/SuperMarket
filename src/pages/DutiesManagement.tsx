import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar, Clock, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createDuty, fetchDuties, fetchStaffs } from '@/services/adminApi';
import type { Duty, DutyFormData, Staff } from '@/types/admin';

type ModuleCategory = 'Cashier' | 'Workers' | 'Security' | 'Delivery';

const MODULE_OPTIONS: Array<{ value: ModuleCategory; label: string }> = [
  { value: 'Cashier', label: 'Cashier' },
  { value: 'Workers', label: 'Worker' },
  { value: 'Security', label: 'Security' },
  { value: 'Delivery', label: 'Delivery' },
];

const DUTY_META_PREFIX = '[[DUTY_META]]';

function parseDutyDescription(raw?: string) {
  const source = raw || '';
  const lines = source.split('\n');
  const first = (lines[0] || '').trim();

  if (!first.startsWith(DUTY_META_PREFIX)) {
    return {
      cleanDescription: source,
      module: '',
      dutyStartTime: '',
      dutyEndTime: '',
    };
  }

  const payload = first.replace(DUTY_META_PREFIX, '').trim();
  const parts = payload.split(';');
  const meta: Record<string, string> = {};

  parts.forEach((part) => {
    const [key, value] = part.split('=');
    if (key && value) {
      meta[key.trim()] = value.trim();
    }
  });

  return {
    cleanDescription: lines.slice(1).join('\n').trim(),
    module: meta.module || '',
    dutyStartTime: meta.start || '',
    dutyEndTime: meta.end || '',
  };
}

function buildDutyDescription(
  description: string,
  module: string,
  dutyStartTime: string,
  dutyEndTime: string
) {
  const meta = `${DUTY_META_PREFIX} module=${module};start=${dutyStartTime};end=${dutyEndTime}`;
  const clean = (description || '').trim();
  return clean ? `${meta}\n${clean}` : meta;
}

export default function DutiesManagement() {
  const { toast } = useToast();

  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [duties, setDuties] = useState<any[]>([]);
  const [loadingStaffs, setLoadingStaffs] = useState(true);
  const [loadingDuties, setLoadingDuties] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedModule, setSelectedModule] = useState<ModuleCategory | ''>('');
  const [dutyStartTime, setDutyStartTime] = useState('');
  const [dutyEndTime, setDutyEndTime] = useState('');

  const [formData, setFormData] = useState<DutyFormData>({
    staff_id: '',
    duty_title: '',
    description: '',
    assigned_date: new Date().toISOString().split('T')[0],
    deadline: '',
    status: 'Pending',
  });

  useEffect(() => {
    loadStaffProfiles();
    loadDutyList();
  }, []);

  async function loadStaffProfiles() {
    try {
      setLoadingStaffs(true);
      const staffsData = await fetchStaffs({ status: 'All' });
      setStaffs(staffsData.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load staff profiles',
        variant: 'destructive',
      });
    } finally {
      setLoadingStaffs(false);
    }
  }

  async function loadDutyList() {
    try {
      setLoadingDuties(true);
      const dutiesData = await fetchDuties({ status: 'All' });
      setDuties(dutiesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load duties',
        variant: 'destructive',
      });
    } finally {
      setLoadingDuties(false);
    }
  }

  function resetForm() {
    setFormData({
      staff_id: '',
      duty_title: '',
      description: '',
      assigned_date: new Date().toISOString().split('T')[0],
      deadline: '',
      status: 'Pending',
    });
    setSelectedModule('');
    setDutyStartTime('');
    setDutyEndTime('');
  }

  function openAddDialog() {
    resetForm();
    setShowAddDialog(true);
  }

  const selectableStaffs = staffs.filter((staff) => staff.status === 'Active');

  const filteredStaffsByModule = selectedModule
    ? selectableStaffs.filter((staff) => {
        const dept = staff.department || '';
        if (selectedModule === 'Workers') {
          return dept === 'Workers' || dept === 'Worker';
        }
        return dept === selectedModule;
      })
    : [];

  function getAutoDutyTitle(staffId: string, module: ModuleCategory, start: string, end: string) {
    const staff = staffs.find((s) => s.id === staffId);
    const moduleLabel = module === 'Workers' ? 'Worker' : module;
    const staffName = staff?.full_name || 'Staff';
    const timeRange = start && end ? ` (${start}-${end})` : '';
    return `${moduleLabel} Duty - ${staffName}${timeRange}`;
  }

  async function handleAddDuty() {
    if (!selectedModule || !formData.staff_id) {
      toast({
        title: 'Validation Error',
        description: 'Module and staff profile are required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.assigned_date || !formData.deadline) {
      toast({
        title: 'Validation Error',
        description: 'Start date and last date are required',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(formData.deadline) < new Date(formData.assigned_date)) {
      toast({
        title: 'Validation Error',
        description: 'Last date cannot be before start date',
        variant: 'destructive',
      });
      return;
    }

    if (!dutyStartTime || !dutyEndTime) {
      toast({
        title: 'Validation Error',
        description: 'Duty start time and end time are required',
        variant: 'destructive',
      });
      return;
    }

    const autoDutyTitle = getAutoDutyTitle(
      formData.staff_id,
      selectedModule,
      dutyStartTime,
      dutyEndTime
    );

    const payload: DutyFormData = {
      staff_id: formData.staff_id,
      duty_title: autoDutyTitle,
      assigned_date: formData.assigned_date,
      deadline: formData.deadline,
      status: 'Pending',
      description: buildDutyDescription(
        formData.description || '',
        selectedModule,
        dutyStartTime,
        dutyEndTime
      ),
    };

    try {
      setSubmitting(true);
      await createDuty(payload);
      toast({
        title: 'Success',
        description: 'Duty created successfully',
      });
      setShowAddDialog(false);
      resetForm();
      loadDutyList();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create duty',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function resolveProfileName(duty: any) {
    if (duty?.staffs?.full_name) return duty.staffs.full_name as string;
    if (!duty?.staff_id) return '';
    const matched = staffs.find((staff) => staff.id === duty.staff_id);
    return matched?.full_name || '';
  }

  const completedAllottedDuties = duties.filter((duty) => {
    const profileName = resolveProfileName(duty);
    return Boolean(profileName) && duty.status === 'Completed';
  });

  const allottedProfileIds = new Set(
    duties
      .map((duty) => duty.staff_id)
      .filter((staffId): staffId is string => Boolean(staffId))
  );

  const profilesWithoutDuties = selectableStaffs.filter(
    (staff) => !allottedProfileIds.has(staff.id)
  );

  function renderDutyItem(duty: Duty & { staffs?: { full_name?: string; department?: string } }) {
    const parsed = parseDutyDescription(duty.description || '');
    const profileName = resolveProfileName(duty) || 'Not assigned to profile';
    const moduleName = parsed.module || duty.staffs?.department || 'N/A';
    const timing =
      parsed.dutyStartTime && parsed.dutyEndTime
        ? `${parsed.dutyStartTime} - ${parsed.dutyEndTime}`
        : 'Timing not set';

    return (
      <div key={duty.id} className="rounded-lg border border-border p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-medium text-foreground">{duty.duty_title || 'Assigned Duty'}</p>
          <Badge variant="outline">{duty.status || 'Pending'}</Badge>
        </div>

        {parsed.cleanDescription && (
          <p className="mb-3 text-sm text-muted-foreground">{parsed.cleanDescription}</p>
        )}

        <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-4">
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>{profileName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="h-5 px-2 text-[10px]">
              {moduleName}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {duty.assigned_date ? new Date(duty.assigned_date).toLocaleDateString('en-IN') : '-'} to{' '}
              {duty.deadline ? new Date(duty.deadline).toLocaleDateString('en-IN') : '-'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{timing}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={openAddDialog} size="lg" disabled={loadingStaffs}>
            <Plus className="mr-2 h-5 w-5" />
            Assign Duty
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Completed Allotted Duties</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDuties ? (
              <p className="text-sm text-muted-foreground">Loading duties...</p>
            ) : completedAllottedDuties.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed allotted duties found.</p>
            ) : (
              <div className="space-y-3">
                {completedAllottedDuties.map((duty) => renderDutyItem(duty as any))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yet To Allot Duties</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDuties || loadingStaffs ? (
              <p className="text-sm text-muted-foreground">Loading profiles...</p>
            ) : profilesWithoutDuties.length === 0 ? (
              <p className="text-sm text-muted-foreground">All profiles already have at least one duty.</p>
            ) : (
              <div className="space-y-3">
                {profilesWithoutDuties.map((staff) => (
                  <div key={staff.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-foreground">{staff.full_name}</p>
                      </div>
                      <Badge variant="outline">No Duty Allotted</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {staff.department || 'No Department'}
                      {staff.phone_number ? ` • ${staff.phone_number}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign New Duty</DialogTitle>
            <DialogDescription>Create a new duty assignment for staff</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="module">Assign To *</Label>
              <Select
                value={selectedModule}
                onValueChange={(value) => {
                  setSelectedModule(value as ModuleCategory);
                  setFormData({ ...formData, staff_id: '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module (Cashier / Worker / Security / Delivery)" />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((module) => (
                    <SelectItem key={module.value} value={module.value}>
                      {module.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="staff_id">Select Profile *</Label>
              <Select
                value={formData.staff_id}
                onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                disabled={!selectedModule}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedModule ? 'Select profile' : 'Choose module first'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredStaffsByModule.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.full_name} - {staff.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter duty description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigned_date">Start Date</Label>
                <Input
                  id="assigned_date"
                  type="date"
                  value={formData.assigned_date}
                  onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="deadline">Last Date</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duty_start_time">Duty Start Time</Label>
                <Input
                  id="duty_start_time"
                  type="time"
                  value={dutyStartTime}
                  onChange={(e) => setDutyStartTime(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="duty_end_time">Duty End Time</Label>
                <Input
                  id="duty_end_time"
                  type="time"
                  value={dutyEndTime}
                  onChange={(e) => setDutyEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddDuty} disabled={submitting}>
              {submitting ? 'Creating...' : 'Assign Duty'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
