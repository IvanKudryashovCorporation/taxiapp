from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

COMPANY_NAME = 'ПРОФСОЮЗ "РАССВЕТ"'

app = FastAPI(title=f"{COMPANY_NAME} Backend")


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


@app.get("/", response_class=HTMLResponse)
def admin_page() -> str:
    snapshot = admin_state()
    events = list(reversed(snapshot["events"][-20:]))

    if events:
        events_html = "".join(
            (
                "<li>"
                f"<span class='event-badge'>{e['app_type']}</span>"
                f"<span class='event-name'>{e['app_name']}</span>"
                f"<span class='event-time'>{e['time_utc']}</span>"
                "</li>"
            )
            for e in events
        )
    else:
        events_html = "<li><span class='event-time'>Событий пока нет</span></li>"

    return f"""
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="5" />
  <title>{COMPANY_NAME} | Админ-панель</title>
  <style>
    :root {{
      --taxi-yellow: #f2c838;
      --taxi-navy: #061738;
      --taxi-gray-bg: #eef2f8;
      --taxi-gray-card: #f9fbff;
      --taxi-gray-text: #6a7f9f;
      --taxi-border: #d6deea;
    }}
    * {{
      box-sizing: border-box;
    }}
    body {{
      margin: 0;
      min-height: 100vh;
      background: linear-gradient(145deg, #e8edf6 0%, #f7f9fc 100%);
      color: var(--taxi-navy);
      font-family: "Segoe UI", Arial, sans-serif;
      padding: 24px 18px;
    }}
    .layout {{
      max-width: 1100px;
      margin: 0 auto;
    }}
    .hero {{
      background: var(--taxi-gray-bg);
      border: 1px solid var(--taxi-border);
      border-radius: 18px;
      padding: 30px 28px;
      margin-bottom: 14px;
      box-shadow: 0 12px 30px rgba(10, 27, 56, 0.08);
      text-align: center;
    }}
    .hero-top {{
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #435a7e;
      font-size: 14px;
      font-weight: 800;
      margin-bottom: 12px;
    }}
    .brand-name {{
      margin: 0;
      font-size: clamp(38px, 5vw, 64px);
      line-height: 0.95;
      font-weight: 900;
      color: var(--taxi-navy);
    }}
    .subtitle {{
      margin: 18px 0 14px 0;
      color: var(--taxi-gray-text);
      font-size: 24px;
    }}
    .stripe {{
      margin: 0 auto;
      width: 190px;
      height: 14px;
      border-radius: 999px;
      background: repeating-linear-gradient(
        90deg,
        #2f374a 0 16px,
        #f2c838 16px 32px
      );
      border: 1px solid rgba(20, 31, 50, 0.12);
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
      margin-top: 14px;
    }}
    .card {{
      background: var(--taxi-gray-card);
      border: 1px solid var(--taxi-border);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 20px rgba(10, 27, 56, 0.08);
    }}
    .label {{
      color: #3f5479;
      font-size: 14px;
      margin-bottom: 8px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }}
    .count {{
      color: var(--taxi-navy);
      font-size: 42px;
      font-weight: 900;
      line-height: 1;
      margin: 0;
    }}
    .hint {{
      color: var(--taxi-gray-text);
      margin-top: 8px;
      font-size: 13px;
    }}
    .events-title {{
      margin: 0 0 12px 0;
      color: #304568;
      font-size: 20px;
    }}
    ul {{
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 8px;
    }}
    li {{
      background: #ffffff;
      border: 1px solid var(--taxi-border);
      border-radius: 12px;
      padding: 10px 12px;
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
      font-size: 14px;
    }}
    .event-badge {{
      background: var(--taxi-yellow);
      color: #1f2a3f;
      border-radius: 8px;
      font-weight: 700;
      padding: 3px 9px;
      text-transform: uppercase;
      font-size: 12px;
    }}
    .event-name {{
      color: #263a5d;
      font-weight: 600;
    }}
    .event-time {{
      color: var(--taxi-gray-text);
      font-size: 12px;
      margin-left: auto;
    }}
    .api {{
      color: var(--taxi-gray-text);
      font-size: 13px;
      margin-top: 10px;
      text-align: center;
    }}
    code {{
      background: #f0f4fb;
      color: #334d72;
      border: 1px solid #d7dfeb;
      border-radius: 6px;
      padding: 2px 6px;
    }}
  </style>
</head>
<body>
  <div class="layout">
    <div class="hero">
      <div class="hero-top">СЕРВИС ДЛЯ АДМИНИСТРАЦИИ И ОПЕРАТОРОВ</div>
      <h1 class="brand-name">ПРОФСОЮЗ<br />\"РАССВЕТ\"</h1>
      <p class="subtitle">Единый вход в рабочую панель управления такси</p>
      <div class="stripe"></div>
      <p class="api">API: <code>/api/health</code> и <code>/api/admin/state</code></p>
    </div>

    <div class="grid">
      <section class="card">
        <div class="label">Пинги водителей</div>
        <p class="count">{snapshot['driver_pings']}</p>
        <div class="hint">Счётчик растёт после нажатия «Продолжить» в приложении водителя</div>
      </section>
      <section class="card">
        <div class="label">Пинги пассажиров</div>
        <p class="count">{snapshot['passenger_pings']}</p>
        <div class="hint">Счётчик растёт после нажатия «Продолжить» в приложении пассажира</div>
      </section>
      <section class="card">
        <h3 class="events-title">Последние события (обновление: 5 сек)</h3>
        <ul>
          {events_html}
        </ul>
      </section>
    </div>
  </div>
</body>
</html>
"""
