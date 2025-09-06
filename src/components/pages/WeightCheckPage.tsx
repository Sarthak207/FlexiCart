import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CartItem } from '@/types';
import { Scale, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface WeightCheckPageProps {
  cartItems: CartItem[];
  onNavigate: (tab: string) => void;
  currentWeight?: number;
  weightStable?: boolean;
}

const WeightCheckPage = ({ cartItems, onNavigate, currentWeight: propWeight, weightStable: propStable }: WeightCheckPageProps) => {
  const [currentWeight, setCurrentWeight] = useState(propWeight || 0);
  const [isStable, setIsStable] = useState(propStable || false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const expectedWeight = cartItems.reduce((sum, item) => 
    sum + ((item.product.weight || 0) * item.quantity), 0
  );

  const weightDifference = Math.abs(currentWeight - expectedWeight);
  const tolerance = expectedWeight * 0.05; // 5% tolerance
  const isWeightMatch = weightDifference <= tolerance;

  // Use real-time weight data if available, otherwise simulate
  useEffect(() => {
    if (propWeight !== undefined) {
      setCurrentWeight(propWeight);
    }
    if (propStable !== undefined) {
      setIsStable(propStable);
    }
  }, [propWeight, propStable]);

  // Simulate weight sensor readings if no real-time data
  useEffect(() => {
    if (propWeight === undefined) {
      const interval = setInterval(() => {
        if (!isCalibrating) {
          // Simulate fluctuating weight readings
          const baseWeight = expectedWeight + (Math.random() - 0.5) * 100;
          setCurrentWeight(Math.max(0, baseWeight));
          setIsStable(Math.random() > 0.3); // 70% chance of stable reading
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [expectedWeight, isCalibrating, propWeight]);

  const handleCalibrate = async () => {
    setIsCalibrating(true);
    // Simulate calibration process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setCurrentWeight(0);
    setIsStable(true);  
    setIsCalibrating(false);
  };

  const handleTare = () => {
    setCurrentWeight(0);
    setIsStable(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Weight Verification</h1>
          <p className="text-muted-foreground">
            Verify your cart contents match the expected weight
          </p>
        </div>

        {/* Weight Display */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <Scale className="h-16 w-16 mx-auto mb-4 text-primary" />
            <CardTitle className="text-4xl font-mono">
              {currentWeight.toFixed(0)}g
            </CardTitle>
            <CardDescription>
              Current weight reading
              {isStable ? (
                <span className="text-smartcart-success ml-2">● Stable</span>
              ) : (
                <span className="text-smartcart-warning ml-2">○ Stabilizing...</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Weight Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Expected Weight</p>
              <p className="text-2xl font-bold text-primary">{expectedWeight.toFixed(0)}g</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Current Weight</p>
              <p className="text-2xl font-bold text-primary">{currentWeight.toFixed(0)}g</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Difference</p>
              <p className={`text-2xl font-bold ${isWeightMatch ? 'text-smartcart-success' : 'text-smartcart-warning'}`}>
                ±{weightDifference.toFixed(0)}g
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Weight Status */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {isWeightMatch ? (
                  <CheckCircle className="h-6 w-6 text-smartcart-success" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-smartcart-warning" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {isWeightMatch ? 'Weight Verified' : 'Weight Mismatch'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isWeightMatch 
                      ? 'Your cart weight matches the expected weight'
                      : `Weight difference exceeds tolerance (${tolerance.toFixed(0)}g)`
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <Progress 
              value={isWeightMatch ? 100 : Math.max(0, 100 - (weightDifference / tolerance) * 100)} 
              className="mb-4" 
            />
            
            {!isWeightMatch && (
              <div className="bg-smartcart-warning/10 border border-smartcart-warning/20 rounded-lg p-4">
                <h4 className="font-medium text-smartcart-warning mb-2">Possible Issues:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Items may be missing from the cart</li>
                  <li>• Extra items may have been added</li>
                  <li>• Weight sensor may need calibration</li>
                  <li>• Check for packaging differences</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart Items Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cart Contents</CardTitle>
            <CardDescription>Expected items and weights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-smartcart-surface rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded bg-background"
                    />
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {item.product.weight}g each
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">
                    {((item.product.weight || 0) * item.quantity).toFixed(0)}g
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={handleTare}
            className="min-h-touch"
            disabled={isCalibrating}
          >
            <Scale className="h-4 w-4 mr-2" />
            Tare Scale
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCalibrate}
            disabled={isCalibrating}
            className="min-h-touch"
          >
            {isCalibrating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isCalibrating ? 'Calibrating...' : 'Calibrate'}
          </Button>
          
          <Button
            onClick={() => onNavigate(isWeightMatch ? 'checkout' : 'cart')}
            className="min-h-touch"
            variant={isWeightMatch ? 'default' : 'outline'}
          >
            {isWeightMatch ? 'Proceed to Checkout' : 'Review Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WeightCheckPage;