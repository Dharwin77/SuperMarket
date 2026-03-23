import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  profit: number;
}

interface BillingCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onGenerateBill?: (subtotal: number, gst: number, total: number) => void;
}

export function BillingCart({ items, onUpdateQuantity, onRemoveItem, onGenerateBill }: BillingCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;
  const totalProfit = items.reduce((sum, item) => sum + item.profit * item.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-6 border border-white/10 h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Current Bill</h3>
          <p className="text-sm text-muted-foreground">{items.length} items</p>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-auto space-y-3 mb-6">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card p-4 border border-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                  <p className="text-xs text-success">+₹{item.profit} profit/unit</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="h-8 w-8 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-white/10 flex justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items in cart</p>
            <p className="text-sm">Scan products to add them</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-success">
              <span>Total Profit</span>
              <span>+₹{totalProfit.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="gradient-text">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              Hold Bill
            </Button>
            <Button
              variant="glow"
              className="w-full"
              onClick={() => onGenerateBill?.(subtotal, gst, total)}
            >
              Generate Bill
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
