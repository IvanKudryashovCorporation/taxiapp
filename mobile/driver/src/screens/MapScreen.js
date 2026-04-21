import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../state";
import { api } from "../api";
import { colors, radius } from "../theme";
import LeafletMap from "../components/LeafletMap";

const SCREEN_H = Dimensions.get("window").height;
const DEFAULT_LAT = 55.7558;
const DEFAULT_LON = 37.6173;

// ─────────────────────────────────────────────
// OrderDetailSheet
// ─────────────────────────────────────────────
function OrderDetailSheet({ order, sheetAnim, onClose }) {
  const [loading, setLoading] = useState(false);
  const refreshState = useStore((s) => s.refreshState);

  const price = order?.fare_total ?? order?.price ?? null;
  const distKm = order?.distance_km ?? order?.dist_km ?? null;
  const durationMin = order?.duration_min ?? order?.eta_minutes ?? null;
  const tariff = order?.tariff_name ?? order?.tariff ?? "Эконом";
  const payment = order?.payment_method;
  const paymentLabel = payment === "card" ? "💳 Карта"
    : payment === "online" ? "📱 Онлайн"
    : "💵 Наличные";

  const passengerName = order?.passenger_name ?? order?.passenger?.name ?? null;

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
      style={[styles.sheet, { transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      {/* Handle */}
      <View style={styles.handle} />

      {/* Price row */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>
          {price != null ? `${Math.round(price)} ₽` : "—"}
        </Text>
        <View style={styles.subtitleRow}>
          {tariff ? <Text style={styles.subtitleChip}>{tariff}</Text> : null}
          {distKm != null && (
            <Text style={styles.subtitleChip}>{parseFloat(distKm).toFixed(1)} км</Text>
          )}
          {durationMin != null && (
            <Text style={styles.subtitleChip}>~{Math.round(durationMin)} мин</Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Route */}
      <View style={styles.routeSection}>
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
            <View style={{ height: 16 }} />
            <Text style={styles.routeAddr} numberOfLines={2}>
              {order?.dropoff_address || "Точка назначения"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Payment + passenger */}
      <View style={styles.metaSection}>
        <Text style={styles.metaItem}>{paymentLabel}</Text>
        {passengerName && (
          <Text style={styles.metaItem}>👤 {passengerName}</Text>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.btnGroup}>
        <Pressable
          style={[styles.acceptBtn, loading && styles.btnLoading]}
          onPress={handleAccept}
          disabled={loading}
        >
          <Text style={styles.acceptBtnText}>
            {loading ? "…" : "✓  Принять заказ"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.declineBtn, loading && styles.btnLoading]}
          onPress={handleDecline}
          disabled={loading}
        >
          <Text style={styles.declineBtnText}>
            {loading ? "…" : "Отклонить"}
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
  const location = useStore((s) => s.location);
  const available = useStore((s) => s.available);
  const currentOrder = useStore((s) => s.currentOrder);
  const wsStatus = useStore((s) => s.wsStatus);
  const mapRef = useRef(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // Open / close sheet animation
  const openSheet = useCallback((order) => {
    setSelectedOrder(order);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 22,
      stiffness: 160,
    }).start();
  }, [sheetAnim]);

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSelectedOrder(null));
  }, [sheetAnim]);

  // After map loads, apply driver position if already available
  const handleMapReady = useCallback(() => {
    const loc = useStore.getState().location;
    if (loc) {
      mapRef.current?.setCenter(loc.lat, loc.lon, 14);
      mapRef.current?.setCar(loc.lat, loc.lon);
    }
  }, []);

  // Follow driver GPS
  useEffect(() => {
    if (location) {
      mapRef.current?.setCenter(location.lat, location.lon, 14);
      mapRef.current?.setCar(location.lat, location.lon);
    }
  }, [location?.lat, location?.lon]);

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

  // Handle messages from the WebView map
  const handleMapMessage = useCallback(
    (data) => {
      if (data.type === "markerTap") {
        const order = available[data.index];
        if (order) openSheet(order);
      }
    },
    [available, openSheet]
  );

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

      {/* WS status pill */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.pill}>
          <View
            style={[
              styles.dot,
              { backgroundColor: wsStatus === "online" ? colors.success : colors.textDim },
            ]}
          />
          <Text style={styles.pillText}>
            {wsStatus === "online" ? "онлайн" : "офлайн"}
            {location ? `  ·  ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : ""}
          </Text>
        </View>
      </SafeAreaView>

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
  root: { flex: 1, backgroundColor: colors.bg },

  // WS pill
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(23,26,38,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  pillText: { color: colors.text, fontSize: 12, fontWeight: "600" },

  // Sheet
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  sheet: {
    backgroundColor: colors.sheet,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: SCREEN_H * 0.65,
    paddingBottom: 16,
    // shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },

  // Price
  priceRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  price: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.accent,
    marginBottom: 6,
  },
  subtitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  subtitleChip: {
    fontSize: 13,
    color: colors.textMuted,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
    marginHorizontal: 20,
  },

  // Route
  routeSection: { paddingHorizontal: 20, marginBottom: 4 },
  routeRow: { flexDirection: "row" },
  dotCol: {
    width: 20,
    alignItems: "center",
    marginRight: 14,
    paddingTop: 3,
  },
  dotPickup: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#FF5A4D",
  },
  routeLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
    minHeight: 24,
  },
  dotDropoff: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#5CB8FF",
  },
  routeTextCol: { flex: 1 },
  routeAddr: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },

  // Meta
  metaSection: {
    paddingHorizontal: 20,
    marginBottom: 4,
    gap: 4,
  },
  metaItem: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },

  // Buttons
  btnGroup: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  declineBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  declineBtnText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
  },
  btnLoading: { opacity: 0.5 },
});
