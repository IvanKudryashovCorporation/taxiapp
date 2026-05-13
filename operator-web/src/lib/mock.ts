// Mock data — используется когда backend не отвечает.
// Реалистичные значения для Севастополя.
import type { DashboardKpi, HourPoint, Order, Driver, Passenger } from "./api";

export const MOCK_KPI: DashboardKpi = {
  drivers_online: 42,
  drivers_online_delta_hour: 12,
  active_orders: 18,
  active_orders_delta_hour: 4,
  revenue_today: 87420,
  revenue_today_delta_hour: 3200,
  avg_rating: 4.87,
};

export const MOCK_HOURS: HourPoint[] = Array.from({ length: 24 }, (_, h) => {
  // Reasonable daily curve: peak at 8-9 AM and 6-8 PM
  const peak1 = 60 * Math.exp(-Math.pow((h - 8) / 2.5, 2));
  const peak2 = 80 * Math.exp(-Math.pow((h - 19) / 2.5, 2));
  const noise = 4 * Math.sin(h * 1.7);
  return { hour: h, orders: Math.max(0, Math.round(peak1 + peak2 + noise + 8)) };
});

export const MOCK_ORDERS: Order[] = [
  {
    public_id: "ORD-1042",
    status: "ride_in_progress",
    fare_total: 340,
    pickup_address: "пр. Нахимова, 4",
    pickup_lat: 44.6155,
    pickup_lon: 33.5256,
    dropoff_address: "Малахов курган",
    dropoff_lat: 44.605,
    dropoff_lon: 33.557,
    passenger_full_name: "Анна К.",
    driver_full_name: "Игорь П.",
    vehicle_make: "Skoda",
    vehicle_model: "Octavia",
    vehicle_plate: "А247ВО92",
    car_class: "Комфорт",
    payment_method: "card",
    created_at: new Date(Date.now() - 14 * 60_000).toISOString(),
  },
  {
    public_id: "ORD-1041",
    status: "completed",
    fare_total: 220,
    pickup_address: "Графская пристань",
    pickup_lat: 44.617,
    pickup_lon: 33.524,
    dropoff_address: "Северная сторона",
    dropoff_lat: 44.628,
    dropoff_lon: 33.531,
    passenger_full_name: "Михаил В.",
    driver_full_name: "Сергей Д.",
    vehicle_make: "Lada",
    vehicle_model: "Vesta",
    vehicle_plate: "В431АА92",
    car_class: "Эконом",
    payment_method: "cash",
    created_at: new Date(Date.now() - 42 * 60_000).toISOString(),
  },
  {
    public_id: "ORD-1040",
    status: "searching_driver",
    fare_total: 410,
    pickup_address: "Аквамарин",
    pickup_lat: 44.601,
    pickup_lon: 33.519,
    dropoff_address: "ТЦ Муссон",
    dropoff_lat: 44.587,
    dropoff_lon: 33.547,
    passenger_full_name: "Елена С.",
    car_class: "Комфорт",
    payment_method: "online",
    created_at: new Date(Date.now() - 2 * 60_000).toISOString(),
  },
  {
    public_id: "ORD-1039",
    status: "cancelled",
    fare_total: 0,
    pickup_address: "ул. Большая Морская, 12",
    pickup_lat: 44.612,
    pickup_lon: 33.523,
    dropoff_address: "Балаклава",
    dropoff_lat: 44.498,
    dropoff_lon: 33.598,
    passenger_full_name: "Дмитрий Л.",
    car_class: "Бизнес",
    payment_method: "card",
    created_at: new Date(Date.now() - 90 * 60_000).toISOString(),
  },
];

export const MOCK_DRIVERS: Driver[] = [
  { id: 1, full_name: "Игорь Петров",  phone: "+7 978 111-22-33", rating: 4.92, status: "online",  vehicle_make: "Skoda", vehicle_model: "Octavia", vehicle_plate: "А247ВО92", total_rides: 1248 },
  { id: 2, full_name: "Сергей Демин",   phone: "+7 978 222-33-44", rating: 4.87, status: "busy",    vehicle_make: "Lada",  vehicle_model: "Vesta",   vehicle_plate: "В431АА92", total_rides: 942 },
  { id: 3, full_name: "Алексей Орлов",  phone: "+7 978 333-44-55", rating: 4.95, status: "online",  vehicle_make: "Toyota",vehicle_model: "Camry",   vehicle_plate: "Е789КК92", total_rides: 2104 },
  { id: 4, full_name: "Виктор Шевченко",phone: "+7 978 444-55-66", rating: 4.78, status: "offline", vehicle_make: "Kia",   vehicle_model: "Rio",     vehicle_plate: "Н112ММ92", total_rides: 614 },
  { id: 5, full_name: "Артур Гасанов",  phone: "+7 978 555-66-77", rating: 4.91, status: "online",  vehicle_make: "Hyundai",vehicle_model: "Solaris",vehicle_plate: "К556СО92", total_rides: 1789 },
  { id: 6, full_name: "Олег Капустин",  phone: "+7 978 666-77-88", rating: 4.69, status: "busy",    vehicle_make: "Renault",vehicle_model: "Logan",  vehicle_plate: "Т304ЕЕ92", total_rides: 412 },
];

export const MOCK_PASSENGERS: Passenger[] = [
  { id: 1, full_name: "Анна Карелина", phone: "+7 978 100-20-30", total_rides: 84, avg_check: 312, last_active_at: new Date(Date.now() - 14 * 60_000).toISOString() },
  { id: 2, full_name: "Михаил Власов", phone: "+7 978 100-20-31", total_rides: 142, avg_check: 285, last_active_at: new Date(Date.now() - 42 * 60_000).toISOString() },
  { id: 3, full_name: "Елена Соколова", phone: "+7 978 100-20-32", total_rides: 38, avg_check: 410, last_active_at: new Date(Date.now() - 2 * 60_000).toISOString() },
  { id: 4, full_name: "Дмитрий Лазарев", phone: "+7 978 100-20-33", total_rides: 7, avg_check: 540, last_active_at: new Date(Date.now() - 90 * 60_000).toISOString() },
];
