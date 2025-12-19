import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  index: number;
  gradient?: "primary" | "secondary" | "success" | "warning";
}

const gradientStyles = {
  primary: "from-primary/20 to-primary/5 border-primary/30 glow-primary",
  secondary: "from-secondary/20 to-secondary/5 border-secondary/30 glow-secondary",
  success: "from-success/20 to-success/5 border-success/30 glow-success",
  warning: "from-warning/20 to-warning/5 border-warning/30",
};

const iconStyles = {
  primary: "from-primary to-primary/70",
  secondary: "from-secondary to-secondary/70",
  success: "from-success to-success/70",
  warning: "from-warning to-warning/70",
};

export function StatsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  index,
  gradient = "primary",
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "glass-card p-6 bg-gradient-to-br border",
        gradientStyles[gradient]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <p
            className={cn(
              "text-sm font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}
          >
            {change}
          </p>
        </div>
        
        <div
          className={cn(
            "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
            iconStyles[gradient]
          )}
        >
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
    </motion.div>
  );
}
