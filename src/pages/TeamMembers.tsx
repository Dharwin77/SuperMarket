import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Clock3,
  Briefcase,
  Users,
  Loader2,
  Pencil,
  Save,
  X,
  IndianRupee,
  Shield,
  Truck,
  Wrench,
  Upload,
  UserCircle
} from "lucide-react";
import { fetchDuties, fetchStaffByDepartment, fetchStaffByRole, fetchStaffByPhone, updateStaff } from "@/services/adminApi";
import { uploadStaffPhoto } from "@/lib/supabaseStorage";
import { normalizeDepartment, parseDutyDescription } from "@/lib/dutyMeta";
import type { Staff, StaffFormData } from "@/types/admin";

interface DutyTimingItem {
  id: string;
  startDate: string;
  endDate: string;
  timeLabel: string;
  profileName: string;
  dutyContent: string;
}

const TeamMembers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<Staff[]>([]);
  const [assignedDuties, setAssignedDuties] = useState<DutyTimingItem[]>([]);
  const [loadingAssignedDuties, setLoadingAssignedDuties] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDepartment, setUserDepartment] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Staff | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [formData, setFormData] = useState<StaffFormData>({
    full_name: "",
    phone_number: "",
    email: "",
    department: "",
    status: "Active",
    date_of_joining: "",
    date_of_birth: "",
    address: "",
    salary: 0,
    emergency_contact: "",
    experience_years: 0,
    profile_photo_url: "",
  });

  useEffect(() => {
    loadTeamMembers();

    if (user?.role === 'cashier') {
      loadAssignedDuties();
    } else {
      setAssignedDuties([]);
    }
  }, [user]);

  const loadAssignedDuties = async () => {
    if (!user || user.role !== 'cashier') return;

    try {
      setLoadingAssignedDuties(true);

      let duties: any[] = [];
      const username = user.username || "";
      const isPhoneLogin = /^\d{10}$/.test(username);

      if (isPhoneLogin) {
        const staff = await fetchStaffByPhone(username);
        duties = await fetchDuties({ staff_id: staff.id, status: "All" });
      } else {
        duties = await fetchDuties({ status: "All" });
      }

      const cashierDuties = duties
        .filter((duty) => {
          const parsed = parseDutyDescription(duty.description || "");
          const department = normalizeDepartment(duty?.staffs?.department || "");
          const moduleName = normalizeDepartment(parsed.module || department);
          return moduleName === "Cashier";
        })
        .map((duty) => {
          const parsed = parseDutyDescription(duty.description || "");
          const timeLabel =
            parsed.dutyStartTime && parsed.dutyEndTime
              ? `${parsed.dutyStartTime} - ${parsed.dutyEndTime}`
              : "Timing not set";

          return {
            id: duty.id,
            startDate: duty.assigned_date || "",
            endDate: duty.deadline || "",
            timeLabel,
            profileName: duty?.staffs?.full_name || "Unknown Profile",
            dutyContent: parsed.cleanDescription || duty.duty_title || "Assigned duty",
          };
        })
        .sort((a, b) => ((a.startDate || a.endDate) < (b.startDate || b.endDate) ? 1 : -1));

      setAssignedDuties(cashierDuties);
    } catch (error) {
      console.error("Error loading cashier duties:", error);
      setAssignedDuties([]);
    } finally {
      setLoadingAssignedDuties(false);
    }
  };

  const loadTeamMembers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let members: Staff[] = [];
      // If cashier, fetch all cashiers
      if (user.role === 'cashier') {
        // Check if it's a specific cashier login (phone number) or generic
        if (user.username.match(/^\d{10}$/)) {
          members = await fetchStaffByRole('cashier');
        } else {
          // Generic cashier login - show all cashiers
          members = await fetchStaffByRole('cashier');
        }
      } 
      // If staff, first fetch their own data to get department, then fetch team
      else if (user.role === 'staff') {
        // Check if username is a phone number (specific staff member)
        if (user.username.match(/^\d{10}$/)) {
          try {
            const currentUserData = await fetchStaffByPhone(user.username);
            setUserDepartment(currentUserData.department);
            members = await fetchStaffByDepartment(currentUserData.department);
          } catch (error) {
            console.error('Staff member not found in database:', error);
            toast({
              title: "Database Not Initialized",
              description: "Please run the SQL migration first to add staff members",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        } else {
          // Generic staff login - show all staff (non-cashier departments)
          const allDepartments = ['Security', 'Delivery', 'Workers'];
          const allStaffMembers: Staff[] = [];
          for (const dept of allDepartments) {
            const deptMembers = await fetchStaffByDepartment(dept);
            allStaffMembers.push(...deptMembers);
          }
          members = allStaffMembers;
          setUserDepartment('All Staff');
        }
      }
      
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members. Please ensure the database migration has been run.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter((member) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      member.full_name.toLowerCase().includes(query) ||
      member.phone_number.includes(query) ||
      member.email.toLowerCase().includes(query)
    );
    
    const matchesDepartment = selectedDepartment === "All" || member.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments from team members
  const uniqueDepartments = Array.from(new Set(teamMembers.map(m => m.department)));
  const showDepartmentFilter = uniqueDepartments.length > 1;

  const getTeamTitle = () => {
    if (user?.role === 'cashier') return 'Cashier Team';
    if (user?.role === 'staff') {
      if (userDepartment === 'All Staff') return 'All Staff Members';
      return userDepartment ? `${userDepartment} Team` : 'Team';
    }
    return 'Team Members';
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditDialog = (member: Staff) => {
    setSelectedMember(member);
    setFormData({
      full_name: member.full_name,
      phone_number: member.phone_number,
      email: member.email,
      department: member.department,
      status: member.status,
      date_of_joining: member.date_of_joining,
      date_of_birth: member.date_of_birth || "",
      address: member.address || "",
      salary: member.salary || 0,
      emergency_contact: member.emergency_contact || "",
      experience_years: member.experience_years || 0,
      profile_photo_url: member.profile_photo_url || "",
    });
    setPhotoPreview(member.profile_photo_url || "");
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedMember) return;

    setIsSaving(true);
    try {
      let photoUrl = formData.profile_photo_url;

      // Upload new photo if selected
      if (photoFile) {
        photoUrl = await uploadStaffPhoto(photoFile, selectedMember.id);
      }

      await updateStaff(selectedMember.id, { ...formData, profile_photo_url: photoUrl });
      
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });

      setIsEditDialogOpen(false);
      setPhotoFile(null);
      setPhotoPreview("");
      loadTeamMembers(); // Reload the list
    } catch (error) {
      console.error('Error updating team member:', error);
      toast({
        title: "Error",
        description: "Failed to update team member",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {getTeamTitle()}
              </h1>
              <p className="text-muted-foreground">
                View your colleagues and their contact information
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Department Filter - Show when there are multiple departments */}
        {showDepartmentFilter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <Tabs value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                <TabsTrigger value="All" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All
                </TabsTrigger>
                <TabsTrigger value="Security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="Delivery" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Delivery
                </TabsTrigger>
                <TabsTrigger value="Workers" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Workers
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
        )}

        {/* Team Members Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-xl font-semibold text-foreground">
            Team Members ({filteredMembers.length})
          </h2>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </motion.div>
        )}

        {/* Team Members Grid */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredMembers.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No team members found
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try adjusting your search" : "No colleagues in your team yet"}
                </p>
              </div>
            ) : (
              filteredMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {member.full_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {member.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(member)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{member.phone_number}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground truncate">{member.email}</span>
                        </div>

                        {member.salary !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">
                              ₹{member.salary.toLocaleString('en-IN')}/month
                            </span>
                          </div>
                        )}

                        {member.experience_years !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Experience: {member.experience_years} {member.experience_years === 1 ? 'year' : 'years'}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                            {member.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {member.department}
                          </Badge>
                        </div>

                        {member.address && (
                          <div className="flex items-start gap-2 text-sm pt-2 border-t border-border">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground line-clamp-2">
                              {member.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {user?.role === 'cashier' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="glass-panel border-border">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Assigned Duties</h3>
                  <Badge variant="outline" className="text-xs">
                    Admin Assigned
                  </Badge>
                </div>

                {loadingAssignedDuties ? (
                  <p className="text-sm text-muted-foreground">Loading assigned duties...</p>
                ) : assignedDuties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assigned duties found.</p>
                ) : (
                  <div className="space-y-3">
                    {assignedDuties.map((duty) => (
                      <div
                        key={duty.id}
                        className="rounded-xl border border-border/80 bg-gradient-to-r from-background to-accent/10 px-4 py-3 shadow-sm"
                      >
                        <p className="text-sm font-semibold text-foreground">{duty.profileName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{duty.dutyContent}</p>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-3">
                          <div className="rounded-md bg-muted/50 px-2 py-1">
                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                              <Clock3 className="h-3.5 w-3.5" />
                              Timing:
                            </span>{" "}
                            {duty.timeLabel}
                          </div>
                          <div className="rounded-md bg-muted/50 px-2 py-1">
                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              From:
                            </span>{" "}
                            {duty.startDate ? new Date(duty.startDate).toLocaleDateString("en-IN") : "-"}
                          </div>
                          <div className="rounded-md bg-muted/50 px-2 py-1">
                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              To:
                            </span>{" "}
                            {duty.endDate ? new Date(duty.endDate).toLocaleDateString("en-IN") : "-"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>

          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center gap-3 pb-6 border-b border-border">
            <div className="relative">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                  <UserCircle className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview("");
                  }}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Label
              htmlFor="photo-upload-edit"
              className="cursor-pointer flex items-center gap-2 text-primary hover:underline"
            >
              <Upload className="h-4 w-4" />
              Upload Photo
            </Label>
            <input
              id="photo-upload-edit"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-full_name">Full Name</Label>
              <Input
                id="edit-full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>

            {/* Salary */}
            <div className="space-y-2">
              <Label htmlFor="edit-salary">Salary (per month)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                  placeholder="Enter salary"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date of Joining */}
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date of Joining</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date_of_joining}
                onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
              {formData.date_of_birth && (
                <p className="text-xs text-muted-foreground">
                  Age: {Math.floor((new Date().getTime() - new Date(formData.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                </p>
              )}
            </div>

            {/* Experience Years */}
            <div className="space-y-2">
              <Label htmlFor="edit-experience">Experience (years)</Label>
              <Input
                id="edit-experience"
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                placeholder="Enter years of experience"
              />
            </div>

            {/* Emergency Contact */}
            <div className="space-y-2">
              <Label htmlFor="edit-emergency">Emergency Contact</Label>
              <Input
                id="edit-emergency"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                placeholder="Enter emergency contact number"
              />
            </div>

            {/* Department (disabled) */}
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                value={formData.department}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default TeamMembers;
