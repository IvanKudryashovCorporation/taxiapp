import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme";

const TABS = [
  { id: "create", icon: "⌂", label: "Главная" },
  { id: "ride", icon: "≡", label: "Заказы" },
  { id: "fav", icon: "♥", label: "Избранное" },
  { id: "history", icon: "☰", label: "Меню" },
];

export default function NavBar({ active, onChange }) {
  return (
    <View style={styles.root}>
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <Pressable
            key={t.id}
            style={styles.item}
            onPress={() => onChange && onChange(t.id)}
          >
            <Text style={[styles.icon, isActive && { color: colors.accent }]}>{t.icon}</Text>
            <Text style={[styles.label, isActive && { color: colors.accent }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingVertical: 8,
  },
  item: { flex: 1, alignItems: "center", paddingVertical: 6 },
  icon: { fontSize: 20, color: colors.textMuted },
  label: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
});
