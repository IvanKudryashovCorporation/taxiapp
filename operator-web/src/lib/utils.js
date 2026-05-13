// Общие утилиты-форматтеры. Намеренно JS (не TS) — простые helpers без типов,
// чтобы их можно было дёргать из любого .ts или .tsx без import-кейс ada.

/** Форматирует число как рубли с пробелами тысяч: 12345 → "12 345 ₽" */
export function formatMoney(v) {
  const n = Math.round(Number(v || 0));
  return `${n.toLocaleString("ru-RU").replace(/,/g, " ")} ₽`;
}

/** Целочисленное число с пробелами: 12345 → "12 345" */
export function formatInt(v) {
  return Math.round(Number(v || 0)).toLocaleString("ru-RU").replace(/,/g, " ");
}

/** Расстояние: метры → "320 м" / "5,2 км" */
export function formatDistance(m) {
  if (m == null) return "—";
  if (m >= 1000) return `${(m / 1000).toFixed(1).replace(".", ",")} км`;
  return `${Math.round(m)} м`;
}

/** Длительность: секунды → "5 мин" / "1 ч 12 мин" */
export function formatDuration(s) {
  if (s == null) return "—";
  const min = Math.round(s / 60);
  if (min < 60) return `${min} мин`;
  return `${Math.floor(min / 60)} ч ${min % 60} мин`;
}

/** Время в формате HH:MM из ISO/Date */
export function formatTime(ts) {
  if (!ts) return "";
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Дата в формате DD.MM.YYYY */
export function formatDate(ts) {
  if (!ts) return "";
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

/** Объединяет classnames, игнорируя falsy */
export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

/** Дельта со знаком: -3 → "-3", 12 → "+12" */
export function formatDelta(v) {
  const n = Number(v || 0);
  if (n > 0) return `+${formatInt(n)}`;
  if (n < 0) return `${formatInt(n)}`;
  return "0";
}

/** Маппинг status → семантический цвет (для бейджей/чипов) */
export function statusColor(status) {
  const map = {
    active: "ok",
    online: "ok",
    completed: "ok",
    arrived: "ok",
    pending: "warn",
    searching_driver: "warn",
    driver_on_the_way: "warn",
    cancelled: "bad",
    failed: "bad",
    error: "bad",
  };
  return map[status] || "stone";
}

/** Человекочитаемый статус заказа (как в mobile/passenger/MainScreen) */
export function humanStatus(status) {
  return ({
    created: "новый",
    searching_driver: "ищем водителя",
    accepted: "водитель назначен",
    driver_on_the_way: "водитель в пути",
    driver_nearby_leave_now: "водитель рядом",
    arrived: "водитель на месте",
    ride_in_progress: "поездка идёт",
    completed: "завершён",
    cancelled: "отменён",
  })[status] || status || "—";
}
