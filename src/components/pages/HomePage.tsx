import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Scan, Scale, CreditCard, Map, TrendingUp } from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  cartItemCount: number;
  totalValue: number;
}

const HomePage = ({ onNavigate, cartItemCount, totalValue }: HomePageProps) => {
  const quickActions = [
    {
      id: 'scan',
      title: 'Shop Products',
      description: 'Browse and add items to cart',
      icon: ShoppingCart,
      color: 'bg-primary',
      action: () => onNavigate('scan')
    },
    {
      id: 'cart',
      title: 'View Cart',
      description: `${cartItemCount} items - $${totalValue.toFixed(2)}`,
      icon: Scan,
      color: 'bg-smartcart-success',
      action: () => onNavigate('cart')
    },
    {
      id: 'weight',
      title: 'Store Map',
      description: 'Find items in store',
      icon: Map,
      color: 'bg-smartcart-warning',
      action: () => onNavigate('weight')
    },
    {
      id: 'admin',
      title: 'Settings',
      description: 'Admin panel & settings',
      icon: TrendingUp,
      color: 'bg-smartcart-danger',
      action: () => onNavigate('admin')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-surface p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Smart Cart</h1>
          <p className="text-lg text-muted-foreground">Welcome, Guest User</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <ShoppingCart className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{cartItemCount}</p>
              <p className="text-sm text-muted-foreground">Items in Cart</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <CreditCard className="h-8 w-8 text-smartcart-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-smartcart-success">${totalValue.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <Scale className="h-8 w-8 text-smartcart-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-smartcart-warning">0.0kg</p>
              <p className="text-sm text-muted-foreground">Cart Weight</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-smartcart-danger mx-auto mb-2" />
              <p className="text-2xl font-bold text-smartcart-danger">Ready</p>
              <p className="text-sm text-muted-foreground">Status</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                onClick={action.action}
                className="h-32 md:h-40 p-6 shadow-button hover:shadow-card transition-all duration-200"
              >
                <div className="text-center">
                  <div className={`${action.color} rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>

        {/* System Status */}
        <Card className="mt-8 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>Hardware connectivity and sensor status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-3 h-3 bg-smartcart-success rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium">RFID Scanner</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-smartcart-success rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium">Load Cells</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-smartcart-success rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium">Pi Camera</p>
                <p className="text-xs text-muted-foreground">Ready</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-smartcart-success rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;