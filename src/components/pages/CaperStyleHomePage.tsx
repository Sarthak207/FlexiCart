import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CartItem } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';
import { 
  ShoppingCart, 
  Scan, 
  Camera, 
  MapPin, 
  User, 
  Settings,
  Star,
  Zap,
  Target,
  Gift,
  TrendingUp,
  Clock
} from 'lucide-react';

interface CaperStyleHomePageProps {
  cartItems: CartItem[];
  onAddToCart: (productId: string) => void;
  onNavigate: (tab: string) => void;
  onViewProduct?: (product: any) => void;
}

const CaperStyleHomePage = ({ cartItems, onAddToCart, onNavigate, onViewProduct }: CaperStyleHomePageProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { products } = useProducts();
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Personalized recommendations from actual products
  const recommendationIds = ['1', '3', '4'];
  const recommendations = recommendationIds.map(id => {
    const product = products.find(p => p.id === id);
    if (!product) return null;
    
    const discounts = ['20% off', 'Buy 2 Get 1', '15% off'];
    const discountIndex = recommendationIds.indexOf(id);
    
    return {
      ...product,
      discount: discounts[discountIndex] || '10% off'
    };
  }).filter(Boolean);

  // Store offers (simulated)
  const offers = [
    { title: 'Fresh Fruits Sale', description: '25% off on all fruits & vegetables', color: 'bg-green-500' },
    { title: 'Dairy Dhamaka', description: 'Buy 2 dairy products, get 20% off', color: 'bg-blue-500' },
    { title: 'Weekend Special', description: 'Complete meal combos starting at ₹150', color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header with Time and User Info */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}!</h1>
            <p className="text-muted-foreground">Welcome to your smart shopping experience</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{currentTime.toLocaleDateString()}</p>
              <p className="text-sm font-medium">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-12 w-12">
              <User className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Current Cart Status - Prominent Display */}
        {cartCount > 0 && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Your Cart</h3>
                    <p className="text-muted-foreground">{cartCount} items • {formatCurrency(cartTotal)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => onNavigate('cart')} variant="outline" size="lg">
                    Review Cart
                  </Button>
                  <Button onClick={() => onNavigate('checkout')} size="lg">
                    Checkout Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Action Buttons - Caper Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800"
            onClick={() => onNavigate('scan')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Scan Products</h3>
              <p className="text-sm text-muted-foreground">Barcode & AI scanning</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800"
            onClick={() => onNavigate('scan')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">AI Camera</h3>
              <p className="text-sm text-muted-foreground">Smart product detection</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800"
            onClick={() => onNavigate('store-map')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Store Map</h3>
              <p className="text-sm text-muted-foreground">Find products easily</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800"
            onClick={() => onNavigate('weight')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Weight Check</h3>
              <p className="text-sm text-muted-foreground">Verify cart contents</p>
            </CardContent>
          </Card>
        </div>

        {/* Personalized Offers */}
        <div className="grid md:grid-cols-3 gap-4">
          {offers.map((offer, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className={`${offer.color} h-24 flex items-center justify-center`}>
                  <Gift className="h-12 w-12 text-white" />
                </div>
                <div className="p-4">
                  <h4 className="font-semibold mb-1">{offer.title}</h4>
                  <p className="text-sm text-muted-foreground">{offer.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommended Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Recommended for You
            </CardTitle>
            <CardDescription>Based on your shopping history and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="relative mb-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-24 object-cover rounded"
                    />
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      {product.discount}
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-1">{product.name}</h4>
                  <p className="text-primary font-bold mb-3">{formatCurrency(product.price)}</p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => onAddToCart(product.id)} 
                      className="w-full"
                      size="sm"
                    >
                      Add to Cart
                    </Button>
                    {onViewProduct && (
                      <Button 
                        variant="outline"
                        onClick={() => onViewProduct(product)} 
                        className="w-full"
                        size="sm"
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Smart Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Smart Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Price Tracking</p>
                  <p className="text-sm text-muted-foreground">Get alerts on price drops</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Shopping Lists</p>
                  <p className="text-sm text-muted-foreground">Sync with your mobile app</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shopping Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items in cart:</span>
                  <span className="font-medium">{cartCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total value:</span>
                  <span className="font-medium">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Savings today:</span>
                  <span className="font-medium text-green-600">₹25</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default CaperStyleHomePage;