# Staff Management Database Setup Guide

## Steps to Add Default Staff Data to Supabase

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** from the left sidebar
3. Click on **New Query**

### Step 2: Run the Migration
1. Open the file `staff_management_migration.sql` in this folder
2. Copy the entire content of the migration file
3. Paste it into the Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Step 3: Verify the Data
The migration will:
- ✅ Add new columns to the staffs table (salary, emergency_contact, blood_group, etc.)
- ✅ Insert 9 default staff members (3 per department)
- ✅ Show a summary count by department

Expected result:
```
department  | count
-----------+-------
Cashier    |   3
Delivery   |   3
Security   |   3
Workers    |   3
```

### Step 4: Refresh Your Application
1. Go back to your Staff Management page
2. Refresh the page (F5 or Ctrl+R)
3. You should now see all 9 staff members organized by department

## Default Staff Members Created

### Cashiers (3)
- **Priya Sharma** - ₹18,000/month | 2 years exp
- **Rahul Kumar** - ₹17,000/month | 1 year exp
- **Anita Desai** - ₹19,000/month | 3 years exp

### Security Staff (3)
- **Rajesh Gupta** - ₹15,000/month | 5 years exp
- **Suresh Patel** - ₹16,000/month | 7 years exp
- **Amit Verma** - ₹15,500/month | 4 years exp

### Delivery Staff (3)
- **Sanjay Reddy** - ₹16,500/month | 3 years exp
- **Ravi Menon** - ₹17,000/month | 2 years exp
- **Karthik Nair** - ₹16,000/month | 1 year exp

### Workers (3)
- **Ramesh Yadav** - ₹14,000/month | 6 years exp
- **Mohan Lal** - ₹14,500/month | 8 years exp
- **Dinesh Kumar** - ₹13,500/month | 2 years exp

## Troubleshooting

### If you see "No cashiers found":
1. Check if the migration ran successfully
2. Verify table exists: `SELECT * FROM staffs;`
3. Check for errors in Supabase SQL Editor

### If you get duplicate key errors:
- The migration uses `ON CONFLICT DO NOTHING` to prevent duplicates
- If staff with same phone numbers exist, they won't be inserted again

### To reset and start fresh:
```sql
-- Delete all staff data (CAUTION: This removes all staff members)
DELETE FROM staffs;

-- Then re-run the migration
```

## Additional Information

Each staff member includes:
- Full name, phone number, email
- Department
- Joining date
- Complete address (Bangalore locations)
- Monthly salary in ₹ (INR)
- Emergency contact number
- Years of experience

All staff are marked as "Active" by default.
