import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProfitHeatMap } from "@/components/dashboard/ProfitHeatMap";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { useProducts } from "@/hooks/useSupabase";
import { useMemo } from "react";

const Index = () => {
  const { data: products = [] } = useProducts();

  const stats = useMemo(() => {
    const lowStockCount = products.filter(p => p.stock <= 20).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    
    return [
      {
        title: "Total Products",
        value: products.length.toString(),
        change: "In inventory",
        changeType: "positive" as const,
        icon: Package,
        gradient: "primary" as const,
      },
      {
        title: "Total Stock Value",
        value: `₹${totalValue.toLocaleString()}`,
        change: "Current inventory",
        changeType: "positive" as const,
        icon: DollarSign,
        gradient: "secondary" as const,
      },
      {
        title: "Low Stock Items",
        value: lowStockCount.toString(),
        change: "Requires attention",
        changeType: lowStockCount > 0 ? "negative" as const : "positive" as const,
        icon: Package,
        gradient: "warning" as const,
      },
      {
        title: "Active Items",
        value: products.filter(p => p.stock > 0).length.toString(),
        change: "Available for sale",
        changeType: "positive" as const,
        icon: ShoppingCart,
        gradient: "success" as const,
      },
    ];
  }, [products]);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Good Morning, <span className="gradient-text">Shopkeeper</span>
            </h1>
            <p className="text-muted-foreground mt-1">Here's what's happening in your store today</p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatsCard key={stat.title} {...stat} index={index} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProfitHeatMap />
          </div>
          <div>
            <AIInsights />
          </div>
        </div>

        {/* Activity */}
        <RecentActivity />
      </div>
    </MainLayout>
  );
};

export default Index;
