import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_W = Dimensions.get("window").width;

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

const TABS = ["День", "Неделя", "Месяц"];

// Mock data for each period
const MOCK = {
  День: {
    total: "4 736 ₽",
    orders: 12,
    bars: [30, 55, 70, 45, 90, 60, 80, 50, 65, 40, 75, 85],
    rows: [
      { label: "За заказы", value: "4 200 ₽", sign: 1 },
      { label: "Бонусы", value: "536 ₽", sign: 1 },
      { label: "Комиссия сервиса", value: "-1 042 ₽", sign: -1 },
    ],
  },
  Неделя: {
    total: "28 540 ₽",
    orders: 74,
    bars: [60, 45, 80, 70, 90, 55, 75],
    rows: [
      { label: "За заказы", value: "25 200 ₽", sign: 1 },
      { label: "Бонусы", value: "3 340 ₽", sign: 1 },
      { label: "Комиссия сервиса", value: "-6 270 ₽", sign: -1 },
    ],
  },
  Месяц: {
    total: "112 800 ₽",
    orders: 298,
    bars: [60, 75, 50, 85, 70, 90, 65, 55, 80, 45, 75, 60, 70, 85, 50, 65, 90, 40, 75, 80, 55, 70, 60, 85, 50, 65, 45, 80, 70, 55],
    rows: [
      { label: "За заказы", value: "99 600 ₽", sign: 1 },
      { label: "Бонусы", value: "13 200 ₽", sign: 1 },
      { label: "Комиссия сервиса", value: "-24 816 ₽", sign: -1 },
    ],
  },
};

// Simple bar chart using Views
function BarChart({ bars }) {
  const maxVal = Math.max(...bars);
  const barW = Math.max(
    8,
    Math.floor((SCREEN_W - 64) / bars.length) - 4
  );
  const chartH = 80;

  return (
    <View style={chartStyles.wrap}>
      {bars.map((v, i) => {
        const h = Math.round((v / maxVal) * chartH);
        return (
          <View key={i} style={[chartStyles.barWrap, { width: barW }]}>
            <View
              style={[
                chartStyles.bar,
                { height: h, backgroundColor: D.accent, borderRadius: 4 },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 80,
    gap: 4,
  },
  barWrap: { alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "100%" },
});

export default function IncomeScreen() {
  const [tab, setTab] = useState("День");
  const data = MOCK[tab];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Title */}
        <Text style={styles.title}>Доход</Text>

        {/* Tab selector */}
        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Today's earnings */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsAmount}>{data.total}</Text>
          <Text style={styles.earningsOrders}>{data.orders} заказов</Text>

          {/* Bar chart */}
          <View style={styles.chartWrap}>
            <BarChart bars={data.bars} />
          </View>
        </View>

        {/* Summary rows */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Итого</Text>
          {data.rows.map((row, i) => (
            <React.Fragment key={i}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{row.label}</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    row.sign < 0 && styles.summaryNeg,
                  ]}
                >
                  {row.value}
                </Text>
              </View>
              {i < data.rows.length - 1 && (
                <View style={styles.summaryDivider} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Подробнее button */}
        <Pressable
          style={({ pressed }) => [styles.detailBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.detailBtnText}>Подробнее</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },
  scroll: { padding: 16, paddingBottom: 32 },

  title: {
    color: D.text,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 16,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: D.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: D.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9,
  },
  tabActive: { backgroundColor: D.accent },
  tabText: { color: D.muted, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: D.actText, fontWeight: "800" },

  // Earnings card
  earningsCard: {
    backgroundColor: D.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: D.border,
  },
  earningsAmount: {
    color: D.text,
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 4,
  },
  earningsOrders: {
    color: D.muted,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 20,
  },
  chartWrap: {
    paddingTop: 8,
  },

  // Summary card
  summaryCard: {
    backgroundColor: D.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: D.border,
  },
  sectionLabel: {
    color: D.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  summaryLabel: { color: D.text, fontSize: 14 },
  summaryValue: { color: D.text, fontSize: 14, fontWeight: "700" },
  summaryNeg: { color: D.danger },
  summaryDivider: { height: 1, backgroundColor: D.border },

  // Detail button
  detailBtn: {
    backgroundColor: D.card,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: D.border,
  },
  detailBtnText: { color: D.accent, fontSize: 15, fontWeight: "700" },
});
