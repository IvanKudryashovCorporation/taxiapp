from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

COMPANY_NAME = 'ПРОФСОЮЗ "РАССВЕТ"'

app = FastAPI(title=f"{COMPANY_NAME} Backend")


# ---------------------------------------------------------------------------
# Ping state
# ---------------------------------------------------------------------------


class PingRequest(BaseModel):
    app_type: str = Field(pattern="^(driver|passenger)$")
    app_name: str = "desktop-client"


_state_lock = Lock()
_state: dict[str, Any] = {
    "driver_pings": 0,
    "passenger_pings": 0,
    "events": [],
}


def _add_event(app_type: str, app_name: str) -> None:
    event = {
        "time_utc": datetime.now(timezone.utc).isoformat(),
        "app_type": app_type,
        "app_name": app_name,
    }
    _state["events"].append(event)
    _state["events"] = _state["events"][-200:]


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/apps/ping")
def app_ping(payload: PingRequest) -> dict[str, Any]:
    with _state_lock:
        counter_key = f"{payload.app_type}_pings"
        _state[counter_key] += 1
        _add_event(payload.app_type, payload.app_name)
        return {
            "message": "Ping accepted",
            "counts": {
                "driver_pings": _state["driver_pings"],
                "passenger_pings": _state["passenger_pings"],
            },
            "last_event": _state["events"][-1],
        }


@app.get("/api/admin/state")
def admin_state() -> dict[str, Any]:
    with _state_lock:
        return {
            "driver_pings": _state["driver_pings"],
            "passenger_pings": _state["passenger_pings"],
            "events": list(_state["events"]),
        }


# ---------------------------------------------------------------------------
# Chat state
# ---------------------------------------------------------------------------


class ChatSendRequest(BaseModel):
    driver_id: str = Field(min_length=1, max_length=64)
    sender: str = Field(pattern="^(driver|admin)$")
    text: str = Field(min_length=1, max_length=1000)


class ChatRegisterDriverRequest(BaseModel):
    driver_id: str = Field(min_length=1, max_length=64)
    source: str = "driver_app"


_chat_lock = Lock()
_chat: dict[str, Any] = {
    "messages": [],
    "counter": 0,
    "drivers": set(),
}


def _normalize_driver_id(raw_driver_id: str) -> str:
    driver_id = raw_driver_id.strip().upper()
    if not driver_id:
        raise HTTPException(status_code=400, detail="driver_id is required")
    return driver_id


@app.post("/api/chat/register-driver")
def chat_register_driver(req: ChatRegisterDriverRequest) -> dict[str, Any]:
    driver_id = _normalize_driver_id(req.driver_id)
    with _chat_lock:
        _chat["drivers"].add(driver_id)
    return {
        "ok": True,
        "driver_id": driver_id,
        "source": req.source,
    }


@app.post("/api/chat/send")
def chat_send(req: ChatSendRequest) -> dict[str, Any]:
    driver_id = _normalize_driver_id(req.driver_id)
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text must not be empty")

    with _chat_lock:
        _chat["drivers"].add(driver_id)
        _chat["counter"] += 1

        msg: dict[str, Any] = {
            "id": _chat["counter"],
            "driver_id": driver_id,
            "sender": req.sender,
            "text": text,
            "time_utc": datetime.now(timezone.utc).isoformat(),
        }

        _chat["messages"].append(msg)
        _chat["messages"] = _chat["messages"][-500:]

    return {"ok": True, "message": msg}


@app.get("/api/chat/messages/{driver_id}")
def chat_messages(driver_id: str, since: int = 0) -> dict[str, Any]:
    normalized_driver = _normalize_driver_id(driver_id)
    since_id = max(0, int(since))

    with _chat_lock:
        messages = [
            msg
            for msg in _chat["messages"]
            if msg["driver_id"] == normalized_driver and msg["id"] > since_id
        ]

    return {"messages": messages}


@app.get("/api/chat/drivers")
def chat_drivers() -> dict[str, Any]:
    with _chat_lock:
        registered = set(_chat["drivers"])
        from_messages = {msg["driver_id"] for msg in _chat["messages"]}
        drivers = sorted(registered | from_messages)
    return {"drivers": drivers}


# ---------------------------------------------------------------------------
# Admin dashboard
# ---------------------------------------------------------------------------


_ADMIN_HTML = """<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>ПРОФСОЮЗ \"РАССВЕТ\" | Админ-панель</title>
  <style>
    :root {
      --yellow: #f2c838;
      --navy: #061738;
      --bg: #eef2f8;
      --card: #f9fbff;
      --muted: #6a7f9f;
      --border: #d6deea;
      --danger: #dc2626;
      --ok: #22c55e;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background: linear-gradient(145deg, #e8edf6, #f7f9fc);
      color: var(--navy);
      font-family: "Segoe UI", Arial, sans-serif;
      padding: 24px 18px;
    }

    .layout {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .hero {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 30px 28px;
      text-align: center;
      box-shadow: 0 12px 30px rgba(10, 27, 56, 0.08);
    }

    .hero-top {
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #435a7e;
      font-size: 14px;
      font-weight: 800;
      margin-bottom: 12px;
    }

    .brand {
      margin: 0;
      font-size: clamp(38px, 5vw, 64px);
      font-weight: 900;
      line-height: 0.95;
    }

    .subtitle {
      margin: 18px 0 14px;
      color: var(--muted);
      font-size: 24px;
    }

    .stripe {
      margin: 0 auto;
      width: 190px;
      height: 14px;
      border-radius: 999px;
      background: repeating-linear-gradient(90deg, #2f374a 0 16px, #f2c838 16px 32px);
      border: 1px solid rgba(20, 31, 50, 0.12);
    }

    .api {
      color: var(--muted);
      font-size: 13px;
      margin-top: 10px;
    }

    code {
      background: #f0f4fb;
      color: #334d72;
      border: 1px solid #d7dfeb;
      border-radius: 6px;
      padding: 2px 6px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 20px rgba(10, 27, 56, 0.08);
    }

    .label {
      color: #3f5479;
      font-size: 14px;
      margin-bottom: 8px;
      font-weight: 700;
    }

    .count {
      color: var(--navy);
      font-size: 42px;
      font-weight: 900;
      line-height: 1;
      margin: 0;
    }

    .hint {
      color: var(--muted);
      margin-top: 8px;
      font-size: 13px;
    }

    .events-title {
      margin: 0 0 12px;
      color: #304568;
      font-size: 20px;
    }

    ul.events {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 8px;
    }

    ul.events li {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 12px;
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
      font-size: 14px;
    }

    .badge {
      background: var(--yellow);
      color: #1f2a3f;
      border-radius: 8px;
      font-weight: 700;
      padding: 3px 9px;
      text-transform: uppercase;
      font-size: 12px;
    }

    .ev-name { color: #263a5d; font-weight: 600; }
    .ev-time { color: var(--muted); font-size: 12px; margin-left: auto; }

    .chat-setup {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chat-toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .chat-toolbar select,
    .chat-toolbar input {
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 14px;
      background: #fff;
      color: var(--navy);
      outline: none;
    }

    .chat-toolbar select { min-width: 170px; }
    .chat-toolbar input { flex: 1; min-width: 200px; }

    button {
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      transition: transform .06s ease, opacity .06s ease;
    }

    button:active { transform: translateY(1px); }

    .btn-main {
      padding: 9px 16px;
      background: var(--navy);
      color: #fff;
    }

    .btn-main:hover { background: #0d2552; }

    .btn-soft {
      padding: 9px 14px;
      background: #dfe7f4;
      color: #20375f;
    }

    .btn-soft:hover { background: #d4deee; }

    .drivers-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 38px;
      padding-top: 2px;
    }

    .drivers-empty {
      color: var(--muted);
      font-size: 13px;
      padding: 8px 0;
    }

    .driver-chip {
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: #fff;
      color: #20375f;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }

    .driver-chip.active {
      background: #0c234d;
      border-color: #0c234d;
      color: #fff;
    }

    .status-row {
      font-size: 13px;
      color: var(--muted);
      min-height: 20px;
    }

    #status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ok);
      margin-right: 6px;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(8, 17, 34, 0.55);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 18px;
      z-index: 120;
    }

    .overlay.active { display: flex; }

    .overlay-card {
      width: min(760px, 100%);
      max-height: min(88vh, 920px);
      background: #f8fbff;
      border: 1px solid var(--border);
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 22px 48px rgba(9, 22, 46, 0.28);
      overflow: hidden;
    }

    .overlay-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 14px 16px;
      background: #fff;
      border-bottom: 1px solid var(--border);
    }

    .overlay-title {
      font-size: 18px;
      font-weight: 800;
      color: #1f3358;
    }

    .overlay-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px;
      min-height: 420px;
      height: 70vh;
    }

    .chat-log {
      flex: 1;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: #ffffff;
      padding: 10px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .chat-empty {
      color: var(--muted);
      font-size: 14px;
      text-align: center;
      margin: auto 0;
      padding: 24px 0;
    }

    .bubble {
      display: flex;
      flex-direction: column;
      max-width: 76%;
      gap: 2px;
    }

    .bubble.driver {
      align-self: flex-start;
      align-items: flex-start;
    }

    .bubble.admin {
      align-self: flex-end;
      align-items: flex-end;
    }

    .bubble-who {
      font-size: 11px;
      color: var(--muted);
      margin: 0 6px;
    }

    .bubble-text {
      padding: 10px 12px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.35;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .bubble.driver .bubble-text {
      background: #ffffff;
      color: #1b2f54;
      border: 1px solid var(--border);
      border-bottom-left-radius: 5px;
    }

    .bubble.admin .bubble-text {
      background: #0c234d;
      color: #ffffff;
      border-bottom-right-radius: 5px;
    }

    .bubble-time {
      font-size: 11px;
      color: var(--muted);
      margin: 0 6px;
    }

    .composer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: #fff;
    }

    .emoji-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #e8eef8;
      color: #183259;
      font-size: 18px;
      font-weight: 400;
      padding: 0;
      line-height: 1;
    }

    .chat-input {
      flex: 1;
      padding: 9px 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 14px;
      color: #0f274d;
      outline: none;
      background: #fff;
    }

    .send-btn {
      padding: 9px 14px;
      background: #0c234d;
      color: #fff;
    }

    .send-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .overlay-status {
      min-height: 18px;
      color: #51688f;
      font-size: 12px;
      padding-left: 4px;
    }

    .overlay-status.error { color: var(--danger); }

    @media (max-width: 660px) {
      body { padding: 12px; }
      .overlay-body { min-height: 380px; height: 76vh; }
      .chat-toolbar input { min-width: 120px; }
    }
  </style>
</head>
<body>
<div class="layout">

  <div class="hero">
    <div class="hero-top">Сервис для администрации и операторов</div>
    <h1 class="brand">ПРОФСОЮЗ<br>\"РАССВЕТ\"</h1>
    <p class="subtitle">Единый вход в рабочую панель управления такси</p>
    <div class="stripe"></div>
    <p class="api">
      <span id="status-dot"></span>
      API: <code>/api/health</code> <code>/api/admin/state</code>
      <code>/api/chat/register-driver</code> <code>/api/chat/send</code>
    </p>
  </div>

  <div class="grid">
    <section class="card">
      <div class="label">Пинги водителей</div>
      <p class="count" id="driver-pings">—</p>
      <div class="hint">Обновляется автоматически</div>
    </section>

    <section class="card">
      <div class="label">Пинги пассажиров</div>
      <p class="count" id="passenger-pings">—</p>
      <div class="hint">Обновляется автоматически</div>
    </section>

    <section class="card">
      <h3 class="events-title">Последние события</h3>
      <ul class="events" id="events-list">
        <li><span class="ev-time">Загрузка…</span></li>
      </ul>
    </section>
  </div>

  <section class="card">
    <h3 class="events-title">Чаты с водителями</h3>
    <div class="chat-setup">
      <div class="chat-toolbar">
        <select id="driver-select" onchange="onDriverSelectChanged()">
          <option value="">— выберите водителя —</option>
        </select>
        <input id="driver-manual" type="text" placeholder="или введите ID (например DR-1024)"
               onkeydown="if(event.key==='Enter'){addManualDriver()}"/>
        <button class="btn-soft" onclick="addManualDriver()">Добавить</button>
        <button class="btn-main" onclick="openChatOverlay()">Открыть чат</button>
      </div>

      <div class="drivers-list" id="drivers-list"></div>
      <div class="status-row" id="chat-status-row">Выберите водителя или добавьте ID вручную.</div>
    </div>
  </section>

</div>

<div class="overlay" id="chat-overlay" onclick="if(event.target===this)closeChatOverlay()">
  <section class="overlay-card" role="dialog" aria-modal="true" aria-label="Чат с водителем">
    <header class="overlay-head">
      <div class="overlay-title" id="overlay-title">Чат с водителем</div>
      <button class="btn-soft" onclick="closeChatOverlay()">Закрыть</button>
    </header>

    <div class="overlay-body">
      <div class="chat-log" id="chat-log">
        <div class="chat-empty">Выберите водителя, чтобы начать чат.</div>
      </div>

      <div class="composer">
        <button class="emoji-btn" onclick="insertEmoji('👍')" title="Вставить 👍">👍</button>
        <button class="emoji-btn" onclick="insertEmoji('🚕')" title="Вставить 🚕">🚕</button>
        <input id="chat-input" class="chat-input" type="text" placeholder="Сообщение водителю"
               onkeydown="if(event.key==='Enter'){sendAdmin()}"/>
        <button id="send-btn" class="send-btn" onclick="sendAdmin()">Отправить</button>
      </div>

      <div class="overlay-status" id="overlay-status"></div>
    </div>
  </section>
</div>

<script>
  let currentDriver = "";
  let knownDrivers = [];
  let chatSince = 0;
  let chatLog = [];
  let overlayOpen = false;

  function normalizeDriverId(raw) {
    return (raw || "").trim().toUpperCase();
  }

  function setStatusRow(text) {
    const row = document.getElementById("chat-status-row");
    row.textContent = text;
  }

  function setOverlayStatus(text, isError = false) {
    const el = document.getElementById("overlay-status");
    el.textContent = text || "";
    el.classList.toggle("error", Boolean(isError));
  }

  async function refreshStats() {
    try {
      const response = await fetch("/api/admin/state");
      const data = await response.json();

      document.getElementById("driver-pings").textContent = data.driver_pings;
      document.getElementById("passenger-pings").textContent = data.passenger_pings;

      const events = [...data.events].reverse().slice(0, 20);
      const ul = document.getElementById("events-list");
      if (events.length === 0) {
        ul.innerHTML = "<li><span class='ev-time'>Событий пока нет</span></li>";
        return;
      }

      ul.innerHTML = events.map((event) => `
        <li>
          <span class='badge'>${escapeHtml(event.app_type)}</span>
          <span class='ev-name'>${escapeHtml(event.app_name)}</span>
          <span class='ev-time'>${formatTime(event.time_utc)}</span>
        </li>
      `).join("");

      document.getElementById("status-dot").style.background = "#22c55e";
    } catch {
      document.getElementById("status-dot").style.background = "#dc2626";
    }
  }

  async function refreshDrivers() {
    try {
      const response = await fetch("/api/chat/drivers");
      const data = await response.json();
      const fromServer = Array.isArray(data.drivers) ? data.drivers : [];

      knownDrivers = [...new Set(fromServer.map(normalizeDriverId).filter(Boolean))].sort();
      renderDriversUI();

      if (!currentDriver && knownDrivers.length > 0) {
        selectDriver(knownDrivers[0], false);
      } else if (currentDriver && !knownDrivers.includes(currentDriver)) {
        knownDrivers.push(currentDriver);
        knownDrivers.sort();
        renderDriversUI();
      }
    } catch {
      setStatusRow("Не удалось обновить список водителей.");
    }
  }

  function renderDriversUI() {
    const select = document.getElementById("driver-select");
    const prev = currentDriver;

    select.innerHTML = "<option value=''>— выберите водителя —</option>";
    knownDrivers.forEach((driverId) => {
      const option = document.createElement("option");
      option.value = driverId;
      option.textContent = driverId;
      if (driverId === prev) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    const list = document.getElementById("drivers-list");
    list.innerHTML = "";

    if (knownDrivers.length === 0) {
      const empty = document.createElement("div");
      empty.className = "drivers-empty";
      empty.textContent = "Водителей пока нет. Они появятся после входа в приложение водителя.";
      list.appendChild(empty);
      return;
    }

    knownDrivers.forEach((driverId) => {
      const chip = document.createElement("button");
      chip.className = `driver-chip${driverId === currentDriver ? " active" : ""}`;
      chip.textContent = driverId;
      chip.onclick = () => selectDriver(driverId, true);
      list.appendChild(chip);
    });
  }

  function onDriverSelectChanged() {
    const selected = normalizeDriverId(document.getElementById("driver-select").value);
    if (!selected) {
      return;
    }
    selectDriver(selected, false);
  }

  async function addManualDriver() {
    const input = document.getElementById("driver-manual");
    const driverId = normalizeDriverId(input.value);
    if (!driverId) {
      setStatusRow("Введите ID водителя (например DR-1024)." );
      return;
    }

    input.value = "";

    try {
      await fetch("/api/chat/register-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: driverId, source: "admin_site" })
      });

      if (!knownDrivers.includes(driverId)) {
        knownDrivers.push(driverId);
        knownDrivers.sort();
      }

      renderDriversUI();
      selectDriver(driverId, true);
      setStatusRow(`Водитель ${driverId} добавлен.`);
    } catch {
      setStatusRow("Не удалось добавить водителя. Проверьте backend.");
    }
  }

  function selectDriver(driverId, openOverlayAfterSelect) {
    const normalized = normalizeDriverId(driverId);
    if (!normalized) {
      return;
    }

    currentDriver = normalized;

    if (!knownDrivers.includes(normalized)) {
      knownDrivers.push(normalized);
      knownDrivers.sort();
    }

    chatSince = 0;
    chatLog = [];

    renderDriversUI();
    updateOverlayTitle();
    renderChat();

    setStatusRow(`Выбран водитель: ${currentDriver}`);
    setOverlayStatus("");

    if (openOverlayAfterSelect) {
      openChatOverlay();
    }

    fetchChat(true);
  }

  function updateOverlayTitle() {
    const title = document.getElementById("overlay-title");
    title.textContent = currentDriver ? `Чат с водителем ${currentDriver}` : "Чат с водителем";
  }

  function openChatOverlay() {
    if (!currentDriver) {
      setStatusRow("Сначала выберите водителя.");
      return;
    }

    overlayOpen = true;
    updateOverlayTitle();
    document.getElementById("chat-overlay").classList.add("active");
    renderChat();
    fetchChat(true);
    setTimeout(() => document.getElementById("chat-input").focus(), 50);
  }

  function closeChatOverlay() {
    overlayOpen = false;
    document.getElementById("chat-overlay").classList.remove("active");
    setOverlayStatus("");
  }

  async function fetchChat(forceRender = false) {
    if (!currentDriver) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/messages/${encodeURIComponent(currentDriver)}?since=${chatSince}`);
      const data = await response.json();
      const messages = Array.isArray(data.messages) ? data.messages : [];

      if (messages.length > 0) {
        chatLog.push(...messages);
        chatSince = Math.max(chatSince, ...messages.map((msg) => Number(msg.id || 0)));
        renderChat();
      } else if (forceRender) {
        renderChat();
      }

      setOverlayStatus("");
    } catch {
      if (overlayOpen) {
        setOverlayStatus("Сервер недоступен. Не удалось загрузить чат.", true);
      }
    }
  }

  function renderChat() {
    const log = document.getElementById("chat-log");
    log.innerHTML = "";

    if (!currentDriver) {
      const empty = document.createElement("div");
      empty.className = "chat-empty";
      empty.textContent = "Сначала выберите водителя.";
      log.appendChild(empty);
      return;
    }

    if (chatLog.length === 0) {
      const empty = document.createElement("div");
      empty.className = "chat-empty";
      empty.textContent = "Нет сообщений. Напишите первым.";
      log.appendChild(empty);
      return;
    }

    chatLog.slice(-80).forEach((message) => {
      const sender = message.sender === "admin" ? "admin" : "driver";

      const bubble = document.createElement("div");
      bubble.className = `bubble ${sender}`;

      const who = document.createElement("span");
      who.className = "bubble-who";
      who.textContent = sender === "admin" ? "👤 оператор" : `🚕 ${message.driver_id}`;

      const text = document.createElement("div");
      text.className = "bubble-text";
      text.textContent = String(message.text || "");

      const time = document.createElement("span");
      time.className = "bubble-time";
      time.textContent = formatTime(message.time_utc);

      bubble.appendChild(who);
      bubble.appendChild(text);
      bubble.appendChild(time);
      log.appendChild(bubble);
    });

    log.scrollTop = log.scrollHeight;
  }

  function formatTime(iso) {
    if (!iso) {
      return "";
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return String(iso).slice(11, 16) + " UTC";
    }

    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  async function sendAdmin() {
    const input = document.getElementById("chat-input");
    const button = document.getElementById("send-btn");
    const text = input.value.trim();

    if (!currentDriver) {
      setOverlayStatus("Выберите водителя перед отправкой.", true);
      return;
    }

    if (!text) {
      return;
    }

    input.value = "";
    button.disabled = true;

    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: currentDriver,
          sender: "admin",
          text,
        })
      });

      setOverlayStatus("");
      await fetchChat(true);
    } catch {
      setOverlayStatus("Сообщение не отправлено. Проверьте соединение.", true);
    } finally {
      button.disabled = false;
      input.focus();
    }
  }

  function insertEmoji(emoji) {
    const input = document.getElementById("chat-input");
    input.value += emoji;
    input.focus();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlayOpen) {
      closeChatOverlay();
    }
  });

  refreshStats();
  refreshDrivers();
  renderChat();

  setInterval(refreshStats, 5000);
  setInterval(refreshDrivers, 10000);
  setInterval(() => {
    if (currentDriver) {
      fetchChat(false);
    }
  }, 2500);
</script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
def admin_page() -> str:
    return _ADMIN_HTML
