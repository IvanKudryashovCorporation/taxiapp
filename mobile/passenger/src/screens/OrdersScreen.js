import React, { useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { List, MapPin, Clock, ChevronRight, AlertCircle } from "lucide-react-native";
import { useStore } from "../state";
import { api } from "../api";
import { shadows, radii, fonts } from "../theme";
import { useT } from "../hooks/useT";
import NavBar from "../components/NavBar";

function formatDate(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function humanStatus(s) {
  return ({
    created: "Новый", searching_driver: "Ищем водителя",
    accepted: "Водитель назначен", driver_on_the_way: "Водитель в пути",
    arrived: "Водитель на месте", ride_in_progress: "Поездка идёт",
    completed: "Завершён", cancelled: "Отменён",
  }[s] || s || "—");
}

function formatMoney(v) {
  return `${Math.round(Number(v || 0)).toLocaleString("ru-RU")} ₽`;
}

// badge StyleSheet has no T-dependent colors — stays static
const badge = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  dot:  { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: "600" },
});

function StatusBadge({ status }) {
  const T = useT();
  const map = {
    completed:        { label: "Завершён",  color: T.ok   },
    cancelled:        { label: "Отменён",   color: T.bad  },
    ride_in_progress: { label: "В пути",    color: T.sun  },
    accepted:         { label: "Назначен",  color: T.link },
    searching_driver: { label: "Поиск",     color: T.warn },
  };
  const cfg = map[status] || { label: status || "—", color: T.stone };
  return (
    <View style={[badge.pill, { backgroundColor: cfg.color + "22" }]}>
      <View style={[badge.dot, { backgroundColor: cfg.color }]} />
      <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function ActiveOrderCard({ order, onRefresh }) {
  const T  = useT();
  const ao = useMemo(() => makeAoStyles(T), [T]);

  const cancel = () => Alert.alert("Отменить заказ?", "", [
    { text: "Нет", style: "cancel" },
    { text: "Да",  style: "destructive", onPress: async () => {
      try { await api.cancelOrder(order.public_id); await onRefresh(); }
      catch (e) { Alert.alert("Ошибка", e.message); }
    }},
  ]);

  return (
    <ScrollView contentContainerStyle={ao.scroll}>
      <View style={ao.statusRow}>
        <View style={[ao.statusPill, { backgroundColor: T.sunSoft }]}>
          <Text style={ao.statusPillText}>● {humanStatus(order.status)}</Text>
        </View>
        <Text style={ao.orderId}>{order.public_id}</Text>
      </View>

      <View style={[ao.card, shadows.s1]}>
        <View style={ao.routeRow}>
          <View style={[ao.routeDot, { backgroundColor: T.sun }]} />
          <Text style={ao.routeText} numberOfLines={1}>{order.pickup_address || "Откуда"}</Text>
        </View>
        <View style={ao.routeLine} />
        <View style={ao.routeRow}>
          <View style={[ao.routeDot, { backgroundColor: T.ink, borderRadius: 2 }]} />
          <Text style={ao.routeText} numberOfLines={1}>{order.dropoff_address || "Куда"}</Text>
        </View>
      </View>

      {order.driver_full_name ? (
        <View style={[ao.card, shadows.s1]}>
          <Text style={ao.cardLabel}>ВОДИТЕЛЬ</Text>
          <Text style={ao.cardValue}>{order.driver_full_name}</Text>
          {(order.vehicle_make || order.vehicle_model) && (
            <Text style={ao.cardSub}>
              {[order.vehicle_make, order.vehicle_model, order.vehicle_plate].filter(Boolean).join(" ")}
            </Text>
          )}
        </View>
      ) : null}

      <View style={[ao.card, ao.priceCard, shadows.s1]}>
        <Text style={ao.cardLabel}>СТОИМОСТЬ</Text>
        <Text style={ao.price}>{formatMoney(order.fare_total)}</Text>
      </View>

      <Pressable style={ao.cancelBtn} onPress={cancel}>
        <Text style={ao.cancelText}>Отменить заказ</Text>
      </Pressable>
    </ScrollView>
  );
}

function OrderRow({ item }) {
  const T = useT();
  const s = useMemo(() => makeRowStyles(T), [T]);
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
  const history      = useStore((st) => st.history);
  const currentOrder = useStore((st) => st.currentOrder);
  const refreshState = useStore((st) => st.refreshState);
  const T = useT();
  const s = useMemo(() => makeScreenStyles(T), [T]);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.header}>
        <List size={22} color={T.ink} strokeWidth={1.8} />
        <Text style={s.title}>{currentOrder ? "Активный заказ" : "Заказы"}</Text>
      </View>

      {currentOrder ? (
        <ActiveOrderCard order={currentOrder} onRefresh={refreshState} />
      ) : (
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
      )}

      <NavBar active="ride" />
    </SafeAreaView>
  );
}

// ─── StyleSheet factories ──────────────────────────────────────────────────

function makeAoStyles(T) {
  return StyleSheet.create({
    scroll:         { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
    statusRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    statusPill:     { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
    statusPillText: { fontSize: 12, fontWeight: "700", color: T.sunDeep },
    orderId:        { fontSize: 11, fontFamily: fonts.mono, color: T.stone },
    card:           { backgroundColor: T.white, borderRadius: radii.r3, padding: 14, marginBottom: 10 },
    priceCard:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    routeRow:       { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
    routeDot:       { width: 10, height: 10, borderRadius: 5 },
    routeLine:      { width: 1, height: 12, backgroundColor: T.sand, marginLeft: 5 },
    routeText:      { flex: 1, fontSize: 14, fontWeight: "500", color: T.ink },
    cardLabel:      { fontSize: 10, fontWeight: "700", color: T.graphite, letterSpacing: 0.6, marginBottom: 4 },
    cardValue:      { fontSize: 15, fontWeight: "600", color: T.ink },
    cardSub:        { fontSize: 12, color: T.graphite, marginTop: 2 },
    price:          { fontSize: 24, fontWeight: "700", color: T.ink, fontFamily: fonts.mono },
    cancelBtn:      { borderWidth: 1, borderColor: T.sand, borderRadius: radii.r3, paddingVertical: 14, alignItems: "center", marginTop: 4 },
    cancelText:     { fontSize: 15, fontWeight: "500", color: T.bad },
  });
}

function makeRowStyles(T) {
  return StyleSheet.create({
    row:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 12, backgroundColor: T.white },
    rowIcon:  { width: 36, height: 36, borderRadius: 18, backgroundColor: T.paper, alignItems: "center", justifyContent: "center" },
    rowBody:  { flex: 1 },
    rowAddr:  { fontSize: 14, fontWeight: "500", color: T.ink, marginBottom: 5 },
    rowMeta:  { flexDirection: "row", alignItems: "center", gap: 5 },
    rowDate:  { fontSize: 11, color: T.stone },
    rowPrice: { fontSize: 14, fontWeight: "600", color: T.ink },
  });
}

function makeScreenStyles(T) {
  return StyleSheet.create({
    root:      { flex: 1, backgroundColor: T.paper },
    header:    {
      flexDirection: "row", alignItems: "center", gap: 10,
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
      borderBottomWidth: 1, borderBottomColor: T.sand, backgroundColor: T.white,
    },
    title:     { fontSize: 20, fontWeight: "700", color: T.ink },
    list:      { paddingBottom: 100 },
    sep:       { height: 1, backgroundColor: T.paper, marginLeft: 68 },
    empty:     { alignItems: "center", paddingTop: 80, gap: 16 },
    emptyText: { fontSize: 15, color: T.stone },
  });
}
