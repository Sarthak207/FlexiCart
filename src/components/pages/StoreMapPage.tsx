import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, Edit, Trash2, Save, X, Map as MapIcon } from 'lucide-react';

interface StoreMap {
  id: string;
  name: string;
  description: string;
  layout_data: any;
  is_active: boolean;
  created_at: string;
}

interface ProductPosition {
  id: string;
  map_id: string;
  product_id: string;
  x_position: number;
  y_position: number;
  zone_name: string;
  shelf_number: string;
  product: {
    name: string;
    category: string;
  };
}

interface StoreMapPageProps {
  onNavigate: (tab: string) => void;
}

const StoreMapPage = ({ onNavigate }: StoreMapPageProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [maps, setMaps] = useState<StoreMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<StoreMap | null>(null);
  const [positions, setPositions] = useState<ProductPosition[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMap, setEditingMap] = useState<Partial<StoreMap>>({});

  useEffect(() => {
    fetchMaps();
  }, []);

  useEffect(() => {
    if (selectedMap) {
      fetchProductPositions(selectedMap.id);
    }
  }, [selectedMap]);

  const fetchMaps = async () => {
    try {
      const { data, error } = await supabase
        .from('store_maps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaps(data || []);
      
      // Auto-select first active map
      const activeMap = data?.find(m => m.is_active);
      if (activeMap) {
        setSelectedMap(activeMap);
      }
    } catch (error) {
      console.error('Error fetching maps:', error);
      toast({
        title: "Error",
        description: "Failed to load store maps.",
        variant: "destructive",
      });
    }
  };

  const fetchProductPositions = async (mapId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_positions')
        .select(`
          *,
          product:products(name, category)
        `)
        .eq('map_id', mapId);

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const handleSaveMap = async () => {
    try {
      if (editingMap.id) {
        // Update existing map
        const { error } = await supabase
          .from('store_maps')
          .update(editingMap)
          .eq('id', editingMap.id);
        
        if (error) throw error;
      } else {
        // Create new map
        const { data, error } = await supabase
          .from('store_maps')
          .insert({
            name: editingMap.name || 'Untitled Map',
            description: editingMap.description || '',
            layout_data: {},
            created_by: user?.id
          })
          .select()
          .single();
        
        if (error) throw error;
        setEditingMap({ ...editingMap, id: data.id });
      }

      await fetchMaps();
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Store map saved successfully.",
      });
    } catch (error) {
      console.error('Error saving map:', error);
      toast({
        title: "Error",
        description: "Failed to save store map.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    try {
      const { error } = await supabase
        .from('store_maps')
        .delete()
        .eq('id', mapId);
      
      if (error) throw error;
      
      await fetchMaps();
      if (selectedMap?.id === mapId) {
        setSelectedMap(null);
      }
      
      toast({
        title: "Success",
        description: "Store map deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting map:', error);
      toast({
        title: "Error",
        description: "Failed to delete store map.",
        variant: "destructive",
      });
    }
  };

  const handleSetActiveMap = async (mapId: string) => {
    try {
      // First deactivate all maps
      await supabase
        .from('store_maps')
        .update({ is_active: false })
        .neq('id', '');

      // Then activate the selected map
      const { error } = await supabase
        .from('store_maps')
        .update({ is_active: true })
        .eq('id', mapId);
      
      if (error) throw error;
      
      await fetchMaps();
      toast({
        title: "Success",
        description: "Active store map updated.",
      });
    } catch (error) {
      console.error('Error setting active map:', error);
      toast({
        title: "Error",
        description: "Failed to update active map.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <MapIcon className="h-8 w-8" />
              Store Maps
            </h1>
            <p className="text-muted-foreground mt-1">Manage your store layouts and product positions</p>
          </div>
          <Button onClick={() => { setIsEditing(true); setEditingMap({}); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Map
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Maps List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Store Maps</CardTitle>
                <CardDescription>Select a map to view and edit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {maps.map((map) => (
                  <div
                    key={map.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMap?.id === map.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedMap(map)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{map.name}</h3>
                        <p className="text-sm text-muted-foreground">{map.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {map.is_active && (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                            setEditingMap(map);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {maps.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No store maps found</p>
                    <p className="text-sm">Create your first map to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map Details */}
          <div className="lg:col-span-2">
            {selectedMap ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedMap.name}
                        {selectedMap.is_active && (
                          <Badge variant="default">Active Map</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{selectedMap.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!selectedMap.is_active && (
                        <Button
                          variant="outline"
                          onClick={() => handleSetActiveMap(selectedMap.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteMap(selectedMap.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Simple Grid Layout for Product Positions */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Product Positions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {positions.map((position) => (
                        <div
                          key={position.id}
                          className="p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">{position.product.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Zone: {position.zone_name || 'Not set'}</p>
                            <p>Shelf: {position.shelf_number || 'Not set'}</p>
                            <p>Position: ({position.x_position}, {position.y_position})</p>
                            <Badge variant="outline" className="mt-1">
                              {position.product.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {positions.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">No products positioned yet</p>
                        <p className="text-sm text-muted-foreground">Add products to this map to see their positions</p>
                      </div>
                    )}
                  </div>

                  {/* Map Editor Placeholder */}
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <MapIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Visual Map Editor</h3>
                    <p className="text-muted-foreground mb-4">
                      Advanced drag-and-drop map editor will be available here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      For now, use the admin panel to manage product positions
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Select a Store Map</h3>
                  <p className="text-muted-foreground">
                    Choose a map from the list to view its details and product positions
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Map Dialog */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{editingMap.id ? 'Edit Map' : 'Create New Map'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="map-name">Map Name</Label>
                  <Input
                    id="map-name"
                    value={editingMap.name || ''}
                    onChange={(e) => setEditingMap({ ...editingMap, name: e.target.value })}
                    placeholder="Store Layout 1"
                  />
                </div>
                <div>
                  <Label htmlFor="map-description">Description</Label>
                  <Textarea
                    id="map-description"
                    value={editingMap.description || ''}
                    onChange={(e) => setEditingMap({ ...editingMap, description: e.target.value })}
                    placeholder="Main store layout with electronics and groceries"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveMap}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreMapPage;