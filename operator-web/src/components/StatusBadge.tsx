// Statusный бейдж — ok/warn/bad/stone.
import * as React from "react";
import { cn, statusColor, humanStatus } from "@/lib/utils.js";

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STYLES: Record<string, string> = {
  ok:    "bg-[color:var(--c-ok)]/10    text-ok    border-[color:var(--c-ok)]/30",
  warn:  "bg-[color:var(--c-warn)]/10  text-warn  border-[color:var(--c-warn)]/30",
  bad:   "bg-[color:var(--c-bad)]/10   text-bad   border-[color:var(--c-bad)]/30",
  stone: "bg-paper text-graphite border-sand",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const sem = statusColor(status);
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-r1 border text-cap font-medium tracking-wide",
      STYLES[sem] || STYLES.stone,
      className,
    )}>
      {humanStatus(status)}
    </span>
  );
}

export default StatusBadge;
