import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, Text } from "react-native";

import { useStore } from "./src/state";
import { colors } from "./src/theme";

import LoginScreen from "./src/screens/LoginScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import MapScreen from "./src/screens/MapScreen";
import ChatScreen from "./src/screens/ChatScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import LocationTracker from "./src/components/LocationTracker";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.sheet,
    text: colors.text,
    primary: colors.accent,
    border: colors.border,
    notification: colors.accent,
  },
};

function TabIcon({ color, glyph }) {
  return <Text style={{ color, fontSize: 20 }}>{glyph}</Text>;
}

function TabsNav() {
  return (
    <>
      <LocationTracker />
      <Tabs.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.sheet,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tabs.Screen
          name="Orders"
          component={OrdersScreen}
          options={{
            title: "Заказы",
            tabBarIcon: ({ color }) => <TabIcon color={color} glyph="☰" />,
          }}
        />
        <Tabs.Screen
          name="Map"
          component={MapScreen}
          options={{
            title: "Карта",
            tabBarIcon: ({ color }) => <TabIcon color={color} glyph="◎" />,
          }}
        />
        <Tabs.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title: "Чат",
            tabBarIcon: ({ color }) => <TabIcon color={color} glyph="✉" />,
          }}
        />
        <Tabs.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: "Профиль",
            tabBarIcon: ({ color }) => <TabIcon color={color} glyph="⚙" />,
          }}
        />
      </Tabs.Navigator>
    </>
  );
}

export default function App() {
  const bootstrap = useStore((s) => s.bootstrap);
  const bootstrapped = useStore((s) => s.bootstrapped);
  const token = useStore((s) => s.token);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {token ? (
              <Stack.Screen name="Tabs" component={TabsNav} />
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
