// Topbar — спека §6.3.
// 64px, paper, hairline border. Слева название раздела, справа: поиск 280×40, нотификации, аватар.
"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const TITLES: Record<string, string> = {
  "/dashboard":  "Дашборд",
  "/map":        "Карта-диспетчерская",
  "/orders":     "Заказы",
  "/drivers":    "Водители",
  "/passengers": "Пассажиры",
  "/tariffs":    "Тарифы и зоны",
  "/support":    "Чаты поддержки",
  "/analytics":  "Аналитика",
};

export function Topbar() {
  const pathname = usePathname() || "/";
  const title = TITLES[pathname] || (Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? "Раздел");

  return (
    <header className="h-16 bg-paper hairline-b sticky top-0 z-10 flex items-center px-6">
      <h1 className="font-display font-semibold text-ink" style={{ fontSize: 22 }}>
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 w-[280px] h-10 bg-paper2 border border-sand rounded-r3 px-3">
          <Icon name="search" size={16} className="text-stone" />
          <input
            type="search"
            placeholder="Найти заказ, водителя…"
            className="flex-1 bg-transparent outline-none text-body text-ink placeholder:text-stone"
          />
        </div>

        {/* Notifications */}
        <button
          aria-label="Уведомления"
          className="relative w-10 h-10 rounded-r2 text-graphite hover:text-ink hover:bg-paper2 flex items-center justify-center"
        >
          <Icon name="bell" size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sun" />
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center text-cap2 font-medium">
          ОП
        </div>
      </div>
    </header>
  );
}

export default Topbar;
