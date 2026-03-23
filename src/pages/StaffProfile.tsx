import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User, 
  Save, 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building2,
  Loader2 
} from "lucide-react";
import { fetchStaffByPhone, updateStaffProfile } from "@/services/adminApi";
import { uploadStaffPhoto } from "@/lib/supabaseStorage";
import type { Staff, StaffFormData } from "@/types/admin";

const StaffProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [staffData, setStaffData] = useState<Staff | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  
  const [formData, setFormData] = useState<StaffFormData>({
    full_name: '',
    phone_number: '',
    email: '',
    date_of_joining: '',
    department: '',
    address: '',
    profile_photo_url: '',
  });

  // Load staff profile on mount
  useEffect(() => {
    loadStaffProfile();
  }, []);

  const loadStaffProfile = async () => {
    try {
      setIsLoading(true);
      // For demo purposes, we'll use a mapping of username to phone number
      // In production, you'd store this in the database
      const phoneMapping: Record<string, string> = {
        'staff': '9876543210', // Default staff phone number
      };
      
      const phoneNumber = phoneMapping[user?.username || ''];
      
      if (!phoneNumber) {
        toast({
          title: "Error",
          description: "No profile found for this user",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const data = await fetchStaffByPhone(phoneNumber);
      setStaffData(data);
      setFormData({
        full_name: data.full_name,
        phone_number: data.phone_number,
        email: data.email || '',
        date_of_joining: data.date_of_joining || '',
        department: data.department || '',
        address: data.address || '',
        profile_photo_url: data.profile_photo_url || '',
      });
      setPhotoPreview(data.profile_photo_url || '');
    } catch (error) {
      console.error('Error loading staff profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let photoUrl = formData.profile_photo_url;
      
      // Upload new photo if selected
      if (photoFile) {
        photoUrl = await uploadStaffPhoto(photoFile, staffData?.id || '');
      }

      const updatedData = await updateStaffProfile(
        formData.phone_number,
        { ...formData, profile_photo_url: photoUrl }
      );

      setStaffData(updatedData);
      setPhotoFile(null);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <User className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground">Manage your personal information</p>
          </div>
        </motion.div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-panel border-border">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">Personal Information</CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center gap-4 pb-6 border-b border-border">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-16 w-16 text-white" />
                      )}
                    </div>
                    <label
                      htmlFor="photo-upload"
                      className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center cursor-pointer shadow-lg transition-colors"
                    >
                      <Camera className="h-5 w-5 text-white" />
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">{formData.full_name}</p>
                    <p className="text-sm text-muted-foreground">{formData.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="bg-background border-border"
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      className="bg-background border-border"
                      disabled
                      title="Phone number cannot be changed"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-background border-border"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  {/* Date of Joining */}
                  <div className="space-y-2">
                    <Label htmlFor="date_of_joining" className="text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date of Joining
                    </Label>
                    <Input
                      id="date_of_joining"
                      type="date"
                      value={formData.date_of_joining}
                      className="bg-background border-border"
                      disabled
                      title="Date of joining cannot be changed"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Department
                    </Label>
                    <Input
                      id="department"
                      value={formData.department}
                      className="bg-background border-border"
                      disabled
                      title="Department cannot be changed"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-background border-border"
                    placeholder="Enter your full address"
                  />
                </div>

                {/* Status Info */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Account Status</span>
                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 font-medium">
                      {staffData?.status}
                    </span>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default StaffProfile;
