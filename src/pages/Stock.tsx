import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Filter, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useProducts } from "@/hooks/useSupabase";
import { getInvoices } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Stock() {
  const { data: products = [], isLoading } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch sold stock value from invoices with React Query for automatic updates
  const { data: soldStockValue = 0 } = useQuery({
    queryKey: ["soldStockValue"],
    queryFn: async () => {
      try {
        const invoices = await getInvoices();
        return invoices.reduce((sum, invoice) => sum + (invoice.final_amount || invoice.total_amount || 0), 0);
      } catch (error) {
        console.error("Error fetching sold stock value:", error);
        return 0;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Calculate stock status
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: "out", label: "Out of Stock", color: "destructive", icon: XCircle };
    if (stock <= 20) return { status: "low", label: "Low Stock", color: "warning", icon: AlertTriangle };
    return { status: "normal", label: "In Stock", color: "success", icon: CheckCircle };
  };

  // Filter and sort products
  const processedProducts = useMemo(() => {
    let filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply status filter
    if (filterStatus === "low") {
      filtered = filtered.filter((p) => p.stock > 0 && p.stock <= 20);
    } else if (filterStatus === "out") {
      filtered = filtered.filter((p) => p.stock === 0);
    } else if (filterStatus === "normal") {
      filtered = filtered.filter((p) => p.stock > 20);
    }

    // Sort by stock (lowest to highest, out of stock first)
    return filtered.sort((a, b) => a.stock - b.stock);
  }, [products, searchQuery, filterStatus]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 20).length;
    const healthyStock = products.filter((p) => p.stock > 20).length;
    const currentStockValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

    return { totalProducts, outOfStock, lowStock, healthyStock, currentStockValue, soldStockValue };
  }, [products, soldStockValue]);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Stock Management</h1>
              <p className="text-muted-foreground">Monitor and manage your inventory levels</p>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card border-white/10">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Total Products</div>
                <div className="text-2xl font-bold text-foreground">{stats.totalProducts}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="glass-card border-destructive/30">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Out of Stock</div>
                <div className="text-2xl font-bold text-destructive">{stats.outOfStock}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card border-warning/30">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Low Stock</div>
                <div className="text-2xl font-bold text-warning">{stats.lowStock}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="glass-card border-success/30">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Healthy Stock</div>
                <div className="text-2xl font-bold text-success">{stats.healthyStock}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card border-green-500/30 bg-green-500/5">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Current Stock Value</div>
                <div className="text-2xl font-bold text-green-400">₹{stats.currentStockValue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="glass-card border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Sold Stock Value</div>
                <div className="text-2xl font-bold text-blue-400">₹{stats.soldStockValue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name, barcode, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass-input"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[200px] glass-input">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="normal">Healthy Stock</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Stock Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="glass-card border-white/10">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading stock data...
                </div>
              ) : processedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    {products.length === 0 ? "No products in stock" : "No products match your search"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {products.length === 0
                      ? "Add products to get started with inventory management"
                      : "Try adjusting your search or filter criteria"}
                  </p>
                </div>
              ) : stats.outOfStock === 0 && stats.lowStock === 0 && filterStatus === "all" ? (
                <div className="mb-4 p-4 bg-success/10 border border-success/30 rounded-lg">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">All products are sufficiently stocked</span>
                  </div>
                </div>
              ) : null}

              {processedProducts.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">
                          Product
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">
                          Barcode
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">
                          Category
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">
                          Current Stock
                        </th>
                        <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">
                          Unit Price
                        </th>
                        <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">
                          Total Value
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedProducts.map((product, index) => {
                        const stockInfo = getStockStatus(product.stock);
                        const StatusIcon = stockInfo.icon;

                        return (
                          <motion.tr
                            key={product.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 + index * 0.03 }}
                            className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                              stockInfo.status === "out"
                                ? "bg-destructive/5"
                                : stockInfo.status === "low"
                                ? "bg-warning/5"
                                : ""
                            }`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                                  📦
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{product.name}</div>
                                  {stockInfo.status === "low" && (
                                    <div className="text-xs text-warning flex items-center gap-1 mt-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Consider restocking this item
                                    </div>
                                  )}
                                  {stockInfo.status === "out" && (
                                    <div className="text-xs text-destructive flex items-center gap-1 mt-1">
                                      <XCircle className="h-3 w-3" />
                                      Urgent: Item unavailable
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center text-muted-foreground">
                              {product.barcode || "N/A"}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <Badge variant="outline" className="text-xs">
                                {product.category || "Uncategorized"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span
                                className={`text-lg font-bold ${
                                  stockInfo.status === "out"
                                    ? "text-destructive"
                                    : stockInfo.status === "low"
                                    ? "text-warning"
                                    : "text-success"
                                }`}
                              >
                                {product.stock}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right text-foreground">
                              ₹{product.price.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right font-medium text-foreground">
                              ₹{(product.price * product.stock).toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <Badge
                                variant={
                                  stockInfo.status === "out"
                                    ? "destructive"
                                    : stockInfo.status === "low"
                                    ? "default"
                                    : "default"
                                }
                                className={`${
                                  stockInfo.status === "out"
                                    ? "bg-destructive/20 text-destructive border-destructive/30"
                                    : stockInfo.status === "low"
                                    ? "bg-warning/20 text-warning border-warning/30"
                                    : "bg-success/20 text-success border-success/30"
                                }`}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {stockInfo.label}
                              </Badge>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Helper Text */}
      <div className="text-center text-sm text-muted-foreground pb-6">
        Data shown is calculated from recorded sales and stock
      </div>
    </MainLayout>
  );
}
