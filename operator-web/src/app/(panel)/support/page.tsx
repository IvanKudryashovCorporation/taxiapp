// SupportChats — спека §6.3.7
// 3 колонки: список чатов 320px | переписка flex | детали юзера 320px.
"use client";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { cn, formatTime } from "@/lib/utils.js";

interface Chat {
  id: number;
  name: string;
  initials: string;
  preview: string;
  unread: number;
  ts: string;
  role: "Пассажир" | "Водитель";
}

const CHATS: Chat[] = [
  { id: 1, name: "Анна Карелина",    initials: "АК", preview: "Здравствуйте, водитель опаздывает", unread: 2, ts: new Date(Date.now() - 4 * 60_000).toISOString(),  role: "Пассажир" },
  { id: 2, name: "Игорь Петров",     initials: "ИП", preview: "Можете ли отметить заказ как выполненный?", unread: 0, ts: new Date(Date.now() - 22 * 60_000).toISOString(), role: "Водитель"  },
  { id: 3, name: "Сергей Демин",     initials: "СД", preview: "Не работает оплата картой", unread: 1, ts: new Date(Date.now() - 50 * 60_000).toISOString(), role: "Водитель" },
  { id: 4, name: "Дмитрий Лазарев",  initials: "ДЛ", preview: "Спасибо!", unread: 0, ts: new Date(Date.now() - 2 * 3600_000).toISOString(), role: "Пассажир" },
];

interface Msg { id: number; mine: boolean; text: string; ts: string; }

const MSGS: Msg[] = [
  { id: 1, mine: false, text: "Здравствуйте! Заказ ORD-1042 — водитель должен был приехать 8 минут назад.", ts: new Date(Date.now() - 8 * 60_000).toISOString() },
  { id: 2, mine: true,  text: "Здравствуйте, Анна. Сейчас уточню у водителя.",                              ts: new Date(Date.now() - 7 * 60_000).toISOString() },
  { id: 3, mine: true,  text: "Водитель в 3 минутах, был на светофоре. Извините за ожидание.",              ts: new Date(Date.now() - 5 * 60_000).toISOString() },
  { id: 4, mine: false, text: "Хорошо, спасибо.",                                                            ts: new Date(Date.now() - 4 * 60_000).toISOString() },
];

export default function SupportPage() {
  const [activeId, setActiveId] = React.useState<number>(CHATS[0].id);
  const active = CHATS.find((c) => c.id === activeId)!;
  const [draft, setDraft] = React.useState("");

  return (
    <div className="grid gap-4 -mx-6 -my-6 px-6 py-6" style={{ height: "calc(100vh - 64px)", gridTemplateColumns: "320px 1fr 320px" }}>
      {/* Chats list */}
      <aside className="bg-paper2 rounded-r3 border border-sand overflow-hidden flex flex-col">
        <div className="p-4 hairline-b">
          <div className="flex items-center gap-2 h-10 bg-paper border border-sand rounded-r3 px-3">
            <Icon name="search" size={16} className="text-stone" />
            <input
              placeholder="Поиск чата…"
              className="flex-1 bg-transparent outline-none text-body text-ink placeholder:text-stone"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-sand">
          {CHATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "w-full text-left flex items-start gap-3 p-4 transition-colors",
                activeId === c.id ? "bg-paper" : "hover:bg-paper",
              )}
            >
              <div className="w-10 h-10 rounded-full bg-paper border border-sand flex items-center justify-center text-cap2 font-medium flex-none">
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-body text-ink font-medium truncate">{c.name}</div>
                  <div className="tabular-nums text-cap text-stone flex-none">{formatTime(c.ts)}</div>
                </div>
                <div className="text-cap2 text-graphite truncate mt-0.5">{c.preview}</div>
              </div>
              {c.unread > 0 && (
                <span className="ml-2 mt-1 tabular-nums text-cap font-semibold bg-sun text-ink rounded-full w-5 h-5 flex items-center justify-center flex-none">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <section className="bg-paper2 rounded-r3 border border-sand overflow-hidden flex flex-col">
        <header className="hairline-b px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-paper border border-sand flex items-center justify-center text-cap2 font-medium">
            {active.initials}
          </div>
          <div className="flex-1">
            <div className="text-body2 text-ink font-medium">{active.name}</div>
            <div className="text-cap text-graphite">{active.role}</div>
          </div>
          <button className="w-9 h-9 rounded-r2 border border-sand text-graphite hover:text-ink flex items-center justify-center">
            <Icon name="phone" size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {MSGS.map((m) => (
            <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[70%] rounded-r3 px-4 py-2.5 shadow-s1",
                m.mine ? "bg-sun text-ink rounded-br-[4px]" : "bg-paper border border-sand text-ink rounded-bl-[4px]",
              )}>
                <div className="text-body leading-snug">{m.text}</div>
                <div className="tabular-nums text-cap text-graphite mt-1 text-right">{formatTime(m.ts)}</div>
              </div>
            </div>
          ))}
        </div>

        <footer className="hairline-b border-t-sand p-3 flex items-center gap-2 border-t">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ваш ответ…"
            className="flex-1 h-11 bg-paper border border-sand rounded-r5 px-4 text-body text-ink placeholder:text-stone outline-none focus:border-ink"
          />
          <button className="w-9 h-9 rounded-full bg-sun text-ink flex items-center justify-center hover:bg-sunDeep">
            <Icon name="send" size={16} />
          </button>
        </footer>
      </section>

      {/* User details */}
      <aside className="bg-paper2 rounded-r3 border border-sand overflow-y-auto">
        <div className="p-5 text-center hairline-b">
          <div className="w-16 h-16 rounded-full bg-paper border border-sand flex items-center justify-center text-h3 font-medium font-display mx-auto">
            {active.initials}
          </div>
          <div className="mt-3 text-body2 text-ink font-medium">{active.name}</div>
          <div className="text-cap text-graphite mt-0.5">{active.role}</div>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Телефон" value="+7 978 100-20-30" mono />
          <Field label="Поездок"  value="84" mono />
          <Field label="Средний чек" value="312 ₽" mono />
          <Field label="С нами с" value="мар 2024" />
        </div>
        <div className="px-5 pb-5">
          <button className="w-full h-10 rounded-r2 border border-sand text-graphite hover:text-ink text-cap2">
            Открыть профиль
          </button>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-cap text-graphite uppercase tracking-wider">{label}</div>
      <div className={cn("mt-0.5 text-body text-ink", mono && "tabular-nums")}>{value}</div>
    </div>
  );
}
