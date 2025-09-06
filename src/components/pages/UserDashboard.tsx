import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  CreditCard, 
  Package, 
  MapPin, 
  Search,
  Calendar,
  DollarSign,
  TrendingUp 
} from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  plan_type: string;
  amount: number;
  current_period_end: string;
}

interface Transaction {
  id: string;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: any[];
}

interface UserDashboardProps {
  onNavigate: (tab: string) => void;
}

const UserDashboard = ({ onNavigate }: UserDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserSubscription();
      fetchUserTransactions();
    }
  }, [user]);

  const fetchUserSubscription = async () => {
    try {
      setLoadingSubscription(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const fetchUserTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions((data || []).map(item => ({
        ...item,
        items: Array.isArray(item.items) ? item.items : []
      })));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleCreateSubscription = async (planType: 'monthly' | 'yearly') => {
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          planType,
          isSubscription: true
        }
      });

      if (error) throw error;
      
      // Open Stripe checkout in new tab
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription checkout.",
        variant: "destructive",
      });
    }
  };

  const totalSpent = transactions.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <User className="h-8 w-8" />
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.email}</p>
          </div>
          <Button onClick={() => onNavigate('store-map')}>
            <MapPin className="h-4 w-4 mr-2" />
            View Store Map
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-primary">${totalSpent.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold text-primary">{transactions.length}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Subscription</p>
                  <p className="text-2xl font-bold text-primary">
                    {subscription?.status === 'active' ? 'Active' : 'None'}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSubscription ? (
                <div className="text-center py-4">Loading...</div>
              ) : subscription && subscription.status === 'active' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Plan:</span>
                    <Badge variant="default">
                      {subscription.plan_type === 'monthly' ? 'Monthly' : 'Yearly'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">${(subscription.amount / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next billing:</span>
                    <span className="text-sm">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">No active subscription</p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleCreateSubscription('monthly')}
                      className="w-full"
                    >
                      Subscribe Monthly ($9.99/mo)
                    </Button>
                    <Button 
                      onClick={() => handleCreateSubscription('yearly')}
                      variant="outline" 
                      className="w-full"
                    >
                      Subscribe Yearly ($99.99/yr)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Products
              </CardTitle>
              <CardDescription>Search for products and see their location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <div className="text-sm text-muted-foreground">
                    Search results will show product locations on the store map
                  </div>
                )}
                <Button onClick={() => onNavigate('store-map')} className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  View Store Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="text-center py-4">Loading...</div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">${transaction.total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()} • {transaction.payment_method}
                      </p>
                    </div>
                    <Badge 
                      variant={transaction.payment_status === 'succeeded' ? 'default' : 'secondary'}
                    >
                      {transaction.payment_status}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => onNavigate('transactions')}>
                  View All Transactions
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Start shopping to see your transaction history</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;