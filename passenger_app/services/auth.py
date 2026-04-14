from __future__ import annotations

import json
from pathlib import Path
from typing import Any

SESSION_PATH = Path(__file__).resolve().parents[1] / "data" / "passenger_session.json"


def save_session(payload: dict[str, Any]) -> None:
    SESSION_PATH.parent.mkdir(parents=True, exist_ok=True)
    SESSION_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def load_session() -> dict[str, Any] | None:
    if not SESSION_PATH.exists():
        return None
    try:
        return json.loads(SESSION_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None


def clear_session() -> None:
    if SESSION_PATH.exists():
        SESSION_PATH.unlink()
