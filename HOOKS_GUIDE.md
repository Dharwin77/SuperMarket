# 🎯 How to Use Supabase Hooks - Complete Guide

## Quick Start

Your app is running at: **http://localhost:8081/products-test**

This test page shows:
- ✅ How to fetch products
- ✅ How to add products
- ✅ How to delete products

---

## 📖 All Available Hooks Examples

### 1️⃣ **Get All Products** (`useProducts`)

```tsx
import { useProducts } from "@/hooks/useSupabase";

function MyComponent() {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {products?.map((product) => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>Price: ${product.price}</p>
          <p>Stock: {product.stock}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### 2️⃣ **Get Single Product** (`useProduct`)

```tsx
import { useProduct } from "@/hooks/useSupabase";

function ProductDetail({ productId }: { productId: string }) {
  const { data: product, isLoading } = useProduct(productId);

  if (isLoading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>Price: ${product.price}</p>
    </div>
  );
}
```

---

### 3️⃣ **Find Product by Barcode** (`useProductByBarcode`)

```tsx
import { useProductByBarcode } from "@/hooks/useSupabase";
import { useState } from "react";

function BarcodeScanner() {
  const [barcode, setBarcode] = useState("");
  const { data: product } = useProductByBarcode(barcode);

  return (
    <div>
      <input
        type="text"
        placeholder="Scan or type barcode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
      />
      
      {product && (
        <div>
          <h3>Found: {product.name}</h3>
          <p>Price: ${product.price}</p>
          <p>Stock: {product.stock}</p>
        </div>
      )}
    </div>
  );
}
```

---

### 4️⃣ **Add New Product** (`useAddProduct`)

```tsx
import { useAddProduct } from "@/hooks/useSupabase";

function AddProductForm() {
  const addProduct = useAddProduct();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    addProduct.mutate({
      name: formData.get("name") as string,
      barcode: formData.get("barcode") as string,
      price: parseFloat(formData.get("price") as string),
      stock: parseInt(formData.get("stock") as string),
      category: formData.get("category") as string,
      min_stock: 10,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Product Name" required />
      <input name="barcode" placeholder="Barcode" required />
      <input name="price" type="number" step="0.01" placeholder="Price" required />
      <input name="stock" type="number" placeholder="Stock" required />
      <input name="category" placeholder="Category" required />
      <button type="submit" disabled={addProduct.isPending}>
        {addProduct.isPending ? "Adding..." : "Add Product"}
      </button>
    </form>
  );
}
```

---

### 5️⃣ **Update Product** (`useUpdateProduct`)

```tsx
import { useUpdateProduct } from "@/hooks/useSupabase";

function UpdateStock({ productId }: { productId: string }) {
  const updateProduct = useUpdateProduct();

  const increaseStock = () => {
    updateProduct.mutate({
      id: productId,
      product: {
        stock: 100, // new stock value
      },
    });
  };

  return (
    <button onClick={increaseStock}>
      Update Stock
    </button>
  );
}
```

---

### 6️⃣ **Delete Product** (`useDeleteProduct`)

```tsx
import { useDeleteProduct } from "@/hooks/useSupabase";

function DeleteButton({ productId }: { productId: string }) {
  const deleteProduct = useDeleteProduct();

  const handleDelete = () => {
    if (confirm("Are you sure?")) {
      deleteProduct.mutate(productId);
    }
  };

  return (
    <button onClick={handleDelete}>
      Delete
    </button>
  );
}
```

---

### 7️⃣ **Get Low Stock Products** (`useLowStockProducts`)

```tsx
import { useLowStockProducts } from "@/hooks/useSupabase";

function LowStockAlert() {
  const { data: lowStockProducts } = useLowStockProducts();

  if (!lowStockProducts || lowStockProducts.length === 0) {
    return <div>All products are well stocked! ✅</div>;
  }

  return (
    <div>
      <h3>⚠️ Low Stock Alert ({lowStockProducts.length})</h3>
      {lowStockProducts.map((product) => (
        <div key={product.id}>
          {product.name} - Only {product.stock} left!
        </div>
      ))}
    </div>
  );
}
```

---

### 8️⃣ **Create Sale** (`useAddSale`)

```tsx
import { useAddSale } from "@/hooks/useSupabase";

function CheckoutButton({ cartItems }: { cartItems: any[] }) {
  const addSale = useAddSale();

  const handleCheckout = () => {
    addSale.mutate({
      items: cartItems.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      total_amount: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      payment_method: "cash",
      customer_name: "John Doe",
    });
  };

  return (
    <button onClick={handleCheckout}>
      Complete Sale
    </button>
  );
}
```

---

### 9️⃣ **Get Sales** (`useSales`)

```tsx
import { useSales } from "@/hooks/useSupabase";

function SalesHistory() {
  const { data: sales } = useSales(50); // Get last 50 sales

  return (
    <div>
      <h2>Recent Sales</h2>
      {sales?.map((sale) => (
        <div key={sale.id}>
          <p>Total: ${sale.total_amount}</p>
          <p>Method: {sale.payment_method}</p>
          <p>Items: {sale.items.length}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### 🔟 **Get Sales by Date Range** (`useSalesByDateRange`)

```tsx
import { useSalesByDateRange } from "@/hooks/useSupabase";

function DailySales() {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const { data: todaySales } = useSalesByDateRange(startOfDay, endOfDay);

  const totalRevenue = todaySales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

  return (
    <div>
      <h3>Today's Sales</h3>
      <p>Total Revenue: ${totalRevenue.toFixed(2)}</p>
      <p>Number of Sales: {todaySales?.length || 0}</p>
    </div>
  );
}
```

---

## 🧪 Testing in Supabase Dashboard

### Add Test Product Manually:

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Go to **Table Editor**
3. Click **products** table
4. Click **"Insert row"** button
5. Fill in:
   ```
   name: Coca Cola
   barcode: 123456789
   price: 50.00
   stock: 100
   category: Beverages
   min_stock: 20
   ```
6. Click **"Save"**
7. Go to http://localhost:8081/products-test
8. **Your product will appear automatically!** ✨

---

## 🎨 Test Page Available

I've created a test page for you at:

👉 **http://localhost:8081/products-test**

Features:
- ✅ Shows all products from Supabase
- ✅ "Add Test Product" button to add products from React
- ✅ Delete button for each product
- ✅ Real-time updates
- ✅ Error handling

---

## 🚀 Next Steps

1. **Open http://localhost:8081/products-test** to see it in action
2. **Add products** using the button or Supabase dashboard
3. **Copy the code patterns** from above to use in your actual pages
4. **Integrate into your existing pages** (Inventory, Scanner, Billing, etc.)

---

## 💡 Pro Tips

- Hooks automatically cache data with React Query
- Mutations (add/update/delete) automatically refresh the data
- Toast notifications appear on success/error
- All hooks handle loading and error states

Enjoy building! 🎉
