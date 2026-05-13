// Sidebar — эталон operator.jsx → OpShell
// 240px, фон white, border-right sand, logo сверху с border-bottom,
// nav item active = ink fill + paper text + sun icon. Badges моноширинно.
"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { cn } from "@/lib/utils.js";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: string;
}

// Иконки и порядок 1:1 как в operator.jsx OpShell.items
const NAV: NavItem[] = [
  { href: "/dashboard",   label: "Дашборд",        icon: "grid"  },
  { href: "/map",         label: "Карта",          icon: "loc"   },
  { href: "/orders",      label: "Заказы",         icon: "list",  badge: "47"  },
  { href: "/drivers",     label: "Водители",       icon: "car",   badge: "128" },
  { href: "/passengers",  label: "Пассажиры",      icon: "user"  },
  { href: "/tariffs",     label: "Тарифы и зоны",  icon: "zone"  },
  { href: "/support",     label: "Поддержка",      icon: "chat",  badge: "3"   },
  { href: "/analytics",   label: "Аналитика",      icon: "trend" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] flex-none bg-white hairline-r flex flex-col h-screen sticky top-0">
      {/* Logo row + bottom hairline */}
      <div className="px-5 py-5 flex items-center gap-2.5 hairline-b">
        <div className="w-7 h-7 rounded-r1 bg-sun flex-none" />
        <div className="flex flex-col leading-tight">
          <span style={{ fontSize: 14, fontWeight: 600 }} className="text-ink">
            Рассвет
          </span>
          <span
            className="text-graphite tabular-nums"
            style={{ fontSize: 10, letterSpacing: "0.04em" }}
          >
            OPERATOR · СЕВ-01
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-2 flex-1 overflow-y-auto">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "my-0.5 px-3 rounded-r2 flex items-center gap-3 transition-colors",
                active ? "bg-ink text-paper" : "text-ink3 hover:bg-paper",
              )}
              style={{ paddingTop: 10, paddingBottom: 10 }}
            >
              <Icon
                name={item.icon}
                size={17}
                className={active ? "text-sun" : "text-graphite"}
              />
              <span
                className="flex-1"
                style={{ fontSize: 13, fontWeight: active ? 500 : 400 }}
              >
                {item.label}
              </span>
              {item.badge && (
                <span
                  className={cn(
                    "tabular-nums rounded-r1",
                    active
                      ? "bg-white/10 text-paper"
                      : "bg-paper text-graphite",
                  )}
                  style={{ fontSize: 10, padding: "2px 6px" }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile bar — эталон: avatar 32×32 ink + sun text "ЕЛ", "Елена Лиман" */}
      <div className="p-3 border-t border-sand flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full bg-ink flex items-center justify-center"
          style={{ color: "var(--c-sun)", fontSize: 11, fontWeight: 600 }}
        >
          ЕЛ
        </div>
        <div className="flex-1 leading-tight min-w-0">
          <div
            className="text-ink truncate"
            style={{ fontSize: 12, fontWeight: 500 }}
          >
            Елена Лиман
          </div>
          <div className="text-graphite truncate" style={{ fontSize: 10 }}>
            Старший оператор
          </div>
        </div>
        <button className="text-graphite hover:text-ink" aria-label="Настройки">
          <Icon name="settings" size={16} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
