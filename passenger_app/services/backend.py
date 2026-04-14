from __future__ import annotations

from urllib.parse import urlencode

from passenger_app.config import BACKEND_URL
from shared.backend_client import BackendClient


def create_client(token: str = "") -> BackendClient:
    return BackendClient(BACKEND_URL, token=token)


def make_ws_url(token: str) -> str:
    base = BACKEND_URL.rstrip("/")
    if base.startswith("https://"):
        prefix = "wss://"
        host = base[len("https://") :]
    elif base.startswith("http://"):
        prefix = "ws://"
        host = base[len("http://") :]
    else:
        prefix = "ws://"
        host = base
    return f"{prefix}{host}/ws?{urlencode({'role': 'passenger', 'token': token})}"
