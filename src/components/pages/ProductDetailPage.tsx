import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Product, CartItem } from '@/types';
import { ArrowLeft, ShoppingCart, Heart, Share2, Info, Leaf, Shield } from 'lucide-react';
import { useState } from 'react';

interface ProductDetailPageProps {
  product: Product;
  cartItems: CartItem[];
  onAddToCart: (product: Product, quantity: number) => void;
  onNavigate: (tab: string) => void;
}

const ProductDetailPage = ({ product, cartItems, onAddToCart, onNavigate }: ProductDetailPageProps) => {
  const [quantity, setQuantity] = useState(1);
  
  const isInCart = cartItems.some(item => item.product.id === product.id);

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('scan')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            </CardContent>
          </Card>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{product.category}</Badge>
                {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
              </div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-2xl font-bold text-primary mb-4">${product.price.toFixed(2)}</p>
              {product.description && (
                <p className="text-muted-foreground">{product.description}</p>
              )}
            </div>

            {/* Add to Cart Section */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 p-0"
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-10 w-10 p-0"
                    >
                      +
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Weight: {product.weight}g each
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={isInCart}
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isInCart ? 'Added to Cart' : 'Add to Cart'}
                </Button>
              </CardContent>
            </Card>

            {/* Key Info */}
            <div className="grid grid-cols-2 gap-4">
              {product.origin && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Origin</p>
                    <p className="font-medium">{product.origin}</p>
                  </CardContent>
                </Card>
              )}
              {product.weight && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Weight</p>
                    <p className="font-medium">{product.weight}g</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="mt-8 space-y-6">
          {/* Nutrition Facts */}
          {product.nutrition && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Nutrition Facts (per 100g)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{product.nutrition.calories}</p>
                    <p className="text-sm text-muted-foreground">Calories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{product.nutrition.protein}g</p>
                    <p className="text-sm text-muted-foreground">Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{product.nutrition.carbs}g</p>
                    <p className="text-sm text-muted-foreground">Carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{product.nutrition.fat}g</p>
                    <p className="text-sm text-muted-foreground">Fat</p>
                  </div>
                </div>
                {(product.nutrition.fiber || product.nutrition.sugar) && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 gap-4">
                      {product.nutrition.fiber && (
                        <div className="text-center">
                          <p className="text-lg font-semibold">{product.nutrition.fiber}g</p>
                          <p className="text-sm text-muted-foreground">Fiber</p>
                        </div>
                      )}
                      {product.nutrition.sugar && (
                        <div className="text-center">
                          <p className="text-lg font-semibold">{product.nutrition.sugar}g</p>
                          <p className="text-sm text-muted-foreground">Sugar</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Health Benefits */}
          {product.healthBenefits && product.healthBenefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  Health Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {product.healthBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Ingredients */}
          {product.ingredients && product.ingredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ingredient, index) => (
                    <Badge key={index} variant="outline">
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Allergens */}
          {product.allergens && product.allergens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  Allergen Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.allergens.map((allergen, index) => (
                    <Badge key={index} variant="destructive">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;