import React, { useState, useEffect } from 'react';
import { RotateCcw, DollarSign, Clock, TrendingUp, Users, Package, CheckCircle, Plus, ShoppingCart, Trash2, Edit3, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useSales, useOrders, useCreateOrder, useUpdateOrder, useDeleteOrder, type Sale as ApiSale, type OrderItem as ApiOrderItem } from '../hooks/api/useSales';
import { useProducts } from '../hooks/api/useProducts';
import { useInitiatePayment, usePaymentStatus } from '../hooks/api/usePayments';
import { useCustomers, useCreateCustomer } from '../hooks/api/useCustomers';
import { toast } from 'sonner';

interface SalesTrackerProps {
  businessId?: number;
}

export function SalesTracker({ businessId }: SalesTrackerProps) {
  const { data: sales = [], isLoading: isLoadingSales, refetch: refetchSales } = useSales(businessId);
  const { data: orders = [], isLoading: isLoadingOrders } = useOrders(businessId);
  const { data: products = [] } = useProducts(businessId);
  const { data: customers = [] } = useCustomers(businessId);
  
  const { mutate: createOrder, isPending: isCreatingOrder } = useCreateOrder();
  const { mutate: updateOrder } = useUpdateOrder();
  const { mutate: deleteOrder } = useDeleteOrder(businessId);
  const { mutate: createCustomer } = useCreateCustomer();
  const { mutate: initiatePayment, isPending: isInitiatingPayment } = useInitiatePayment();

  const [paymentOrder, setPaymentOrder] = useState<{ id: number; amount: number; phone: string } | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [editingOrderForCustomer, setEditingOrderForCustomer] = useState<any>(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Poll for payment status when a payment is active
  const { data: paymentStatusData } = usePaymentStatus(paymentOrder?.id || 0, !!paymentOrder);

  // Effect to handle payment completion
  useEffect(() => {
    if (paymentStatusData?.status === 'paid' && paymentOrder) {
      toast.success('Payment received successfully!');
      setShowPaymentDialog(false);
      setPaymentOrder(null);
      refetchSales(); // Refresh sales to show the new transaction
    } else if (paymentStatusData?.status === 'failed' && paymentOrder) {
      toast.error('Payment failed. Please try again.');
    }
  }, [paymentStatusData, paymentOrder, refetchSales]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    notes: ''
  });
  
  interface LocalOrderItem {
    id: string;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }
  
  const [orderItems, setOrderItems] = useState<LocalOrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    productId: 0,
    quantity: 1,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-KE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const todaysRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const avgTransactionValue = sales.length > 0 ? todaysRevenue / sales.length : 0;

  const handleRefreshSales = async () => {
    setIsRefreshing(true);
    await refetchSales();
    setLastRefreshTime(new Date());
    setIsRefreshing(false);
  };

  const addItemToOrder = () => {
    const product = products.find(p => p.id === newItem.productId);
    if (product && newItem.quantity > 0) {
      const item: LocalOrderItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        quantity: newItem.quantity,
        unitPrice: product.price,
        total: newItem.quantity * product.price
      };
      setOrderItems(prev => [...prev, item]);
      setNewItem({ productId: 0, quantity: 1 });
    }
  };

  const removeItemFromOrder = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCreateOrder = () => {
    if (businessId && orderItems.length > 0) {
      const orderPayload: any = {
        businessId: businessId,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        totalAmount: calculateOrderTotal(),
      };

      if (newOrder.customerId) {
        orderPayload.customerId = parseInt(newOrder.customerId);
      }

      createOrder(orderPayload, {
        onSuccess: (data: any) => {
          toast.success('Order created successfully!');
          
          const selectedCustomer = customers.find(c => c.id === parseInt(newOrder.customerId));
          
          if (selectedCustomer?.phone) {
            // Set up payment prompt
            const total = calculateOrderTotal();
            setPaymentOrder({
              id: data.id,
              amount: total,
              phone: selectedCustomer.phone
            });
            setShowPaymentDialog(true);
          }

          setNewOrder({ customerId: '', notes: '' });
          setOrderItems([]);
          setIsOrderDialogOpen(false);
        },
        onError: () => {
          toast.error('Failed to create order');
        }
      });
    }
  };

  const handleUpdateCustomerForOrder = () => {
    if (!businessId || !editingOrderForCustomer) return;

    if (customerForm.name && businessId) {
      createCustomer({
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
        businessId: businessId
      }, {
        onSuccess: (customer) => {
          updateOrder({
            id: editingOrderForCustomer.id,
            customerId: customer.id
          }, {
            onSuccess: () => {
              toast.success('Customer linked to order!');
              setIsCustomerDialogOpen(false);
              setEditingOrderForCustomer(null);
            }
          });
        }
      });
    }
  };

  const handleInitiatePayment = () => {
    if (paymentOrder) {
      initiatePayment({
        orderId: paymentOrder.id,
        phone: paymentOrder.phone,
        amount: paymentOrder.amount
      }, {
        onSuccess: () => {
          toast.info('Payment request sent to customer phone');
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.error || 'Failed to initiate payment');
        }
      });
    }
  };

  const openPaymentForOrder = (order: any) => {
    if (!order.customer?.phone) {
      setEditingOrderForCustomer(order);
      setCustomerForm({ name: '', phone: '', email: '' });
      setIsCustomerDialogOpen(true);
      toast.info('Please add customer phone number first');
      return;
    }

    setPaymentOrder({
      id: order.id,
      amount: order.totalAmount,
      phone: order.customer.phone
    });
    setShowPaymentDialog(true);
  };

  // Calculate order statistics
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const completedOrders = orders.filter(order => order.status === 'paid').length;
  const totalOrderValue = orders
    .filter(order => order.status === 'paid')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2>Sales Tracker</h2>
        <p className="text-muted-foreground text-sm">Umuuzaji wa leo / Today's sales & orders</p>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {/* Sales Header */}
          <div className="flex justify-between items-center">
            <div>
              {lastRefreshTime && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  Last sync: {lastRefreshTime.toLocaleTimeString('en-KE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              )}
            </div>
            <Button 
              onClick={handleRefreshSales}
              size="sm"
              className="flex items-center gap-2"
              disabled={isRefreshing}
            >
              <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Refresh Sales'}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm font-medium">{formatCurrency(todaysRevenue)}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm font-medium">{sales.length}</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-sm font-medium">{formatCurrency(avgTransactionValue)}</p>
                <p className="text-xs text-muted-foreground">Avg Value</p>
              </CardContent>
            </Card>
          </div>

          {/* Refresh Status */}
          {isRefreshing && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-900">Syncing with M-Pesa statements...</p>
                    <p className="text-sm text-blue-700">Fetching latest transactions from your mobile money account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingSales ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : sales.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No sales recorded today
                </p>
              ) : (
                sales.map((sale) => (
                  <div key={sale.id} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{sale.product?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {sale.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(sale.totalAmount)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(sale.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {/* Orders Header */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Manage customer orders</p>
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-yellow-600">Pending: {pendingOrders}</span>
                <span className="text-xs text-green-600">Completed: {completedOrders}</span>
                <span className="text-xs text-blue-600">Total: {formatCurrency(totalOrderValue)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Order
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                  <DialogDescription>
                    Select a customer and add order items.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Customer Selection */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Customer Information</h4>
                    <div className="space-y-2">
                      <Label htmlFor="customerSelect">Select Customer</Label>
                      <Select 
                        value={newOrder.customerId} 
                        onValueChange={(value) => setNewOrder(prev => ({ ...prev, customerId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Search or select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                            </SelectItem>
                          ))}
                          {customers.length === 0 && (
                            <div className="p-2 text-sm text-center text-muted-foreground">
                              No customers found. Create one first.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end">
                         <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-xs"
                          onClick={() => {
                            setCustomerForm({ name: '', phone: '', email: '' });
                            setIsCustomerDialogOpen(true);
                          }}
                        >
                          + Create New Customer
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Add Items */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Order Items</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="itemProduct">Product</Label>
                        <Select 
                          value={newItem.productId.toString()} 
                          onValueChange={(value) => {
                            setNewItem(prev => ({ 
                              ...prev, 
                              productId: parseInt(value)
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - {formatCurrency(product.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="itemQuantity">Qty</Label>
                        <Input
                          id="itemQuantity"
                          type="number"
                          min="1"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addItemToOrder} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </div>

                  {/* Order Items List */}
                  {orderItems.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Items in Order</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {orderItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} × {formatCurrency(item.unitPrice)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{formatCurrency(item.total)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItemFromOrder(item.id)}
                                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total:</span>
                          <span className="font-medium text-lg">{formatCurrency(calculateOrderTotal())}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleCreateOrder} 
                      className="flex-1"
                      disabled={isCreatingOrder || !newOrder.customerId || orderItems.length === 0}
                    >
                      {isCreatingOrder ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                      Create Order
                    </Button>
                    <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-3">
            {/* Customer Dialog */}
            <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingOrderForCustomer ? 'Link Customer to Order' : 'Create New Customer'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="custName">Full Name</Label>
                    <Input
                      id="custName"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custPhone">Phone Number</Label>
                    <Input
                      id="custPhone"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. 0712345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custEmail">Email (Optional)</Label>
                    <Input
                      id="custEmail"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. john@example.com"
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={editingOrderForCustomer ? handleUpdateCustomerForOrder : () => {
                      if (businessId) {
                        createCustomer({ ...customerForm, businessId }, {
                          onSuccess: () => {
                            toast.success('Customer created!');
                            setIsCustomerDialogOpen(false);
                          }
                        });
                      }
                    }}
                    disabled={!customerForm.name || !customerForm.phone}
                  >
                    {editingOrderForCustomer ? 'Save & Link to Order' : 'Create Customer'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={(open) => {
              if (!open) {
                setShowPaymentDialog(false);
                setPaymentOrder(null);
              }
            }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Complete Payment</DialogTitle>
                  <DialogDescription>
                    Initiate M-Pesa payment for Order #{paymentOrder?.id}
                  </DialogDescription>
                </DialogHeader>
                
                {paymentOrder && (
                  <div className="space-y-4 py-4">
                    <div className="text-center space-y-2">
                      <p className="text-2xl font-bold">{formatCurrency(paymentOrder.amount)}</p>
                      <p className="text-sm text-muted-foreground">To be paid by {paymentOrder.phone}</p>
                    </div>

                    {isInitiatingPayment ? (
                      <div className="flex flex-col items-center justify-center py-4 space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm">Sending request...</p>
                      </div>
                    ) : paymentStatusData?.status === 'pending' ? (
                       <div className="flex flex-col items-center justify-center py-4 space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
                        <p className="text-sm font-medium text-yellow-700">Waiting for customer to pay...</p>
                        <p className="text-xs text-muted-foreground">Check customer's phone for M-Pesa prompt</p>
                      </div>
                    ) : (
                      <Button onClick={handleInitiatePayment} className="w-full" size="lg">
                        Send M-Pesa Prompt
                      </Button>
                    )}
                    
                    <div className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowPaymentDialog(false)}
                      >
                        Skip / Pay Later
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {isLoadingOrders ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <p className="text-sm text-muted-foreground">Create your first order to get started</p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString('en-KE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        {order.customer ? (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs font-medium">{order.customer.name}</span>
                            <span className="text-xs text-muted-foreground">({order.customer.phone})</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="mt-1 text-[10px] h-4 bg-orange-50 text-orange-600 border-orange-200">
                            No Customer Linked
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-lg">{formatCurrency(order.totalAmount)}</p>
                        <Badge className={
                          order.status === 'paid' ? 'bg-green-100 text-green-700' : 
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-gray-100 text-gray-700'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1 mb-3">
                      {order.orderItems?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.product?.name} × {item.quantity}</span>
                          <span>{formatCurrency(item.product?.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      {order.status !== 'paid' && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1 h-8 text-xs"
                            onClick={() => openPaymentForOrder(order)}
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Pay Now
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 h-8 text-xs"
                            onClick={() => {
                              setEditingOrderForCustomer(order);
                              setCustomerForm({
                                name: order.customer?.name || '',
                                phone: order.customer?.phone || '',
                                email: order.customer?.email || ''
                              });
                              setIsCustomerDialogOpen(true);
                            }}
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            {order.customer ? 'Edit Customer' : 'Link Customer'}
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Delete this order?')) {
                            deleteOrder(order.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}