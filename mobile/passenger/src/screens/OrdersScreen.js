import React from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { List, MapPin, Clock, ChevronRight, AlertCircle } from "lucide-react-native";
import { useStore } from "../state";
import { T, shadows, radii } from "../theme";

function formatDate(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function StatusBadge({ status }) {
  const map = {
    completed:   { label: "Завершён",  color: T.ok  },
    cancelled:   { label: "Отменён",   color: T.bad },
    ride_in_progress: { label: "В пути", color: T.sun },
  };
  const s = map[status] || { label: status || "—", color: T.stone };
  return (
    <View style={[badge.pill, { backgroundColor: s.color + "22" }]}>
      <View style={[badge.dot, { backgroundColor: s.color }]} />
      <Text style={[badge.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: "600" },
});

function OrderRow({ item }) {
  return (
    <Pressable style={({ pressed }) => [s.row, pressed && { backgroundColor: T.paper }]}>
      <View style={s.rowIcon}>
        <MapPin size={18} color={T.graphite} strokeWidth={1.8} />
      </View>
      <View style={s.rowBody}>
        <Text style={s.rowAddr} numberOfLines={1}>{item.dropoff_address || "Адрес неизвестен"}</Text>
        <View style={s.rowMeta}>
          <Clock size={11} color={T.stone} strokeWidth={1.5} />
          <Text style={s.rowDate}>{formatDate(item.created_at)}</Text>
          <StatusBadge status={item.status} />
        </View>
      </View>
      <Text style={s.rowPrice}>{item.fare_total ? `${Math.round(item.fare_total)} ₽` : "—"}</Text>
      <ChevronRight size={16} color={T.mist} strokeWidth={1.5} />
    </Pressable>
  );
}

export default function OrdersScreen() {
  const history = useStore((st) => st.history);
  const currentOrder = useStore((st) => st.currentOrder);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.header}>
        <List size={22} color={T.ink} strokeWidth={1.8} />
        <Text style={s.title}>Заказы</Text>
      </View>

      {currentOrder && (
        <View style={[s.activeCard, shadows.s2]}>
          <View style={s.activePill}><Text style={s.activePillText}>● Активный заказ</Text></View>
          <Text style={s.activeAddr} numberOfLines={1}>{currentOrder.dropoff_address || "—"}</Text>
          <Text style={s.activeSub}>{currentOrder.status || "обработка"}</Text>
        </View>
      )}

      <FlatList
        data={history || []}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <OrderRow item={item} />}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <AlertCircle size={48} color={T.mist} strokeWidth={1} />
            <Text style={s.emptyText}>История поездок пуста</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.paper },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: T.sand, backgroundColor: T.white,
  },
  title: { fontSize: 20, fontWeight: "700", color: T.ink },
  activeCard: {
    margin: 16, padding: 16, backgroundColor: T.white,
    borderRadius: radii.r3, borderLeftWidth: 3, borderLeftColor: T.sun,
  },
  activePill: { marginBottom: 6 },
  activePillText: { fontSize: 11, fontWeight: "700", color: T.sun, letterSpacing: 0.3 },
  activeAddr: { fontSize: 15, fontWeight: "600", color: T.ink, marginBottom: 3 },
  activeSub: { fontSize: 13, color: T.graphite },
  list: { paddingBottom: 32 },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14, gap: 12, backgroundColor: T.white,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.paper, alignItems: "center", justifyContent: "center",
  },
  rowBody: { flex: 1 },
  rowAddr: { fontSize: 14, fontWeight: "500", color: T.ink, marginBottom: 5 },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  rowDate: { fontSize: 11, color: T.stone },
  rowPrice: { fontSize: 14, fontWeight: "600", color: T.ink },
  sep: { height: 1, backgroundColor: T.paper, marginLeft: 68 },
  empty: { alignItems: "center", paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 15, color: T.stone },
});
