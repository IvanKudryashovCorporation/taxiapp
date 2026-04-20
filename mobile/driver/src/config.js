export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  "http://192.168.50.146:8000";

export const WS_URL =
  BACKEND_URL.replace(/^https/, "wss").replace(/^http/, "ws") + "/ws";

export const STORAGE_KEYS = {
  token: "driver.token",
  profile: "driver.profile",
};

// How often the driver pushes its GPS to the backend (ms)
export const LOCATION_PUSH_INTERVAL = 10_000;
