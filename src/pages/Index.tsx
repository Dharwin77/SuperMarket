import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProfitHeatMap } from "@/components/dashboard/ProfitHeatMap";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { useProducts } from "@/hooks/useSupabase";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { data: products = [] } = useProducts();
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    const hour = now.getHours();

    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  }, [now]);

  const stats = useMemo(() => {
    const lowStockCount = products.filter(p => p.stock <= 20).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    
    // Admin gets all stats, Cashier/Staff get limited stats
    const allStats = [
      {
        title: "Total Products",
        value: products.length.toString(),
        change: "In inventory",
        changeType: "positive" as const,
        icon: Package,
        gradient: "primary" as const,
        roles: ["admin", "cashier", "staff"] as const,
      },
      {
        title: "Total Stock Value",
        value: `₹${totalValue.toLocaleString()}`,
        change: "Current inventory",
        changeType: "positive" as const,
        icon: DollarSign,
        gradient: "secondary" as const,
        roles: ["admin"] as const,
      },
      {
        title: "Low Stock Items",
        value: lowStockCount.toString(),
        change: "Requires attention",
        changeType: lowStockCount > 0 ? "negative" as const : "positive" as const,
        icon: Package,
        gradient: "warning" as const,
        roles: ["admin"] as const,
      },
      {
        title: "Active Items",
        value: products.filter(p => p.stock > 0).length.toString(),
        change: "Available for sale",
        changeType: "positive" as const,
        icon: ShoppingCart,
        gradient: "success" as const,
        roles: ["admin", "cashier", "staff"] as const,
      },
    ];
    
    return allStats.filter(stat => user?.role && stat.roles.includes(user.role));
  }, [products, user?.role]);

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
              {greeting}, <span className="text-foreground capitalize">{user?.role || 'User'}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Here's what's happening in your store today</p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {now.toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {now.toLocaleTimeString("en-IN", {
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

        {/* Profit Heat Map - Admin only */}
        {user?.role === 'admin' && <ProfitHeatMap />}

        {/* Activity */}
        <RecentActivity />
      </div>
    </MainLayout>
  );
};

export default Index;
