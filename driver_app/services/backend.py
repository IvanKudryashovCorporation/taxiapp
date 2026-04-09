from __future__ import annotations

from driver_app.config import APP_NAME, APP_TYPE, BACKEND_URL
from shared.api_client import send_ping


def ping_driver(invite_code: str) -> tuple[bool, str]:
    try:
        send_ping(
            base_url=BACKEND_URL,
            app_type=APP_TYPE,
            app_name=f"{APP_NAME}:{invite_code}",
        )
        return True, ""
    except Exception as exc:  # pragma: no cover - network/UI integration path
        return False, str(exc)
