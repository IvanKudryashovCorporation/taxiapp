// TariffsZones — спека §6.3.6
// Слева список тарифов, справа редактор: коэффициенты (моноширинные numeric inputs).
// Вкладка "Зоны" — карта Севастополя с polygon-зонами.
"use client";
import * as React from "react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils.js";

interface TariffData {
  id: string;
  label: string;
  baseRate: number;
  perKm: number;
  perMin: number;
  minOrder: number;
}

const TARIFFS_INIT: TariffData[] = [
  { id: "econom",   label: "Эконом",   baseRate: 80,  perKm: 18, perMin: 4,  minOrder: 120 },
  { id: "comfort",  label: "Комфорт",  baseRate: 120, perKm: 26, perMin: 6,  minOrder: 180 },
  { id: "business", label: "Бизнес",   baseRate: 200, perKm: 42, perMin: 12, minOrder: 350 },
];

type Tab = "tariffs" | "zones";

export default function TariffsPage() {
  const [tab, setTab] = React.useState<Tab>("tariffs");
  const [tariffs, setTariffs] = React.useState(TARIFFS_INIT);
  const [activeId, setActiveId] = React.useState(TARIFFS_INIT[0].id);
  const active = tariffs.find((t) => t.id === activeId)!;

  function update(field: keyof TariffData, value: number) {
    setTariffs((arr) =>
      arr.map((t) => (t.id === activeId ? { ...t, [field]: value } : t))
    );
  }

  return (
    <div>
      <PageHeader
        filters={
          <div className="flex items-center gap-1 bg-paper2 border border-sand rounded-r3 p-1 inline-flex">
            {(["tariffs", "zones"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "h-9 px-4 rounded-r2 text-cap2 font-medium",
                  tab === t ? "bg-ink text-paper" : "text-graphite hover:text-ink",
                )}
              >
                {t === "tariffs" ? "Тарифы" : "Зоны"}
              </button>
            ))}
          </div>
        }
      />

      {tab === "tariffs" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <aside className="bg-paper2 rounded-r3 border border-sand p-2">
            {tariffs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-r2 transition-colors",
                  activeId === t.id ? "bg-paper border border-sand" : "hover:bg-paper",
                )}
              >
                <div className="text-body text-ink font-medium">{t.label}</div>
                <div className="text-cap text-graphite mt-0.5 tabular-nums">
                  от {t.minOrder} ₽
                </div>
              </button>
            ))}
          </aside>

          <section className="lg:col-span-2 bg-paper2 rounded-r3 border border-sand p-6 shadow-s1">
            <h2 className="font-display font-semibold text-ink mb-1" style={{ fontSize: 22 }}>
              {active.label}
            </h2>
            <p className="text-cap2 text-graphite mb-6">
              Коэффициенты применяются ко всем заказам этого тарифа в Севастополе.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberField label="Базовая ставка"    suffix="₽"      value={active.baseRate} onChange={(v) => update("baseRate", v)} />
              <NumberField label="За километр"        suffix="₽/км"   value={active.perKm}    onChange={(v) => update("perKm", v)} />
              <NumberField label="За минуту"          suffix="₽/мин"  value={active.perMin}   onChange={(v) => update("perMin", v)} />
              <NumberField label="Минимальный заказ"  suffix="₽"      value={active.minOrder} onChange={(v) => update("minOrder", v)} />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button className="h-10 px-4 rounded-r2 border border-sand text-graphite hover:text-ink text-cap2">
                Отменить
              </button>
              <button className="h-10 px-5 rounded-r2 bg-sun text-ink text-cap2 font-medium hover:bg-sunDeep">
                Сохранить
              </button>
            </div>
          </section>
        </div>
      ) : (
        <ZonesEditor />
      )}
    </div>
  );
}

function NumberField({ label, value, suffix, onChange }: { label: string; value: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="text-cap text-graphite uppercase tracking-wider mb-2">{label}</div>
      <div className="flex items-center gap-2 h-12 px-4 bg-white border border-sand rounded-r2 focus-within:border-ink">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 bg-transparent outline-none tabular-nums text-h3 text-ink font-medium"
          style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
        />
        {suffix && <span className="text-cap2 text-stone">{suffix}</span>}
      </div>
    </label>
  );
}

function ZonesEditor() {
  return (
    <div className="bg-paper2 rounded-r3 border border-sand p-6 shadow-s1 min-h-[420px] relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--c-map-bg)",
          backgroundImage: `
            linear-gradient(to right, var(--c-sand) 1px, transparent 1px),
            linear-gradient(to bottom, var(--c-sand) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.6,
        }}
      />
      {/* Mock zone polygon */}
      <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full">
        <polygon
          points="80,80 220,60 280,140 240,220 100,200"
          fill="var(--c-sun-soft)"
          stroke="var(--c-sun)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon
          points="220,160 320,180 340,260 220,280"
          fill="var(--c-sun-soft)"
          stroke="var(--c-sun)"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeLinejoin="round"
        />
      </svg>
      <div className="relative">
        <h2 className="font-display font-semibold text-ink mb-2" style={{ fontSize: 22 }}>
          Зоны Севастополя
        </h2>
        <p className="text-cap2 text-graphite max-w-md">
          Перетащите вершины полигона, чтобы изменить границы зоны. В каждой зоне можно
          задать свой коэффициент к тарифу.
        </p>
      </div>
    </div>
  );
}
