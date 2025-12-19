import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, ShoppingBag } from "lucide-react";

const insights = [
  {
    icon: TrendingUp,
    title: "Sales Trend",
    message: "Cold drinks sales up 23% this week. Consider restocking.",
    type: "success" as const,
  },
  {
    icon: AlertTriangle,
    title: "Low Stock Alert",
    message: "Milk and bread running low. 3 days until stockout.",
    type: "warning" as const,
  },
  {
    icon: ShoppingBag,
    title: "Purchase Recommendation",
    message: "AI suggests ordering 50 units of chips from Metro Wholesale.",
    type: "primary" as const,
  },
];

const typeStyles = {
  success: "border-success/30 bg-success/10",
  warning: "border-warning/30 bg-warning/10",
  primary: "border-primary/30 bg-primary/10",
};

const iconStyles = {
  success: "text-success",
  warning: "text-warning",
  primary: "text-primary",
};

export function AIInsights() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6 border border-white/10"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Insights</h3>
          <p className="text-sm text-muted-foreground">Smart recommendations</p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className={`p-4 rounded-xl border ${typeStyles[insight.type]} transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
          >
            <div className="flex items-start gap-3">
              <insight.icon className={`h-5 w-5 mt-0.5 ${iconStyles[insight.type]}`} />
              <div>
                <p className="font-medium text-foreground">{insight.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
