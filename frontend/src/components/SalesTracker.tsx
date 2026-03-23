import React, { useState, useEffect } from 'react';
import { RotateCcw, DollarSign, Clock, TrendingUp, Users, Package, CheckCircle, Plus, ShoppingCart, Trash2, Edit3, Loader2, Banknote, CreditCard, Smartphone } from 'lucide-react';
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

type PaymentMethodType = 'mpesa' | 'cash' | 'card';

const PAYMENT_METHODS: {
  value: PaymentMethodType;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  badgeColor: string;
}[] = [
  { value: 'mpesa',  label: 'M-Pesa', icon: Smartphone,  color: 'text-green-600',  bg: 'bg-green-100',  badgeColor: 'bg-green-100 text-green-700'  },
  { value: 'cash',   label: 'Cash',   icon: Banknote,    color: 'text-yellow-600', bg: 'bg-yellow-100', badgeColor: 'bg-yellow-100 text-yellow-700' },
  { value: 'card',   label: 'Card',   icon: CreditCard,  color: 'text-blue-600',   bg: 'bg-blue-100',   badgeColor: 'bg-blue-100 text-blue-700'   },
];

const getPaymentConfig = (method: string) =>
  PAYMENT_METHODS.find(p => p.value === method) ?? PAYMENT_METHODS[0];

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

  const [paymentOrder, setPaymentOrder] = useState<{ id: number; amount: number; phone: string; method: PaymentMethodType } | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [editingOrderForCustomer, setEditingOrderForCustomer] = useState<any>(null);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });

  // Poll for payment status only when M-Pesa is active
  const { data: paymentStatusData } = usePaymentStatus(
    paymentOrder?.id || 0,
    !!paymentOrder && paymentOrder.method === 'mpesa'
  );

  useEffect(() => {
    if (paymentStatusData?.status === 'paid' && paymentOrder) {
      toast.success('Payment received successfully!');
      setShowPaymentDialog(false);
      setPaymentOrder(null);
      refetchSales();
    } else if (paymentStatusData?.status === 'failed' && paymentOrder) {
      toast.error('Payment failed. Please try again.');
    }
  }, [paymentStatusData, paymentOrder, refetchSales]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    notes: '',
    paymentMethod: 'mpesa' as PaymentMethodType,
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
  const [newItem, setNewItem] = useState({ productId: 0, quantity: 1 });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

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
        total: newItem.quantity * product.price,
      };
      setOrderItems(prev => [...prev, item]);
      setNewItem({ productId: 0, quantity: 1 });
    }
  };

  const removeItemFromOrder = (itemId: string) =>
    setOrderItems(prev => prev.filter(item => item.id !== itemId));

  const calculateOrderTotal = () =>
    orderItems.reduce((sum, item) => sum + item.total, 0);

  const handleCreateOrder = () => {
    if (businessId && orderItems.length > 0) {
      const orderPayload: any = {
        businessId,
        items: orderItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
        totalAmount: calculateOrderTotal(),
        paymentMethod: newOrder.paymentMethod,
      };
      if (newOrder.customerId) orderPayload.customerId = parseInt(newOrder.customerId);

      createOrder(orderPayload, {
        onSuccess: (data: any) => {
          toast.success('Order created successfully!');
          const selectedCustomer = customers.find(c => c.id === parseInt(newOrder.customerId));

          if (newOrder.paymentMethod === 'mpesa' && selectedCustomer?.phone) {
            setPaymentOrder({ id: data.id, amount: calculateOrderTotal(), phone: selectedCustomer.phone, method: 'mpesa' });
            setShowPaymentDialog(true);
          } else if (newOrder.paymentMethod === 'cash' || newOrder.paymentMethod === 'card') {
            setPaymentOrder({ id: data.id, amount: calculateOrderTotal(), phone: selectedCustomer?.phone || '', method: newOrder.paymentMethod });
            setShowPaymentDialog(true);
          }

          setNewOrder({ customerId: '', notes: '', paymentMethod: 'mpesa' });
          setOrderItems([]);
          setIsOrderDialogOpen(false);
        },
        onError: () => toast.error('Failed to create order'),
      });
    }
  };

  const handleUpdateCustomerForOrder = () => {
    if (!businessId || !editingOrderForCustomer) return;
    if (customerForm.name && businessId) {
      createCustomer({ name: customerForm.name, phone: customerForm.phone, email: customerForm.email, businessId }, {
        onSuccess: (customer) => {
          updateOrder({ id: editingOrderForCustomer.id, customerId: customer.id }, {
            onSuccess: () => {
              toast.success('Customer linked to order!');
              setIsCustomerDialogOpen(false);
              setEditingOrderForCustomer(null);
            },
          });
        },
      });
    }
  };

  const handleInitiatePayment = () => {
    if (paymentOrder) {
      initiatePayment({ orderId: paymentOrder.id, phone: paymentOrder.phone, amount: paymentOrder.amount }, {
        onSuccess: () => toast.info('Payment request sent to customer phone'),
        onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to initiate payment'),
      });
    }
  };

  // Confirm cash or card payment — marks order as paid immediately
  const handleConfirmOfflinePayment = () => {
    if (paymentOrder) {
      updateOrder({ id: paymentOrder.id, status: 'paid' }, {
        onSuccess: () => {
          toast.success(`${getPaymentConfig(paymentOrder.method).label} payment recorded!`);
          setShowPaymentDialog(false);
          setPaymentOrder(null);
          refetchSales();
        },
        onError: () => toast.error('Failed to record payment'),
      });
    }
  };

  const openPaymentForOrder = (order: any) => {
    const method: PaymentMethodType = order.paymentMethod ?? 'mpesa';
    if (method === 'mpesa' && !order.customer?.phone) {
      setEditingOrderForCustomer(order);
      setCustomerForm({ name: '', phone: '', email: '' });
      setIsCustomerDialogOpen(true);
      toast.info('Please add customer phone number first');
      return;
    }
    setPaymentOrder({ id: order.id, amount: order.totalAmount, phone: order.customer?.phone || '', method });
    setShowPaymentDialog(true);
  };

  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const completedOrders = orders.filter(order => order.status === 'paid').length;
  const totalOrderValue = orders.filter(order => order.status === 'paid').reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <h2>Sales Tracker</h2>
        <p className="text-muted-foreground text-sm">Umuuzaji wa leo / Today's sales & orders</p>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        {/* ── SALES TAB ── */}
        <TabsContent value="sales" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              {lastRefreshTime && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  Last sync: {lastRefreshTime.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <Button onClick={handleRefreshSales} size="sm" className="flex items-center gap-2" disabled={isRefreshing}>
              <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Refresh Sales'}
            </Button>
          </div>

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

          {isRefreshing && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-900">Syncing with M-Pesa statements...</p>
                    <p className="text-sm text-blue-700">Fetching latest transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingSales ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : sales.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No sales recorded today</p>
              ) : (
                sales.map((sale) => {
                  const pmConfig = getPaymentConfig((sale as any).paymentMethod ?? 'mpesa');
                  const Icon = pmConfig.icon;
                  return (
                    <div key={sale.id} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{sale.product?.name || 'Unknown Product'}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {sale.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(sale.totalAmount)}</p>
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pmConfig.badgeColor}`}>
                            <Icon className="w-3 h-3" />
                            {pmConfig.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatTime(sale.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ORDERS TAB ── */}
        <TabsContent value="orders" className="space-y-4">
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

              {/* ── NEW ORDER DIALOG ── */}
              <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Create New Order</DialogTitle>
                    <DialogDescription>Select a customer, payment method, and add items.</DialogDescription>
                  </DialogHeader>

                  {/* Scrollable body */}
                  <div className="space-y-4 overflow-y-auto flex-1 pr-1 py-1">
                    <div className="space-y-3">
                      <h4 className="font-medium">Customer Information</h4>
                      <div className="space-y-2">
                        <Label>Select Customer</Label>
                        <Select value={newOrder.customerId} onValueChange={(value) => setNewOrder(prev => ({ ...prev, customerId: value }))}>
                          <SelectTrigger><SelectValue placeholder="Search or select customer" /></SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                              </SelectItem>
                            ))}
                            {customers.length === 0 && (
                              <div className="p-2 text-sm text-center text-muted-foreground">No customers found. Create one first.</div>
                            )}
                          </SelectContent>
                        </Select>
                        <div className="flex justify-end">
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs"
                            onClick={() => { setCustomerForm({ name: '', phone: '', email: '' }); setIsCustomerDialogOpen(true); }}>
                            + Create New Customer
                          </Button>
                        </div>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {PAYMENT_METHODS.map((pm) => {
                            const Icon = pm.icon;
                            const isSelected = newOrder.paymentMethod === pm.value;
                            return (
                              <button
                                key={pm.value}
                                type="button"
                                onClick={() => setNewOrder(prev => ({ ...prev, paymentMethod: pm.value }))}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-colors ${
                                  isSelected
                                    ? `${pm.bg} ${pm.color} border-current`
                                    : 'border-border text-muted-foreground hover:border-foreground/40'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {pm.label}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {newOrder.paymentMethod === 'mpesa' && 'Customer will receive an M-Pesa prompt on their phone.'}
                          {newOrder.paymentMethod === 'cash' && 'Collect cash and confirm payment manually.'}
                          {newOrder.paymentMethod === 'card' && 'Swipe or tap card and confirm payment manually.'}
                        </p>
                      </div>
                    </div>

                    {/* Add Items */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Order Items</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label>Product</Label>
                          <Select value={newItem.productId.toString()} onValueChange={(value) => setNewItem(prev => ({ ...prev, productId: parseInt(value) }))}>
                            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
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
                          <Label>Qty</Label>
                          <Input type="number" min="1" value={newItem.quantity} onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))} />
                        </div>
                      </div>
                      <Button onClick={addItemToOrder} className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Add Item
                      </Button>
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
                                <p className="text-xs text-muted-foreground">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{formatCurrency(item.total)}</span>
                                <Button variant="ghost" size="sm" onClick={() => removeItemFromOrder(item.id)} className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-2 flex justify-between items-center">
                          <span className="font-medium">Total:</span>
                          <span className="font-medium text-lg">{formatCurrency(calculateOrderTotal())}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sticky footer */}
                  <div className="flex gap-2 pt-3 border-t flex-shrink-0">
                    <Button onClick={handleCreateOrder} className="flex-1" disabled={isCreatingOrder || !newOrder.customerId || orderItems.length === 0}>
                      {isCreatingOrder ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                      Create Order
                    </Button>
                    <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>Cancel</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">

            {/* ── CUSTOMER DIALOG ── */}
            <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingOrderForCustomer ? 'Link Customer to Order' : 'Create New Customer'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="custName">Full Name</Label>
                    <Input id="custName" value={customerForm.name} onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custPhone">Phone Number</Label>
                    <Input id="custPhone" value={customerForm.phone} onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="e.g. 0712345678" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custEmail">Email (Optional)</Label>
                    <Input id="custEmail" value={customerForm.email} onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))} placeholder="e.g. john@example.com" />
                  </div>
                  <Button className="w-full" disabled={!customerForm.name || !customerForm.phone}
                    onClick={editingOrderForCustomer ? handleUpdateCustomerForOrder : () => {
                      if (businessId) {
                        createCustomer({ ...customerForm, businessId }, {
                          onSuccess: () => { toast.success('Customer created!'); setIsCustomerDialogOpen(false); },
                        });
                      }
                    }}>
                    {editingOrderForCustomer ? 'Save & Link to Order' : 'Create Customer'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* ── PAYMENT DIALOG ── */}
            <Dialog open={showPaymentDialog} onOpenChange={(open) => { if (!open) { setShowPaymentDialog(false); setPaymentOrder(null); } }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Complete Payment</DialogTitle>
                  <DialogDescription>
                    {paymentOrder?.method === 'mpesa'
                      ? `Initiate M-Pesa payment for Order #${paymentOrder?.id}`
                      : `Confirm ${getPaymentConfig(paymentOrder?.method ?? 'cash').label} payment for Order #${paymentOrder?.id}`}
                  </DialogDescription>
                </DialogHeader>

                {paymentOrder && (
                  <div className="space-y-4 py-4">
                    <div className="text-center space-y-2">
                      <p className="text-2xl font-bold">{formatCurrency(paymentOrder.amount)}</p>
                      {paymentOrder.method === 'mpesa' && (
                        <p className="text-sm text-muted-foreground">To be paid by {paymentOrder.phone}</p>
                      )}
                    </div>

                    {/* M-Pesa flow */}
                    {paymentOrder.method === 'mpesa' && (
                      isInitiatingPayment ? (
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
                          <Smartphone className="w-4 h-4 mr-2" />
                          Send M-Pesa Prompt
                        </Button>
                      )
                    )}

                    {/* Cash flow */}
                    {paymentOrder.method === 'cash' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <Banknote className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                          <p className="text-sm text-yellow-800">
                            Collect <strong>{formatCurrency(paymentOrder.amount)}</strong> in cash from the customer, then confirm below.
                          </p>
                        </div>
                        <Button onClick={handleConfirmOfflinePayment} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" size="lg">
                          <Banknote className="w-4 h-4 mr-2" />
                          Confirm Cash Received
                        </Button>
                      </div>
                    )}

                    {/* Card flow */}
                    {paymentOrder.method === 'card' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <p className="text-sm text-blue-800">
                            Process <strong>{formatCurrency(paymentOrder.amount)}</strong> on your card terminal, then confirm below.
                          </p>
                        </div>
                        <Button onClick={handleConfirmOfflinePayment} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Confirm Card Payment
                        </Button>
                      </div>
                    )}

                    <div className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => setShowPaymentDialog(false)}>
                        Skip / Pay Later
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Order cards */}
            {isLoadingOrders ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <p className="text-sm text-muted-foreground">Create your first order to get started</p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => {
                const pmConfig = getPaymentConfig((order as any).paymentMethod ?? 'mpesa');
                const Icon = pmConfig.icon;
                return (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {order.customer ? (
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs font-medium">{order.customer.name}</span>
                              <span className="text-xs text-muted-foreground">({order.customer.phone})</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="mt-1 text-[10px] h-4 bg-orange-50 text-orange-600 border-orange-200">No Customer Linked</Badge>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-medium text-lg">{formatCurrency(order.totalAmount)}</p>
                          <Badge className={order.status === 'paid' ? 'bg-green-100 text-green-700' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}>
                            {order.status}
                          </Badge>
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pmConfig.badgeColor}`}>
                              <Icon className="w-3 h-3" />
                              {pmConfig.label}
                            </span>
                          </div>
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
                            <Button variant="default" size="sm" className="flex-1 h-8 text-xs" onClick={() => openPaymentForOrder(order)}>
                              <DollarSign className="w-3 h-3 mr-1" />
                              Pay Now
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => {
                              setEditingOrderForCustomer(order);
                              setCustomerForm({ name: order.customer?.name || '', phone: order.customer?.phone || '', email: order.customer?.email || '' });
                              setIsCustomerDialogOpen(true);
                            }}>
                              <Edit3 className="w-3 h-3 mr-1" />
                              {order.customer ? 'Edit Customer' : 'Link Customer'}
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          onClick={() => { if (confirm('Delete this order?')) deleteOrder(order.id); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}