import axios from "axios";
import { BACKEND_URL } from "./config";

let _token = null;
export function setAuthToken(token) {
  _token = token || null;
}

const client = axios.create({ baseURL: BACKEND_URL, timeout: 15000 });

client.interceptors.request.use((cfg) => {
  if (_token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${_token}` };
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
  async login(inviteCode) {
    try {
      const r = await client.post("/api/auth/driver/login", { invite_code: inviteCode });
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },

  // Profile
  async me() {
    try {
      const r = await client.get("/api/driver/me");
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },

  // Presence & location
  async setPresence(isOnline, lat, lon) {
    try {
      const r = await client.post("/api/driver/presence", {
        is_online: isOnline,
        current_lat: lat,
        current_lon: lon,
      });
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },
  async pushLocation(lat, lon) {
    try {
      const r = await client.post("/api/driver/location", {
        current_lat: lat,
        current_lon: lon,
      });
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },

  // Orders
  async available() {
    try {
      const r = await client.get("/api/driver/orders/available");
      return r.data?.items || [];
    } catch (e) {
      throw unwrap(e);
    }
  },
  async current() {
    try {
      const r = await client.get("/api/driver/orders/current");
      return r.data?.order || null;
    } catch (e) {
      throw unwrap(e);
    }
  },
  async accept(publicId) {
    try {
      const r = await client.post(`/api/driver/orders/${publicId}/accept`, {});
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },
  async decline(publicId, reason = "") {
    try {
      const r = await client.post(`/api/driver/orders/${publicId}/decline`, { reason });
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },
  async setStatus(publicId, status) {
    try {
      const r = await client.post(`/api/driver/orders/${publicId}/status`, { status });
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },
  async cancel(publicId, reason = "Отменено водителем") {
    try {
      const r = await client.post(`/api/driver/orders/${publicId}/cancel`, { reason });
      return r.data;
    } catch (e) {
      throw unwrap(e);
    }
  },

  // Chat (operator + ride)
  async operatorChatHistory(since = 0) {
    try {
      const r = await client.get("/api/driver/chat/operator", { params: { since } });
      return r.data?.messages || [];
    } catch (e) {
      throw unwrap(e);
    }
  },
  async operatorChatSend(text) {
    try {
      const r = await client.post("/api/driver/chat/operator", { text });
      return r.data?.message;
    } catch (e) {
      throw unwrap(e);
    }
  },
  async rideChatHistory(publicId, since = 0) {
    try {
      const r = await client.get(`/api/driver/orders/${publicId}/chat`, { params: { since } });
      return r.data?.messages || [];
    } catch (e) {
      throw unwrap(e);
    }
  },
  async rideChatSend(publicId, text) {
    try {
      const r = await client.post(`/api/driver/orders/${publicId}/chat`, { text });
      return r.data?.message;
    } catch (e) {
      throw unwrap(e);
    }
  },
};
