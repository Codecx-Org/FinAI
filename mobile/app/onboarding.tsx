import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OnboardingScreen() {
  const router = useRouter();

  const handleComplete = async () => {
    // Save onboarding state and some dummy user data
    await AsyncStorage.setItem('numeraai_onboarded', 'true');
    await AsyncStorage.setItem('numeraai_userdata', JSON.stringify({
      firstName: 'Mama',
      lastName: 'Mboga',
      businessName: 'Fresh Grocers',
      phone: '0712345678',
      businessType: 'Retail',
      yearsInBusiness: '3'
    }));
    
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">Welcome to NumeraAI</Text>
        <Text className="text-base text-gray-500 mb-8 text-center">
          Let's setup your business and get you ready for AI-powered insights!
        </Text>
        
        <TouchableOpacity 
          className="w-full bg-purple-600 py-4 rounded-xl items-center"
          onPress={handleComplete}
        >
          <Text className="text-white font-bold text-lg">Complete Onboarding (Demo)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
