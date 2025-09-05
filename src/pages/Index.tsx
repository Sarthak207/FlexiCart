import { useState, useEffect } from 'react';
import HomePage from '@/components/pages/HomePage';
import ScanPage from '@/components/pages/ScanPage';
import CartPage from '@/components/pages/CartPage';
import WeightCheckPage from '@/components/pages/WeightCheckPage';
import CheckoutPage from '@/components/pages/CheckoutPage';
import AdminPage from '@/components/pages/AdminPage';
import AuthPage from '@/components/pages/AuthPage';
import Navigation from '@/components/Navigation';
import { Toaster } from '@/components/ui/toaster';
import { CartItem, Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentWeight, setCurrentWeight] = useState(0);
  const { products } = useProducts();

  // Simulate weight sensor data
  useEffect(() => {
    const interval = setInterval(() => {
      const cartWeight = cartItems.reduce((sum, item) => sum + (item.product.weight || 0) * item.quantity, 0);
      const variation = (Math.random() - 0.5) * 50; // ±25g variation
      setCurrentWeight(cartWeight + variation);
    }, 1000);

    return () => clearInterval(interval);
  }, [cartItems]);

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.product.id === productId);
        if (existingItem) {
          return prevItems.map(item =>
            item.product.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return [...prevItems, { product, quantity: 1, addedAt: new Date() }];
        }
      });
    }
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckoutComplete = (transactionId: string) => {
    setCartItems([]);
    setActiveTab('home');
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onNavigate={setActiveTab}
          />
        );
      case 'scan':
        return (
          <ScanPage
            onAddToCart={(product) => handleAddToCart(product.id)}
            cartItems={cartItems}
          />
        );
      case 'cart':
        return (
          <CartPage
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onNavigate={setActiveTab}
          />
        );
      case 'weight':
        return (
          <WeightCheckPage
            cartItems={cartItems}
            onNavigate={setActiveTab}
          />
        );
      case 'checkout':
        return (
          <CheckoutPage
            cartItems={cartItems}
            onNavigate={setActiveTab}
            onCheckoutComplete={handleCheckoutComplete}
          />
        );
      case 'auth':
        return (
          <AuthPage onNavigate={setActiveTab} />
        );
      case 'admin':
        return (
          <AdminPage onNavigate={setActiveTab} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-20">
        {renderCurrentPage()}
      </div>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} cartItemCount={cartItemCount} />
      <Toaster />
    </div>
  );
};

export default Index;