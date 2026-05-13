import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { T, fonts, radii, shadows } from "../theme";
import { Icon } from "../components/Icon";
import { useStore } from "../state";
import { api } from "../api";

const STATUS_LABEL = {
  accepted: "Водитель назначен",
  driver_on_the_way: "Водитель в пути",
  driver_nearby_leave_now: "Водитель рядом",
  arrived: "Прибыли",
  ride_in_progress: "Едем",
  completed: "Поездка завершена",
  cancelled: "Отменено",
};

function statusBadge(status) {
  if (status === "ride_in_progress") return "В ПУТИ";
  if (status === "arrived") return "ОЖИДАЕТ";
  if (status === "driver_nearby_leave_now") return "РЯДОМ";
  return "В ПУТИ";
}

export default function InRideScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const order = useStore((s) => s.currentOrder);
  const refreshState = useStore((s) => s.refreshState);

  useEffect(() => {
    if (!order) { navigation.popToTop(); return; }
    if (order.status === "completed" || order.status === "cancelled") {
      navigation.popToTop();
    }
  }, [order]); // eslint-disable-line

  if (!order) return null;

  const driverInitials = (order.driver_full_name || "ВД").split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();
  const eta = order.eta_minutes ?? 9;

  const cancel = () => Alert.alert("Отменить поездку?", "", [
    { text: "Нет", style: "cancel" },
    {
      text: "Да", style: "destructive",
      onPress: async () => {
        try { await api.cancelOrder(order.public_id); await refreshState(); }
        catch (e) { Alert.alert("Ошибка", e.message); }
      },
    },
  ]);

  const callDriver = () => {
    if (!order.driver_phone) return;
    Linking.openURL(`tel:${order.driver_phone}`);
  };

  return (
    <View style={s.root}>
      <View style={s.mapBg} />

      {/* Top status bar */}
      <SafeAreaView edges={["top"]} style={s.topWrap}>
        <View style={[s.topCard, shadows.s2]}>
          <View style={s.statusBadge}>
            <Text style={s.statusBadgeText}>{statusBadge(order.status)}</Text>
          </View>
          <Text style={s.dest} numberOfLines={1}>{order.dropoff_address || "—"}</Text>
          <Text style={s.eta}>{eta} мин</Text>
        </View>
      </SafeAreaView>

      {/* Hero ETA (raised) */}
      <View style={s.heroWrap} pointerEvents="none">
        <Text style={s.heroStatus}>{STATUS_LABEL[order.status] || "—"}</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 6 }}>
          <Text style={s.heroEta}>{eta}</Text>
          <Text style={s.heroEtaUnit}> мин</Text>
        </View>
      </View>

      {/* Bottom sheet — driver card */}
      <View style={[s.sheet, shadows.s3, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.handle} />

        <View style={s.driverRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{driverInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.driverName}>{order.driver_full_name || "Игорь П."}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Icon name="star" size={13} color={T.sun} />
              <Text style={s.rating}>4,92</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable style={[s.actionBtn, { backgroundColor: T.paper }]} onPress={() => navigation.navigate?.("Chat", { order })}>
              <Icon name="chat" size={18} color={T.ink} />
            </Pressable>
            <Pressable style={[s.actionBtn, { backgroundColor: T.ink }]} onPress={callDriver}>
              <Icon name="phone" size={18} color={T.paper} />
            </Pressable>
          </View>
        </View>

        <View style={s.carCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.carLabel}>
              {[order.vehicle_make, order.vehicle_model, order.vehicle_color].filter(Boolean).join(" · ").toUpperCase() || "АВТО"}
            </Text>
            <Text style={s.carPlate}>{order.vehicle_plate || "А 247 ВО · 92"}</Text>
          </View>
          {order.vehicle_plate && (
            <View style={s.plateBadge}>
              <Text style={s.plateBadgeText}>{(order.vehicle_plate || "").replace(/\s/g, "")}</Text>
            </View>
          )}
        </View>

        {/* Progress dots */}
        <View style={s.progressRow}>
          {["accepted", "driver_on_the_way", "ride_in_progress"].map((step, i, arr) => {
            const reached = ["accepted", "driver_on_the_way", "arrived", "ride_in_progress"].indexOf(order.status) >= i;
            return (
              <React.Fragment key={step}>
                <View style={[s.progressDot, reached ? { backgroundColor: T.sun } : { borderWidth: 2, borderColor: T.mist }]} />
                {i < arr.length - 1 && (
                  <View style={[s.progressLine, reached && { backgroundColor: T.sun }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Pressable onPress={cancel} style={s.cancelBtn}>
          <Text style={s.cancelText}>Отменить поездку</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.mapBg },
  mapBg: { ...StyleSheet.absoluteFillObject, backgroundColor: T.mapBg },

  topWrap: { position: "absolute", top: 0, left: 16, right: 16 },
  topCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: radii.r3, backgroundColor: T.white,
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: T.ink, borderRadius: radii.r1,
  },
  statusBadgeText: {
    fontFamily: fonts.mono, fontSize: 11, color: T.sun, letterSpacing: 0.8,
  },
  dest: { flex: 1, fontFamily: fonts.ui, fontSize: 13, color: T.ink, fontWeight: "500" },
  eta:  { fontFamily: fonts.mono, fontSize: 12, color: T.graphite },

  heroWrap: {
    position: "absolute", top: 110, left: 24, right: 24, alignItems: "flex-start",
  },
  heroStatus: {
    fontFamily: fonts.display, fontSize: 22, fontWeight: "600", color: T.ink,
  },
  heroEta: {
    fontFamily: fonts.mono, fontSize: 40, fontWeight: "600", color: T.ink, lineHeight: 44,
  },
  heroEtaUnit: { fontFamily: fonts.ui, fontSize: 15, color: T.graphite, fontWeight: "400" },

  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: T.white,
    borderTopLeftRadius: radii.r5, borderTopRightRadius: radii.r5,
    paddingHorizontal: 20, paddingTop: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: T.sand, alignSelf: "center", marginBottom: 14,
  },

  driverRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: T.paper, alignItems: "center", justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.display, fontSize: 16, fontWeight: "600", color: T.ink,
  },
  driverName: { fontFamily: fonts.ui, fontSize: 16, fontWeight: "600", color: T.ink },
  rating: { fontFamily: fonts.mono, fontSize: 13, color: T.graphite },

  actionBtn: {
    width: 44, height: 44, borderRadius: radii.r3,
    alignItems: "center", justifyContent: "center",
  },

  carCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginTop: 14, padding: 12,
    backgroundColor: T.paper, borderRadius: radii.r2,
  },
  carLabel: {
    fontFamily: fonts.ui, fontSize: 11, color: T.graphite,
    fontWeight: "600", letterSpacing: 0.6,
  },
  carPlate: {
    fontFamily: fonts.mono, fontSize: 16, color: T.ink, fontWeight: "600", marginTop: 2,
  },
  plateBadge: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1.5, borderColor: T.ink, borderRadius: radii.r1,
  },
  plateBadgeText: { fontFamily: fonts.mono, fontSize: 13, fontWeight: "600", color: T.ink },

  progressRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 16, marginBottom: 10, justifyContent: "center",
  },
  progressDot: { width: 12, height: 12, borderRadius: 6 },
  progressLine: { flex: 1, height: 2, backgroundColor: T.sand, maxWidth: 60 },

  cancelBtn: {
    marginTop: 6, paddingVertical: 14,
    borderWidth: 1, borderColor: T.sand, borderRadius: radii.r3,
    alignItems: "center",
  },
  cancelText: { fontFamily: fonts.ui, fontSize: 16, color: T.bad, fontWeight: "500" },
});
