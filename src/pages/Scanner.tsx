import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { ScannerFrame } from "@/components/scanner/ScannerFrame";
import { ProductCube } from "@/components/scanner/ProductCube";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScanLine, Camera, Zap, Upload, Trash2, Package, TrendingUp, Sparkles, Calendar, ShoppingBag, Text } from "lucide-react";
import { useProducts } from "@/hooks/useSupabase";
import { processImageWithOCR, initializeOCR } from "@/services/ocr";
const mockProduct = {
  name: "Lays Classic Chips",
  mrp: 20,
  onlinePrice: 18,
  stock: 45,
  shelf: "A3-Snacks",
  profitMargin: 32,
};

const Scanner = () => {
  const { data: products } = useProducts();
  const [isScanning, setIsScanning] = useState(false);
  const [isOCRParsing, setIsOCRParsing] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<typeof mockProduct | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [visionReady, setVisionReady] = useState(false);
  const [ocrReady, setOcrReady] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize OCR service only
    initializeOCR().then(setOcrReady);
  }, []);
  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedProduct(mockProduct);
    }, 2000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setIsScanning(true);
    setIsOCRParsing(true);
    setAnalysisResult(null);
    setOcrResult(null);

    try {
      // Use OCR + Groq approach only
      console.log('🔍 Processing with OCR + Groq AI...');
      const ocrResult = await processImageWithOCR(file);
      setOcrResult(ocrResult);
      
      if (ocrResult.success && ocrResult.productInfo && ocrResult.productInfo.productName !== "Unknown Product") {
        console.log('✅ OCR + Groq successful');
        // Find matching product in our inventory
        const matchedProduct = findMatchingProduct(ocrResult.productInfo, products || []);
        
        if (matchedProduct) {
          setScannedProduct({
            name: matchedProduct.name,
            mrp: matchedProduct.price,
            onlinePrice: matchedProduct.price * 0.9,
            stock: matchedProduct.stock,
            shelf: matchedProduct.shelf || 'A3',
            profitMargin: matchedProduct.profitMargin || 30,
          });
        } else {
          // Use OCR identified product info
          setScannedProduct({
            name: `${ocrResult.productInfo.brand} ${ocrResult.productInfo.productName}`,
            mrp: 0, // Will need to be set manually or looked up
            onlinePrice: 0,
            stock: 0,
            shelf: 'Unknown',
            profitMargin: 0,
          });
        }
      } else {
        console.log('⚠️ OCR + Groq did not find a product');
        // Show a message indicating no product was found
        setScannedProduct({
          name: "Product Not Identified",
          mrp: 0,
          onlinePrice: 0,
          stock: 0,
          shelf: 'Unknown',
          profitMargin: 0,
        });
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      // Show error state
      setScannedProduct({
        name: "Processing Error",
        mrp: 0,
        onlinePrice: 0,
        stock: 0,
        shelf: 'Unknown',
        profitMargin: 0,
      });
    } finally {
      setIsScanning(false);
      setIsOCRParsing(false);
    }
  };

  /**
   * Find matching product in inventory based on OCR results
   */
  const findMatchingProduct = (ocrProduct: any, products: any[]) => {
    if (!products || products.length === 0) return null;
    
    const productName = ocrProduct.productName.toLowerCase();
    const brand = ocrProduct.brand.toLowerCase();
    const category = ocrProduct.category.toLowerCase();
    
    // Try to find exact match first
    for (const product of products) {
      const productNameMatch = product.name.toLowerCase().includes(productName) || 
                              productName.includes(product.name.toLowerCase());
      const brandMatch = product.brand && (product.brand.toLowerCase().includes(brand) || 
                                          brand.includes(product.brand.toLowerCase()));
      const categoryMatch = product.category && product.category.toLowerCase().includes(category);
      
      if ((productNameMatch && brandMatch) || (productNameMatch && categoryMatch)) {
        return product;
      }
    }
    
    // Try partial matches
    for (const product of products) {
      const productNameMatch = product.name.toLowerCase().includes(productName) || 
                              productName.includes(product.name.toLowerCase());
      
      if (productNameMatch) {
        return product;
      }
    }
    
    return null;
  };
  const openFileDialog = () => {
    fileInputRef.current?.click();
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
              <ScanLine className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                Product Scanner
                {ocrReady && <Text className="h-5 w-5 text-blue-400" />}
              </h1>
              <p className="text-muted-foreground">
                {ocrReady
                  ? 'Upload product images for OCR + AI recognition' 
                  : 'Scan products with intelligent recognition'
                }
              </p>
              {ocrReady && (
                <Badge variant="secondary" className="mt-2">
                  <Text className="h-3 w-3 mr-1" />
                  OCR Ready
                </Badge>
              )}
            </div>          </div>          <Button variant="glow" onClick={handleScan} disabled={isScanning}>
            <Camera className="h-4 w-4 mr-2" />
            {isScanning ? "Scanning..." : "Start Scan"}
          </Button>
        </motion.div>

        {/* Scanner Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Scanner Frame */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center"
          >
            <ScannerFrame isScanning={isScanning} uploadedImage={uploadedImage} />

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* OCR Processing Indicator */}
            {isOCRParsing && (
              <div className="mt-4 glass-card p-4 border border-blue-500/30 w-full max-w-md">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-sm text-blue-300">Processing with OCR + Groq AI...</span>
                </div>
                <div className="mt-2 w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-1 gap-4 w-full max-w-md">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={openFileDialog}
                disabled={isScanning}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image/Video
              </Button>
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center"
          >
            {scannedProduct ? (
              <ProductCube product={scannedProduct} />
            ) : (
              <div className="glass-card p-12 border border-white/10 text-center w-full max-w-md">
                <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
                  <ScanLine className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Product Scanned</h3>
                <p className="text-muted-foreground">
                  Point your camera at a product to see its details in the 3D cube view
                </p>
              </div>
            )}


          </motion.div>
        </div>

        {/* OCR Results & Analysis Results */}
        <AnimatePresence>
          {ocrResult && ocrResult.success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* OCR Text Extraction */}
              <Card className="glass-panel border-blue-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Text className="h-5 w-5 text-blue-500" />
                    OCR Text Extraction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="glass-card p-4 border border-white/10">
                    <p className="text-sm text-muted-foreground mb-2">Extracted Text</p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {ocrResult.ocrText || 'No text extracted'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* OCR Product Identification */}
              <Card className="glass-panel border-green-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-500" />
                    OCR + AI Product Identification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card p-4 border border-white/10">
                      <p className="text-sm text-muted-foreground mb-1">Product Name</p>
                      <p className="text-lg font-semibold text-foreground">{ocrResult.productInfo.productName}</p>
                    </div>
                    <div className="glass-card p-4 border border-white/10">
                      <p className="text-sm text-muted-foreground mb-1">Brand</p>
                      <p className="text-lg font-semibold text-foreground">{ocrResult.productInfo.brand}</p>
                    </div>
                    <div className="glass-card p-4 border border-white/10">
                      <p className="text-sm text-muted-foreground mb-1">Category</p>
                      <p className="text-lg font-semibold text-foreground">{ocrResult.productInfo.category}</p>
                    </div>
                  </div>
                  <div className="glass-card p-4 border border-white/10">
                    <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">{ocrResult.productInfo.confidence}%</p>
                      <Badge variant={ocrResult.productInfo.confidence > 80 ? "default" : "secondary"}>
                        {ocrResult.productInfo.confidence > 80 ? 'High' : 'Medium'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* Analysis Summary */}
              <Card className="glass-panel border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card p-4 border border-white/10">
                      <p className="text-sm text-muted-foreground mb-1">Detected Product</p>
                      <p className="text-lg font-semibold text-foreground">{analysisResult.detectedProduct}</p>
                    </div>
                    <div className="glass-card p-4 border border-white/10">
                      <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-foreground">{analysisResult.confidence}%</p>
                        <Badge variant={analysisResult.confidence > 80 ? "default" : "secondary"}>
                          {analysisResult.confidence > 80 ? 'High' : 'Medium'}
                        </Badge>
                      </div>
                    </div>
                    <div className="glass-card p-4 border border-white/10">
                      <p className="text-sm text-muted-foreground mb-1">Matches Found</p>
                      <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-500" />
                        {analysisResult.relatedProducts.length} Products
                      </p>
                    </div>
                  </div>
                  <div className="glass-card p-4 border border-white/10">
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-sm text-foreground leading-relaxed">{analysisResult.description}</p>
                  </div>
                </CardContent>
              </Card>              {/* Related Products */}
              {analysisResult.relatedProducts.length > 0 && (
                <Card className="glass-panel border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-cyan-500" />
                      Related Products in Store
                      <Badge variant="outline" className="ml-auto">
                        {analysisResult.relatedProducts.length} items
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analysisResult.relatedProducts.map((product: any, index: number) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="glass-card p-4 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group"
                          onClick={() => {
                            setSelectedProduct(product);
                            setDetailsOpen(true);
                          }}
                        >
                          {/* Product Image */}
                          <div className="aspect-square bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<svg class="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>';
                                  }
                                }}
                              />
                            ) : (
                              <Package className="h-8 w-8 text-cyan-400" />
                            )}
                          </div>

                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground group-hover:text-cyan-400 transition-colors">
                                {product.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                            </div>
                            {product.relevanceScore && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {Math.min(100, Math.round(product.relevanceScore))}%
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Price:</span>
                              <span className="text-sm font-semibold text-foreground">₹{product.price?.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Stock:</span>
                              <Badge variant={product.stock > product.min_stock ? "default" : "destructive"}>
                                {product.stock} units
                              </Badge>
                            </div>
                          </div>

                          <Button 
                            variant="outline" 
                            className="w-full mt-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                              setDetailsOpen(true);
                            }}
                          >
                            View Details
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-[400px] bg-[#0A0F1E] border-cyan-500/30">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Product Details
              </DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-3 mt-3">
                {/* Product Image */}
                <div className="aspect-square bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img 
                      src={selectedProduct.image_url} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-24 w-24 text-cyan-400" />
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Product Name</Label>
                    <p className="text-lg font-semibold text-cyan-300">{selectedProduct.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <Badge variant="secondary" className="mt-1">{selectedProduct.category}</Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <p className="text-2xl font-bold gradient-text">₹{selectedProduct.price?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Barcode</Label>
                      <p className="text-sm font-mono text-cyan-300">{selectedProduct.barcode}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Stock Quantity</Label>
                      <p className="text-sm font-semibold text-cyan-300 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {selectedProduct.stock}
                      </p>
                    </div>
                  </div>

                  {(selectedProduct.imported_date || selectedProduct.expiry_date) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProduct.imported_date && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Imported Date</Label>
                          <p className="text-sm text-cyan-300 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(selectedProduct.imported_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedProduct.expiry_date && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                          <p className="text-sm text-cyan-300 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(selectedProduct.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProduct.relevanceScore && (
                    <div>
                      <Label className="text-xs text-muted-foreground">AI Match Confidence</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                            style={{ width: `${Math.min(100, Math.round(selectedProduct.relevanceScore))}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-cyan-300">
                          {Math.min(100, Math.round(selectedProduct.relevanceScore))}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setScannedProduct({
                        name: selectedProduct.name,
                        mrp: selectedProduct.price,
                        onlinePrice: selectedProduct.price * 0.9,
                        stock: selectedProduct.stock,
                        shelf: 'A3',
                        profitMargin: 30,
                      });
                      setDetailsOpen(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Add to Bill
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDetailsOpen(false)}
                    className="border-cyan-500/30 hover:bg-cyan-500/10"
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
};

export default Scanner;
