from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from backend.core.utils import make_invite_code
from backend.repositories import auth as auth_repo
from backend.repositories import drivers as driver_repo


def create_driver(payload: dict[str, Any]) -> dict[str, Any]:
    payload = dict(payload)
    payload["invite_code"] = make_invite_code()
    return driver_repo.create_driver(payload)


def list_drivers() -> list[dict[str, Any]]:
    return driver_repo.list_drivers()


def ban_driver(driver_public_id: str, is_banned: bool = True) -> dict[str, Any]:
    driver = auth_repo.get_driver_by_public_id(driver_public_id.upper())
    if not driver:
        raise HTTPException(status_code=404, detail="Водитель не найден.")
    updated = driver_repo.set_driver_banned(int(driver["id"]), is_banned)
    if not updated:
        raise HTTPException(status_code=404, detail="Водитель не найден.")
    return updated
