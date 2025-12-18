# 🎁 Loyalty Points System Setup Guide

## ⚡ Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Migration SQL

1. Open the file: `frontend/loyalty_points_migration.sql`
2. **Copy all contents** (Ctrl+A, Ctrl+C)
3. **Paste** into Supabase SQL Editor
4. Click **Run** button (or press Ctrl+Enter)

### Step 3: Verify Tables Created

After running, you should see:
```
Success. No rows returned.
```

Check if tables exist:
```sql
SELECT * FROM customers LIMIT 1;
SELECT * FROM invoices LIMIT 1;
```

### Step 4: Test the System

1. Refresh your frontend (Ctrl+Shift+R)
2. Go to **Description** page
3. Add products to cart
4. Click **Create Bill**
5. Enter:
   - Customer Name: Test Customer
   - Mobile: 9360500228
6. Click **Generate Bill**

✅ Should work without errors!

## 🔍 Troubleshooting

### Error: "relation 'customers' does not exist"
**Solution:** Run the migration SQL (Step 2)

### Error: "permission denied for table customers"
**Solution:** The migration includes RLS policies. If still fails, disable RLS:
```sql
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
```

### Error: "Could not find table 'public.customers'"
**Solution:** Make sure you ran the SQL in the correct database (check top-right dropdown)

## 📊 Database Structure

### Customers Table
- `mobile` (Primary Key) - 10-digit mobile number
- `total_points` - Accumulated loyalty points
- `total_purchases` - Total number of invoices
- `last_purchase_date` - Last transaction date

### Invoices Table
- `invoice_number` - Unique invoice ID (INV123456)
- `customer_mobile` - Links to customer
- `items` - JSON array of products
- `total_amount` - Original bill amount
- `points_earned` - Points earned from this purchase
- `points_used` - Points redeemed
- `discount_applied` - Discount amount
- `final_amount` - Amount after discount

## 🎯 How Points Work

### Earning Points
- **Rule:** Purchase Amount ÷ 100 = Points
- Example: ₹2,500 purchase = 25 points

### Redeeming Points
- **Rule:** 100 Points = ₹1 discount
- Example: 1,000 points = ₹10 discount

### Points Flow
1. Customer makes ₹200 purchase → Earns 2 points
2. Next purchase: ₹5,000 (has 2 points)
3. Can redeem 2 points = ₹0.02 discount
4. Final: ₹4,999.98 → Earns 49 new points
5. Total points: 49 (2 used, 49 new earned)

## 🚀 Features Enabled

✅ **Automatic customer creation** on first purchase  
✅ **Points auto-calculated** on every transaction  
✅ **Invoice history** searchable by mobile  
✅ **Optional WhatsApp** bill sending  
✅ **Discount application** at checkout  
✅ **Real-time points balance** display  

---

**Need Help?** Check console errors (F12 → Console tab) for detailed error messages.
