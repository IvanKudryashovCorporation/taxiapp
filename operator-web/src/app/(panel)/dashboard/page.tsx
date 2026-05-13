// Dashboard — эталон operator.jsx → OpDashboard.
// 4 metric cards (1-я accent ink), bar chart "Заказы по часам" 24 колонки,
// "Лента событий" справа (2:1), внизу "Зоны спроса" 5×1.
"use client";
import * as React from "react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils.js";

// Bars из эталона — буквальные значения
const BARS = [12,18,32,28,42,38,52,68,82,76,64,58,72,84,68,52,46,38,42,68,82,76,52,28];
const SUN_BARS = new Set([8, 18, 19]); // sun-окрашенные часы (peak hours по эталону)

const METRICS: { l: string; v: string; d: string; total: string; accent?: boolean; neg?: boolean }[] = [
  { l: "Онлайн-водители", v: "128",       d: "+6",   total: "· из 184 в смене", accent: true },
  { l: "Активные заказы", v: "47",        d: "+12",  total: "· 9 в ожидании" },
  { l: "Выручка сегодня", v: "184 720 ₽", d: "+18%", total: "· к среднему" },
  { l: "Средний чек",     v: "342 ₽",     d: "−4 ₽", total: "· к четвергу", neg: true },
];

const EVENTS: { t: string; s: string; d: string; warn?: boolean }[] = [
  { t: "SOS",                       s: "А247ВО · Малахов курган",      d: "2 мин назад", warn: true },
  { t: "Долгая подача",             s: "#0427-1182 · 8 мин",            d: "4 мин назад" },
  { t: "Низкий рейтинг рейса",      s: "«Иван Г.» — 3,0 ★",             d: "12 мин назад" },
  { t: "Новый водитель в смене",    s: "К412АА · Балаклава",            d: "18 мин назад" },
  { t: "Тариф «Бизнес» × 1.2",      s: "центр · вечерний коэф.",        d: "22 мин назад" },
];

const ZONES: { n: string; d: string; v: string; cnt: number; accent?: boolean; neg?: boolean }[] = [
  { n: "Центр",       d: "высокий",  v: "×1,4", cnt: 24, accent: true },
  { n: "Балаклава",   d: "средний",  v: "×1,1", cnt: 9 },
  { n: "Северная",    d: "обычный",  v: "×1,0", cnt: 6 },
  { n: "Камышовая",   d: "низкий",   v: "×0,9", cnt: 3, neg: true },
  { n: "Гагаринский", d: "высокий",  v: "×1,3", cnt: 14, accent: true },
];

export default function DashboardPage() {
  const [period, setPeriod] = React.useState<"День" | "Неделя" | "Месяц">("День");

  return (
    <>
      <PageHeader
        title="Дашборд"
        sub="Севастополь · 27 апр 2026, 18:42 МСК · смена дневная"
        right={
          <div
            className="flex items-center bg-paper rounded-r2"
            style={{ padding: 4, gap: 6 }}
          >
            {(["День", "Неделя", "Месяц"] as const).map((p) => {
              const active = period === p;
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded-r1 transition-colors",
                    active ? "bg-white text-ink shadow-s1" : "text-graphite hover:text-ink",
                  )}
                  style={{ padding: "6px 12px", fontSize: 12, fontWeight: 500 }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        }
      />

      {/* Body — flex 1, padding 24, gap 20 */}
      <div
        className="flex-1 overflow-auto flex flex-col"
        style={{ padding: 24, gap: 20 }}
      >
        {/* metrics row */}
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}
        >
          {METRICS.map((m) => (
            <div
              key={m.l}
              className={cn(
                "rounded-r3",
                m.accent ? "bg-ink text-paper" : "bg-white text-ink border border-sand",
              )}
              style={{ padding: 18 }}
            >
              <div
                className={cn("uppercase", m.accent ? "text-mist" : "text-graphite")}
                style={{ fontSize: 11, letterSpacing: "0.06em" }}
              >
                {m.l}
              </div>
              <div
                className="flex items-baseline"
                style={{ marginTop: 8, gap: 8 }}
              >
                <span
                  className="font-display"
                  style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}
                >
                  {m.v}
                </span>
                <span
                  className={cn(
                    "tabular-nums",
                    m.neg ? "text-bad" : m.accent ? "text-sun" : "text-ok",
                  )}
                  style={{ fontSize: 12 }}
                >
                  {m.d}
                </span>
              </div>
              <div
                className={cn(m.accent ? "text-stone" : "text-graphite")}
                style={{ fontSize: 11, marginTop: 4 }}
              >
                {m.total}
              </div>
            </div>
          ))}
        </div>

        {/* main grid 2:1 */}
        <div
          className="grid"
          style={{ gridTemplateColumns: "2fr 1fr", gap: 12 }}
        >
          {/* bar chart */}
          <div
            className="bg-white border border-sand rounded-r3"
            style={{ padding: 20 }}
          >
            <div
              className="flex justify-between items-baseline"
              style={{ marginBottom: 18 }}
            >
              <div>
                <div className="text-ink" style={{ fontSize: 14, fontWeight: 600 }}>
                  Заказы по часам
                </div>
                <div
                  className="text-graphite tabular-nums"
                  style={{ fontSize: 11, marginTop: 2 }}
                >
                  00:00 — 23:59 · 27 апр
                </div>
              </div>
              <div
                className="flex text-graphite"
                style={{ gap: 14, fontSize: 11 }}
              >
                <span className="flex items-center" style={{ gap: 6 }}>
                  <span
                    className="bg-sun rounded-r1"
                    style={{ width: 8, height: 8 }}
                  />
                  Сегодня
                </span>
                <span className="flex items-center" style={{ gap: 6 }}>
                  <span
                    className="bg-sand rounded-r1"
                    style={{ width: 8, height: 8 }}
                  />
                  Среднее
                </span>
              </div>
            </div>
            <div
              className="flex items-end relative"
              style={{ gap: 4, height: 160 }}
            >
              {BARS.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col justify-end"
                  style={{ gap: 2 }}
                >
                  <div
                    className={cn(
                      "rounded-r1",
                      SUN_BARS.has(i) ? "bg-sun" : "bg-ink",
                    )}
                    style={{ height: `${h * 0.85}%` }}
                  />
                </div>
              ))}
            </div>
            <div
              className="flex justify-between text-graphite tabular-nums"
              style={{ marginTop: 8, fontSize: 10 }}
            >
              <span>00</span>
              <span>04</span>
              <span>08</span>
              <span>12</span>
              <span>16</span>
              <span>20</span>
              <span>23</span>
            </div>
          </div>

          {/* incidents feed */}
          <div
            className="bg-white border border-sand rounded-r3 flex flex-col"
            style={{ padding: 20 }}
          >
            <div
              className="flex justify-between"
              style={{ marginBottom: 14 }}
            >
              <span className="text-ink" style={{ fontSize: 14, fontWeight: 600 }}>
                Лента событий
              </span>
              <span className="text-graphite" style={{ fontSize: 11 }}>
                в реальном времени
              </span>
            </div>
            <div className="flex flex-col" style={{ gap: 12 }}>
              {EVENTS.map((e, i) => (
                <div key={i} className="flex" style={{ gap: 12 }}>
                  <div
                    className={cn(
                      "rounded-full flex-none",
                      e.warn ? "bg-bad" : "bg-ink",
                    )}
                    style={{ width: 8, height: 8, marginTop: 6 }}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-ink"
                      style={{ fontSize: 12, fontWeight: 500 }}
                    >
                      {e.t}
                    </div>
                    <div
                      className="text-graphite truncate"
                      style={{ fontSize: 11 }}
                    >
                      {e.s}
                    </div>
                  </div>
                  <div
                    className="text-stone tabular-nums whitespace-nowrap"
                    style={{ fontSize: 10 }}
                  >
                    {e.d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* zones grid 5×1 */}
        <div
          className="bg-white border border-sand rounded-r3"
          style={{ padding: 20 }}
        >
          <div
            className="flex justify-between items-center"
            style={{ marginBottom: 14 }}
          >
            <span className="text-ink" style={{ fontSize: 14, fontWeight: 600 }}>
              Зоны спроса
            </span>
            <span className="text-graphite" style={{ fontSize: 11 }}>
              обновлено 18:40
            </span>
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}
          >
            {ZONES.map((z) => (
              <div
                key={z.n}
                className="border border-sand rounded-r2"
                style={{ padding: 14 }}
              >
                <div className="flex justify-between items-baseline">
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{z.n}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      z.accent ? "text-sun" : "text-ink",
                    )}
                    style={{ fontSize: 13, fontWeight: 600 }}
                  >
                    {z.v}
                  </span>
                </div>
                <div
                  className="text-graphite"
                  style={{ fontSize: 11, marginTop: 4 }}
                >
                  {z.d} · {z.cnt} зак.
                </div>
                <div
                  className="bg-sand overflow-hidden rounded-r1"
                  style={{ marginTop: 8, height: 3 }}
                >
                  <div
                    className={cn("h-full", z.accent ? "bg-sun" : "bg-ink")}
                    style={{ width: `${Math.min(100, z.cnt * 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
