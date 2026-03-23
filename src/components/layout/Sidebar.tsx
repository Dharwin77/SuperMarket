import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ScanLine,
  ShoppingCart,
  Package,
  TrendingUp,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Box,
  MessageSquare,
  CalendarX,
  Receipt,
  LogOut,
  Users,
  ClipboardList,
  CalendarDays,
  Shield,
  Truck,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatContext } from "./MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/contexts/AuthContext";

const navItems = [
  { icon: Box, label: "Products", path: "/products", roles: ["admin"] as UserRole[] },
  { icon: MessageSquare, label: "Support Chat", path: null, action: "toggleChat", roles: ["admin", "cashier"] as UserRole[] },
  { icon: ScanLine, label: "Product Scanner", path: "/scanner", roles: ["admin"] as UserRole[] },
  { icon: CalendarX, label: "Expiry History", path: "/expiry-history", roles: ["admin"] as UserRole[] },
  { icon: ShoppingCart, label: "Billing", path: "/description", roles: ["admin", "cashier"] as UserRole[] },
  { icon: Receipt, label: "Invoice History", path: "/invoice-history", roles: ["admin", "cashier"] as UserRole[] },
  { icon: Users, label: "Team Members", path: "/team-members", roles: ["cashier", "staff"] as UserRole[] },
  { icon: Package, label: "Stock", path: "/stock", roles: ["admin"] as UserRole[] },
  { icon: TrendingUp, label: "Profit Analytics", path: "/profit", roles: ["admin"] as UserRole[] },
  { icon: FileText, label: "Reports", path: "/reports", roles: ["admin"] as UserRole[] },
  { icon: Users, label: "Staff Management", path: "/staff-management", roles: ["admin"] as UserRole[] },
  { icon: ClipboardList, label: "Duties", path: "/duties-management", roles: ["admin"] as UserRole[] },
  { icon: CalendarDays, label: "Calendar", path: "/calendar-management", roles: ["admin"] as UserRole[] },
  { icon: Shield, label: "Security", path: "/security-dashboard", roles: ["staff"] as UserRole[], department: "Security" },
  { icon: Truck, label: "Delivery", path: "/delivery-dashboard", roles: ["staff"] as UserRole[], department: "Delivery" },
  { icon: Briefcase, label: "Workers", path: "/workers-dashboard", roles: ["staff"] as UserRole[], department: "Workers" },
  { icon: Settings, label: "Settings", path: "/settings", roles: ["admin"] as UserRole[] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleChat } = useChatContext();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border shadow-sm transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-between px-4 border-b border-border">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <button
                  onClick={() => navigate('/')}
                  className="text-left"
                >
                  <div>
                    <h1 className="font-bold text-lg text-foreground">SuperMarket</h1>
                    {user && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.role}
                      </p>
                    )}
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.filter((item) => user && item.roles.includes(user.role)).length === 0 && !collapsed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-6 text-center"
            >
              <p className="text-sm text-muted-foreground">
                Welcome! Use the dashboard to view your assigned tasks.
              </p>
            </motion.div>
          )}
          {navItems
            .filter((item) => user && item.roles.includes(user.role))
            .map((item, index) => {
            const isActive = item.path ? location.pathname === item.path : false;
            
            const content = (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-accent border border-transparent"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 relative z-10 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className={cn(
                        "relative z-10 font-medium transition-colors text-sm",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );

            if (item.action === "toggleChat") {
              return (
                <button
                  key={item.label}
                  onClick={toggleChat}
                  className="block w-full"
                >
                  {content}
                </button>
              );
            }
            
            return (
              <NavLink
                key={item.path}
                to={item.path!}
                className="block"
              >
                {content}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={handleLogout}
            variant="outline"
            className={cn(
              "w-full border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700",
              collapsed ? "px-0" : ""
            )}
          >
            <LogOut className={cn("h-5 w-5", !collapsed && "mr-2")} />
            {!collapsed && <span>Logout</span>}
          </Button>
          {!collapsed && user && (
            <div className="text-xs text-muted-foreground text-center mt-2 space-y-1">
              <p>
                Logged in as <span className="text-foreground font-semibold">{user.username}</span>
              </p>
              <p className="text-[10px]">
                Role: <span className="text-primary capitalize">{user.role}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
