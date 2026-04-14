from __future__ import annotations

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.realtime.manager import manager
from backend.services import auth_service, order_service

router = APIRouter(tags=["ws"])


async def _join_actor_rooms(websocket: WebSocket, role: str, token: str | None) -> dict | None:
    if role == "operator":
        await manager.join(websocket, "operator:global")
        await manager.send(websocket, {"type": "connected", "room": "operator:global", "payload": {"role": role}})
        return None

    if role == "driver":
        driver = auth_service.get_driver_from_ws_token(token or "")
        await manager.join(websocket, f"driver:{driver['public_id']}")
        await manager.join(websocket, f"chat:operator:{driver['public_id']}")
        current = order_service.get_current_driver_order(int(driver["id"]))
        if current:
            await manager.join(websocket, f"order:{current['public_id']}")
            await manager.join(websocket, f"chat:ride:{current['public_id']}")
        await manager.send(websocket, {"type": "connected", "room": f"driver:{driver['public_id']}", "payload": {"role": role}})
        return driver

    if role == "passenger":
        passenger = auth_service.get_passenger_from_ws_token(token or "")
        await manager.join(websocket, f"passenger:{passenger['id']}")
        current = order_service.get_current_passenger_order(int(passenger["id"]))
        if current:
            await manager.join(websocket, f"order:{current['public_id']}")
            await manager.join(websocket, f"chat:ride:{current['public_id']}")
        await manager.send(websocket, {"type": "connected", "room": f"passenger:{passenger['id']}", "payload": {"role": role}})
        return passenger

    await manager.send(websocket, {"type": "error", "payload": {"message": "unknown role"}})
    return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    role = (websocket.query_params.get("role") or "").strip()
    token = websocket.query_params.get("token")

    await manager.connect(websocket)
    try:
        await _join_actor_rooms(websocket, role, token)
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                payload = {}

            action = payload.get("action")
            order_id = payload.get("order_id")

            if action == "ping":
                await manager.send(websocket, {"type": "pong"})
            elif action == "subscribe_order" and order_id:
                await manager.join(websocket, f"order:{order_id}")
                await manager.join(websocket, f"chat:ride:{order_id}")
                await manager.send(websocket, {"type": "subscribed", "room": f"order:{order_id}"})
            elif action == "unsubscribe_order" and order_id:
                await manager.leave(websocket, f"order:{order_id}")
                await manager.leave(websocket, f"chat:ride:{order_id}")
                await manager.send(websocket, {"type": "unsubscribed", "room": f"order:{order_id}"})
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
