import { motion } from "framer-motion";
import { Package, MapPin, TrendingUp, DollarSign, BarChart3, Layers } from "lucide-react";

interface ProductCubeProps {
  product: {
    name: string;
    mrp: number;
    onlinePrice: number;
    stock: number;
    shelf: string;
    profitMargin: number;
  };
}

export function ProductCube({ product }: ProductCubeProps) {
  const priceDiff = ((product.mrp - product.onlinePrice) / product.onlinePrice * 100).toFixed(1);
  const isPriceHigher = product.mrp > product.onlinePrice;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="relative"
      style={{ perspective: "1000px" }}
    >
      {/* 3D Cube Container */}
      <div className="relative w-80 h-80 transform-gpu" style={{ transformStyle: "preserve-3d" }}>
        {/* Main Face */}
        <div
          className="absolute inset-0 glass-card p-6 border border-primary/30 glow-primary"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Product Name */}
          <div className="text-center mb-6">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3">
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* MRP */}
            <div className="glass-card p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">MRP</span>
              </div>
              <p className="text-lg font-bold text-foreground">₹{product.mrp}</p>
            </div>

            {/* Online Price */}
            <div className="glass-card p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
              <p className="text-lg font-bold text-foreground">₹{product.onlinePrice}</p>
            </div>

            {/* Shelf Location */}
            <div className="glass-card p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground">Location</span>
              </div>
              <p className="text-lg font-bold text-foreground">{product.shelf}</p>
            </div>

            {/* Stock */}
            <div className="glass-card p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground">Stock</span>
              </div>
              <p className="text-lg font-bold text-foreground">{product.stock}</p>
            </div>
          </div>

          {/* Price Comparison */}
          <div className={`mt-4 p-3 rounded-xl border ${isPriceHigher ? 'border-warning/30 bg-warning/10' : 'border-success/30 bg-success/10'}`}>
            <div className="flex items-center gap-2">
              <BarChart3 className={`h-4 w-4 ${isPriceHigher ? 'text-warning' : 'text-success'}`} />
              <span className="text-sm">
                Your price is <span className="font-bold">{priceDiff}%</span> {isPriceHigher ? 'higher' : 'lower'}
              </span>
            </div>
          </div>

          {/* Profit Margin */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Profit Margin</span>
            <span className="text-lg font-bold text-success">{product.profitMargin}%</span>
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10" />
    </motion.div>
  );
}
