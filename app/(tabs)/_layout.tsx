import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../src/context/AuthContext";

const BURGUNDY = "#741B2B";
const INACTIVE = "#9A9294";

export default function TabsLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color={BURGUNDY} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BURGUNDY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopColor: "#F0ECEC",
          backgroundColor: "#FFFFFF",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="home"
              size={size}
              color={focused ? BURGUNDY : INACTIVE}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="receipt-outline"
              size={size}
              color={focused ? BURGUNDY : INACTIVE}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="education"
        options={{
          title: "Education",
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="school-outline"
              size={size}
              color={focused ? BURGUNDY : INACTIVE}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="wallet-outline"
              size={size}
              color={focused ? BURGUNDY : INACTIVE}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={focused ? BURGUNDY : INACTIVE}
            />
          ),
        }}
      />
    </Tabs>
  );
}
