-- Migration to add new fields to staffs table and insert default data
-- Run this in Supabase SQL Editor

-- Add new columns to staffs table
ALTER TABLE staffs ADD COLUMN IF NOT EXISTS salary integer;
ALTER TABLE staffs ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE staffs ADD COLUMN IF NOT EXISTS experience_years integer;
ALTER TABLE staffs ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE staffs ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- Insert default Cashiers (3 members)
INSERT INTO staffs (full_name, phone_number, email, department, status, date_of_joining, address, salary, emergency_contact, experience_years, date_of_birth)
VALUES 
  ('Priya Sharma', '9876543210', 'priya.sharma@supermarket.com', 'Cashier', 'Active', '2025-01-15', '123 MG Road, Bangalore, Karnataka - 560001', 18000, '9876543299', 2, '1998-05-15'),
  ('Rahul Kumar', '9876543211', 'rahul.kumar@supermarket.com', 'Cashier', 'Active', '2025-02-01', '45 Residency Road, Bangalore, Karnataka - 560025', 17000, '9876543288', 1, '1999-08-22'),
  ('Anita Desai', '9876543212', 'anita.desai@supermarket.com', 'Cashier', 'Active', '2025-03-10', '78 Brigade Road, Bangalore, Karnataka - 560001', 19000, '9876543277', 3, '1996-03-10')
ON CONFLICT (phone_number) DO NOTHING;

-- Insert default Security Staff (3 members)
INSERT INTO staffs (full_name, phone_number, email, department, status, date_of_joining, address, salary, emergency_contact, experience_years, date_of_birth)
VALUES 
  ('Rajesh Gupta', '9876543214', 'rajesh.gupta@supermarket.com', 'Security', 'Active', '2024-12-01', '56 Indiranagar, Bangalore, Karnataka - 560038', 15000, '9876543266', 5, '1993-07-20'),
  ('Suresh Patel', '9876543215', 'suresh.patel@supermarket.com', 'Security', 'Active', '2024-12-15', '89 Koramangala, Bangalore, Karnataka - 560034', 16000, '9876543255', 7, '1990-11-05'),
  ('Amit Verma', '9876543216', 'amit.verma@supermarket.com', 'Security', 'Active', '2025-01-05', '234 Jayanagar, Bangalore, Karnataka - 560041', 15500, '9876543244', 4, '1995-09-12')
ON CONFLICT (phone_number) DO NOTHING;

-- Insert default Delivery Staff (3 members)
INSERT INTO staffs (full_name, phone_number, email, department, status, date_of_joining, address, salary, emergency_contact, experience_years, date_of_birth)
VALUES 
  ('Sanjay Reddy', '9876543217', 'sanjay.reddy@supermarket.com', 'Delivery', 'Active', '2025-01-10', '12 BTM Layout, Bangalore, Karnataka - 560076', 16500, '9876543233', 3, '1997-01-25'),
  ('Ravi Menon', '9876543218', 'ravi.menon@supermarket.com', 'Delivery', 'Active', '2025-02-05', '67 Whitefield, Bangalore, Karnataka - 560066', 17000, '9876543222', 2, '1998-06-18'),
  ('Karthik Nair', '9876543219', 'karthik.nair@supermarket.com', 'Delivery', 'Active', '2025-02-20', '90 Electronic City, Bangalore, Karnataka - 560100', 16000, '9876543211', 1, '2000-04-30')
ON CONFLICT (phone_number) DO NOTHING;

-- Insert default Workers (3 members)
INSERT INTO staffs (full_name, phone_number, email, department, status, date_of_joining, address, salary, emergency_contact, experience_years, date_of_birth)
VALUES 
  ('Ramesh Yadav', '9876543220', 'ramesh.yadav@supermarket.com', 'Workers', 'Active', '2024-11-15', '145 Marathahalli, Bangalore, Karnataka - 560037', 14000, '9876543200', 6, '1992-02-14'),
  ('Mohan Lal', '9876543221', 'mohan.lal@supermarket.com', 'Workers', 'Active', '2024-12-01', '23 RT Nagar, Bangalore, Karnataka - 560032', 14500, '9876543189', 8, '1988-10-08'),
  ('Dinesh Kumar', '9876543222', 'dinesh.kumar@supermarket.com', 'Workers', 'Active', '2025-01-12', '456 Yelahanka, Bangalore, Karnataka - 560064', 13500, '9876543178', 2, '1998-12-20')
ON CONFLICT (phone_number) DO NOTHING;

-- Verify the data
SELECT department, COUNT(*) as count FROM staffs WHERE status = 'Active' GROUP BY department ORDER BY department;
