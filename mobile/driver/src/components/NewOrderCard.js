// NewOrderCard — modal с входящим заказом для водителя.
// Спека §6.2.3: dark sheet, sun price, countdown timer, two CTAs.
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Pressable, StyleSheet, Modal, Animated, Dimensions, ActivityIndicator,
} from "react-native";
import { T, fonts, radii, shadows } from "../theme";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

function formatMoney(v) {
  return `${Math.round(Number(v || 0)).toLocaleString("ru-RU").replace(",", " ")} ₽`;
}

function CountdownRing({ secs, total = 30, size = 56 }) {
  const stroke = 3;
  // RN не поддерживает SVG без react-native-svg. Используем простой текстовый таймер
  // с decorative border-pulse.
  return (
    <View style={[ringStyles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[ringStyles.outer, {
        width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: T.ink3,
      }]} />
      <View style={[ringStyles.outer, {
        width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: T.sun,
        opacity: secs / total,
      }]} />
      <Text style={ringStyles.text}>{secs}</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  outer: { position: "absolute" },
  text: { fontFamily: fonts.mono, fontSize: 24, fontWeight: "600", color: T.sun },
});

export default function NewOrderCard({
  visible, order, onAccept, onDecline, autoTimeoutSecs = 30,
}) {
  const slide = useRef(new Animated.Value(SCREEN_H)).current;
  const [secs, setSecs] = useState(autoTimeoutSecs);
  const [busy, setBusy] = useState(null); // 'accept' | 'decline' | null

  useEffect(() => {
    if (!visible) return;
    setSecs(autoTimeoutSecs);
    Animated.spring(slide, {
      toValue: 0, useNativeDriver: true, tension: 80, friction: 12,
    }).start();
  }, [visible]); // eslint-disable-line

  useEffect(() => {
    if (!visible) return;
    if (secs <= 0) { handleDecline(); return; }
    const t = setTimeout(() => setSecs((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, visible]); // eslint-disable-line

  function close() {
    Animated.timing(slide, {
      toValue: SCREEN_H, duration: 220, useNativeDriver: true,
    }).start();
  }

  async function handleAccept() {
    setBusy("accept");
    try { await onAccept?.(order); close(); }
    finally { setBusy(null); }
  }

  async function handleDecline() {
    setBusy("decline");
    try { await onDecline?.(order); close(); }
    finally { setBusy(null); }
  }

  if (!order) return null;

  const distKm = order.distance_km ?? order.dist_km;
  const tripKm = order.trip_distance_km ?? order.distance_km;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDecline}>
      <View style={s.backdrop} />
      <Animated.View
        style={[
          s.card,
          shadows.s3,
          { transform: [{ translateY: slide }] },
        ]}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Новый заказ</Text>
          <CountdownRing secs={secs} total={autoTimeoutSecs} />
        </View>

        {/* Price */}
        <Text style={s.price}>{formatMoney(order.fare_total)}</Text>

        {/* Route */}
        <View style={s.routeWrap}>
          <View style={s.routeRow}>
            <View style={s.dotPickup} />
            <View style={{ flex: 1 }}>
              <Text style={s.addr} numberOfLines={2}>
                {order.pickup_address || "Точка А"}
              </Text>
              {distKm != null && (
                <Text style={s.addrSub}>{parseFloat(distKm).toFixed(1)} км подачи</Text>
              )}
            </View>
          </View>

          <View style={s.routeLine} />

          <View style={s.routeRow}>
            <View style={s.dotDropoff} />
            <View style={{ flex: 1 }}>
              <Text style={s.addr} numberOfLines={2}>
                {order.dropoff_address || "Точка Б"}
              </Text>
              {tripKm != null && (
                <Text style={s.addrSub}>{parseFloat(tripKm).toFixed(1)} км поездки</Text>
              )}
            </View>
          </View>
        </View>

        {/* CTAs */}
        <View style={s.actions}>
          <Pressable
            style={[s.declineBtn, busy === "decline" && { opacity: 0.5 }]}
            onPress={handleDecline}
            disabled={!!busy}
          >
            {busy === "decline"
              ? <ActivityIndicator color={T.mist} />
              : <Text style={s.declineText}>Отклонить</Text>}
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              s.acceptBtn,
              busy === "accept" && { opacity: 0.7 },
              pressed && !busy && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleAccept}
            disabled={!!busy}
          >
            {busy === "accept"
              ? <ActivityIndicator color={T.ink} />
              : <Text style={s.acceptText}>Принять</Text>}
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },

  card: {
    position: "absolute", left: 8, right: 8, bottom: 16,
    width: SCREEN_W - 16,
    backgroundColor: T.ink2,
    borderRadius: radii.r5,
    padding: 24,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 16,
  },
  title: { fontFamily: fonts.display, fontSize: 22, fontWeight: "600", color: T.white },

  price: {
    fontFamily: fonts.mono, fontSize: 40, fontWeight: "700", color: T.sun,
    letterSpacing: -0.5, marginBottom: 24,
  },

  routeWrap: { marginBottom: 24 },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  dotPickup:  { width: 12, height: 12, borderRadius: 6, backgroundColor: T.sun, marginTop: 4 },
  dotDropoff: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: T.paper2, marginTop: 4 },
  routeLine:  { width: 1, height: 18, backgroundColor: T.ink3, marginLeft: 5, marginVertical: 4 },
  addr:       { fontFamily: fonts.ui, fontSize: 15, fontWeight: "500", color: T.white, lineHeight: 20 },
  addrSub:    { fontFamily: fonts.mono, fontSize: 12, fontWeight: "500", color: T.stone, marginTop: 2 },

  actions: { flexDirection: "row", gap: 10 },
  declineBtn: {
    flex: 1, height: 56, borderRadius: radii.r3,
    borderWidth: 1, borderColor: T.ink3,
    alignItems: "center", justifyContent: "center",
  },
  declineText: { fontFamily: fonts.ui, fontSize: 15, fontWeight: "500", color: T.mist },
  acceptBtn: {
    flex: 2, height: 56, borderRadius: radii.r3,
    backgroundColor: T.sun,
    alignItems: "center", justifyContent: "center",
  },
  acceptText: { fontFamily: fonts.ui, fontSize: 17, fontWeight: "600", color: T.ink },
});
