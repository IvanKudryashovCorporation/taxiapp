import { create } from "zustand";
import { api, setAuthToken } from "./api";
import { getItem, setItem, removeItem } from "./storage";
import { STORAGE_KEYS } from "./config";
import { DriverSocket } from "./ws";

let socket = null;

export const useStore = create((set, get) => ({
  token: null,
  profile: null,
  bootstrapped: false,

  wsStatus: "offline",
  currentOrder: null,
  available: [],
  isOnline: false,
  location: null, // { lat, lon }

  async bootstrap() {
    const token = await getItem(STORAGE_KEYS.token);
    const profile = await getItem(STORAGE_KEYS.profile);
    setAuthToken(token);
    set({
      token,
      profile,
      bootstrapped: true,
      isOnline: !!profile?.is_online,
    });
    if (token) {
      get()._initSocket();
      get().refreshState();
    }
  },

  async setAuth({ token, profile }) {
    setAuthToken(token);
    await setItem(STORAGE_KEYS.token, token);
    await setItem(STORAGE_KEYS.profile, profile);
    set({ token, profile, isOnline: !!profile?.is_online });
    get()._initSocket();
    get().refreshState();
  },

  async logout() {
    setAuthToken(null);
    await removeItem(STORAGE_KEYS.token);
    await removeItem(STORAGE_KEYS.profile);
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    set({
      token: null,
      profile: null,
      currentOrder: null,
      available: [],
      wsStatus: "offline",
      isOnline: false,
    });
  },

  async refreshState() {
    const token = get().token;
    if (!token) return;
    // Тестовый режим — пропускаем запросы к серверу
    if (token.startsWith("test-token-")) return;
    try {
      const me = await api.me();
      set({ profile: me, isOnline: !!me.is_online });
      const current = await api.current();
      set({ currentOrder: current });
      if (current?.public_id && socket) socket.subscribeOrder(current.public_id);
      if (get().isOnline) {
        const items = await api.available();
        set({ available: items });
      } else {
        set({ available: [] });
      }
    } catch (e) {
      console.warn("refreshState", e.message);
    }
  },

  setLocation(loc) {
    set({ location: loc });
  },

  async togglePresence(next) {
    const token = get().token;
    // Тестовый режим — переключаем локально без сервера
    if (token?.startsWith("test-token-")) {
      set((s) => ({ isOnline: next, profile: s.profile ? { ...s.profile, is_online: next } : s.profile }));
      return;
    }
    const loc = get().location;
    try {
      const p = await api.setPresence(next, loc?.lat ?? null, loc?.lon ?? null);
      set({ profile: p, isOnline: !!p.is_online });
      await get().refreshState();
    } catch (e) {
      console.warn("togglePresence", e.message);
    }
  },

  _initSocket() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    socket = new DriverSocket({
      onStateChange: (s) => set({ wsStatus: s }),
      onEvent: (evt) => {
        const t = evt?.type;
        if (
          t === "order.created" ||
          t === "order.accepted" ||
          t === "order.updated" ||
          t === "order.cancelled" ||
          t === "order.completed" ||
          t === "driver.presence"
        ) {
          get().refreshState();
        }
      },
    });
    socket.setToken(get().token);
  },
}));

export function getSocket() {
  return socket;
}
