// shared/map/overpassBuildings.js
// ────────────────────────────────────────────────────────────────────────────
// Получает номера домов из OpenStreetMap через Overpass API.
//   • Кэш по bbox-ключу (5 мин TTL)
//   • Throttle (не чаще 1 запроса в 2 сек)
//   • Лимит 200 зданий за запрос
//   • Работает и в браузере, и в RN WebView (fetch есть и там и там)
// ────────────────────────────────────────────────────────────────────────────

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 минут
const THROTTLE_MS  = 2000;          // не чаще 1 запроса в 2 сек
const MAX_FEATURES = 200;

const cache = new Map(); // bboxKey -> { ts, data: [{lat,lon,number}] }
let lastFetchTs = 0;
let inflight = null;

function bboxKey(south, west, north, east) {
  // Округление до 3 знаков (≈ 100м) — bbox-кеш не должен взрываться при микро-движениях
  const r = (x) => x.toFixed(3);
  return `${r(south)},${r(west)},${r(north)},${r(east)}`;
}

/**
 * Получить номера домов в заданной области.
 * @param {number} south — нижняя широта
 * @param {number} west  — левая долгота
 * @param {number} north — верхняя широта
 * @param {number} east  — правая долгота
 * @returns {Promise<Array<{lat: number, lon: number, number: string}>>}
 */
export async function fetchBuildingNumbers(south, west, north, east) {
  const key = bboxKey(south, west, north, east);
  const cached = cache.get(key);
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  // Throttle: если предыдущий запрос недавно — ждём
  const sinceLast = now - lastFetchTs;
  if (sinceLast < THROTTLE_MS) {
    await new Promise((r) => setTimeout(r, THROTTLE_MS - sinceLast));
  }

  // Если уже летит запрос для того же bbox — присоединяемся
  if (inflight && inflight.key === key) {
    return inflight.promise;
  }

  const promise = doFetch(south, west, north, east).then((data) => {
    cache.set(key, { ts: Date.now(), data });
    return data;
  }).finally(() => {
    if (inflight && inflight.key === key) inflight = null;
  });

  inflight = { key, promise };
  lastFetchTs = Date.now();
  return promise;
}

async function doFetch(south, west, north, east) {
  // Overpass QL: ищем way и node с тегом building + addr:housenumber в bbox
  // out tags center — центр полигона + теги (компактно)
  const ql =
    `[out:json][timeout:15];` +
    `(` +
      `way["building"]["addr:housenumber"](${south},${west},${north},${east});` +
      `node["addr:housenumber"](${south},${west},${north},${east});` +
    `);` +
    `out tags center ${MAX_FEATURES};`;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(ql),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const out = [];
    for (const el of (json.elements || [])) {
      const tags = el.tags || {};
      const number = tags["addr:housenumber"];
      if (!number) continue;
      // way — берём center, node — собственные координаты
      const lat = el.center?.lat ?? el.lat;
      const lon = el.center?.lon ?? el.lon;
      if (typeof lat !== "number" || typeof lon !== "number") continue;
      out.push({ lat, lon, number: String(number) });
    }
    return out;
  } catch (e) {
    // Сеть отвалилась / Overpass перегружен — молча возвращаем пусто
    return [];
  }
}
