import { supabase } from '@/lib/supabase';
import type {
  Staff,
  StaffFormData,
  Duty,
  DutyFormData,
  Event,
  EventFormData,
  StaffFilters,
  DutyFilters,
  EventFilters,
  PaginationParams,
  DashboardStats,
} from '@/types/admin';

// ==========================================
// STAFF OPERATIONS
// ==========================================

/**
 * Fetch all staffs with optional filters and pagination
 */
export async function fetchStaffs(
  filters?: StaffFilters,
  pagination?: PaginationParams
) {
  let query = supabase.from('staffs').select('*', { count: 'exact' });

  // Apply filters
  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  if (filters?.role) {
    query = query.eq('role', filters.role);
  }

  if (filters?.department) {
    query = query.eq('department', filters.department);
  }

  if (filters?.status && filters.status !== 'All') {
    query = query.eq('status', filters.status);
  }

  // Apply pagination
  if (pagination) {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  // Order by created date
  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching staffs:', error);
    throw error;
  }

  return { data: data as Staff[], count: count || 0 };
}

/**
 * Fetch a single staff by ID
 */
export async function fetchStaffById(id: string) {
  const { data, error } = await supabase
    .from('staffs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }

  return data as Staff;
}

/**
 * Create a new staff member
 */
export async function createStaff(staffData: StaffFormData) {
  const { data, error } = await supabase
    .from('staffs')
    .insert([{ ...staffData, status: staffData.status || 'Active' }])
    .select()
    .single();

  if (error) {
    console.error('Error creating staff:', error);
    throw error;
  }

  return data as Staff;
}

/**
 * Update an existing staff member
 */
export async function updateStaff(id: string, staffData: Partial<StaffFormData>) {
  const { data, error } = await supabase
    .from('staffs')
    .update(staffData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating staff:', error);
    throw error;
  }

  return data as Staff;
}

/**
 * Soft delete a staff member (set status to Inactive)
 */
export async function softDeleteStaff(id: string) {
  const { data, error } = await supabase
    .from('staffs')
    .update({ status: 'Inactive' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error deleting staff:', error);
    throw error;
  }

  return data as Staff;
}

/**
 * Permanently delete a staff member (use with caution)
 */
export async function deleteStaff(id: string) {
  const { error } = await supabase.from('staffs').delete().eq('id', id);

  if (error) {
    console.error('Error permanently deleting staff:', error);
    throw error;
  }

  return true;
}

/**
 * Fetch staff by phone number (for logged-in staff to access their profile)
 */
export async function fetchStaffByPhone(phoneNumber: string) {
  const { data, error } = await supabase
    .from('staffs')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('status', 'Active')
    .single();

  if (error) {
    console.error('Error fetching staff by phone:', error);
    throw error;
  }

  return data as Staff;
}

/**
 * Update staff profile (used by staff members to update their own profile)
 */
export async function updateStaffProfile(phoneNumber: string, staffData: Partial<StaffFormData>) {
  const { data, error } = await supabase
    .from('staffs')
    .update(staffData)
    .eq('phone_number', phoneNumber)
    .select()
    .single();

  if (error) {
    console.error('Error updating staff profile:', error);
    throw error;
  }

  return data as Staff;
}

/**
 * Fetch all staff members by department
 */
export async function fetchStaffByDepartment(department: string) {
  const { data, error } = await supabase
    .from('staffs')
    .select('*')
    .eq('department', department)
    .eq('status', 'Active')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching staff by department:', error);
    throw error;
  }

  return data as Staff[];
}

/**
 * Fetch all staff members by role (for cashier team view)
 */
export async function fetchStaffByRole(role: string) {
  // For cashiers, we fetch from staffs table where department is 'Cashier'
  const { data, error } = await supabase
    .from('staffs')
    .select('*')
    .eq('department', 'Cashier')
    .eq('status', 'Active')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching staff by role:', error);
    throw error;
  }

  return data as Staff[];
}

// ==========================================
// DUTIES OPERATIONS
// ==========================================

/**
 * Fetch duties with optional filters
 */
export async function fetchDuties(filters?: DutyFilters) {
  let query = supabase
    .from('duties')
    .select('*, staffs(full_name, role, department)');

  // Apply filters
  if (filters?.staff_id) {
    query = query.eq('staff_id', filters.staff_id);
  }

  if (filters?.status && filters.status !== 'All') {
    query = query.eq('status', filters.status);
  }

  if (filters?.date_from) {
    query = query.gte('deadline', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('deadline', filters.date_to);
  }

  // Order by deadline
  query = query.order('deadline', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching duties:', error);
    throw error;
  }

  return data as Duty[];
}

/**
 * Fetch duties for a specific staff member
 */
export async function fetchDutiesByStaffId(staffId: string) {
  const { data, error } = await supabase
    .from('duties')
    .select('*')
    .eq('staff_id', staffId)
    .order('deadline', { ascending: true });

  if (error) {
    console.error('Error fetching staff duties:', error);
    throw error;
  }

  return data as Duty[];
}

/**
 * Create a new duty
 */
export async function createDuty(dutyData: DutyFormData) {
  const { data, error } = await supabase
    .from('duties')
    .insert([{ ...dutyData, status: dutyData.status || 'Pending' }])
    .select()
    .single();

  if (error) {
    console.error('Error creating duty:', error);
    throw error;
  }

  return data as Duty;
}

/**
 * Update duty status or details
 */
export async function updateDuty(id: string, dutyData: Partial<DutyFormData>) {
  const { data, error } = await supabase
    .from('duties')
    .update(dutyData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating duty:', error);
    throw error;
  }

  return data as Duty;
}

/**
 * Delete a duty
 */
export async function deleteDuty(id: string) {
  const { error } = await supabase.from('duties').delete().eq('id', id);

  if (error) {
    console.error('Error deleting duty:', error);
    throw error;
  }

  return true;
}

// ==========================================
// EVENTS (CALENDAR) OPERATIONS
// ==========================================

/**
 * Fetch events with optional filters
 */
export async function fetchEvents(filters?: EventFilters) {
  let query = supabase.from('events').select('*');

  // Apply filters
  if (filters?.event_type && filters.event_type !== 'All') {
    query = query.eq('event_type', filters.event_type);
  }

  if (filters?.date_from) {
    query = query.gte('event_date', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('event_date', filters.date_to);
  }

  // Order by event date and time
  query = query.order('event_date', { ascending: true });
  query = query.order('event_time', { ascending: true, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data as Event[];
}

/**
 * Fetch upcoming events (next 30 days)
 */
export async function fetchUpcomingEvents() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', today)
    .lte('event_date', thirtyDaysLater)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming events:', error);
    throw error;
  }

  return data as Event[];
}

/**
 * Create a new event
 */
export async function createEvent(eventData: EventFormData) {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }

  return data as Event;
}

/**
 * Update an existing event
 */
export async function updateEvent(id: string, eventData: Partial<EventFormData>) {
  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }

  return data as Event;
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) {
    console.error('Error deleting event:', error);
    throw error;
  }

  return true;
}

// ==========================================
// DASHBOARD ANALYTICS
// ==========================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get staff counts
    const { count: totalStaff } = await supabase
      .from('staffs')
      .select('*', { count: 'exact', head: true });

    const { count: activeStaff } = await supabase
      .from('staffs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active');

    const { count: inactiveStaff } = await supabase
      .from('staffs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Inactive');

    // Get duty counts
    const { count: pendingDuties } = await supabase
      .from('duties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    const { count: completedDuties } = await supabase
      .from('duties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Completed');

    // Get upcoming events count (next 7 days)
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { count: upcomingEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', today)
      .lte('event_date', sevenDaysLater);

    return {
      total_staff: totalStaff || 0,
      active_staff: activeStaff || 0,
      inactive_staff: inactiveStaff || 0,
      pending_duties: pendingDuties || 0,
      completed_duties: completedDuties || 0,
      upcoming_events: upcomingEvents || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}
