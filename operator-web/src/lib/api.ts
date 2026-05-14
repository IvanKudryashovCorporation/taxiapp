// API client — axios через next.js rewrites (см. next.config.mjs).
// Все запросы идут на /api/backend/* и проксируются на NEXT_PUBLIC_BACKEND_URL.
import axios, { type AxiosInstance, type AxiosResponse } from "axios";

const BASE = "/api/backend";

let _token: string | null =
  typeof window !== "undefined"
    ? window.localStorage.getItem("operator_token")
    : null;

export function setToken(token: string | null) {
  _token = token;
  if (typeof window !== "undefined") {
    if (token) window.localStorage.setItem("operator_token", token);
    else window.localStorage.removeItem("operator_token");
  }
}

export function getToken(): string | null {
  return _token;
}

const client: AxiosInstance = axios.create({
  baseURL: BASE,
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  if (_token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${_token}`;
  }
  return config;
});

function unwrap<T>(p: Promise<AxiosResponse<T>>): Promise<T> {
  return p.then((r) => r.data).catch((e) => {
    const detail =
      e?.response?.data?.detail ||
      e?.response?.data?.message ||
      e?.message ||
      "Ошибка запроса";
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  });
}

// ─────────────────────────────────────────────────────────────────────
// Типы (минимальный набор, расширять по мере появления endpoints)
// ─────────────────────────────────────────────────────────────────────

export interface Order {
  public_id: string;
  status: string;
  fare_total: number;
  pickup_address: string;
  pickup_lat: number;
  pickup_lon: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lon: number;
  passenger_full_name?: string;
  driver_full_name?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  car_class?: string;
  payment_method?: string;
  created_at?: string;
}

export interface Driver {
  id: number;
  full_name: string;
  phone?: string;
  rating?: number;
  status?: "online" | "offline" | "busy";
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  vehicle_color?: string;
  total_rides?: number;
}

export interface Passenger {
  id: number;
  full_name?: string;
  phone: string;
  total_rides?: number;
  avg_check?: number;
  last_active_at?: string;
}

export interface DashboardKpi {
  drivers_online: number;
  drivers_online_delta_hour: number;
  active_orders: number;
  active_orders_delta_hour: number;
  revenue_today: number;
  revenue_today_delta_hour: number;
  avg_rating: number;
}

export interface HourPoint { hour: number; orders: number; }

export interface ChatHead {
  kind: 'driver' | 'passenger';
  id: string;
  name: string;
  is_online: boolean;
  last_message_at: string;
}

export interface ChatMessage {
  id: number;
  sender_type: string;
  sender_id: string;
  receiver_type: string;
  receiver_id: string;
  text: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────
// Endpoints. Если бэкенд их пока не реализует — UI работает на MOCK
// (см. lib/mock.ts), а ошибка просто логируется.
// ─────────────────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: (email: string, password: string) =>
    unwrap(client.post<{ token: string; profile: unknown }>("/operator/login", { email, password })),

  // Dashboard
  dashboard: () => unwrap(client.get<DashboardKpi>("/operator/dashboard/kpi")),
  ordersByHour: () => unwrap(client.get<HourPoint[]>("/operator/dashboard/orders-by-hour")),

  // Lists
  orders:     (params?: Record<string, unknown>) => unwrap(client.get<Order[]>("/operator/orders", { params })),
  drivers:    (params?: Record<string, unknown>) => unwrap(client.get<Driver[]>("/operator/drivers", { params })),
  passengers: (params?: Record<string, unknown>) => unwrap(client.get<Passenger[]>("/operator/passengers", { params })),

  // Map
  fleetPositions: () => unwrap(client.get<{ driver_id: number; lat: number; lon: number; heading?: number; status?: string }[]>("/operator/map/fleet")),

  // Chat support
  chatHeads: () => unwrap(client.get<{ chats: ChatHead[] }>('/operator/chats')),
  driverChatMessages: (driverPublicId: string, since = 0) =>
    unwrap(client.get<{ messages: ChatMessage[] }>(`/operator/chat/${driverPublicId}`, { params: { since } })),
  sendDriverChatMessage: (driverPublicId: string, text: string) =>
    unwrap(client.post<{ message: ChatMessage }>(`/operator/chat/${driverPublicId}`, { driver_public_id: driverPublicId, text })),
  passengerChatMessages: (passengerId: string, since = 0) =>
    unwrap(client.get<{ messages: ChatMessage[] }>(`/operator/chat/passenger/${passengerId}`, { params: { since } })),
  sendPassengerChatMessage: (passengerId: string, text: string) =>
    unwrap(client.post<{ message: ChatMessage }>(`/operator/chat/passenger/${passengerId}`, { passenger_id: parseInt(passengerId), text })),
};

export default api;
