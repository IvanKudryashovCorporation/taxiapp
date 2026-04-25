import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useStore } from "../state";
import { api } from "../api";
import { colors, radius } from "../theme";
import OrderCard from "../components/OrderCard";

export default function OrdersScreen() {
  const available = useStore((s) => s.available);
  const currentOrder = useStore((s) => s.currentOrder);
  const refreshState = useStore((s) => s.refreshState);
  const profile = useStore((s) => s.profile);
  const wsStatus = useStore((s) => s.wsStatus);

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshState();
    }, [refreshState])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshState();
    } finally {
      setRefreshing(false);
    }
  };

  const accept = async (id) => {
    try {
      await api.accept(id);
      await refreshState();
    } catch (e) {
      Alert.alert("Ошибка", e.message || "Не удалось принять");
    }
  };

  const decline = async (id) => {
    try {
      await api.decline(id, "Отклонено");
      await refreshState();
    } catch (e) {
      Alert.alert("Ошибка", e.message || "Не удалось отклонить");
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>{profile?.full_name || "Водитель"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <View
              style={[
                styles.wsDot,
                { backgroundColor: wsStatus === "online" ? colors.success : colors.textDim },
              ]}
            />
            <Text style={styles.status}>
              {wsStatus === "online" ? "онлайн" : "офлайн"}
            </Text>
          </View>
        </View>
      </View>

      {currentOrder && (
        <View style={styles.activeWrap}>
          <Text style={styles.sectionTitle}>Текущий заказ</Text>
          <OrderCard order={currentOrder} compact />
          <ActiveOrderActions order={currentOrder} onChange={refreshState} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 14 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={styles.sectionTitle}>Доступные заказы</Text>
        {available.length === 0 ? (
          <Text style={styles.muted}>Пока нет новых заказов.</Text>
        ) : (
          available.map((o) => (
            <OrderCard
              key={o.public_id}
              order={o}
              onAccept={() => accept(o.public_id)}
              onDecline={() => decline(o.public_id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActiveOrderActions({ order, onChange }) {
  const setStatus = async (status) => {
    try {
      await api.setStatus(order.public_id, status);
      await onChange();
    } catch (e) {
      Alert.alert("Ошибка", e.message);
    }
  };

  const cancel = () => {
    Alert.alert("Отменить заказ?", "", [
      { text: "Нет", style: "cancel" },
      {
        text: "Да",
        style: "destructive",
        onPress: async () => {
          try {
            await api.cancel(order.public_id);
            await onChange();
          } catch (e) {
            Alert.alert("Ошибка", e.message);
          }
        },
      },
    ]);
  };

  const status = order.status;
  const buttons = [];
  if (status === "accepted") buttons.push({ label: "В пути к клиенту", next: "driver_on_the_way" });
  if (status === "driver_on_the_way") buttons.push({ label: "Прибыл", next: "arrived" });
  if (status === "arrived") buttons.push({ label: "Начать поездку", next: "ride_in_progress" });
  if (status === "ride_in_progress") buttons.push({ label: "Завершить поездку", next: "completed" });

  return (
    <View style={{ marginTop: 6 }}>
      {buttons.map((b) => (
        <Pressable
          key={b.next}
          onPress={() => setStatus(b.next)}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>{b.label}</Text>
        </Pressable>
      ))}
      <Pressable onPress={cancel} style={styles.cancelBtn}>
        <Text style={styles.cancelBtnText}>Отменить заказ</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hello: { color: colors.text, fontWeight: "700", fontSize: 16 },
  wsDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  status: { color: colors.textMuted, fontSize: 12 },
  activeWrap: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 14, marginBottom: 8 },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 20, textAlign: "center" },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: { color: colors.accentText, fontWeight: "800", fontSize: 14 },
  cancelBtn: {
    backgroundColor: colors.cardAlt,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: 6,
  },
  cancelBtnText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
});
