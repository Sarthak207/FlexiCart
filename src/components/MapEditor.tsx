import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  Move, 
  RotateCcw, 
  Grid, 
  Package,
  ShoppingCart,
  MapPin,
  ArrowLeft,
  Settings,
  Eye,
  Edit3
} from 'lucide-react';
import { Product } from '@/types';

interface MapBlock {
  id: string;
  type: 'shelf' | 'aisle' | 'checkout' | 'entrance' | 'exit' | 'product';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  productId?: string;
  label?: string;
  color?: string;
}

interface StoreMap {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  blocks: MapBlock[];
  createdAt: string;
  updatedAt: string;
}

interface MapEditorProps {
  onNavigate: (tab: string) => void;
  products: Product[];
}

const MapEditor = ({ onNavigate, products }: MapEditorProps) => {
  const [currentMap, setCurrentMap] = useState<StoreMap | null>(null);
  const [maps, setMaps] = useState<StoreMap[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<MapBlock | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState<'select' | 'shelf' | 'aisle' | 'checkout' | 'entrance' | 'exit' | 'product'>('select');
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [newMapName, setNewMapName] = useState('');
  const [newMapDescription, setNewMapDescription] = useState('');

  // Block types configuration
  const blockTypes = {
    shelf: { 
      name: 'Shelf', 
      icon: Package, 
      color: '#8B5CF6', 
      defaultSize: { width: 4, height: 2 },
      description: 'Product display shelf'
    },
    aisle: { 
      name: 'Aisle', 
      icon: Grid, 
      color: '#6B7280', 
      defaultSize: { width: 2, height: 8 },
      description: 'Shopping aisle'
    },
    checkout: { 
      name: 'Checkout', 
      icon: ShoppingCart, 
      color: '#10B981', 
      defaultSize: { width: 3, height: 2 },
      description: 'Checkout counter'
    },
    entrance: { 
      name: 'Entrance', 
      icon: ArrowLeft, 
      color: '#3B82F6', 
      defaultSize: { width: 2, height: 1 },
      description: 'Store entrance'
    },
    exit: { 
      name: 'Exit', 
      icon: ArrowLeft, 
      color: '#EF4444', 
      defaultSize: { width: 2, height: 1 },
      description: 'Store exit'
    },
    product: { 
      name: 'Product', 
      icon: Package, 
      color: '#F59E0B', 
      defaultSize: { width: 1, height: 1 },
      description: 'Individual product'
    }
  };

  // Load maps on component mount
  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = () => {
    // In a real app, this would load from the database
    const savedMaps = localStorage.getItem('storeMaps');
    if (savedMaps) {
      setMaps(JSON.parse(savedMaps));
    }
  };

  const saveMaps = (mapsToSave: StoreMap[]) => {
    localStorage.setItem('storeMaps', JSON.stringify(mapsToSave));
    setMaps(mapsToSave);
  };

  const createNewMap = () => {
    const newMap: StoreMap = {
      id: Date.now().toString(),
      name: newMapName || 'New Store Map',
      description: newMapDescription || 'A new store layout',
      width: 20,
      height: 15,
      blocks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setCurrentMap(newMap);
    setNewMapName('');
    setNewMapDescription('');
  };

  const saveCurrentMap = async () => {
    if (!currentMap) return;
    
    setIsSaving(true);
    try {
      const updatedMap = {
        ...currentMap,
        updatedAt: new Date().toISOString()
      };
      
      const updatedMaps = maps.filter(m => m.id !== currentMap.id);
      updatedMaps.push(updatedMap);
      
      saveMaps(updatedMaps);
      setCurrentMap(updatedMap);
      
      // In a real app, save to database
      // await supabase.from('store_maps').upsert(updatedMap);
      
    } catch (error) {
      console.error('Error saving map:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadMap = (map: StoreMap) => {
    setCurrentMap(map);
  };

  const deleteMap = (mapId: string) => {
    const updatedMaps = maps.filter(m => m.id !== mapId);
    saveMaps(updatedMaps);
    if (currentMap?.id === mapId) {
      setCurrentMap(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!currentMap || selectedTool === 'select') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = Math.floor((e.clientX - rect.left) / (gridSize * zoom));
    const y = Math.floor((e.clientY - rect.top) / (gridSize * zoom));
    
    const blockType = blockTypes[selectedTool];
    const newBlock: MapBlock = {
      id: Date.now().toString(),
      type: selectedTool,
      x,
      y,
      width: blockType.defaultSize.width,
      height: blockType.defaultSize.height,
      rotation: 0,
      color: blockType.color,
      label: blockType.name
    };
    
    setCurrentMap({
      ...currentMap,
      blocks: [...currentMap.blocks, newBlock]
    });
  };

  const handleBlockClick = (block: MapBlock, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBlock(block);
    
    if (selectedTool === 'select') {
      setIsDragging(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left - (block.x * gridSize * zoom),
          y: e.clientY - rect.top - (block.y * gridSize * zoom)
        });
      }
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedBlock || !currentMap) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = Math.floor((e.clientX - rect.left - dragOffset.x) / (gridSize * zoom));
    const y = Math.floor((e.clientY - rect.top - dragOffset.y) / (gridSize * zoom));
    
    setCurrentMap({
      ...currentMap,
      blocks: currentMap.blocks.map(block =>
        block.id === selectedBlock.id
          ? { ...block, x: Math.max(0, x), y: Math.max(0, y) }
          : block
      )
    });
  }, [isDragging, selectedBlock, currentMap, dragOffset, gridSize, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const deleteBlock = (blockId: string) => {
    if (!currentMap) return;
    
    setCurrentMap({
      ...currentMap,
      blocks: currentMap.blocks.filter(block => block.id !== blockId)
    });
    setSelectedBlock(null);
  };

  const updateBlock = (blockId: string, updates: Partial<MapBlock>) => {
    if (!currentMap) return;
    
    setCurrentMap({
      ...currentMap,
      blocks: currentMap.blocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    });
  };

  const exportMap = () => {
    if (!currentMap) return;
    
    const dataStr = JSON.stringify(currentMap, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${currentMap.name.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importMap = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedMap = JSON.parse(e.target?.result as string);
        setCurrentMap(importedMap);
        const updatedMaps = [...maps, importedMap];
        saveMaps(updatedMaps);
      } catch (error) {
        console.error('Error importing map:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => onNavigate('admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Map Editor</h1>
              <p className="text-sm text-muted-foreground">
                {currentMap ? `Editing: ${currentMap.name}` : 'Create and edit store layouts'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={saveCurrentMap}
              disabled={!currentMap || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            
            <Button variant="outline" onClick={exportMap} disabled={!currentMap}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <label className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importMap}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 border-r bg-background overflow-y-auto">
          <Tabs defaultValue="maps" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="maps">Maps</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="maps" className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Store Maps</h3>
                <div className="space-y-2">
                  {maps.map((map) => (
                    <Card 
                      key={map.id} 
                      className={`cursor-pointer transition-colors ${
                        currentMap?.id === map.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => loadMap(map)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{map.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {map.blocks.length} blocks
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMap(map.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      New Map
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Map</DialogTitle>
                      <DialogDescription>
                        Create a new store layout map
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="mapName">Map Name</Label>
                        <Input
                          id="mapName"
                          value={newMapName}
                          onChange={(e) => setNewMapName(e.target.value)}
                          placeholder="Enter map name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mapDescription">Description</Label>
                        <Input
                          id="mapDescription"
                          value={newMapDescription}
                          onChange={(e) => setNewMapDescription(e.target.value)}
                          placeholder="Enter description"
                        />
                      </div>
                      <Button onClick={createNewMap} className="w-full">
                        Create Map
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
            
            <TabsContent value="tools" className="p-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Tools</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(blockTypes).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <Button
                          key={key}
                          variant={selectedTool === key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTool(key as any)}
                          className="justify-start"
                        >
                          <Icon className="h-4 w-4 mr-2" style={{ color: config.color }} />
                          {config.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Settings</h3>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="gridSize">Grid Size</Label>
                      <Input
                        id="gridSize"
                        type="number"
                        value={gridSize}
                        onChange={(e) => setGridSize(Number(e.target.value))}
                        min="10"
                        max="50"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showGrid"
                        checked={showGrid}
                        onChange={(e) => setShowGrid(e.target.checked)}
                      />
                      <Label htmlFor="showGrid">Show Grid</Label>
                    </div>
                    <div>
                      <Label htmlFor="zoom">Zoom: {Math.round(zoom * 100)}%</Label>
                      <input
                        type="range"
                        id="zoom"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                
                {selectedBlock && (
                  <div>
                    <h3 className="font-semibold mb-2">Block Properties</h3>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="blockLabel">Label</Label>
                        <Input
                          id="blockLabel"
                          value={selectedBlock.label || ''}
                          onChange={(e) => updateBlock(selectedBlock.id, { label: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="blockWidth">Width</Label>
                          <Input
                            id="blockWidth"
                            type="number"
                            value={selectedBlock.width}
                            onChange={(e) => updateBlock(selectedBlock.id, { width: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="blockHeight">Height</Label>
                          <Input
                            id="blockHeight"
                            type="number"
                            value={selectedBlock.height}
                            onChange={(e) => updateBlock(selectedBlock.id, { height: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      {selectedBlock.type === 'product' && (
                        <div>
                          <Label htmlFor="productSelect">Product</Label>
                          <Select
                            value={selectedBlock.productId || ''}
                            onValueChange={(value) => updateBlock(selectedBlock.id, { productId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBlock(selectedBlock.id)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Block
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-muted/20">
          {currentMap ? (
            <div className="p-4">
              <div
                ref={canvasRef}
                className="relative bg-background border-2 border-dashed border-muted-foreground/25 rounded-lg"
                style={{
                  width: `${currentMap.width * gridSize * zoom}px`,
                  height: `${currentMap.height * gridSize * zoom}px`,
                  backgroundImage: showGrid 
                    ? `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`
                    : 'none',
                  backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`
                }}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {currentMap.blocks.map((block) => {
                  const blockConfig = blockTypes[block.type];
                  const Icon = blockConfig.icon;
                  
                  return (
                    <div
                      key={block.id}
                      className={`absolute cursor-pointer border-2 rounded transition-all ${
                        selectedBlock?.id === block.id 
                          ? 'ring-2 ring-primary shadow-lg' 
                          : 'hover:shadow-md'
                      }`}
                      style={{
                        left: `${block.x * gridSize * zoom}px`,
                        top: `${block.y * gridSize * zoom}px`,
                        width: `${block.width * gridSize * zoom}px`,
                        height: `${block.height * gridSize * zoom}px`,
                        backgroundColor: block.color || blockConfig.color,
                        borderColor: selectedBlock?.id === block.id ? 'hsl(var(--primary))' : block.color || blockConfig.color
                      }}
                      onClick={(e) => handleBlockClick(block, e)}
                    >
                      <div className="flex items-center justify-center h-full text-white text-xs font-medium">
                        <Icon className="h-4 w-4 mr-1" />
                        {block.label || blockConfig.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MapPin className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Map Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new map or select an existing one to start editing
                </p>
                <Button onClick={() => setNewMapName('New Map')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Map
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapEditor;

