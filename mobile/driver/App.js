import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, Text } from "react-native";
import { useFonts } from "expo-font";
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular, JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";

import { useStore } from "./src/state";
import { colors } from "./src/theme";
import { Home, TrendingUp, MessageCircle, User } from "lucide-react-native";

import LoginScreen from "./src/screens/LoginScreen";
import MapScreen from "./src/screens/MapScreen";
import IncomeScreen from "./src/screens/IncomeScreen";
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
          name="Map"
          component={MapScreen}
          options={{
            title: "Главная",
            tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="Income"
          component={IncomeScreen}
          options={{
            title: "Доходы",
            tabBarIcon: ({ color }) => <TrendingUp size={22} color={color} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title: "Сообщения",
            tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: "Профиль",
            tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={1.8} />,
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

  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    JetBrainsMono_400Regular, JetBrainsMono_500Medium,
  });

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!bootstrapped || !fontsLoaded) {
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
