import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { TrendingUp, TrendingDown, Target, Lightbulb, Edit2, Plus, Receipt, Download, DollarSign, Users, PieChart as PieChartIcon, Activity } from 'lucide-react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';

const defaultGoals = [
  { id: 1, title: 'Monthly Feed Sales Target', current: 450000, target: 600000, unit: 'KES' },
  { id: 2, title: 'New Farmer Customers', current: 23, target: 30, unit: 'farmers' },
  { id: 3, title: 'Feed Inventory Turnover', current: 2.3, target: 3.0, unit: 'times' }
];

const customerSegments = [
  { segment: 'Regular Farmers', count: 156, growth: 12, color: 'text-green-600' },
  { segment: 'New Farmers', count: 23, growth: 8, color: 'text-blue-600' },
  { segment: 'Large-Scale Farms', count: 67, growth: -3, color: 'text-orange-600' }
];

const productCategories = [
  { name: 'Dairy Feed', value: 35, color: '#8884d8' },
  { name: 'Poultry Feed', value: 25, color: '#82ca9d' },
  { name: 'Swine Feed', value: 20, color: '#ffc658' },
  { name: 'Aquaculture', value: 12, color: '#ff7300' },
  { name: 'Others', value: 8, color: '#0088fe' }
];

export default function InsightsTab() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'expenses'>('overview');
  const [goals, setGoals] = useState(defaultGoals);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString('en-KE')}`;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Business Insights</Text>
          <Text className="text-sm text-gray-500">Analytics & performance insights</Text>
        </View>

        <View className="flex-row bg-gray-200 rounded-lg mb-6 w-full">
          <TouchableOpacity className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'overview' ? 'bg-white shadow' : ''}`} onPress={() => setActiveTab('overview')}>
            <Text className={`font-medium ${activeTab === 'overview' ? 'text-gray-900' : 'text-gray-500'}`}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'analytics' ? 'bg-white shadow' : ''}`} onPress={() => setActiveTab('analytics')}>
            <Text className={`font-medium ${activeTab === 'analytics' ? 'text-gray-900' : 'text-gray-500'}`}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'expenses' ? 'bg-white shadow' : ''}`} onPress={() => setActiveTab('expenses')}>
            <Text className={`font-medium ${activeTab === 'expenses' ? 'text-gray-900' : 'text-gray-500'}`}>Expenses</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'overview' && (
          <View>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2"><Target size={16} color="#374151" /></View>
                    <Text className="font-bold">Monthly Goals</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {goals.map(goal => {
                  const percentage = Math.min((goal.current / goal.target) * 100, 100);
                  return (
                    <View key={goal.id} className="mb-3">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-sm font-medium">{goal.title}</Text>
                        <Text className="text-xs text-gray-500">
                          {goal.unit === 'KES' ? formatCurrency(goal.current) : `${goal.current} ${goal.unit}`} / {goal.unit === 'KES' ? formatCurrency(goal.target) : `${goal.target} ${goal.unit}`}
                        </Text>
                      </View>
                      <Progress value={percentage} className="my-1" />
                      <Text className="text-[10px] text-gray-400">{percentage.toFixed(1)}% complete</Text>
                    </View>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2"><Lightbulb size={16} color="#eab308" /></View>
                    <Text className="font-bold">AI Insights</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View className="flex-row justify-between mb-3">
                  <TouchableOpacity onPress={() => setShowPredictionModal(true)} className="flex-1 mr-2 p-3 border border-blue-200 rounded-lg bg-blue-50 items-center justify-center">
                    <View className="mb-2"><TrendingUp size={24} color="#2563eb" /></View>
                    <Text className="text-blue-700 font-bold text-center text-sm">Demand Prediction</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowPricingModal(true)} className="flex-1 ml-2 p-3 border border-purple-200 rounded-lg bg-purple-50 items-center justify-center">
                    <View className="mb-2"><DollarSign size={24} color="#9333ea" /></View>
                    <Text className="text-purple-700 font-bold text-center text-sm">Pricing Suggestions</Text>
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200 mb-4">
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2"><Activity size={16} color="#16a34a" /></View>
                    <Text className="font-bold text-green-800">This Week's Performance</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View className="flex-row justify-between text-center pb-2">
                  <View className="items-center flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Revenue</Text>
                    <Text className="text-lg font-bold text-green-700">{formatCurrency(159000)}</Text>
                    <Text className="text-[10px] text-green-600 font-medium">+18.5% vs last week</Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Transactions</Text>
                    <Text className="text-lg font-bold text-blue-700">438</Text>
                    <Text className="text-[10px] text-blue-600 font-medium">+12.3% vs last week</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {activeTab === 'analytics' && (
          <View>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2"><PieChartIcon size={16} color="#374151" /></View>
                    <Text className="font-bold">Product Categories</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productCategories.map((cat, i) => (
                  <View key={i} className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center">
                      <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                      <Text className="text-sm font-medium">{cat.name}</Text>
                    </View>
                    <Text className="text-sm font-bold">{cat.value}%</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2"><Users size={16} color="#374151" /></View>
                    <Text className="font-bold">Customer Segments</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customerSegments.map((segment, i) => (
                  <View key={i} className="flex-row justify-between items-center mb-3">
                    <View>
                      <Text className="font-medium">{segment.segment}</Text>
                      <Text className="text-xs text-gray-500">{segment.count} customers</Text>
                    </View>
                    <View className="items-end">
                      <Text className={`font-bold ${segment.growth > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {segment.growth > 0 ? '+' : ''}{segment.growth}%
                      </Text>
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        {activeTab === 'expenses' && (
          <View>
            <Card className="mb-4">
              <CardContent className="p-8 items-center">
                <View className="mb-4"><Receipt size={40} color="#9ca3af" /></View>
                <Text className="text-gray-500 font-medium">No expenses recorded yet</Text>
                <TouchableOpacity className="mt-4 bg-gray-900 py-3 px-6 rounded-lg flex-row items-center">
                  <View className="mr-2"><Plus size={16} color="white" /></View>
                  <Text className="text-white font-bold">Add Expense</Text>
                </TouchableOpacity>
              </CardContent>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Demand Prediction Modal */}
      <Modal visible={showPredictionModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm">
            <Text className="text-lg font-bold text-blue-800">Demand Predictions</Text>
            <TouchableOpacity onPress={() => setShowPredictionModal(false)}>
              <Text className="text-gray-500 font-bold text-lg">X</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View className="space-y-3">
              <View className="p-4 bg-green-50 border border-green-200 rounded-lg mb-3">
                <Text className="font-bold text-green-800 mb-1">Chick Mash 50kg</Text>
                <Text className="text-sm text-green-700 mb-1">🔼 High demand expected next week (+35%)</Text>
                <Text className="text-xs text-green-600/80">Based on seasonal trends and new poultry farmers in your area.</Text>
              </View>
              <View className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                <Text className="font-bold text-blue-800 mb-1">Layers Mash 50kg</Text>
                <Text className="text-sm text-blue-700 mb-1">➡️ Stable demand expected (±8%)</Text>
                <Text className="text-xs text-blue-600/80">Consistent demand from regular poultry farmers.</Text>
              </View>
              <View className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-3">
                <Text className="font-bold text-purple-800 mb-1">Dairy Meal 50kg</Text>
                <Text className="text-sm text-purple-700 mb-1">🔽 Seasonal dip expected (-12% next 2 weeks)</Text>
                <Text className="text-xs text-purple-600/80">Post-holiday reduction in dairy farming.</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Pricing Modal */}
      <Modal visible={showPricingModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm">
            <Text className="text-lg font-bold text-purple-800">Pricing Recommendations</Text>
            <TouchableOpacity onPress={() => setShowPricingModal(false)}>
              <Text className="text-gray-500 font-bold text-lg">X</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View className="space-y-3">
              <View className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-3">
                <Text className="font-bold text-purple-800 mb-1">Chick Mash 50kg</Text>
                <Text className="text-sm text-purple-700 mb-1">💰 Current: KES 2,800 → KES 2,950 (+5.4%)</Text>
                <Text className="text-xs text-purple-600/80">High demand for chick feed supports price increase.</Text>
              </View>
              <View className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-3">
                <Text className="font-bold text-purple-800 mb-1">Layers Mash 50kg</Text>
                <Text className="text-sm text-purple-700 mb-1">⚖️ Current: KES 2,200 → KES 2,300 (+4.5%)</Text>
                <Text className="text-xs text-purple-600/80">Optimal pricing for steady egg production demand.</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
