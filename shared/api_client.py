from __future__ import annotations

from typing import Any

import requests


def send_ping(base_url: str, app_type: str, app_name: str, timeout: float = 5.0) -> dict[str, Any]:
    url = f"{base_url.rstrip('/')}/api/apps/ping"
    payload = {"app_type": app_type, "app_name": app_name}

    response = requests.post(url, json=payload, timeout=timeout)
    response.raise_for_status()
    return response.json()
