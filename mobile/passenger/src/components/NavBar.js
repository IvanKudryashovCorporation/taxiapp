import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

const ACCENT = "#F5CF31";
const TEXT_MUTED = "#AAAAAA";
const BG = "#FFFFFF";
const BORDER = "#EEEEEE";

const TABS = [
  { id: "create",  icon: "⌂",  label: "Главная"   },
  { id: "ride",    icon: "≡",  label: "Заказы"    },
  { id: "fav",     icon: "♥",  label: "Избранное" },
  { id: "history", icon: "☰",  label: "Меню"      },
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
            onPress={() => onChange?.(t.id)}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{t.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{t.label}</Text>
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
    borderTopColor: BORDER,
    backgroundColor: BG,
    paddingVertical: 8,
  },
  item: { flex: 1, alignItems: "center", paddingVertical: 6 },
  icon:        { fontSize: 20, color: TEXT_MUTED },
  iconActive:  { color: ACCENT },
  label:       { color: TEXT_MUTED, fontSize: 10, marginTop: 2, fontWeight: "500" },
  labelActive: { color: ACCENT, fontWeight: "700" },
});
