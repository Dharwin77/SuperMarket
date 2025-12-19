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
  Sparkles,
  Box,
  MessageSquare,
  CalendarX,
  Receipt,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatContext } from "./MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Box, label: "Products", path: "/products" },
  { icon: MessageSquare, label: "Chat Assistant", path: null, action: "toggleChat" },
  { icon: ScanLine, label: "Product Scanner", path: "/scanner" },
  { icon: CalendarX, label: "Expiry History", path: "/expiry-history" },
  { icon: ShoppingCart, label: "Billing", path: "/description" },
  { icon: Receipt, label: "Invoice History", path: "/invoice-history" },
  { icon: Package, label: "Stock", path: "/stock" },
  { icon: TrendingUp, label: "Profit Analytics", path: "/profit" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
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
        "fixed left-0 top-0 z-40 h-screen glass-panel border-r border-white/10 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-between px-4 border-b border-white/10">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-lg gradient-text">SuperMarket</h1>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
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
          {navItems.map((item, index) => {
            const isActive = item.path ? location.pathname === item.path : false;
            
            const content = (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 glow-primary"
                    : "hover:bg-white/10"
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity",
                    isActive && "opacity-100"
                  )}
                />
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
        <div className="p-4 border-t border-white/10">
          <Button
            onClick={handleLogout}
            variant="outline"
            className={cn(
              "w-full border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 text-red-400 hover:text-red-300",
              collapsed ? "px-0" : ""
            )}
          >
            <LogOut className={cn("h-5 w-5", !collapsed && "mr-2")} />
            {!collapsed && <span>Logout</span>}
          </Button>
          {!collapsed && user && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Logged in as <span className="text-cyan-400">{user.username}</span>
            </p>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
