// Design tokens — Профсоюз Рассвет (источник истины: design_handoff_taxi_frontend/tokens.js)
// Driver app — тёмная тема, фон ink, поверхности ink2/ink3.
import { Platform } from "react-native";

// 4.1 Цвета
export const T = {
  ink:        "#0E0E0C",
  ink2:       "#1A1A17",
  ink3:       "#2A2A26",
  graphite:   "#5C5A55",
  stone:      "#8A8780",
  mist:       "#B8B5AD",
  sand:       "#E6E2D8",
  paper:      "#F4F1EA",
  paper2:     "#FBF9F4",
  white:      "#FFFFFF",

  sun:        "#F2A65A",
  sunDeep:    "#D9823A",
  sunSoft:    "rgba(242,166,90,0.14)",

  ok:         "#3D8A6A",
  warn:       "#C49A2C",
  bad:        "#B0463A",
  link:       "#3F6BB0",

  mapBg:      "#EFEBE2",
  mapWater:   "#D9DCE0",
  mapRoad:    "#FFFFFF",
  mapRoadAlt: "#E8E4DA",
  mapInk:     "#1A1A17",
};

export const fonts = {
  ui:          "Inter_400Regular",
  uiMed:       "Inter_500Medium",
  uiSemi:      "Inter_600SemiBold",
  display:     "Inter_700Bold",
  mono:        "JetBrainsMono_500Medium",
  monoReg:     "JetBrainsMono_400Regular",
  // Системные fallback (пока шрифты грузятся)
  uiFallback:  Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
  monoFallback: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
};

export const radii = { r1: 8, r2: 12, r3: 16, r4: 20, r5: 28 };

export const shadows = {
  s1: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 1,
  },
  s2: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  s3: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
};

export const space = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 };

// Legacy bridge — старые имена смаплены на новые токены тёмной темы.
export const colors = {
  bg:         T.ink,
  sheet:      T.ink2,
  card:       T.ink2,
  cardAlt:    T.ink3,
  border:     T.ink3,
  text:       T.paper2,
  textMuted:  T.mist,
  textDim:    T.stone,
  accent:     T.sun,
  accentText: T.ink,
  accentDim:  T.sunSoft,
  danger:     T.bad,
  info:       T.link,
  chipBg:     T.ink2,
  inputBg:    T.ink2,
  success:    T.ok,
};

export const radius = { sm: radii.r1, md: radii.r2, lg: radii.r4, xl: radii.r5 };
export const spacing = (n) => n * 4;

// ─── Light / Dark themes ─────────────────────────────────────────
export const T_LIGHT = {
  bg: "#F4F1EA", surface: "#FFFFFF", surface2: "#FBF9F4",
  border: "#E6E2D8", text: "#0E0E0C", textSub: "#5C5A55",
  textDim: "#8A8780", textHint: "#B8B5AD",
  accent: "#F2A65A", accentDeep: "#D9823A", accentSoft: "rgba(242,166,90,0.14)",
  ok: "#3D8A6A", warn: "#C49A2C", bad: "#B0463A",
};
export const T_DARK = {
  bg: "#0E0E0C", surface: "#1A1A17", surface2: "#2A2A26",
  border: "#2A2A26", text: "#FBF9F4", textSub: "#B8B5AD",
  textDim: "#8A8780", textHint: "#5C5A55",
  accent: "#F2A65A", accentDeep: "#D9823A", accentSoft: "rgba(242,166,90,0.14)",
  ok: "#3D8A6A", warn: "#C49A2C", bad: "#B0463A",
};
export function getTheme(mode = "light") {
  return mode === "dark" ? T_DARK : T_LIGHT;
}
