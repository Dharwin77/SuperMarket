import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  ClipboardList,
  Clock,
  Edit,
  Package,
  Plus,
  Receipt,
  Search,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ModuleType = "Worker" | "Security" | "Cleaner" | "Billing Staff" | "Inventory Staff";
type DutyType = "Daily" | "Weekly" | "Monthly";
type DutyStatus = "Pending" | "In Progress" | "Completed" | "Overdue";
type EditableStatus = "Pending" | "In Progress" | "Completed";
type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface StaffProfile {
  id: string;
  name: string;
  role: string;
  employeeId: string;
  status: "Active" | "Off Duty";
  image: string;
  module: ModuleType;
}

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface DutyRecord {
  id: string;
  module: ModuleType;
  staffId: string;
  dutyType: DutyType;
  dailyDate: string;
  weeklyDays: WeekDay[];
  monthlyDates: string[];
  slots: TimeSlot[];
  taskDescription: string;
  checklist: {
    verifyStock: boolean;
    securityMonitoring: boolean;
    cleaningDuty: boolean;
    billingCounterDuty: boolean;
  };
  notifications: {
    notifyStaff: boolean;
    sendReminder: boolean;
    autoMarkComplete: boolean;
  };
  status: EditableStatus;
  createdAt: string;
}

interface DutyFormState {
  module: "" | ModuleType;
  staffId: string;
  dutyType: DutyType;
  dailyDate: string;
  weeklyDays: WeekDay[];
  monthlyDates: string[];
  monthlyDateInput: string;
  slots: TimeSlot[];
  taskDescription: string;
  checklist: DutyRecord["checklist"];
  notifications: DutyRecord["notifications"];
}

const MODULE_OPTIONS: ModuleType[] = ["Worker", "Security", "Cleaner", "Billing Staff", "Inventory Staff"];
const DUTY_TYPES: DutyType[] = ["Daily", "Weekly", "Monthly"];
const WEEK_DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOT_TEMPLATE = [
  { start: "06:00", end: "10:00" },
  { start: "10:00", end: "14:00" },
  { start: "14:00", end: "18:00" },
  { start: "18:00", end: "22:00" },
];

const STAFF_DIRECTORY: Record<ModuleType, StaffProfile[]> = {
  Worker: [
    { id: "worker-1", name: "Arun Kumar", role: "Warehouse Worker", employeeId: "EMP-W-101", status: "Active", image: "https://i.pravatar.cc/100?img=12", module: "Worker" },
    { id: "worker-2", name: "Naveen Raj", role: "Floor Worker", employeeId: "EMP-W-102", status: "Active", image: "https://i.pravatar.cc/100?img=15", module: "Worker" },
  ],
  Security: [
    { id: "security-1", name: "Amit Verma", role: "Security Guard", employeeId: "EMP-S-201", status: "Active", image: "https://i.pravatar.cc/100?img=18", module: "Security" },
    { id: "security-2", name: "Karan S", role: "Night Shift Security", employeeId: "EMP-S-202", status: "Off Duty", image: "https://i.pravatar.cc/100?img=22", module: "Security" },
  ],
  Cleaner: [
    { id: "cleaner-1", name: "Suma R", role: "Store Cleaner", employeeId: "EMP-C-301", status: "Active", image: "https://i.pravatar.cc/100?img=24", module: "Cleaner" },
    { id: "cleaner-2", name: "Rahim K", role: "Maintenance Cleaner", employeeId: "EMP-C-302", status: "Active", image: "https://i.pravatar.cc/100?img=27", module: "Cleaner" },
  ],
  "Billing Staff": [
    { id: "billing-1", name: "Divya M", role: "Cashier", employeeId: "EMP-B-401", status: "Active", image: "https://i.pravatar.cc/100?img=30", module: "Billing Staff" },
    { id: "billing-2", name: "Prakash R", role: "Counter Staff", employeeId: "EMP-B-402", status: "Off Duty", image: "https://i.pravatar.cc/100?img=33", module: "Billing Staff" },
  ],
  "Inventory Staff": [
    { id: "inventory-1", name: "Meena P", role: "Inventory Executive", employeeId: "EMP-I-501", status: "Active", image: "https://i.pravatar.cc/100?img=36", module: "Inventory Staff" },
    { id: "inventory-2", name: "Harish D", role: "Stock Coordinator", employeeId: "EMP-I-502", status: "Active", image: "https://i.pravatar.cc/100?img=39", module: "Inventory Staff" },
  ],
};

function createSlot(start = "", end = ""): TimeSlot {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    start,
    end,
  };
}

function emptyFormState(): DutyFormState {
  return {
    module: "",
    staffId: "",
    dutyType: "Daily",
    dailyDate: "",
    weeklyDays: [],
    monthlyDates: [],
    monthlyDateInput: "",
    slots: [createSlot()],
    taskDescription: "",
    checklist: {
      verifyStock: false,
      securityMonitoring: false,
      cleaningDuty: false,
      billingCounterDuty: false,
    },
    notifications: {
      notifyStaff: true,
      sendReminder: true,
      autoMarkComplete: false,
    },
  };
}

const initialDuties: DutyRecord[] = [
  {
    id: "duty-1",
    module: "Worker",
    staffId: "worker-1",
    dutyType: "Daily",
    dailyDate: new Date().toISOString().split("T")[0],
    weeklyDays: [],
    monthlyDates: [],
    slots: [createSlot("06:00", "10:00"), createSlot("10:00", "14:00")],
    taskDescription: "Unload incoming packaged goods and organize in backroom racks.",
    checklist: { verifyStock: true, securityMonitoring: false, cleaningDuty: false, billingCounterDuty: false },
    notifications: { notifyStaff: true, sendReminder: true, autoMarkComplete: false },
    status: "Pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "duty-2",
    module: "Security",
    staffId: "security-1",
    dutyType: "Weekly",
    dailyDate: "",
    weeklyDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    monthlyDates: [],
    slots: [createSlot("18:00", "22:00")],
    taskDescription: "Monitor gate entries, check CCTV alerts, and secure receiving dock area.",
    checklist: { verifyStock: false, securityMonitoring: true, cleaningDuty: false, billingCounterDuty: false },
    notifications: { notifyStaff: true, sendReminder: true, autoMarkComplete: false },
    status: "In Progress",
    createdAt: new Date().toISOString(),
  },
  {
    id: "duty-3",
    module: "Billing Staff",
    staffId: "billing-1",
    dutyType: "Monthly",
    dailyDate: "",
    weeklyDays: [],
    monthlyDates: [new Date().toISOString().split("T")[0]],
    slots: [createSlot("14:00", "18:00")],
    taskDescription: "Handle priority billing counter and reconcile end-of-day cash report.",
    checklist: { verifyStock: false, securityMonitoring: false, cleaningDuty: false, billingCounterDuty: true },
    notifications: { notifyStaff: true, sendReminder: false, autoMarkComplete: true },
    status: "Completed",
    createdAt: new Date().toISOString(),
  },
];

function getModuleIcon(module: ModuleType) {
  if (module === "Worker") return Briefcase;
  if (module === "Security") return Shield;
  if (module === "Cleaner") return ClipboardList;
  if (module === "Billing Staff") return Receipt;
  return Package;
}

function formatDate(value: string): string {
  if (!value) return "Not scheduled";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function formatSlot(slot: TimeSlot): string {
  if (!slot.start || !slot.end) return "Time not set";
  return `${slot.start} - ${slot.end}`;
}

export default function DutiesManagementAdvanced() {
  const { toast } = useToast();

  const [duties, setDuties] = useState<DutyRecord[]>(initialDuties);
  const [form, setForm] = useState<DutyFormState>(emptyFormState);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [editingDutyId, setEditingDutyId] = useState<string | null>(null);

  const [moduleFilter, setModuleFilter] = useState<"All" | ModuleType>("All");
  const [staffFilter, setStaffFilter] = useState<"All" | string>("All");
  const [dutyTypeFilter, setDutyTypeFilter] = useState<"All" | DutyType>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const allStaff = useMemo(() => Object.values(STAFF_DIRECTORY).flat(), []);

  const availableStaff = useMemo(() => {
    if (!form.module) return [];
    return STAFF_DIRECTORY[form.module] || [];
  }, [form.module]);

  function getStaffByDuty(duty: DutyRecord): StaffProfile | undefined {
    return STAFF_DIRECTORY[duty.module].find((staff) => staff.id === duty.staffId);
  }

  function isDutyOverdue(duty: DutyRecord): boolean {
    if (duty.status === "Completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (duty.dutyType === "Daily" && duty.dailyDate) {
      const targetDate = new Date(duty.dailyDate);
      targetDate.setHours(0, 0, 0, 0);
      return targetDate < today;
    }

    if (duty.dutyType === "Monthly" && duty.monthlyDates.length > 0) {
      const latestDate = duty.monthlyDates
        .map((d) => new Date(d))
        .filter((d) => !Number.isNaN(d.getTime()))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      if (latestDate) {
        latestDate.setHours(0, 0, 0, 0);
        return latestDate < today;
      }
    }

    return duty.status === "Overdue";
  }

  function getEffectiveStatus(duty: DutyRecord): DutyStatus {
    if (isDutyOverdue(duty)) return "Overdue";
    return duty.status;
  }

  const stats = useMemo(() => {
    const statusList = duties.map((duty) => getEffectiveStatus(duty));
    return {
      pending: statusList.filter((status) => status === "Pending").length,
      inProgress: statusList.filter((status) => status === "In Progress").length,
      completed: statusList.filter((status) => status === "Completed").length,
      overdue: statusList.filter((status) => status === "Overdue").length,
    };
  }, [duties]);

  const filteredDuties = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return duties.filter((duty) => {
      const staff = getStaffByDuty(duty);
      const matchesModule = moduleFilter === "All" ? true : duty.module === moduleFilter;
      const matchesStaff = staffFilter === "All" ? true : duty.staffId === staffFilter;
      const matchesDutyType = dutyTypeFilter === "All" ? true : duty.dutyType === dutyTypeFilter;

      const searchable = [
        duty.taskDescription,
        duty.module,
        duty.dutyType,
        staff?.name || "",
        staff?.employeeId || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = search.length === 0 || searchable.includes(search);

      return matchesModule && matchesStaff && matchesDutyType && matchesSearch;
    });
  }, [duties, moduleFilter, staffFilter, dutyTypeFilter, searchTerm]);

  function scheduleSummary(duty: DutyRecord): string {
    if (duty.dutyType === "Daily") {
      return `Daily on ${formatDate(duty.dailyDate)}`;
    }
    if (duty.dutyType === "Weekly") {
      const days = duty.weeklyDays.length ? duty.weeklyDays.join(", ") : "No days selected";
      return `Weekly on ${days}`;
    }
    const dates = duty.monthlyDates.length ? duty.monthlyDates.map(formatDate).join(", ") : "No dates selected";
    return `Monthly on ${dates}`;
  }

  function statusClass(status: DutyStatus): string {
    if (status === "Pending") return "bg-amber-100 text-amber-800 border-amber-300";
    if (status === "In Progress") return "bg-blue-100 text-blue-800 border-blue-300";
    if (status === "Completed") return "bg-emerald-100 text-emerald-800 border-emerald-300";
    return "bg-rose-100 text-rose-800 border-rose-300";
  }

  function resetFormAndModal() {
    setForm(emptyFormState());
    setEditingDutyId(null);
    setIsAssignOpen(false);
  }

  function openCreateDuty() {
    setEditingDutyId(null);
    setForm(emptyFormState());
    setIsAssignOpen(true);
  }

  function openEditDuty(duty: DutyRecord) {
    setEditingDutyId(duty.id);
    setForm({
      module: duty.module,
      staffId: duty.staffId,
      dutyType: duty.dutyType,
      dailyDate: duty.dailyDate,
      weeklyDays: duty.weeklyDays,
      monthlyDates: duty.monthlyDates,
      monthlyDateInput: "",
      slots: duty.slots.map((slot) => ({ ...slot })),
      taskDescription: duty.taskDescription,
      checklist: { ...duty.checklist },
      notifications: { ...duty.notifications },
    });
    setIsAssignOpen(true);
  }

  function toggleWeeklyDay(day: WeekDay, checked: boolean) {
    setForm((prev) => {
      const exists = prev.weeklyDays.includes(day);
      if (checked && !exists) {
        return { ...prev, weeklyDays: [...prev.weeklyDays, day] };
      }
      if (!checked && exists) {
        return { ...prev, weeklyDays: prev.weeklyDays.filter((d) => d !== day) };
      }
      return prev;
    });
  }

  function addMonthlyDate() {
    const value = form.monthlyDateInput;
    if (!value) return;

    setForm((prev) => {
      if (prev.monthlyDates.includes(value)) {
        return { ...prev, monthlyDateInput: "" };
      }
      return {
        ...prev,
        monthlyDates: [...prev.monthlyDates, value].sort(),
        monthlyDateInput: "",
      };
    });
  }

  function removeMonthlyDate(dateToRemove: string) {
    setForm((prev) => ({
      ...prev,
      monthlyDates: prev.monthlyDates.filter((d) => d !== dateToRemove),
    }));
  }

  function addTimeSlot() {
    setForm((prev) => ({ ...prev, slots: [...prev.slots, createSlot()] }));
  }

  function applyShiftTemplate() {
    setForm((prev) => ({
      ...prev,
      slots: SLOT_TEMPLATE.map((slot) => createSlot(slot.start, slot.end)),
    }));
  }

  function removeTimeSlot(slotId: string) {
    setForm((prev) => {
      const nextSlots = prev.slots.filter((slot) => slot.id !== slotId);
      return { ...prev, slots: nextSlots.length ? nextSlots : [createSlot()] };
    });
  }

  function updateTimeSlot(slotId: string, key: "start" | "end", value: string) {
    setForm((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) => (slot.id === slotId ? { ...slot, [key]: value } : slot)),
    }));
  }

  function updateDutyStatus(dutyId: string, status: EditableStatus) {
    setDuties((prev) => prev.map((duty) => (duty.id === dutyId ? { ...duty, status } : duty)));
  }

  function deleteDuty(dutyId: string) {
    setDuties((prev) => prev.filter((duty) => duty.id !== dutyId));
    toast({ title: "Duty removed", description: "The duty card has been deleted." });
  }

  function validateForm(): boolean {
    if (!form.module) {
      toast({ title: "Module required", description: "Select a module category.", variant: "destructive" });
      return false;
    }

    if (!form.staffId) {
      toast({ title: "Staff required", description: "Select a staff profile.", variant: "destructive" });
      return false;
    }

    if (form.dutyType === "Daily" && !form.dailyDate) {
      toast({ title: "Date required", description: "Choose a duty date for daily schedule.", variant: "destructive" });
      return false;
    }

    if (form.dutyType === "Weekly" && form.weeklyDays.length === 0) {
      toast({ title: "Weekly days required", description: "Pick at least one weekday.", variant: "destructive" });
      return false;
    }

    if (form.dutyType === "Monthly" && form.monthlyDates.length === 0) {
      toast({ title: "Monthly dates required", description: "Add at least one recurring date.", variant: "destructive" });
      return false;
    }

    if (!form.taskDescription.trim()) {
      toast({ title: "Task description required", description: "Enter task details before assigning duty.", variant: "destructive" });
      return false;
    }

    const invalidSlot = form.slots.some((slot) => !slot.start || !slot.end);
    if (invalidSlot) {
      toast({ title: "Invalid slot", description: "Each slot must have start and end times.", variant: "destructive" });
      return false;
    }

    return true;
  }

  function submitDuty() {
    if (!validateForm()) return;

    const payload: DutyRecord = {
      id: editingDutyId || `duty-${Date.now()}`,
      module: form.module as ModuleType,
      staffId: form.staffId,
      dutyType: form.dutyType,
      dailyDate: form.dailyDate,
      weeklyDays: form.weeklyDays,
      monthlyDates: form.monthlyDates,
      slots: form.slots,
      taskDescription: form.taskDescription.trim(),
      checklist: form.checklist,
      notifications: form.notifications,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    setDuties((prev) => {
      if (editingDutyId) {
        return prev.map((duty) => (duty.id === editingDutyId ? { ...payload, status: duty.status } : duty));
      }
      return [payload, ...prev];
    });

    toast({
      title: editingDutyId ? "Duty updated" : "Duty assigned",
      description: "The duty now appears in the matching module duties section.",
    });

    resetFormAndModal();
  }

  const moduleCardsToRender = moduleFilter === "All" ? MODULE_OPTIONS : [moduleFilter];

  return (
    <MainLayout>
      <div className="space-y-7">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Duties Management</h1>
            <p className="text-muted-foreground">Assign and manage staff duty schedules</p>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateDuty}>
            <Plus className="mr-2 h-4 w-4" />
            Assign Duty
          </Button>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl border-amber-200/70 shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Pending Duties</p>
                <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
              </div>
              <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-blue-200/70 shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">In Progress Duties</p>
                <p className="text-3xl font-bold text-foreground">{stats.inProgress}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <ClipboardList className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-emerald-200/70 shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Completed Duties</p>
                <p className="text-3xl font-bold text-foreground">{stats.completed}</p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                <CheckCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-rose-200/70 shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Overdue Duties</p>
                <p className="text-3xl font-bold text-foreground">{stats.overdue}</p>
              </div>
              <div className="rounded-xl bg-rose-100 p-3 text-rose-700">
                <AlertCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select value={moduleFilter} onValueChange={(value) => setModuleFilter(value as "All" | ModuleType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Module Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Module Types</SelectItem>
                  {MODULE_OPTIONS.map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={staffFilter} onValueChange={(value) => setStaffFilter(value as "All" | string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Staff Profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Staff Profiles</SelectItem>
                  {allStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.module})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dutyTypeFilter} onValueChange={(value) => setDutyTypeFilter(value as "All" | DutyType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Duty Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Duty Types</SelectItem>
                  {DUTY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search staff or duty"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          {moduleCardsToRender.map((module, index) => {
            const ModuleIcon = getModuleIcon(module);
            const moduleDuties = filteredDuties.filter((duty) => duty.module === module);

            return (
              <motion.div
                key={module}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="rounded-lg bg-primary/10 p-2 text-primary">
                          <ModuleIcon className="h-4 w-4" />
                        </span>
                        {module} Duties Section
                      </CardTitle>
                      <Badge variant="secondary">{moduleDuties.length} duties</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                      {moduleDuties.length === 0 && (
                        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                          No duties found for this module.
                        </div>
                      )}

                      <AnimatePresence initial={false}>
                        {moduleDuties.map((duty) => {
                          const staff = getStaffByDuty(duty);
                          const effectiveStatus = getEffectiveStatus(duty);

                          return (
                            <motion.div
                              key={duty.id}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.2 }}
                              className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={staff?.image} alt={staff?.name || "Staff"} />
                                    <AvatarFallback>
                                      <User className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold text-foreground">{staff?.name || "Unknown Staff"}</p>
                                    <p className="text-xs text-muted-foreground">{staff?.role || "Role not set"} | {staff?.employeeId || "ID"}</p>
                                  </div>
                                </div>

                                <Badge className={cn("border text-xs", statusClass(effectiveStatus))}>{effectiveStatus}</Badge>
                              </div>

                              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                                <p><span className="font-medium text-foreground">Module:</span> {duty.module}</p>
                                <p><span className="font-medium text-foreground">Schedule:</span> {scheduleSummary(duty)}</p>
                                <p><span className="font-medium text-foreground">Slots:</span> {duty.slots.map(formatSlot).join(" | ")}</p>
                              </div>

                              <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">{duty.taskDescription}</p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {duty.status !== "In Progress" && duty.status !== "Completed" && (
                                  <Button size="sm" variant="secondary" onClick={() => updateDutyStatus(duty.id, "In Progress")}>
                                    Start
                                  </Button>
                                )}
                                {duty.status !== "Completed" && (
                                  <Button size="sm" variant="default" onClick={() => updateDutyStatus(duty.id, "Completed")}>
                                    Mark Complete
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => openEditDuty(duty)}>
                                  <Edit className="mr-1 h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deleteDuty(duty.id)}>
                                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingDutyId ? "Edit Assigned Duty" : "Assign Duty"}</DialogTitle>
              <DialogDescription>
                Configure module, staff, schedule, task details, and notification settings.
              </DialogDescription>
            </DialogHeader>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <section className="space-y-3 rounded-xl border p-4">
                <h3 className="font-semibold">Section 1 - Select Module</h3>
                <Select
                  value={form.module || ""}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      module: value as ModuleType,
                      staffId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Module Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_OPTIONS.map((module) => (
                      <SelectItem key={module} value={module}>
                        {module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </section>

              <section className="space-y-3 rounded-xl border p-4">
                <h3 className="font-semibold">Section 2 - Select Staff Profile</h3>
                {!form.module && (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Choose a module category first to view staff profiles.
                  </div>
                )}

                {form.module && (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {availableStaff.map((staff) => (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, staffId: staff.id }))}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all hover:shadow-md",
                          form.staffId === staff.id ? "border-primary bg-primary/5" : "border-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={staff.image} alt={staff.name} />
                            <AvatarFallback>{staff.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{staff.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{staff.role}</p>
                            <p className="text-xs text-muted-foreground">{staff.employeeId}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className={cn("h-2 w-2 rounded-full", staff.status === "Active" ? "bg-emerald-500" : "bg-amber-500")} />
                          <span>{staff.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3 rounded-xl border p-4">
                <h3 className="font-semibold">Section 3 - Duty Schedule Type</h3>
                <RadioGroup
                  value={form.dutyType}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, dutyType: value as DutyType }))}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {DUTY_TYPES.map((type) => (
                    <Label key={type} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/40">
                      <RadioGroupItem value={type} />
                      <span>{type} Duty</span>
                    </Label>
                  ))}
                </RadioGroup>
              </section>

              <section className="space-y-4 rounded-xl border p-4">
                <h3 className="font-semibold">Section 4 - Date and Time Scheduling</h3>

                {form.dutyType === "Daily" && (
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={form.dailyDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, dailyDate: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={form.slots[0]?.start || ""}
                        onChange={(event) => {
                          const firstSlot = form.slots[0]?.id;
                          if (firstSlot) updateTimeSlot(firstSlot, "start", event.target.value);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={form.slots[0]?.end || ""}
                        onChange={(event) => {
                          const firstSlot = form.slots[0]?.id;
                          if (firstSlot) updateTimeSlot(firstSlot, "end", event.target.value);
                        }}
                      />
                    </div>
                  </div>
                )}

                {form.dutyType === "Weekly" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                      {WEEK_DAYS.map((day) => (
                        <Label key={day} className="flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm">
                          <Checkbox
                            checked={form.weeklyDays.includes(day)}
                            onCheckedChange={(checked) => toggleWeeklyDay(day, Boolean(checked))}
                          />
                          {day}
                        </Label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Use Section 5 to add one or more time slots.</p>
                  </div>
                )}

                {form.dutyType === "Monthly" && (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        type="date"
                        value={form.monthlyDateInput}
                        onChange={(event) => setForm((prev) => ({ ...prev, monthlyDateInput: event.target.value }))}
                      />
                      <Button type="button" variant="outline" onClick={addMonthlyDate}>
                        Add Recurring Date
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.monthlyDates.map((date) => (
                        <Badge key={date} variant="secondary" className="cursor-pointer" onClick={() => removeMonthlyDate(date)}>
                          {formatDate(date)} (remove)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-3 rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">Section 5 - Time Slot Management</h3>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={applyShiftTemplate}>
                      Use Shift Template
                    </Button>
                    <Button type="button" onClick={addTimeSlot}>
                      <Plus className="mr-1 h-4 w-4" />
                      Add Slot
                    </Button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {form.slots.map((slot) => (
                    <motion.div
                      key={slot.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]"
                    >
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(event) => updateTimeSlot(slot.id, "start", event.target.value)}
                      />
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(event) => updateTimeSlot(slot.id, "end", event.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={() => removeTimeSlot(slot.id)}>
                        Remove
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </section>

              <section className="space-y-3 rounded-xl border p-4">
                <h3 className="font-semibold">Section 6 - Duty Details</h3>
                <Textarea
                  rows={4}
                  placeholder="Task Description"
                  value={form.taskDescription}
                  onChange={(event) => setForm((prev) => ({ ...prev, taskDescription: event.target.value }))}
                />

                <div className="grid gap-2 sm:grid-cols-2">
                  <Label className="flex items-center gap-2 rounded-lg border p-3">
                    <Checkbox
                      checked={form.checklist.verifyStock}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          checklist: { ...prev.checklist, verifyStock: Boolean(checked) },
                        }))
                      }
                    />
                    Verify stock
                  </Label>

                  <Label className="flex items-center gap-2 rounded-lg border p-3">
                    <Checkbox
                      checked={form.checklist.securityMonitoring}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          checklist: { ...prev.checklist, securityMonitoring: Boolean(checked) },
                        }))
                      }
                    />
                    Security monitoring
                  </Label>

                  <Label className="flex items-center gap-2 rounded-lg border p-3">
                    <Checkbox
                      checked={form.checklist.cleaningDuty}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          checklist: { ...prev.checklist, cleaningDuty: Boolean(checked) },
                        }))
                      }
                    />
                    Cleaning duty
                  </Label>

                  <Label className="flex items-center gap-2 rounded-lg border p-3">
                    <Checkbox
                      checked={form.checklist.billingCounterDuty}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          checklist: { ...prev.checklist, billingCounterDuty: Boolean(checked) },
                        }))
                      }
                    />
                    Billing counter duty
                  </Label>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border p-4">
                <h3 className="font-semibold">Section 7 - Notification Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium">Notify Staff</span>
                    <Switch
                      checked={form.notifications.notifyStaff}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, notifyStaff: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium">Send Reminder</span>
                    <Switch
                      checked={form.notifications.sendReminder}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, sendReminder: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium">Auto mark complete after slot</span>
                    <Switch
                      checked={form.notifications.autoMarkComplete}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, autoMarkComplete: checked },
                        }))
                      }
                    />
                  </div>
                </div>
              </section>
            </motion.div>

            <DialogFooter>
              <Button variant="outline" onClick={resetFormAndModal}>Cancel</Button>
              <Button onClick={submitDuty}>{editingDutyId ? "Update Duty" : "Assign Duty"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
