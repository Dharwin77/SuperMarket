import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, AlertTriangle, Clock, Package, Trash2, TrendingDown, Search } from "lucide-react";
import { useProducts } from "@/hooks/useSupabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ExpiryHistory() {
  const { data: products } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [daysFilter, setDaysFilter] = useState<string>("10");

  // Calculate expired and expiring soon products
  const { expiredProducts, expiringSoonProducts } = useMemo(() => {
    if (!products) return { expiredProducts: [], expiringSoonProducts: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysValue = parseInt(daysFilter) || 10;
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysValue);

    const expired: any[] = [];
    const expiringSoon: any[] = [];

    products.forEach((product) => {
      if (product.expiry_date) {
        const expiryDate = new Date(product.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);

        if (expiryDate < today) {
          expired.push(product);
        } else if (expiryDate <= targetDate) {
          expiringSoon.push(product);
        }
      }
    });

    return { 
      expiredProducts: expired.sort((a, b) => 
        new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
      ),
      expiringSoonProducts: expiringSoon.sort((a, b) => 
        new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
      )
    };
  }, [products, daysFilter]);

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const ProductCard = ({ product, isExpired }: { product: any; isExpired: boolean }) => {
    const daysUntilExpiry = getDaysUntilExpiry(product.expiry_date);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 border border-white/10 hover:border-red-500/50 transition-all cursor-pointer group"
        onClick={() => {
          setSelectedProduct(product);
          setDetailsOpen(true);
        }}
      >
        {/* Product Image */}
        <div className="aspect-square bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-3 overflow-hidden relative">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-8 w-8 text-red-400" />
          )}
          {isExpired && (
            <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground group-hover:text-red-400 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <div className="flex items-center justify-between text-sm">
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
            <span className="font-bold text-foreground">₹{product.price?.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" />
              Stock: {product.stock}
            </span>
            <span className="text-muted-foreground">
              {product.barcode}
            </span>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expiry:
              </span>
              <span className="text-xs font-semibold">
                {new Date(product.expiry_date).toLocaleDateString()}
              </span>
            </div>
            {isExpired ? (
              <Badge variant="destructive" className="w-full mt-2 text-xs justify-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Expired {Math.abs(daysUntilExpiry)} days ago
              </Badge>
            ) : (
              <Badge 
                variant={daysUntilExpiry <= 3 ? "destructive" : "default"} 
                className="w-full mt-2 text-xs justify-center"
              >
                <Clock className="h-3 w-3 mr-1" />
                {daysUntilExpiry} days left
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Expiry History</h1>
              <p className="text-muted-foreground">
                Monitor expired and expiring products
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex gap-4">
            <Card className="glass-panel border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expired</p>
                    <p className="text-2xl font-bold text-red-500">{expiredProducts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-orange-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Clock className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold text-orange-500">{expiringSoonProducts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-panel border-cyan-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Filter by Days Until Expiry
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={daysFilter}
                      onChange={(e) => setDaysFilter(e.target.value)}
                      placeholder="Enter number of days"
                      className="pl-10 bg-background border-border"
                    />
                  </div>
                </div>
                <div className="pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setDaysFilter("10")}
                    className="border-cyan-500/30 hover:bg-cyan-500/10"
                  >
                    Reset to 10 Days
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Showing products expiring within <span className="text-cyan-400 font-semibold">{daysFilter || "10"}</span> days from today
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expired Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-panel border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Expired Products
                <Badge variant="destructive" className="ml-auto">
                  {expiredProducts.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingDown className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No expired products</p>
                  <p className="text-sm text-muted-foreground mt-2">Great! Your inventory is fresh</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {expiredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} isExpired={true} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expiring Soon Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-panel border-orange-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-400">
                <Clock className="h-5 w-5" />
                Expiring in Next {daysFilter || "10"} Days
                <Badge variant="default" className="ml-auto bg-orange-500">
                  {expiringSoonProducts.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringSoonProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No products expiring soon</p>
                  <p className="text-sm text-muted-foreground mt-2">All products have sufficient shelf life</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {expiringSoonProducts.map((product) => (
                    <ProductCard key={product.id} product={product} isExpired={false} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Product Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-[360px] max-h-[90vh] overflow-y-auto bg-card border-red-300">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Product Details
              </DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-2 mt-2">
                {/* Product Image */}
                <div className="h-48 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg flex items-center justify-center overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img 
                      src={selectedProduct.image_url} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-red-400" />
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Product Name</Label>
                    <p className="text-base font-semibold text-red-300">{selectedProduct.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <Badge variant="secondary" className="mt-1">{selectedProduct.category}</Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <p className="text-xl font-bold gradient-text">₹{selectedProduct.price?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Barcode</Label>
                      <p className="text-sm font-mono text-red-300">{selectedProduct.barcode}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Stock Quantity</Label>
                      <p className="text-sm font-semibold text-red-300 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {selectedProduct.stock}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {selectedProduct.imported_date && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Imported Date</Label>
                        <p className="text-sm text-red-300 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(selectedProduct.imported_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                      <p className="text-sm text-red-300 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedProduct.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <Label className="text-xs text-muted-foreground">Expiry Status</Label>
                    {getDaysUntilExpiry(selectedProduct.expiry_date) < 0 ? (
                      <div className="flex items-center gap-2 mt-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-semibold text-red-400">
                          Expired {Math.abs(getDaysUntilExpiry(selectedProduct.expiry_date))} days ago
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-semibold text-orange-400">
                          Expires in {getDaysUntilExpiry(selectedProduct.expiry_date)} days
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3">
                  <Button
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove from Stock
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDetailsOpen(false)}
                    className="border-red-500/30 hover:bg-red-500/10"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
