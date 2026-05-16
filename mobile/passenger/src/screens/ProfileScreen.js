import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Settings, HelpCircle, Star, ChevronRight, Sun, Moon } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useStore } from "../state";
import { radii, shadows, fonts } from "../theme";
import { useT } from "../hooks/useT";
import NavBar from "../components/NavBar";

const MENU = [
  { Icon: Settings,   label: "Настройки",         onPress: () => Alert.alert("Настройки", "Раздел в разработке") },
  { Icon: HelpCircle, label: "Поддержка",          onPress: null },
  { Icon: Star,       label: "Оценить приложение", onPress: () => Alert.alert("Спасибо!", "Оценка в разработке") },
];

export default function ProfileScreen() {
  const navigation   = useNavigation();
  const profile      = useStore((s) => s.profile);
  const logout       = useStore((s) => s.logout);
  const themeMode    = useStore((s) => s.themeMode);
  const setThemeMode = useStore((s) => s.setThemeMode);
  const T            = useT();
  const s            = useMemo(() => makeStyles(T), [T]);

  const initials = profile?.name
    ? profile.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "П";

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>{profile?.name || "Пассажир"}</Text>
          {!!profile?.phone && <Text style={s.phone}>{profile.phone}</Text>}
        </View>

        <View style={[s.card, shadows.s1]}>
          {MENU.map((item, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                s.row,
                pressed && { backgroundColor: T.paper },
                i < MENU.length - 1 && s.rowSep,
              ]}
              onPress={item.label === "Поддержка"
                ? () => navigation.navigate("SupportChat")
                : item.onPress}
            >
              <View style={s.rowIconWrap}>
                <item.Icon size={18} color={T.graphite} strokeWidth={1.8} />
              </View>
              <Text style={s.rowLabel}>{item.label}</Text>
              <ChevronRight size={16} color={T.mist} strokeWidth={1.5} />
            </Pressable>
          ))}
        </View>

        {/* Theme toggle */}
        <View style={[s.card, shadows.s1, { marginTop: 0 }]}>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={s.rowIconWrap}>
                {themeMode === "dark"
                  ? <Moon size={18} color={T.graphite} strokeWidth={1.8} />
                  : <Sun  size={18} color={T.graphite} strokeWidth={1.8} />}
              </View>
              <Text style={s.rowLabel}>
                {themeMode === "dark" ? "Тёмная тема" : "Светлая тема"}
              </Text>
            </View>
            <Pressable
              onPress={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              style={({ pressed }) => ({
                width: 50, height: 28, borderRadius: 14,
                backgroundColor: themeMode === "dark" ? T.sun : T.sand,
                justifyContent: "center",
                paddingHorizontal: 3,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{
                width: 22, height: 22, borderRadius: 11,
                backgroundColor: T.white,
                alignSelf: themeMode === "dark" ? "flex-end" : "flex-start",
              }} />
            </Pressable>
          </View>
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [s.logoutBtn, shadows.s1, pressed && { opacity: 0.7 }]}
          onPress={() =>
            Alert.alert("Выйти из аккаунта?", "", [
              { text: "Нет",    style: "cancel" },
              { text: "Выйти", style: "destructive", onPress: logout },
            ])
          }
        >
          <LogOut size={18} color={T.bad} strokeWidth={1.8} />
          <Text style={s.logoutText}>Выйти из аккаунта</Text>
        </Pressable>

        <Text style={s.version}>Версия 1.0.0</Text>
      </ScrollView>

      <NavBar active="profile" />
    </SafeAreaView>
  );
}

function makeStyles(T) {
  return StyleSheet.create({
    root:        { flex: 1, backgroundColor: T.paper },
    scroll:      { paddingBottom: 16 },
    hero:        { alignItems: "center", paddingTop: 36, paddingBottom: 28, paddingHorizontal: 20 },
    avatar:      {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: T.ink,
      alignItems: "center", justifyContent: "center", marginBottom: 14,
    },
    avatarText:  { fontSize: 28, fontWeight: "700", color: T.paper, fontFamily: fonts.display },
    name:        { fontSize: 20, fontWeight: "700", color: T.ink, marginBottom: 4 },
    phone:       { fontSize: 14, color: T.graphite },
    card:        {
      backgroundColor: T.white,
      borderRadius: radii.r3,
      marginHorizontal: 16, marginBottom: 12, overflow: "hidden",
    },
    row:         {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 16, paddingVertical: 16, gap: 12,
      backgroundColor: T.white,
    },
    rowSep:      { borderBottomWidth: 1, borderBottomColor: T.sand },
    rowIconWrap: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: T.paper,
      alignItems: "center", justifyContent: "center",
    },
    rowLabel:    { flex: 1, fontSize: 15, fontWeight: "500", color: T.ink },
    logoutBtn:   {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, marginHorizontal: 16, marginTop: 4, paddingVertical: 16,
      borderRadius: radii.r3, backgroundColor: T.white,
    },
    logoutText:  { fontSize: 15, fontWeight: "500", color: T.bad },
    version:     { textAlign: "center", fontSize: 11, color: T.mist, marginTop: 24, marginBottom: 8 },
  });
}
