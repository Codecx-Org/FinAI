import { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator, Image, Dimensions, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function Index() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    // Start fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const prepareApp = async () => {
      const startTime = Date.now();
      try {
        // Pre-fetch any necessary data here
      } catch (e) {
        console.warn(e);
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 2500 - elapsedTime);
        
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setShowSplash(false);
            setIsAppReady(true);
          });
        }, remainingTime);
      }
    };

    prepareApp();
  }, []);

  useEffect(() => {
    console.log("Navigation Check - Ready:", isAppReady, "Auth Loading:", isAuthLoading, "Authenticated:", isAuthenticated);
    if (isAppReady && !isAuthLoading) {
      const checkNavigation = async () => {
        // FORCING ONBOARDING FOR TESTING
        console.log("FORCING REDIRECT TO ONBOARDING");
        router.replace("/onboarding");
        
        /* Original Logic (Commented out for testing)
        const hasFinishedOnboarding = await AsyncStorage.getItem("HAS_FINISHED_ONBOARDING");
        if (isAuthenticated) {
          router.replace("/(tabs)");
        } else if (hasFinishedOnboarding !== "true") {
          router.replace("/onboarding");
        } else {
          router.replace("/auth/login");
        }
        */
      };
      
      checkNavigation();
    }
  }, [isAppReady, isAuthLoading, isAuthenticated, router]);

  if (showSplash) {
    return (
      <View className="flex-1 bg-[#faf8ff] items-center justify-center">
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

        {/* Decorative Background Elements */}
        <View 
          className="absolute top-[10%] left-[-10%] w-64 h-64 border border-[#006b5f]/5 rotate-12" 
          pointerEvents="none" 
        />
        <View 
          className="absolute bottom-[10%] right-[-10%] w-48 h-48 border border-[#006b5f]/5 -rotate-6" 
          pointerEvents="none" 
        />

        <Animated.View 
          style={{ opacity: fadeAnim }}
          className="items-center w-full px-10"
        >
          {/* Logo Container - Neo Brutalist Style */}
          <View 
            className="mb-8 w-24 h-24 bg-white border-[1.5px] border-[#006b5f]/20 items-center justify-center rounded-2xl shadow-lg"
            style={{
              shadowColor: "#006b5f",
              shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 0,
              elevation: 4,
            }}
          >
            <View className="w-12 h-12 bg-[#006b5f] rounded-xl items-center justify-center">
              <Text className="text-white font-bold text-3xl">B</Text>
            </View>
          </View>

          {/* Brand Name */}
          <Text className="text-5xl font-bold text-[#131b2e] mb-2 tracking-tighter">
            BizSawa
          </Text>

          {/* Tagline */}
          <Text className="text-lg text-[#5c5f61] text-center mb-12 font-medium max-w-[280px]">
            Your AI Powered Business Companion
          </Text>

          {/* Featured Image Container */}
          <View 
            className="w-full aspect-square max-w-[300px] bg-white border border-[#c3c7cb]/20 rounded-2xl overflow-hidden shadow-sm mb-12"
            style={{
              shadowColor: "#006b5f",
              shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 0,
              elevation: 2,
            }}
          >
            <Image 
              source={require("../assets/designs/splash-screen.png")}
              className="w-full h-full opacity-90"
              resizeMode="cover"
            />
            {/* Overlay Chip */}
            <View className="absolute bottom-6 left-6">
              <View className="bg-[#006b5f] px-3 py-1.5 rounded border border-[#006b5f]">
                <Text className="text-white text-[10px] font-bold tracking-wider">ESTABLISHED 2024</Text>
              </View>
            </View>
          </View>

          {/* Progress Section */}
          <View className="w-48 h-1 bg-[#d3e5f1] mb-4 relative overflow-hidden rounded-full">
            <View 
              className="absolute inset-y-0 left-0 bg-[#006b5f] w-1/3"
            />
          </View>
          <Text className="text-xs text-[#43474b]/60 font-semibold tracking-wide">
            Initializing Intelligence...
          </Text>
        </Animated.View>

        {/* Footer Accents */}
        <View className="absolute bottom-12 w-full flex-row justify-center items-center opacity-40">
          <Text className="text-[10px] font-bold uppercase tracking-[3px] text-[#50616b]">Reliability</Text>
          <View className="w-1 h-1 bg-[#73787b] rounded-full mx-4" />
          <Text className="text-[10px] font-bold uppercase tracking-[3px] text-[#50616b]">Insight</Text>
          <View className="w-1 h-1 bg-[#73787b] rounded-full mx-4" />
          <Text className="text-[10px] font-bold uppercase tracking-[3px] text-[#50616b]">Growth</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <ActivityIndicator size="large" color="#006b5f" />
    </View>
  );
}
