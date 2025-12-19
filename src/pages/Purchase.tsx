import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { PurchaseRecommendation } from "@/components/purchase/PurchaseRecommendation";
import { Button } from "@/components/ui/button";
import { TrendingUp, History, FileText } from "lucide-react";

const Purchase = () => {
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Purchase Assistant</h1>
              <p className="text-muted-foreground">Smart purchasing recommendations</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              Order History
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Past Orders
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "This Month's Orders", value: "₹45,230", change: "+12%" },
            { label: "Pending Orders", value: "3", change: "Processing" },
            { label: "Saved This Month", value: "₹3,450", change: "vs manual buying" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 border border-white/10"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
              <p className="text-sm text-success mt-1">{stat.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PurchaseRecommendation />
          </div>

          {/* Suppliers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Top Suppliers</h3>
            
            <div className="space-y-4">
              {[
                { name: "Metro Wholesale", rating: 4.8, orders: 45, savings: "12%" },
                { name: "Local Distributor", rating: 4.5, orders: 32, savings: "8%" },
                { name: "Wholesale Market", rating: 4.2, orders: 28, savings: "15%" },
                { name: "City Suppliers", rating: 4.6, orders: 19, savings: "10%" },
              ].map((supplier, index) => (
                <motion.div
                  key={supplier.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{supplier.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-warning">★ {supplier.rating}</span>
                        <span className="text-xs text-muted-foreground">{supplier.orders} orders</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-success">{supplier.savings}</span>
                      <p className="text-xs text-muted-foreground">avg savings</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Purchase;
