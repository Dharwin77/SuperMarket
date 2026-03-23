import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  CreditCard,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { CartItem } from "./BillingCart";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  gst: number;
  total: number;
  customerName: string;
  customerPhone?: string;
  invoiceNumber: string;
  onPaymentSuccess: (method: "cash" | "online", razorpayData?: RazorpayPaymentData) => void;
}

export interface RazorpayPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutResponse {
  razorpay_order_id?: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill?: {
    name?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

type PaymentStep = "select" | "cash-confirm" | "online-processing" | "success" | "failed";

const isLocalDevelopment =
  typeof window !== "undefined" &&
  window.location.protocol !== "https:" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const configuredBackendUrl = (import.meta.env.VITE_BACKEND_URL || "").trim().replace(/\/$/, "");
const isConfiguredBackendNgrok = /ngrok/i.test(configuredBackendUrl);
const BACKEND_URL = isLocalDevelopment
  ? "http://localhost:3001"
  : configuredBackendUrl;
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourKeyHere";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PaymentModal({
  open,
  onClose,
  items,
  subtotal,
  gst,
  total,
  customerName,
  customerPhone,
  invoiceNumber,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>("select");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("select");
      setLoading(false);
      setErrorMsg(null);
    }
  }, [open]);

  // ── Cash flow ──────────────────────────────────────────────────────────────
  const handleCashSelect = () => setStep("cash-confirm");

  const handleCashConfirm = () => {
    setStep("success");
    onPaymentSuccess("cash");
  };

  const verifyPaymentOnBackend = async (response: RazorpayPaymentData) => {
    const verifyRes = await fetch(`${BACKEND_URL}/api/razorpay/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });

    const verifyData = await verifyRes.json();
    return !!verifyData.success;
  };

  const openRazorpayCheckout = async (params: {
    amount: number;
    currency: string;
    orderId?: string;
    fallbackMode?: boolean;
  }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error("Could not load Razorpay script. Check your internet connection.");

    setLoading(false);

    const options: RazorpayOptions = {
      key: RAZORPAY_KEY_ID,
      amount: params.amount,
      currency: params.currency,
      name: "SuperMarket",
      description: `Invoice ${invoiceNumber}`,
      ...(params.orderId ? { order_id: params.orderId } : {}),
      prefill: {
        name: customerName,
        contact: customerPhone,
      },
      theme: { color: "#6366f1" },
      handler: async (response: RazorpayCheckoutResponse) => {
        try {
          setLoading(true);

          // Standard secure path: verify signature on backend.
          if (response.razorpay_order_id && response.razorpay_signature) {
            const verified = await verifyPaymentOnBackend({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setLoading(false);
            if (verified) {
              setStep("success");
              onPaymentSuccess("online", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              return;
            }

            setErrorMsg("Payment verification failed. Please contact support.");
            setStep("failed");
            return;
          }

          // Fallback path: checkout opened without backend order.
          if (params.fallbackMode && response.razorpay_payment_id) {
            setLoading(false);
            setStep("success");
            onPaymentSuccess("online", {
              razorpay_order_id: response.razorpay_order_id || `fallback_${invoiceNumber}`,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || "fallback-unverified",
            });
            return;
          }

          setLoading(false);
          setErrorMsg("Payment response was incomplete. Please try again.");
          setStep("failed");
        } catch {
          setLoading(false);
          setErrorMsg("Payment verification error. Please contact support.");
          setStep("failed");
        }
      },
      modal: {
        ondismiss: () => {
          setErrorMsg("Payment was cancelled. Please try again.");
          setStep("failed");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", () => {
      setErrorMsg("Payment failed. Please try a different payment method.");
      setStep("failed");
    });
    rzp.open();
  };

  // ── Razorpay flow ──────────────────────────────────────────────────────────
  const handleOnlineSelect = async () => {
    setStep("online-processing");
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!BACKEND_URL) {
        throw new Error("Payment API is not configured. Set VITE_BACKEND_URL to your Render backend URL and redeploy.");
      }

      if (!isLocalDevelopment && isConfiguredBackendNgrok) {
        throw new Error("VITE_BACKEND_URL is pointing to ngrok. Use your permanent Render backend URL and redeploy.");
      }

      // 1. Create order on backend
      const orderRes = await fetch(`${BACKEND_URL}/api/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(total * 100), // paise
          currency: "INR",
          receipt: invoiceNumber,
          customerName,
          customerPhone,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        const errMsg = err?.error || "Failed to create Razorpay order";

        // Fallback: if backend auth fails, still continue to Razorpay checkout from frontend.
        if (typeof errMsg === "string" && errMsg.toLowerCase().includes("authentication failed")) {
          await openRazorpayCheckout({
            amount: Math.round(total * 100),
            currency: "INR",
            fallbackMode: true,
          });
          return;
        }

        throw new Error(errMsg);
      }

      const orderData = await orderRes.json();

      if (orderData?._fallback) {
        await openRazorpayCheckout({
          amount: orderData.amount || Math.round(total * 100),
          currency: orderData.currency || "INR",
          fallbackMode: true,
        });
        return;
      }

      await openRazorpayCheckout({
        amount: orderData.amount,
        currency: orderData.currency,
        orderId: orderData.id,
      });
    } catch (err: unknown) {
      setLoading(false);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStep("failed");
    }
  };

  const handleRetry = () => {
    setStep("select");
    setErrorMsg(null);
  };

  const amountInRupees = total.toFixed(2);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-background border border-white/10 glass-panel">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-text">
            Complete Payment
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select cash or online payment to complete this invoice.
          </DialogDescription>
        </DialogHeader>

        {/* Invoice summary strip */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 mb-2">
          <div>
            <p className="text-xs text-muted-foreground">Invoice</p>
            <p className="font-semibold text-foreground">{invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold gradient-text">₹{amountInRupees}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step: Select payment method ─────────────────────────── */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground text-center">
                Choose a payment method to proceed
              </p>

              {/* Cash */}
              <button
                onClick={handleCashSelect}
                className="w-full flex items-center gap-4 p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-success/50 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center group-hover:bg-success/30 transition-colors">
                  <Banknote className="h-6 w-6 text-success" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Cash Payment</p>
                  <p className="text-sm text-muted-foreground">Pay directly at counter</p>
                </div>
                <Badge className="ml-auto bg-success/20 text-success border-success/30">
                  Instant
                </Badge>
              </button>

              {/* Razorpay */}
              <button
                onClick={handleOnlineSelect}
                className="w-full flex items-center gap-4 p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Online Payment</p>
                  <p className="text-sm text-muted-foreground">UPI, Cards, Net Banking</p>
                </div>
                <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">
                  Razorpay
                </Badge>
              </button>
            </motion.div>
          )}

          {/* ── Step: Cash confirm ──────────────────────────────────── */}
          {step === "cash-confirm" && (
            <motion.div
              key="cash-confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-5 rounded-xl border border-success/30 bg-success/10 text-center space-y-2">
                <Banknote className="h-12 w-12 text-success mx-auto" />
                <p className="text-lg font-semibold text-foreground">Cash Payment</p>
                <p className="text-3xl font-bold text-success">₹{amountInRupees}</p>
                <p className="text-sm text-muted-foreground">
                  Please collect cash from the customer
                </p>
              </div>

              {/* Item breakdown */}
              <div className="max-h-40 overflow-y-auto space-y-1 p-3 rounded-xl bg-white/5 border border-white/10">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-white/10 flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetry} className="flex-1">
                  Back
                </Button>
                <Button
                  variant="glow"
                  onClick={handleCashConfirm}
                  className="flex-1 bg-success hover:bg-success/90 text-white border-0"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Payment
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step: Online processing ────────────────────────────── */}
          {step === "online-processing" && (
            <motion.div
              key="online-processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-10 gap-4"
            >
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-lg font-semibold text-foreground">
                {loading ? "Preparing Razorpay checkout…" : "Razorpay checkout opened"}
              </p>
              <p className="text-sm text-muted-foreground text-center">
                {loading
                  ? "Creating secure payment session"
                  : "Complete the payment in the Razorpay window"}
              </p>
            </motion.div>
          )}

          {/* ── Step: Success ──────────────────────────────────────── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 gap-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center"
              >
                <CheckCircle2 className="h-12 w-12 text-success" />
              </motion.div>
              <p className="text-2xl font-bold text-success">Payment Successful!</p>
              <p className="text-sm text-muted-foreground">
                Invoice <strong>{invoiceNumber}</strong> has been generated
              </p>
              <p className="text-sm text-muted-foreground">
                Generating your receipt…
              </p>
            </motion.div>
          )}

          {/* ── Step: Failed ───────────────────────────────────────── */}
          {step === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center py-6 gap-3 text-center">
                <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <p className="text-xl font-bold text-destructive">Payment Failed</p>
                {errorMsg && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-left">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{errorMsg}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button variant="glow" onClick={handleRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
