import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
} from "lucide-react-native";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";
import { TAB_BAR_SCROLL_PADDING } from "../../constants/tabBar";
import { useProducts } from "../../hooks/api/useProducts";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minimumThreshold: number;
  maximumCapacity: number;
  unitPrice: number;
  supplier: string;
  lastRestocked: string;
}

import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Sparkles,
} from "lucide-react-native";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minimumThreshold: number;
  maximumCapacity: number;
  unitPrice: number;
  supplier: string;
  lastRestocked: string;
  isFastSelling?: boolean;
  aiRecommendation?: string;
}

export default function StockTab() {
  const { products, isLoading, createProduct, refetch } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [showImportItem, setShowImportItem] = useState(false);
  const [showCategorySelect, setShowCategorySelect] = useState(false);

  // Import State
  const [importText, setImportText] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");
  const [detectedBusiness, setDetectedBusiness] = useState("");
  const [previewItems, setPreviewItems] = useState<Omit<InventoryItem, "id" | "lastRestocked">[]>([]);
  const [isImportSaving, setIsImportSaving] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    currentStock: "0",
    minimumThreshold: "0",
    maximumCapacity: "0",
    unitPrice: "0",
    supplier: "",
  });

  // Helper: Inferred AI recommendations and fast selling tags
  const getAiInsights = (name: string, stock: number, min: number) => {
    const isLow = stock <= min;
    const lowerName = name.toLowerCase();
    
    // Detect fast-selling keywords
    const isFast = /milk|bread|sugar|soda|feed|poultry|charger|cable|aspirin|paracetamol|water|dress|coffee/i.test(lowerName);
    
    let recommendation = "";
    if (isLow) {
      recommendation = isFast 
        ? `⚠️ High velocity item! Restock +50% extra to match weekend spikes.` 
        : `Restock to minimum levels.`;
    } else if (stock < min * 2) {
      recommendation = `Optimal levels. Monitor weekly.`;
    } else {
      recommendation = `Overstock potential. Run a promo or bundler discount.`;
    }

    return { isFast, recommendation };
  };

  // Map products to inventory items (DB-backed fields with sensible fallbacks)
  const inventory: InventoryItem[] = products.map((p) => {
    const minT =
      p.minStockLevel != null && p.minStockLevel >= 0
        ? p.minStockLevel
        : Math.max(1, Math.floor(p.stockQuantity * 0.2));
    const maxCap =
      p.maxStockLevel != null && p.maxStockLevel > 0
        ? p.maxStockLevel
        : Math.max(p.stockQuantity * 2, 1);
    
    const insights = getAiInsights(p.name, p.stockQuantity, minT);

    return {
      id: p.id.toString(),
      name: p.name,
      category: p.category || "Uncategorized",
      currentStock: p.stockQuantity,
      minimumThreshold: minT,
      maximumCapacity: maxCap,
      unitPrice: p.price,
      supplier: p.supplier?.trim() || "—",
      lastRestocked: p.lastRestockedAt
        ? new Date(p.lastRestockedAt).toLocaleDateString()
        : new Date(p.createdAt).toLocaleDateString(),
      isFastSelling: insights.isFast,
      aiRecommendation: insights.recommendation,
    };
  });

  const formatCurrency = (amount: number) =>
    `KES ${amount.toLocaleString("en-KE")}`;

  const getStockStatus = (item: InventoryItem) => {
    const cap = Math.max(item.maximumCapacity, 1);
    const stockPercentage = (item.currentStock / cap) * 100;
    const isLowStock = item.currentStock <= item.minimumThreshold;

    if (isLowStock)
      return {
        status: "low",
        color: "bg-red-500",
        label: "Low Stock",
        textColor: "text-red-600",
      };
    if (stockPercentage <= 50)
      return {
        status: "medium",
        color: "bg-yellow-500",
        label: "Medium Stock",
        textColor: "text-yellow-600",
      };
    return {
      status: "good",
      color: "bg-green-500",
      label: "Good Stock",
      textColor: "text-green-600",
    };
  };

  // AI-Powered Bulk Import Parser
  const handlePreviewImport = () => {
    if (!importText.trim()) {
      Alert.alert("Error", "Please paste some CSV or JSON data first.");
      return;
    }

    try {
      let parsedRaw: any[] = [];
      if (importFormat === "json") {
        parsedRaw = JSON.parse(importText);
        if (!Array.isArray(parsedRaw)) {
          throw new Error("JSON must be an array of objects");
        }
      } else {
        // Simple CSV Parser
        const lines = importText.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          throw new Error("CSV must include a header line and at least one data line");
        }
        const headers = lines[0]!.split(",").map(h => h.trim().toLowerCase());
        parsedRaw = lines.slice(1).map(line => {
          const values = line.split(",").map(v => v.trim());
          const obj: any = {};
          headers.forEach((h, idx) => {
            obj[h] = values[idx] || "";
          });
          return obj;
        });
      }

      // Run AI Business Detection rules
      const itemNames = parsedRaw.map(i => (i.name || "").toLowerCase());
      let scores = {
        Agribusiness: 0,
        Grocery: 0,
        Pharmacy: 0,
        Electronics: 0,
        Fashion: 0,
        Restaurant: 0,
      };

      itemNames.forEach(name => {
        if (/feed|poultry|dairy|cow|pig|seed|fertilizer|chick|crop|maize|grow/i.test(name)) scores.Agribusiness += 2;
        if (/milk|bread|sugar|soap|rice|flour|oil|salt|water|beverage|snack|chocolate/i.test(name)) scores.Grocery += 2;
        if (/tablet|syrup|aspirin|paracetamol|panadol|med|medicine|band|bandage|capsule/i.test(name)) scores.Pharmacy += 2;
        if (/phone|charger|cable|usb|headphone|battery|laptop|screen|mouse/i.test(name)) scores.Electronics += 2;
        if (/shirt|dress|jeans|skirt|shoes|sneaker|jacket|watch|apparel/i.test(name)) scores.Fashion += 2;
        if (/coffee|tea|burger|pizza|fries|chips|soda|drink|food|lunch/i.test(name)) scores.Restaurant += 2;
      });

      let detected = "General Retail";
      let maxScore = 0;
      Object.keys(scores).forEach(k => {
        const val = scores[k as keyof typeof scores];
        if (val > maxScore) {
          maxScore = val;
          detected = k;
        }
      });

      setDetectedBusiness(detected);

      // Map and enrich using AI smart defaults
      const enriched = parsedRaw.map(item => {
        const currentStock = parseInt(item.currentstock || item.stockquantity || item.stock || "10") || 10;
        const unitPrice = parseFloat(item.unitprice || item.price || "100") || 100;
        const minThreshold = parseInt(item.minimumthreshold || item.minstocklevel || "") || Math.max(1, Math.floor(currentStock * 0.2));
        const maximumCapacity = parseInt(item.maximumcapacity || item.maxstocklevel || "") || Math.max(currentStock * 2, 5);
        const supplier = item.supplier || "General Supplier";
        
        let category = item.category || "";
        if (!category) {
          if (detected === "Agribusiness") category = /feed/i.test(item.name) ? "Animal Feed" : "Agri-Supplies";
          else if (detected === "Grocery") category = /soda|water/i.test(item.name) ? "Beverages" : "Groceries";
          else if (detected === "Pharmacy") category = /tablet|capsule/i.test(item.name) ? "Medicines" : "General OTC";
          else if (detected === "Electronics") category = "Devices";
          else if (detected === "Fashion") category = "Apparel";
          else if (detected === "Restaurant") category = "Menu";
          else category = "Uncategorized";
        }

        return {
          name: item.name || "Unnamed Product",
          category,
          currentStock,
          unitPrice,
          minimumThreshold: minThreshold,
          maximumCapacity,
          supplier,
        };
      });

      setPreviewItems(enriched);
    } catch (e: any) {
      if (Platform.OS === "web") {
        alert("Parsing Failed: " + (e.message || "Invalid formatting."));
      } else {
        Alert.alert("Parsing Failed", e.message || "Invalid formatting.");
      }
    }
  };

  const handleSaveImportedItems = async () => {
    if (previewItems.length === 0) return;
    setIsImportSaving(true);

    try {
      for (const item of previewItems) {
        await createProduct({
          name: item.name,
          category: item.category,
          stockQuantity: item.currentStock,
          price: item.unitPrice,
          buyingPrice: Math.round(item.unitPrice * 0.7 * 100) / 100,
          supplier: item.supplier,
          minStockLevel: item.minimumThreshold,
          maxStockLevel: item.maximumCapacity,
          lastRestockedAt: new Date().toISOString(),
        });
      }
      
      // Force refresh the list of products from backend
      if (refetch) {
        await refetch();
      }

      if (Platform.OS === "web") {
        alert(`Import Successful: Added ${previewItems.length} products automatically classified for your ${detectedBusiness} business.`);
        setPreviewItems([]);
        setImportText("");
        setShowImportItem(false);
      } else {
        Alert.alert(
          "Import Successful",
          `Added ${previewItems.length} products automatically classified for your ${detectedBusiness} business.`,
          [
            {
              text: "OK",
              onPress: () => {
                setPreviewItems([]);
                setImportText("");
                setShowImportItem(false);
              }
            }
          ]
        );
      }
    } catch (e: any) {
      if (Platform.OS === "web") {
        alert("Import Error: " + (e.message || "Failed to import all products."));
      } else {
        Alert.alert("Import Error", e.message || "Failed to import all products.");
      }
    } finally {
      setIsImportSaving(false);
    }
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const lowStockItems = inventory.filter(
    (item) => item.currentStock <= item.minimumThreshold,
  );
  
  const fastSellingItems = inventory.filter(
    (item) => item.isFastSelling
  );

  const totalValue = inventory.reduce(
    (sum, item) => sum + item.currentStock * item.unitPrice,
    0,
  );
  const totalItems = inventory.reduce(
    (sum, item) => sum + item.currentStock,
    0,
  );

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.supplier) return;

    const stock = parseInt(newItem.currentStock) || 0;
    const min = parseInt(newItem.minimumThreshold) || 0;
    const max = parseInt(newItem.maximumCapacity) || 0;
    const price = parseFloat(newItem.unitPrice) || 0;

    try {
      await createProduct({
        name: newItem.name,
        category: newItem.category,
        stockQuantity: stock,
        price: price,
        buyingPrice: Math.round(price * 0.7 * 100) / 100,
        supplier: newItem.supplier.trim(),
        minStockLevel: min,
        maxStockLevel: max > 0 ? max : null,
        lastRestockedAt: new Date().toISOString(),
      });
      setNewItem({
        name: "",
        category: "",
        currentStock: "0",
        minimumThreshold: "0",
        maximumCapacity: "0",
        unitPrice: "0",
        supplier: "",
      });
      setShowAddItem(false);
      Alert.alert("Success", "Product added successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add product");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#006b5f" />
        <Text className="text-gray-500 mt-2">Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SCROLL_PADDING }}>
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-xl font-bold text-gray-900">
              Inventory Manager
            </Text>
            <Text className="text-sm text-gray-500">
              Mfumo wa kuhifadhi bidhaa
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-row items-center bg-teal-700 px-3 py-2 rounded-lg"
              onPress={() => setShowImportItem(true)}
            >
              <View className="mr-1">
                <Upload size={16} color="white" />
              </View>
              <Text className="text-white text-sm font-medium">Import</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center bg-gray-900 px-3 py-2 rounded-lg"
              onPress={() => setShowAddItem(true)}
            >
              <View className="mr-1">
                <Plus size={16} color="white" />
              </View>
              <Text className="text-white text-sm font-medium">Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row justify-between mb-4">
          <Card className="w-[31%]">
            <CardContent className="p-3 items-center">
              <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center mx-auto mb-2">
                <Package size={16} color="#2563eb" />
              </View>
              <Text className="text-sm font-bold text-gray-900">
                {totalItems}
              </Text>
              <Text className="text-[10px] text-gray-500 text-center">
                Total Items
              </Text>
            </CardContent>
          </Card>
          <Card className="w-[31%]">
            <CardContent className="p-3 items-center">
              <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mx-auto mb-2">
                <TrendingUp size={16} color="#16a34a" />
              </View>
              <Text className="text-sm font-bold text-gray-900">
                {formatCurrency(totalValue)}
              </Text>
              <Text className="text-[10px] text-gray-500 text-center">
                Total Value
              </Text>
            </CardContent>
          </Card>
          <Card className="w-[31%]">
            <CardContent className="p-3 items-center">
              <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center mx-auto mb-2">
                <AlertTriangle size={16} color="#dc2626" />
              </View>
              <Text className="text-sm font-bold text-gray-900">
                {lowStockItems.length}
              </Text>
              <Text className="text-[10px] text-gray-500 text-center">
                Low Stock
              </Text>
            </CardContent>
          </Card>
        </View>

        <View className="relative flex-row items-center bg-white border border-gray-300 rounded-lg mb-6 shadow-sm">
          <View className="pl-3">
            <Search size={16} color="#9ca3af" />
          </View>
          <TextInput
            className="flex-1 py-3 px-2 text-gray-900"
            placeholder="Search products..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {lowStockItems.length > 0 && (
          <Card className="mb-4 bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle>
                <View className="flex-row items-center">
                  <View className="mr-2">
                    <AlertTriangle size={16} color="#b91c1c" />
                  </View>
                  <Text className="text-sm font-bold text-red-800">
                    Stock Alert - {lowStockItems.length} items
                  </Text>
                </View>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.slice(0, 3).map((item) => (
                <View
                  key={item.id}
                  className="flex-row justify-between items-center mb-1"
                >
                  <Text className="font-medium text-sm text-gray-800">
                    {item.name}
                  </Text>
                  <Text className="text-xs text-red-600 font-bold">
                    {item.currentStock} left (min: {item.minimumThreshold})
                  </Text>
                </View>
              ))}
              {lowStockItems.length > 3 && (
                <Text className="text-xs text-red-500 italic mt-1">
                  +{lowStockItems.length - 3} more items need restocking
                </Text>
              )}
            </CardContent>
          </Card>
        )}

        {fastSellingItems.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <View className="mr-1.5">
                <Sparkles size={16} color="#0d9488" />
              </View>
              <Text className="text-sm font-bold text-teal-800">
                Fast-Selling & AI Insights
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
              {fastSellingItems.map((item) => (
                <Card key={item.id} className="w-64 border-teal-100 bg-teal-50/30 mr-3">
                  <CardContent className="p-3">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="font-bold text-sm text-gray-900 truncate flex-1 mr-1" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Badge variant="outline" className="bg-teal-50 border-teal-200">
                        <Text className="text-[9px] text-teal-700 font-bold">Fast Seller</Text>
                      </Badge>
                    </View>
                    <Text className="text-[11px] text-gray-500 mb-2">
                      Current Stock: <Text className="font-bold text-gray-800">{item.currentStock}</Text> | Price: {formatCurrency(item.unitPrice)}
                    </Text>
                    <View className="bg-white p-2 rounded-lg border border-teal-50">
                      <Text className="text-[10px] text-teal-800 font-medium">
                        {item.aiRecommendation}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="space-y-4">
          {filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item);
            const cap = Math.max(item.maximumCapacity, 1);
            const stockPercentage = (item.currentStock / cap) * 100;

            return (
              <Card key={item.id} className="mb-4">
                <CardContent className="p-4">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center mb-1">
                        <Text className="font-bold text-gray-900 mr-2 flex-shrink">
                          {item.name}
                        </Text>
                        <Badge
                          variant="outline"
                          className="flex-shrink-0"
                          textClassName="text-[10px]"
                        >
                          {item.category}
                        </Badge>
                      </View>
                      <Text className="text-xs text-gray-500">
                        Supplier: {item.supplier}
                      </Text>
                      <Text className="text-xs font-medium mt-1">
                        Price: {formatCurrency(item.unitPrice)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View className="flex-row items-center mb-1">
                        <View
                          className={`w-3 h-3 rounded-full mr-2 ${stockStatus.color}`}
                        />
                        <Text className={`font-bold ${stockStatus.textColor}`}>
                          {item.currentStock}
                        </Text>
                      </View>
                      <Text className="text-[10px] text-gray-400">
                        of {item.maximumCapacity}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-2">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs text-gray-500">Stock Level</Text>
                      <Text className="text-xs text-gray-700 font-medium">
                        {stockStatus.label}
                      </Text>
                    </View>
                    <Progress value={stockPercentage} className="mb-1" />
                    <View className="flex-row justify-between">
                      <Text className="text-[10px] text-gray-400">
                        Min: {item.minimumThreshold}
                      </Text>
                      <Text className="text-[10px] text-gray-700 font-bold">
                        Value:{" "}
                        {formatCurrency(item.currentStock * item.unitPrice)}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <Text className="text-xs text-blue-700">
                      Set min threshold and max capacity when adding items for accurate stock alerts.
                    </Text>
                  </View>
                </CardContent>
              </Card>
            );
          })}
          {filteredInventory.length === 0 && (
            <Card>
              <CardContent className="p-8 items-center justify-center">
                <View className="mb-4">
                  <Package size={40} color="#9ca3af" />
                </View>
                <Text className="text-gray-500 font-medium">
                  {searchTerm ? "No matches found" : "No inventory items"}
                </Text>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={showAddItem}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm">
            <Text className="text-lg font-bold text-gray-900">
              Add Inventory Item
            </Text>
            <TouchableOpacity onPress={() => setShowAddItem(false)}>
              <Text className="text-gray-500 font-bold text-lg">X</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text className="font-bold text-gray-700 mb-1">Product Name *</Text>
            <TextInput
              className="bg-white border border-gray-300 p-3 rounded-lg mb-4"
              placeholder="e.g., Dairy Meal 50kg"
              value={newItem.name}
              onChangeText={(t) => setNewItem({ ...newItem, name: t })}
            />

            <Text className="font-bold text-gray-700 mb-1">Category *</Text>
            <TouchableOpacity
              onPress={() => setShowCategorySelect(!showCategorySelect)}
              className="bg-white border border-gray-300 p-3 rounded-lg mb-4 flex-row justify-between"
            >
              <Text
                className={newItem.category ? "text-gray-900" : "text-gray-400"}
              >
                {newItem.category || "Select category"}
              </Text>
              <Text className="text-gray-400">▼</Text>
            </TouchableOpacity>

            {showCategorySelect && (
              <View className="bg-white border border-gray-200 rounded-lg mb-4">
                {[
                  "Dairy Feed",
                  "Poultry Feed",
                  "Swine Feed",
                  "Aquaculture",
                  "Other",
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    className="p-3 border-b border-gray-100"
                    onPress={() => {
                      setNewItem({ ...newItem, category: cat });
                      setShowCategorySelect(false);
                    }}
                  >
                    <Text className="text-gray-800">{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View className="flex-row justify-between mb-4">
              <View className="w-[48%]">
                <Text className="font-bold text-gray-700 mb-1">
                  Current Stock
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 p-3 rounded-lg"
                  keyboardType="numeric"
                  value={newItem.currentStock}
                  onChangeText={(t) =>
                    setNewItem({ ...newItem, currentStock: t })
                  }
                />
              </View>
              <View className="w-[48%]">
                <Text className="font-bold text-gray-700 mb-1">Unit Price</Text>
                <TextInput
                  className="bg-white border border-gray-300 p-3 rounded-lg"
                  keyboardType="numeric"
                  value={newItem.unitPrice}
                  onChangeText={(t) => setNewItem({ ...newItem, unitPrice: t })}
                />
              </View>
            </View>

            <View className="flex-row justify-between mb-4">
              <View className="w-[48%]">
                <Text className="font-bold text-gray-700 mb-1">
                  Min Threshold
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 p-3 rounded-lg"
                  keyboardType="numeric"
                  value={newItem.minimumThreshold}
                  onChangeText={(t) =>
                    setNewItem({ ...newItem, minimumThreshold: t })
                  }
                />
              </View>
              <View className="w-[48%]">
                <Text className="font-bold text-gray-700 mb-1">
                  Max Capacity
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 p-3 rounded-lg"
                  keyboardType="numeric"
                  value={newItem.maximumCapacity}
                  onChangeText={(t) =>
                    setNewItem({ ...newItem, maximumCapacity: t })
                  }
                />
              </View>
            </View>

            <Text className="font-bold text-gray-700 mb-1">Supplier *</Text>
            <TextInput
              className="bg-white border border-gray-300 p-3 rounded-lg mb-6"
              placeholder="e.g., Kenchic Ltd"
              value={newItem.supplier}
              onChangeText={(t) => setNewItem({ ...newItem, supplier: t })}
            />

            <TouchableOpacity
              onPress={handleAddItem}
              className="bg-gray-900 py-4 rounded-xl items-center flex-row justify-center"
            >
              <View className="mr-2">
                <Plus size={20} color="white" />
              </View>
              <Text className="text-white font-bold text-lg">Save Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        visible={showImportItem}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm">
            <View>
              <Text className="text-lg font-bold text-gray-900">
                Bulk Import Inventory
              </Text>
              <Text className="text-xs text-gray-500">
                Onboard your stock list instantly
              </Text>
            </View>
            <TouchableOpacity onPress={() => {
              setShowImportItem(false);
              setPreviewItems([]);
              setImportText("");
              setDetectedBusiness("");
            }}>
              <Text className="text-gray-500 font-bold text-lg">X</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {previewItems.length === 0 ? (
              <>
                <View className="mb-4 bg-teal-50 border border-teal-100 p-3 rounded-lg flex-row items-start">
                  <View className="mr-2 mt-0.5">
                    <Sparkles size={16} color="#0d9488" />
                  </View>
                  <Text className="text-xs text-teal-800 flex-1 leading-relaxed">
                    Paste your inventory list below. BizSawa's AI will parse it, auto-detect your business sector, auto-categorize items, and configure safe stock thresholds.
                  </Text>
                </View>

                {/* Format Toggle Buttons */}
                <View className="flex-row bg-gray-200 p-1 rounded-lg mb-4">
                  <TouchableOpacity
                    onPress={() => setImportFormat("csv")}
                    className={`flex-1 py-2 items-center rounded-md ${
                      importFormat === "csv" ? "bg-white shadow" : ""
                    }`}
                  >
                    <Text className={`font-semibold text-xs ${importFormat === "csv" ? "text-gray-900" : "text-gray-500"}`}>
                      CSV / Excel Copy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setImportFormat("json")}
                    className={`flex-1 py-2 items-center rounded-md ${
                      importFormat === "json" ? "bg-white shadow" : ""
                    }`}
                  >
                    <Text className={`font-semibold text-xs ${importFormat === "json" ? "text-gray-900" : "text-gray-500"}`}>
                      JSON Array
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Example box */}
                <View className="bg-gray-100 p-3 rounded-lg border border-gray-200 mb-4">
                  <Text className="text-[10px] font-bold text-gray-500 mb-1">
                    EXPECTED FORMAT:
                  </Text>
                  <Text className="text-[10px] font-mono text-gray-700 leading-normal">
                    {importFormat === "csv" 
                      ? "name,category,currentStock,unitPrice,supplier\nDairy Feed,Feed,50,2200,Kenchic Ltd\nSugar 1kg,,10,180,Kabras"
                      : '[\n  {\n    "name": "Dairy Feed",\n    "currentStock": 50,\n    "unitPrice": 2200\n  }\n]'
                    }
                  </Text>
                </View>

                <Text className="font-bold text-gray-700 mb-1">Paste Stock Data *</Text>
                <TextInput
                  multiline
                  numberOfLines={10}
                  className="bg-white border border-gray-300 p-3 rounded-lg mb-4 font-mono text-xs text-gray-800"
                  style={{ minHeight: 180, textAlignVertical: "top" }}
                  placeholder={importFormat === "csv" 
                    ? "Paste comma-separated rows here..." 
                    : "Paste JSON array here..."
                  }
                  value={importText}
                  onChangeText={setImportText}
                />

                <TouchableOpacity
                  onPress={handlePreviewImport}
                  className="bg-teal-700 py-3 rounded-xl items-center flex-row justify-center shadow-md"
                >
                  <View className="mr-2">
                    <Sparkles size={16} color="white" />
                  </View>
                  <Text className="text-white font-bold text-sm">Preview & Auto-Detect</Text>
                </TouchableOpacity>
              </>
            ) : (
              // AI Review & Confirm Screen
              <View>
                <View className="mb-4 bg-teal-600 p-4 rounded-xl shadow-md border border-teal-500">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[10px] uppercase font-bold text-teal-200 tracking-wider">
                      🤖 AI Classifier Active
                    </Text>
                    <View className="flex-row items-center bg-teal-500/30 px-2.5 py-0.5 rounded-full">
                      <Text className="text-[9px] text-white font-bold">Smart Defaults Set</Text>
                    </View>
                  </View>
                  <Text className="text-xl font-bold text-white mb-2">
                    {detectedBusiness} Business detected
                  </Text>
                  <Text className="text-xs text-teal-100 leading-relaxed">
                    Categorized {previewItems.length} items. Inferred min stock levels (20%) and maximum capacity targets automatically.
                  </Text>
                </View>

                <View className="flex-row justify-between mb-4">
                  <Text className="font-bold text-gray-900 text-sm">
                    Items Preview ({previewItems.length})
                  </Text>
                  <TouchableOpacity onPress={() => { setPreviewItems([]); setDetectedBusiness(""); }}>
                    <Text className="text-teal-700 font-bold text-sm">Modify List</Text>
                  </TouchableOpacity>
                </View>

                {/* Preview Cards */}
                <View className="space-y-3 mb-6">
                  {previewItems.map((item, idx) => (
                    <Card key={idx} className="bg-white border-gray-200">
                      <CardContent className="p-3">
                        <View className="flex-row justify-between items-center mb-1">
                          <Text className="font-bold text-sm text-gray-900 flex-1 truncate" numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Badge variant="secondary">
                            <Text className="text-[9px] text-gray-600 font-bold">{item.category}</Text>
                          </Badge>
                        </View>
                        <View className="flex-row justify-between text-xs text-gray-500">
                          <Text className="text-[11px]">
                            Qty: <Text className="font-bold text-gray-700">{item.currentStock}</Text> | Price: {formatCurrency(item.unitPrice)}
                          </Text>
                          <Text className="text-[10px] text-teal-700 font-bold">
                            Min Alert: {item.minimumThreshold}
                          </Text>
                        </View>
                      </CardContent>
                    </Card>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleSaveImportedItems}
                  disabled={isImportSaving}
                  className="bg-gray-900 py-4 rounded-xl items-center flex-row justify-center shadow-lg"
                >
                  {isImportSaving ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <View className="mr-2">
                        <CheckCircle2 size={20} color="white" />
                      </View>
                      <Text className="text-white font-bold text-base">
                        Confirm & Import {previewItems.length} Products
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
