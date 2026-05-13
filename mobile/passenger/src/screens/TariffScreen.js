import React, { useState } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet, Dimensions, ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { T, fonts, radii, shadows } from "../theme";
import { Icon } from "../components/Icon";
import { CAR_CLASSES } from "../config";
import { useStore } from "../state";
import { api } from "../api";

const { width: W } = Dimensions.get("window");

function formatMoney(v) {
  return `${Math.round(Number(v || 0)).toLocaleString("ru-RU").replace(",", " ")} ₽`;
}
function formatDist(m) { return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${Math.round(m)} м`; }
function formatDur(s) {
  const min = Math.round(s / 60);
  return min < 60 ? `${min} мин` : `${Math.floor(min / 60)} ч ${min % 60} мин`;
}

export default function TariffScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const {
    pickup, dropoff, distanceM = 0, durationS = 0,
  } = route?.params || {};
  const lastQuote = useStore((s) => s.lastQuote);

  const [carClass, setCarClass] = useState(lastQuote?.car_class || "comfort");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const refreshState = useStore((s) => s.refreshState);

  const submit = async () => {
    if (!pickup || !dropoff) { setErr("Маршрут не указан"); return; }
    setBusy(true); setErr("");
    try {
      await api.createOrder({
        pickup_address: pickup.address, pickup_lat: pickup.lat, pickup_lon: pickup.lon,
        dropoff_address: dropoff.address, dropoff_lat: dropoff.lat, dropoff_lon: dropoff.lon,
        car_class: carClass, passengers_count: 1,
        payment_method: "cash", promo_code: null, waypoints: [],
      });
      await refreshState();
      navigation.replace("Searching");
    } catch (e) { setErr(e.message || "Не удалось создать заказ"); }
    finally { setBusy(false); }
  };

  const selectedTariff = CAR_CLASSES.find((c) => c.id === carClass);
  const price = lastQuote?.fare_total || selectedTariff?.priceHint;

  return (
    <View style={s.root}>
      {/* Map area (top 45%) — placeholder block */}
      <View style={s.mapWrap}>
        <View style={s.mapMock} />
        <SafeAreaView edges={["top"]} style={s.mapTopBar} pointerEvents="box-none">
          <Pressable
            style={[s.iconBtn, shadows.s2]}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <Icon name="back" size={20} color={T.ink} />
          </Pressable>
        </SafeAreaView>
      </View>

      {/* Sheet */}
      <View style={[s.sheet, shadows.s3, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.handle} />

        {/* Route summary */}
        <View style={s.routeRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.routeLabel}>МАРШРУТ · {formatDist(distanceM)}</Text>
            <Text style={s.routeText} numberOfLines={1}>
              {pickup?.address || "—"} → {dropoff?.address || "—"}
            </Text>
          </View>
          <Text style={s.routeEta}>{formatDur(durationS)}</Text>
        </View>

        {/* Tariff list */}
        <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 8 }}>
            {CAR_CLASSES.map((c) => {
              const active = carClass === c.id;
              return (
                <Pressable
                  key={c.id}
                  style={({ pressed }) => [
                    s.tariffRow,
                    active && s.tariffRowActive,
                    pressed && { transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={() => setCarClass(c.id)}
                >
                  <View style={[s.tariffIconBox, active && { backgroundColor: "rgba(255,255,255,0.08)" }]}>
                    <Icon name="car" size={22} color={active ? T.sun : T.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                      <Text style={[s.tariffName, active && { color: T.paper }]}>{c.label}</Text>
                      <Text style={[s.tariffEta, active && { color: T.mist }]}>· {c.etaHint || "4 мин"}</Text>
                    </View>
                    <Text style={[s.tariffSub, active && { color: T.mist }]}>{c.desc || c.modelHint || "—"}</Text>
                  </View>
                  <Text style={[s.tariffPrice, active && { color: T.paper }]}>
                    {active && lastQuote ? formatMoney(lastQuote.fare_total) : (c.priceHint || "—")}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Payment */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          <Pressable style={s.payBox}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name="card" size={18} color={T.ink} />
              <Text style={s.payText}>•• 4471</Text>
            </View>
            <Text style={s.payHint}>Изменить</Text>
          </Pressable>
          <Pressable style={s.promoBox}>
            <Icon name="plus" size={16} color={T.ink} />
            <Text style={s.promoText}>Промо</Text>
          </Pressable>
        </View>

        {!!err && <Text style={s.err}>{err}</Text>}

        {/* CTA */}
        <Pressable
          onPress={submit}
          disabled={busy}
          style={({ pressed }) => [
            s.cta, busy && { opacity: 0.6 },
            pressed && !busy && { transform: [{ scale: 0.98 }] },
          ]}
        >
          {busy
            ? <ActivityIndicator color={T.ink} />
            : (
              <>
                <Text style={s.ctaText}>Заказать {selectedTariff?.label || ""}</Text>
                <Text style={s.ctaPrice}>{price ? formatMoney(price) : ""}</Text>
              </>
            )
          }
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.paper },

  mapWrap: { height: "45%", backgroundColor: T.mapBg },
  mapMock: { ...StyleSheet.absoluteFillObject, backgroundColor: T.mapBg },
  mapTopBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", paddingHorizontal: 16, paddingTop: 8,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: radii.r3,
    backgroundColor: T.white, alignItems: "center", justifyContent: "center",
  },

  sheet: {
    flex: 1, backgroundColor: T.paper2,
    borderTopLeftRadius: radii.r5, borderTopRightRadius: radii.r5,
    marginTop: -24, paddingHorizontal: 20, paddingTop: 14,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: T.sand, alignSelf: "center", marginBottom: 16,
  },

  routeRow: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginBottom: 14,
  },
  routeLabel: {
    fontFamily: fonts.ui, fontSize: 11, color: T.graphite,
    fontWeight: "600", letterSpacing: 0.6,
  },
  routeText: { fontFamily: fonts.ui, fontSize: 14, color: T.ink, fontWeight: "500", marginTop: 2 },
  routeEta: { fontFamily: fonts.mono, fontSize: 11, color: T.graphite },

  tariffRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: radii.r3,
    borderWidth: 1.5, borderColor: T.sand, backgroundColor: T.white,
  },
  tariffRowActive: { borderColor: T.ink, backgroundColor: T.ink },
  tariffIconBox: {
    width: 44, height: 44, borderRadius: radii.r2,
    backgroundColor: T.paper, alignItems: "center", justifyContent: "center",
  },
  tariffName:  { fontFamily: fonts.ui, fontSize: 16, fontWeight: "600", color: T.ink },
  tariffEta:   { fontFamily: fonts.mono, fontSize: 11, color: T.graphite },
  tariffSub:   { fontFamily: fonts.ui, fontSize: 12, color: T.graphite, marginTop: 2 },
  tariffPrice: { fontFamily: fonts.display, fontSize: 18, fontWeight: "600", color: T.ink },

  payBox: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: T.sand, borderRadius: radii.r2,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: T.paper2,
  },
  payText: { fontFamily: fonts.mono, fontSize: 13, color: T.ink, fontWeight: "500" },
  payHint: { fontFamily: fonts.ui, fontSize: 11, color: T.graphite },
  promoBox: {
    paddingHorizontal: 14, paddingVertical: 12, gap: 6,
    borderWidth: 1, borderColor: T.sand, borderRadius: radii.r2,
    flexDirection: "row", alignItems: "center", backgroundColor: T.paper2,
  },
  promoText: { fontFamily: fonts.ui, fontSize: 13, color: T.ink },

  err: { fontFamily: fonts.ui, fontSize: 13, color: T.bad, marginTop: 10 },

  cta: {
    marginTop: 14, height: 60, borderRadius: radii.r4,
    backgroundColor: T.sun, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 22,
    ...shadows.s2,
  },
  ctaText:  { fontFamily: fonts.ui, fontSize: 16, fontWeight: "600", color: T.ink },
  ctaPrice: { fontFamily: fonts.display, fontSize: 17, fontWeight: "700", color: T.ink },
});
