// Icon — line-style icon component for Driver app.
// Mirror of mobile/passenger/src/components/Icon.js.
import React from "react";
import { Text } from "react-native";

const GLYPHS = {
  search:    "\u{1F50D}",
  pin:       "\u{1F4CD}",
  arrow:     "→",
  back:      "←",
  close:     "×",
  menu:      "☰",
  more:      "…",
  user:      "\u{1F464}",
  chat:      "\u{1F4AC}",
  phone:     "\u{1F4DE}",
  star:      "★",
  card:      "\u{1F4B3}",
  cash:      "\u{1F4B5}",
  car:       "\u{1F697}",
  clock:     "\u{1F551}",
  home:      "\u{1F3E0}",
  briefcase: "\u{1F4BC}",
  heart:     "❤",
  shield:    "\u{1F6E1}",
  bell:      "\u{1F514}",
  settings:  "⚙",
  list:      "☰",
  grid:      "▦",
  trend:     "\u{1F4C8}",
  filter:    "≡",
  download:  "⬇",
  plus:      "+",
  check:     "✓",
  shift:     "⧖",
  loc:       "⦿",
  send:      "➤",
  zone:      "▢",
  money:     "₽",
  nav:       "➤",
  warn:      "⚠",
};

export function Icon({ name, size = 20, color = "#FBF9F4", style }) {
  return (
    <Text
      allowFontScaling={false}
      style={[
        { fontSize: size, lineHeight: size * 1.1, color, includeFontPadding: false, textAlign: "center", width: size, height: size * 1.1 },
        style,
      ]}
    >
      {GLYPHS[name] ?? "?"}
    </Text>
  );
}

export default Icon;
