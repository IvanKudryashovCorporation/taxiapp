from __future__ import annotations

import asyncio
from typing import Any

from backend.core.constants import CHAT_KIND_OPERATOR, CHAT_KIND_RIDE
from backend.realtime.manager import manager


def _emit(payload: dict[str, Any], rooms: list[str]) -> None:
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast(rooms, payload))
    except RuntimeError:
        pass


def emit_order_event(event_type: str, order: dict[str, Any]) -> None:
    rooms = [
        "operator:global",
        f"passenger:{order['passenger_id']}",
        f"order:{order['public_id']}",
    ]
    if order.get("driver_public_id"):
        rooms.append(f"driver:{order['driver_public_id']}")
    _emit({"type": event_type, "room": f"order:{order['public_id']}", "payload": order}, rooms)


def emit_driver_presence(driver: dict[str, Any]) -> None:
    rooms = ["operator:global", f"driver:{driver['public_id']}"]
    _emit(
        {
            "type": "driver.presence",
            "room": f"driver:{driver['public_id']}",
            "payload": driver,
        },
        rooms,
    )


def emit_driver_location(driver: dict[str, Any], active_order: dict[str, Any] | None = None) -> None:
    rooms = ["operator:global", f"driver:{driver['public_id']}"]
    if active_order:
        rooms.extend(
            [
                f"passenger:{active_order['passenger_id']}",
                f"order:{active_order['public_id']}",
            ]
        )
    _emit(
        {
            "type": "driver.location",
            "room": f"driver:{driver['public_id']}",
            "payload": {
                "driver_public_id": driver["public_id"],
                "lat": driver.get("current_lat"),
                "lon": driver.get("current_lon"),
                "order_public_id": active_order["public_id"] if active_order else None,
            },
        },
        rooms,
    )


def emit_chat_message(message: dict[str, Any], *, driver_public_id: str | None, order_public_id: str | None, chat_kind: str) -> None:
    rooms = ["operator:global"]
    room = "chat:unknown"
    if chat_kind == CHAT_KIND_OPERATOR and driver_public_id:
        room = f"chat:operator:{driver_public_id}"
        rooms.extend([f"driver:{driver_public_id}", room])
    elif chat_kind == CHAT_KIND_RIDE and order_public_id:
        room = f"chat:ride:{order_public_id}"
        rooms.append(room)

    _emit({"type": "chat.message", "room": room, "payload": message}, list(dict.fromkeys(rooms)))


def emit_dashboard_refresh(summary: dict[str, Any]) -> None:
    _emit({"type": "dashboard.stats", "room": "operator:global", "payload": summary}, ["operator:global"])
