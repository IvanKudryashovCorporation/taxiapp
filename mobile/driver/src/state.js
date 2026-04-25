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
    set({ token, profile, bootstrapped: true, isOnline: true });
    if (token) {
      get()._initSocket();
      await get().refreshState();
      // Автоматически уходим онлайн
      get()._goOnline();
    }
  },

  async setAuth({ token, profile }) {
    setAuthToken(token);
    await setItem(STORAGE_KEYS.token, token);
    await setItem(STORAGE_KEYS.profile, profile);
    set({ token, profile, isOnline: true });
    get()._initSocket();
    await get().refreshState();
    // Автоматически уходим онлайн
    get()._goOnline();
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
    if (token.startsWith("test-token-")) return;
    try {
      const me = await api.me();
      // isOnline всегда true — не читаем с сервера
      set({ profile: me });
      const current = await api.current();
      set({ currentOrder: current });
      if (current?.public_id && socket) socket.subscribeOrder(current.public_id);
      const items = await api.available();
      set({ available: items });
    } catch (e) {
      console.warn("refreshState", e.message);
    }
  },

  setLocation(loc) {
    set({ location: loc });
  },

  setHeading(heading) {
    set((s) => ({
      location: s.location
        ? { ...s.location, heading }
        : { heading },
    }));
  },

  // Вызывается автоматически при входе — выставляет водителя онлайн
  async _goOnline() {
    const token = get().token;
    if (!token || token.startsWith("test-token-")) return;
    const loc = get().location;
    try {
      await api.setPresence(true, loc?.lat ?? null, loc?.lon ?? null);
      set({ isOnline: true });
    } catch (e) {
      console.warn("_goOnline", e.message);
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
