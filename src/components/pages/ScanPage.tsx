import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockProducts } from '@/data/mockProducts';
import { Product, CartItem } from '@/types';
import { ShoppingCart, Search, Filter, Info, Camera, Scan, Zap, Star } from 'lucide-react';

interface ScanPageProps {
  onAddToCart: (product: Product, quantity: number) => void;
  cartItems: CartItem[];
  onNavigate: (tab: string) => void;
  onViewProduct?: (product: Product) => void;
}

const ScanPage = ({ onAddToCart, cartItems, onNavigate, onViewProduct }: ScanPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [scanMode, setScanMode] = useState<'browse' | 'camera' | 'barcode'>('browse');
  const [recentlyScanned, setRecentlyScanned] = useState<string[]>([]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'fruits', label: 'Fruits' },
    { id: 'bakery', label: 'Bakery' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'beverages', label: 'Beverages' },
    { id: 'meat', label: 'Meat' }
  ];

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getQuantity = (productId: string) => quantities[productId] || 1;

  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [productId]: Math.max(1, quantity) }));
  };

  const handleAddToCart = (product: Product) => {
    onAddToCart(product, getQuantity(product.id));
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
    // Add visual feedback for Caper-style experience
    setRecentlyScanned(prev => [product.id, ...prev.slice(0, 4)]);
  };

  const isInCart = (productId: string) => {
    return cartItems.some(item => item.product.id === productId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Caper-style Header with Smart Features */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary">Smart Shopping</h1>
                <p className="text-muted-foreground">AI-powered product discovery</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-card rounded-lg p-4 border shadow-sm">
              <p className="text-sm text-muted-foreground">Cart Value</p>
              <p className="text-2xl font-bold text-primary">
                ${cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{cartItems.length} items</p>
            </div>
          </div>
        </div>

        {/* Scan Mode Toggle - Caper Style */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex">
              <Button
                variant={scanMode === 'browse' ? 'default' : 'ghost'}
                className="flex-1 rounded-none border-0 h-16"
                onClick={() => setScanMode('browse')}
              >
                <Search className="h-5 w-5 mr-2" />
                Browse Products
              </Button>
              <Button
                variant={scanMode === 'camera' ? 'default' : 'ghost'}
                className="flex-1 rounded-none border-0 h-16"
                onClick={() => setScanMode('camera')}
              >
                <Camera className="h-5 w-5 mr-2" />
                AI Camera Scan
              </Button>
              <Button
                variant={scanMode === 'barcode' ? 'default' : 'ghost'}
                className="flex-1 rounded-none border-0 h-16"
                onClick={() => setScanMode('barcode')}
              >
                <Scan className="h-5 w-5 mr-2" />
                Barcode Scanner
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conditional Content Based on Scan Mode */}
        {scanMode === 'browse' && (
          <>
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search products or scan barcode..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 text-lg"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="min-h-touch"
                      >
                        {category.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recently Scanned Items */}
            {recentlyScanned.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Recently Added
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 overflow-x-auto">
                    {recentlyScanned.map((productId) => {
                      const product = mockProducts.find(p => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={productId} className="flex-shrink-0 w-32 text-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-md mx-auto mb-2 border-2 border-primary/20"
                          />
                          <p className="text-xs font-medium truncate">{product.name}</p>
                          <p className="text-xs text-primary">${product.price.toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {scanMode === 'camera' && (
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">AI-Powered Camera Scanning</h3>
              <p className="text-muted-foreground mb-4">
                Point your camera at products to automatically detect and add them to your cart
              </p>
              <Button size="lg" className="mb-4">
                Start Camera Scanning
              </Button>
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  📱 Camera scanning uses advanced AI to recognize products without barcodes
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {scanMode === 'barcode' && (
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <Scan className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Barcode Scanner Active</h3>
              <p className="text-muted-foreground mb-4">
                Scan product barcodes to instantly add items to your cart
              </p>
              <div className="bg-primary/10 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Scanner Ready</span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  📊 Position barcode within the scanning area for quick detection
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid - Only show in browse mode */}
        {scanMode === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isRecent = recentlyScanned.includes(product.id);
              return (
                <Card 
                  key={product.id} 
                  className={`shadow-card hover:shadow-lg transition-all duration-300 ${
                    isRecent ? 'ring-2 ring-primary/50 bg-primary/5' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-40 object-cover rounded-md"
                      />
                      {isRecent && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          Recently Added
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="text-sm">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.weight}g
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(product.id, getQuantity(product.id) - 1)}
                        className="h-10 w-10 p-0 min-h-touch"
                      >
                        -
                      </Button>
                      <span className="w-12 text-center font-medium text-lg">{getQuantity(product.id)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(product.id, getQuantity(product.id) + 1)}
                        className="h-10 w-10 p-0 min-h-touch"
                      >
                        +
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full min-h-touch text-lg"
                        onClick={() => handleAddToCart(product)}
                        disabled={isInCart(product.id)}
                        size="lg"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {isInCart(product.id) ? 'Added to Cart' : 'Add to Cart'}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full min-h-touch" 
                        size="lg"
                        onClick={() => {
                          if (onViewProduct) {
                            onViewProduct(product);
                            onNavigate('product-detail');
                          }
                        }}
                      >
                        <Info className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {scanMode === 'browse' && filteredProducts.length === 0 && (
          <Card className="mt-8">
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScanPage;