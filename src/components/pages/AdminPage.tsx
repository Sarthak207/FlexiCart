import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product, Transaction } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Loader2, 
  LogIn,
  ShoppingCart,
  Map,
  BarChart3,
  Calendar,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (tab: string) => void;
}

const AdminPage = ({ onNavigate }: AdminPageProps) => {
  const { user, loading: authLoading } = useAuth();
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    topProducts: [] as { product: Product; sales: number }[],
    recentActivity: [] as any[]
  });
  const { toast } = useToast();

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    image: '',
    rfid_code: '',
    barcode: '',
    weight: 0,
    category: 'fruits'
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Check if user is admin and fetch data
  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchTransactions();
      fetchAnalytics();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Transaction interface
      const transformedTransactions: Transaction[] = (data || []).map(item => ({
        id: item.id,
        items: item.items as any,
        total: parseFloat(item.total.toString()),
        timestamp: new Date(item.created_at),
        paymentMethod: item.payment_method || 'Unknown',
        status: item.status as 'pending' | 'completed' | 'failed'
      }));
      
      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Mock analytics data - in a real app, this would come from the database
      const mockAnalytics = {
        totalUsers: 1247,
        activeUsers: 892,
        conversionRate: 23.5,
        averageOrderValue: 45.67,
        topProducts: products.slice(0, 5).map((product, index) => ({
          product,
          sales: Math.floor(Math.random() * 100) + 10
        })),
        recentActivity: [
          { type: 'transaction', message: 'New order completed', time: '2 min ago', amount: 23.45 },
          { type: 'user', message: 'New user registered', time: '5 min ago' },
          { type: 'product', message: 'Product updated', time: '12 min ago', product: 'Red Apples' },
          { type: 'transaction', message: 'Payment failed', time: '18 min ago', amount: 67.89 },
          { type: 'user', message: 'User logged in', time: '25 min ago' }
        ]
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.price > 0) {
      try {
        await addProduct(newProduct);
        setNewProduct({
          name: '',
          price: 0,
          image: '',
          rfid_code: '',
          barcode: '',
          weight: 0,
          category: 'fruits'
        });
        toast({
          title: "Product added",
          description: "Product has been added successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add product.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleUpdateProduct = async () => {
    if (editingProduct) {
      try {
        await updateProduct(editingProduct.id, editingProduct);
        setEditingProduct(null);
        toast({
          title: "Product updated",
          description: "Product has been updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update product.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <LogIn className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-primary mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-8">
            Please sign in to access the admin panel.
          </p>
          <Button onClick={() => onNavigate('auth')} className="min-h-touch">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <Package className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-primary mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You don't have admin privileges to access this panel.
          </p>
          <Button onClick={() => onNavigate('home')} className="min-h-touch">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = transactions.length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">Manage your SmartCart system</p>
          </div>
          <Badge variant="outline" className="text-smartcart-success border-smartcart-success">
            Admin Dashboard
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="maps">Store Maps</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold text-primary">{products.length}</p>
                      <p className="text-xs text-muted-foreground">+2 this week</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-smartcart-success">${totalRevenue.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">+12.5% from last month</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-smartcart-success" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold text-smartcart-warning">{analytics.activeUsers}</p>
                      <p className="text-xs text-muted-foreground">{analytics.totalUsers} total users</p>
                    </div>
                    <Users className="h-8 w-8 text-smartcart-warning" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      <p className="text-2xl font-bold text-smartcart-primary">{analytics.conversionRate}%</p>
                      <p className="text-xs text-muted-foreground">+3.2% from last week</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-smartcart-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Top Products
                  </CardTitle>
                  <CardDescription>Best selling products this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topProducts.map((item, index) => (
                      <div key={item.product.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">{item.product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{item.sales} sales</p>
                          <p className="text-sm text-muted-foreground">${item.product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest system activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'transaction' ? 'bg-smartcart-success' :
                          activity.type === 'user' ? 'bg-smartcart-primary' :
                          'bg-smartcart-warning'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                        {activity.amount && (
                          <p className="text-sm font-bold text-smartcart-success">
                            ${activity.amount}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Order Completion Rate</p>
                      <span className="text-sm text-smartcart-success">94.2%</span>
                    </div>
                    <Progress value={94.2} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Customer Satisfaction</p>
                      <span className="text-sm text-smartcart-success">4.8/5</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">System Uptime</p>
                      <span className="text-sm text-smartcart-success">99.9%</span>
                    </div>
                    <Progress value={99.9} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Product Management</h2>
              <Button onClick={() => setEditingProduct({} as Product)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {/* Add/Edit Product Form */}
            {editingProduct && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingProduct.id ? 'Edit Product' : 'Add New Product'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={editingProduct.name || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={editingProduct.price || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={editingProduct.category} onValueChange={(value: Product['category']) => setEditingProduct({ ...editingProduct, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fruits">Fruits</SelectItem>
                          <SelectItem value="bakery">Bakery</SelectItem>
                          <SelectItem value="dairy">Dairy</SelectItem>
                          <SelectItem value="beverages">Beverages</SelectItem>
                          <SelectItem value="meat">Meat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (g)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={editingProduct.weight || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, weight: parseInt(e.target.value) || 0 })}
                        placeholder="Weight in grams"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rfid">RFID Code</Label>
                      <Input
                        id="rfid"
                        value={editingProduct.rfid_code || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, rfid_code: e.target.value })}
                        placeholder="RF001"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={editingProduct.id ? handleUpdateProduct : handleAddProduct}>
                      {editingProduct.id ? 'Update' : 'Add'} Product
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>RFID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.weight}g</TableCell>
                        <TableCell>{product.rfid_code}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-smartcart-danger hover:text-smartcart-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store Maps Tab */}
          <TabsContent value="maps" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Store Maps Management</h2>
              <Button onClick={() => onNavigate('store-map')}>
                <Plus className="h-4 w-4 mr-2" />
                Manage Maps
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Store Maps</h3>
                  <p className="text-muted-foreground mb-4">
                    Create and manage your store layouts with product positions
                  </p>
                  <Button onClick={() => onNavigate('store-map')}>
                    Open Map Editor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Export Users
              </Button>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold text-smartcart-success">{analytics.activeUsers}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-smartcart-success" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">New This Week</p>
                      <p className="text-2xl font-bold text-smartcart-warning">47</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-smartcart-warning" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                      <p className="text-2xl font-bold text-smartcart-primary">${analytics.averageOrderValue}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-smartcart-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User List */}
            <Card>
              <CardHeader>
                <CardTitle>User List</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Mock user data */}
                    {[
                      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active', lastActive: '2 hours ago' },
                      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'active', lastActive: '1 day ago' },
                      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'user', status: 'inactive', lastActive: '1 week ago' },
                      { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'user', status: 'active', lastActive: '3 hours ago' },
                    ].map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.lastActive}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <h2 className="text-2xl font-bold">Transaction History</h2>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTransactions ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id.slice(0, 8)}...</TableCell>
                          <TableCell>{transaction.timestamp.toLocaleDateString()}</TableCell>
                          <TableCell>${transaction.total.toFixed(2)}</TableCell>
                          <TableCell>{transaction.paymentMethod}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;