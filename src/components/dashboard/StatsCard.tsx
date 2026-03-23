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
  primary: "bg-card border-primary/20",
  secondary: "bg-card border-border",
  success: "bg-card border-success/20",
  warning: "bg-card border-warning/30",
};

const iconStyles = {
  primary: "bg-primary/10",
  secondary: "bg-secondary",
  success: "bg-success/10",
  warning: "bg-warning/10",
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
        "glass-card p-6 border",
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
            "h-12 w-12 rounded-xl flex items-center justify-center",
            iconStyles[gradient]
          )}
        >
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}
