import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Package,
  Users,
  Lightbulb,
  Target,
  Truck,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";

// Mock data stays the same
const mockData = {
  dailySales: 45000,
  cashIn: 52000,
  cashOut: 7000,
  inventoryAlerts: 3,
  weeklyGrowth: 12.5,
  topProducts: [
    {
      name: "Chick Mash 50kg",
      sold: 45,
      revenue: 22500,
      category: "Poultry Feed",
    },
    {
      name: "Layers Feed 50kg",
      sold: 38,
      revenue: 19000,
      category: "Poultry Feed",
    },
    {
      name: "Growers Feed 50kg",
      sold: 32,
      revenue: 16000,
      category: "Poultry Feed",
    },
    {
      name: "Dairy Meal 50kg",
      sold: 24,
      revenue: 12000,
      category: "Livestock Feed",
    },
  ],
  lowStockItems: [
    {
      name: "Chick Mash 50kg",
      stock: 15,
      threshold: 50,
      category: "Poultry Feed",
    },
    {
      name: "Layers Mash 50kg",
      stock: 22,
      threshold: 60,
      category: "Poultry Feed",
    },
    {
      name: "Broiler Starter 50kg",
      stock: 5,
      threshold: 20,
      category: "Poultry Feed",
    },
  ],
};

const growthTips = [
  {
    icon: Target,
    title: "Poultry Feed Focus",
    tip: "Promote chick mash, layers mash, and growers mash as your premium poultry feed line.",
    impact: "High",
  },
  {
    icon: Truck,
    title: "Bulk Poultry Orders",
    tip: "Offer volume discounts on 10+ bags of layers mash.",
    impact: "Medium",
  },
  {
    icon: Heart,
    title: "Feed Quality Guarantee",
    tip: "Highlight that your chick mash and growers mash meet KEB standards.",
    impact: "High",
  },
];

export default function Dashboard() {
  const [showGrowthTips, setShowGrowthTips] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const data = await AsyncStorage.getItem("numeraai_userdata");
      if (data) setUserData(JSON.parse(data));
    }
    loadData();
  }, []);

  const formatCurrency = (amount: number) =>
    `KES ${amount.toLocaleString("en-KE")}`;
  const firstName = userData?.firstName || "there";

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* Welcome Message */}
      <View className="items-center py-6">
        <Text className="text-xl font-bold text-gray-900">
          Good morning, {firstName}!
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          Here's your business overview
        </Text>
      </View>

      {/* Key Metrics Grid */}
      <View className="flex-row flex-wrap justify-between">
        {[
          {
            label: "Today's Sales",
            val: formatCurrency(mockData.dailySales),
            icon: TrendingUp,
            color: "#16a34a",
            bg: "bg-green-100",
          },
          {
            label: "Cash In",
            val: formatCurrency(mockData.cashIn),
            icon: DollarSign,
            color: "#2563eb",
            bg: "bg-blue-100",
          },
          {
            label: "Cash Out",
            val: formatCurrency(mockData.cashOut),
            icon: TrendingDown,
            color: "#dc2626",
            bg: "bg-red-100",
          },
          {
            label: "Inventory",
            val: `${mockData.inventoryAlerts} items`,
            icon: AlertTriangle,
            color: "#ea580c",
            bg: "bg-orange-100",
          },
        ].map((item, i) => (
          <View key={i} className="w-[48%] mb-3">
            <Card>
              <CardContent className="flex-row items-center p-3">
                <View
                  className={`w-9 h-9 ${item.bg} rounded-lg items-center justify-center mr-2`}
                >
                  <item.icon size={18} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] text-gray-500 uppercase font-bold">
                    {item.label}
                  </Text>
                  <Text className="font-bold text-gray-900 text-xs mt-0.5">
                    {item.val}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </View>
        ))}
      </View>

      {/* Weekly Growth */}
      <Card className="mb-4">
        <CardHeader>
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-bold">Weekly Growth</Text>
            <Badge className="bg-green-100 px-2 py-1">
              <Text className="text-green-700 font-bold">
                +{mockData.weeklyGrowth}%
              </Text>
            </Badge>
          </View>
        </CardHeader>
        <CardContent>
          <Progress value={mockData.weeklyGrowth * 2} className="h-2 mb-2" />
          <Text className="text-xs text-gray-500">
            Sales increased by {mockData.weeklyGrowth}% this week
          </Text>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="mb-4">
        <CardHeader>
          <View className="flex-row items-center">
            <TrendingUp size={20} color="#1f2937" />
            <Text className="text-base font-bold ml-2">Top Products Today</Text>
          </View>
        </CardHeader>
        <CardContent>
          {mockData.topProducts.map((product, index) => (
            <View
              key={index}
              className={`flex-row justify-between items-center ${index !== 0 ? "mt-4 border-t border-gray-100 pt-4" : ""}`}
            >
              <View className="flex-1 pr-2">
                <Text className="text-sm font-bold text-gray-900">
                  {product.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Badge variant="outline" className="mr-2 px-1">
                    <Text className="text-[10px]">{product.category}</Text>
                  </Badge>
                  <Text className="text-[11px] text-gray-500">
                    {product.sold} sold
                  </Text>
                </View>
              </View>
              <Text className="font-bold text-gray-900">
                {formatCurrency(product.revenue)}
              </Text>
            </View>
          ))}
        </CardContent>
      </Card>

      {/* AI Insights - Cleaned Emojis */}
      <Card className="mb-4 bg-blue-50 border-blue-100">
        <CardHeader>
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center mr-2">
              <Text className="text-white text-[10px] font-bold">AI</Text>
            </View>
            <Text className="text-base font-bold text-blue-900">
              AI Insights
            </Text>
          </View>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-blue-900 mb-2">
            📊 Demand Forecasts ready for poultry feed.
          </Text>
          <Text className="text-sm text-blue-900 mb-2">
            💰 Pricing suggestions optimized for KES.
          </Text>
        </CardContent>
      </Card>

      {/* Growth Tips Toggle */}
      <Card className="mb-4 overflow-hidden border-green-200">
        <TouchableOpacity
          className="p-4 bg-green-50 flex-row items-center justify-between"
          onPress={() => setShowGrowthTips(!showGrowthTips)}
        >
          <View className="flex-row items-center">
            <Lightbulb size={20} color="#16a34a" />
            <Text className="text-base font-bold text-green-900 ml-2">
              Business Growth Tips
            </Text>
          </View>
          {showGrowthTips ? (
            <ChevronUp size={20} color="#16a34a" />
          ) : (
            <ChevronDown size={20} color="#16a34a" />
          )}
        </TouchableOpacity>

        {showGrowthTips && (
          <View className="p-4 bg-white">
            {growthTips.map((tip, index) => {
              const IconComponent = tip.icon;
              return (
                <View key={index} className="flex-row mb-4">
                  <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                    <IconComponent size={16} color="#16a34a" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-sm">
                      {tip.title}
                    </Text>
                    <Text className="text-xs text-gray-600">{tip.tip}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}
