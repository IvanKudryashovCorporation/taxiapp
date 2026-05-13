import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Pressable, StyleSheet, Animated, Easing, Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { T, fonts, radii, shadows } from "../theme";
import { Icon } from "../components/Icon";
import { useStore } from "../state";
import { api } from "../api";

function fmtMMSS(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function PulseRing({ delay = 0 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, {
        toValue: 1, duration: 2000, delay,
        easing: Easing.linear, useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });
  return (
    <Animated.View
      style={[s.ring, { transform: [{ scale }], opacity }]}
    />
  );
}

export default function SearchingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentOrder = useStore((st) => st.currentOrder);
  const refreshState = useStore((st) => st.refreshState);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSecs((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!currentOrder) return;
    if (["accepted", "driver_on_the_way", "arrived", "ride_in_progress"].includes(currentOrder.status)) {
      navigation.replace("InRide");
    }
  }, [currentOrder?.status]); // eslint-disable-line

  const cancel = () => Alert.alert("Отменить заказ?", "", [
    { text: "Нет", style: "cancel" },
    {
      text: "Да", style: "destructive",
      onPress: async () => {
        try {
          if (currentOrder?.public_id) await api.cancelOrder(currentOrder.public_id);
          await refreshState();
          navigation.popToTop();
        } catch (e) { Alert.alert("Ошибка", e.message); }
      },
    },
  ]);

  return (
    <View style={s.root}>
      {/* Map mock */}
      <View style={s.mapBg} />
      <View style={s.dim} />

      {/* Top status pill */}
      <SafeAreaView edges={["top"]} style={s.topWrap}>
        <View style={[s.topCard, shadows.s2]}>
          <View style={s.topIcon}>
            <Icon name="clock" size={18} color={T.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.topTitle}>Ищем водителя…</Text>
            <Text style={s.topHint}>обычно 1–3 минуты</Text>
          </View>
          <Text style={s.timer}>{fmtMMSS(secs)}</Text>
        </View>
      </SafeAreaView>

      {/* Pulse animation */}
      <View style={s.center} pointerEvents="none">
        <View style={s.pulseHost}>
          <PulseRing delay={0} />
          <PulseRing delay={600} />
          <PulseRing delay={1200} />
          <View style={s.pulseCore}>
            <Icon name="car" size={24} color={T.ink} />
          </View>
        </View>
      </View>

      {/* Bottom sheet */}
      <View style={[s.sheet, shadows.s3, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.handle} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <View>
            <Text style={s.label}>ТАРИФ</Text>
            <Text style={s.value}>
              {currentOrder?.car_class || "Эконом"} ·{" "}
              <Text style={s.mono}>
                {currentOrder?.fare_total ? `${Math.round(currentOrder.fare_total)} ₽` : "—"}
              </Text>
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", maxWidth: "55%" }}>
            <Text style={s.label}>ОТКУДА</Text>
            <Text style={s.valueSm} numberOfLines={1}>
              {currentOrder?.pickup_address || "—"}
            </Text>
          </View>
        </View>

        {/* Dot scrubber (decorative) */}
        <View style={s.dots}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                { height: i < 7 ? 14 : 6, backgroundColor: i < 7 ? T.sun : T.sand },
              ]}
            />
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable style={[s.btn, { backgroundColor: T.paper }]}>
            <Text style={[s.btnText, { color: T.ink }]}>Изменить тариф</Text>
          </Pressable>
          <Pressable style={[s.btn, { backgroundColor: T.ink }]} onPress={cancel}>
            <Text style={[s.btnText, { color: T.paper }]}>Отменить</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.mapBg },
  mapBg: { ...StyleSheet.absoluteFillObject, backgroundColor: T.mapBg },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(14,14,12,0.30)" },

  topWrap: { position: "absolute", top: 0, left: 16, right: 16 },
  topCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: radii.r3, backgroundColor: T.white,
    marginTop: 8,
  },
  topIcon: {
    width: 36, height: 36, borderRadius: radii.r2,
    backgroundColor: T.paper, alignItems: "center", justifyContent: "center",
  },
  topTitle: { fontFamily: fonts.ui, fontSize: 13, fontWeight: "500", color: T.ink },
  topHint:  { fontFamily: fonts.mono, fontSize: 11, color: T.graphite, marginTop: 2 },
  timer:    { fontFamily: fonts.mono, fontSize: 22, color: T.ink, fontWeight: "500" },

  center: {
    position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
    alignItems: "center", justifyContent: "center",
  },
  pulseHost: { width: 80, height: 80, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute", width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: T.sun,
  },
  pulseCore: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: T.sun,
    alignItems: "center", justifyContent: "center",
  },

  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: T.white,
    borderTopLeftRadius: radii.r5, borderTopRightRadius: radii.r5,
    paddingHorizontal: 20, paddingTop: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: T.sand, alignSelf: "center", marginBottom: 16,
  },
  label: {
    fontFamily: fonts.ui, fontSize: 11, color: T.graphite,
    fontWeight: "600", letterSpacing: 0.6,
  },
  value: { fontFamily: fonts.ui, fontSize: 16, fontWeight: "600", color: T.ink, marginTop: 2 },
  valueSm: { fontFamily: fonts.ui, fontSize: 13, color: T.ink, marginTop: 2 },
  mono: { fontFamily: fonts.mono },

  dots: {
    flexDirection: "row", gap: 4, justifyContent: "center", marginBottom: 18,
  },
  dot: { width: 4, borderRadius: 2 },

  btn: { flex: 1, height: 52, borderRadius: radii.r2, alignItems: "center", justifyContent: "center" },
  btnText: { fontFamily: fonts.ui, fontSize: 14, fontWeight: "500" },
});
