// SupportChats — спека §6.3.7
// 3 колонки: список чатов 320px | переписка flex | детали юзера 320px.
"use client";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { cn, formatTime } from "@/lib/utils.js";
import api, { type ChatHead, type ChatMessage } from "@/lib/api";

export default function SupportPage() {
  const [chats, setChats] = React.useState<ChatHead[]>([]);
  const [activeChat, setActiveChat] = React.useState<ChatHead | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const threadRef = React.useRef<HTMLDivElement>(null);

  // Load chat list
  React.useEffect(() => {
    const load = async () => {
      try {
        const { chats: data } = await api.chatHeads();
        setChats(data);
        if (!activeChat && data.length > 0) setActiveChat(data[0]);
      } catch {}
    };
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  // Load messages for active chat
  React.useEffect(() => {
    if (!activeChat) return;
    const load = async () => {
      try {
        let data: ChatMessage[];
        if (activeChat.kind === 'driver') {
          const r = await api.driverChatMessages(activeChat.id, 0);
          data = r.messages;
        } else {
          const r = await api.passengerChatMessages(activeChat.id, 0);
          data = r.messages;
        }
        setMessages(data);
        setTimeout(() => threadRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50);
      } catch {}
    };
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [activeChat?.id]);

  const send = async () => {
    const t = draft.trim();
    if (!t || !activeChat || sending) return;
    setSending(true);
    try {
      if (activeChat.kind === 'driver') await api.sendDriverChatMessage(activeChat.id, t);
      else await api.sendPassengerChatMessage(activeChat.id, t);
      setDraft("");
      // Reload messages
      const r = activeChat.kind === 'driver'
        ? await api.driverChatMessages(activeChat.id, 0)
        : await api.passengerChatMessages(activeChat.id, 0);
      setMessages(activeChat.kind === 'driver' ? r.messages : (r as any).messages);
      setTimeout(() => threadRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50);
    } catch {}
    setSending(false);
  };

  const initials = (name: string) =>
    name.split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");

  return (
    <div className="grid gap-4 -mx-6 -my-6 px-6 py-6" style={{ height: "calc(100vh - 64px)", gridTemplateColumns: "320px 1fr 320px" }}>
      {/* Chats list */}
      <aside className="bg-paper2 rounded-r3 border border-sand overflow-hidden flex flex-col">
        <div className="p-4 hairline-b">
          <div className="flex items-center gap-2 h-10 bg-paper border border-sand rounded-r3 px-3">
            <Icon name="search" size={16} className="text-stone" />
            <input placeholder="Поиск чата…" className="flex-1 bg-transparent outline-none text-body text-ink placeholder:text-stone" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-sand">
          {chats.length === 0 && (
            <div className="p-6 text-center text-cap text-stone">Нет активных чатов</div>
          )}
          {chats.map((c) => (
            <button
              key={`${c.kind}-${c.id}`}
              onClick={() => { setActiveChat(c); setMessages([]); }}
              className={cn("w-full text-left flex items-start gap-3 p-4 transition-colors", activeChat?.id === c.id && activeChat?.kind === c.kind ? "bg-paper" : "hover:bg-paper")}
            >
              <div className="w-10 h-10 rounded-full bg-paper border border-sand flex items-center justify-center text-cap2 font-medium flex-none">
                {initials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-body text-ink font-medium truncate">{c.name}</div>
                  <div className="tabular-nums text-cap text-stone flex-none">{c.last_message_at ? formatTime(c.last_message_at) : ""}</div>
                </div>
                <div className="text-cap2 text-graphite truncate mt-0.5">
                  {c.kind === 'driver' ? '🚗 Водитель' : '👤 Пассажир'}
                  {c.is_online && <span className="ml-1 text-ok">• онлайн</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <section className="bg-paper2 rounded-r3 border border-sand overflow-hidden flex flex-col">
        {activeChat ? (
          <>
            <header className="hairline-b px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-paper border border-sand flex items-center justify-center text-cap2 font-medium">
                {initials(activeChat.name)}
              </div>
              <div className="flex-1">
                <div className="text-body2 text-ink font-medium">{activeChat.name}</div>
                <div className="text-cap text-graphite">{activeChat.kind === 'driver' ? 'Водитель' : 'Пассажир'}</div>
              </div>
            </header>
            <div ref={threadRef} className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-cap text-stone mt-8">Сообщений пока нет</div>
              )}
              {messages.map((m) => {
                const mine = m.sender_type === 'operator';
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] rounded-r3 px-4 py-2.5 shadow-s1", mine ? "bg-sun text-ink rounded-br-[4px]" : "bg-paper border border-sand text-ink rounded-bl-[4px]")}>
                      <div className="text-body leading-snug">{m.text}</div>
                      <div className="tabular-nums text-cap text-graphite mt-1 text-right">{formatTime(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <footer className="border-t border-sand p-3 flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Ваш ответ… (Enter — отправить)"
                className="flex-1 h-11 bg-paper border border-sand rounded-r5 px-4 text-body text-ink placeholder:text-stone outline-none focus:border-ink"
              />
              <button
                onClick={send}
                disabled={sending || !draft.trim()}
                className="w-9 h-9 rounded-full bg-sun text-ink flex items-center justify-center hover:bg-sunDeep disabled:opacity-50"
              >
                <Icon name="send" size={16} />
              </button>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-cap text-stone">
            Выберите чат слева
          </div>
        )}
      </section>

      {/* User details */}
      <aside className="bg-paper2 rounded-r3 border border-sand overflow-y-auto">
        {activeChat ? (
          <>
            <div className="p-5 text-center hairline-b">
              <div className="w-16 h-16 rounded-full bg-paper border border-sand flex items-center justify-center text-h3 font-medium font-display mx-auto">
                {initials(activeChat.name)}
              </div>
              <div className="mt-3 text-body2 text-ink font-medium">{activeChat.name}</div>
              <div className="text-cap text-graphite mt-0.5">{activeChat.kind === 'driver' ? 'Водитель' : 'Пассажир'}</div>
            </div>
            <div className="p-5 space-y-4">
              <Field label="ID" value={activeChat.id} mono />
              <Field label="Тип" value={activeChat.kind === 'driver' ? 'Водитель' : 'Пассажир'} />
              <Field label="Статус" value={activeChat.is_online ? 'Онлайн' : 'Офлайн'} />
            </div>
          </>
        ) : (
          <div className="p-5 text-cap text-stone text-center">Детали</div>
        )}
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
