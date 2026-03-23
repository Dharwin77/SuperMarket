import { useProducts, useAddProduct, useDeleteProduct, useUpdateProduct } from "@/hooks/useSupabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Package, Barcode, DollarSign, TrendingUp, Zap, ArrowLeft, Coffee, Cookie, Milk, Apple, Wheat, Candy, Minus, Search, ShoppingBag, Calendar, Edit } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export default function ProductsExample() {
  const navigate = useNavigate();
  const { data: products, isLoading, error } = useProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const importedDateRef = useRef<HTMLInputElement>(null);
  const expiryDateRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    cost_price: "",
    selling_price: "",
    barcode: "",
    stock: "",
    imported_date: "",
    expiry_date: "",
    image_url: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
      barcode: formData.barcode,
      stock: parseInt(formData.stock),
      imported_date: formData.imported_date,
      expiry_date: formData.expiry_date,
      image_url: formData.image_url || null,
    };

    if (isEditMode && editingProductId) {
      updateProduct.mutate(
        { id: editingProductId, product: productData },
        {
          onSuccess: () => {
            setOpen(false);
            setIsEditMode(false);
            setEditingProductId(null);
            setFormData({
              name: "",
              category: "",
              price: "",
              cost_price: "",
              selling_price: "",
              barcode: "",
              stock: "",
              imported_date: "",
              expiry_date: "",
              image_url: "",
            });
          },
        }
      );
    } else {
      addProduct.mutate(
        productData,
        {
          onSuccess: () => {
            setOpen(false);
            setFormData({
              name: "",
              category: "",
              price: "",
              cost_price: "",
              selling_price: "",
              barcode: "",
              stock: "",
              imported_date: "",
              expiry_date: "",
              image_url: "",
            });
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    console.log("Delete clicked for ID:", id);
    if (confirm("Are you sure you want to delete this product?")) {
      console.log("Deleting product...");
      deleteProduct.mutate(id);
    }
  };

  const handleEdit = (product: any) => {
    setIsEditMode(true);
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      cost_price: product.cost_price?.toString() || "",
      selling_price: product.selling_price?.toString() || "",
      barcode: product.barcode,
      stock: product.stock.toString(),
      imported_date: product.imported_date || "",
      expiry_date: product.expiry_date || "",
      image_url: product.image_url || "",
    });
    setDetailsOpen(false);
    setOpen(true);
  };

  // Cart functions
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: product.id!,
        name: product.name,
        price: product.price,
        quantity: 1,
        category: product.category,
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products?.map(p => p.category) || []);
    return ["All", ...Array.from(uniqueCategories)];
  }, [products]);

  // Category icons mapping
  const categoryIcons: Record<string, any> = {
    "All": Package,
    "Beverages": Coffee,
    "Biscuits": Cookie,
    "Dairy": Milk,
    "Fruits": Apple,
    "Snacks": Candy,
    "Groceries": Wheat,
  };

  // Filter products by selected category and search
  const filteredProducts = useMemo(() => {
    let filtered = products || [];
    
    if (selectedCategory !== "All") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [products, selectedCategory, searchTerm]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">Loading...</div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="glass-panel border-red-500/50 max-w-lg">
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <p className="text-xl font-semibold text-red-500">Error loading products</p>
              <p className="text-sm mt-2 text-muted-foreground">{error.message}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen p-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-8 rounded-2xl border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-4xl font-bold text-foreground">Products</h1>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <Badge variant="outline" className="border-primary/50">
                {products?.length || 0} Products
              </Badge>
            </div>
          </div>
          
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setIsEditMode(false);
              setEditingProductId(null);
              setFormData({
                name: "",
                category: "",
                price: "",
                cost_price: "",
                selling_price: "",
                barcode: "",
                stock: "",
                imported_date: "",
                expiry_date: "",
                image_url: "",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  setIsEditMode(false);
                  setEditingProductId(null);
                }}
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {isEditMode ? "Edit Product" : "Add New Product"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {isEditMode ? "Update the product details below." : "Fill in the product details below to add it to your inventory."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">
                      Product Name *
                    </Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background border-border"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-foreground">
                      Category *
                    </Label>
                    <Input
                      id="category"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="bg-background border-border"
                      placeholder="e.g., Electronics, Beverages"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-foreground">
                      Price (₹) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="bg-background border-border"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode" className="text-foreground">
                      Barcode *
                    </Label>
                    <Input
                      id="barcode"
                      required
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="bg-background border-border"
                      placeholder="Enter barcode"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost_price" className="text-foreground">
                      Cost Price (₹)
                    </Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      className="bg-background border-border"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selling_price" className="text-foreground">
                      Selling Price (₹)
                    </Label>
                    <Input
                      id="selling_price"
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      className="bg-background border-border"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="imported_date" className="text-foreground">
                      Imported Date *
                    </Label>
                    <div className="relative">
                      <Input
                        ref={importedDateRef}
                        id="imported_date"
                        type="date"
                        required
                        value={formData.imported_date}
                        onChange={(e) => setFormData({ ...formData, imported_date: e.target.value })}
                        className="bg-background border-border pr-10"
                      />
                      <Calendar 
                        onClick={() => importedDateRef.current?.showPicker?.()} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date" className="text-foreground">
                      Expiry Date *
                    </Label>
                    <div className="relative">
                      <Input
                        ref={expiryDateRef}
                        id="expiry_date"
                        type="date"
                        required
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        className="bg-background border-border pr-10"
                      />
                      <Calendar 
                        onClick={() => expiryDateRef.current?.showPicker?.()} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" 
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-foreground">
                    Quantity *
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="bg-background border-border"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url" className="text-foreground">
                    Product Image URL
                  </Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="bg-background border-border"
                    placeholder="https://example.com/product-image.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste an image URL or use services like imgur.com to host images
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="border-border hover:bg-accent"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addProduct.isPending || updateProduct.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isEditMode 
                      ? (updateProduct.isPending ? "Updating..." : "Update Product")
                      : (addProduct.isPending ? "Adding..." : "Confirm & Add Product")
                    }
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content - Billing Layout */}
      <div className="flex gap-6">
        {/* Left Side - Products Grid */}
        <div className="flex-1 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 glass-input text-lg"
            />
          </div>

          {/* Categories Filter */}
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = categoryIcons[category] || Package;
              const count = category === "All" ? products?.length || 0 : products?.filter(p => p.category === category).length || 0;
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    selectedCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category}</span>
                  <Badge 
                    variant="outline" 
                    className={selectedCategory === category ? "border-white/40 text-white" : "border-border"}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <Card className="glass-panel border-border">
              <CardContent className="p-12 text-center">
                <Package className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
                <h3 className="text-2xl font-semibold mb-2">
                  {searchTerm ? "No products found" : selectedCategory === "All" ? "No products yet!" : `No products in ${selectedCategory}`}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? "Try a different search term" : "Start by adding a product"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="glass-panel border-border overflow-hidden group hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedProduct(product);
                    setDetailsOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<svg class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>';
                          }}
                        />
                      ) : (
                        <Package className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    
                    <div className="text-xl font-bold text-foreground mb-2">
                      ₹{product.price.toFixed(2)}
                    </div>
                    
                    {product.cost_price && (
                      <div className="text-xs text-muted-foreground mb-1">
                        Cost: ₹{product.cost_price.toFixed(2)}
                      </div>
                    )}
                    
                    <Badge variant="secondary" className="text-xs mb-2">
                      {product.category}
                    </Badge>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Stock: {product.stock}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id!);
                        }}
                        className="h-6 w-6 hover:bg-red-500/10 hover:text-red-500 -mr-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-[360px] max-h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                Product Details
              </DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-3 mt-2">
                {/* Product Image */}
                <div className="h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img 
                      src={selectedProduct.image_url} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-primary" />
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Product Name</Label>
                    <p className="text-base font-semibold text-foreground">{selectedProduct.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <Badge variant="secondary" className="mt-1">{selectedProduct.category}</Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <p className="text-xl font-bold text-foreground">₹{selectedProduct.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Barcode</Label>
                      <p className="text-sm font-mono text-foreground">{selectedProduct.barcode}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Stock Quantity</Label>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {selectedProduct.stock}
                      </p>
                    </div>
                  </div>

                  {(selectedProduct.cost_price || selectedProduct.selling_price) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProduct.cost_price && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Cost Price</Label>
                          <p className="text-sm font-semibold text-green-400">
                            ₹{selectedProduct.cost_price.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {selectedProduct.selling_price && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Selling Price</Label>
                          <p className="text-sm font-semibold text-primary">
                            ₹{selectedProduct.selling_price.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedProduct.imported_date || selectedProduct.expiry_date) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProduct.imported_date && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Imported Date</Label>
                          <p className="text-sm text-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(selectedProduct.imported_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedProduct.expiry_date && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                          <p className="text-sm text-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(selectedProduct.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3">
                  <Button
                    onClick={() => handleEdit(selectedProduct)}
                    variant="outline"
                    className="border-border hover:bg-accent"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDetailsOpen(false)}
                    className="border-border hover:bg-accent"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Right Side - Cart Sidebar */}
        <div className="w-96">
          <Card className="glass-panel border-border sticky top-8">
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">
                    Selected Items
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No items selected</p>
                  <p className="text-sm text-muted-foreground mt-2">Click on products to add them</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-muted rounded-xl p-4 border border-border">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{item.name}</h4>
                            <p className="text-xs text-primary mt-1">₹{item.price.toFixed(2)} each</p>
                            <Badge variant="outline" className="text-xs mt-1 border-border">
                              {item.category}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-8 w-8 border-border hover:bg-accent"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-semibold text-lg">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-8 w-8 border-border hover:bg-accent"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Subtotal</p>
                            <p className="text-lg font-bold text-primary">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart Summary */}
                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="flex justify-between text-lg">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">₹{cartTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>GST (18%)</span>
                      <span>₹{(cartTotal * 0.18).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-green-400">
                      <span>Total Items</span>
                      <span>+{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                    </div>
                    
                    <div className="flex justify-between text-2xl font-bold pt-3 border-t border-border">
                      <span>Total</span>
                      <span className="text-foreground">₹{(cartTotal * 1.18).toFixed(2)}</span>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1 border-border hover:bg-accent"
                        onClick={() => setCart([])}
                      >
                        Clear All
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90"
                        disabled={cart.length === 0}
                      >
                        Checkout
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </MainLayout>
  );
}
