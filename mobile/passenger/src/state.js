import { create } from "zustand";
import { api, setAuthToken } from "./api";
import { getItem, setItem, removeItem } from "./storage";
import { STORAGE_KEYS } from "./config";
import { PassengerSocket } from "./ws";

let socket = null;

export const useStore = create((set, get) => ({
  // auth
  token: null,
  profile: null,
  bootstrapped: false,

  // city (saved after first login)
  cityName: null,
  cityLat: null,
  cityLon: null,

  // state
  wsStatus: "offline",
  currentOrder: null,
  history: [],
  lastQuote: null,
  nearbyDrivers: [],

  async bootstrap() {
    const token = await getItem(STORAGE_KEYS.token);
    const profile = await getItem(STORAGE_KEYS.profile);
    const city = await getItem(STORAGE_KEYS.city);
    setAuthToken(token);
    set({
      token,
      profile,
      bootstrapped: true,
      cityName: city?.name || null,
      cityLat: city?.lat || null,
      cityLon: city?.lon || null,
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
    set({ token, profile });
    get()._initSocket();
    get().refreshState();
  },

  async setCity({ name, lat, lon }) {
    await setItem(STORAGE_KEYS.city, { name, lat, lon });
    set({ cityName: name, cityLat: lat, cityLon: lon });
  },

  async logout() {
    setAuthToken(null);
    await removeItem(STORAGE_KEYS.token);
    await removeItem(STORAGE_KEYS.profile);
    await removeItem(STORAGE_KEYS.city);
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    set({
      token: null,
      profile: null,
      currentOrder: null,
      history: [],
      wsStatus: "offline",
      cityName: null,
      cityLat: null,
      cityLon: null,
    });
  },

  async refreshState() {
    const token = get().token;
    if (!token) return;
    // Тестовый режим — пропускаем запросы к серверу
    if (token.startsWith("test-token-")) return;
    try {
      const data = await api.me();
      set({
        profile: data.passenger || get().profile,
        currentOrder: data.current_order || null,
      });
      const hist = await api.history();
      set({ history: hist });
      const current = get().currentOrder;
      if (current?.public_id && socket) socket.subscribeOrder(current.public_id);
    } catch (e) {
      console.warn("refreshState", e.message);
    }
  },

  setCurrentOrder(order) {
    const prev = get().currentOrder;
    set({ currentOrder: order });
    if (order?.public_id && socket) socket.subscribeOrder(order.public_id);
    if (!order && prev?.public_id && socket) socket.unsubscribeOrder(prev.public_id);
  },

  setNearbyDrivers(drivers) {
    set({ nearbyDrivers: drivers });
  },
  generateNearbyDrivers(lat, lon) {
    const drivers = Array.from({ length: 6 }, (_, i) => ({
      id: `mock-${i}`,
      lat: lat + (Math.random() - 0.5) * 0.018,
      lon: lon + (Math.random() - 0.5) * 0.018,
      heading: Math.random() * 360,
    }));
    set({ nearbyDrivers: drivers });
    return drivers;
  },
  setLastQuote(q) {
    set({ lastQuote: q });
  },

  _initSocket() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    socket = new PassengerSocket({
      onStateChange: (s) => set({ wsStatus: s }),
      onEvent: (evt) => {
        const t = evt?.type;
        if (
          t === "order.created" ||
          t === "order.accepted" ||
          t === "order.updated" ||
          t === "order.cancelled" ||
          t === "order.completed" ||
          t === "driver.location"
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
