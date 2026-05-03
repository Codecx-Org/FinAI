import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { User, Shield, CreditCard, Phone, MapPin, Building, Calendar, Star, Trophy, TrendingUp, CheckCircle, Smartphone } from 'lucide-react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';

const mockUserData = {
  firstName: 'Grace',
  lastName: 'Wanjiku',
  businessName: 'Grace Agrovet & Animal Feeds',
  phone: '+254712345678',
  location: 'Nairobi, Kenya',
  businessType: 'Agrovet',
  yearsInBusiness: '3'
};

const mockLoanData = {
  eligible: true,
  maxAmount: 50000,
  interestRate: 12,
  term: 6,
  trustScore: 78,
  factors: {
    paymentHistory: 85,
    businessStability: 75,
    transactionVolume: 80,
    customerRatings: 72
  }
};

const achievements = [
  { title: 'Consistent Earner', description: '6 months of steady revenue', earned: true },
  { title: 'Payment Master', description: 'No late payments in 3 months', earned: true },
  { title: 'Growth Champion', description: '20% month-over-month growth', earned: false },
  { title: 'Customer Favorite', description: '4.5+ customer rating', earned: true }
];

export default function ProfileTab() {
  const [activeTab, setActiveTab] = useState<'profile' | 'credit' | 'rewards'>('profile');
  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString('en-KE')}`;

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Profile</Text>
          <Text className="text-sm text-gray-500">Wasifu wako / Your business profile</Text>
        </View>

        <View className="flex-row bg-gray-200 rounded-lg mb-6 w-full">
          <TouchableOpacity className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'profile' ? 'bg-white shadow' : ''}`} onPress={() => setActiveTab('profile')}>
            <Text className={`font-medium ${activeTab === 'profile' ? 'text-gray-900' : 'text-gray-500'}`}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'credit' ? 'bg-white shadow' : ''}`} onPress={() => setActiveTab('credit')}>
            <Text className={`font-medium ${activeTab === 'credit' ? 'text-gray-900' : 'text-gray-500'}`}>Credit</Text>
          </TouchableOpacity>
          <TouchableOpacity className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'rewards' ? 'bg-white shadow' : ''}`} onPress={() => setActiveTab('rewards')}>
            <Text className={`font-medium ${activeTab === 'rewards' ? 'text-gray-900' : 'text-gray-500'}`}>Rewards</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'profile' && (
          <View>
            <Card className="mb-4">
              <CardContent className="p-4 flex-row items-center">
                <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <Text className="text-2xl font-bold text-blue-700">{mockUserData.firstName[0]}{mockUserData.lastName[0]}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold">{mockUserData.firstName} {mockUserData.lastName}</Text>
                  <Text className="text-sm text-gray-600">{mockUserData.businessName}</Text>
                  <View className="flex-row items-center mt-1">
                    <View className="mr-1"><MapPin size={12} color="#6b7280" /></View>
                    <Text className="text-xs text-gray-500">{mockUserData.location}</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2"><User size={16} color="#374151" /></View>
                    <Text className="font-bold">Business Information</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View className="space-y-3">
                  <View className="flex-row items-center mb-3">
                    <View className="mr-3"><Phone size={16} color="#6b7280" /></View>
                    <Text className="text-gray-800">{mockUserData.phone}</Text>
                  </View>
                  <View className="flex-row items-center mb-3">
                    <View className="mr-3"><Building size={16} color="#6b7280" /></View>
                    <Text className="text-gray-800">{mockUserData.businessType}</Text>
                  </View>
                  <View className="flex-row items-center mb-3">
                    <View className="mr-3"><Calendar size={16} color="#6b7280" /></View>
                    <Text className="text-gray-800">{mockUserData.yearsInBusiness} years in business</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2"><Smartphone size={16} color="#374151" /></View>
                    <Text className="font-bold">Mobile Money</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View className="flex-row items-center justify-between p-3 border border-gray-200 rounded-lg mb-3">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-green-700 font-bold">MP</Text>
                    </View>
                    <View>
                      <Text className="font-bold">M-Pesa</Text>
                      <Text className="text-xs text-gray-500">+254712345678</Text>
                    </View>
                  </View>
                  <CheckCircle size={20} color="#16a34a" />
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {activeTab === 'credit' && (
          <View>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2"><Shield size={16} color="#374151" /></View>
                    <Text className="font-bold">Trust Score</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View className="items-center mb-4">
                  <Text className={`text-4xl font-bold ${getTrustScoreColor(mockLoanData.trustScore)}`}>
                    {mockLoanData.trustScore}
                  </Text>
                  <Text className="text-gray-500 text-sm">Good Credit Rating</Text>
                </View>
                
                <View className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600">Payment History</Text>
                    <Text className="text-xs font-bold">{mockLoanData.factors.paymentHistory}%</Text>
                  </View>
                  <Progress value={mockLoanData.factors.paymentHistory} />
                </View>
                <View className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600">Business Stability</Text>
                    <Text className="text-xs font-bold">{mockLoanData.factors.businessStability}%</Text>
                  </View>
                  <Progress value={mockLoanData.factors.businessStability} />
                </View>
                <View className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-600">Transaction Volume</Text>
                    <Text className="text-xs font-bold">{mockLoanData.factors.transactionVolume}%</Text>
                  </View>
                  <Progress value={mockLoanData.factors.transactionVolume} />
                </View>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200 mb-4">
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2"><CreditCard size={16} color="#16a34a" /></View>
                    <Text className="font-bold text-green-800">Loan Eligibility</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View className="flex-row justify-between text-center mb-4">
                  <View className="items-center flex-1">
                    <Text className="text-2xl font-bold text-green-600">{formatCurrency(mockLoanData.maxAmount)}</Text>
                    <Text className="text-xs text-gray-600">Max Amount</Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-2xl font-bold text-green-600">{mockLoanData.interestRate}%</Text>
                    <Text className="text-xs text-gray-600">Interest</Text>
                  </View>
                </View>
                <TouchableOpacity className="bg-green-600 py-3 rounded-lg items-center">
                  <Text className="text-white font-bold">Explore SACCO Loans</Text>
                </TouchableOpacity>
              </CardContent>
            </Card>
          </View>
        )}

        {activeTab === 'rewards' && (
          <View>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>
                  <View className="flex-row items-center">
                    <View className="mr-2"><Star size={16} color="#374151" /></View>
                    <Text className="font-bold">Business Achievements</Text>
                  </View>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievements.map((item, i) => (
                  <View key={i} className={`flex-row p-3 rounded-lg mb-3 border ${item.earned ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${item.earned ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {item.earned ? <CheckCircle size={20} color="white" /> : <Trophy size={20} color="white" />}
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold ${item.earned ? 'text-green-800' : 'text-gray-500'}`}>{item.title}</Text>
                      <Text className={`text-xs ${item.earned ? 'text-green-700' : 'text-gray-400'}`}>{item.description}</Text>
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
