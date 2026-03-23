// ==========================================
// DATABASE TYPES FOR ADMIN DASHBOARD
// ==========================================

export interface Staff {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  date_of_joining?: string;
  date_of_birth?: string;
  department?: string;
  address?: string;
  profile_photo_url?: string;
  salary?: number;
  emergency_contact?: string;
  experience_years?: number;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface Duty {
  id: string;
  staff_id: string;
  duty_title: string;
  description?: string;
  assigned_date?: string;
  deadline?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  agency_name?: string;
  contact_person?: string;
  contact_phone?: string;
  product_name?: string;
  quantity?: number;
  event_type?: 'Product Arrival' | 'Delivery' | 'Staff Meeting' | 'Maintenance' | 'Other';
  notes?: string;
  created_at: string;
}

// Form data types (without generated fields)
export interface StaffFormData {
  full_name: string;
  phone_number: string;
  email?: string;
  date_of_joining?: string;
  date_of_birth?: string;
  department?: string;
  address?: string;
  profile_photo_url?: string;
  salary?: number;
  emergency_contact?: string;
  experience_years?: number;
  status?: 'Active' | 'Inactive';
}

export interface DutyFormData {
  staff_id: string;
  duty_title: string;
  description?: string;
  assigned_date?: string;
  deadline?: string;
  status?: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
}

export interface EventFormData {
  title: string;
  event_date: string;
  event_time?: string;
  agency_name?: string;
  contact_person?: string;
  contact_phone?: string;
  product_name?: string;
  quantity?: number;
  event_type?: 'Product Arrival' | 'Delivery' | 'Staff Meeting' | 'Maintenance' | 'Other';
  notes?: string;
}

// Extended types for joined data
export interface StaffWithDuties extends Staff {
  duties?: Duty[];
  pending_duties_count?: number;
  completed_duties_count?: number;
}

// Dashboard analytics types
export interface DashboardStats {
  total_staff: number;
  active_staff: number;
  inactive_staff: number;
  pending_duties: number;
  completed_duties: number;
  upcoming_events: number;
}

// Filter and pagination types
export interface StaffFilters {
  search?: string;
  role?: string;
  department?: string;
  status?: 'Active' | 'Inactive' | 'All';
}

export interface DutyFilters {
  staff_id?: string;
  status?: 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'All';
  date_from?: string;
  date_to?: string;
}

export interface EventFilters {
  event_type?: 'Product Arrival' | 'Delivery' | 'Staff Meeting' | 'Maintenance' | 'Other' | 'All';
  date_from?: string;
  date_to?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// Constants
export const STAFF_ROLES = [
  'Store Manager',
  'Cashier',
  'Stock Keeper',
  'Sales Associate',
  'Security Guard',
  'Supervisor',
  'Assistant Manager',
] as const;

export const DEPARTMENTS = [
  'Cashier',
  'Security',
  'Delivery',
  'Workers',
] as const;

export const DUTY_STATUSES = [
  'Pending',
  'In Progress',
  'Completed',
  'Overdue',
] as const;

export const EVENT_TYPES = [
  'Product Arrival',
  'Delivery',
  'Staff Meeting',
  'Maintenance',
  'Other',
] as const;

export const EVENT_TYPE_COLORS: Record<string, string> = {
  'Product Arrival': '#3B82F6', // Blue
  'Delivery': '#10B981', // Green
  'Staff Meeting': '#F59E0B', // Yellow/Orange
  'Maintenance': '#EF4444', // Red
  'Other': '#8B5CF6', // Purple
};
