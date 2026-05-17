// shared/map/mapboxTweaks.js
// ────────────────────────────────────────────────────────────────────────────
// Yandex-style aesthetic поверх готового стиля mapbox/streets-v12.
// Применяется к карте после события 'style.load' через setPaintProperty.
//
// Палитра вдохновлена Yandex Maps (cream/beige тёплый день):
//   - Фон: тёплый кремовый
//   - Здания: бежевый с лёгкой обводкой
//   - Парки: мягкий зелёный
//   - Вода: пыльно-голубой
//   - Дороги: белые, магистрали тёплый янтарь
//   - Подписи: тёплые тёмно-серые с белым stroke
// ────────────────────────────────────────────────────────────────────────────

// Mapbox token не хардкодится в коде (GitHub блокирует).
// Web: operator-web/.env.local → NEXT_PUBLIC_MAPBOX_TOKEN
// Mobile: mobile/{driver,passenger}/src/mapboxToken.local.js (gitignored)
export const MAPBOX_TOKEN_DEFAULT = "";

export const MAPBOX_STYLE_URL = "mapbox://styles/mapbox/streets-v12";

// Yandex-style палитра
export const YANDEX_PALETTE = {
  cream:       "#F0EAE0",  // основной фон
  creamLight:  "#F6F1E6",  // светлее (земля)
  beige:       "#E5DCC8",  // здания
  beigeStroke: "#C8BDA0",  // обводка зданий
  parkGreen:   "#DCE8C8",  // парки
  parkDarker:  "#CDDEB5",  // лесные зоны
  water:       "#B8D4DA",  // голубой
  waterDeep:   "#A5C5CC",
  roadWhite:   "#FFFFFF",
  roadEdge:    "#E0DBCE",
  amber:       "#FFE5A0",  // магистрали
  amberEdge:   "#E0BA60",
  textDark:    "#3A3530",
  textMid:     "#6A6055",
  textWarm:    "#7A6F5D",  // номера домов
  textStroke:  "#FFFFFF",
};

/**
 * Применить Yandex-style tweaks к загруженной Mapbox карте.
 * Вызывать после события 'style.load'.
 *
 * @param {mapboxgl.Map} map
 */
export function applyYandexTweaks(map) {
  const p = YANDEX_PALETTE;

  // Получить все слои стиля
  const layers = map.getStyle().layers || [];

  // Список (layer id pattern, property, value) для переопределения
  // Patterns в Mapbox streets-v12 (актуальная схема слоёв):
  //  background, land, water, landuse, landcover, hillshade,
  //  building, building-top, building-outline,
  //  tunnel-*, road-*, bridge-*,
  //  housenum-label, road-label, road-shield, road-number-shield,
  //  poi-label, water-point-label, water-line-label,
  //  settlement-major-label, settlement-minor-label,
  //  state-label, country-label, continent-label
  for (const layer of layers) {
    const id = layer.id;
    const type = layer.type;

    try {
      // BACKGROUND
      if (id === "background" || id === "land") {
        map.setPaintProperty(id, "background-color", p.cream);
      }

      // WATER
      else if (id === "water" || id.startsWith("water-")) {
        if (type === "fill") {
          map.setPaintProperty(id, "fill-color", p.water);
        }
      }

      // PARKS / GREEN AREAS
      else if (id.includes("park") || id.includes("national-park") || id.includes("pitch") || id.includes("grass")) {
        if (type === "fill") {
          map.setPaintProperty(id, "fill-color", p.parkGreen);
        }
      }

      // WOODS / FOREST
      else if (id.includes("wood") || id.includes("forest")) {
        if (type === "fill") {
          map.setPaintProperty(id, "fill-color", p.parkDarker);
        }
      }

      // LANDUSE general (residential, commercial etc.) — лёгкий offset от cream
      else if (id === "landuse" || id.startsWith("landuse-")) {
        if (type === "fill") {
          map.setPaintProperty(id, "fill-color", p.creamLight);
        }
      }

      // LANDCOVER
      else if (id === "landcover" || id.startsWith("landcover-")) {
        if (type === "fill") {
          map.setPaintProperty(id, "fill-color", p.creamLight);
        }
      }

      // BUILDINGS
      else if (id === "building" || id === "building-top") {
        if (type === "fill") {
          map.setPaintProperty(id, "fill-color", p.beige);
          map.setPaintProperty(id, "fill-outline-color", p.beigeStroke);
        }
      }
      else if (id === "building-outline") {
        if (type === "line") {
          map.setPaintProperty(id, "line-color", p.beigeStroke);
        }
      }

      // ROADS — fill (motorway = янтарь, всё остальное белое)
      else if (id.includes("road-motorway") || id.includes("road-trunk")) {
        if (type === "line") {
          map.setPaintProperty(id, "line-color", p.amber);
        }
      }
      else if (id.includes("road-motorway-case") || id.includes("road-trunk-case")) {
        if (type === "line") {
          map.setPaintProperty(id, "line-color", p.amberEdge);
        }
      }
      else if (id.includes("road-") && id.includes("-case")) {
        // обводка дорог
        if (type === "line") {
          map.setPaintProperty(id, "line-color", p.roadEdge);
        }
      }
      else if (id.includes("road-") || id.includes("street-") || id.includes("bridge-") || id.includes("tunnel-")) {
        // основная заливка дорог
        if (type === "line") {
          map.setPaintProperty(id, "line-color", p.roadWhite);
        }
      }

      // HOUSE NUMBERS — главное визуальное украшение
      else if (id === "housenum-label") {
        if (type === "symbol") {
          map.setPaintProperty(id, "text-color", p.textWarm);
          map.setPaintProperty(id, "text-halo-color", p.textStroke);
          map.setPaintProperty(id, "text-halo-width", 1.5);
        }
      }

      // ROAD LABELS
      else if (id.includes("road-label") || id === "road-shield" || id === "road-number-shield") {
        if (type === "symbol") {
          map.setPaintProperty(id, "text-color", p.textDark);
          map.setPaintProperty(id, "text-halo-color", p.textStroke);
          map.setPaintProperty(id, "text-halo-width", 1.5);
        }
      }

      // CITY/SETTLEMENT LABELS
      else if (id.includes("settlement-")) {
        if (type === "symbol") {
          map.setPaintProperty(id, "text-color", p.textDark);
          map.setPaintProperty(id, "text-halo-color", p.textStroke);
          map.setPaintProperty(id, "text-halo-width", 2);
        }
      }

      // POI LABELS (магазины, остановки)
      else if (id === "poi-label" || id.includes("poi-")) {
        if (type === "symbol") {
          map.setPaintProperty(id, "text-color", p.textMid);
          map.setPaintProperty(id, "text-halo-color", p.textStroke);
          map.setPaintProperty(id, "text-halo-width", 1.5);
        }
      }

      // ADMINISTRATIVE LABELS (страны/регионы) — скрыть (как Yandex)
      else if (id === "country-label" || id === "continent-label") {
        map.setLayoutProperty(id, "visibility", "none");
      }
    } catch (e) {
      // Слой может не иметь данного property — молча игнорим
    }
  }
}

/**
 * Опционально включить 3D-extrusion зданий (плоско по умолчанию).
 * Вызывать после applyYandexTweaks если хочется объёмные дома.
 *
 * @param {mapboxgl.Map} map
 */
export function enable3DBuildings(map) {
  // В стиле streets-v12 уже есть building-extrusion слой, но он спрятан.
  // Включим его и зададим pitch для камеры.
  try {
    map.setLayoutProperty("3d-buildings", "visibility", "visible");
  } catch {}
  try {
    map.setPitch(45);
  } catch {}
}
