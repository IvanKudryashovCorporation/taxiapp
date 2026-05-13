// Drivers — спека §6.3.4
// Карточная сетка 3×N: avatar, имя, рейтинг, статус-бейдж, ID авто, кнопки.
// Top: фильтры (статус, регион, рейтинг slider).
"use client";
import * as React from "react";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { cn, formatInt } from "@/lib/utils.js";
import { MOCK_DRIVERS } from "@/lib/mock";
import api from "@/lib/api";
import type { Driver } from "@/lib/api";

type StatusFilter = "all" | "online" | "busy" | "offline";

const STATUSES: { id: StatusFilter; label: string }[] = [
  { id: "all",     label: "Все" },
  { id: "online",  label: "Онлайн" },
  { id: "busy",    label: "В заказе" },
  { id: "offline", label: "Оффлайн" },
];

export default function DriversPage() {
  const [drivers, setDrivers] = React.useState<Driver[]>(MOCK_DRIVERS);
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [minRating, setMinRating] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api.drivers();
        if (!cancelled && d?.length) setDrivers(d);
      } catch { /* mock fallback */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = drivers.filter((d) => {
    if (status !== "all" && d.status !== status) return false;
    if (minRating && (d.rating ?? 0) < minRating) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        filters={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-paper2 border border-sand rounded-r3 p-1">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatus(s.id)}
                  className={cn(
                    "h-9 px-3 rounded-r2 text-cap2 font-medium transition-colors",
                    status === s.id ? "bg-ink text-paper" : "text-graphite hover:text-ink",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 px-4 h-10 bg-paper2 border border-sand rounded-r3">
              <span className="text-cap2 text-graphite">Рейтинг от</span>
              <span className="tabular-nums text-body text-ink font-medium">
                <span className="text-sun">★</span> {minRating.toFixed(1)}
              </span>
              <input
                type="range" min={0} max={5} step={0.1}
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-32 accent-[var(--c-sun)]"
              />
            </div>

            <div className="ml-auto text-cap2 text-graphite tabular-nums">
              Показано {filtered.length} из {drivers.length}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <article key={d.id} className="bg-paper2 rounded-r3 border border-sand p-5 shadow-s1 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-paper border border-sand flex items-center justify-center text-cap2 font-medium flex-none">
                {d.full_name.split(" ").map(p => p[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-body2 text-ink font-medium truncate">{d.full_name}</h3>
                  <StatusBadge status={d.status || "offline"} />
                </div>
                <div className="text-cap2 text-graphite tabular-nums mt-0.5">
                  <span className="text-sun">★</span> {d.rating?.toFixed(2)} · {formatInt(d.total_rides ?? 0)} поездок
                </div>
              </div>
            </div>

            <div className="bg-paper rounded-r2 px-3 py-2.5 flex items-center gap-3 border border-sand">
              <Icon name="car" size={18} className="text-graphite flex-none" />
              <div className="flex-1 min-w-0">
                <div className="text-cap text-graphite tracking-wide uppercase">
                  {d.vehicle_make} {d.vehicle_model}
                </div>
                <div className="tabular-nums text-cap2 text-ink font-medium mt-0.5">
                  {d.vehicle_plate}
                </div>
              </div>
              <span className="tabular-nums text-cap2 text-stone">{d.phone}</span>
            </div>

            <div className="flex gap-2 -mb-1">
              <button className="flex-1 h-9 rounded-r2 bg-paper border border-sand text-cap2 text-ink font-medium hover:bg-sand">
                Профиль
              </button>
              <button className="h-9 px-3 rounded-r2 border border-sand text-graphite hover:text-ink">
                <Icon name="chat" size={16} />
              </button>
              <button className="h-9 px-3 rounded-r2 border border-sand text-graphite hover:text-bad">
                <Icon name="warn" size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
