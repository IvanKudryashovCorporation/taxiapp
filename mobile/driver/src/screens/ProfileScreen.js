// ProfileScreen — спека §6.2.9.
// Header: avatar 80, имя, рейтинг fontMono, "Активен с …".
// Карточка авто, список пунктов (rows: иконка, label, шеврон).
import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../state";
import { T, fonts, radii } from "../theme";
import { Icon } from "../components/Icon";

const MENU = [
  { id: "docs",     icon: "shield",   label: "Документы",    onPress: () => Alert.alert("Документы", "Раздел в разработке") },
  { id: "safety",   icon: "warn",     label: "Безопасность", onPress: () => Alert.alert("Безопасность", "Смена пароля, 2FA, история сессий — в разработке") },
  { id: "support",  icon: "chat",     label: "Поддержка",    onPress: null },
  { id: "language", icon: "settings", label: "Язык",         onPress: () => Alert.alert("Язык", "Текущий язык: Русский\nEnglish — в разработке") },
  { id: "theme",    icon: "moon",     label: "Тема",         onPress: () => Alert.alert("Тема", "Переключатель темы — в разработке") },
  { id: "about",    icon: "info",     label: "О приложении", onPress: () => Alert.alert("Профсоюз Рассвет", "Версия 1.0.0\nПриложение для водителей") },
];

export default function ProfileScreen() {
  const profile = useStore((s) => s.profile);
  const logout = useStore((s) => s.logout);

  const confirmLogout = () => {
    Alert.alert("Выйти из аккаунта?", "", [
      { text: "Нет", style: "cancel" },
      { text: "Да", style: "destructive", onPress: logout },
    ]);
  };

  if (!profile) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.loading}>
          <Text style={s.muted}>Загрузка профиля…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initial = (profile.full_name || "?")[0].toUpperCase();
  const carLine = [profile.vehicle_make, profile.vehicle_model, profile.vehicle_color].filter(Boolean).join(" · ");
  const since = profile.active_since || "янв 2024";

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarLetter}>{initial}</Text>
          </View>
          <Text style={s.name}>{profile.full_name || "—"}</Text>
          <View style={s.ratingRow}>
            <Icon name="star" size={14} color={T.sun} />
            <Text style={s.rating}>{profile.rating != null ? profile.rating : "—"}</Text>
          </View>
          <Text style={s.since}>Активен с {since}</Text>
        </View>

        {/* Car card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>АВТОМОБИЛЬ</Text>
          {carLine ? <Text style={s.cardLine}>{carLine}</Text> : null}
          {profile.vehicle_year ? <Text style={s.cardSubLine}>{profile.vehicle_year} год</Text> : null}
          {profile.vehicle_plate ? (
            <View style={s.plateBadge}>
              <Text style={s.plateText}>{profile.vehicle_plate}</Text>
            </View>
          ) : null}
        </View>

        {/* Menu rows */}
        <View style={s.menu}>
          {MENU.map((m, i) => (
            <Pressable
              key={m.id}
              style={({ pressed }) => [
                s.menuRow,
                i < MENU.length - 1 && s.menuRowSep,
                pressed && { backgroundColor: T.ink2 },
              ]}
              onPress={m.onPress}
            >
              <Icon name={m.icon} size={20} color={T.stone} />
              <Text style={s.menuLabel}>{m.label}</Text>
              <Icon name="arrow" size={16} color={T.stone} />
            </Pressable>
          ))}
        </View>

        {/* Logout row */}
        <Pressable onPress={confirmLogout} style={s.logoutRow}>
          <Icon name="back" size={20} color={T.bad} />
          <Text style={s.logoutText}>Выйти</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.ink },
  scroll: { padding: 16, paddingBottom: 32 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { fontFamily: fonts.ui, color: T.stone, fontSize: 14 },

  header: { alignItems: "center", paddingVertical: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.ink2, alignItems: "center", justifyContent: "center",
    marginBottom: 14, borderWidth: 1, borderColor: T.ink3,
  },
  avatarLetter: { fontFamily: fonts.display, fontSize: 32, fontWeight: "600", color: T.paper2 },
  name: { fontFamily: fonts.display, fontSize: 22, fontWeight: "600", color: T.white },
  ratingRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6,
  },
  rating: { fontFamily: fonts.mono, fontSize: 14, fontWeight: "500", color: T.paper2 },
  since: { fontFamily: fonts.ui, fontSize: 12, color: T.stone, marginTop: 4 },

  card: {
    backgroundColor: T.ink2, borderRadius: radii.r3,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: T.ink3,
  },
  cardLabel: {
    fontFamily: fonts.ui, fontSize: 11, color: T.stone,
    fontWeight: "600", letterSpacing: 0.6, marginBottom: 6,
  },
  cardLine: { fontFamily: fonts.ui, fontSize: 15, fontWeight: "500", color: T.paper2 },
  cardSubLine: { fontFamily: fonts.ui, fontSize: 13, color: T.mist, marginTop: 2 },
  plateBadge: {
    alignSelf: "flex-start", marginTop: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: T.paper2, borderRadius: radii.r1,
  },
  plateText: { fontFamily: fonts.mono, fontSize: 14, fontWeight: "600", color: T.paper2, letterSpacing: 1 },

  menu: {
    backgroundColor: T.ink2, borderRadius: radii.r3,
    overflow: "hidden",
    borderWidth: 1, borderColor: T.ink3,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, height: 56,
  },
  menuRowSep: { borderBottomWidth: 1, borderBottomColor: T.ink3 },
  menuLabel: { flex: 1, fontFamily: fonts.ui, fontSize: 15, color: T.paper2 },

  logoutRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, height: 56,
    backgroundColor: T.ink2, borderRadius: radii.r3,
    borderWidth: 1, borderColor: T.ink3,
  },
  logoutText: { fontFamily: fonts.ui, fontSize: 15, color: T.bad, fontWeight: "500" },
});
