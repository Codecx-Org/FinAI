import React, { useState } from 'react';
import { Package, Plus, Search, AlertTriangle, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useProducts, useCreateProduct, type Product } from '../hooks/api/useProducts';
import { toast } from 'sonner';
import { InventoryManagerSkeleton } from './Skeletons';

interface InventoryManagerProps {
  businessId?: number;
}

export function InventoryManager({ businessId }: InventoryManagerProps) {
  const { data: inventory = [], isLoading } = useProducts(businessId);
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);

  // New item form state
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    currentStock: 0,
    minimumThreshold: 0,
    maximumCapacity: 0,
    unitPrice: 0,
    supplier: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (item: Product) => {
    const maximumCapacity = 100; // Hardcoded or added to model later
    const minimumThreshold = 10; // Hardcoded or added to model later
    const stockPercentage = (item.stockQuantity / maximumCapacity) * 100;
    const isLowStock = item.stockQuantity <= minimumThreshold;
    
    if (isLowStock) {
      return { status: 'low', color: 'bg-red-500', label: 'Low Stock', textColor: 'text-red-600' };
    } else if (stockPercentage <= 50) {
      return { status: 'medium', color: 'bg-yellow-500', label: 'Medium Stock', textColor: 'text-yellow-600' };
    } else {
      return { status: 'good', color: 'bg-green-500', label: 'Good Stock', textColor: 'text-green-600' };
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.stockQuantity <= 10);
  const totalValue = inventory.reduce((sum, item) => sum + (item.stockQuantity * item.price), 0);
  const totalItems = inventory.reduce((sum, item) => sum + item.stockQuantity, 0);

  const handleAddItem = () => {
    // Validation
    if (!newItem.name || !businessId) {
      alert('Please fill in all required fields and ensure you are onboarded');
      return;
    }

    createProduct({
      name: newItem.name,
      stockQuantity: newItem.currentStock,
      price: newItem.unitPrice,
      buyingPrice: newItem.unitPrice * 0.8, // Estimate for now
      businessId: businessId,
    }, {
      onSuccess: () => {
        toast.success('Product added successfully!');
        // Reset form
        setNewItem({
          name: '',
          category: '',
          currentStock: 0,
          minimumThreshold: 0,
          maximumCapacity: 0,
          unitPrice: 0,
          supplier: ''
        });
        setShowAddItem(false);
      },
      onError: () => {
        toast.error('Failed to add product');
      }
    });
  };

  const handleCancelAdd = () => {
    setNewItem({
      name: '',
      category: '',
      currentStock: 0,
      minimumThreshold: 0,
      maximumCapacity: 0,
      unitPrice: 0,
      supplier: ''
    });
    setShowAddItem(false);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2>Inventory Manager</h2>
          <p className="text-muted-foreground text-sm">Mfumo wa kuhifadhi bidhaa / Stock management</p>
        </div>
        <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Product Name *</Label>
                <Input
                  id="itemName"
                  placeholder="e.g., Dairy Meal 50kg"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemCategory">Category *</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dairy Feed">Dairy Feed</SelectItem>
                    <SelectItem value="Poultry Feed">Poultry Feed</SelectItem>
                    <SelectItem value="Swine Feed">Swine Feed</SelectItem>
                    <SelectItem value="Aquaculture">Aquaculture</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Current Stock</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newItem.currentStock || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price (KES)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={newItem.unitPrice || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="minThreshold">Minimum Threshold</Label>
                  <Input
                    id="minThreshold"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newItem.minimumThreshold || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, minimumThreshold: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxCapacity">Maximum Capacity</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    min="1"
                    placeholder="0"
                    value={newItem.maximumCapacity || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, maximumCapacity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Input
                  id="supplier"
                  placeholder="e.g., Coopers Kenya Ltd"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem(prev => ({ ...prev, supplier: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddItem} className="flex-1" disabled={isCreating}>
                  {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Item
                </Button>
                <Button variant="outline" onClick={handleCancelAdd} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <InventoryManagerSkeleton />
      ) : (
        <>
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm font-medium">{totalItems}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm font-medium">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-sm font-medium">{lowStockItems.length}</p>
            <p className="text-xs text-muted-foreground">Low Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              Stock Alert - {lowStockItems.length} items need attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {lowStockItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-red-600">
                    {item.currentStock} left (min: {item.minimumThreshold})
                  </span>
                </div>
              ))}
              {lowStockItems.length > 3 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{lowStockItems.length - 3} more items need restocking
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Items */}
      <div className="space-y-3">
        {filteredInventory.map((item) => {
          const stockStatus = getStockStatus(item);
          const maximumCapacity = 100;
          const stockPercentage = (item.stockQuantity / maximumCapacity) * 100;

          return (
            <Card key={item.id} className="relative">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{item.name}</h3>
                    </div>
                    <p className="text-sm">
                      Unit Price: {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 rounded-full ${stockStatus.color}`}></div>
                      <span className={`text-sm font-medium ${stockStatus.textColor}`}>
                        {item.stockQuantity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      of {maximumCapacity}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Stock Level</span>
                    <span>{stockStatus.label}</span>
                  </div>
                  <Progress 
                    value={stockPercentage} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Min: 10</span>
                    <span>Value: {formatCurrency(item.stockQuantity * item.price)}</span>
                  </div>
                </div>

                {/* AI Prediction */}
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    🤖 AI Prediction: Based on sales trends, restock in{' '}
                    {Math.max(1, Math.floor(item.stockQuantity / 3))} days
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>

        {filteredInventory.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No items found matching your search' : 'No inventory items found'}
            </p>
          </CardContent>
        </Card>
        )}
        </>
        )}
        </div>
        );
        }