// UI-state store — Zustand (тот же подход, что в mobile/*).
// Серверные данные кэшируются здесь же; в production стоит заменить на TanStack Query.
import { create } from "zustand";
import type { Order, Driver, Passenger, DashboardKpi, HourPoint } from "./api";

interface OperatorStore {
  // Auth
  token: string | null;
  setToken: (t: string | null) => void;

  // Dashboard
  kpi: DashboardKpi | null;
  hours: HourPoint[];
  setKpi: (kpi: DashboardKpi | null) => void;
  setHours: (h: HourPoint[]) => void;

  // Lists
  orders: Order[];
  drivers: Driver[];
  passengers: Passenger[];
  setOrders: (o: Order[]) => void;
  setDrivers: (d: Driver[]) => void;
  setPassengers: (p: Passenger[]) => void;

  // UI
  selectedOrder: Order | null;
  setSelectedOrder: (o: Order | null) => void;
}

export const useStore = create<OperatorStore>((set) => ({
  token: null,
  setToken: (t) => set({ token: t }),

  kpi: null,
  hours: [],
  setKpi: (kpi) => set({ kpi }),
  setHours: (hours) => set({ hours }),

  orders: [],
  drivers: [],
  passengers: [],
  setOrders: (orders) => set({ orders }),
  setDrivers: (drivers) => set({ drivers }),
  setPassengers: (passengers) => set({ passengers }),

  selectedOrder: null,
  setSelectedOrder: (o) => set({ selectedOrder: o }),
}));
