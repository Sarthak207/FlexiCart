import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import HomePage from '@/components/pages/HomePage';
import ScanPage from '@/components/pages/ScanPage';
import CartPage from '@/components/pages/CartPage';
import WeightCheckPage from '@/components/pages/WeightCheckPage';
import CheckoutPage from '@/components/pages/CheckoutPage';
import AdminPage from '@/components/pages/AdminPage';
import AuthPage from '@/components/pages/AuthPage';
import UserDashboard from '@/components/pages/UserDashboard';
import StoreMapPage from '@/components/pages/StoreMapPage';
import { Toaster } from '@/components/ui/toaster';
import { CartItem, Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';

const Index = () => {
  const [currentTab, setCurrentTab] = useState('home');
  const { user, loading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentWeight, setCurrentWeight] = useState(0);
  const { products } = useProducts();

  // Handle URL params for payment success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      const sessionId = urlParams.get('session_id');
      if (sessionId) {
        // Verify payment
        verifyPayment(sessionId);
      }
    }
  }, []);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-stripe-payment', {
        body: { sessionId }
      });
      
      if (error) throw error;
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show success message or redirect
      setCurrentTab('dashboard');
    } catch (error) {
      console.error('Error verifying payment:', error);
    }
  };

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
    setCurrentTab('home');
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading SmartCart...</h1>
          <p className="text-muted-foreground">Please wait while we initialize the system</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-20">
        {currentTab === 'home' && (
          <HomePage
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onNavigate={setCurrentTab}
          />
        )}
        {currentTab === 'scan' && (
          <ScanPage
            onAddToCart={(product) => handleAddToCart(product.id)}
            cartItems={cartItems}
          />
        )}
        {currentTab === 'cart' && (
          <CartPage
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onNavigate={setCurrentTab}
          />
        )}
        {currentTab === 'weight' && (
          <WeightCheckPage
            cartItems={cartItems}
            onNavigate={setCurrentTab}
          />
        )}
        {currentTab === 'checkout' && (
          <CheckoutPage
            cartItems={cartItems}
            onNavigate={setCurrentTab}
            onCheckoutComplete={handleCheckoutComplete}
          />
        )}
        {currentTab === 'dashboard' && <UserDashboard onNavigate={setCurrentTab} />}
        {currentTab === 'store-map' && <StoreMapPage onNavigate={setCurrentTab} />}
        {currentTab === 'admin' && <AdminPage onNavigate={setCurrentTab} />}
        {currentTab === 'auth' && <AuthPage onNavigate={setCurrentTab} />}
      </div>
      <Navigation 
        currentTab={currentTab} 
        onNavigate={setCurrentTab} 
        cartItemsCount={cartItemCount}
        user={user}
      />
      <Toaster />
    </div>
  );
};

export default Index;