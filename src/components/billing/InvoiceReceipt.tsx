import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Share2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface InvoiceReceiptProps {
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  total: number;
  date: string;
  messageSent: boolean;
  onClose: () => void;
}

export function InvoiceReceipt({
  invoiceNumber,
  customerName,
  customerPhone,
  items,
  total,
  date,
  messageSent,
  onClose,
}: InvoiceReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 15;
    const rightMargin = 15;
    let yPosition = 20;

    // Header Section with Logo and Shop Name
    // Logo placeholder (optional - can be replaced with actual logo)
    const logoSize = 15;
    const logoX = leftMargin;
    const logoY = yPosition;
    
    // Draw a simple placeholder box for logo (remove if you have actual logo)
    doc.setFillColor(230, 230, 230);
    doc.rect(logoX, logoY, logoSize, logoSize, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("LOGO", logoX + logoSize / 2, logoY + logoSize / 2, { align: "center" });

    // Shop Name next to logo
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("SMART RETAIL ASSISTANT", logoX + logoSize + 5, yPosition + 10);

    yPosition += logoSize + 8;

    // Invoice Metadata below header
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`Invoice No : ${invoiceNumber}`, leftMargin, yPosition);
    yPosition += 5;
    doc.text(`Date       : ${date}`, leftMargin, yPosition);
    yPosition += 10;

    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
    yPosition += 8;

    // Customer Information
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Bill To:", leftMargin, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "normal");
    doc.text(customerName, leftMargin, yPosition);
    if (customerPhone) {
      yPosition += 5;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`WhatsApp: ${customerPhone}`, leftMargin, yPosition);
    }
    yPosition += 10;

    // Items Table
    const tableData = items.map((item) => [
      item.name,
      item.quantity.toString(),
      `Rs.${item.price.toFixed(0)}`,
      `Rs.${(item.price * item.quantity).toFixed(0)}`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Item", "Qty", "Price", "Total"]],
      body: tableData,
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 40, halign: "right" },
      },
    });

    // Get position after table
    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", pageWidth - rightMargin - 60, yPosition);
    doc.setFontSize(14);
    doc.text(`Rs.${total.toFixed(0)}`, pageWidth - rightMargin, yPosition, {
      align: "right",
    });
    yPosition += 15;

    // Footer
    yPosition = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Thank you for shopping with us!", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("We appreciate your business", pageWidth / 2, yPosition, {
      align: "center",
    });

    // Save PDF
    doc.save(`Invoice-${invoiceNumber}.pdf`);
  };

  const handleShare = () => {
    // Create shareable text
    const shareText = `Invoice: ${invoiceNumber}\nCustomer: ${customerName}\nTotal: ₹${total}\n\nThank you for shopping at SuperMarket!`;
    
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoiceNumber}`,
        text: shareText,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onClose}
          className="mb-6 print:hidden"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Billing
        </Button>

        {/* Success Message */}
        {messageSent && customerPhone && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 print:hidden"
          >
            <Card className="glass-panel border-green-500/50 bg-green-500/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <div>
                    <p className="text-green-400 font-semibold">
                      Message sent successfully via WhatsApp!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Invoice sent to {customerName} - {customerPhone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Invoice Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-panel border-cyan-500/30">
            <CardContent className="p-8 md:p-12">
              {/* Header */}
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-white/10">
                <div>
                  <h1 className="text-3xl font-bold gradient-text mb-2">
                    SuperMarket
                  </h1>
                  <p className="text-muted-foreground">Your trusted store</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="mb-2 text-lg">
                    {invoiceNumber}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{date}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-8 glass-card p-4 border border-cyan-500/20">
                <h3 className="text-sm font-semibold text-cyan-400 mb-3">
                  Bill To:
                </h3>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">
                    {customerName}
                  </p>
                  {customerPhone && (
                    <p className="text-sm text-muted-foreground">
                      WhatsApp: {customerPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-cyan-500/30">
                        <th className="text-left py-3 text-cyan-400 font-semibold">
                          Item
                        </th>
                        <th className="text-center py-3 text-cyan-400 font-semibold">
                          Qty
                        </th>
                        <th className="text-right py-3 text-cyan-400 font-semibold">
                          Price
                        </th>
                        <th className="text-right py-3 text-cyan-400 font-semibold">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-white/5 hover:bg-white/5"
                        >
                          <td className="py-4">
                            <div>
                              <p className="font-medium text-foreground">
                                {item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.category}
                              </p>
                            </div>
                          </td>
                          <td className="text-center text-muted-foreground">
                            {item.quantity}
                          </td>
                          <td className="text-right text-muted-foreground">
                            ₹{item.price.toFixed(0)}
                          </td>
                          <td className="text-right font-semibold text-foreground">
                            ₹{(item.price * item.quantity).toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-end mb-8">
                <div className="glass-card p-6 border border-cyan-500/30 min-w-[250px]">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">
                      Grand Total
                    </span>
                    <span className="text-3xl font-bold gradient-text">
                      ₹{total.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 border-t border-white/10">
                <p className="text-lg font-semibold text-cyan-400 mb-2">
                  Thank you for shopping with us!
                </p>
                <p className="text-sm text-muted-foreground">
                  We appreciate your business
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex gap-4 justify-center print:hidden"
        >
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            className="border-cyan-500/30 hover:bg-cyan-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            className="border-cyan-500/30 hover:bg-cyan-500/10"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </motion.div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .min-h-screen {
            min-height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
