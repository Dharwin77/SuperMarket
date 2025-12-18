import { motion } from "framer-motion";
import { ShoppingCart, Package, CreditCard, Scan } from "lucide-react";

const activities = [
  {
    icon: ShoppingCart,
    title: "New Sale",
    description: "Bill #1234 - ₹856",
    time: "2 min ago",
    color: "text-success",
  },
  {
    icon: Scan,
    title: "Product Scanned",
    description: "Lays Chips - Classic",
    time: "5 min ago",
    color: "text-primary",
  },
  {
    icon: Package,
    title: "Stock Updated",
    description: "Added 50 units of Coca-Cola",
    time: "15 min ago",
    color: "text-secondary",
  },
  {
    icon: CreditCard,
    title: "Payment Received",
    description: "UPI - ₹1,250",
    time: "32 min ago",
    color: "text-success",
  },
  {
    icon: ShoppingCart,
    title: "New Sale",
    description: "Bill #1233 - ₹2,340",
    time: "45 min ago",
    color: "text-success",
  },
];

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest transactions</p>
        </div>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className={`h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center ${activity.color}`}>
              <activity.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{activity.title}</p>
              <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
