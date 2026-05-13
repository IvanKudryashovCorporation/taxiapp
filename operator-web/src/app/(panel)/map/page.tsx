// MapDispatch — спека §6.3.2
// Карта на 100% (минус sidebar/topbar). Floating-панель слева сверху с фильтрами и счётчиком.
// Для production — Leaflet/MapLibre с custom стилем; здесь — мок-фон с точками.
"use client";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils.js";
import { MOCK_DRIVERS, MOCK_ORDERS } from "@/lib/mock";

type FleetFilter = "online" | "busy" | "offline";

export default function MapPage() {
  const [filters, setFilters] = React.useState<Record<FleetFilter, boolean>>({
    online: true, busy: true, offline: false,
  });

  const fleetCount = MOCK_DRIVERS.filter((d) => d.status && filters[d.status as FleetFilter]).length;

  return (
    <div className="relative -mx-6 -my-6" style={{ height: "calc(100vh - 64px)" }}>
      {/* Map background (бумажный стиль) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--c-map-bg)",
          backgroundImage: `
            linear-gradient(to right, var(--c-sand) 1px, transparent 1px),
            linear-gradient(to bottom, var(--c-sand) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Mock pins */}
      {MOCK_DRIVERS.filter((d) => d.status && filters[d.status as FleetFilter]).map((d, i) => {
        const x = 18 + (i * 11) % 70;
        const y = 18 + (i * 17) % 60;
        return (
          <div
            key={d.id}
            className="absolute"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            title={`${d.full_name} · ${d.vehicle_plate}`}
          >
            <div className="w-3 h-3 rounded-full bg-ink shadow-s2 ring-2 ring-paper2" />
          </div>
        );
      })}
      {MOCK_ORDERS.filter((o) => o.status === "searching_driver" || o.status === "created").map((o, i) => (
        <div
          key={o.public_id}
          className="absolute"
          style={{ left: `${30 + i * 7}%`, top: `${30 + i * 13}%`, transform: "translate(-50%, -50%)" }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-sun shadow-s2 ring-2 ring-paper2 animate-pulse" />
        </div>
      ))}

      {/* Floating left panel */}
      <div className="absolute top-4 left-4 w-[320px] bg-paper2 rounded-r3 border border-sand shadow-s2 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-ink" style={{ fontSize: 17 }}>
            Флот
          </h3>
          <span className="tabular-nums text-cap2 text-graphite">
            <span className="text-ink font-medium">{fleetCount}</span> машин
          </span>
        </div>

        <div className="space-y-2">
          {([
            { id: "online",  label: "Онлайн",   sw: "var(--c-ok)" },
            { id: "busy",    label: "В заказе", sw: "var(--c-warn)" },
            { id: "offline", label: "Оффлайн",  sw: "var(--c-stone)" },
          ] as const).map((row) => (
            <label
              key={row.id}
              className={cn(
                "flex items-center gap-3 px-3 h-10 rounded-r2 cursor-pointer border",
                filters[row.id]
                  ? "bg-paper border-sand"
                  : "bg-paper2 border-sand opacity-60",
              )}
            >
              <input
                type="checkbox"
                className="accent-[var(--c-sun)]"
                checked={filters[row.id]}
                onChange={(e) => setFilters((f) => ({ ...f, [row.id]: e.target.checked }))}
              />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: row.sw }} />
              <span className="text-body text-ink flex-1">{row.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-sand">
          <div className="text-cap text-graphite uppercase tracking-wider mb-2">Легенда</div>
          <div className="flex items-center gap-2 text-cap2 text-graphite mb-1">
            <span className="w-3 h-3 rounded-full bg-ink ring-2 ring-paper2" />
            <span>Машина</span>
          </div>
          <div className="flex items-center gap-2 text-cap2 text-graphite">
            <span className="w-3.5 h-3.5 rounded-full bg-sun ring-2 ring-paper2" />
            <span>Заказ ожидает водителя</span>
          </div>
        </div>
      </div>

      {/* Floating right zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col bg-paper2 rounded-r3 border border-sand shadow-s2 overflow-hidden">
        <button className="w-10 h-10 hover:bg-paper text-graphite hover:text-ink">
          <Icon name="plus" size={18} className="m-auto" />
        </button>
        <div className="hairline-b" />
        <button className="w-10 h-10 hover:bg-paper text-graphite hover:text-ink flex items-center justify-center">
          <span className="text-graphite">−</span>
        </button>
      </div>
    </div>
  );
}
