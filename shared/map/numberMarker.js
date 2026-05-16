// shared/map/numberMarker.js
// ────────────────────────────────────────────────────────────────────────────
// SVG-«пилюля» с номером дома для рендера поверх здания на карте.
// Возвращает data: URI который можно использовать как icon в google.maps.Marker.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Создать data: URI для marker icon с номером дома.
 * @param {string} number — номер дома (e.g. "23", "17А", "5к2")
 * @param {"light"|"dark"} theme
 * @returns {{ url: string, width: number, height: number }}
 */
export function buildNumberMarkerIcon(number, theme = "light") {
  const isDark = theme === "dark";
  // Палитра под тему
  // Light: белая пилюля + тёмный текст
  // Dark: жёлтая пилюля + тёмный текст (как номер такси — максимально читаемо)
  const bg     = isDark ? "#F2A65A" : "#FFFFFF";
  const border = isDark ? "#5A3E15" : "#1A1F2C";
  const text   = isDark ? "#0A0F1A" : "#1A1F2C";

  // Размер шрифта и подложки — «большой но не на весь дом»
  // Ширина зависит от длины номера (1-4 символа): 36-60px
  const fontSize = 14;
  const padX = 8;
  // Ширина: ~7.5px на символ + padding (приблизительно)
  const textWidth = Math.max(20, String(number).length * 8);
  const w = textWidth + padX * 2;
  const h = 22;
  const rx = 6;

  // SVG-пилюля с тенью (drop-shadow filter) для лёгкого 3D эффекта
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%">` +
        `<feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.35"/>` +
      `</filter></defs>` +
      `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${rx}" ry="${rx}" ` +
        `fill="${bg}" stroke="${border}" stroke-width="1.5" filter="url(#s)"/>` +
      `<text x="${w / 2}" y="${h / 2 + 5}" font-family="Inter, -apple-system, system-ui, sans-serif" ` +
        `font-size="${fontSize}" font-weight="700" fill="${text}" text-anchor="middle">${escapeXml(number)}</text>` +
    `</svg>`;

  return {
    url:    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg),
    width:  w,
    height: h,
  };
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
