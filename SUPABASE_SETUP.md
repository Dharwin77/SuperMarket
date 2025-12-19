# Supabase Backend Setup (100% FREE - No Credit Card!) 🚀

## ✅ What's Been Done:

- **Supabase Client Installed** - All packages ready
- **Configuration Files** - `.env.local` created
- **API Service Layer** - Complete CRUD operations for Products, Sales, Purchase Orders
- **React Query Hooks** - Ready-to-use hooks in `useSupabase.ts`

---

## 🎯 Setup Supabase (5 Minutes - NO BILLING REQUIRED!)

### **Step 1: Create Free Supabase Account**

1. Go to https://supabase.com/
2. Click **"Start your project"**
3. Sign in with **GitHub** (easiest) or email
4. ✅ **No credit card required!**

---

### **Step 2: Create New Project**

1. Click **"New Project"**
2. Fill in:
   - **Name**: `SuperMarket`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: **FREE** (selected by default)
3. Click **"Create new project"**
4. Wait ~2 minutes for setup

---

### **Step 3: Create Database Tables**

1. Go to **Table Editor** (left sidebar)
2. Click **"New table"**

#### **Create `products` table:**

Click **"New table"** and add:

```
Table name: products

Columns:
- id (uuid, primary key, auto-generated) ✅ Default
- created_at (timestamptz) ✅ Default
- name (text, required)
- barcode (text, required, unique)
- price (numeric, required)
- stock (int4, required)
- category (text, required)
- imported_date (date)
- expiry_date (date)
- image_url (text)
- updated_at (timestamptz)
```

Enable **Row Level Security (RLS)**: OFF for now (turn on later)

#### **Create `sales` table:**

Click **"New table"** again:

```
Table name: sales

Columns:
- id (uuid, primary key) ✅ Default
- created_at (timestamptz) ✅ Default
- items (jsonb, required)
- total_amount (numeric, required)
- payment_method (text, required)
- customer_name (text)
- customer_phone (text)
```

#### **Create `purchase_orders` table:**

Click **"New table"** again:

```
Table name: purchase_orders

Columns:
- id (uuid, primary key) ✅ Default
- order_date (timestamptz) ✅ Use created_at default
- supplier (text, required)
- items (jsonb, required)
- total_amount (numeric, required)
- status (text, required, default: 'pending')
- expected_date (date)
- received_date (timestamptz)
```

---

### **Step 4: Get Your Credentials**

1. Go to **Project Settings** (⚙️ icon in sidebar)
2. Click **"API"** section
3. You'll see:
   - **Project URL** (starts with `https://xxxxx.supabase.co`)
   - **anon public** key (long string)

4. Copy these values!

---

### **Step 5: Update `.env.local`**

Open `e:\SuperMarket\frontend\.env.local` and paste YOUR values:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhx...
```

---

### **Step 6: Start Your App**

```powershell
cd E:\SuperMarket\frontend
npm run dev
```

Open http://localhost:8080

---

## 📝 Usage Examples:

### Display all products:
```tsx
import { useProducts } from "@/hooks/useSupabase";

function ProductList() {
  const { data: products, isLoading } = useProducts();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {products?.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  );
}
```

### Add a product:
```tsx
import { useAddProduct } from "@/hooks/useSupabase";

function AddProduct() {
  const addProduct = useAddProduct();
  
  const handleAdd = () => {
    addProduct.mutate({
      name: "Coca Cola",
      barcode: "12345",
      price: 50,
      stock: 100,
      category: "Beverages",
      min_stock: 20
    });
  };
  
  return <button onClick={handleAdd}>Add Product</button>;
}
```

---

## 🎁 Supabase Free Tier Includes:

✅ **500 MB Database** storage
✅ **1 GB File** storage  
✅ **50,000 Monthly Active Users**
✅ **500 MB Bandwidth per day**
✅ **Unlimited API requests**
✅ **Real-time subscriptions**
✅ **Authentication** built-in

**More than enough for your supermarket app!**

---

## 🔒 Security (Optional - Do Later):

Enable Row Level Security (RLS) in Supabase:

1. Go to **Authentication** → Enable Email provider
2. Go to **Table Editor** → Select table → **RLS** → Enable
3. Add policies for authenticated users

---

## ✨ You're All Set!

Just create your Supabase project and update `.env.local` - completely FREE, no billing required! 🎉
