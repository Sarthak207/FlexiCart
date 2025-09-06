import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product, Transaction } from '@/types';
import { Plus, Edit, Trash2, Package, TrendingUp, DollarSign, Users, Loader2, LogIn } from 'lucide-react';

interface AdminPageProps {
  onNavigate: (tab: string) => void;
}

const AdminPage = ({ onNavigate }: AdminPageProps) => {
  const { user, loading: authLoading } = useAuth();
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
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

  // Check if user is admin and fetch transactions
  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchTransactions();
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold text-primary">{products.length}</p>
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
                    </div>
                    <DollarSign className="h-8 w-8 text-smartcart-success" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold text-smartcart-warning">{totalTransactions}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-smartcart-warning" />
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
            <h2 className="text-2xl font-bold">User Management</h2>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">User Analytics</h3>
                  <p className="text-muted-foreground">
                    User management features will be available here
                  </p>
                </div>
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