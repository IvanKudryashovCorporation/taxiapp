from __future__ import annotations

import sqlite3
import time
from pathlib import Path
from threading import Lock
from typing import Any

from shared.backend_client import BackendClient

_LOCAL_DB = Path(__file__).resolve().parents[1] / "data" / "chat_local.sqlite3"
_local_lock = Lock()
_client: BackendClient | None = None


def configure(client: BackendClient) -> None:
    global _client
    _client = client


def _local_connect() -> sqlite3.Connection:
    _LOCAL_DB.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_LOCAL_DB))
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS outbox (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel TEXT NOT NULL,
            order_public_id TEXT NULL,
            text TEXT NOT NULL,
            created REAL NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_outbox_channel_order_id
        ON outbox(channel, order_public_id, id)
        """
    )
    conn.commit()
    return conn


def _enqueue(channel: str, text: str, order_public_id: str | None = None) -> int:
    with _local_lock, _local_connect() as conn:
        cur = conn.execute(
            "INSERT INTO outbox(channel, order_public_id, text, created) VALUES (?, ?, ?, ?)",
            (channel, order_public_id, text, time.time()),
        )
        return int(cur.lastrowid or 0)


def _remove(outbox_id: int) -> None:
    with _local_lock, _local_connect() as conn:
        conn.execute("DELETE FROM outbox WHERE id = ?", (outbox_id,))


def _require_client() -> BackendClient:
    if _client is None:
        raise RuntimeError("Chat client is not configured.")
    return _client


def _send_now(channel: str, text: str, order_public_id: str | None) -> dict[str, Any]:
    client = _require_client()
    if channel == "operator":
        return client.post("/api/driver/chat/operator", json_data={"text": text})["message"]
    if channel == "ride" and order_public_id:
        return client.post(
            f"/api/driver/orders/{order_public_id}/chat",
            json_data={"text": text},
        )["message"]
    raise RuntimeError("Unknown chat channel.")


def send_message(channel: str, text: str, order_public_id: str | None = None) -> dict[str, Any]:
    local_id = _enqueue(channel, text, order_public_id)
    try:
        message = _send_now(channel, text, order_public_id)
        _remove(local_id)
        return message
    except Exception:
        return {
            "id": 0,
            "sender_type": "driver",
            "text": text,
            "created_at": "",
            "local": True,
        }


def flush_outbox(channel: str, order_public_id: str | None = None) -> int:
    with _local_lock, _local_connect() as conn:
        rows = conn.execute(
            """
            SELECT id, channel, order_public_id, text
            FROM outbox
            WHERE channel = ?
              AND COALESCE(order_public_id, '') = COALESCE(?, '')
            ORDER BY id
            """,
            (channel, order_public_id),
        ).fetchall()

    sent = 0
    for row in rows:
        try:
            _send_now(str(row["channel"]), str(row["text"]), row["order_public_id"])
            _remove(int(row["id"]))
            sent += 1
        except Exception:
            break
    return sent


def fetch_messages(channel: str, since: int = 0, order_public_id: str | None = None) -> list[dict[str, Any]]:
    client = _require_client()
    if channel == "operator":
        return client.get("/api/driver/chat/operator", params={"since": since}).get("messages", [])
    if channel == "ride" and order_public_id:
        return client.get(
            f"/api/driver/orders/{order_public_id}/chat",
            params={"since": since},
        ).get("messages", [])
    return []
