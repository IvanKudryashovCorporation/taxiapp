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

// Nominatim (OpenStreetMap) address lookup — used for "use center of map as pickup/dropoff"
export async function reverseGeocode(lat, lon) {
  try {
    const r = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { lat, lon, format: "json", "accept-language": "ru" },
      timeout: 8000,
      headers: { "User-Agent": "RassvetPassenger/1.0" },
    });
    return r.data?.display_name || null;
  } catch {
    return null;
  }
}
