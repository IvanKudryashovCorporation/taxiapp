import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme";

export default function ServiceCard({ icon, label, priceHint, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, selected && { color: colors.accent }]}>{label}</Text>
      <Text style={styles.price}>{priceHint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 92,
    height: 92,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginRight: 8,
  },
  selected: { borderColor: colors.accent },
  icon: { fontSize: 22, color: colors.text },
  label: { color: colors.text, fontWeight: "700", fontSize: 12, marginTop: 4 },
  price: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
