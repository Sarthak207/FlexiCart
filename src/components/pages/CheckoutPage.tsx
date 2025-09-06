import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/types';
import { CreditCard, Smartphone, QrCode, CheckCircle, ArrowLeft } from 'lucide-react';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onNavigate: (tab: string) => void;
  onCheckoutComplete: (transactionId: string) => void;
}

const CheckoutPage = ({ cartItems, onNavigate, onCheckoutComplete }: CheckoutPageProps) => {
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Handle Stripe success/cancel redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    const canceled = urlParams.get('canceled');

    if (success === 'true' && sessionId) {
      // Verify payment and show success
      verifyStripePayment(sessionId);
    } else if (canceled === 'true') {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. You can try again.",
        variant: "destructive",
      });
    }
  }, []);

  const verifyStripePayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-stripe-payment', {
        body: { sessionId }
      });

      if (error) throw error;

      if (data.success) {
        setIsComplete(true);
        setTimeout(() => {
          onCheckoutComplete('stripe-' + sessionId);
        }, 2000);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Payment Verification Failed",
        description: "Please contact support if you were charged.",
        variant: "destructive",
      });
    }
  };

  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Stripe',
      icon: CreditCard,
      description: 'Secure payment gateway - Cards, Apple Pay, Google Pay'
    },
    {
      id: 'cash',
      name: 'Cash on Delivery',
      icon: Smartphone,
      description: 'Pay with cash when you receive your order'
    }
  ];

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to complete your purchase.",
        variant: "destructive",
      });
      onNavigate('auth');
      return;
    }

    if (paymentMethod === 'cash') {
      // Handle cash on delivery
      setIsProcessing(true);
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            items: JSON.stringify(cartItems),
            total: total,
            payment_method: 'cash',
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        setIsProcessing(false);
        setIsComplete(true);
        
        setTimeout(() => {
          onCheckoutComplete(data.id);
        }, 2000);
      } catch (error) {
        console.error('Error creating transaction:', error);
        toast({
          title: "Error",
          description: "Failed to create order. Please try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
      return;
    }

    // Handle Stripe payment
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          amount: Math.round(total * 100), // Convert to cents
          cartItems: cartItems,
          isSubscription: false
        }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating Stripe checkout:', error);
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <CheckCircle className="h-24 w-24 text-smartcart-success mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-primary mb-4">Payment Successful!</h1>
          <p className="text-muted-foreground mb-8">
            Your transaction has been completed successfully.
          </p>
          <Button onClick={() => onNavigate('home')} className="min-h-touch">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => onNavigate('cart')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Checkout</h1>
            <p className="text-muted-foreground">Complete your purchase</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Choose your preferred payment option</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-smartcart-surface">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Icon className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <Label htmlFor={method.id} className="font-medium cursor-pointer">
                            {method.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Details */}
            {paymentMethod === 'stripe' && (
              <Card>
                <CardHeader>
                  <CardTitle>Stripe Payment</CardTitle>
                  <CardDescription>Secure payment with multiple options</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <CreditCard className="h-32 w-32 mx-auto mb-4 text-primary" />
                    <p className="text-lg font-semibold mb-2">Secure Payment Gateway</p>
                    <p className="text-muted-foreground">
                      Pay securely using Cards, Apple Pay, Google Pay, or other methods
                    </p>
                    <p className="text-lg font-bold mt-4">
                      Total: ${total.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {paymentMethod === 'cash' && (
              <Card>
                <CardHeader>
                  <CardTitle>Cash on Delivery</CardTitle>
                  <CardDescription>Pay when you receive your order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Smartphone className="h-32 w-32 mx-auto mb-4 text-primary" />
                    <p className="text-lg font-semibold mb-2">Cash Payment</p>
                    <p className="text-muted-foreground">
                      Pay ${total.toFixed(2)} in cash when your order is delivered
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full min-h-touch"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-smartcart-success mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">Secure Payment</p>
                <p className="text-xs text-muted-foreground">
                  Your payment information is encrypted and secure
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;