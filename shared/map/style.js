// shared/map/style.js
// ────────────────────────────────────────────────────────────────────────────
// Единый источник правды для стилей Google Maps в driver / passenger / operator-web.
// Правь ТОЛЬКО этот файл — изменения автоматически применятся во всех 3 приложениях.
//
// ВАЖНО: Google Maps Styling API требует:
//   - weight: только integer (1, 2, 3, 4) — float (1.5, 1.4) тихо ломает весь стиль
//   - stylers — массив объектов, каждый со своим ключом
//   - featureType + elementType должны соответствовать валидным значениям
//     https://developers.google.com/maps/documentation/javascript/style-reference
// ────────────────────────────────────────────────────────────────────────────

// ═══ LIGHT (passenger + operator-web по умолчанию) ═══
// «Clean Morning» — белый off-white + серые здания с тёмной обводкой
export const LIGHT_STYLE = [
  // Скрыть POI/transit/страны
  { featureType: "poi",                     stylers: [{ visibility: "off" }] },
  { featureType: "transit",                 stylers: [{ visibility: "off" }] },
  { featureType: "administrative.country",  elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.province", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road",                    elementType: "labels.icon", stylers: [{ visibility: "off" }] },

  // База
  { elementType: "geometry",           stylers: [{ color: "#F2F3F5" }] },
  { elementType: "labels.text.fill",   stylers: [{ color: "#1A1F2C" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 3 }] },

  // Ландшафт + парки
  { featureType: "landscape",                 elementType: "geometry", stylers: [{ color: "#EBECEF" }] },
  { featureType: "landscape.natural",         elementType: "geometry", stylers: [{ color: "#E2EBDA" }] },
  { featureType: "landscape.natural.terrain", elementType: "geometry", stylers: [{ color: "#DDE8D5" }] },
  { featureType: "poi.park",                  elementType: "geometry", stylers: [{ color: "#D6E6CC" }, { visibility: "on" }] },

  // ⭐ ЗДАНИЯ (landscape.man_made в Google Maps)
  // Light: серо-голубой блок + жирная тёмная обводка → дома явно выделяются
  { featureType: "landscape.man_made", elementType: "geometry",        stylers: [{ visibility: "on" }] },
  { featureType: "landscape.man_made", elementType: "geometry.fill",   stylers: [{ color: "#BFC4CF" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#2A2F3C" }, { weight: 2 }] },

  // Дороги — белые с тёмной обводкой
  { featureType: "road",          elementType: "geometry.fill",   stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road",          elementType: "geometry.stroke", stylers: [{ color: "#B4B8C0" }] },
  { featureType: "road.local",    elementType: "geometry.stroke", stylers: [{ color: "#BBC0C8" }] },
  { featureType: "road.arterial", elementType: "geometry.fill",   stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#9CA0AC" }] },

  // Хайвей — тёплый янтарь
  { featureType: "road.highway", elementType: "geometry.fill",   stylers: [{ color: "#FFE08A" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#D0A554" }] },

  // Подписи дорог
  { featureType: "road",          elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 4 }] },
  { featureType: "road.arterial", elementType: "labels.text.fill",   stylers: [{ color: "#1A1F2C" }] },
  { featureType: "road.local",    elementType: "labels.text.fill",   stylers: [{ color: "#2E323E" }] },
  { featureType: "road.highway",  elementType: "labels.text.fill",   stylers: [{ color: "#1A1F2C" }] },

  // Вода — небесный голубой
  { featureType: "water", elementType: "geometry",           stylers: [{ color: "#A6CEE8" }] },
  { featureType: "water", elementType: "labels.text.fill",   stylers: [{ color: "#274A6A" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 3 }] },

  // Города и районы
  { featureType: "administrative.locality",     elementType: "labels.text.fill",   stylers: [{ color: "#0A0F1A" }] },
  { featureType: "administrative.locality",     elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 4 }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill",   stylers: [{ color: "#262B38" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 3 }] },

  // Номера домов (видны на zoom 17+)
  { featureType: "administrative.land_parcel", elementType: "geometry",          stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#1A1F2C" }, { visibility: "on" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 3 }] },
];

// ═══ DARK (driver) ═══
// «Midnight Navigator» — глубокий navy + яркие здания
export const DARK_STYLE = [
  // Скрыть POI/transit/страны
  { featureType: "poi",                     stylers: [{ visibility: "off" }] },
  { featureType: "transit",                 stylers: [{ visibility: "off" }] },
  { featureType: "administrative.country",  elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.province", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road",                    elementType: "labels.icon", stylers: [{ visibility: "off" }] },

  // База
  { elementType: "geometry",           stylers: [{ color: "#1B2433" }] },
  { elementType: "labels.text.fill",   stylers: [{ color: "#E8EEF7" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 3 }] },

  // Ландшафт + парки
  { featureType: "landscape",                 elementType: "geometry", stylers: [{ color: "#1B2433" }] },
  { featureType: "landscape.natural",         elementType: "geometry", stylers: [{ color: "#162A22" }] },
  { featureType: "landscape.natural.terrain", elementType: "geometry", stylers: [{ color: "#192E22" }] },
  { featureType: "poi.park",                  elementType: "geometry", stylers: [{ color: "#1D3324" }, { visibility: "on" }] },

  // ⭐ ЗДАНИЯ (landscape.man_made в Google Maps)
  // Dark: ЯРКИЙ серо-голубой намного ярче земли #1B2433, чёрный контур → дома выпрыгивают
  { featureType: "landscape.man_made", elementType: "geometry",        stylers: [{ visibility: "on" }] },
  { featureType: "landscape.man_made", elementType: "geometry.fill",   stylers: [{ color: "#6B7C9E" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#000000" }, { weight: 2 }] },

  // Дороги — приглушённые
  { featureType: "road",          elementType: "geometry.fill",   stylers: [{ color: "#2D3A52" }] },
  { featureType: "road",          elementType: "geometry.stroke", stylers: [{ color: "#0A1018" }] },
  { featureType: "road.local",    elementType: "geometry.fill",   stylers: [{ color: "#252F44" }] },
  { featureType: "road.local",    elementType: "geometry.stroke", stylers: [{ color: "#0A1018" }] },
  { featureType: "road.arterial", elementType: "geometry.fill",   stylers: [{ color: "#3A4860" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#0A1018" }] },

  // Хайвей — тёплый янтарь
  { featureType: "road.highway", elementType: "geometry.fill",   stylers: [{ color: "#C68A35" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#5A3E15" }] },

  // Подписи дорог
  { featureType: "road",          elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 4 }] },
  { featureType: "road.arterial", elementType: "labels.text.fill",   stylers: [{ color: "#F0F4FA" }] },
  { featureType: "road.local",    elementType: "labels.text.fill",   stylers: [{ color: "#BBC8DC" }] },
  { featureType: "road.highway",  elementType: "labels.text.fill",   stylers: [{ color: "#FCE9B4" }] },

  // Вода — узнаваемый тёмный сине-зелёный (явно отличается от земли)
  { featureType: "water", elementType: "geometry",           stylers: [{ color: "#1F4861" }] },
  { featureType: "water", elementType: "labels.text.fill",   stylers: [{ color: "#9DC0CE" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 3 }] },

  // Города и районы
  { featureType: "administrative.locality",     elementType: "labels.text.fill",   stylers: [{ color: "#FFFFFF" }] },
  { featureType: "administrative.locality",     elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 4 }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill",   stylers: [{ color: "#DCE2EE" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 3 }] },

  // Номера домов (видны на zoom 17+)
  { featureType: "administrative.land_parcel", elementType: "geometry",          stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#FCBE71" }, { visibility: "on" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 3 }] },
];

// Цвета фона (для bg WebView/контейнера, до загрузки тайлов)
export const THEME_BG = {
  light: "#F2F3F5",
  dark:  "#1B2433",
};

// Дефолтный API key (тот же, что подтверждён работающим)
export const DEFAULT_GMAPS_KEY = "AIzaSyDqYBqKXaPdabWR5Ls4EaVRhV6f12DFRtA";
