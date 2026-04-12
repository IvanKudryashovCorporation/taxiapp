from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

COMPANY_NAME = 'ПРОФСОЮЗ "РАССВЕТ"'
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "taxiapp.sqlite3"
ADMIN_HTML_PATH = BASE_DIR / "admin_page.html"

app = FastAPI(title=f"{COMPANY_NAME} Backend")

_db_lock = Lock()


class PingRequest(BaseModel):
    app_type: str = Field(pattern="^(driver|passenger)$")
    app_name: str = "desktop-client"


class ChatSendRequest(BaseModel):
    driver_id: str = Field(min_length=1, max_length=64)
    sender: str = Field(pattern="^(driver|admin)$")
    text: str = Field(min_length=1, max_length=1000)


class ChatRegisterDriverRequest(BaseModel):
    driver_id: str = Field(min_length=1, max_length=64)
    source: str = "driver_app"


def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def _init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with _db_lock, _connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS app_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                time_utc TEXT NOT NULL,
                app_type TEXT NOT NULL,
                app_name TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS chat_drivers (
                driver_id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                registered_utc TEXT NOT NULL,
                updated_utc TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_id TEXT NOT NULL,
                sender TEXT NOT NULL,
                text TEXT NOT NULL,
                time_utc TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_app_events_type ON app_events(app_type);
            CREATE INDEX IF NOT EXISTS idx_chat_messages_driver_id ON chat_messages(driver_id, id);
            """
        )


def _normalize_driver_id(raw_driver_id: str) -> str:
    driver_id = raw_driver_id.strip().upper()
    if not driver_id:
        raise HTTPException(status_code=400, detail="driver_id is required")
    return driver_id


def _register_driver(connection: sqlite3.Connection, driver_id: str, source: str) -> None:
    now = _now_utc()
    connection.execute(
        """
        INSERT INTO chat_drivers(driver_id, source, registered_utc, updated_utc)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(driver_id) DO UPDATE SET
            source = excluded.source,
            updated_utc = excluded.updated_utc
        """,
        (driver_id, source, now, now),
    )


def _event_counts(connection: sqlite3.Connection) -> dict[str, int]:
    driver_count = connection.execute(
        "SELECT COUNT(*) AS value FROM app_events WHERE app_type = 'driver'"
    ).fetchone()["value"]
    passenger_count = connection.execute(
        "SELECT COUNT(*) AS value FROM app_events WHERE app_type = 'passenger'"
    ).fetchone()["value"]
    return {
        "driver_pings": int(driver_count),
        "passenger_pings": int(passenger_count),
    }


def _serialize_rows(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(row) for row in rows]


_init_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/apps/ping")
def app_ping(payload: PingRequest) -> dict[str, Any]:
    now = _now_utc()

    with _db_lock, _connect() as connection:
        connection.execute(
            "INSERT INTO app_events(time_utc, app_type, app_name) VALUES (?, ?, ?)",
            (now, payload.app_type, payload.app_name),
        )
        counts = _event_counts(connection)

    return {
        "message": "Ping accepted",
        "counts": counts,
        "last_event": {
            "time_utc": now,
            "app_type": payload.app_type,
            "app_name": payload.app_name,
        },
    }


@app.get("/api/admin/state")
def admin_state() -> dict[str, Any]:
    with _db_lock, _connect() as connection:
        counts = _event_counts(connection)
        rows = connection.execute(
            """
            SELECT time_utc, app_type, app_name
            FROM app_events
            ORDER BY id DESC
            LIMIT 200
            """
        ).fetchall()

    events = list(reversed(_serialize_rows(rows)))
    return {
        "driver_pings": counts["driver_pings"],
        "passenger_pings": counts["passenger_pings"],
        "events": events,
    }


@app.post("/api/chat/register-driver")
def chat_register_driver(req: ChatRegisterDriverRequest) -> dict[str, Any]:
    driver_id = _normalize_driver_id(req.driver_id)

    with _db_lock, _connect() as connection:
        _register_driver(connection, driver_id, req.source)

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

    now = _now_utc()

    with _db_lock, _connect() as connection:
        _register_driver(connection, driver_id, "chat")
        cursor = connection.execute(
            """
            INSERT INTO chat_messages(driver_id, sender, text, time_utc)
            VALUES (?, ?, ?, ?)
            """,
            (driver_id, req.sender, text, now),
        )
        message_id = int(cursor.lastrowid)

    return {
        "ok": True,
        "message": {
            "id": message_id,
            "driver_id": driver_id,
            "sender": req.sender,
            "text": text,
            "time_utc": now,
        },
    }


@app.get("/api/chat/messages/{driver_id}")
def chat_messages(driver_id: str, since: int = 0) -> dict[str, Any]:
    normalized_driver = _normalize_driver_id(driver_id)
    since_id = max(0, int(since))

    with _db_lock, _connect() as connection:
        rows = connection.execute(
            """
            SELECT id, driver_id, sender, text, time_utc
            FROM chat_messages
            WHERE driver_id = ? AND id > ?
            ORDER BY id ASC
            """,
            (normalized_driver, since_id),
        ).fetchall()

    return {"messages": _serialize_rows(rows)}


@app.get("/api/chat/drivers")
def chat_drivers() -> dict[str, Any]:
    with _db_lock, _connect() as connection:
        rows = connection.execute(
            """
            SELECT driver_id
            FROM (
                SELECT driver_id, MAX(activity_utc) AS last_activity
                FROM (
                    SELECT driver_id, updated_utc AS activity_utc FROM chat_drivers
                    UNION ALL
                    SELECT driver_id, time_utc AS activity_utc FROM chat_messages
                )
                GROUP BY driver_id
            )
            ORDER BY last_activity DESC, driver_id ASC
            """
        ).fetchall()

    return {"drivers": [str(row["driver_id"]) for row in rows]}


@app.get("/", response_class=HTMLResponse)
def admin_page() -> str:
    return ADMIN_HTML_PATH.read_text(encoding="utf-8")
