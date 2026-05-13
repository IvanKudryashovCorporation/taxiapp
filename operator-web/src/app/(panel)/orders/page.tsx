// Orders — спека §6.3.3
// Топ: фильтры-чипы (Все/Активные/Завершённые/Отменённые), диапазон дат, поиск.
// Таблица: ID/Время/Пассажир/Водитель/Откуда/Куда/Стоимость (right) /Статус.
// Row 56, hairline divider sand. Hover — paper. Клик — drawer (TODO).
"use client";
import * as React from "react";
import StatusBadge from "@/components/StatusBadge";
import { Icon } from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { formatMoney, formatTime, cn } from "@/lib/utils.js";
import { MOCK_ORDERS } from "@/lib/mock";
import api from "@/lib/api";
import type { Order } from "@/lib/api";

type Filter = "all" | "active" | "completed" | "cancelled";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",       label: "Все" },
  { id: "active",    label: "Активные" },
  { id: "completed", label: "Завершённые" },
  { id: "cancelled", label: "Отменённые" },
];

const ACTIVE_STATUSES = new Set([
  "created", "searching_driver", "accepted", "driver_on_the_way",
  "driver_nearby_leave_now", "arrived", "ride_in_progress",
]);

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>(MOCK_ORDERS);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const o = await api.orders();
        if (!cancelled && o?.length) setOrders(o);
      } catch { /* mock fallback */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = orders.filter((o) => {
    if (filter === "active"    && !ACTIVE_STATUSES.has(o.status)) return false;
    if (filter === "completed" && o.status !== "completed") return false;
    if (filter === "cancelled" && o.status !== "cancelled") return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const hay = [o.public_id, o.passenger_full_name, o.driver_full_name, o.pickup_address, o.dropoff_address]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-paper2 border border-sand rounded-r3 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "h-9 px-3 rounded-r2 text-cap2 font-medium transition-colors",
                    filter === f.id
                      ? "bg-ink text-paper"
                      : "text-graphite hover:text-ink",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button className="h-10 px-3 bg-paper2 border border-sand rounded-r3 flex items-center gap-2 text-graphite hover:text-ink text-cap2">
                <Icon name="clock" size={16} />
                <span className="tabular-nums">Сегодня</span>
              </button>
              <div className="flex items-center gap-2 w-[280px] h-10 bg-paper2 border border-sand rounded-r3 px-3">
                <Icon name="search" size={16} className="text-stone" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ID, телефон, адрес…"
                  className="flex-1 bg-transparent outline-none text-body text-ink placeholder:text-stone"
                />
              </div>
            </div>
          </div>
        }
      />

      <div className="bg-paper2 rounded-r3 border border-sand overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-cap text-graphite uppercase tracking-wider">
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Время</th>
              <th className="px-4 py-3 font-semibold">Пассажир</th>
              <th className="px-4 py-3 font-semibold">Водитель</th>
              <th className="px-4 py-3 font-semibold">Откуда</th>
              <th className="px-4 py-3 font-semibold">Куда</th>
              <th className="px-4 py-3 font-semibold text-right">Стоимость</th>
              <th className="px-4 py-3 font-semibold">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-stone text-cap2">
                  Заказы по фильтру не найдены
                </td>
              </tr>
            ) : filtered.map((o) => (
              <tr key={o.public_id} className="hover:bg-paper transition-colors cursor-pointer" style={{ height: 56 }}>
                <td className="px-4 tabular-nums text-cap2 text-ink font-medium">{o.public_id}</td>
                <td className="px-4 tabular-nums text-cap2 text-graphite">{formatTime(o.created_at)}</td>
                <td className="px-4 text-body text-ink truncate max-w-[140px]">{o.passenger_full_name || "—"}</td>
                <td className="px-4 text-body text-ink truncate max-w-[140px]">{o.driver_full_name || "—"}</td>
                <td className="px-4 text-cap2 text-graphite truncate max-w-[200px]">{o.pickup_address}</td>
                <td className="px-4 text-cap2 text-graphite truncate max-w-[200px]">{o.dropoff_address}</td>
                <td className="px-4 text-right tabular-nums text-body text-ink font-medium">
                  {o.fare_total > 0 ? formatMoney(o.fare_total) : "—"}
                </td>
                <td className="px-4"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-cap2 text-graphite mt-3 tabular-nums">
        Показано {filtered.length} из {orders.length}
      </div>
    </div>
  );
}
