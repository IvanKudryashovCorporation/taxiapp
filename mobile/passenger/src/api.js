import axios from "axios";
import { BACKEND_URL } from "./config";

let _token = null;
export function setAuthToken(token) {
  _token = token || null;
}

const client = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
});

client.interceptors.request.use((cfg) => {
  if (_token) {
    cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${_token}` };
  }
  return cfg;
});

function unwrap(err) {
  if (err.response?.data?.detail) {
    return new Error(
      typeof err.response.data.detail === "string"
        ? err.response.data.detail
        : JSON.stringify(err.response.data.detail)
    );
  }
  return err;
}

export const api = {
  // Auth
  async requestCode(phone) {
    try {
      const r = await client.post("/api/auth/passenger/request-code", { phone });
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },
  async verifyCode(phone, code) {
    try {
      const r = await client.post("/api/auth/passenger/verify-code", { phone, code });
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },

  // Profile / state
  async me() {
    try {
      const r = await client.get("/api/passenger/me");
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },

  // Orders
  async quote(payload) {
    try {
      const r = await client.post("/api/passenger/orders/quote", payload);
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },
  async createOrder(payload) {
    try {
      const r = await client.post("/api/passenger/orders", payload);
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },
  async currentOrder() {
    try {
      const r = await client.get("/api/passenger/orders/current");
      return r.data?.order || null;
    } catch (e) {
      throw unwrap(e);
    }
  },
  async history() {
    try {
      const r = await client.get("/api/passenger/orders/history");
      return r.data?.items || [];
    } catch (e) {
      throw unwrap(e);
    }
  },
  async cancelOrder(publicId, reason = "Отменено пассажиром") {
    try {
      const r = await client.post(`/api/passenger/orders/${publicId}/cancel`, { reason });
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },
  async submitFeedback(publicId, rating, reason, text) {
    try {
      const r = await client.post(`/api/passenger/orders/${publicId}/feedback`, {
        rating,
        complaint_reason: reason || null,
        complaint_text: text || "",
      });
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },

  // Chat
  async chatHistory(publicId, since = 0) {
    try {
      const r = await client.get(`/api/passenger/orders/${publicId}/chat`, {
        params: { since },
      });
      return r.data?.messages || [];
    } catch (e) {
      throw unwrap(e);
    }
  },
  async chatSend(publicId, text) {
    try {
      const r = await client.post(`/api/passenger/orders/${publicId}/chat`, { text });
      return r.data?.message;
    } catch (e) {
      throw unwrap(e);
    }
  },
};

// Определить город по координатам (zoom=10 = уровень города)
export async function reverseGeocodeCity(lat, lon) {
  try {
    const r = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { lat, lon, format: "json", "accept-language": "ru", zoom: 10, addressdetails: 1 },
      timeout: 8000,
      headers: { "User-Agent": "RassvetPassenger/1.0" },
    });
    const a = r.data?.address || {};
    const name = a.city || a.town || a.village || a.county || a.state;
    if (!name) return null;
    return { name, lat, lon };
  } catch {
    return null;
  }
}

// Nominatim (OpenStreetMap) reverse geocoding
export async function reverseGeocode(lat, lon) {
  try {
    const r = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { lat, lon, format: "json", "accept-language": "ru", addressdetails: 1 },
      timeout: 8000,
      headers: { "User-Agent": "RassvetPassenger/1.0" },
    });
    return shortNominatimAddress(r.data) || r.data?.display_name || null;
  } catch {
    return null;
  }
}

function shortNominatimAddress(item) {
  if (!item) return null;
  const a = item.address || {};
  const road = a.road || a.pedestrian || a.footway || a.path || a.street;
  const num  = a.house_number;
  const city = a.city || a.town || a.village;

  if (road) {
    const parts = [road];
    if (num)  parts.push(num);
    if (city) parts.push(city);
    return parts.join(", ");
  }

  // Запасной вариант — первые 3 части display_name
  if (item.display_name) {
    return item.display_name.split(",").slice(0, 3).map((s) => s.trim()).join(", ");
  }
  return null;
}

// Forward geocoding — поиск адресов с привязкой к городу
// cityName добавляется к запросу для точности (напр. "Пушкина, Севастополь")
export async function geocodeSearch(query, nearLat, nearLon, cityName) {
  try {
    // Добавляем город к запросу если он ещё не содержит запятой
    const q = cityName && !query.includes(",")
      ? `${query}, ${cityName}`
      : query;

    const params = {
      q,
      format: "json",
      "accept-language": "ru",
      limit: 8,
      countrycodes: "ru",
      addressdetails: 1,
    };
    if (nearLat && nearLon) {
      const d = 0.5; // ~55 км — достаточно для любого города
      params.viewbox = `${nearLon - d},${nearLat + d},${nearLon + d},${nearLat - d}`;
      params.bounded = 1; // строго внутри viewbox
    }
    const r = await axios.get("https://nominatim.openstreetmap.org/search", {
      params,
      timeout: 8000,
      headers: { "User-Agent": "RassvetPassenger/1.0" },
    });
    return (r.data || []).map((item) => ({
      label: shortNominatimAddress(item) || item.display_name || "",
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    })).filter((item) => item.label);
  } catch {
    return [];
  }
}

// OSRM маршрут между двумя точками
export async function getRoute(pickupLat, pickupLon, dropoffLat, dropoffLon) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${pickupLon},${pickupLat};${dropoffLon},${dropoffLat}`;
    const r = await axios.get(url, {
      params: { overview: "full", geometries: "geojson" },
      timeout: 10000,
      headers: { "User-Agent": "RassvetPassenger/1.0" },
    });
    const route = r.data?.routes?.[0];
    if (!route) return null;
    return {
      distanceM: route.distance,                                      // метры
      durationS: route.duration,                                      // секунды
      coords: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]), // → [lat,lon]
    };
  } catch {
    return null;
  }
}

// City search (for CityScreen — Russian cities/towns)
export async function searchCity(query) {
  try {
    const r = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: query,
        format: "json",
        "accept-language": "ru",
        limit: 8,
        countrycodes: "ru",
        addressdetails: 1,
        featuretype: "city",
      },
      timeout: 8000,
      headers: { "User-Agent": "RassvetPassenger/1.0" },
    });
    return (r.data || []).map((item) => ({
      label:
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.name ||
        item.display_name,
      region: item.address?.state || item.address?.region || "",
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}
