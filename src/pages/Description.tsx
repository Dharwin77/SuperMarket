import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Minus, Trash2, Phone, User, Send, FileText, CheckCircle, Award, TrendingUp } from "lucide-react";
import { useProducts } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { InvoiceReceipt } from "@/components/billing/InvoiceReceipt";
import { PaymentModal, RazorpayPaymentData } from "@/components/billing/PaymentModal";
import { useQueryClient } from "@tanstack/react-query";
import { saveBill } from "@/lib/billStorage";
import { useAuth } from "@/contexts/AuthContext";
import { generateBillLink } from "@/lib/publicUrl";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode: string;
  category: string;
}

export default function Description() {
  const { data: products } = useProducts();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { storeDetails } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerWhatsApp, setCustomerWhatsApp] = useState("");
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [fetchingPoints, setFetchingPoints] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingInvoiceNumber, setPendingInvoiceNumber] = useState("");

  // Filter products based on search
  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Add product to cart
  const addToCart = (product: any) => {
    // Check if product has sufficient stock
    if (product.stock <= 0) {
      toast({
        title: "Out of stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    
    // Check if adding more would exceed available stock
    if (existingItem && existingItem.quantity >= product.stock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${product.stock} units available for ${product.name}`,
        variant: "destructive",
      });
      return;
    }
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          barcode: product.barcode,
          category: product.category,
        },
      ]);
    }

    toast({
      title: "Added to cart",
      description: `${product.name} added successfully`,
    });
  };

  // Update quantity
  const updateQuantity = (id: string, delta: number) => {
    // Find the product to check stock availability
    const product = products?.find((p) => p.id === id);
    const cartItem = cart.find((item) => item.id === id);
    
    if (delta > 0 && product && cartItem) {
      // Check if increasing quantity would exceed stock
      if (cartItem.quantity + delta > product.stock) {
        toast({
          title: "Insufficient stock",
          description: `Only ${product.stock} units available for ${product.name}`,
          variant: "destructive",
        });
        return;
      }
    }

    setCart(
      cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove from cart
  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Calculate total
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate discount based on points (100 points = ₹1)
  const availableDiscount = customerPoints / 100;
  const discountAmount = applyDiscount ? Math.min(availableDiscount, total) : 0;
  const pointsToDeduct = Math.floor(discountAmount * 100);
  const finalTotal = total - discountAmount;
  
  // Calculate points to earn (₹100 = 1 point)
  const pointsToEarn = Math.floor(finalTotal / 100);

  // Fetch customer points when mobile number is entered
  const fetchCustomerPoints = async (mobile: string) => {
    if (mobile.length !== 10) return;

    setFetchingPoints(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("total_points")
        .eq("mobile", mobile)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found (which is ok for new customers)
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          toast({
            title: "Database not initialized",
            description: "Please run the loyalty_points_migration.sql in Supabase first!",
            variant: "destructive",
          });
        }
        console.error("Error fetching customer points:", error);
      }

      setCustomerPoints(data?.total_points || 0);
    } catch (error: any) {
      console.error("Error fetching customer points:", error);
      setCustomerPoints(0);
    } finally {
      setFetchingPoints(false);
    }
  };

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `INV${timestamp}`;
  };

  // Generate mock PDF URL (in production, this would be from Cloudinary or your storage)
  const generatePdfUrl = (invoice: string) => {
    // Mock URL - replace with actual PDF generation/upload in production
    return `https://res.cloudinary.com/demo/raw/upload/v1/invoices/${invoice}.pdf`;
  };

  // Open customer details dialog
  const openCustomerDialog = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add products to create a bill",
        variant: "destructive",
      });
      return;
    }
    setCheckoutOpen(true);
  };

  // Finalize bill after payment confirmation
  const handleCreateBill = async (
    paymentMethod: "cash" | "online",
    razorpayData?: RazorpayPaymentData
  ) => {
    if (!customerName.trim()) {
      toast({
        title: "Missing customer name",
        description: "Please enter customer name",
        variant: "destructive",
      });
      return;
    }

    if (!customerMobile.trim() || customerMobile.length !== 10) {
      toast({
        title: "Invalid mobile number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate invoice details
      const invoice = pendingInvoiceNumber || generateInvoiceNumber();
      setInvoiceNumber(invoice);
      setInvoiceDate(new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));

      // Check if customer exists, if not create one
      const { data: existingCustomer, error: fetchError } = await supabase
        .from("customers")
        .select("mobile")
        .eq("mobile", customerMobile)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      // Create customer if doesn't exist
      if (!existingCustomer) {
        const { error: createError } = await supabase
          .from("customers")
          .insert({
            mobile: customerMobile,
            total_points: 0,
            total_purchases: 0,
          });

        if (createError) throw createError;
      }

      // Save invoice to database
      const { error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoice,
          customer_mobile: customerMobile,
          customer_name: customerName,
          items: cart,
          total_amount: total,
          points_earned: pointsToEarn,
          points_used: pointsToDeduct,
          discount_applied: discountAmount,
          final_amount: finalTotal,
          whatsapp_sent: sendViaWhatsApp,
          invoice_date: new Date().toISOString(),
        });

      if (invoiceError) throw invoiceError;

      // ✅ AUTOMATIC STOCK REDUCTION AFTER PURCHASE
      let stockUpdatesSuccessful = 0;
      for (const item of cart) {
        // Get current stock for the product
        const { data: currentProduct, error: fetchError } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.id)
          .single();

        if (fetchError) {
          console.error(`Error fetching stock for ${item.name}:`, fetchError);
          continue;
        }

        // Calculate new stock (prevent negative values)
        const newStock = Math.max(0, (currentProduct?.stock || 0) - item.quantity);

        // Update product stock
        const { error: updateError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.id);

        if (updateError) {
          console.error(`Error updating stock for ${item.name}:`, updateError);
        } else {
          stockUpdatesSuccessful++;
        }
      }

      // Fetch updated customer points (after trigger updates total_points)
      const { data: updatedCustomer } = await supabase
        .from("customers")
        .select("total_points")
        .eq("mobile", customerMobile)
        .single();

      const totalPointsAfterPurchase = updatedCustomer?.total_points || pointsToEarn;

      // Save bill data for shareable link
      const billData = {
        invoiceNumber: invoice,
        paymentMethod,
        razorpayData,
        customerName,
        customerMobile,
        customerWhatsApp: customerWhatsApp || customerMobile,
        items: cart,
        subtotal: total,
        discountAmount,
        finalTotal,
        pointsEarned: pointsToEarn,
        pointsUsed: pointsToDeduct,
        date: new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        storeName: storeDetails.storeName,
        storeAddress: storeDetails.storeAddress,
        gstNumber: storeDetails.gstNumber,
      };
      
      saveBill(billData);

      // Generate shareable link using public URL (NEVER localhost)
      const billLink = generateBillLink(invoice);

      // Send via WhatsApp if checkbox is checked and number provided
      let sent = false;
      const whatsappDigits = (customerWhatsApp || '').replace(/\D/g, '');
      const normalizedWhatsappNumber =
        whatsappDigits.length === 10
          ? `91${whatsappDigits}`
          : whatsappDigits.length === 12 && whatsappDigits.startsWith('91')
            ? whatsappDigits
            : '';

      if (sendViaWhatsApp && normalizedWhatsappNumber) {

        // Create itemized list
        const itemsList = cart.map(item => 
          `${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(0)}`
        ).join('\n');

        // Create WhatsApp message with shareable link (formatted for clickability)
        let message = `🛒 *SUPERMARKET INVOICE*\n\n` +
          `📄 Invoice: *${invoice}*\n` +
          `👤 Customer: ${customerName}\n` +
          `💰 Total: *₹${finalTotal.toFixed(2)}*\n\n` +
          `View Full Bill:\n${billLink}\n\n` +
          `Thank you for shopping with us! 🙏`;
        
        const encodedMessage = encodeURIComponent(message);

        // Create WhatsApp URL
        const whatsappUrl = `https://wa.me/${normalizedWhatsappNumber}?text=${encodedMessage}`;

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        sent = true;
      } else if (sendViaWhatsApp && !normalizedWhatsappNumber) {
        toast({
          title: "Invalid WhatsApp Number",
          description: "Enter a valid 10-digit Indian number (with or without +91).",
          variant: "destructive",
        });
      }

      setMessageSent(sent);
      setCheckoutOpen(false);
      setPaymentModalOpen(false);
      setShowInvoice(true);

      // ✅ AUTOMATIC PROFIT ANALYTICS UPDATE
      // Invalidate queries to trigger automatic refresh of profit and stock data
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["soldStockValue"] });

      toast({
        title: "Invoice created!",
        description: `Invoice ${invoice} saved successfully. Earned ${pointsToEarn} points! Stock updated for ${stockUpdatesSuccessful} items.`,
      });
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      
      // Check if tables don't exist
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("relation")) {
        toast({
          title: "Database Setup Required",
          description: "Please run loyalty_points_migration.sql in Supabase SQL Editor first!",
          variant: "destructive",
        });
      } else if (error.code === "PGRST116") {
        // Customer not found - this shouldn't happen as we create it above
        toast({
          title: "Customer Creation Failed",
          description: "Could not create customer record. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create invoice. Check console for details.",
          variant: "destructive",
        });
      }
    }
  };

  const handleStartPayment = () => {
    if (!customerName.trim()) {
      toast({
        title: "Missing customer name",
        description: "Please enter customer name",
        variant: "destructive",
      });
      return;
    }

    if (!customerMobile.trim() || customerMobile.length !== 10) {
      toast({
        title: "Invalid mobile number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    if (sendViaWhatsApp && customerWhatsApp.trim().length !== 10) {
      toast({
        title: "Invalid WhatsApp number",
        description: "Please enter a valid 10-digit WhatsApp number",
        variant: "destructive",
      });
      return;
    }

    setPendingInvoiceNumber(generateInvoiceNumber());
    setCheckoutOpen(false);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (
    method: "cash" | "online",
    razorpayData?: RazorpayPaymentData
  ) => {
    await handleCreateBill(method, razorpayData);
  };

  // Close invoice and reset
  const handleCloseInvoice = () => {
    setShowInvoice(false);
    setCart([]);
    setCustomerName("");
    setCustomerMobile("");
    setCustomerWhatsApp("");
    setSendViaWhatsApp(false);
    setCustomerPoints(0);
    setApplyDiscount(false);
    setMessageSent(false);
    setPendingInvoiceNumber("");
    setPaymentModalOpen(false);
  };

  // If showing invoice, display the receipt component
  if (showInvoice) {
    return (
      <InvoiceReceipt
        invoiceNumber={invoiceNumber}
        customerName={customerName}
        customerPhone={customerWhatsApp || undefined}
        items={cart}
        total={finalTotal}
        date={invoiceDate}
        messageSent={messageSent}
        onClose={handleCloseInvoice}
      />
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Description</h1>
              <p className="text-muted-foreground">
                Add products to create a bill
              </p>
            </div>
          </div>

          {/* Cart Summary */}
          <Card className="glass-panel border-cyan-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Items</p>
                  <p className="text-2xl font-bold text-cyan-400">{totalItems}</p>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold gradient-text">₹{total.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search & List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Search Bar */}
            <Card className="glass-panel border-cyan-500/30">
              <CardContent className="p-4">
                <Input
                  type="text"
                  placeholder="Search products by name, barcode, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background border-border"
                />
              </CardContent>
            </Card>

            {/* Products Grid */}
            <Card className="glass-panel border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Available Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-2 text-center py-12">
                      <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No products found</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-3 border border-white/10 hover:border-cyan-500/50 transition-all"
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2 border border-white/10">
                          {product.image_url ? (
                            <>
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                              <div className="hidden absolute inset-0 items-center justify-center text-xs text-muted-foreground">
                                No image available
                              </div>
                            </>
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                              No image available
                            </div>
                          )}
                        </div>

                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                              {product.name}
                            </h3>
                            <Badge variant="secondary" className="mt-1 text-[10px] h-5 px-2">
                              {product.category}
                            </Badge>
                          </div>
                          <p className="text-base font-bold text-cyan-400">
                            ₹{product.price?.toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                          <span>Stock: {product.stock}</span>
                          <span className="font-mono">{product.barcode}</span>
                        </div>

                        <Button
                          onClick={() => addToCart(product)}
                          className="w-full h-8 text-sm bg-cyan-500 hover:bg-cyan-600"
                          disabled={product.stock === 0}
                        >
                          <Plus className="h-3.5 w-3.5 mr-2" />
                          Add to Cart
                        </Button>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card className="glass-panel border-cyan-500/30 sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <ShoppingCart className="h-5 w-5" />
                  Cart ({totalItems} items)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground text-sm">Cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="glass-card p-3 border border-white/10"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm line-clamp-1">
                                {item.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                ₹{item.price} × {item.quantity}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-semibold w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm font-bold text-cyan-400">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-2xl font-bold gradient-text">
                          ₹{total.toFixed(2)}
                        </span>
                      </div>

                      <Button
                        onClick={openCustomerDialog}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Checkout
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Customer Information Dialog */}
        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Create Invoice
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Enter customer details to create bill and earn loyalty points.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Customer Name */}
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm">
                  Customer Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="pl-10 bg-background border-border"
                  />
                </div>
              </div>

              {/* Customer Mobile (Mandatory) */}
              <div className="space-y-2">
                <Label htmlFor="customerMobile" className="text-sm">
                  Mobile Number * <span className="text-xs text-muted-foreground">(Primary ID)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customerMobile"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={customerMobile}
                    onChange={(e) => {
                      const mobile = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setCustomerMobile(mobile);
                      if (mobile.length === 10) {
                        fetchCustomerPoints(mobile);
                      } else {
                        setCustomerPoints(0);
                        setApplyDiscount(false);
                      }
                    }}
                    className="pl-10 bg-background border-border"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  📱 Used to store bills and reward points
                </p>
              </div>

              {/* Reward Points Summary */}
              {customerMobile.length === 10 && (
                <div className="glass-card p-4 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-5 w-5 text-green-400" />
                    <h4 className="font-semibold text-green-400">Loyalty Rewards</h4>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available Points</span>
                      <span className="font-semibold text-green-400">
                        {fetchingPoints ? "Loading..." : customerPoints}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount Value</span>
                      <span className="font-semibold">
                        ≈ ₹{availableDiscount.toFixed(2)}
                      </span>
                    </div>
                    
                    {customerPoints > 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="applyDiscount"
                            checked={applyDiscount}
                            onCheckedChange={(checked) => setApplyDiscount(checked as boolean)}
                          />
                          <label
                            htmlFor="applyDiscount"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Apply Reward Discount
                          </label>
                        </div>
                        {applyDiscount && (
                          <p className="text-xs text-green-400 mt-2">
                            ✓ Using {pointsToDeduct} points = ₹{discountAmount.toFixed(2)} discount
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-white/10 flex justify-between">
                      <span className="text-muted-foreground">Points from this purchase</span>
                      <span className="font-semibold text-green-400">
                        +{pointsToEarn} points
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bill Summary */}
              <div className="glass-card p-4 border border-cyan-500/30">
                <h4 className="font-semibold text-cyan-400 mb-2">Bill Summary</h4>
                <div className="space-y-1 text-sm">
                  {cart.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-foreground">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                  {cart.length > 3 && (
                    <div className="text-xs text-muted-foreground italic">
                      + {cart.length - 3} more items...
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{total.toFixed(0)}</span>
                    </div>
                    {applyDiscount && discountAmount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Reward Discount</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-1">
                      <span>Final Total</span>
                      <span className="text-cyan-400">₹{finalTotal.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional WhatsApp Section */}
              <div className="space-y-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendWhatsApp"
                    checked={sendViaWhatsApp}
                    onCheckedChange={(checked) => setSendViaWhatsApp(checked as boolean)}
                  />
                  <label
                    htmlFor="sendWhatsApp"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Send bill via WhatsApp (Optional)
                  </label>
                </div>
                
                {sendViaWhatsApp && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="customerWhatsApp" className="text-sm">
                      WhatsApp Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customerWhatsApp"
                        type="tel"
                        placeholder="Enter 10-digit WhatsApp number"
                        value={customerWhatsApp}
                        onChange={(e) => setCustomerWhatsApp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="pl-10 bg-background border-green-300"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Works only if customer uses WhatsApp (FREE - No charges)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCheckoutOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartPayment}
                disabled={!customerName.trim() || customerMobile.length !== 10}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PaymentModal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setCheckoutOpen(true);
          }}
          items={cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            profit: 0,
          }))}
          subtotal={total}
          gst={0}
          total={finalTotal}
          customerName={customerName}
          customerPhone={customerMobile}
          invoiceNumber={pendingInvoiceNumber}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    </MainLayout>
  );
}
