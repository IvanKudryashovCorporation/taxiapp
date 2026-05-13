// "Заказы по часам" — простой SVG line chart (без Recharts/Chart.js).
// Спека §6.3.1: линия sun 2px, заливка sunSoft, ось stone, гридлайны sand. Высота ~280px.
"use client";
import * as React from "react";
import type { HourPoint } from "@/lib/api";

export interface OrdersChartProps {
  data: HourPoint[];
  height?: number;
}

export function OrdersChart({ data, height = 280 }: OrdersChartProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(800);

  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(e.contentRect.width);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div ref={ref} style={{ height }} className="flex items-center justify-center text-stone text-cap2">
        Нет данных
      </div>
    );
  }

  const padL = 40, padR = 16, padT = 16, padB = 28;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = Math.max(0, height - padT - padB);
  const max = Math.max(...data.map((p) => p.orders), 10);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const xy = data.map((p, i) => ({
    x: padL + i * stepX,
    y: padT + innerH - (p.orders / max) * innerH,
  }));

  const linePath = xy.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
  const areaPath = `${linePath} L ${xy[xy.length - 1].x} ${padT + innerH} L ${xy[0].x} ${padT + innerH} Z`;

  // Y-axis ticks (4 деления)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padT + innerH - t * innerH,
    label: Math.round(t * max),
  }));

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg width={w} height={height} className="block">
        {/* Grid */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={padL} x2={w - padR} y1={t.y} y2={t.y}
            stroke="var(--c-sand)" strokeWidth={1}
          />
        ))}
        {/* Y labels */}
        {ticks.map((t, i) => (
          <text
            key={i}
            x={padL - 8} y={t.y + 4}
            textAnchor="end"
            className="fill-stone"
            style={{ fontSize: 11, fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
          >
            {t.label}
          </text>
        ))}
        {/* X labels (каждые 4 часа) */}
        {data.map((p, i) =>
          i % 4 === 0 ? (
            <text
              key={i}
              x={padL + i * stepX}
              y={height - 8}
              textAnchor="middle"
              className="fill-stone"
              style={{ fontSize: 11, fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
            >
              {String(p.hour).padStart(2, "0")}:00
            </text>
          ) : null
        )}
        {/* Area fill */}
        <path d={areaPath} fill="var(--c-sun-soft)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--c-sun)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* Points */}
        {xy.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={2.5} fill="var(--c-sun)" />
        ))}
      </svg>
    </div>
  );
}

export default OrdersChart;
