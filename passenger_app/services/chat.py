from __future__ import annotations

import sqlite3
import time
from pathlib import Path
from threading import Lock
from typing import Any

from shared.backend_client import BackendClient

_LOCAL_DB = Path(__file__).resolve().parents[1] / "data" / "passenger_chat.sqlite3"
_local_lock = Lock()
_client: BackendClient | None = None


def configure(client: BackendClient) -> None:
    global _client
    _client = client


def _require_client() -> BackendClient:
    if _client is None:
        raise RuntimeError("Chat client is not configured.")
    return _client


def _local_connect() -> sqlite3.Connection:
    _LOCAL_DB.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_LOCAL_DB))
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS outbox (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_public_id TEXT NOT NULL,
            text TEXT NOT NULL,
            created REAL NOT NULL
        )
        """
    )
    conn.commit()
    return conn


def _enqueue(order_public_id: str, text: str) -> int:
    with _local_lock, _local_connect() as conn:
        cur = conn.execute(
            "INSERT INTO outbox(order_public_id, text, created) VALUES (?, ?, ?)",
            (order_public_id, text, time.time()),
        )
        return int(cur.lastrowid or 0)


def _remove(outbox_id: int) -> None:
    with _local_lock, _local_connect() as conn:
        conn.execute("DELETE FROM outbox WHERE id = ?", (outbox_id,))


def send_message(order_public_id: str, text: str) -> dict[str, Any]:
    local_id = _enqueue(order_public_id, text)
    try:
        message = _require_client().post(
            f"/api/passenger/orders/{order_public_id}/chat",
            json_data={"text": text},
        )["message"]
        _remove(local_id)
        return message
    except Exception:
        return {"id": 0, "sender_type": "passenger", "text": text, "created_at": "", "local": True}


def flush_outbox(order_public_id: str) -> int:
    with _local_lock, _local_connect() as conn:
        rows = conn.execute("SELECT id, order_public_id, text FROM outbox WHERE order_public_id = ? ORDER BY id", (order_public_id,)).fetchall()
    sent = 0
    for row in rows:
        try:
            _require_client().post(
                f"/api/passenger/orders/{row['order_public_id']}/chat",
                json_data={"text": row["text"]},
            )
            _remove(int(row["id"]))
            sent += 1
        except Exception:
            break
    return sent


def fetch_messages(order_public_id: str, since: int = 0) -> list[dict[str, Any]]:
    return _require_client().get(
        f"/api/passenger/orders/{order_public_id}/chat",
        params={"since": since},
    ).get("messages", [])
