// KPI-карточка: большое моноширинное число + дельта.
// Спека §6.3.1: fontMono 48/700 ink, дельта 12/500 ok/bad.
import * as React from "react";
import { cn, formatDelta } from "@/lib/utils.js";

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  delta?: number;
  deltaSuffix?: string;
  accent?: boolean;          // для "Выручка сегодня" — sun-цвет
  rating?: boolean;          // для "Средний рейтинг" — со звездой перед числом
  className?: string;
}

export function KpiCard({ label, value, delta, deltaSuffix = "за час", accent, rating, className }: KpiCardProps) {
  const deltaColor = delta == null ? "text-stone" : delta > 0 ? "text-ok" : delta < 0 ? "text-bad" : "text-stone";
  return (
    <div className={cn(
      "bg-paper2 rounded-r3 border border-sand p-5 shadow-s1",
      className,
    )}>
      <div className="text-cap text-graphite font-medium tracking-wider uppercase">
        {label}
      </div>
      <div className={cn(
        "tabular-nums mt-3 font-bold leading-none",
        accent ? "text-sun" : "text-ink",
      )} style={{ fontSize: 44 }}>
        {rating && <span className="text-sun mr-2">★</span>}
        {value}
      </div>
      {delta != null && (
        <div className={cn("mt-3 text-cap2 font-medium", deltaColor)}>
          <span className="tabular-nums">{formatDelta(delta)}</span>{" "}
          <span className="text-graphite">{deltaSuffix}</span>
        </div>
      )}
    </div>
  );
}

export default KpiCard;
