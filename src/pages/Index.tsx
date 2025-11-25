import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import HomePage from '@/components/pages/HomePage';
import CaperStyleHomePage from '@/components/pages/CaperStyleHomePage';
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
import { useCartUpdates } from '@/hooks/useCartUpdates';
import ProductDetailPage from '@/components/pages/ProductDetailPage';
import MobileScanPage from '@/components/MobileScanPage';
import { useMobileDevice } from '@/hooks/useMobileDevice';

const Index = () => {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { user, loading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [weightStable, setWeightStable] = useState(false);
  const { products } = useProducts();
  const { isMobile, isCapacitor } = useMobileDevice();

  // Real-time cart updates
  const {
    cartItems: realtimeCartItems,
    currentWeight: realtimeWeight,
    weightStable: realtimeWeightStable,
    isConnected: wsConnected,
    error: wsError
  } = useCartUpdates({
    userId: user?.id || 'demo_user',
    onCartUpdate: (items) => {
      setCartItems(items);
    },
    onWeightUpdate: (weight, stable) => {
      setCurrentWeight(weight);
      setWeightStable(stable);
    }
  });

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

  // Use real-time weight data if available, otherwise simulate
  useEffect(() => {
    if (!wsConnected) {
      // Fallback to simulation if WebSocket not connected
      const interval = setInterval(() => {
        const cartWeight = cartItems.reduce((sum, item) => sum + (item.product.weight || 0) * item.quantity, 0);
        const variation = (Math.random() - 0.5) * 50; // ±25g variation
        setCurrentWeight(cartWeight + variation);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [cartItems, wsConnected]);

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
          <CaperStyleHomePage
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onNavigate={setCurrentTab}
            onViewProduct={(product) => {
              // Find the full product from our products data
              const fullProduct = products.find(p => p.id === product.id);
              if (fullProduct) {
                setSelectedProduct(fullProduct);
                setCurrentTab('product-detail');
              }
            }}
          />
        )}
        {currentTab === 'scan' && (
          <>
            {(isMobile || isCapacitor) ? (
              <MobileScanPage onNavigate={setCurrentTab} />
            ) : (
              <ScanPage
                onAddToCart={(product, quantity) => {
                  const existingItem = cartItems.find(item => item.product.id === product.id);
                  if (existingItem) {
                    handleUpdateQuantity(product.id, existingItem.quantity + quantity);
                  } else {
                    setCartItems(prev => [...prev, { product, quantity, addedAt: new Date() }]);
                  }
                }}
                cartItems={cartItems}
                onNavigate={setCurrentTab}
                onViewProduct={setSelectedProduct}
              />
            )}
          </>
        )}
        {currentTab === 'product-detail' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            cartItems={cartItems}
            onAddToCart={(product, quantity) => {
              const existingItem = cartItems.find(item => item.product.id === product.id);
              if (existingItem) {
                handleUpdateQuantity(product.id, existingItem.quantity + quantity);
              } else {
                setCartItems(prev => [...prev, { product, quantity, addedAt: new Date() }]);
              }
            }}
            onNavigate={(tab) => {
              if (tab === 'scan') {
                setSelectedProduct(null);
              }
              setCurrentTab(tab);
            }}
          />
        )}
        {currentTab === 'cart' && (
          <CartPage
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onNavigate={setCurrentTab}
            onViewProduct={(product) => {
              setSelectedProduct(product);
              setCurrentTab('product-detail');
            }}
          />
        )}
        {currentTab === 'weight' && (
          <WeightCheckPage
            cartItems={cartItems}
            onNavigate={setCurrentTab}
            currentWeight={currentWeight}
            weightStable={weightStable}
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