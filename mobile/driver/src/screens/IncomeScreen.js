// IncomeScreen / Stats — спека §6.2.7.
// Hero "Заработано сегодня", сегмент-control День/Неделя/Месяц, KPI 2×2, "Последние поездки".
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { T, fonts, radii } from "../theme";
import { Icon } from "../components/Icon";
import { useStore } from "../state";
import { TrendingUp, Car, Clock, Star, MapPin, ArrowRight } from "lucide-react-native";

const SCREEN_W = Dimensions.get("window").width;

const TABS = [
  { id: "day",   label: "День" },
  { id: "week",  label: "Неделя" },
  { id: "month", label: "Месяц" },
];

const MOCK = {
  day:   { earnings: 3240, rides: 12, hours: 6.4, rating: 4.92, km: 78 },
  week:  { earnings: 28540, rides: 74, hours: 38, rating: 4.91, km: 512 },
  month: { earnings: 112800, rides: 312, hours: 168, rating: 4.89, km: 2104 },
};

function formatMoney(v) {
  return `${Math.round(Number(v || 0)).toLocaleString("ru-RU").replace(",", " ")} ₽`;
}

export default function IncomeScreen() {
  const [tab, setTab] = useState("day");
  const data = MOCK[tab];

  const profile = useStore((s) => s.profile);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.h1}>Статистика</Text>

        {/* Segment control */}
        <View style={s.segWrap}>
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              style={[s.segItem, tab === t.id && s.segItemActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[s.segText, tab === t.id && s.segTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Hero earnings */}
        <View style={s.hero}>
          <Text style={s.heroLabel}>
            ЗАРАБОТАНО {tab === "day" ? "СЕГОДНЯ" : tab === "week" ? "ЗА НЕДЕЛЮ" : "ЗА МЕСЯЦ"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <TrendingUp size={16} color={T.ok} strokeWidth={2} />
            <Text style={{ color: T.ok, fontSize: 12, fontWeight: "600" }}>+18% к среднему</Text>
          </View>
          <Text style={s.heroValue}>{formatMoney(data.earnings)}</Text>
        </View>

        {/* KPI grid 2×2 */}
        <View style={s.grid}>
          <KPI label="Поездок"         value={String(data.rides)}                              LIcon={Car}       />
          <KPI label="Часов онлайн"    value={data.hours.toString()}                           LIcon={Clock}     />
          <KPI label="Средний рейтинг" value={String(data.rating)}                             LIcon={Star}      />
          <KPI label="Км пройдено"     value={data.km.toLocaleString("ru-RU").replace(",", " ")} LIcon={MapPin}  />
        </View>

        {/* Recent rides */}
        <Text style={s.section}>Последние поездки</Text>
        {[
          { time: "14:32", addr: "пр. Нахимова → Малахов курган", price: 340 },
          { time: "13:08", addr: "Графская → Северная", price: 220 },
          { time: "11:42", addr: "Аквамарин → ТЦ Муссон", price: 410 },
          { time: "10:15", addr: "Балаклава → Центр", price: 680 },
        ].map((r, i, arr) => (
          <View key={i} style={[s.rideRow, i < arr.length - 1 && s.rideRowSep]}>
            <View style={{ flex: 1 }}>
              <Text style={s.rideTime}>{r.time}</Text>
              <Text style={s.rideAddr} numberOfLines={1}>{r.addr}</Text>
            </View>
            <Text style={s.ridePrice}>{formatMoney(r.price)}</Text>
            <ArrowRight size={14} color={T.mist} strokeWidth={1.5} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function KPI({ label, value, icon, LIcon }) {
  return (
    <View style={s.kpi}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        {LIcon && <LIcon size={16} color={T.sun} strokeWidth={1.8} />}
        {!LIcon && icon && <Icon name={icon} size={16} color={T.sun} />}
        <Text style={s.kpiValue}>{value}</Text>
      </View>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

const CELL_W = (SCREEN_W - 16 * 2 - 12) / 2;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.ink },
  content: { paddingHorizontal: 16, paddingBottom: 32 },

  h1: {
    fontFamily: fonts.display, fontSize: 28, fontWeight: "600",
    color: T.white, marginTop: 8, marginBottom: 16,
  },

  segWrap: {
    flexDirection: "row", backgroundColor: T.ink2, borderRadius: radii.r3,
    padding: 4, gap: 4, marginBottom: 20,
  },
  segItem: {
    flex: 1, height: 36, borderRadius: radii.r2,
    alignItems: "center", justifyContent: "center",
  },
  segItemActive: { backgroundColor: T.ink3 },
  segText: { fontFamily: fonts.ui, fontSize: 13, color: T.mist, fontWeight: "500" },
  segTextActive: { color: T.paper2 },

  hero: { marginBottom: 24 },
  heroLabel: {
    fontFamily: fonts.ui, fontSize: 11, color: T.stone,
    fontWeight: "600", letterSpacing: 0.6, marginBottom: 6,
  },
  heroValue: {
    fontFamily: fonts.mono, fontSize: 48, fontWeight: "700", color: T.sun,
    letterSpacing: -0.5,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  kpi: {
    width: CELL_W, padding: 16,
    backgroundColor: T.ink2, borderRadius: radii.r3,
    borderWidth: 1, borderColor: T.ink3,
  },
  kpiValue: { fontFamily: fonts.mono, fontSize: 24, fontWeight: "600", color: T.white },
  kpiLabel: {
    fontFamily: fonts.ui, fontSize: 12, color: T.stone,
    fontWeight: "500", marginTop: 6,
  },

  section: {
    fontFamily: fonts.display, fontSize: 17, fontWeight: "600",
    color: T.white, marginBottom: 8,
  },

  rideRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  rideRowSep: { borderBottomWidth: 1, borderBottomColor: T.ink3 },
  rideTime: { fontFamily: fonts.mono, fontSize: 12, color: T.stone, fontWeight: "500" },
  rideAddr: { fontFamily: fonts.ui, fontSize: 14, color: T.paper2, marginTop: 2 },
  ridePrice: { fontFamily: fonts.mono, fontSize: 15, fontWeight: "600", color: T.white },
});
