import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getBill, BillData } from '@/lib/billStorage';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Download, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatISTDateTime } from '@/lib/dateUtils';

export default function BillView() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBill = async () => {
      console.log('🔍 BillView: Received invoiceId from URL:', invoiceId);
      if (!invoiceId) {
        console.log('❌ BillView: No invoiceId in URL!');
        setLoading(false);
        return;
      }

      // Try localStorage first (for same-origin access)
      const localBill = getBill(invoiceId);
      if (localBill) {
        console.log('✅ Found bill in localStorage');
        setBill(localBill);
        setLoading(false);
        return;
      }

      // Fetch from Supabase (for cross-origin access via ngrok/public URL)
      console.log('📡 Fetching bill from Supabase...');
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('invoice_number', invoiceId)
          .single();

        if (error) {
          console.error('❌ Supabase error:', error);
          setBill(null);
        } else if (data) {
          console.log('✅ Found bill in Supabase:', data);
          
          // Convert UTC timestamp to IST
          const { datePart, timePart, timePartUTC } = formatISTDateTime(data.created_at || data.invoice_date);
          
          // Transform Supabase data to BillData format
          const billData: BillData = {
            invoiceNumber: data.invoice_number,
            customerName: data.customer_name,
            customerMobile: data.customer_mobile,
            customerWhatsApp: data.customer_mobile,
            items: data.items,
            subtotal: data.total_amount,
            discountAmount: data.discount_applied || 0,
            finalTotal: data.final_amount,
            pointsEarned: data.points_earned || 0,
            pointsUsed: data.points_used || 0,
            date: datePart,
            time: `${timePart} IST / ${timePartUTC} UTC`,
            storeName: 'SuperMarket', // Default, update from settings if needed
            storeAddress: 'Store Address',
            gstNumber: 'GST Number',
          };
          setBill(billData);
        } else {
          console.log('❌ Bill not found in Supabase');
          setBill(null);
        }
      } catch (err) {
        console.error('❌ Error fetching bill:', err);
        setBill(null);
      }
      
      setLoading(false);
    };

    fetchBill();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading bill...</p>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h2>
            <p className="text-gray-600 mb-6">
              The bill you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 print:py-0 print:bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Action Buttons - Hidden when printing */}
        <div className="mb-6 flex gap-3 justify-end print:hidden">
          <Button onClick={() => navigate('/')} className="bg-white/80 backdrop-blur-sm border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button onClick={handlePrint} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>

        {/* Bill Content */}
        <Card className="shadow-2xl print:shadow-none print:border-0 bg-white border-0 overflow-hidden">
          <CardHeader className="border-b-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden print:bg-white">
            <div className="absolute inset-0 bg-black opacity-5 print:hidden"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 print:hidden"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 print:hidden"></div>
            <div className="text-center space-y-3 relative z-10 py-8 print:text-gray-900 print:py-4">
              <h1 className="text-5xl font-extrabold tracking-tight print:text-3xl print:text-gray-900">{bill.storeName}</h1>
              <div className="flex items-center justify-center gap-2 print:hidden">
                <div className="h-[2px] w-16 bg-white/50"></div>
                <div className="h-1 w-1 rounded-full bg-white"></div>
                <div className="h-[2px] w-16 bg-white/50"></div>
              </div>
              <p className="text-base text-white/90 font-medium print:text-sm print:text-gray-700">{bill.storeAddress}</p>
              <p className="text-sm text-white/80 font-medium print:text-sm print:text-gray-700">GST: {bill.gstNumber}</p>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Invoice Details */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 print:bg-gray-50 print:rounded-none">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide print:text-gray-600">Invoice Number</p>
                  <p className="font-bold text-2xl text-gray-900 tracking-tight">{bill.invoiceNumber}</p>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide print:text-gray-600">Date & Time</p>
                  <p className="font-bold text-lg text-gray-900">{bill.date}</p>
                  <p className="text-sm text-gray-600 font-medium">{bill.time}</p>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 print:bg-gray-50 print:rounded-none">
              <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl print:hidden">👤</span>
                <span>Customer Details</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Customer Name</span>
                  <span className="font-bold text-gray-900 text-lg">{bill.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Mobile</span>
                  <span className="font-bold text-gray-900 text-lg">{bill.customerMobile}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl print:hidden">🛒</span>
                <span>Purchased Items</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border-2 border-gray-100 print:border print:border-gray-300">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white print:bg-gray-200 print:text-gray-900">
                      <th className="text-left py-4 px-6 font-bold text-base">Item</th>
                      <th className="text-center py-4 px-6 font-bold text-base">Qty</th>
                      <th className="text-right py-4 px-6 font-bold text-base">Price</th>
                      <th className="text-right py-4 px-6 font-bold text-base">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {bill.items.map((item, index) => (
                      <tr key={index} className={`border-b border-gray-100 hover:bg-indigo-50/50 transition-colors print:hover:bg-white ${index % 2 === 1 ? 'bg-gray-50/50 print:bg-white' : ''}`}>
                        <td className="py-4 px-6 text-gray-900 font-medium">{item.name}</td>
                        <td className="py-4 px-6 text-center text-gray-900 font-semibold">{item.quantity}</td>
                        <td className="py-4 px-6 text-right text-gray-900 font-medium">₹{item.price.toFixed(2)}</td>
                        <td className="py-4 px-6 text-right font-bold text-indigo-600 print:text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl p-6 space-y-4 print:bg-gray-50 print:rounded-none">
              <div className="flex justify-between text-lg items-center">
                <span className="text-gray-700 font-semibold">Subtotal</span>
                <span className="font-bold text-gray-900 text-xl">₹{bill.subtotal.toFixed(2)}</span>
              </div>
              {bill.discountAmount > 0 && (
                <div className="flex justify-between text-lg items-center bg-green-100 -mx-6 px-6 py-3 print:bg-white print:mx-0 print:px-0">
                  <span className="text-green-700 font-semibold flex items-center gap-2">
                    <span className="print:hidden">🎉</span>
                    Reward Discount ({bill.pointsUsed} points)
                  </span>
                  <span className="font-bold text-green-700 text-xl">-₹{bill.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white -mx-6 px-6 py-5 rounded-xl print:bg-gray-200 print:text-gray-900 print:rounded-none print:mx-0">
                <span className="text-xl font-bold">Final Total</span>
                <span className="text-3xl font-extrabold tracking-tight">₹{bill.finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Loyalty Info */}
            {(bill.pointsEarned > 0 || bill.pointsUsed > 0) && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 p-6 rounded-2xl print:bg-gray-50 print:border print:border-gray-300 print:rounded-none">
                <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎁</span>
                  <span>Loyalty Rewards</span>
                </h3>
                <div className="space-y-3">
                  {bill.pointsEarned > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-semibold">Points Earned</span>
                      <span className="font-extrabold text-emerald-600 text-2xl">+{bill.pointsEarned}</span>
                    </div>
                  )}
                  {bill.pointsUsed > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-semibold">Points Used</span>
                      <span className="font-extrabold text-orange-600 text-2xl">{bill.pointsUsed}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center space-y-3 border-t-2 border-dashed border-gray-300 pt-6 mt-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full font-bold text-lg print:bg-gray-200 print:text-gray-900">
                <span className="text-xl print:hidden">✨</span>
                Thank you for shopping with us!
                <span className="text-xl print:hidden">✨</span>
              </div>
              <p className="text-sm mt-3 text-gray-500 font-medium">This is a computer-generated invoice</p>
              <p className="text-xs text-gray-400">Visit again soon!</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
