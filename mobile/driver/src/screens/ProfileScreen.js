import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../state";

const D = {
  bg: "#0F121C",
  card: "#1A1D2B",
  cardAlt: "#22263A",
  border: "#2E3347",
  text: "#EFF2FA",
  muted: "#8A92A8",
  accent: "#F5CF31",
  actText: "#11131B",
  success: "#3CD48D",
  danger: "#FF5A4D",
};

function MenuItem({ label, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuChevron}>›</Text>
    </Pressable>
  );
}

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
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingWrap}>
          <Text style={styles.muted}>Загрузка профиля…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const carLine = [
    profile.vehicle_make,
    profile.vehicle_model,
    profile.vehicle_color,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header card: rating + balance */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {(profile.full_name || "?")[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.fullName}>{profile.full_name || "—"}</Text>
              {carLine ? (
                <Text style={styles.carLine}>{carLine}</Text>
              ) : null}
              {profile.vehicle_plate ? (
                <View style={styles.plateBadge}>
                  <Text style={styles.plateText}>{profile.vehicle_plate}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ★ {profile.rating != null ? profile.rating : "—"}
              </Text>
              <Text style={styles.statLabel}>Рейтинг</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile.balance != null ? `${profile.balance} ₽` : "—"}
              </Text>
              <Text style={styles.statLabel}>Баланс</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile.level != null ? profile.level : "—"}
              </Text>
              <Text style={styles.statLabel}>Уровень</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          <MenuItem label="Личные данные" onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem label="Автомобиль" onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem label="Документы" onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem label="Настройки" onPress={() => {}} />
        </View>

        {/* Logout */}
        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.logoutText}>Выйти</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: D.muted, fontSize: 14 },

  // Header card
  headerCard: {
    backgroundColor: D.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: D.border,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: D.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarLetter: {
    color: D.actText,
    fontSize: 26,
    fontWeight: "800",
  },
  headerInfo: { flex: 1, justifyContent: "center" },
  fullName: {
    color: D.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  carLine: { color: D.muted, fontSize: 13, marginBottom: 6 },
  plateBadge: {
    alignSelf: "flex-start",
    backgroundColor: D.cardAlt,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: D.border,
  },
  plateText: { color: D.text, fontSize: 13, fontWeight: "700", letterSpacing: 1 },

  // Stats row inside header
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: D.border,
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { color: D.text, fontSize: 16, fontWeight: "800", marginBottom: 2 },
  statLabel: { color: D.muted, fontSize: 11 },
  statSep: { width: 1, height: 30, backgroundColor: D.border },

  // Menu card
  menuCard: {
    backgroundColor: D.card,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: D.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuItemPressed: { backgroundColor: D.cardAlt },
  menuLabel: { color: D.text, fontSize: 15, fontWeight: "500" },
  menuChevron: { color: D.muted, fontSize: 22, fontWeight: "300", marginTop: -2 },
  menuDivider: { height: 1, backgroundColor: D.border, marginHorizontal: 18 },

  // Logout
  logoutBtn: {
    backgroundColor: D.card,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: D.border,
  },
  logoutText: { color: D.danger, fontWeight: "700", fontSize: 15 },
});
