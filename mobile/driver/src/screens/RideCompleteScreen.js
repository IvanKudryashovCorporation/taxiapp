// RideCompleteScreen — завершение поездки.
// Спека §6.2.6: галочка sun, заработок sun 48px mono, метаданные таблицей, CTA "Готово".
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { T, fonts, radii } from "../theme";
import { Icon } from "../components/Icon";
import { useStore } from "../state";

function formatMoney(v) {
  return `${Math.round(Number(v || 0)).toLocaleString("ru-RU").replace(",", " ")} ₽`;
}
function formatDist(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${Math.round(m)} м`;
}
function formatDur(s) {
  const min = Math.round(s / 60);
  return min < 60 ? `${min} мин` : `${Math.floor(min / 60)} ч ${min % 60} мин`;
}

const PAY_LABEL = { cash: "Наличные", card: "Карта", online: "Онлайн" };

export default function RideCompleteScreen({ navigation }) {
  const order = useStore((s) => s.lastCompletedOrder) || useStore((s) => s.currentOrder);

  const earnings = order?.fare_total ?? 450;
  const tripTime = order?.duration_s ?? 18 * 60;
  const dist = order?.distance_m ?? 6400;
  const tariff = order?.tariff_name ?? order?.car_class ?? "Эконом";
  const pay = order?.payment_method || "cash";

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <View style={s.center}>
        {/* Check icon */}
        <View style={s.checkOuter}>
          <View style={s.checkInner}>
            <Icon name="check" size={40} color={T.sun} />
          </View>
        </View>

        <Text style={s.title}>Поездка завершена</Text>

        <Text style={s.earningsLabel}>ЗАРАБОТАНО</Text>
        <Text style={s.earnings}>{formatMoney(earnings)}</Text>

        {/* Metadata table */}
        <View style={s.table}>
          <Row label="Время поездки"  value={formatDur(tripTime)} />
          <Row label="Расстояние"     value={formatDist(dist)} />
          <Row label="Тариф"          value={tariff} />
          <Row label="Способ оплаты"  value={PAY_LABEL[pay] || pay} last />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          s.cta,
          pressed && { transform: [{ scale: 0.97 }] },
        ]}
        onPress={() => navigation.popToTop?.() ?? navigation.navigate?.("Map")}
      >
        <Text style={s.ctaText}>Готово</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Row({ label, value, last }) {
  return (
    <View style={[s.row, !last && s.rowSep]}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.ink, paddingHorizontal: 24, justifyContent: "space-between" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  checkOuter: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.sunSoft,
    alignItems: "center", justifyContent: "center",
    marginBottom: 24,
  },
  checkInner: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },

  title: {
    fontFamily: fonts.display, fontSize: 28, fontWeight: "600",
    color: T.white, letterSpacing: -0.4, marginBottom: 24,
  },

  earningsLabel: {
    fontFamily: fonts.ui, fontSize: 11, color: T.stone,
    fontWeight: "600", letterSpacing: 0.6, marginBottom: 4,
  },
  earnings: {
    fontFamily: fonts.mono, fontSize: 48, fontWeight: "700",
    color: T.sun, letterSpacing: -0.5, marginBottom: 32,
  },

  table: { width: "100%", maxWidth: 320, backgroundColor: T.ink2, borderRadius: radii.r3, paddingHorizontal: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14 },
  rowSep: { borderBottomWidth: 1, borderBottomColor: T.ink3 },
  rowLabel: { fontFamily: fonts.ui, fontSize: 13, color: T.mist },
  rowValue: { fontFamily: fonts.mono, fontSize: 13, color: T.white, fontWeight: "500" },

  cta: {
    height: 56, borderRadius: radii.r3,
    backgroundColor: T.sun,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  ctaText: { fontFamily: fonts.ui, fontSize: 17, fontWeight: "600", color: T.ink },
});
