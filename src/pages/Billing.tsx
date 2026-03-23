import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { BillingCart, CartItem } from "@/components/billing/BillingCart";
import { PaymentModal, RazorpayPaymentData } from "@/components/billing/PaymentModal";
import { InvoiceReceipt } from "@/components/billing/InvoiceReceipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Search, Plus, ScanLine, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
const products = [
  { id: "1", name: "Lays Classic Chips", price: 20, profit: 6 },
  { id: "2", name: "Coca-Cola 500ml", price: 40, profit: 10 },
  { id: "3", name: "Parle-G Biscuits", price: 10, profit: 3 },
  { id: "4", name: "Dairy Milk Silk", price: 80, profit: 20 },
  { id: "5", name: "Amul Milk 500ml", price: 28, profit: 4 },
  { id: "6", name: "Britannia Bread", price: 35, profit: 7 },
  { id: "7", name: "Maggi Noodles", price: 14, profit: 4 },
  { id: "8", name: "Thums Up 750ml", price: 45, profit: 12 },
];

const Billing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: "1", name: "Lays Classic Chips", price: 20, quantity: 2, profit: 6 },
    { id: "2", name: "Coca-Cola 500ml", price: 40, quantity: 1, profit: 10 },
  ]);

  // Payment modal state

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [billTotals, setBillTotals] = useState({ subtotal: 0, gst: 0, total: 0 });
  
  // Customer details state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  // Invoice receipt state
  const [showReceipt, setShowReceipt] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{
    invoiceNumber: string;
    paymentMethod: "cash" | "online";
    razorpayData?: RazorpayPaymentData;
  } | null>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: (typeof products)[0]) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };


  // Generate bill — shows customer form first
  const handleGenerateBill = (subtotal: number, gst: number, total: number) => {
    setBillTotals({ subtotal, gst, total });
    setShowCustomerForm(true);
  };

  // Proceed to payment after customer details are filled
  const handleProceedToPayment = () => {
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }
    setShowCustomerForm(false);
    setPaymentModalOpen(true);
  };
  // Called by PaymentModal once payment succeeds
  const handlePaymentSuccess = (
    method: "cash" | "online",
    razorpayData?: RazorpayPaymentData
  ) => {
    const invoiceNumber = `INV${Date.now().toString().slice(-8)}`;
    setInvoiceData({ invoiceNumber, paymentMethod: method, razorpayData });

    // Short delay so the success animation in the modal is visible
    setTimeout(() => {
      setPaymentModalOpen(false);
      setShowReceipt(true);
    }, 1200);
  };


  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setInvoiceData(null);
    // Clear cart and customer details after successful bill
    setCartItems([]);
    setCustomerName("");
    setCustomerPhone("");
  };
  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-success to-primary flex items-center justify-center glow-success">
                <Receipt className="h-6 w-6 text-primary-foreground" />
              </div>
                <h1 className="text-3xl font-bold text-foreground">Billing</h1>
              </div>
                <p className="text-muted-foreground">Create new bills quickly</p>
              {/* Customer Details Modal */}
              <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold gradient-text">
                      Customer Details
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Customer Name</label>
                      <Input
                        placeholder="Enter customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="bg-white/5 border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Phone (Optional)</label>
                      <Input
                        placeholder="Customer phone number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        type="tel"
                        className="bg-white/5 border-white/10"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowCustomerForm(false);
                          setCustomerName("");
                          setCustomerPhone("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="glow"
                        className="flex-1"
                        onClick={handleProceedToPayment}
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
              {/* Payment Modal */}
              <PaymentModal
            </div>

            <Button variant="glow">
              <ScanLine className="h-4 w-4 mr-2" />
              Scan Product
            </Button>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10"
            />
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto max-h-[calc(100vh-20rem)]"
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.03 }}
                onClick={() => addToCart(product)}
                className="glass-card p-4 border border-white/10 cursor-pointer hover:border-primary/50 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-xl">📦</span>
                </div>
                <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-lg font-bold text-foreground">₹{product.price}</p>
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-success mt-1">+₹{product.profit} profit</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <BillingCart
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onGenerateBill={handleGenerateBill}
          />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        items={cartItems}
        subtotal={billTotals.subtotal}
        gst={billTotals.gst}
        total={billTotals.total}
            customerName={customerName}
            customerPhone={customerPhone}
        invoiceNumber={`INV${Date.now().toString().slice(-8)}`}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Invoice Receipt */}
      {showReceipt && invoiceData && (
        <div className="fixed inset-0 z-50 bg-background">
          <InvoiceReceipt
            invoiceNumber={invoiceData.invoiceNumber}
            customerName={customerName}
            customerPhone={customerPhone}
            items={cartItems.map((item) => ({ ...item, category: "General" }))}
            total={billTotals.total}
            date={new Date().toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            messageSent={false}
            onClose={handleCloseReceipt}
          />
        </div>
      )}
    </MainLayout>
  );
};

export default Billing;
