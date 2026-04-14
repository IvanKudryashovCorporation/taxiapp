from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

from backend.database import execute, query
from backend.schemas.auth import PingRequest

router = APIRouter(tags=["health"])


def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _event_counts() -> dict[str, int]:
    rows = query(
        """
        SELECT
            COUNT(*) FILTER (WHERE app_type = 'driver') AS driver_pings,
            COUNT(*) FILTER (WHERE app_type = 'passenger') AS passenger_pings
        FROM app_events
        """
    )
    row = rows[0] if rows else {"driver_pings": 0, "passenger_pings": 0}
    return {
        "driver_pings": int(row["driver_pings"]),
        "passenger_pings": int(row["passenger_pings"]),
    }


@router.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/api/apps/ping")
def app_ping(payload: PingRequest) -> dict[str, Any]:
    now = _now_utc()
    execute(
        "INSERT INTO app_events(time_utc, app_type, app_name) VALUES (%s, %s, %s) RETURNING id",
        (now, payload.app_type, payload.app_name),
    )
    counts = _event_counts()
    return {
        "message": "Ping accepted",
        "counts": counts,
        "last_event": {
            "time_utc": now,
            "app_type": payload.app_type,
            "app_name": payload.app_name,
        },
    }


@router.get("/api/admin/state")
def admin_state() -> dict[str, Any]:
    counts = _event_counts()
    events = list(
        reversed(
            query(
                """
                SELECT time_utc, app_type, app_name
                FROM app_events
                ORDER BY id DESC
                LIMIT 200
                """
            )
        )
    )
    return {
        "driver_pings": counts["driver_pings"],
        "passenger_pings": counts["passenger_pings"],
        "events": events,
    }
