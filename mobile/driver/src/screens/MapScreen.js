import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../state";
import { api } from "../api";
import LeafletMap from "../components/LeafletMap";

const SCREEN_H = Dimensions.get("window").height;
const DEFAULT_LAT = 55.7558;
const DEFAULT_LON = 37.6173;

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

// ─────────────────────────────────────────────
// OrderDetailSheet — "Новый заказ"
// ─────────────────────────────────────────────
function OrderDetailSheet({ order, sheetAnim, onClose }) {
  const [loading, setLoading] = useState(false);
  const refreshState = useStore((s) => s.refreshState);

  const price = order?.fare_total ?? order?.price ?? null;
  const distKm = order?.distance_km ?? order?.dist_km ?? null;
  const durationMin = order?.duration_min ?? order?.eta_minutes ?? null;
  const tariff = order?.tariff_name ?? order?.tariff ?? "Эконом";
  const payment = order?.payment_method;
  const paymentLabel =
    payment === "card"
      ? "💳 Карта"
      : payment === "online"
      ? "📱 Онлайн"
      : "💵 Наличные";

  const translateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_H, 0],
  });

  async function handleAccept() {
    if (!order?.public_id) return;
    setLoading(true);
    try {
      await api.accept(order.public_id);
      await refreshState();
      onClose();
    } catch (e) {
      Alert.alert("Ошибка", e.message || "Не удалось принять заказ");
    }
    setLoading(false);
  }

  async function handleDecline() {
    if (!order?.public_id) return;
    setLoading(true);
    try {
      await api.decline(order.public_id, "Водитель отклонил");
      onClose();
    } catch (e) {
      Alert.alert("Ошибка", e.message || "Не удалось отклонить заказ");
    }
    setLoading(false);
  }

  return (
    <Animated.View
      style={[styles.orderSheet, { transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      {/* Handle */}
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderTitle}>Новый заказ</Text>
          <Text style={styles.orderTariff}>{tariff}</Text>
        </View>
        <View style={styles.orderPriceBlock}>
          <Text style={styles.orderPrice}>
            {price != null ? `${Math.round(price)} ₽` : "—"}
          </Text>
          <Text style={styles.orderPayment}>{paymentLabel}</Text>
        </View>
      </View>

      {/* Info row: distance + time */}
      {(distKm != null || durationMin != null) && (
        <View style={styles.infoRow}>
          {distKm != null && (
            <View style={styles.infoChip}>
              <Text style={styles.infoChipText}>
                📍 {parseFloat(distKm).toFixed(1)} км до клиента
              </Text>
            </View>
          )}
          {durationMin != null && (
            <View style={styles.infoChip}>
              <Text style={styles.infoChipText}>
                ⏱ ~{Math.round(durationMin)} мин
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.divider} />

      {/* Route */}
      <View style={styles.routeSection}>
        <Text style={styles.routeLabel}>Маршрут</Text>
        <View style={styles.routeRow}>
          <View style={styles.dotCol}>
            <View style={styles.dotPickup} />
            <View style={styles.routeLine} />
            <View style={styles.dotDropoff} />
          </View>
          <View style={styles.routeTextCol}>
            <Text style={styles.routeAddr} numberOfLines={2}>
              {order?.pickup_address || "Точка отправления"}
            </Text>
            <View style={{ height: 14 }} />
            <Text style={styles.routeAddr} numberOfLines={2}>
              {order?.dropoff_address || "Точка назначения"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Buttons */}
      <View style={styles.btnGroup}>
        <Pressable
          style={[styles.acceptBtn, loading && styles.btnLoading]}
          onPress={handleAccept}
          disabled={loading}
        >
          <Text style={styles.acceptBtnText}>
            {loading ? "…" : "Принять"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.declineBtn, loading && styles.btnLoading]}
          onPress={handleDecline}
          disabled={loading}
        >
          <Text style={styles.declineBtnText}>
            {loading ? "…" : "Не принимать"}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// MapScreen
// ─────────────────────────────────────────────
export default function MapScreen() {
  const location     = useStore((s) => s.location);
  const available    = useStore((s) => s.available);
  const currentOrder = useStore((s) => s.currentOrder);
  const profile      = useStore((s) => s.profile);
  const refreshState = useStore((s) => s.refreshState);
  // Polling заказов каждые 10 секунд
  useEffect(() => {
    const t = setInterval(() => refreshState(), 10000);
    return () => clearInterval(t);
  }, [refreshState]);

  const mapRef = useRef(null);
  /* true = карта следует за водителем; false = пользователь сам двигает карту */
  const followMode = useRef(true);
  const hasInitialCenter = useRef(false);
  const [followActive, setFollowActive] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // Open / close sheet animation
  const openSheet = useCallback(
    (order) => {
      setSelectedOrder(order);
      Animated.spring(sheetAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 22,
        stiffness: 160,
      }).start();
    },
    [sheetAnim]
  );

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSelectedOrder(null));
  }, [sheetAnim]);

  // Пользователь потащил карту → выключаем follow
  const handleMapMessage = useCallback(
    (data) => {
      if (data.type === "userDrag") {
        followMode.current = false;
        setFollowActive(false);
      } else if (data.type === "markerTap") {
        const order = available[data.index];
        if (order) openSheet(order);
      }
    },
    [available, openSheet]
  );

  // Кнопка «вернуться к себе»
  const recenter = useCallback(() => {
    followMode.current = true;
    setFollowActive(true);
    const loc = useStore.getState().location;
    if (loc) mapRef.current?.setCenter(loc.lat, loc.lon, 14);
  }, []);

  // После загрузки карты — разово поставить позицию
  const handleMapReady = useCallback(() => {
    const loc = useStore.getState().location;
    if (loc) {
      mapRef.current?.setCenter(loc.lat, loc.lon, 14);
      mapRef.current?.setCar(loc.lat, loc.lon, loc.heading ?? null);
      hasInitialCenter.current = true;
    }
  }, []);

  // GPS/compass обновление — только двигаем машинку; центр только если follow-режим
  useEffect(() => {
    if (!location) return;
    // Первый фикс — всегда центрируем
    if (!hasInitialCenter.current) {
      mapRef.current?.setCenter(location.lat, location.lon, 14);
      hasInitialCenter.current = true;
    } else if (followMode.current) {
      mapRef.current?.setCenter(location.lat, location.lon, 14);
    }
    mapRef.current?.setCar(location.lat, location.lon, location.heading ?? null);
  }, [location?.lat, location?.lon, location?.heading]);

  // Update map markers
  useEffect(() => {
    const markers = [];

    available.forEach((o) => {
      if (o.pickup_lat != null) {
        markers.push({
          lat: o.pickup_lat,
          lon: o.pickup_lon,
          color: "#F5CF31",
          label: `${Math.round(o.fare_total ?? 0)} ₽`,
          priceLabel: `${Math.round(o.fare_total ?? 0)} ₽`,
        });
      }
    });

    if (currentOrder?.pickup_lat != null) {
      markers.push({
        lat: currentOrder.pickup_lat,
        lon: currentOrder.pickup_lon,
        color: "#FF5A4D",
        label: "Клиент",
        priceLabel: "📍 Клиент",
      });
    }
    if (currentOrder?.dropoff_lat != null) {
      markers.push({
        lat: currentOrder.dropoff_lat,
        lon: currentOrder.dropoff_lon,
        color: "#5CB8FF",
        label: "Назначение",
        priceLabel: "🏁 Назначение",
      });
    }

    mapRef.current?.setMarkers(markers);
  }, [available, currentOrder]);

  return (
    <View style={styles.root}>
      <LeafletMap
        ref={mapRef}
        centerLat={location?.lat ?? DEFAULT_LAT}
        centerLon={location?.lon ?? DEFAULT_LON}
        style={StyleSheet.absoluteFill}
        onReady={handleMapReady}
        onMessage={handleMapMessage}
      />

      {/* Кнопка «вернуться к себе» — справа, над нижней карточкой */}
      {!followActive && (
        <Pressable style={styles.recenterBtn} onPress={recenter}>
          <Text style={styles.recenterIcon}>📍</Text>
        </Pressable>
      )}

      {/* Bottom overlay card — stats only, no toggle */}
      {!selectedOrder && (
        <SafeAreaView style={styles.bottomOverlayWrap} edges={["bottom"]} pointerEvents="box-none">
          <View style={styles.bottomCard} pointerEvents="box-none">
            {/* Stats row */}
            <View style={styles.statsRow} pointerEvents="box-none">
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profile?.rating != null ? String(profile.rating) : "—"}
                </Text>
                <Text style={styles.statLabel}>Рейтинг</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {available.length > 0 ? String(available.length) : "0"}
                </Text>
                <Text style={styles.statLabel}>Заказов</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineBadgeText}>На линии</Text>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* Order detail sheet — rendered when an order is tapped */}
      {selectedOrder && (
        <>
          {/* Backdrop tap to close */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeSheet}
            accessible={false}
          />
          <SafeAreaView
            style={styles.sheetContainer}
            edges={["bottom"]}
            pointerEvents="box-none"
          >
            <OrderDetailSheet
              order={selectedOrder}
              sheetAnim={sheetAnim}
              onClose={closeSheet}
            />
          </SafeAreaView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },

  // Recenter button
  recenterBtn: {
    position: "absolute",
    right: 16,
    bottom: 210,   // above the bottom card
    zIndex: 25,
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(26,29,43,0.92)",
    borderWidth: 1, borderColor: D.border,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  recenterIcon: { fontSize: 22 },

  // Bottom overlay card
  bottomOverlayWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  bottomCard: {
    backgroundColor: D.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: D.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 16,
  },

  // Online badge (instead of toggle)
  onlineBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(60,212,141,0.15)",
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(60,212,141,0.3)",
  },
  onlineDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: D.success, marginRight: 6,
  },
  onlineBadgeText: { color: D.success, fontSize: 12, fontWeight: "700" },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 14,
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: {
    color: D.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  statLabel: { color: D.muted, fontSize: 11, fontWeight: "500" },
  statSep: { width: 1, height: 32, backgroundColor: D.border },

  // Bonus zone
  bonusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bonusIcon: { fontSize: 16, marginRight: 8 },
  bonusText: { color: D.muted, fontSize: 13, fontWeight: "500" },
  bonusAccent: { color: D.accent, fontWeight: "700" },

  // Order sheet
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  orderSheet: {
    backgroundColor: D.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    borderTopWidth: 1,
    borderColor: D.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: D.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 14,
  },

  // Order header
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  orderTitle: {
    color: D.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 2,
  },
  orderTariff: {
    color: D.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  orderPriceBlock: { alignItems: "flex-end" },
  orderPrice: {
    color: D.accent,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 2,
  },
  orderPayment: {
    color: D.muted,
    fontSize: 12,
  },

  // Info row
  infoRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  infoChip: {
    backgroundColor: D.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: D.border,
  },
  infoChipText: { color: D.muted, fontSize: 12, fontWeight: "500" },

  divider: {
    height: 1,
    backgroundColor: D.border,
    marginVertical: 12,
    marginHorizontal: 20,
  },

  // Route
  routeSection: { paddingHorizontal: 20, marginBottom: 4 },
  routeLabel: {
    color: D.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  routeRow: { flexDirection: "row" },
  dotCol: {
    width: 20,
    alignItems: "center",
    marginRight: 14,
    paddingTop: 3,
  },
  dotPickup: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF5A4D",
  },
  routeLine: {
    flex: 1,
    width: 2,
    backgroundColor: D.border,
    marginVertical: 4,
    minHeight: 20,
  },
  dotDropoff: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#5CB8FF",
  },
  routeTextCol: { flex: 1 },
  routeAddr: {
    fontSize: 15,
    color: D.text,
    lineHeight: 20,
  },

  // Buttons
  btnGroup: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: D.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  acceptBtnText: {
    color: D.actText,
    fontSize: 17,
    fontWeight: "800",
  },
  declineBtn: {
    backgroundColor: D.cardAlt,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: D.border,
  },
  declineBtnText: {
    color: D.muted,
    fontSize: 15,
    fontWeight: "600",
  },
  btnLoading: { opacity: 0.5 },
});
