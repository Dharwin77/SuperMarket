import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Package, 
  CalendarX, 
  Receipt, 
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getInvoices, getInvoicesByDateRange } from "@/services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatISTForReports } from "@/lib/dateUtils";

type TimeFilter = "today" | "yesterday" | "week" | "month" | "total";
type ExpiryFilter = "all" | "expired" | "expiring_7" | "expiring_30";

const Reports = () => {
  const [profitTimeFilter, setProfitTimeFilter] = useState<TimeFilter>("today");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all");

  // Fetch all products
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  // Fetch all invoices
  const { data: allInvoices = [] } = useQuery({
    queryKey: ["allInvoices"],
    queryFn: getInvoices,
  });

  // Helper to convert time filter to date range
  const getDateRange = (filter: TimeFilter): { startDate: Date; endDate: Date } => {
    const now = new Date();
    const endDate = new Date();
    let startDate = new Date();

    switch (filter) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "total":
        startDate = new Date(2000, 0, 1);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  };

  // Download CSV helper
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("No data to download");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Always quote string values (especially those with ₹ symbol)
        if (typeof value === "string") {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(","))
    ].join("\n");

    // Add UTF-8 BOM to ensure proper character encoding (especially for ₹ symbol)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 1. Current Products Report
  const downloadProductsPDF = () => {
    if (products.length === 0) {
      alert("No products to download");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Current Products Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatISTForReports(new Date())}`, 14, 28);

    const tableData = products.map(p => [
      p.name,
      p.category,
      p.barcode,
      p.stock.toString(),
      `Rs.${p.price.toFixed(2)}`,
      `Rs.${(p.stock * p.price).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Product", "Category", "Barcode", "Stock", "Unit Price", "Stock Value"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    doc.save(`products_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadProductsCSV = () => {
    const csvData = products.map(p => ({
      "Product Name": p.name,
      "Category": p.category,
      "Barcode": p.barcode,
      "Stock Quantity": p.stock,
      "Unit Price": `₹${p.price.toFixed(2)}`,
      "Stock Value": `₹${(p.stock * p.price).toFixed(2)}`
    }));
    downloadCSV(csvData, "products_report");
  };

  // 2. Expiry History Report
  const getFilteredExpiryProducts = () => {
    const now = new Date();
    
    return products.filter(p => {
      if (!p.expiry_date) return false;
      
      const expiryDate = new Date(p.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (expiryFilter) {
        case "expired":
          return daysUntilExpiry < 0;
        case "expiring_7":
          return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
        case "expiring_30":
          return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
        default:
          return true;
      }
    }).map(p => {
      const expiryDate = new Date(p.expiry_date!);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let status = "Valid";
      if (daysUntilExpiry < 0) status = "Expired";
      else if (daysUntilExpiry <= 7) status = "Expiring Soon";
      
      return { ...p, status, daysUntilExpiry };
    });
  };

  const downloadExpiryPDF = () => {
    const filteredProducts = getFilteredExpiryProducts();
    
    if (filteredProducts.length === 0) {
      alert("No expiry data to download");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Expiry History Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    const tableData = filteredProducts.map(p => [
      p.name,
      p.category,
      new Date(p.expiry_date!).toLocaleDateString(),
      p.status,
      p.daysUntilExpiry >= 0 ? `${p.daysUntilExpiry} days` : `${Math.abs(p.daysUntilExpiry)} days ago`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Product", "Category", "Expiry Date", "Status", "Days"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68] },
    });

    doc.save(`expiry_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadExpiryCSV = () => {
    const filteredProducts = getFilteredExpiryProducts();
    
    const csvData = filteredProducts.map(p => ({
      "Product Name": p.name,
      "Category": p.category,
      "Expiry Date": new Date(p.expiry_date!).toLocaleDateString(),
      "Status": p.status,
      "Days Until Expiry": p.daysUntilExpiry
    }));
    
    downloadCSV(csvData, "expiry_report");
  };

  // 3. Invoice History Report
  const downloadInvoicesPDF = () => {
    if (allInvoices.length === 0) {
      alert("No invoices to download");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Invoice History Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatISTForReports(new Date())}`, 14, 28);

    const tableData = allInvoices.map(inv => [
      inv.invoice_number || "N/A",
      inv.customer_mobile || "N/A",
      formatISTForReports(inv.created_at),
      `Rs.${(inv.final_amount || inv.total_amount || 0).toFixed(2)}`,
      `Rs.${(inv.discount_applied || 0).toFixed(2)}`,
      `${inv.points_earned || 0} / ${inv.points_used || 0}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Invoice No", "Customer", "Date & Time", "Amount", "Discount", "Points (E/U)"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`invoices_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadInvoicesCSV = () => {
    const csvData = allInvoices.map(inv => ({
      "Invoice Number": inv.invoice_number || "N/A",
      "Customer Mobile": inv.customer_mobile || "N/A",
      "Date Time": formatISTForReports(inv.created_at),
      "Total Amount": `₹${(inv.final_amount || inv.total_amount || 0).toFixed(2)}`,
      "Discount Applied": `₹${(inv.discount_applied || 0).toFixed(2)}`,
      "Points Earned": inv.points_earned || 0,
      "Points Used": inv.points_used || 0
    }));
    
    downloadCSV(csvData, "invoices_report");
  };

  // 4. Stock Report
  const getStockReportData = () => {
    return products.map(p => {
      const soldQty = allInvoices.reduce((sum, inv) => {
        if (inv.items && Array.isArray(inv.items)) {
          const productItem = inv.items.find((item: any) => item.id === p.id);
          return sum + (productItem?.quantity || 0);
        }
        return sum;
      }, 0);

      const openingStock = p.stock + soldQty;
      const stockValue = p.stock * p.price;

      return {
        ...p,
        openingStock,
        soldQty,
        stockValue
      };
    }).sort((a, b) => a.stock - b.stock);
  };

  const downloadStockPDF = () => {
    const stockData = getStockReportData();
    
    if (stockData.length === 0) {
      alert("No stock data to download");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Stock Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatISTForReports(new Date())}`, 14, 28);

    const tableData = stockData.map(p => [
      p.name,
      p.openingStock.toString(),
      p.soldQty.toString(),
      p.stock.toString(),
      `Rs.${p.stockValue.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Product", "Opening Stock", "Sold", "Current Stock", "Stock Value"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [168, 85, 247] },
    });

    doc.save(`stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadStockCSV = () => {
    const stockData = getStockReportData();
    
    const csvData = stockData.map(p => ({
      "Product Name": p.name,
      "Opening Stock": p.openingStock,
      "Sold Quantity": p.soldQty,
      "Current Stock": p.stock,
      "Stock Value": `₹${p.stockValue.toFixed(2)}`
    }));
    
    downloadCSV(csvData, "stock_report");
  };

  // 5. Profit Analytics Report
  const getProfitReportData = async () => {
    const { startDate, endDate } = getDateRange(profitTimeFilter);
    const invoices = await getInvoicesByDateRange(startDate, endDate);
    
    let totalRevenue = 0;
    let totalCost = 0;
    const categoryStats = new Map<string, { revenue: number; cost: number }>();

    invoices.forEach(invoice => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach((item: any) => {
          const product = products.find(p => p.id === item.id);
          if (product) {
            const itemRevenue = item.price * item.quantity;
            const itemCost = (product.cost_price || product.price * 0.7) * item.quantity;
            
            totalRevenue += itemRevenue;
            totalCost += itemCost;

            const category = product.category || "Uncategorized";
            const existing = categoryStats.get(category) || { revenue: 0, cost: 0 };
            categoryStats.set(category, {
              revenue: existing.revenue + itemRevenue,
              cost: existing.cost + itemCost,
            });
          }
        });
      }
    });

    const netProfit = totalRevenue - totalCost;
    const profitPercentage = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    const categories = Array.from(categoryStats.entries()).map(([name, stats]) => ({
      name,
      profit: stats.revenue - stats.cost,
      percentage: stats.cost > 0 ? ((stats.revenue - stats.cost) / stats.cost) * 100 : 0
    }));

    return { totalRevenue, totalCost, netProfit, profitPercentage, categories };
  };

  const downloadProfitPDF = async () => {
    const profitData = await getProfitReportData();
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Profit Analytics Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${profitTimeFilter.toUpperCase()}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    doc.setFontSize(12);
    doc.text(`Total Revenue: Rs.${profitData.totalRevenue.toFixed(2)}`, 14, 45);
    doc.text(`Total Cost: Rs.${profitData.totalCost.toFixed(2)}`, 14, 52);
    doc.text(`Net Profit: Rs.${profitData.netProfit.toFixed(2)}`, 14, 59);
    doc.text(`Profit %: ${profitData.profitPercentage.toFixed(2)}%`, 14, 66);

    const tableData = profitData.categories.map(cat => [
      cat.name,
      `Rs.${cat.profit.toFixed(2)}`,
      `${cat.percentage.toFixed(2)}%`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [["Category", "Profit", "Profit %"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    doc.save(`profit_report_${profitTimeFilter}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadProfitCSV = async () => {
    const profitData = await getProfitReportData();
    
    const csvData = [
      {
        "Report Type": "Summary",
        "Category": "Overall",
        "Total Revenue": `₹${profitData.totalRevenue.toFixed(2)}`,
        "Total Cost": `₹${profitData.totalCost.toFixed(2)}`,
        "Net Profit": `₹${profitData.netProfit.toFixed(2)}`,
        "Profit Percentage": `${profitData.profitPercentage.toFixed(2)}%`
      },
      ...profitData.categories.map(cat => ({
        "Report Type": "Category Breakdown",
        "Category": cat.name,
        "Profit": `₹${cat.profit.toFixed(2)}`,
        "Profit Percentage": `${cat.percentage.toFixed(2)}%`
      }))
    ];
    
    downloadCSV(csvData, `profit_report_${profitTimeFilter}`);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">Generate and download business reports from real data</p>
          </div>
        </motion.div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Current Products Report */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Package className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <CardTitle>Current Products Report</CardTitle>
                      <CardDescription>All products with stock and pricing</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Total Products: <span className="font-semibold text-foreground">{products.length}</span></p>
                  <p>Total Stock Value: <span className="font-semibold text-foreground">₹{products.reduce((sum, p) => sum + (p.stock * p.price), 0).toFixed(2)}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadProductsPDF} className="flex-1" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={downloadProductsCSV} className="flex-1" variant="outline">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 2. Expiry History Report */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <CalendarX className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <CardTitle>Expiry History Report</CardTitle>
                      <CardDescription>Track product expiry dates</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={expiryFilter} onValueChange={(value) => setExpiryFilter(value as ExpiryFilter)}>
                  <SelectTrigger className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="expiring_7">Expiring in 7 days</SelectItem>
                    <SelectItem value="expiring_30">Expiring in 30 days</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  <p>Filtered Products: <span className="font-semibold text-foreground">{getFilteredExpiryProducts().length}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadExpiryPDF} className="flex-1" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={downloadExpiryCSV} className="flex-1" variant="outline">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 3. Invoice History Report */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle>Invoice History Report</CardTitle>
                      <CardDescription>All transaction records</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Total Invoices: <span className="font-semibold text-foreground">{allInvoices.length}</span></p>
                  <p>Total Revenue: <span className="font-semibold text-foreground">₹{allInvoices.reduce((sum, inv) => sum + (inv.final_amount || inv.total_amount || 0), 0).toFixed(2)}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadInvoicesPDF} className="flex-1" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={downloadInvoicesCSV} className="flex-1" variant="outline">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 4. Stock Report */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Stock Report</CardTitle>
                      <CardDescription>Opening, sold, and current stock</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Total Products: <span className="font-semibold text-foreground">{products.length}</span></p>
                  <p>Low Stock Items: <span className="font-semibold text-foreground">{products.filter(p => p.stock <= 20).length}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadStockPDF} className="flex-1" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={downloadStockCSV} className="flex-1" variant="outline">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 5. Profit Analytics Report */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
            <Card className="glass-card border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <CardTitle>Profit Analytics Report</CardTitle>
                      <CardDescription>Revenue, costs, and profit breakdown</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={profitTimeFilter} onValueChange={(value) => setProfitTimeFilter(value as TimeFilter)}>
                  <SelectTrigger className="glass-input max-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="total">Total (All Time)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={downloadProfitPDF} className="flex-1" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button onClick={downloadProfitCSV} className="flex-1" variant="outline">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Helper Text */}
        <div className="text-center text-sm text-muted-foreground pb-6">
          All reports are generated from real-time data stored in Supabase
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
