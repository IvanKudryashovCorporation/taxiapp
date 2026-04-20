import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../state";
import { colors, radius } from "../theme";

export default function ProfileScreen() {
  const profile = useStore((s) => s.profile);
  const logout = useStore((s) => s.logout);
  const isOnline = useStore((s) => s.isOnline);
  const wsStatus = useStore((s) => s.wsStatus);
  const location = useStore((s) => s.location);

  const confirmLogout = () => {
    Alert.alert("Выйти из аккаунта?", "", [
      { text: "Нет", style: "cancel" },
      { text: "Да", style: "destructive", onPress: logout },
    ]);
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.muted}>Загрузка профиля…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <View style={styles.card}>
          <Text style={styles.name}>{profile.full_name || "—"}</Text>
          <Text style={styles.muted}>ID: {profile.public_id}</Text>
          <Text style={styles.muted}>Рейтинг: ★ {profile.rating ?? "—"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Автомобиль</Text>
          <Row label="Марка" value={profile.vehicle_make} />
          <Row label="Модель" value={profile.vehicle_model} />
          <Row label="Цвет" value={profile.vehicle_color} />
          <Row label="Номер" value={profile.vehicle_plate} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Состояние</Text>
          <Row label="Смена" value={isOnline ? "активна" : "не на смене"} />
          <Row label="WebSocket" value={wsStatus} />
          <Row
            label="Координаты"
            value={location ? `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}` : "—"}
          />
          <Row label="Баланс" value={profile.balance != null ? `${profile.balance} ₽` : "—"} />
        </View>

        <Pressable onPress={confirmLogout} style={styles.logout}>
          <Text style={styles.logoutText}>Выйти</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontSize: 20, fontWeight: "800" },
  sectionTitle: { color: colors.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowLabel: { color: colors.textMuted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: "600" },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  logout: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  logoutText: { color: colors.danger, fontWeight: "800", fontSize: 14 },
});
