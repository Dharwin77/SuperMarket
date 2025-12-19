import { motion } from "framer-motion";
import { useProducts } from "@/hooks/useSupabase";
import { useMemo } from "react";

export function ProfitHeatMap() {
  const { data: products = [], isLoading } = useProducts();

  const productData = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Calculate profit margin assuming 30% average profit on price
    // In real scenario, you'd have cost data to calculate actual profit
    return products
      .filter(p => p.stock > 0)
      .map(product => {
        // Simulated profit margin (higher price items typically have lower margins)
        const profitMargin = Math.min(85, Math.max(15, 100 - (product.price * 0.5)));
        const color = profitMargin >= 60 
          ? "from-success to-success/70" 
          : profitMargin >= 40 
          ? "from-warning to-warning/70" 
          : "from-destructive to-destructive/70";
        
        return {
          name: product.name.length > 12 ? product.name.substring(0, 10) + '...' : product.name,
          profit: Math.round(profitMargin),
          color
        };
      })
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 8); // Show top 8 products
  }, [products]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 border border-white/10"
      >
        <p className="text-center text-muted-foreground">Loading profit data...</p>
      </motion.div>
    );
  }

  if (productData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 border border-white/10"
      >
        <p className="text-center text-muted-foreground">No product data available</p>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Profit Margin Heat Map</h3>
          <p className="text-sm text-muted-foreground">Product profitability overview</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Low</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {productData.map((product, index) => (
          <motion.div
            key={product.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className={`
              relative p-4 rounded-xl bg-gradient-to-br ${product.color}
              border border-white/10 overflow-hidden group cursor-pointer
              hover:scale-105 transition-transform duration-300
            `}
          >
            <div className="relative z-10">
              <p className="text-sm font-medium text-foreground">{product.name}</p>
              <p className="text-2xl font-bold text-foreground">{product.profit}%</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
