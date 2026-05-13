import type { Config } from "tailwindcss";

// Tailwind конфиг — токены пробрасываются через CSS variables (см. globals.css),
// так что менять в одном месте — отражается везде.
const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink:        "var(--c-ink)",
        ink2:       "var(--c-ink2)",
        ink3:       "var(--c-ink3)",
        graphite:   "var(--c-graphite)",
        stone:      "var(--c-stone)",
        mist:       "var(--c-mist)",
        sand:       "var(--c-sand)",
        paper:      "var(--c-paper)",
        paper2:     "var(--c-paper2)",
        white:      "var(--c-white)",
        sun:        "var(--c-sun)",
        sunDeep:    "var(--c-sun-deep)",
        sunSoft:    "var(--c-sun-soft)",
        ok:         "var(--c-ok)",
        warn:       "var(--c-warn)",
        bad:        "var(--c-bad)",
        link:       "var(--c-link)",
        mapBg:      "var(--c-map-bg)",
        mapWater:   "var(--c-map-water)",
        mapRoad:    "var(--c-map-road)",
        mapRoadAlt: "var(--c-map-road-alt)",
        mapInk:     "var(--c-map-ink)",
      },
      fontFamily: {
        ui:      ["Inter", "Helvetica Neue", "Helvetica", "Arial", "system-ui", "sans-serif"],
        display: ["Inter Tight", "Inter", "Helvetica Neue", "Helvetica", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "SF Mono", "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: {
        r1: "8px",
        r2: "12px",
        r3: "16px",
        r4: "20px",
        r5: "28px",
      },
      boxShadow: {
        s1: "0 1px 2px rgba(20,18,14,0.06), 0 1px 1px rgba(20,18,14,0.04)",
        s2: "0 4px 14px rgba(20,18,14,0.08), 0 1px 2px rgba(20,18,14,0.04)",
        s3: "0 12px 32px rgba(20,18,14,0.12), 0 2px 6px rgba(20,18,14,0.06)",
      },
      fontSize: {
        // Шкала из спеки: 11/12, 13/14, 15/16, 17/18, 22/24, 28/32, 40/48
        cap:    ["11px", { lineHeight: "14px" }],
        cap2:   ["12px", { lineHeight: "16px" }],
        body:   ["15px", { lineHeight: "22px" }],
        body2:  ["16px", { lineHeight: "24px" }],
        h3:     ["22px", { lineHeight: "28px" }],
        h2:     ["28px", { lineHeight: "32px" }],
        h1:     ["40px", { lineHeight: "48px" }],
        hero:   ["48px", { lineHeight: "52px" }],
      },
    },
  },
  plugins: [],
};

export default config;
