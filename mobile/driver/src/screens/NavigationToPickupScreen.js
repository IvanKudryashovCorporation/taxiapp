// NavigationToPickupScreen — водитель едет к пассажиру.
// Спека §6.2.4: огромная стрелка, расстояние до манёвра, ETA + расстояние, CTA "Я на месте".
import React from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { T, fonts, radii, shadows } from "../theme";
import { Icon } from "../components/Icon";
import { useStore } from "../state";
import { api } from "../api";

function formatDist(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${Math.round(m)} м`;
}

export default function NavigationToPickupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const order = useStore((s) => s.currentOrder);
  const refreshState = useStore((s) => s.refreshState);

  if (!order) return null;

  const distToPickupM = order.distance_to_pickup_m ?? 300;
  const etaToPickup = order.eta_to_pickup_min ?? Math.round((distToPickupM / 1000) * 2);

  const callPassenger = () => {
    if (order.passenger_phone) Linking.openURL(`tel:${order.passenger_phone}`);
  };

  const arrived = async () => {
    try {
      if (typeof api.arrived === "function") await api.arrived(order.public_id);
      else if (typeof api.markArrived === "function") await api.markArrived(order.public_id);
      await refreshState();
      navigation.replace?.("InRide");
    } catch (e) { console.warn("arrived:", e?.message); }
  };

  return (
    <View style={s.root}>
      <View style={s.mapBg} />

      {/* Top maneuver card */}
      <SafeAreaView edges={["top"]} style={s.topWrap}>
        <View style={[s.maneuverCard, shadows.s2]}>
          <View style={s.arrowBox}>
            <Icon name="arrow" size={56} color={T.sun} />
          </View>
          <Text style={s.maneuverDist}>{formatDist(distToPickupM)}</Text>
          <Text style={s.maneuverStreet} numberOfLines={2}>
            {order.next_step_text || order.pickup_address || "—"}
          </Text>
        </View>
      </SafeAreaView>

      {/* Bottom card */}
      <View style={[s.bottomCard, shadows.s3, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.metricsRow}>
          <View>
            <Text style={s.metricLabel}>ДО ПАССАЖИРА</Text>
            <Text style={s.metricValue}>{etaToPickup} мин</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.metricLabel}>РАССТОЯНИЕ</Text>
            <Text style={s.metricValue}>{formatDist(distToPickupM)}</Text>
          </View>
        </View>

        <View style={s.actions}>
          <Pressable
            style={[s.callBtn, !order.passenger_phone && { opacity: 0.4 }]}
            onPress={callPassenger}
            disabled={!order.passenger_phone}
          >
            <Icon name="phone" size={18} color={T.paper2} />
            <Text style={s.callText}>Позвонить</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              s.arrivedBtn,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={arrived}
          >
            <Text style={s.arrivedText}>Я на месте</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.ink },
  mapBg: { ...StyleSheet.absoluteFillObject, backgroundColor: T.ink2 },

  topWrap: { paddingHorizontal: 16, paddingTop: 8 },
  maneuverCard: {
    backgroundColor: T.ink2, borderRadius: radii.r4,
    paddingHorizontal: 24, paddingVertical: 20,
    alignItems: "flex-start",
    borderWidth: 1, borderColor: T.ink3,
  },
  arrowBox: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: T.sunSoft, alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  maneuverDist: {
    fontFamily: fonts.mono, fontSize: 32, fontWeight: "700",
    color: T.white, letterSpacing: -0.5,
  },
  maneuverStreet: {
    fontFamily: fonts.ui, fontSize: 16, fontWeight: "500",
    color: T.paper2, marginTop: 4,
  },

  bottomCard: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: T.ink2,
    borderTopLeftRadius: radii.r5, borderTopRightRadius: radii.r5,
    paddingHorizontal: 20, paddingTop: 20,
    borderTopWidth: 1, borderColor: T.ink3,
  },
  metricsRow: {
    flexDirection: "row", justifyContent: "space-between",
    marginBottom: 16,
  },
  metricLabel: {
    fontFamily: fonts.ui, fontSize: 11, color: T.stone,
    fontWeight: "600", letterSpacing: 0.6,
  },
  metricValue: {
    fontFamily: fonts.mono, fontSize: 22, fontWeight: "600",
    color: T.white, marginTop: 4,
  },

  actions: { flexDirection: "row", gap: 10 },
  callBtn: {
    flex: 1, height: 56, borderRadius: radii.r3,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderColor: T.ink3, backgroundColor: "transparent",
  },
  callText: { fontFamily: fonts.ui, fontSize: 15, fontWeight: "500", color: T.paper2 },
  arrivedBtn: {
    flex: 2, height: 56, borderRadius: radii.r3,
    backgroundColor: T.sun,
    alignItems: "center", justifyContent: "center",
  },
  arrivedText: { fontFamily: fonts.ui, fontSize: 17, fontWeight: "600", color: T.ink },
});
