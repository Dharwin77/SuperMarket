import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Clock } from "lucide-react";
import { useProducts } from "@/hooks/useSupabase";
import { useMemo } from "react";

const statusStyles = {
  critical: { bg: "bg-destructive", text: "text-destructive", border: "border-destructive/30" },
  warning: { bg: "bg-warning", text: "text-warning", border: "border-warning/30" },
  good: { bg: "bg-success", text: "text-success", border: "border-success/30" },
};

export function StockTimeline() {
  const { data: products = [], isLoading } = useProducts();

  const stockItems = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Calculate stock depletion based on current stock
    // Assuming average daily sales of 10% of current stock for estimation
    return products
      .filter(p => p.stock > 0)
      .map(product => {
        const dailySales = Math.max(1, Math.floor(product.stock * 0.1)); // 10% daily sales estimate
        const daysLeft = product.stock / dailySales;
        const status = daysLeft < 2 ? 'critical' : daysLeft < 5 ? 'warning' : 'good';
        
        return {
          name: product.name,
          current: product.stock,
          daily: dailySales,
          daysLeft,
          status
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 6); // Show top 6 items
  }, [products]);

  const maxDays = stockItems.length > 0 ? Math.max(...stockItems.map((item) => item.daysLeft)) : 1;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border border-white/10"
      >
        <p className="text-center text-muted-foreground">Loading stock data...</p>
      </motion.div>
    );
  }

  if (stockItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border border-white/10"
      >
        <p className="text-center text-muted-foreground">No stock data available</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 border border-white/10"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-warning to-destructive flex items-center justify-center">
          <Clock className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Stock Depletion Timeline</h3>
          <p className="text-sm text-muted-foreground">Predicted stockout dates</p>
        </div>
      </div>

      <div className="space-y-4">
        {stockItems.map((item, index) => {
          const percentage = (item.daysLeft / maxDays) * 100;
          const style = statusStyles[item.status as keyof typeof statusStyles];

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border ${style.border} bg-white/5`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${style.bg}`} />
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {item.current} units
                  </span>
                  <span className={`text-sm font-medium ${style.text}`}>
                    {item.daysLeft.toFixed(1)} days
                  </span>
                </div>
              </div>

              {/* Timeline bar */}
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                  className={`absolute left-0 top-0 h-full rounded-full ${style.bg}`}
                />
              </div>

              {/* Alert for critical items */}
              {item.status === "critical" && (
                <div className="mt-2 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Reorder immediately</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Critical (&lt;2 days)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-warning" />
          <span className="text-muted-foreground">Warning (2-5 days)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Good (&gt;5 days)</span>
        </div>
      </div>
    </motion.div>
  );
}
