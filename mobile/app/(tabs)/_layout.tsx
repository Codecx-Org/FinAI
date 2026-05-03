import "../../global.css";
import { Tabs } from "expo-router";
import { View, TouchableOpacity } from "react-native";
import { Home, LineChart, Package, BarChart2, User } from "lucide-react-native";
import { cssInterop } from "nativewind";
import { TabWrapper } from "../../components/TabWrapper";

// Fix for the "Navigation Context" error: Handle style prop explicitly
function CustomHomeButton({ children, onPress, style }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          top: -22,
          justifyContent: "center",
          alignItems: "center",
          width: 68,
          height: 68,
          borderRadius: 34,
          elevation: 5,
          shadowColor: "#7c3aed",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        style, // This allows NativeWind 'className' to work
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}

// Register with NativeWind
cssInterop(CustomHomeButton, {
  className: "style",
});

export default function TabsLayout() {
  return (
    <TabWrapper>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#7c3aed",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: {
            // Standard bottom docking (not floating)
            backgroundColor: "#ffffff",
            height: 70,
            borderTopWidth: 1,
            borderTopColor: "#f3f4f6",
            paddingBottom: 10,
            elevation: 10,
          },
        }}
      >
        <Tabs.Screen
          name="sales"
          options={{
            title: "Sales",
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "scale-125" : "scale-100"}>
                <LineChart color={color} size={focused ? 32 : 26} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="stock"
          options={{
            title: "Stock",
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "scale-125" : "scale-100"}>
                <Package color={color} size={focused ? 32 : 26} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => <Home color="white" size={34} />,
            tabBarButton: (props) => (
              <CustomHomeButton {...props} className="bg-purple-600" />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: "Insights",
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "scale-125" : "scale-100"}>
                <BarChart2 color={color} size={focused ? 32 : 26} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "scale-125" : "scale-100"}>
                <User color={color} size={focused ? 32 : 26} />
              </View>
            ),
          }}
        />
      </Tabs>
    </TabWrapper>
  );
}
