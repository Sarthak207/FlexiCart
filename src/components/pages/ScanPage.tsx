import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockProducts } from '@/data/mockProducts';
import { Product, CartItem } from '@/types';
import { ShoppingCart, Search, Filter, MapPin } from 'lucide-react';

interface ScanPageProps {
  onAddToCart: (product: Product, quantity: number) => void;
  cartItems: CartItem[];
}

const ScanPage = ({ onAddToCart, cartItems }: ScanPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

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
  };

  const isInCart = (productId: string) => {
    return cartItems.some(item => item.product.id === productId);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Shop Products</h1>
            <p className="text-muted-foreground mt-1">Browse and add items to your cart</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Cart Items</p>
            <p className="text-2xl font-bold text-primary">{cartItems.length}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
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
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-md bg-smartcart-surface"
                />
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
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-medium">{getQuantity(product.id)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(product.id, getQuantity(product.id) + 1)}
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                    disabled={isInCart(product.id)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isInCart(product.id) ? 'In Cart' : 'Add to Cart'}
                  </Button>
                  
                  <Button variant="outline" className="w-full" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Find on Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card className="mt-8">
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScanPage;