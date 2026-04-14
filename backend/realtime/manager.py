from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder


class WebSocketRoomManager:
    def __init__(self) -> None:
        self._room_members: dict[str, set[WebSocket]] = defaultdict(set)
        self._socket_rooms: dict[WebSocket, set[str]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            rooms = list(self._socket_rooms.get(websocket, set()))
            for room in rooms:
                self._room_members[room].discard(websocket)
                if not self._room_members[room]:
                    self._room_members.pop(room, None)
            self._socket_rooms.pop(websocket, None)

    async def join(self, websocket: WebSocket, room: str) -> None:
        async with self._lock:
            self._room_members[room].add(websocket)
            self._socket_rooms[websocket].add(room)

    async def leave(self, websocket: WebSocket, room: str) -> None:
        async with self._lock:
            self._room_members[room].discard(websocket)
            if not self._room_members[room]:
                self._room_members.pop(room, None)
            if websocket in self._socket_rooms:
                self._socket_rooms[websocket].discard(room)
                if not self._socket_rooms[websocket]:
                    self._socket_rooms.pop(websocket, None)

    async def send(self, websocket: WebSocket, payload: dict[str, Any]) -> None:
        await websocket.send_json(jsonable_encoder(payload))

    async def broadcast(self, rooms: list[str], payload: dict[str, Any]) -> None:
        async with self._lock:
            sockets: set[WebSocket] = set()
            for room in rooms:
                sockets.update(self._room_members.get(room, set()))

        if not sockets:
            return

        encoded = jsonable_encoder(payload)
        for websocket in list(sockets):
            try:
                await websocket.send_json(encoded)
            except Exception:
                await self.disconnect(websocket)


manager = WebSocketRoomManager()
