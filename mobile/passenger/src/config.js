export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  "http://192.168.50.146:8000";

export const WS_URL =
  BACKEND_URL.replace(/^https/, "wss").replace(/^http/, "ws") + "/ws";

export const STORAGE_KEYS = {
  token: "passenger.token",
  profile: "passenger.profile",
  city: "passenger.city",
};

export const CAR_CLASSES = [
  { id: "econom", label: "Легковые", icon: "🚗", priceHint: "от 150 ₽" },
  { id: "comfort", label: "Комфорт", icon: "✦", priceHint: "от 250 ₽" },
  { id: "business", label: "Бизнес", icon: "◈", priceHint: "от 400 ₽" },
  { id: "taxis_plus", label: "Такси+", icon: "+", priceHint: "от 200 ₽" },
];

export const PAYMENT_METHODS = [
  { id: "cash", label: "Наличные" },
  { id: "card", label: "Карта" },
  { id: "sbp", label: "СБП" },
];
