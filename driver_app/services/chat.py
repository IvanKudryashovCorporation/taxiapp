from __future__ import annotations

from typing import Any

import requests

from driver_app.config import BACKEND_URL


def register_driver(driver_id: str) -> None:
    url = f"{BACKEND_URL}/api/chat/register-driver"
    resp = requests.post(url, json={"driver_id": driver_id, "source": "driver_app"}, timeout=5)
    resp.raise_for_status()


def send_message(driver_id: str, sender: str, text: str) -> dict[str, Any]:
    url = f"{BACKEND_URL}/api/chat/send"
    resp = requests.post(
        url,
        json={"driver_id": driver_id, "sender": sender, "text": text},
        timeout=5,
    )
    resp.raise_for_status()
    return resp.json()["message"]


def fetch_messages(driver_id: str, since: int = 0) -> list[dict[str, Any]]:
    url = f"{BACKEND_URL}/api/chat/messages/{driver_id}"
    resp = requests.get(url, params={"since": since}, timeout=5)
    resp.raise_for_status()
    return resp.json()["messages"]
