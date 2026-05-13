// InRideScreen — водитель везёт пассажира.
// Спека §6.2.5: navigation-like, passenger row сверху, "Завершить поездку" CTA, FAB чата.
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { T, fonts, radii, shadows } from "../theme";
import { Icon } from "../components/Icon";
import { useStore } from "../state";
import { api } from "../api";

function formatDist(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${Math.round(m)} м`;
}

export default function InRideScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const order = useStore((s) => s.currentOrder);
  const refreshState = useStore((s) => s.refreshState);

  if (!order) return null;

  const initials = (order.passenger_full_name || "ПС").split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();
  const remainingM = order.distance_remaining_m ?? 4200;
  const etaMin = order.eta_minutes ?? 9;

  const finish = async () => {
    try {
      if (typeof api.complete === "function") await api.complete(order.public_id);
      else if (typeof api.finishRide === "function") await api.finishRide(order.public_id);
      await refreshState();
      navigation.replace?.("RideComplete");
    } catch (e) { console.warn("finish:", e?.message); }
  };

  return (
    <View style={s.root}>
      <View style={s.mapBg} />

      {/* Top: passenger row */}
      <SafeAreaView edges={["top"]} style={s.topWrap}>
        <View style={[s.paxCard, shadows.s2]}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.paxName}>{order.passenger_full_name || "Пассажир"}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Icon name="star" size={13} color={T.sun} />
              <Text style={s.rating}>{order.passenger_rating || "4,9"}</Text>
            </View>
          </View>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>В ПУТИ</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Hero metrics */}
      <View style={s.heroWrap} pointerEvents="none">
        <Text style={s.heroLabel}>ДО ФИНИША</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
          <Text style={s.heroValue}>{etaMin}</Text>
          <Text style={s.heroUnit}> мин</Text>
        </View>
        <Text style={s.heroDist}>{formatDist(remainingM)}</Text>
      </View>

      {/* FAB chat */}
      <Pressable
        style={[s.fab, shadows.s2]}
        onPress={() => navigation.navigate?.("Chat", { order })}
      >
        <Icon name="chat" size={20} color={T.paper2} />
        {order.unread_count > 0 && (
          <View style={s.fabBadge}>
            <Text style={s.fabBadgeText}>{order.unread_count}</Text>
          </View>
        )}
      </Pressable>

      {/* Bottom CTA */}
      <View style={[s.bottomCard, shadows.s3, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.routeHint}>
          <View style={s.dotPickup} />
          <Text style={s.routeText} numberOfLines={1}>{order.dropoff_address || "Точка назначения"}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            s.finishBtn,
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
          onPress={finish}
        >
          <Text style={s.finishText}>Завершить поездку</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.ink },
  mapBg: { ...StyleSheet.absoluteFillObject, backgroundColor: T.ink2 },

  topWrap: { paddingHorizontal: 16, paddingTop: 8 },
  paxCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: T.ink2, borderRadius: radii.r3,
    padding: 12, borderWidth: 1, borderColor: T.ink3,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.ink3, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.display, fontSize: 13, fontWeight: "600", color: T.paper2 },
  paxName: { fontFamily: fonts.ui, fontSize: 15, fontWeight: "600", color: T.white },
  rating: { fontFamily: fonts.mono, fontSize: 12, color: T.mist },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: T.sunSoft, borderRadius: radii.r1,
  },
  statusText: { fontFamily: fonts.mono, fontSize: 11, color: T.sun, letterSpacing: 0.8, fontWeight: "600" },

  heroWrap: {
    position: "absolute", top: 130, left: 24, right: 24,
  },
  heroLabel: {
    fontFamily: fonts.ui, fontSize: 11, color: T.stone,
    fontWeight: "600", letterSpacing: 0.6,
  },
  heroValue: {
    fontFamily: fonts.mono, fontSize: 56, fontWeight: "700", color: T.white, lineHeight: 60,
  },
  heroUnit: { fontFamily: fonts.ui, fontSize: 18, color: T.mist, fontWeight: "400" },
  heroDist: { fontFamily: fonts.mono, fontSize: 16, color: T.mist, marginTop: 4 },

  fab: {
    position: "absolute", left: 16, bottom: 220,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: T.ink2, borderWidth: 1, borderColor: T.ink3,
    alignItems: "center", justifyContent: "center",
  },
  fabBadge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: T.bad, paddingHorizontal: 4,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: T.ink,
  },
  fabBadgeText: { fontFamily: fonts.mono, fontSize: 10, fontWeight: "700", color: T.white },

  bottomCard: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: T.ink2,
    borderTopLeftRadius: radii.r5, borderTopRightRadius: radii.r5,
    paddingHorizontal: 20, paddingTop: 18,
    borderTopWidth: 1, borderColor: T.ink3,
  },
  routeHint: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginBottom: 14,
  },
  dotPickup: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.sun },
  routeText: { flex: 1, fontFamily: fonts.ui, fontSize: 14, fontWeight: "500", color: T.paper2 },

  finishBtn: {
    height: 56, borderRadius: radii.r3,
    backgroundColor: T.sun,
    alignItems: "center", justifyContent: "center",
  },
  finishText: { fontFamily: fonts.ui, fontSize: 17, fontWeight: "600", color: T.ink },
});
