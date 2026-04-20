import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, radius } from "../theme";

export default function OrderCard({ order, onAccept, onDecline, compact }) {
  return (
    <View style={[styles.card, compact && { padding: 10 }]}>
      <View style={styles.header}>
        <Text style={styles.fare}>
          {Math.round(Number(order.fare_total || 0)).toLocaleString("ru-RU")} ₽
        </Text>
        <Text style={styles.distance}>
          {((order.route_distance_meters || 0) / 1000).toFixed(1)} км
        </Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: colors.danger }]} />
        <Text style={styles.addr}>{order.pickup_address || "Точка А"}</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: colors.info }]} />
        <Text style={styles.addr}>{order.dropoff_address || "Точка Б"}</Text>
      </View>

      {!compact && (
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.decline]} onPress={onDecline}>
            <Text style={styles.declineText}>Отклонить</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.accept]} onPress={onAccept}>
            <Text style={styles.acceptText}>Принять</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  fare: { color: colors.text, fontSize: 20, fontWeight: "800" },
  distance: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 3 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  addr: { color: colors.text, fontSize: 13, flex: 1 },
  actions: { flexDirection: "row", marginTop: 12 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: radius.md,
  },
  decline: { backgroundColor: colors.cardAlt, marginRight: 8 },
  declineText: { color: colors.textMuted, fontWeight: "700" },
  accept: { backgroundColor: colors.accent },
  acceptText: { color: colors.accentText, fontWeight: "800" },
});
