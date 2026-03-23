-- ==========================================
-- FIX RLS POLICIES - COMPLETE RESET
-- ==========================================
-- Run this in Supabase SQL Editor to fix the RLS policies

-- Disable RLS temporarily to drop all policies
ALTER TABLE staffs DISABLE ROW LEVEL SECURITY;
ALTER TABLE duties DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Admin only access to staffs" ON staffs;
DROP POLICY IF EXISTS "Allow all operations on staffs for authenticated users" ON staffs;
DROP POLICY IF EXISTS "Admin only access to duties" ON duties;
DROP POLICY IF EXISTS "Allow all operations on duties for authenticated users" ON duties;
DROP POLICY IF EXISTS "Admin only access to events" ON events;
DROP POLICY IF EXISTS "Allow all operations on events for authenticated users" ON events;

-- Re-enable RLS
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create new permissive policies
CREATE POLICY "staffs_all_access"
  ON staffs
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "duties_all_access"
  ON duties
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "events_all_access"
  ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);
