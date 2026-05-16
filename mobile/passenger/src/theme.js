// Design tokens — Профсоюз Рассвет (источник истины: design_handoff_taxi_frontend/tokens.js)
// Тёплый монохром + единственный акцент (sunrise).
import { Platform } from "react-native";

// 4.1 Цвета
export const T = {
  // Neutrals — warm, low chroma
  ink:        "#0E0E0C",
  ink2:       "#1A1A17",
  ink3:       "#2A2A26",
  graphite:   "#5C5A55",
  stone:      "#8A8780",
  mist:       "#B8B5AD",
  sand:       "#E8E8EA",
  paper:      "#FFFFFF",
  paper2:     "#F8F8F8",
  white:      "#FFFFFF",

  // Accent — sunrise
  sun:        "#F2A65A",
  sunDeep:    "#D9823A",
  sunSoft:    "rgba(242,166,90,0.14)",

  // Functional
  ok:         "#3D8A6A",
  warn:       "#C49A2C",
  bad:        "#B0463A",
  link:       "#3F6BB0",

  // Map (paper-like)
  mapBg:      "#F2F2F4",
  mapWater:   "#D9DCE0",
  mapRoad:    "#FFFFFF",
  mapRoadAlt: "#E4E4E8",
  mapInk:     "#1A1A17",
};

// 4.2 Типографика (RN: только системные fallback-шрифты, без кастомной загрузки)
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

// 4.3 Радиусы
export const radii = { r1: 8, r2: 12, r3: 16, r4: 20, r5: 28 };

// 4.4 Тени (адаптировано под RN — iOS shadow* + Android elevation)
export const shadows = {
  s1: {
    shadowColor: "#14120E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  s2: {
    shadowColor: "#14120E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  s3: {
    shadowColor: "#14120E",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
  },
};

// 4.5 Spacing scale (8px base): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
export const space = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 };

// ─────────────────────────────────────────────────────────────────
// Legacy bridge — старые имена (`colors`, `radius`, `spacing`) перенаправлены на новые токены,
// чтобы существующие экраны не сломались. Удалить после полного миграционного прохода.
// ─────────────────────────────────────────────────────────────────
export const colors = {
  bg:         T.paper,
  sheet:      T.paper2,
  card:       T.paper2,
  cardAlt:    T.paper,
  border:     T.sand,
  text:       T.ink,
  textMuted:  T.graphite,
  textDim:    T.stone,
  accent:     T.sun,
  accentText: T.ink,
  accentDim:  T.sunSoft,
  danger:     T.bad,
  info:       T.link,
  chipBg:     T.paper,
  inputBg:    T.white,
  success:    T.ok,
};

export const radius = { sm: radii.r1, md: radii.r2, lg: radii.r4, xl: radii.r5 };
export const spacing = (n) => n * 4;

// ─── Light / Dark themes ─────────────────────────────────────────
export const T_LIGHT = {
  // Semantic aliases
  bg: "#FFFFFF", surface: "#FFFFFF", surface2: "#F8F8F8",
  border: "#E8E8EA", text: "#0E0E0C", textSub: "#5C5A55",
  textDim: "#8A8780", textHint: "#B8B5AD",
  accent: "#F2A65A", accentDeep: "#D9823A", accentSoft: "rgba(242,166,90,0.14)",
  ok: "#3D8A6A", warn: "#C49A2C", bad: "#B0463A",
  // Palette tokens (mirrored from T)
  paper: "#FFFFFF", paper2: "#F8F8F8",
  ink: "#0E0E0C", graphite: "#5C5A55", stone: "#8A8780",
  mist: "#B8B5AD", sand: "#E8E8EA", white: "#FFFFFF",
  sun: "#F2A65A", sunDeep: "#D9823A", sunSoft: "rgba(242,166,90,0.14)",
  link: "#3F6BB0", mapBg: "#F2F2F4",
};
export const T_DARK = {
  // Semantic aliases
  bg: "#0E0E0C", surface: "#1A1A17", surface2: "#2A2A26",
  border: "#2A2A26", text: "#FBF9F4", textSub: "#B8B5AD",
  textDim: "#8A8780", textHint: "#5C5A55",
  accent: "#F2A65A", accentDeep: "#D9823A", accentSoft: "rgba(242,166,90,0.14)",
  ok: "#3D8A6A", warn: "#C49A2C", bad: "#B0463A",
  // Palette tokens (dark values)
  paper: "#1A1A17", paper2: "#2A2A26",
  ink: "#FBF9F4", graphite: "#B8B5AD", stone: "#8A8780",
  mist: "#5C5A55", sand: "#3A3A36", white: "#2A2A26",
  sun: "#F2A65A", sunDeep: "#D9823A", sunSoft: "rgba(242,166,90,0.14)",
  link: "#3F6BB0", mapBg: "#1A1A17",
};
export function getTheme(mode = "light") {
  return mode === "dark" ? T_DARK : T_LIGHT;
}
