from __future__ import annotations

import json
import threading
from typing import Any, Callable

try:
    import websocket
except Exception:  # pragma: no cover - optional dependency fallback
    websocket = None  # type: ignore[assignment]


class RealtimeClient:
    def __init__(
        self,
        ws_url: str,
        *,
        on_message: Callable[[dict[str, Any]], None],
        on_state: Callable[[str], None] | None = None,
    ) -> None:
        self.ws_url = ws_url
        self.on_message = on_message
        self.on_state = on_state or (lambda _state: None)
        self._app: websocket.WebSocketApp | None = None
        self._thread: threading.Thread | None = None
        self._closed = False

    def connect(self) -> None:
        if websocket is None:
            self.on_state("missing_dependency:websocket-client")
            return
        self._closed = False
        self._app = websocket.WebSocketApp(
            self.ws_url,
            on_open=lambda ws: self.on_state("open"),
            on_message=lambda ws, msg: self._handle_message(msg),
            on_error=lambda ws, err: self.on_state(f"error:{err}"),
            on_close=lambda ws, status, msg: self.on_state("closed"),
        )
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def _run(self) -> None:
        if self._app is not None:
            self._app.run_forever(ping_interval=20, ping_timeout=10)

    def _handle_message(self, raw: str) -> None:
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"type": "raw", "payload": raw}
        self.on_message(payload)

    def send(self, payload: dict[str, Any]) -> None:
        if self._app and self._app.sock and self._app.sock.connected:
            self._app.send(json.dumps(payload))

    def close(self) -> None:
        self._closed = True
        if self._app:
            self._app.close()
