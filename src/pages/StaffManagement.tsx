import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  UserCircle,
  Upload,
  X,
  Wallet,
  Shield,
  Truck,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  fetchStaffs,
  createStaff,
  updateStaff,
  softDeleteStaff,
} from '@/services/adminApi';
import { uploadStaffPhoto } from '@/lib/supabaseStorage';
import type { Staff, StaffFormData, StaffFilters } from '@/types/admin';
import { DEPARTMENTS } from '@/types/admin';

export default function StaffManagement() {
  const { toast } = useToast();
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cashiers');
  const [activeStaffTab, setActiveStaffTab] = useState('security');

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState<StaffFormData>({
    full_name: '',
    phone_number: '',
    email: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    date_of_birth: '',
    department: '',
    address: '',
    status: 'Active',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Load staff data on mount
  useEffect(() => {
    loadStaffs();
  }, []);

  async function loadStaffs() {
    try {
      setLoading(true);
      const { data } = await fetchStaffs({});
      setStaffs(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      full_name: '',
      phone_number: '',
      email: '',
      date_of_joining: new Date().toISOString().split('T')[0],
      date_of_birth: '',
      department: '',
      address: '',
      salary: undefined,
      emergency_contact: '',
      experience_years: undefined,
      status: 'Active',
    });
    setPhotoFile(null);
    setPhotoPreview('');
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleAddStaff() {
    if (!formData.full_name || !formData.phone_number) {
      toast({
        title: 'Validation Error',
        description: 'Name and phone number are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      let photoUrl = '';
      if (photoFile) {
        photoUrl = await uploadStaffPhoto(photoFile, Date.now().toString());
      }

      await createStaff({ ...formData, profile_photo_url: photoUrl });

      toast({
        title: 'Success',
        description: 'Staff member added successfully',
      });

      setShowAddDialog(false);
      resetForm();
      loadStaffs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add staff member',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStaff() {
    if (!selectedStaff || !formData.full_name || !formData.phone_number) {
      toast({
        title: 'Validation Error',
        description: 'Name and phone number are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      let photoUrl = formData.profile_photo_url;
      if (photoFile) {
        photoUrl = await uploadStaffPhoto(photoFile, selectedStaff.id);
      }

      await updateStaff(selectedStaff.id, { ...formData, profile_photo_url: photoUrl });

      toast({
        title: 'Success',
        description: 'Staff member updated successfully',
      });

      setShowEditDialog(false);
      setSelectedStaff(null);
      resetForm();
      loadStaffs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update staff member',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteStaff(staff: Staff) {
    if (!confirm(`Are you sure you want to deactivate ${staff.full_name}?`)) {
      return;
    }

    try {
      await softDeleteStaff(staff.id);
      toast({
        title: 'Success',
        description: 'Staff member deactivated',
      });
      loadStaffs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate staff member',
        variant: 'destructive',
      });
    }
  }

  function openEditDialog(staff: Staff) {
    setSelectedStaff(staff);
    setFormData({
      full_name: staff.full_name,
      phone_number: staff.phone_number,
      email: staff.email || '',
      date_of_joining: staff.date_of_joining || '',
      date_of_birth: staff.date_of_birth || '',
      department: staff.department || '',
      address: staff.address || '',
      salary: staff.salary,
      emergency_contact: staff.emergency_contact || '',
      experience_years: staff.experience_years,
      profile_photo_url: staff.profile_photo_url,
      status: staff.status,
    });
    setPhotoPreview(staff.profile_photo_url || '');
    setShowEditDialog(true);
  }

  function openAddDialog(department: string) {
    resetForm();
    setFormData(prev => ({ ...prev, department }));
    setShowAddDialog(true);
  }

  // Filter staff by department
  const cashierStaff = staffs.filter(s => s.department === 'Cashier' && s.status === 'Active');
  const securityStaff = staffs.filter(s => s.department === 'Security' && s.status === 'Active');
  const deliveryStaff = staffs.filter(s => s.department === 'Delivery' && s.status === 'Active');
  const workerStaff = staffs.filter(s => s.department === 'Workers' && s.status === 'Active');

  // Filter based on search
  const filterStaff = (staffList: Staff[]) => {
    if (!searchTerm) return staffList;
    return staffList.filter(s =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone_number.includes(searchTerm) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const StaffCard = ({ staff }: { staff: Staff }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {staff.profile_photo_url ? (
                <img
                  src={staff.profile_photo_url}
                  alt={staff.full_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-foreground">{staff.full_name}</h3>
                <p className="text-sm text-muted-foreground">{staff.department || 'N/A'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(staff)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteStaff(staff)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{staff.phone_number}</span>
            </div>
            {staff.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{staff.email}</span>
              </div>
            )}
            {staff.salary && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <span className="font-medium">₹{staff.salary.toLocaleString('en-IN')}/month</span>
              </div>
            )}
            {staff.experience_years !== undefined && (
              <div className="text-xs text-muted-foreground">
                Experience: {staff.experience_years} {staff.experience_years === 1 ? 'year' : 'years'}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={staff.status === 'Active' ? 'default' : 'secondary'}>
                {staff.status}
              </Badge>
              {staff.department && (
                <Badge variant="outline">{staff.department}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Staff Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage cashiers and staff members across all departments
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="cashiers" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Cashiers
            </TabsTrigger>
            <TabsTrigger value="staffs" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staffs
            </TabsTrigger>
          </TabsList>

          {/* Cashiers Tab */}
          <TabsContent value="cashiers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Cashiers ({cashierStaff.length})</h2>
                <p className="text-sm text-muted-foreground">Manage cashier team members</p>
              </div>
              <Button onClick={() => openAddDialog('Cashier')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Cashier
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filterStaff(cashierStaff).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">No cashiers found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterStaff(cashierStaff).map((staff) => (
                  <StaffCard key={staff.id} staff={staff} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Staffs Tab */}
          <TabsContent value="staffs" className="space-y-6">
            <Tabs value={activeStaffTab} onValueChange={setActiveStaffTab}>
              <TabsList className="grid w-full max-w-2xl grid-cols-3">
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="delivery" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Delivery
                </TabsTrigger>
                <TabsTrigger value="workers" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Workers
                </TabsTrigger>
              </TabsList>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Security Staff ({securityStaff.length})</h2>
                    <p className="text-sm text-muted-foreground">Manage security team members</p>
                  </div>
                  <Button onClick={() => openAddDialog('Security')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Security Staff
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : filterStaff(securityStaff).length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground">No security staff found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterStaff(securityStaff).map((staff) => (
                      <StaffCard key={staff.id} staff={staff} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Delivery Tab */}
              <TabsContent value="delivery" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Delivery Staff ({deliveryStaff.length})</h2>
                    <p className="text-sm text-muted-foreground">Manage delivery team members</p>
                  </div>
                  <Button onClick={() => openAddDialog('Delivery')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Delivery Staff
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : filterStaff(deliveryStaff).length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground">No delivery staff found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterStaff(deliveryStaff).map((staff) => (
                      <StaffCard key={staff.id} staff={staff} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Workers Tab */}
              <TabsContent value="workers" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Workers ({workerStaff.length})</h2>
                    <p className="text-sm text-muted-foreground">Manage worker team members</p>
                  </div>
                  <Button onClick={() => openAddDialog('Workers')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Worker
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : filterStaff(workerStaff).length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground">No workers found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterStaff(workerStaff).map((staff) => (
                      <StaffCard key={staff.id} staff={staff} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Add Staff Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new {formData.department} member
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-4">
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
                        setPhotoPreview('');
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex items-center gap-2 text-primary hover:underline"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_joining">Date of Joining</Label>
                  <Input
                    id="date_of_joining"
                    type="date"
                    value={formData.date_of_joining}
                    onChange={(e) =>
                      setFormData({ ...formData, date_of_joining: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData({ ...formData, date_of_birth: e.target.value })
                    }
                  />
                  {formData.date_of_birth && (
                    <p className="text-xs text-muted-foreground">
                      Age: {Math.floor((new Date().getTime() - new Date(formData.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (₹/month)</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                    placeholder="Enter monthly salary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact Number</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact || ''}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="Enter emergency contact number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_years">Experience (Years)</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={formData.experience_years || ''}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                    placeholder="Enter years of experience"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStaff} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Staff'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Staff Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>Update staff member details</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-4">
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
                        setPhotoPreview('');
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_full_name">Full Name *</Label>
                  <Input
                    id="edit_full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_phone_number">Phone Number *</Label>
                  <Input
                    id="edit_phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_date_of_joining">Date of Joining</Label>
                  <Input
                    id="edit_date_of_joining"
                    type="date"
                    value={formData.date_of_joining}
                    onChange={(e) =>
                      setFormData({ ...formData, date_of_joining: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_date_of_birth">Date of Birth</Label>
                  <Input
                    id="edit_date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData({ ...formData, date_of_birth: e.target.value })
                    }
                  />
                  {formData.date_of_birth && (
                    <p className="text-xs text-muted-foreground">
                      Age: {Math.floor((new Date().getTime() - new Date(formData.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_salary">Salary (₹/month)</Label>
                  <Input
                    id="edit_salary"
                    type="number"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                    placeholder="Enter monthly salary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_emergency_contact">Emergency Contact Number</Label>
                  <Input
                    id="edit_emergency_contact"
                    value={formData.emergency_contact || ''}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="Enter emergency contact number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_experience_years">Experience (Years)</Label>
                  <Input
                    id="edit_experience_years"
                    type="number"
                    value={formData.experience_years || ''}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                    placeholder="Enter years of experience"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'Active' | 'Inactive') =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_address">Address</Label>
                <Textarea
                  id="edit_address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStaff} disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Staff'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </MainLayout>
  );
}
