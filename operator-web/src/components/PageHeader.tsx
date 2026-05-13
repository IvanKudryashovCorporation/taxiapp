// PageHeader — эталон operator.jsx → OpHeader.
// Каждая страница раздела рендерит свой <PageHeader title sub right>.
// Не sticky (как в эталоне — header внутри main-column).
import * as React from "react";
import { Icon } from "./Icon";

export interface PageHeaderProps {
  title: string;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  /** Опциональный override placeholder в search-поле */
  searchPlaceholder?: string;
}

export function PageHeader({
  title,
  sub,
  right,
  searchPlaceholder = "Поиск по заказам, водителям, телефонам…",
}: PageHeaderProps) {
  return (
    <header
      className="hairline-b bg-white flex items-center"
      style={{ padding: "20px 28px", gap: 20 }}
    >
      <div className="flex-1 min-w-0">
        <h1
          className="font-display text-ink"
          style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          {title}
        </h1>
        {sub && (
          <div
            className="text-graphite tabular-nums"
            style={{ fontSize: 12, marginTop: 4 }}
          >
            {sub}
          </div>
        )}
      </div>

      {right}

      {/* Search */}
      <div
        className="bg-paper rounded-r2 flex items-center gap-2.5 text-graphite"
        style={{ height: 36, padding: "0 14px", fontSize: 13, minWidth: 280 }}
      >
        <Icon name="search" size={16} className="text-graphite" />
        <span className="flex-1">{searchPlaceholder}</span>
        <span
          className="bg-white text-stone tabular-nums rounded-r1"
          style={{ fontSize: 11, padding: "2px 6px" }}
        >
          ⌘K
        </span>
      </div>

      {/* Bell — sun-точка в paper-рамке (эталонная, не accent) */}
      <button
        aria-label="Уведомления"
        className="bg-paper rounded-r2 flex items-center justify-center relative"
        style={{ width: 36, height: 36 }}
      >
        <Icon name="bell" size={17} className="text-ink" />
        <span
          className="absolute rounded-full bg-sun"
          style={{
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            border: "2px solid var(--c-paper)",
          }}
        />
      </button>
    </header>
  );
}

export default PageHeader;
