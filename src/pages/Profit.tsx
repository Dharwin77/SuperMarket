import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getInvoicesByDateRange, getProducts } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

type TimeFilter = "today" | "yesterday" | "week" | "month" | "total";

// Helper function to convert time filter to date range
const getDateRange = (filter: TimeFilter): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const endDate = new Date();
  let startDate = new Date();

  switch (filter) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "yesterday":
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "total":
      // Get all data from the beginning of time (2000)
      startDate = new Date(2000, 0, 1);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
};

export default function Profit() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");

  // Fetch invoices with React Query for automatic cache management
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", timeFilter],
    queryFn: () => {
      const { startDate, endDate } = getDateRange(timeFilter);
      return getInvoicesByDateRange(startDate, endDate);
    },
    refetchOnWindowFocus: false,
  });

  // Fetch products with React Query for automatic cache management
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    refetchOnWindowFocus: false,
  });

  const loading = invoicesLoading || productsLoading;

  // Calculate profit data from real invoices
  const profitData = useMemo(() => {
    if (invoices.length === 0 || products.length === 0) {
      return {
        totalRevenue: 0,
        totalProfit: 0,
        totalLoss: 0,
        profitPercentage: 0,
        lossPercentage: 0,
        netProfit: 0,
        categories: [],
        hasData: false,
        itemsWithoutCostPrice: 0,
      };
    }

    // Create a product map for quick lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalRevenue = 0;
    let totalCost = 0;
    let itemsWithoutCostPrice = 0;
    const categoryStats = new Map<string, { revenue: number; cost: number }>();

    // Process each invoice
    invoices.forEach((invoice) => {
      // Process items in invoice
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach((item: any) => {
          const product = productMap.get(item.id);
          if (product) {
            const itemRevenue = item.price * item.quantity;
            totalRevenue += itemRevenue;
            
            // Track items without cost price
            if (!product.cost_price) {
              itemsWithoutCostPrice++;
            }
            const itemCost = (product.cost_price || product.price * 0.7) * item.quantity; // Use cost_price if available, else estimate
            totalCost += itemCost;

            const category = product.category || "Uncategorized";
            const existing = categoryStats.get(category) || { revenue: 0, cost: 0 };
            categoryStats.set(category, {
              revenue: existing.revenue + itemRevenue,
              cost: existing.cost + itemCost,
            });
          }
        });
      }
    });

    const netProfit = totalRevenue - totalCost;
    const totalProfit = netProfit > 0 ? netProfit : 0;
    const totalLoss = netProfit < 0 ? Math.abs(netProfit) : 0;
    const profitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    const lossPercentage = totalCost > 0 ? (totalLoss / totalCost) * 100 : 0;

    // Build category array
    const categoryColors = [
      "from-green-500 to-emerald-600",
      "from-blue-500 to-cyan-600",
      "from-purple-500 to-violet-600",
      "from-yellow-500 to-orange-600",
      "from-pink-500 to-rose-600",
      "from-red-500 to-rose-600",
    ];

    const categories = Array.from(categoryStats.entries())
      .map(([name, stats], index) => {
        const profit = stats.revenue - stats.cost;
        const percentage = stats.cost > 0 ? (profit / stats.cost) * 100 : 0;
        return {
          name,
          profit,
          percentage,
          color: categoryColors[index % categoryColors.length],
        };
      })
      .sort((a, b) => b.profit - a.profit);

    return {
      totalRevenue,
      totalProfit,
      totalLoss,
      profitPercentage,
      lossPercentage,
      netProfit,
      categories,
      hasData: true,
      itemsWithoutCostPrice,
    };
  }, [invoices, products]);

  // Check if cost price data is available
  const hasCostPriceData = products.some((p) => p.cost_price);

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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profits</h1>
              <p className="text-muted-foreground">Track profit and loss over time</p>
            </div>
          </div>

          {/* Time Filter */}
          <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
            <SelectTrigger className="w-[180px] glass-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="total">Total (All Time)</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Warning for items without cost price */}
        {!loading && profitData.hasData && profitData.itemsWithoutCostPrice > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-500">
                {profitData.itemsWithoutCostPrice} item(s) excluded from profit calculation due to missing cost price. 
                Add cost price to products for accurate profit analytics.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card border-cyan-500/30 bg-cyan-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                  <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-cyan-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-cyan-400">
                  ₹{profitData.totalRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="glass-card border-green-500/30 bg-green-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-muted-foreground">Total Profit</div>
                  <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-400">
                  +₹{profitData.totalProfit.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-green-400/70 mt-1">
                  +{profitData.profitPercentage.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card border-red-500/30 bg-red-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-muted-foreground">Total Loss</div>
                  <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-400">
                  -₹{profitData.totalLoss.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-red-400/70 mt-1">
                  -{profitData.lossPercentage.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="glass-card border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-muted-foreground">Net Profit</div>
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-400">
                  ₹{profitData.netProfit.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Category-wise Profit Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Category-wise Breakdown</h3>
              
              {/* Empty State */}
              {!loading && (!profitData.hasData || profitData.categories.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {!hasCostPriceData 
                      ? "Profit data not available. Please add cost price to products." 
                      : "No sales data available for selected period"}
                  </p>
                </div>
              )}

              {/* Categories Grid */}
              {profitData.hasData && profitData.categories.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profitData.categories.map((category: any, index: number) => (
                    <motion.div
                      key={category.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.35 + index * 0.05 }}
                      className="group cursor-pointer"
                    >
                      <Card className={`glass-card border-white/10 bg-gradient-to-br ${category.color} bg-opacity-10 hover:scale-105 transition-transform duration-300`}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="text-sm font-medium text-foreground">{category.name}</div>
                            {category.profit >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className={`text-2xl font-bold ${category.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {category.profit >= 0 ? "+" : ""}₹{Math.abs(category.profit).toLocaleString()}
                            </div>
                            <div className={`text-sm font-medium ${category.profit >= 0 ? "text-green-400/70" : "text-red-400/70"}`}>
                              {category.profit >= 0 ? "+" : ""}{category.percentage.toFixed(1)}%
                            </div>
                          </div>
                          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(Math.abs(category.percentage) * 4, 100)}%` }}
                              transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                              className={`h-full rounded-full ${category.profit >= 0 ? "bg-green-400" : "bg-red-400"}`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Helper Text */}
      <div className="text-center text-sm text-muted-foreground pb-6">
        Profit analytics update automatically after each purchase
      </div>
    </MainLayout>
  );
}
