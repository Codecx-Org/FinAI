import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'No More Paperwork',
    description: 'Track all your sales and business transactions digitally in one place. Fast, easy, and secure.',
    image: require('../assets/designs/onboarding1.png'),
    backgroundColor: '#faf8ff',
  },
  {
    id: '2',
    title: 'Smart Inventory',
    description: 'Manage your stock levels in real-time. Get alerts before you run out and know what sells best.',
    image: require('../assets/designs/onboarding2.png'),
    backgroundColor: '#faf8ff',
  },
  {
    id: '3',
    title: 'Grow With AI',
    description: 'Your AI Powered Business Companion helps you make better decisions with deep-dive analytics.',
    image: require('../assets/designs/onboarding3.png'),
    backgroundColor: '#faf8ff',
  },
];

export default function OnboardingScreen() {
  useEffect(() => {
    console.log("OnboardingScreen Mounted");
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    // Reset and trigger fade in when index changes
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('HAS_FINISHED_ONBOARDING', 'true');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/auth/login');
    }
  };

  const renderItem = ({ item }: { item: typeof ONBOARDING_DATA[0] }) => {
    return (
      <View style={{ width }} className="flex-1 items-center justify-center px-8">
        <Animated.View 
          style={{ 
            opacity: fadeAnim, 
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })}] 
          }}
          className="w-full aspect-square mb-12 items-center justify-center"
        >
          <View 
            className="w-[85%] h-[85%] bg-white border border-[#c3c7cb]/20 rounded-[32px] overflow-hidden shadow-xl"
            style={{
              shadowColor: "#006b5f",
              shadowOffset: { width: 8, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 0,
              elevation: 5,
            }}
          >
            <Image
              source={item.image}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        <Animated.View 
          style={{ opacity: fadeAnim }}
          className="items-center px-4"
        >
          <Text className="text-[32px] font-bold text-[#131b2e] text-center mb-4 tracking-tighter leading-tight">
            {item.title}
          </Text>
          <Text className="text-base text-[#5c5f61] text-center leading-relaxed font-medium">
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const updateCurrentIndex = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#faf8ff]">
      {/* Architectural Grid Background (Dots) */}
      <View className="absolute inset-0 opacity-10" pointerEvents="none">
        {[...Array(20)].map((_, i) => (
          <View key={i} className="flex-row justify-around w-full py-4">
            {[...Array(10)].map((_, j) => (
              <View key={j} className="w-1 h-1 bg-[#c3c7cb] rounded-full" />
            ))}
          </View>
        ))}
      </View>

      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_DATA}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={updateCurrentIndex}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          keyExtractor={(item) => item.id}
        />
      </View>

      {/* Pagination / Controls */}
      <View className="px-8 pb-8 flex-row items-center justify-between">
        {/* Indicators */}
        <View className="flex-row space-x-2">
          {ONBOARDING_DATA.map((_, index) => {
            const opacity = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            const scale = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#006b5f',
                  opacity,
                  transform: [{ scale }],
                }}
              />
            );
          })}
        </View>
      </View>

      {/* Buttons */}
      <View className="px-8 pb-12">
        {currentIndex === 0 ? (
          <View className="space-y-4">
            <TouchableOpacity
              onPress={handleNext}
              className="bg-[#006b5f] h-16 rounded-2xl flex-row items-center justify-center"
              style={{
                shadowColor: "#006b5f",
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 0,
                elevation: 4,
              }}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg mr-2 tracking-tight">Explore BizSawa</Text>
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/auth/login')}
              className="h-14 rounded-2xl border border-[#006b5f]/30 items-center justify-center bg-white/50"
              activeOpacity={0.7}
            >
              <Text className="text-[#006b5f] font-bold text-base">Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            className="bg-[#006b5f] h-16 rounded-2xl flex-row items-center justify-center"
            style={{
              shadowColor: "#006b5f",
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 0,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-lg mr-2 tracking-tight">
              {currentIndex === ONBOARDING_DATA.length - 1 ? 'Join BizSawa' : 'Next'}
            </Text>
            {currentIndex !== ONBOARDING_DATA.length - 1 && (
              <ChevronRight size={20} color="white" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Skip Button */}
      {currentIndex < ONBOARDING_DATA.length - 1 && (
        <TouchableOpacity 
          onPress={finishOnboarding}
          className="absolute top-16 right-8 bg-white/80 px-4 py-2 rounded-full border border-[#c3c7cb]/20"
        >
          <Text className="text-[#5c5f61] font-bold text-xs uppercase tracking-widest">Skip</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
