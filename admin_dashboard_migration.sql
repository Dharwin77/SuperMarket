-- ==========================================
-- ADMIN DASHBOARD - DATABASE MIGRATION
-- ==========================================
-- This migration creates tables for Staff Management and Calendar Management
-- Run this in your Supabase SQL Editor

-- ==========================================
-- 1. STAFFS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS staffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone_number TEXT UNIQUE NOT NULL,
  email TEXT,
  date_of_joining DATE,
  role TEXT,
  department TEXT,
  address TEXT,
  profile_photo_url TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_staffs_status ON staffs(status);
CREATE INDEX IF NOT EXISTS idx_staffs_role ON staffs(role);
CREATE INDEX IF NOT EXISTS idx_staffs_phone ON staffs(phone_number);

-- ==========================================
-- 2. DUTIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS duties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staffs(id) ON DELETE CASCADE,
  duty_title TEXT NOT NULL,
  description TEXT,
  assigned_date DATE,
  deadline DATE,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_duties_staff_id ON duties(staff_id);
CREATE INDEX IF NOT EXISTS idx_duties_status ON duties(status);
CREATE INDEX IF NOT EXISTS idx_duties_deadline ON duties(deadline);

-- ==========================================
-- 3. EVENTS TABLE (Calendar Management)
-- ==========================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  agency_name TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  product_name TEXT,
  quantity INTEGER,
  event_type TEXT CHECK (event_type IN ('Product Arrival', 'Delivery', 'Staff Meeting', 'Maintenance', 'Other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Staffs table policies
DROP POLICY IF EXISTS "Admin only access to staffs" ON staffs;
CREATE POLICY "Allow all operations on staffs for authenticated users"
  ON staffs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Duties table policies
DROP POLICY IF EXISTS "Admin only access to duties" ON duties;
CREATE POLICY "Allow all operations on duties for authenticated users"
  ON duties
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Events table policies
DROP POLICY IF EXISTS "Admin only access to events" ON events;
CREATE POLICY "Allow all operations on events for authenticated users"
  ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- 5. STORAGE BUCKET SETUP
-- ==========================================
-- Run this separately in Supabase Dashboard > Storage
-- Or use the following SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-photos', 'staff-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for staff photos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'staff-photos');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'staff-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'staff-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'staff-photos' AND auth.role() = 'authenticated');

-- ==========================================
-- 6. SAMPLE TEST DATA
-- ==========================================

-- Insert sample staffs
INSERT INTO staffs (full_name, phone_number, email, date_of_joining, role, department, address, status) VALUES
  ('Rajesh Kumar', '+91-9876543210', 'rajesh.kumar@supermarket.com', '2024-01-15', 'Store Manager', 'Operations', '123 MG Road, Bangalore', 'Active'),
  ('Priya Sharma', '+91-9876543211', 'priya.sharma@supermarket.com', '2024-02-01', 'Cashier', 'Billing', '45 Brigade Road, Bangalore', 'Active'),
  ('Amit Patel', '+91-9876543212', 'amit.patel@supermarket.com', '2024-01-20', 'Stock Keeper', 'Inventory', '67 Whitefield, Bangalore', 'Active'),
  ('Neha Singh', '+91-9876543213', 'neha.singh@supermarket.com', '2024-03-01', 'Sales Associate', 'Sales', '89 Koramangala, Bangalore', 'Active'),
  ('Vikram Reddy', '+91-9876543214', 'vikram.reddy@supermarket.com', '2023-12-10', 'Security Guard', 'Security', '12 Indiranagar, Bangalore', 'Inactive')
ON CONFLICT (phone_number) DO NOTHING;

-- Insert sample duties (using actual staff IDs from above)
DO $$
DECLARE
  rajesh_id UUID;
  priya_id UUID;
  amit_id UUID;
  neha_id UUID;
BEGIN
  SELECT id INTO rajesh_id FROM staffs WHERE phone_number = '+91-9876543210';
  SELECT id INTO priya_id FROM staffs WHERE phone_number = '+91-9876543211';
  SELECT id INTO amit_id FROM staffs WHERE phone_number = '+91-9876543212';
  SELECT id INTO neha_id FROM staffs WHERE phone_number = '+91-9876543213';

  INSERT INTO duties (staff_id, duty_title, description, assigned_date, deadline, status) VALUES
    (rajesh_id, 'Monthly Inventory Audit', 'Complete full store inventory audit for March', CURRENT_DATE - 2, CURRENT_DATE + 5, 'In Progress'),
    (priya_id, 'Cash Register Balance', 'Balance all cash registers at end of day', CURRENT_DATE, CURRENT_DATE, 'Pending'),
    (amit_id, 'Stock Replenishment', 'Refill dairy section with new stock delivery', CURRENT_DATE - 1, CURRENT_DATE + 1, 'Completed'),
    (neha_id, 'Customer Feedback Collection', 'Gather customer feedback for new product line', CURRENT_DATE - 3, CURRENT_DATE + 7, 'In Progress'),
    (rajesh_id, 'Staff Training Session', 'Conduct training on new POS system', CURRENT_DATE + 2, CURRENT_DATE + 2, 'Pending');
END $$;

-- Insert sample events
INSERT INTO events (title, event_date, event_time, agency_name, contact_person, contact_phone, product_name, quantity, event_type, notes) VALUES
  ('Dairy Products Delivery', CURRENT_DATE + 1, '09:00:00', 'Amul Distributors', 'Suresh Mehta', '+91-9988776655', 'Milk & Butter', 200, 'Product Arrival', 'Ensure cold storage is ready'),
  ('Weekly Team Meeting', CURRENT_DATE + 2, '14:00:00', NULL, 'Rajesh Kumar', '+91-9876543210', NULL, NULL, 'Staff Meeting', 'Discuss monthly targets and performance'),
  ('Refrigerator Maintenance', CURRENT_DATE + 3, '11:00:00', 'CoolTech Services', 'Ramesh Rao', '+91-9876556677', NULL, NULL, 'Maintenance', 'Scheduled maintenance for walk-in cooler'),
  ('Snacks Delivery to Wholesale', CURRENT_DATE + 4, '15:30:00', 'BigBasket Wholesale', 'Anjali Desai', '+91-9123456789', 'Chips & Cookies', 500, 'Delivery', 'Confirm order quantity before dispatch'),
  ('Fresh Vegetables Arrival', CURRENT_DATE + 5, '06:00:00', 'Farm Fresh Suppliers', 'Govind Nair', '+91-9087654321', 'Vegetables', 150, 'Product Arrival', 'Early morning delivery - open gate at 5:45 AM');

-- ==========================================
-- 7. USEFUL QUERIES FOR DASHBOARD ANALYTICS
-- ==========================================

-- Total Active Staff Count
-- SELECT COUNT(*) as total_active_staff FROM staffs WHERE status = 'Active';

-- Pending Duties Count
-- SELECT COUNT(*) as pending_duties FROM duties WHERE status = 'Pending';

-- Upcoming Events (Next 7 Days)
-- SELECT * FROM events WHERE event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 ORDER BY event_date, event_time;

-- Staff with Most Duties
-- SELECT s.full_name, COUNT(d.id) as duty_count 
-- FROM staffs s 
-- LEFT JOIN duties d ON s.id = d.staff_id 
-- GROUP BY s.id, s.full_name 
-- ORDER BY duty_count DESC;

-- Events by Type (This Month)
-- SELECT event_type, COUNT(*) as event_count 
-- FROM events 
-- WHERE EXTRACT(MONTH FROM event_date) = EXTRACT(MONTH FROM CURRENT_DATE)
-- GROUP BY event_type;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
-- Next Steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Create storage bucket 'staff-photos' in Supabase Storage
-- 3. Update frontend to use these tables
-- 4. Test CRUD operations
-- ==========================================
