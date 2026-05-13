// Analytics — спека §6.3.8
// Несколько графиков: выручка по дням (line), conversion (bar), средний чек по тарифам.
// Палитра sun/ink (см. principle §5.6: один акцент за экран — здесь sun).
"use client";
import * as React from "react";
import OrdersChart from "@/components/OrdersChart";
import KpiCard from "@/components/KpiCard";
import { formatMoney, formatInt, formatDelta } from "@/lib/utils.js";
import type { HourPoint } from "@/lib/api";

// Mock daily revenue (последние 14 дней)
const REVENUE_BY_DAY: { day: string; rub: number }[] = Array.from({ length: 14 }, (_, i) => ({
  day: `${(15 - i).toString().padStart(2, "0")}`,
  rub: Math.round(60000 + 25000 * Math.sin(i * 1.1) + 12000 * Math.cos(i * 0.4)),
})).reverse();

const CHECK_BY_TARIFF: { label: string; value: number }[] = [
  { label: "Эконом",   value: 245 },
  { label: "Комфорт",  value: 380 },
  { label: "Бизнес",   value: 620 },
  { label: "Минивэн",  value: 480 },
];

const CONVERSION = 0.91; // 91%

export default function AnalyticsPage() {
  const totalRevenue = REVENUE_BY_DAY.reduce((acc, d) => acc + d.rub, 0);
  const avgPerDay = Math.round(totalRevenue / REVENUE_BY_DAY.length);

  // Convert revenue chart to HourPoint shape so we reuse OrdersChart
  const chartData: HourPoint[] = REVENUE_BY_DAY.map((d, i) => ({ hour: i, orders: Math.round(d.rub / 1000) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Выручка за 14 дней"
          value={<span className="tabular-nums">{formatMoney(totalRevenue)}</span>}
          delta={8}
          deltaSuffix="% к прошлому периоду"
          accent
        />
        <KpiCard
          label="В среднем за день"
          value={<span className="tabular-nums">{formatMoney(avgPerDay)}</span>}
        />
        <KpiCard
          label="Конверсия (заказ → выполнен)"
          value={<span className="tabular-nums">{Math.round(CONVERSION * 100)}%</span>}
          delta={-1.2}
          deltaSuffix="% за неделю"
        />
      </div>

      <section className="bg-paper2 rounded-r3 border border-sand p-5 shadow-s1">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display font-semibold text-ink" style={{ fontSize: 17 }}>
            Выручка по дням, тыс. ₽
          </h2>
          <div className="text-cap2 text-graphite">
            Последние 14 дней
          </div>
        </div>
        <OrdersChart data={chartData} height={260} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-paper2 rounded-r3 border border-sand p-5 shadow-s1">
          <h2 className="font-display font-semibold text-ink mb-4" style={{ fontSize: 17 }}>
            Средний чек по тарифам
          </h2>
          <div className="space-y-4">
            {CHECK_BY_TARIFF.map((t) => {
              const max = Math.max(...CHECK_BY_TARIFF.map((x) => x.value));
              const pct = (t.value / max) * 100;
              return (
                <div key={t.label}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="text-body text-ink font-medium">{t.label}</div>
                    <div className="tabular-nums text-body text-ink">
                      {formatMoney(t.value)}
                    </div>
                  </div>
                  <div className="h-2.5 bg-paper rounded-full border border-sand overflow-hidden">
                    <div className="h-full bg-sun" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-paper2 rounded-r3 border border-sand p-5 shadow-s1">
          <h2 className="font-display font-semibold text-ink mb-4" style={{ fontSize: 17 }}>
            Воронка конверсии
          </h2>
          <FunnelStep label="Создано заказов"   value={1240} pct={1}     />
          <FunnelStep label="Найден водитель"   value={1198} pct={0.97}  />
          <FunnelStep label="Подача"            value={1182} pct={0.953} />
          <FunnelStep label="Поездка завершена" value={1132} pct={0.913} />
        </section>
      </div>
    </div>
  );
}

function FunnelStep({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between text-cap2 mb-1.5">
        <span className="text-graphite">{label}</span>
        <span className="tabular-nums text-ink font-medium">
          {formatInt(value)} <span className="text-graphite">· {Math.round(pct * 100)}%</span>
        </span>
      </div>
      <div className="h-3 bg-paper rounded-full border border-sand overflow-hidden">
        <div className="h-full bg-ink" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}
