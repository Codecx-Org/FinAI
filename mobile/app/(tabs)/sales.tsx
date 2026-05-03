import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { RotateCcw, DollarSign, Clock, TrendingUp, Package, CheckCircle, Plus, ShoppingCart, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

// Types
interface Sale {
  id: string;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentMethod: string;
  timestamp: string;
  customer?: string;
}

interface OrderItem {
  id: string;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  notes?: string;
}

const mockSales: Sale[] = [
  { id: '1', product: 'Chick Mash 50kg', quantity: 3, unitPrice: 2800, total: 8400, paymentMethod: 'M-Pesa', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), customer: 'Grace Wanjiku' },
  { id: '2', product: 'Layers Mash 50kg', quantity: 2, unitPrice: 2200, total: 4400, paymentMethod: 'Cash', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), customer: 'John Mwangi' },
  { id: '3', product: 'Growers Mash 50kg', quantity: 1, unitPrice: 2400, total: 2400, paymentMethod: 'Airtel Money', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() }
];

const mockMpesaTransactions = [
  { id: 'MPT1', product: 'Chick Mash 50kg', quantity: 2, unitPrice: 2800, total: 5600, paymentMethod: 'M-Pesa', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), customer: 'Mary Njeri' }
];

const mainProducts = [
  { name: 'Chick Mash 50kg', price: 2800 },
  { name: 'Layers Mash 50kg', price: 2200 },
  { name: 'Growers Mash 50kg', price: 2400 }
];

export default function SalesTab() {
  const [activeTab, setActiveTab] = useState<'sales' | 'orders'>('sales');
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({ customerName: '', customerPhone: '', notes: '' });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  const [newItem, setNewItem] = useState({ product: 'Chick Mash 50kg', quantity: '1', unitPrice: '2800' });
  const [showProductSelect, setShowProductSelect] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      const savedOrders = await AsyncStorage.getItem('numeraai_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    }
    loadOrders();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('numeraai_orders', JSON.stringify(orders));
  }, [orders]);

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString('en-KE')}`;
  const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('en-KE');

  const todaysSales = sales.filter(sale => new Date(sale.timestamp).toDateString() === new Date().toDateString());
  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  const avgTransactionValue = todaysSales.length > 0 ? todaysRevenue / todaysSales.length : 0;

  const handleRefreshSales = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const existingIds = new Set(sales.map(s => s.id));
      const newTx = mockMpesaTransactions.filter(t => !existingIds.has(t.id));
      if (newTx.length > 0) setSales([...newTx, ...sales]);
      setLastRefreshTime(new Date());
      setIsRefreshing(false);
    }, 1500);
  };

  const addItemToOrder = () => {
    const qty = parseInt(newItem.quantity) || 0;
    const price = parseFloat(newItem.unitPrice) || 0;
    if (newItem.product && qty > 0 && price > 0) {
      setOrderItems(prev => [...prev, { id: Date.now().toString(), product: newItem.product, quantity: qty, unitPrice: price, total: qty * price }]);
      setNewItem({ product: 'Chick Mash 50kg', quantity: '1', unitPrice: '2800' });
    }
  };

  const calculateOrderTotal = () => orderItems.reduce((sum, item) => sum + item.total, 0);

  const createOrder = () => {
    if (newOrder.customerName && newOrder.customerPhone && orderItems.length > 0) {
      const order: Order = {
        id: `ORD-${Date.now()}`,
        ...newOrder,
        items: orderItems,
        totalAmount: calculateOrderTotal(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      setOrders([order, ...orders]);
      setNewOrder({ customerName: '', customerPhone: '', notes: '' });
      setOrderItems([]);
      setIsOrderDialogOpen(false);
    }
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  const clearCompletedOrders = () => setOrders(orders.filter(o => o.status !== 'completed'));

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalOrderValue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="items-center py-2 mb-4">
          <Text className="text-xl font-bold text-gray-900">Sales Tracker</Text>
          <Text className="text-sm text-gray-500">Umuuzaji wa leo / Today's sales & orders</Text>
        </View>

        {/* Custom Tabs */}
        <View className="flex-row bg-gray-200 rounded-lg mb-6 max-w-sm self-center w-full">
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'sales' ? 'bg-white shadow' : ''}`}
            onPress={() => setActiveTab('sales')}
          >
            <Text className={`font-medium ${activeTab === 'sales' ? 'text-gray-900' : 'text-gray-500'}`}>Sales</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'orders' ? 'bg-white shadow' : ''}`}
            onPress={() => setActiveTab('orders')}
          >
            <Text className={`font-medium ${activeTab === 'orders' ? 'text-gray-900' : 'text-gray-500'}`}>Orders</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'sales' ? (
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <View>
                {lastRefreshTime && (
                  <Text className="text-xs text-green-600 mt-1">Last sync: {formatTime(lastRefreshTime.toISOString())}</Text>
                )}
              </View>
              <TouchableOpacity 
                className="flex-row items-center bg-gray-900 px-3 py-2 rounded-lg"
                onPress={handleRefreshSales}
                disabled={isRefreshing}
              >
                {isRefreshing ? <ActivityIndicator size="small" color="white" /> : <RotateCcw size={16} color="white" />}
                <Text className="text-white text-sm font-medium ml-2">{isRefreshing ? 'Syncing...' : 'Refresh'}</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap justify-between mb-4">
              <Card className="w-[31%]">
                <CardContent className="p-3 items-center">
                  <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mb-2">
                    <DollarSign size={16} color="#16a34a" />
                  </View>
                  <Text className="text-sm font-bold text-gray-900">{formatCurrency(todaysRevenue)}</Text>
                  <Text className="text-[10px] text-gray-500 text-center">Revenue</Text>
                </CardContent>
              </Card>
              <Card className="w-[31%]">
                <CardContent className="p-3 items-center">
                  <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center mb-2">
                    <Package size={16} color="#2563eb" />
                  </View>
                  <Text className="text-sm font-bold text-gray-900">{todaysSales.length}</Text>
                  <Text className="text-[10px] text-gray-500 text-center">Transactions</Text>
                </CardContent>
              </Card>
              <Card className="w-[31%]">
                <CardContent className="p-3 items-center">
                  <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mb-2">
                    <TrendingUp size={16} color="#9333ea" />
                  </View>
                  <Text className="text-sm font-bold text-gray-900">{formatCurrency(avgTransactionValue)}</Text>
                  <Text className="text-[10px] text-gray-500 text-center">Avg Value</Text>
                </CardContent>
              </Card>
            </View>

            {isRefreshing && (
              <Card className="mb-4 bg-blue-50 border-blue-200">
                <CardContent className="flex-row items-center p-4">
                  <ActivityIndicator size="small" color="#2563eb" className="mr-3" />
                  <View>
                    <Text className="font-bold text-blue-900">Syncing with M-Pesa...</Text>
                    <Text className="text-xs text-blue-700">Fetching latest transactions</Text>
                  </View>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2"><Clock size={20} color="#374151" /></View>
                    <Text className="text-base font-bold">Recent Sales</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysSales.map((sale) => (
                  <View key={sale.id} className="flex-row justify-between mb-3 p-3 bg-gray-100 rounded-lg">
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900">{sale.product}</Text>
                      <Text className="text-xs text-gray-600">{sale.quantity} × {formatCurrency(sale.unitPrice)}</Text>
                      {sale.customer && <Text className="text-xs text-gray-500 mt-1">{sale.customer}</Text>}
                    </View>
                    <View className="items-end">
                      <Text className="font-bold text-gray-900">{formatCurrency(sale.total)}</Text>
                      <View className="flex-row items-center mt-1">
                        <Badge variant="secondary" className="mr-2">{sale.paymentMethod}</Badge>
                        <Text className="text-[10px] text-gray-500">{formatTime(sale.timestamp)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
                {todaysSales.length === 0 && <Text className="text-center text-gray-500 py-4">No sales recorded today</Text>}
              </CardContent>
            </Card>
          </View>
        ) : (
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-sm text-gray-600">Pending: {pendingOrders} | Completed: {completedOrders}</Text>
                <Text className="text-sm font-bold text-blue-600">Total: {formatCurrency(totalOrderValue)}</Text>
              </View>
              <View className="flex-row">
                {completedOrders > 0 && (
                  <TouchableOpacity onPress={clearCompletedOrders} className="mr-2 px-3 py-2 border border-gray-300 rounded-lg">
                    <Text className="text-gray-700 text-xs font-medium">Clear</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  className="flex-row items-center bg-gray-900 px-3 py-2 rounded-lg"
                  onPress={() => setIsOrderDialogOpen(true)}
                >
                  <Plus size={16} color="white" />
                  <Text className="text-white text-xs font-medium ml-1">New Order</Text>
                </TouchableOpacity>
              </View>
            </View>

            {orders.length === 0 ? (
              <Card>
                <CardContent className="p-8 items-center">
                  <View className="mb-4"><ShoppingCart size={48} color="#9ca3af" /></View>
                  <Text className="text-gray-500 font-bold mb-1">No orders yet</Text>
                  <Text className="text-sm text-gray-400">Create your first order to get started</Text>
                </CardContent>
              </Card>
            ) : (
              orders.map(order => (
                <Card key={order.id} className="mb-4">
                  <CardContent className="p-4">
                    <View className="flex-row justify-between items-start mb-3">
                      <View>
                        <Text className="font-bold text-gray-900">{order.customerName}</Text>
                        <Text className="text-xs text-gray-600">{order.customerPhone}</Text>
                        <Text className="text-[10px] text-gray-400">{formatDate(order.createdAt)} {formatTime(order.createdAt)}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-bold text-lg text-gray-900 mb-1">{formatCurrency(order.totalAmount)}</Text>
                        {order.status === 'pending' && <Badge variant="outline" className="bg-yellow-100 border-yellow-200" textClassName="text-yellow-700">Pending</Badge>}
                        {order.status === 'confirmed' && <Badge variant="outline" className="bg-blue-100 border-blue-200" textClassName="text-blue-700">Confirmed</Badge>}
                        {order.status === 'completed' && <Badge variant="default" className="bg-green-100" textClassName="text-green-700">Completed</Badge>}
                        {order.status === 'cancelled' && <Badge variant="destructive" textClassName="text-red-700">Cancelled</Badge>}
                      </View>
                    </View>
                    <View className="mb-3">
                      {order.items.map((item, idx) => (
                        <View key={idx} className="flex-row justify-between mt-1">
                          <Text className="text-sm text-gray-700">{item.product} × {item.quantity}</Text>
                          <Text className="text-sm text-gray-900">{formatCurrency(item.total)}</Text>
                        </View>
                      ))}
                    </View>
                    {order.notes ? <Text className="text-xs text-gray-500 italic mb-3">Note: {order.notes}</Text> : null}
                    
                    <View className="flex-row pt-2 border-t border-gray-100">
                      {order.status === 'pending' && (
                        <>
                          <TouchableOpacity onPress={() => updateOrderStatus(order.id, 'confirmed')} className="flex-1 bg-gray-900 py-2 rounded-lg mr-2 items-center">
                            <Text className="text-white font-medium">Confirm</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => updateOrderStatus(order.id, 'cancelled')} className="flex-1 border border-gray-300 py-2 rounded-lg items-center">
                            <Text className="text-gray-700 font-medium">Cancel</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <TouchableOpacity onPress={() => updateOrderStatus(order.id, 'completed')} className="flex-1 bg-green-600 py-2 rounded-lg items-center">
                          <Text className="text-white font-medium">Mark Complete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* New Order Modal */}
      <Modal visible={isOrderDialogOpen} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
            <Text className="text-lg font-bold">Create New Order</Text>
            <TouchableOpacity onPress={() => setIsOrderDialogOpen(false)} className="p-2">
              <Text className="text-gray-500 font-bold text-lg">X</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text className="font-bold text-gray-900 mb-3">Customer Information</Text>
            <TextInput className="bg-white border border-gray-300 p-3 rounded-lg mb-3" placeholder="Customer Name" value={newOrder.customerName} onChangeText={t => setNewOrder({...newOrder, customerName: t})} />
            <TextInput className="bg-white border border-gray-300 p-3 rounded-lg mb-3" placeholder="Phone Number (+254...)" keyboardType="phone-pad" value={newOrder.customerPhone} onChangeText={t => setNewOrder({...newOrder, customerPhone: t})} />
            <TextInput className="bg-white border border-gray-300 p-3 rounded-lg mb-6" placeholder="Notes (Optional)" value={newOrder.notes} onChangeText={t => setNewOrder({...newOrder, notes: t})} />

            <Text className="font-bold text-gray-900 mb-3">Add Item</Text>
            <TouchableOpacity onPress={() => setShowProductSelect(!showProductSelect)} className="bg-white border border-gray-300 p-3 rounded-lg mb-3 flex-row justify-between items-center">
              <Text className="text-gray-800">{newItem.product || 'Select Product'}</Text>
              <Text className="text-gray-400">▼</Text>
            </TouchableOpacity>
            
            {showProductSelect && (
              <View className="bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden shadow-sm">
                {mainProducts.map(p => (
                  <TouchableOpacity 
                    key={p.name} 
                    className="p-3 border-b border-gray-100" 
                    onPress={() => {
                      setNewItem({...newItem, product: p.name, unitPrice: p.price.toString()});
                      setShowProductSelect(false);
                    }}
                  >
                    <Text>{p.name} - {formatCurrency(p.price)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View className="flex-row mb-3">
              <View className="flex-1 mr-2">
                <Text className="text-xs text-gray-500 mb-1">Qty</Text>
                <TextInput className="bg-white border border-gray-300 p-3 rounded-lg" keyboardType="numeric" value={newItem.quantity} onChangeText={t => setNewItem({...newItem, quantity: t})} />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-xs text-gray-500 mb-1">Unit Price (KES)</Text>
                <TextInput className="bg-white border border-gray-300 p-3 rounded-lg" keyboardType="numeric" value={newItem.unitPrice} onChangeText={t => setNewItem({...newItem, unitPrice: t})} />
              </View>
            </View>
            
            <TouchableOpacity onPress={addItemToOrder} className="bg-gray-200 py-3 rounded-lg items-center mb-6 flex-row justify-center">
              <View className="mr-2"><Plus size={16} color="#374151" /></View>
              <Text className="text-gray-800 font-bold">Add Item to Order</Text>
            </TouchableOpacity>

            {orderItems.length > 0 && (
              <View className="mb-6 bg-white p-4 rounded-xl border border-gray-200">
                <Text className="font-bold text-gray-900 mb-2">Order Items ({orderItems.length})</Text>
                {orderItems.map(item => (
                  <View key={item.id} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                    <View>
                      <Text className="font-medium text-gray-800">{item.product}</Text>
                      <Text className="text-xs text-gray-500">{item.quantity} × {formatCurrency(item.unitPrice)}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="font-bold text-gray-900 mr-3">{formatCurrency(item.total)}</Text>
                      <TouchableOpacity onPress={() => setOrderItems(orderItems.filter(i => i.id !== item.id))}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <View className="flex-row justify-between items-center mt-3 pt-2">
                  <Text className="font-bold text-gray-600">Total:</Text>
                  <Text className="font-bold text-xl text-gray-900">{formatCurrency(calculateOrderTotal())}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              onPress={createOrder} 
              disabled={!newOrder.customerName || !newOrder.customerPhone || orderItems.length === 0}
              className={`py-4 rounded-xl items-center flex-row justify-center mt-4 ${(!newOrder.customerName || !newOrder.customerPhone || orderItems.length === 0) ? 'bg-gray-300' : 'bg-green-600'}`}
            >
              <View className="mr-2"><ShoppingCart size={20} color="white" /></View>
              <Text className="text-white font-bold text-lg">Create Order</Text>
            </TouchableOpacity>
            
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
