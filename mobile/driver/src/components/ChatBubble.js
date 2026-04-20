import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme";

export default function ChatBubble({ text, mine }) {
  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: colors.accent, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.cardAlt, borderBottomLeftRadius: 4 },
        ]}
      >
        <Text style={{ color: mine ? colors.accentText : colors.text, fontSize: 14 }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", marginVertical: 3, paddingHorizontal: 4 },
  rowMine: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
});
