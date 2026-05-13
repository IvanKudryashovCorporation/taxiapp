// Passengers — спека §6.3.5: имя, телефон, кол-во поездок, средний чек, последняя активность.
"use client";
import * as React from "react";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { formatMoney, formatInt, formatTime, formatDate } from "@/lib/utils.js";
import { MOCK_PASSENGERS } from "@/lib/mock";
import api from "@/lib/api";
import type { Passenger } from "@/lib/api";

export default function PassengersPage() {
  const [passengers, setPassengers] = React.useState<Passenger[]>(MOCK_PASSENGERS);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await api.passengers();
        if (!cancelled && p?.length) setPassengers(p);
      } catch { /* mock fallback */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = passengers.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (p.full_name + " " + p.phone).toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader
        filters={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 w-[280px] h-10 bg-paper2 border border-sand rounded-r3 px-3">
              <Icon name="search" size={16} className="text-stone" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Имя или телефон…"
                className="flex-1 bg-transparent outline-none text-body text-ink placeholder:text-stone"
              />
            </div>
            <div className="ml-auto text-cap2 text-graphite tabular-nums">
              Показано {filtered.length} из {passengers.length}
            </div>
          </div>
        }
      />

      <div className="bg-paper2 rounded-r3 border border-sand overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-cap text-graphite uppercase tracking-wider">
              <th className="px-4 py-3 font-semibold">Имя</th>
              <th className="px-4 py-3 font-semibold">Телефон</th>
              <th className="px-4 py-3 font-semibold text-right">Поездок</th>
              <th className="px-4 py-3 font-semibold text-right">Средний чек</th>
              <th className="px-4 py-3 font-semibold">Последняя активность</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-stone text-cap2">Не найдено</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-paper transition-colors" style={{ height: 56 }}>
                <td className="px-4 text-body text-ink font-medium">{p.full_name || "—"}</td>
                <td className="px-4 tabular-nums text-cap2 text-graphite">{p.phone}</td>
                <td className="px-4 text-right tabular-nums text-body text-ink">{formatInt(p.total_rides ?? 0)}</td>
                <td className="px-4 text-right tabular-nums text-body text-ink">
                  {p.avg_check ? formatMoney(p.avg_check) : "—"}
                </td>
                <td className="px-4 tabular-nums text-cap2 text-graphite">
                  {p.last_active_at ? `${formatDate(p.last_active_at)} · ${formatTime(p.last_active_at)}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
