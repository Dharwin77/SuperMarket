import { motion } from "framer-motion";
import { Sparkles, Package, TrendingDown, Building2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const recommendations = [
  { id: "1", name: "Milk", quantity: 8, unit: "liters", urgency: "high", supplier: "Metro Wholesale", price: 45 },
  { id: "2", name: "Chips Variety Pack", quantity: 12, unit: "units", urgency: "high", supplier: "Local Distributor", price: 180 },
  { id: "3", name: "Soap Bars", quantity: 5, unit: "packs", urgency: "medium", supplier: "Metro Wholesale", price: 120 },
  { id: "4", name: "Bread", quantity: 10, unit: "loaves", urgency: "high", supplier: "Local Bakery", price: 35 },
  { id: "5", name: "Cooking Oil", quantity: 4, unit: "liters", urgency: "low", supplier: "Wholesale Market", price: 180 },
];

const urgencyStyles = {
  high: "bg-destructive/20 text-destructive border-destructive/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  low: "bg-success/20 text-success border-success/30",
};

export function PurchaseRecommendation() {
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setAddedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalCost = recommendations
    .filter((r) => addedItems.has(r.id))
    .reduce((sum, r) => sum + r.price * r.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 border border-white/10"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">AI Purchase Recommendations</h3>
          <p className="text-sm text-muted-foreground">Based on sales trends and stock levels</p>
        </div>
      </div>

      {/* AI Message */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <p className="text-sm text-foreground">
          <span className="font-medium">🤖 AI Analysis:</span> Based on your sales patterns and current inventory, 
          I recommend restocking these items. Predicted stockout in 2-5 days without action.
        </p>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3 mb-6">
        {recommendations.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border border-white/10 transition-all duration-300 ${
              addedItems.has(item.id) ? "bg-primary/10 border-primary/30" : "bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${urgencyStyles[item.urgency]}`}>
                      {item.urgency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium text-foreground">₹{item.price * item.quantity}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {item.supplier}
                  </p>
                </div>
                
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    addedItems.has(item.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 text-muted-foreground hover:bg-white/20"
                  }`}
                >
                  {addedItems.has(item.id) ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-success/10 to-primary/10 border border-success/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Estimated Total</p>
            <p className="text-2xl font-bold gradient-text">₹{totalCost.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Items Selected</p>
            <p className="text-2xl font-bold text-foreground">{addedItems.size}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            <TrendingDown className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="glow" className="flex-1">
            Create Order
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
