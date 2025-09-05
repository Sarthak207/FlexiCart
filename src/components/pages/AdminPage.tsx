import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { mockProducts } from '@/data/mockProducts';
import { Product, Transaction } from '@/types';
import { Plus, Edit, Trash2, Package, BarChart3, Users, Settings as SettingsIcon } from 'lucide-react';

interface AdminPageProps {
  transactions?: Transaction[];
}

const AdminPage = ({ transactions = [] }: AdminPageProps) => {
  const [products, setProducts] = useState(mockProducts);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'fruits' as Product['category'],
    weight: '',
    rfidCode: ''
  });

  // Mock transactions for demo
  const mockTransactions: Transaction[] = [
    {
      id: 'TXN001',
      items: [
        { product: mockProducts[0], quantity: 2, addedAt: new Date() },
        { product: mockProducts[1], quantity: 1, addedAt: new Date() }
      ],
      total: 7.97,
      timestamp: new Date(Date.now() - 86400000),
      paymentMethod: 'UPI',
      status: 'completed'
    },
    {
      id: 'TXN002',
      items: [
        { product: mockProducts[2], quantity: 1, addedAt: new Date() }
      ],
      total: 3.49,
      timestamp: new Date(Date.now() - 43200000),
      paymentMethod: 'Card',
      status: 'completed'
    }
  ];

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    
    const product: Product = {
      id: `product_${Date.now()}`,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      weight: newProduct.weight ? parseInt(newProduct.weight) : undefined,
      rfidCode: newProduct.rfidCode || undefined,
      image: '/placeholder.svg'
    };
    
    setProducts([...products, product]);
    setNewProduct({ name: '', price: '', category: 'fruits', weight: '', rfidCode: '' });
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const totalRevenue = mockTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = mockTransactions.length;
  const avgOrderValue = totalRevenue / totalTransactions || 0;

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
            Store Manager Dashboard
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <BarChart3 className="h-8 w-8 text-smartcart-success" />
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
                    <Users className="h-8 w-8 text-smartcart-warning" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Order</p>
                      <p className="text-2xl font-bold text-smartcart-danger">${avgOrderValue.toFixed(2)}</p>
                    </div>
                    <SettingsIcon className="h-8 w-8 text-smartcart-danger" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest customer purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTransactions.slice(0, 5).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{transaction.items.length} items</TableCell>
                        <TableCell>${transaction.total.toFixed(2)}</TableCell>
                        <TableCell>{transaction.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Product Management</h2>
              <Button onClick={() => setIsAddingProduct(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {/* Add Product Form */}
            {isAddingProduct && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Product</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newProduct.category} onValueChange={(value: Product['category']) => setNewProduct({ ...newProduct, category: value })}>
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
                        value={newProduct.weight}
                        onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                        placeholder="Weight in grams"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rfid">RFID Code</Label>
                      <Input
                        id="rfid"
                        value={newProduct.rfidCode}
                        onChange={(e) => setNewProduct({ ...newProduct, rfidCode: e.target.value })}
                        placeholder="RFID identifier"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddProduct}>Add Product</Button>
                    <Button variant="outline" onClick={() => setIsAddingProduct(false)}>Cancel</Button>
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
                        <TableCell>{product.rfidCode || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
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
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{transaction.timestamp.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {transaction.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                {item.product.name} × {item.quantity}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>${transaction.total.toFixed(2)}</TableCell>
                        <TableCell>{transaction.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">System Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hardware Configuration</CardTitle>
                  <CardDescription>Configure connected devices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>RFID Scanner</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 bg-smartcart-success rounded-full"></div>
                      <span className="text-sm">Connected - Port COM3</span>
                    </div>
                  </div>
                  <div>
                    <Label>Load Cells</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 bg-smartcart-success rounded-full"></div>
                      <span className="text-sm">Active - 4 sensors detected</span>
                    </div>
                  </div>
                  <div>
                    <Label>Pi Camera</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 bg-smartcart-success rounded-full"></div>
                      <span className="text-sm">Ready - 1080p mode</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Store Configuration</CardTitle>
                  <CardDescription>Basic store settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input id="storeName" value="SmartCart Store" readOnly />
                  </div>
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input id="taxRate" type="number" value="8" readOnly />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" value="USD" readOnly />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;