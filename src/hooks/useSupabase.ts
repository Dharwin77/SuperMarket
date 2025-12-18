import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  getProduct,
  getProductByBarcode,
  addProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getSales,
  getSalesByDateRange,
  addSale,
  getPurchaseOrders,
  addPurchaseOrder,
  updatePurchaseOrder,
  Product,
  Sale,
  PurchaseOrder,
} from "@/services/api";
import { toast } from "sonner";

// ============ Product Hooks ============

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
};

export const useProductByBarcode = (barcode: string) => {
  return useQuery({
    queryKey: ["product", "barcode", barcode],
    queryFn: () => getProductByBarcode(barcode),
    enabled: !!barcode && barcode.length > 0,
  });
};

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: ["products", "low-stock"],
    queryFn: getLowStockProducts,
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: Omit<Product, "id" | "created_at" | "updated_at">) => addProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product added successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add product: ${error.message}`);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, product }: { id: string; product: Partial<Product> }) =>
      updateProduct(id, product),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      toast.success("Product updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
};

// ============ Sales Hooks ============

export const useSales = (limitCount?: number) => {
  return useQuery({
    queryKey: ["sales", limitCount],
    queryFn: () => getSales(limitCount),
  });
};

export const useSalesByDateRange = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ["sales", "date-range", startDate, endDate],
    queryFn: () => getSalesByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

export const useAddSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sale: Omit<Sale, "id" | "created_at">) => addSale(sale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Sale completed successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete sale: ${error.message}`);
    },
  });
};

// ============ Purchase Order Hooks ============

export const usePurchaseOrders = () => {
  return useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: getPurchaseOrders,
  });
};

export const useAddPurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: Omit<PurchaseOrder, "id" | "order_date">) => addPurchaseOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      toast.success("Purchase order created successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create purchase order: ${error.message}`);
    },
  });
};

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PurchaseOrder> }) =>
      updatePurchaseOrder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Purchase order updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update purchase order: ${error.message}`);
    },
  });
};
