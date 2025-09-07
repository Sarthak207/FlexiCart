import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Product, CartItem } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { ShoppingCart, Search, Package, Sparkles, Loader2 } from 'lucide-react';

interface HomePageProps {
  cartItems: CartItem[];
  onAddToCart: (productId: string) => void;
  onNavigate: (tab: string) => void;
}

const HomePage = ({ cartItems, onAddToCart, onNavigate }: HomePageProps) => {
  const [selectedCategory, setSelectedCategory] = useState<Product['category']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { products, loading, error } = useProducts();

  const categories = [
    { id: 'all', name: 'All Items', icon: Package },
    { id: 'fruits', name: 'Fruits', icon: Package },
    { id: 'dairy', name: 'Dairy', icon: Package },
    { id: 'bakery', name: 'Bakery', icon: Package },
    { id: 'beverages', name: 'Beverages', icon: Package },
    { id: 'meat', name: 'Meat', icon: Package },
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="text-center py-16">
          <p className="text-destructive">Error loading products: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            <Sparkles className="inline-block h-12 w-12 mr-4 text-primary" />
            SmartCart
          </h1>
          <p className="text-lg text-muted-foreground">Browse and shop with ease</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10 min-h-touch"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id as Product['category'])}
              className="min-h-touch"
            >
              <category.icon className="h-4 w-4 mr-2" />
              {category.name}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const cartItem = cartItems.find(item => item.product.id === product.id);
            const inCartQuantity = cartItem?.quantity || 0;

            return (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-smartcart-surface to-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <Package className="h-12 w-12 text-muted-foreground hidden" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                      <span className="text-lg font-bold text-primary">${product.price}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="bg-smartcart-surface px-2 py-1 rounded-full capitalize">
                        {product.category}
                      </span>
                      {product.weight && (
                        <span>{product.weight}g</span>
                      )}
                    </div>

                    <Button
                      onClick={() => onAddToCart(product.id)}
                      className="w-full min-h-touch"
                      size="sm"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {inCartQuantity > 0 ? `Add More (${inCartQuantity})` : 'Add to Cart'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;