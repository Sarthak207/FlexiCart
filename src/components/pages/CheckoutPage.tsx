import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/types';
import { CreditCard, Smartphone, QrCode, CheckCircle, ArrowLeft } from 'lucide-react';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onNavigate: (tab: string) => void;
  onCheckoutComplete: (transactionId: string) => void;
}

const CheckoutPage = ({ cartItems, onNavigate, onCheckoutComplete }: CheckoutPageProps) => {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: QrCode,
      description: 'Pay using UPI apps like GPay, PhonePe, Paytm'
    },
    {
      id: 'card',
      name: 'Card',
      icon: CreditCard,
      description: 'Credit or Debit Card'
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: Smartphone,
      description: 'Paytm, Amazon Pay, etc.'
    }
  ];

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const transactionId = `TXN${Date.now()}`;
    setIsProcessing(false);
    setIsComplete(true);
    
    // Call parent to handle checkout completion
    setTimeout(() => {
      onCheckoutComplete(transactionId);
    }, 2000);
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
            {paymentMethod === 'card' && (
              <Card>
                <CardHeader>
                  <CardTitle>Card Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input id="expiry" placeholder="MM/YY" />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="name">Cardholder Name</Label>
                    <Input id="name" placeholder="John Doe" />
                  </div>
                </CardContent>
              </Card>
            )}

            {paymentMethod === 'upi' && (
              <Card>
                <CardHeader>
                  <CardTitle>UPI Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <QrCode className="h-32 w-32 mx-auto mb-4 text-primary" />
                    <p className="text-lg font-semibold mb-2">Scan QR Code</p>
                    <p className="text-muted-foreground">
                      Use any UPI app to scan and pay ₹{(total * 75).toFixed(2)}
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