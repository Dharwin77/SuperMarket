import { supabase } from '@/lib/supabase';

// ============ Product Management ============

export interface Product {
  id?: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  category: string;
  cost_price?: number;
  selling_price?: number;
  imported_date?: string;
  expiry_date?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

// Get single product by ID
export const getProduct = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Get product by barcode
export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
};

// Add new product
export const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Update product
export const updateProduct = async (id: string, product: Partial<Product>): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Delete product
export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Get low stock products
export const getLowStockProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*');
  
  if (error) throw error;
  
  // Filter products where stock is less than or equal to min_stock
  return (data || []).filter(product => product.stock <= product.min_stock);
};

// ============ Sales/Billing Management ============

export interface Sale {
  id?: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  total_amount: number;
  payment_method: 'cash' | 'card' | 'upi';
  customer_name?: string;
  customer_phone?: string;
  created_at?: string;
}

// Add new sale
export const addSale = async (sale: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> => {
  // Start a transaction-like operation
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert([sale])
    .select()
    .single();
  
  if (saleError) throw saleError;

  // Update product stock for each item
  for (const item of sale.items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single();
    
    if (product) {
      await supabase
        .from('products')
        .update({ stock: product.stock - item.quantity })
        .eq('id', item.product_id);
    }
  }

  return saleData;
};

// Get all sales
export const getSales = async (limitCount: number = 100): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitCount);
  
  if (error) throw error;
  return data || [];
};

// Get sales by date range
export const getSalesByDateRange = async (startDate: Date, endDate: Date): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

// Get invoices (for sold stock value calculation)
export const getInvoices = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error && error.code !== '42P01') throw error; // Ignore if table doesn't exist
  return data || [];
};

// Get invoices by date range
export const getInvoicesByDateRange = async (startDate: Date, endDate: Date): Promise<any[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });
  
  if (error && error.code !== '42P01') throw error; // Ignore if table doesn't exist
  return data || [];
};

// ============ Purchase Orders ============

export interface PurchaseOrder {
  id?: string;
  supplier: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }[];
  total_amount: number;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  order_date?: string;
  expected_date?: string;
  received_date?: string;
}

// Add purchase order
export const addPurchaseOrder = async (order: Omit<PurchaseOrder, 'id' | 'order_date'>): Promise<PurchaseOrder> => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .insert([order])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Update purchase order
export const updatePurchaseOrder = async (id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;

  // If order is received, update product stock
  if (updates.status === 'received') {
    const { data: order } = await supabase
      .from('purchase_orders')
      .select('items')
      .eq('id', id)
      .single();
    
    if (order) {
      for (const item of order.items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock + item.quantity })
            .eq('id', item.product_id);
        }
      }
    }
  }

  return data;
};

// Get purchase orders
export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .order('order_date', { ascending: false });
  
  if (error) throw error;
  return data || [];
};
