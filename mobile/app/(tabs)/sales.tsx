import React, { useState, useEffect, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  RotateCcw,
  DollarSign,
  Clock,
  TrendingUp,
  Package,
  CheckCircle,
  Plus,
  ShoppingCart,
  Trash2,
  CreditCard,
  Smartphone,
  Banknote,
  Edit3,
  Users,
} from "lucide-react-native";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useSales } from "../../hooks/api/useSales";
import { useProducts } from "../../hooks/api/useProducts";
import { useOrders, OrderStatus } from "../../hooks/api/useOrders";
import { useCustomers, useCreateCustomer } from "../../hooks/api/useCustomers";
import { useInitiatePayment, usePaymentStatus } from "../../hooks/api/usePayments";
import { TAB_BAR_SCROLL_PADDING } from "../../constants/tabBar";

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
  status: OrderStatus;
  createdAt: string;
  notes?: string;
}

export default function SalesTab() {
  const params = useLocalSearchParams<{ segment?: string; action?: string }>();
  const [activeTab, setActiveTab] = useState<"sales" | "orders">("sales");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  useEffect(() => {
    const raw = params.segment;
    const s = Array.isArray(raw) ? raw[0] : raw;
    if (s === "orders" || s === "sales") setActiveTab(s);
  }, [params.segment]);

  // API hooks
  const {
    sales: apiSales,
    isLoading: salesLoading,
    refetch: refetchSales,
  } = useSales();
  const { products, isLoading: productsLoading } = useProducts();
  const {
    orders: apiOrders,
    isLoading: ordersLoading,
    createOrder,
    updateOrder,
  } = useOrders();

  const { data: customers = [] } = useCustomers();
  const { mutateAsync: createCustomerApi } = useCreateCustomer();
  const { mutateAsync: initiatePayment, isPending: isInitiatingPayment } = useInitiatePayment();
  const { createSale, isCreating: isCreatingSale } = useSales();

  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "" });
  const paymentOutcomeHandledRef = useRef(false);

  useEffect(() => {
    const action = params.action;
    if (action === "new-sale") {
      setIsSaleDialogOpen(true);
    } else if (action === "new-order") {
      setIsOrderDialogOpen(true);
    }
  }, [params.action]);

  const paymentStatusData = usePaymentStatus(
    paymentOrder?.id || 0,
    !!paymentOrder && paymentOrder.method === "mpesa"
  );

  useEffect(() => {
    paymentOutcomeHandledRef.current = false;
  }, [paymentOrder?.id]);

  useEffect(() => {
    if (!paymentOrder) return;
    const status = paymentStatusData.data?.status;
    if (!status || paymentOutcomeHandledRef.current) return;

    if (status === "paid") {
      paymentOutcomeHandledRef.current = true;
      Alert.alert("Success", "Payment received successfully!");
      setShowPaymentDialog(false);
      setPaymentOrder(null);
      void refetchSales();
    } else if (status === "failed" || status === "canceled" || status === "cancelled") {
      paymentOutcomeHandledRef.current = true;
      Alert.alert("Error", "Payment did not complete. You can try again from the order.");
      setShowPaymentDialog(false);
      setPaymentOrder(null);
    }
  }, [paymentStatusData.data?.status, paymentOrder, refetchSales]);

  // Map API data to component format
  const sales: Sale[] = apiSales.map((sale) => ({
    id: sale.id.toString(),
    product: sale.product?.name || "Unknown Product",
    quantity: sale.quantity,
    unitPrice: sale.product?.price || 0,
    total: sale.totalAmount,
    paymentMethod: "Cash", // Default for now, can be enhanced
    timestamp: sale.createdAt,
    customer: sale.order?.customer?.name,
  }));

  const orders: Order[] = apiOrders.map((order) => ({
    id: order.id.toString(),
    customerName: order.customer?.name || "Walk-in Customer",
    customerPhone: order.customer?.phone || "",
    items:
      order.orderItems?.map((item) => ({
        id: item.id.toString(),
        product: item.product?.name || "Unknown",
        quantity: item.quantity,
        unitPrice: item.product?.price || 0,
        total: item.quantity * (item.product?.price || 0),
      })) || [],
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
  }));

  const mainProducts = products.map((p) => ({ name: p.name, price: p.price }));

  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerId: "",
    notes: "",
    paymentMethod: "mpesa",
  });
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const [newItem, setNewItem] = useState({
    product: "Chick Mash 50kg",
    quantity: "1",
    unitPrice: "2800",
  });
  const [showProductSelect, setShowProductSelect] = useState(false);

  useEffect(() => {
    // Load initial data
    refetchSales();
  }, []);

  const formatCurrency = (amount: number) =>
    `KES ${amount.toLocaleString("en-KE")}`;
  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleDateString("en-KE");

  const todaysSales = sales.filter(
    (sale) =>
      new Date(sale.timestamp).toDateString() === new Date().toDateString(),
  );
  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  const avgTransactionValue =
    todaysSales.length > 0 ? todaysRevenue / todaysSales.length : 0;

  const handleRefreshSales = async () => {
    setIsRefreshing(true);
    await refetchSales();
    setLastRefreshTime(new Date());
    setIsRefreshing(false);
  };

  const addItemToOrder = () => {
    const qty = parseInt(newItem.quantity) || 0;
    const price = parseFloat(newItem.unitPrice) || 0;
    if (newItem.product && qty > 0 && price > 0) {
      setOrderItems((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          product: newItem.product,
          quantity: qty,
          unitPrice: price,
          total: qty * price,
        },
      ]);
      setNewItem({
        product: "Chick Mash 50kg",
        quantity: "1",
        unitPrice: "2800",
      });
    }
  };

  const calculateOrderTotal = () =>
    orderItems.reduce((sum, item) => sum + item.total, 0);

  const handleCreateOrder = async () => {
    if (newOrder.customerId && orderItems.length > 0) {
      try {
        const order: any = await createOrder({
          customerId: parseInt(newOrder.customerId),
          totalAmount: calculateOrderTotal(),
          status: OrderStatus.pending,
          paymentMethod: newOrder.paymentMethod as any,
          orderItems: orderItems.map(i => ({ productId: parseInt(i.id), quantity: i.quantity })) // Simplified product matching
        });
        
        const selectedCustomer = customers.find(c => c.id.toString() === newOrder.customerId);
        
        if (newOrder.paymentMethod === "mpesa" && selectedCustomer?.phone) {
          setPaymentOrder({ id: order.id, amount: calculateOrderTotal(), phone: selectedCustomer.phone, method: "mpesa" });
          setShowPaymentDialog(true);
        } else if (newOrder.paymentMethod === "cash" || newOrder.paymentMethod === "card") {
          setPaymentOrder({ id: order.id, amount: calculateOrderTotal(), phone: selectedCustomer?.phone || "", method: newOrder.paymentMethod });
          setShowPaymentDialog(true);
        } else {
          Alert.alert("Success", "Order created successfully");
        }

        setNewOrder({ customerId: "", notes: "", paymentMethod: "mpesa" });
        setOrderItems([]);
        setIsOrderDialogOpen(false);
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to create order");
      }
    } else {
      Alert.alert("Error", "Please select a customer and add items");
    }
  };

  const handleInitiatePayment = async () => {
    if (paymentOrder) {
      try {
        await initiatePayment({ orderId: paymentOrder.id, phone: paymentOrder.phone, amount: paymentOrder.amount });
        Alert.alert("Info", "Payment request sent to customer phone");
      } catch (error: any) {
        Alert.alert("Error", error.response?.data?.error || "Failed to initiate payment");
      }
    }
  };

  const handleConfirmOfflinePayment = async () => {
    if (paymentOrder) {
      try {
        await updateOrder({ id: paymentOrder.id, data: { status: OrderStatus.paid } });
        Alert.alert("Success", `Payment recorded!`);
        setShowPaymentDialog(false);
        setPaymentOrder(null);
        refetchSales();
      } catch (error: any) {
        Alert.alert("Error", "Failed to record payment");
      }
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateOrder({
        id: parseInt(id),
        data: { status },
      });
    } catch (error: any) {
      Alert.alert("Error", error.friendlyMessage || "Failed to update order");
    }
  };

  // Remove clearCompletedOrders for now as it would require delete API
  const clearCompletedOrders = () => {
    Alert.alert("Info", "Clear completed orders feature coming soon");
  };

  const handleCreateSale = async (data: { productId: string; quantity: string }) => {
    const qty = parseInt(data.quantity);
    const prodId = parseInt(data.productId);
    const product = products.find(p => p.id === prodId);
    
    if (!prodId || qty <= 0 || !product) {
      Alert.alert("Error", "Please select a product and valid quantity");
      return;
    }

    try {
      await createSale({
        productId: prodId,
        quantity: qty,
        totalAmount: product.price * qty,
        orderId: 0, // Direct sale
      });
      setIsSaleDialogOpen(false);
      refetchSales();
      Alert.alert("Success", "Sale recorded successfully");
    } catch (error: any) {
      Alert.alert("Error", error.friendlyMessage || "Failed to record sale");
    }
  };

  const [selectedProductId, setSelectedProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [showSaleProductSelect, setShowSaleProductSelect] = useState(false);

  const pendingOrders = orders.filter((o) => o.status === OrderStatus.pending).length;
  const completedOrders = orders.filter((o) => o.status === OrderStatus.paid).length;
  const totalOrderValue = orders
    .filter((o) => o.status === OrderStatus.paid)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-3 pb-2">
        <View className="items-center py-2 mb-2">
          <Text className="text-xl font-bold text-gray-900">Sales Tracker</Text>
          <Text className="text-sm text-gray-500">
            Umuuzaji wa leo / Today's sales & orders
          </Text>
        </View>

        <View className="flex-row bg-gray-200 rounded-lg mb-2 max-w-sm self-center w-full">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === "sales" ? "bg-white shadow" : ""}`}
            onPress={() => setActiveTab("sales")}
          >
            <Text
              className={`font-medium ${activeTab === "sales" ? "text-gray-900" : "text-gray-500"}`}
            >
              Sales
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === "orders" ? "bg-white shadow" : ""}`}
            onPress={() => setActiveTab("orders")}
          >
            <Text
              className={`font-medium ${activeTab === "orders" ? "text-gray-900" : "text-gray-500"}`}
            >
              Orders
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SCROLL_PADDING }}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
      >
        {activeTab === "sales" ? (
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <TouchableOpacity
                  className="flex-row items-center bg-blue-600 px-3 py-2 rounded-lg mr-2"
                  onPress={() => setIsSaleDialogOpen(true)}
                >
                  <Plus size={16} color="white" />
                  <Text className="text-white text-sm font-medium ml-1">
                    New Sale
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center bg-gray-900 px-3 py-2 rounded-lg"
                  onPress={handleRefreshSales}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <RotateCcw size={16} color="white" />
                  )}
                  <Text className="text-white text-sm font-medium ml-2">
                    {isRefreshing ? "Syncing..." : "Refresh"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View>
                {lastRefreshTime && (
                  <Text className="text-[10px] text-green-600">
                    Synced: {formatTime(lastRefreshTime.toISOString())}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row flex-wrap justify-between mb-4">
              <Card className="w-[31%]">
                <CardContent className="p-3 items-center">
                  <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mb-2">
                    <DollarSign size={16} color="#16a34a" />
                  </View>
                  <Text className="text-sm font-bold text-gray-900">
                    {formatCurrency(todaysRevenue)}
                  </Text>
                  <Text className="text-[10px] text-gray-500 text-center">
                    Revenue
                  </Text>
                </CardContent>
              </Card>
              <Card className="w-[31%]">
                <CardContent className="p-3 items-center">
                  <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center mb-2">
                    <Package size={16} color="#2563eb" />
                  </View>
                  <Text className="text-sm font-bold text-gray-900">
                    {todaysSales.length}
                  </Text>
                  <Text className="text-[10px] text-gray-500 text-center">
                    Transactions
                  </Text>
                </CardContent>
              </Card>
              <Card className="w-[31%]">
                <CardContent className="p-3 items-center">
                  <View className="w-8 h-8 bg-primary-100 rounded-lg items-center justify-center mb-2">
                    <TrendingUp size={16} color="#006b5f" />
                  </View>
                  <Text className="text-sm font-bold text-gray-900">
                    {formatCurrency(avgTransactionValue)}
                  </Text>
                  <Text className="text-[10px] text-gray-500 text-center">
                    Avg Value
                  </Text>
                </CardContent>
              </Card>
            </View>

            {isRefreshing && (
              <Card className="mb-4 bg-blue-50 border-blue-200">
                <CardContent className="flex-row items-center p-4">
                  <ActivityIndicator
                    size="small"
                    color="#2563eb"
                    className="mr-3"
                  />
                  <View>
                    <Text className="font-bold text-blue-900">
                      Syncing with M-Pesa...
                    </Text>
                    <Text className="text-xs text-blue-700">
                      Fetching latest transactions
                    </Text>
                  </View>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2">
                      <Clock size={20} color="#374151" />
                    </View>
                    <Text className="text-base font-bold">Recent Sales</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysSales.map((sale) => (
                  <View
                    key={sale.id}
                    className="flex-row justify-between mb-3 p-3 bg-gray-100 rounded-lg"
                  >
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900">
                        {sale.product}
                      </Text>
                      <Text className="text-xs text-gray-600">
                        {sale.quantity} × {formatCurrency(sale.unitPrice)}
                      </Text>
                      {sale.customer && (
                        <Text className="text-xs text-gray-500 mt-1">
                          {sale.customer}
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="font-bold text-gray-900">
                        {formatCurrency(sale.total)}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Badge variant="secondary" className="mr-2">
                          {sale.paymentMethod}
                        </Badge>
                        <Text className="text-[10px] text-gray-500">
                          {formatTime(sale.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                {todaysSales.length === 0 && (
                  <Text className="text-center text-gray-500 py-4">
                    No sales recorded today
                  </Text>
                )}
              </CardContent>
            </Card>
          </View>
        ) : (
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-sm text-gray-600">
                  Pending: {pendingOrders} | Paid: {completedOrders}
                </Text>
                <Text className="text-sm font-bold text-blue-600">
                  Total: {formatCurrency(totalOrderValue)}
                </Text>
              </View>
              <View className="flex-row">
                {completedOrders > 0 && (
                  <TouchableOpacity
                    onPress={clearCompletedOrders}
                    className="mr-2 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <Text className="text-gray-700 text-xs font-medium">
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  className="flex-row items-center bg-gray-900 px-3 py-2 rounded-lg"
                  onPress={() => setIsOrderDialogOpen(true)}
                >
                  <Plus size={16} color="white" />
                  <Text className="text-white text-xs font-medium ml-1">
                    New Order
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {orders.length === 0 ? (
              <Card>
                <CardContent className="p-8 items-center">
                  <View className="mb-4">
                    <ShoppingCart size={48} color="#9ca3af" />
                  </View>
                  <Text className="text-gray-500 font-bold mb-1">
                    No orders yet
                  </Text>
                  <Text className="text-sm text-gray-400">
                    Create your first order to get started
                  </Text>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="mb-4">
                  <CardContent className="p-4">
                    <View className="flex-row justify-between items-start mb-3">
                      <View>
                        <Text className="font-bold text-gray-900">
                          {order.customerName}
                        </Text>
                        <Text className="text-xs text-gray-600">
                          {order.customerPhone}
                        </Text>
                        <Text className="text-[10px] text-gray-400">
                          {formatDate(order.createdAt)}{" "}
                          {formatTime(order.createdAt)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-bold text-lg text-gray-900 mb-1">
                          {formatCurrency(order.totalAmount)}
                        </Text>
                        {order.status === OrderStatus.drafted && (
                          <Badge variant="secondary" className="bg-gray-100" textClassName="text-gray-700">
                            Draft
                          </Badge>
                        )}
                        {order.status === OrderStatus.created && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 border-blue-200"
                            textClassName="text-blue-700"
                          >
                            Created
                          </Badge>
                        )}
                        {order.status === OrderStatus.pending && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 border-yellow-200"
                            textClassName="text-yellow-700"
                          >
                            Pending
                          </Badge>
                        )}
                        {order.status === OrderStatus.paid && (
                          <Badge
                            variant="default"
                            className="bg-green-100"
                            textClassName="text-green-700"
                          >
                            Paid
                          </Badge>
                        )}
                        {order.status === OrderStatus.canceled && (
                          <Badge variant="destructive" textClassName="text-red-700">
                            Cancelled
                          </Badge>
                        )}
                        {order.status === OrderStatus.failed && (
                          <Badge variant="destructive" textClassName="text-red-800">
                            Failed
                          </Badge>
                        )}
                      </View>
                    </View>
                    <View className="mb-3">
                      {order.items.map((item, idx) => (
                        <View
                          key={idx}
                          className="flex-row justify-between mt-1"
                        >
                          <Text className="text-sm text-gray-700">
                            {item.product} × {item.quantity}
                          </Text>
                          <Text className="text-sm text-gray-900">
                            {formatCurrency(item.total)}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {order.notes ? (
                      <Text className="text-xs text-gray-500 italic mb-3">
                        Note: {order.notes}
                      </Text>
                    ) : null}

                    <View className="flex-row pt-2 border-t border-gray-100">
                      {order.status === OrderStatus.pending && (
                        <>
                          <TouchableOpacity
                            onPress={() =>
                              updateOrderStatus(order.id, OrderStatus.paid)
                            }
                            className="flex-1 bg-green-600 py-2 rounded-lg mr-2 items-center"
                          >
                            <Text className="text-white font-medium">
                              Mark paid
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              updateOrderStatus(order.id, OrderStatus.canceled)
                            }
                            className="flex-1 border border-gray-300 py-2 rounded-lg items-center"
                          >
                            <Text className="text-gray-700 font-medium">
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {order.status === OrderStatus.created && (
                        <>
                          <TouchableOpacity
                            onPress={() =>
                              updateOrderStatus(order.id, OrderStatus.pending)
                            }
                            className="flex-1 bg-gray-900 py-2 rounded-lg mr-2 items-center"
                          >
                            <Text className="text-white font-medium">
                              Confirm
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              updateOrderStatus(order.id, OrderStatus.canceled)
                            }
                            className="flex-1 border border-gray-300 py-2 rounded-lg items-center"
                          >
                            <Text className="text-gray-700 font-medium">
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {order.status === OrderStatus.drafted && (
                        <TouchableOpacity
                          onPress={() =>
                            updateOrderStatus(order.id, OrderStatus.pending)
                          }
                          className="flex-1 bg-gray-900 py-2 rounded-lg items-center"
                        >
                          <Text className="text-white font-medium">
                            Submit order
                          </Text>
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

      {/* New Sale Modal */}
      <Modal
        visible={isSaleDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsSaleDialogOpen(false)}
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
            <Text className="text-lg font-bold">Record Direct Sale</Text>
            <TouchableOpacity
              onPress={() => setIsSaleDialogOpen(false)}
              className="p-2"
            >
              <Text className="text-gray-500 font-bold text-lg">X</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text className="font-bold text-gray-900 mb-3">
              Product Information
            </Text>
            <TouchableOpacity
              onPress={() => setShowSaleProductSelect(!showSaleProductSelect)}
              className="bg-white border border-gray-300 p-3 rounded-lg mb-3 flex-row justify-between items-center"
            >
              <Text className={selectedProductId ? "text-gray-900" : "text-gray-400"}>
                {selectedProductId
                  ? products.find((p) => p.id.toString() === selectedProductId)?.name || "Select Product"
                  : "Select Product"}
              </Text>
              <Text className="text-gray-400">▼</Text>
            </TouchableOpacity>

            {showSaleProductSelect && (
              <View className="bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden shadow-sm max-h-[200px]">
                <ScrollView nestedScrollEnabled>
                  {products.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      className="p-3 border-b border-gray-100"
                      onPress={() => {
                        setSelectedProductId(p.id.toString());
                        setShowSaleProductSelect(false);
                      }}
                    >
                      <Text className="font-medium">{p.name}</Text>
                      <Text className="text-xs text-gray-500">{formatCurrency(p.price)} • Stock: {p.stockQuantity}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text className="text-xs text-gray-500 mb-1">Quantity</Text>
            <TextInput
              className="bg-white border border-gray-300 p-3 rounded-lg mb-6 text-gray-900 font-bold"
              placeholder="1"
              keyboardType="numeric"
              value={saleQuantity}
              onChangeText={setSaleQuantity}
            />

            {selectedProductId && (
              <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                <Text className="text-blue-900 font-bold text-center text-lg">
                  Total: {formatCurrency((products.find(p => p.id.toString() === selectedProductId)?.price || 0) * (parseInt(saleQuantity) || 0))}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => handleCreateSale({ productId: selectedProductId, quantity: saleQuantity })}
              disabled={isCreatingSale}
              className="bg-gray-900 h-14 rounded-xl items-center justify-center shadow-lg"
            >
              {isCreatingSale ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Confirm Sale</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* New Order Modal */}
      <Modal
        visible={isOrderDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOrderDialogOpen(false)}
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
            <Text className="text-lg font-bold">Create New Order</Text>
            <TouchableOpacity
              onPress={() => setIsOrderDialogOpen(false)}
              className="p-2"
            >
              <Text className="text-gray-500 font-bold text-lg">X</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text className="font-bold text-gray-900 mb-3">
              Customer Information
            </Text>
            <TouchableOpacity
              onPress={() => setShowCustomerSelect(!showCustomerSelect)}
              className="bg-white border border-gray-300 p-3 rounded-lg mb-3 flex-row justify-between items-center"
            >
              <Text className={newOrder.customerId ? "text-gray-900" : "text-gray-400"}>
                {newOrder.customerId
                  ? customers.find((c) => c.id.toString() === newOrder.customerId)?.name || "Select Customer"
                  : "Select Customer"}
              </Text>
              <Text className="text-gray-400">▼</Text>
            </TouchableOpacity>

            {showCustomerSelect && (
              <View className="bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden shadow-sm">
                <TouchableOpacity
                  className="p-3 border-b border-gray-100 flex-row items-center bg-gray-50"
                  onPress={() => {
                    setShowCustomerSelect(false);
                    setIsCustomerDialogOpen(true);
                  }}
                >
                  <Plus size={16} color="#16a34a" />
                  <Text className="ml-2 text-green-600 font-medium">Add New Customer</Text>
                </TouchableOpacity>
                {customers.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    className="p-3 border-b border-gray-100"
                    onPress={() => {
                      setNewOrder({ ...newOrder, customerId: c.id.toString() });
                      setShowCustomerSelect(false);
                    }}
                  >
                    <Text className="font-medium">{c.name}</Text>
                    {c.phone && <Text className="text-xs text-gray-500">{c.phone}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              className="bg-white border border-gray-300 p-3 rounded-lg mb-6"
              placeholder="Notes (Optional)"
              value={newOrder.notes}
              onChangeText={(t) => setNewOrder({ ...newOrder, notes: t })}
            />

            <Text className="font-bold text-gray-900 mb-3">Payment Method</Text>
            <View className="flex-row gap-2 mb-6">
              {[
                { id: "mpesa", label: "M-Pesa", icon: Smartphone },
                { id: "cash", label: "Cash", icon: Banknote },
                { id: "card", label: "Card", icon: CreditCard },
              ].map((method) => {
                const Icon = method.icon;
                const isActive = newOrder.paymentMethod === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    onPress={() => setNewOrder({ ...newOrder, paymentMethod: method.id as any })}
                    className={`flex-1 p-3 rounded-lg flex-row items-center justify-center border ${
                      isActive ? "bg-green-50 border-green-500" : "bg-white border-gray-200"
                    }`}
                  >
                    <Icon size={16} color={isActive ? "#16a34a" : "#6b7280"} />
                    <Text className={`ml-2 font-medium ${isActive ? "text-green-700" : "text-gray-600"}`}>
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="font-bold text-gray-900 mb-3">Add Item</Text>
            <View className="flex-row gap-2 mb-3">
              <TouchableOpacity
                onPress={() => setShowProductSelect(!showProductSelect)}
                className="flex-[2] bg-white border border-gray-300 p-3 rounded-lg flex-row justify-between items-center"
              >
                <Text className="text-gray-900">{newItem.product}</Text>
                <Text className="text-gray-400">▼</Text>
              </TouchableOpacity>
              <TextInput
                className="flex-1 bg-white border border-gray-300 p-3 rounded-lg"
                placeholder="Qty"
                keyboardType="numeric"
                value={newItem.quantity}
                onChangeText={(t) => setNewItem({ ...newItem, quantity: t })}
              />
              <TouchableOpacity
                onPress={addItemToOrder}
                className="w-12 h-12 bg-green-600 rounded-lg items-center justify-center"
              >
                <Plus size={24} color="white" />
              </TouchableOpacity>
            </View>

            {showProductSelect && (
              <View className="bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden shadow-sm max-h-[150px]">
                <ScrollView nestedScrollEnabled>
                  {mainProducts.map((p, idx) => (
                    <TouchableOpacity
                      key={idx}
                      className="p-3 border-b border-gray-100"
                      onPress={() => {
                        setNewItem({
                          ...newItem,
                          product: p.name,
                          unitPrice: p.price.toString(),
                        });
                        setShowProductSelect(false);
                      }}
                    >
                      <Text className="font-medium">{p.name}</Text>
                      <Text className="text-xs text-gray-500">{formatCurrency(p.price)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {orderItems.length > 0 && (
              <View className="bg-white border border-gray-200 rounded-lg mb-6">
                {orderItems.map((item, idx) => (
                  <View
                    key={idx}
                    className="flex-row justify-between p-3 border-b border-gray-100"
                  >
                    <View>
                      <Text className="font-medium text-gray-900">
                        {item.product}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="font-bold mr-3">
                        {formatCurrency(item.total)}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setOrderItems(orderItems.filter((_, i) => i !== idx))
                        }
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <View className="p-3 bg-gray-50 flex-row justify-between">
                  <Text className="font-bold">Total</Text>
                  <Text className="font-bold text-lg text-green-700">
                    {formatCurrency(calculateOrderTotal())}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleCreateOrder}
              disabled={
                !newOrder.customerId ||
                orderItems.length === 0
              }
              className={`py-4 rounded-xl items-center flex-row justify-center mt-4 ${!newOrder.customerId || orderItems.length === 0 ? "bg-gray-300" : "bg-green-600"}`}
            >
              <View className="mr-2">
                <ShoppingCart size={20} color="white" />
              </View>
              <Text className="text-white font-bold text-lg">Create Order</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Customer Modal */}
      <Modal visible={isCustomerDialogOpen} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-xl p-6">
            <Text className="text-lg font-bold mb-4">Add New Customer</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-3"
              placeholder="Customer Name"
              value={customerForm.name}
              onChangeText={(t) => setCustomerForm({ ...customerForm, name: t })}
            />
            <TextInput
              className="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-6"
              placeholder="Phone (+254...)"
              keyboardType="phone-pad"
              value={customerForm.phone}
              onChangeText={(t) => setCustomerForm({ ...customerForm, phone: t })}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 p-3 items-center border border-gray-200 rounded-lg"
                onPress={() => setIsCustomerDialogOpen(false)}
              >
                <Text className="font-medium text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 p-3 items-center bg-green-600 rounded-lg"
                onPress={async () => {
                  if (customerForm.name) {
                    try {
                      await createCustomerApi(customerForm);
                      setCustomerForm({ name: "", phone: "" });
                      setIsCustomerDialogOpen(false);
                    } catch (e: any) {
                      Alert.alert("Error", e.message);
                    }
                  }
                }}
              >
                <Text className="font-medium text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Processing Modal */}
      <Modal visible={showPaymentDialog} animationType="slide" presentationStyle="formSheet">
        <View className="flex-1 bg-gray-50 p-6">
          <Text className="text-2xl font-bold mb-2 text-center text-gray-900">
            {paymentOrder?.method === "mpesa" ? "M-Pesa Payment" : "Offline Payment"}
          </Text>
          <Text className="text-gray-500 mb-8 text-center">
            {paymentOrder?.method === "mpesa" ? "Send prompt to customer's phone" : "Confirm payment received"}
          </Text>

          <View className="bg-white rounded-xl p-6 border border-gray-200 mb-6 items-center shadow-sm">
            <Text className="text-gray-500 mb-1 font-medium">Amount Due</Text>
            <Text className="text-4xl font-bold text-gray-900 mb-6">
              {formatCurrency(paymentOrder?.amount || 0)}
            </Text>

            {paymentOrder?.method === "mpesa" ? (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2 w-full">Customer Phone Number</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-300 w-full p-4 rounded-xl text-lg text-center font-medium"
                  value={paymentOrder?.phone || ""}
                  onChangeText={(t) => setPaymentOrder({ ...paymentOrder, phone: t })}
                  keyboardType="phone-pad"
                />
              </>
            ) : (
              <View className="bg-gray-50 p-4 rounded-lg w-full flex-row justify-center items-center">
                {paymentOrder?.method === "cash" ? <Banknote size={24} color="#16a34a" /> : <CreditCard size={24} color="#16a34a" />}
                <Text className="ml-3 font-medium text-gray-700 text-lg">
                  {paymentOrder?.method === "cash" ? "Cash Transaction" : "Card Transaction"}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-1" />

          {paymentOrder?.method === "mpesa" ? (
            <TouchableOpacity
              onPress={handleInitiatePayment}
              disabled={isInitiatingPayment}
              className={`w-full py-4 rounded-xl flex-row justify-center items-center mb-3 shadow-sm ${isInitiatingPayment ? "bg-green-400" : "bg-green-600"}`}
            >
              {isInitiatingPayment ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Smartphone size={20} color="white" />
              )}
              <Text className="text-white font-bold text-lg ml-2">
                {isInitiatingPayment ? "Sending Prompt..." : "Send M-Pesa Prompt"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleConfirmOfflinePayment}
              className="w-full py-4 rounded-xl flex-row justify-center items-center mb-3 bg-green-600 shadow-sm"
            >
              <CheckCircle size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                Confirm Payment Received
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setShowPaymentDialog(false)}
            className="w-full py-4 rounded-xl justify-center items-center"
          >
            <Text className="text-gray-500 font-bold">Skip for now</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
