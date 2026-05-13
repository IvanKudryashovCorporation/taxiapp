// Design tokens — Профсоюз Рассвет (источник истины: design_handoff_taxi_frontend/tokens.js)
// В runtime используются через Tailwind classes (см. tailwind.config.ts → CSS vars в globals.css).
// Этот файл — типизированный экспорт для случаев, когда нужно прочитать токен из JS/TS кода.

export const T = {
  // Neutrals
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

  // Map
  mapBg:      "#EFEBE2",
  mapWater:   "#D9DCE0",
  mapRoad:    "#FFFFFF",
  mapRoadAlt: "#E8E4DA",
  mapInk:     "#1A1A17",
} as const;

export type ThemeColor = keyof typeof T;

// Типографика (используется через Tailwind font-ui/display/mono)
export const fonts = {
  ui:      `"Inter", "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif`,
  display: `"Inter Tight", "Inter", "Helvetica Neue", Helvetica, system-ui, sans-serif`,
  mono:    `"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace`,
} as const;

// Радиусы и тени — для случаев, когда CSS-классы Tailwind не подходят (inline styles).
export const radii = { r1: 8, r2: 12, r3: 16, r4: 20, r5: 28 } as const;

export const shadows = {
  s1: "0 1px 2px rgba(20,18,14,0.06), 0 1px 1px rgba(20,18,14,0.04)",
  s2: "0 4px 14px rgba(20,18,14,0.08), 0 1px 2px rgba(20,18,14,0.04)",
  s3: "0 12px 32px rgba(20,18,14,0.12), 0 2px 6px rgba(20,18,14,0.06)",
} as const;

// Spacing scale (8px-base)
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;
