import { useState, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import HomePage from '@/components/pages/HomePage';
import ScanPage from '@/components/pages/ScanPage';
import CartPage from '@/components/pages/CartPage';
import WeightCheckPage from '@/components/pages/WeightCheckPage';
import CheckoutPage from '@/components/pages/CheckoutPage';
import AdminPage from '@/components/pages/AdminPage';
import { CartItem, Product, Transaction } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  const handleAddToCart = useCallback((product: Product, quantity: number) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        toast({
          title: "Item Updated",
          description: `${product.name} quantity updated in cart`,
        });
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        toast({
          title: "Added to Cart",
          description: `${product.name} added to cart`,
        });
        return [...prev, { product, quantity, addedAt: new Date() }];
      }
    });
  }, [toast]);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
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
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
    toast({
      title: "Item Removed",
      description: "Item removed from cart",
      variant: "destructive"
    });
  }, [toast]);

  const handleCheckoutComplete = useCallback((transactionId: string) => {
    const transaction: Transaction = {
      id: transactionId,
      items: [...cartItems],
      total: cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
      timestamp: new Date(),
      paymentMethod: 'UPI',
      status: 'completed'
    };
    
    setTransactions(prev => [transaction, ...prev]);
    setCartItems([]);
    setActiveTab('home');
    
    toast({
      title: "Purchase Complete!",
      description: `Transaction ${transactionId} completed successfully`,
    });
  }, [cartItems, toast]);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            onNavigate={setActiveTab}
            cartItemCount={cartItemCount}
            totalValue={totalValue}
          />
        );
      case 'scan':
        return (
          <ScanPage
            onAddToCart={handleAddToCart}
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
      case 'admin':
        return (
          <AdminPage
            transactions={transactions}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartItemCount={cartItemCount}
      />
      <main>{renderCurrentPage()}</main>
    </div>
  );
};

export default Index;