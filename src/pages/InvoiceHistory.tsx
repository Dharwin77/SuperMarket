import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Receipt,
  Search,
  Calendar,
  Phone,
  User,
  TrendingUp,
  FileText,
  Award,
  X,
} from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_mobile: string;
  customer_name: string;
  items: any[];
  total_amount: number;
  points_earned: number;
  points_used: number;
  discount_applied: number;
  final_amount: number;
  whatsapp_sent: boolean;
  created_at: string;
  invoice_date: string;
}

interface Customer {
  mobile: string;
  total_points: number;
  total_purchases: number;
  last_purchase_date: string;
}

interface CustomerWithName extends Customer {
  customer_name: string;
}

export default function InvoiceHistory() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerWithName[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithName | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // Fetch all customers on page load
  useEffect(() => {
    fetchAllCustomers();
  }, []);

  const fetchAllCustomers = async () => {
    setLoading(true);
    try {
      // Fetch all customers
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .order("last_purchase_date", { ascending: false });

      if (customersError) throw customersError;

      // For each customer, get their latest invoice to get customer name
      const customersWithNames = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { data: latestInvoice } = await supabase
            .from("invoices")
            .select("customer_name")
            .eq("customer_mobile", customer.mobile)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...customer,
            customer_name: latestInvoice?.customer_name || "Unknown",
          };
        })
      );

      setCustomers(customersWithNames);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // View customer's invoices
  const viewCustomerInvoices = async (customer: CustomerWithName) => {
    setSelectedCustomer(customer);
    try {
      const { data: invoicesData, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_mobile", customer.mobile)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInvoices(invoicesData || []);
      setCustomerDialogOpen(true);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch invoices",
        variant: "destructive",
      });
    }
  };

  // View invoice details
  const viewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDialogOpen(true);
  };

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
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Invoice History</h1>
              <p className="text-muted-foreground">
                All customers and their purchase history
              </p>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        )}

        {/* Customers List */}
        {!loading && customers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              All Customers ({customers.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {customers.map((customer, index) => (
                  <motion.div
                    key={customer.mobile}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="glass-card border-border hover:border-primary/40 transition-all">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Customer Info */}
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                              {customer.customer_name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{customer.mobile}</span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="glass-card p-3 border border-green-500/20">
                              <div className="flex items-center gap-2 mb-1">
                                <Award className="h-4 w-4 text-green-400" />
                                <span className="text-xs text-muted-foreground">Points</span>
                              </div>
                              <p className="text-lg font-bold text-green-400">
                                {customer.total_points}
                              </p>
                            </div>
                            <div className="glass-card p-3 border border-primary/20">
                              <div className="flex items-center gap-2 mb-1">
                                <Receipt className="h-4 w-4 text-primary" />
                                <span className="text-xs text-muted-foreground">Purchases</span>
                              </div>
                              <p className="text-lg font-bold text-primary">
                                {customer.total_purchases}
                              </p>
                            </div>
                          </div>

                          {/* Last Purchase */}
                          {customer.last_purchase_date && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Last: {new Date(customer.last_purchase_date).toLocaleDateString("en-IN")}
                            </div>
                          )}

                          {/* View Button */}
                          <Button
                            onClick={() => viewCustomerInvoices(customer)}
                            className="w-full bg-primary hover:bg-primary/90"
                            size="sm"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Invoices
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && customers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Customers Yet
            </h3>
            <p className="text-muted-foreground">
              Create your first invoice to see customers here
            </p>
          </motion.div>
        )}
      </div>

      {/* Customer Invoices Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {selectedCustomer.customer_name}'s Purchase History
                </DialogTitle>
              </DialogHeader>

              {/* Customer Summary */}
              <div className="glass-card p-4 border border-green-500/30">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mobile</span>
                    <p className="font-semibold">{selectedCustomer.mobile}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Points</span>
                    <p className="font-semibold text-green-400">
                      {selectedCustomer.total_points}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Purchases</span>
                    <p className="font-semibold text-primary">
                      {selectedCustomer.total_purchases}
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoices List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Invoices ({invoices.length})</h4>
                {invoices.map((invoice) => (
                  <Card
                    key={invoice.id}
                    className="glass-card border-border hover:border-primary/40 cursor-pointer transition-all"
                    onClick={() => viewInvoice(invoice)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              {invoice.invoice_number}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(invoice.created_at).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invoice.items.length} items
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xl font-bold text-primary">
                            ₹{invoice.final_amount.toFixed(0)}
                          </p>
                          <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                            +{invoice.points_earned} pts
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Invoice Details
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Header Info */}
                <div className="glass-card p-4 border border-primary/20">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Invoice Number</span>
                      <p className="font-semibold text-primary">
                        {selectedInvoice.invoice_number}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date</span>
                      <p className="font-semibold">
                        {new Date(selectedInvoice.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Customer</span>
                      <p className="font-semibold">{selectedInvoice.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mobile</span>
                      <p className="font-semibold">{selectedInvoice.customer_mobile}</p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">Items</h4>
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between p-3 rounded-lg bg-muted border border-border"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{item.price} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ₹{(item.price * item.quantity).toFixed(0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="glass-card p-4 border border-green-500/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{selectedInvoice.total_amount.toFixed(0)}</span>
                  </div>
                  {selectedInvoice.discount_applied > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-red-400">
                        <span>Reward Discount ({selectedInvoice.points_used} points)</span>
                        <span>-₹{selectedInvoice.discount_applied.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-lg">
                    <span>Final Amount</span>
                    <span className="text-green-400">
                      ₹{selectedInvoice.final_amount.toFixed(0)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-sm">
                    <span className="text-green-400">Points Earned</span>
                    <span className="text-green-400 font-semibold">
                      +{selectedInvoice.points_earned} points
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
