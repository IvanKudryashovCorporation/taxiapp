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
  sand:       "#E6E2D8",
  paper:      "#F4F1EA",
  paper2:     "#FBF9F4",
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
  mapBg:      "#EFEBE2",
  mapWater:   "#D9DCE0",
  mapRoad:    "#FFFFFF",
  mapRoadAlt: "#E8E4DA",
  mapInk:     "#1A1A17",
};

// 4.2 Типографика (RN: только системные fallback-шрифты, без кастомной загрузки)
export const fonts = {
  ui:      Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
  display: Platform.select({ ios: "System", android: "sans-serif-medium", default: "System" }),
  mono:    Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
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
