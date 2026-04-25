import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ACCENT    = "#F5CF31";
const MINE_TEXT = "#1A1A1A";
const THEM_BG   = "#EEEEEE";
const THEM_TEXT = "#1A1A1A";

export default function ChatBubble({ text, mine }) {
  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: ACCENT, borderBottomRightRadius: 4 }
            : { backgroundColor: THEM_BG, borderBottomLeftRadius: 4 },
        ]}
      >
        <Text style={{ color: mine ? MINE_TEXT : THEM_TEXT, fontSize: 14 }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", marginVertical: 3, paddingHorizontal: 4 },
  rowMine:  { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
});
