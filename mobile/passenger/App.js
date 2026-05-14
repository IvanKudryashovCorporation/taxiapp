import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular, JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useStore } from "./src/state";
import { colors } from "./src/theme";

import LoginScreen from "./src/screens/LoginScreen";
import VerifyScreen from "./src/screens/VerifyScreen";
import CityScreen from "./src/screens/CityScreen";
import MainScreen from "./src/screens/MainScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
      <Tab.Screen name="create"  component={MainScreen} />
      <Tab.Screen name="ride"    component={OrdersScreen} />
      <Tab.Screen name="fav"     component={FavoritesScreen} />
      <Tab.Screen name="profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

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

export default function App() {
  const bootstrap = useStore((s) => s.bootstrap);
  const bootstrapped = useStore((s) => s.bootstrapped);
  const token = useStore((s) => s.token);
  const cityLat = useStore((s) => s.cityLat);

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
          {/*
           * Conditional stack — реагирует на изменения стейта в реальном времени:
           *  · нет токена  → экраны входа (Login / Verify)
           *  · есть токен, нет города → CityScreen
           *  · всё есть   → Main
           * Так logout() мгновенно бросает на Login без ручной навигации.
           */}
          <Stack.Navigator
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
          >
            {!token ? (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Verify" component={VerifyScreen} />
              </>
            ) : !cityLat ? (
              <Stack.Screen name="City" component={CityScreen} />
            ) : (
              <Stack.Screen name="Main" component={MainTabs} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
