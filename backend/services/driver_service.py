from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from backend.repositories import drivers as driver_repo
from backend.repositories import orders as order_repo
from backend.repositories import stats as stats_repo
from backend.realtime.publisher import emit_driver_location, emit_driver_presence


def serialize_driver_profile(driver: dict[str, Any]) -> dict[str, Any]:
    balance = driver_repo.get_driver_balance_summary(int(driver["id"]))
    stats = stats_repo.get_driver_stats(int(driver["id"]))
    current_order = order_repo.get_active_order_for_driver(int(driver["id"]))
    return {
        "driver": driver,
        "balance": balance,
        "stats": stats,
        "current_order": current_order,
        "available_orders": list_available_orders(driver),
        "balance_history": driver_repo.get_driver_balance_history(int(driver["id"]), limit=20),
    }


def set_presence(driver: dict[str, Any], is_online: bool, lat: float | None, lon: float | None) -> dict[str, Any]:
    if driver.get("is_banned") or not driver.get("is_active"):
        raise HTTPException(status_code=403, detail="Водитель недоступен.")
    updated = driver_repo.update_driver_presence(int(driver["id"]), is_online=is_online, lat=lat, lon=lon)
    if not updated:
        raise HTTPException(status_code=404, detail="Водитель не найден.")
    emit_driver_presence(updated)
    if lat is not None and lon is not None:
        active_order = order_repo.get_active_order_for_driver(int(driver["id"]))
        emit_driver_location(updated, active_order=active_order)
    return updated


def update_location(driver: dict[str, Any], lat: float, lon: float) -> dict[str, Any]:
    if driver.get("is_banned") or not driver.get("is_active"):
        raise HTTPException(status_code=403, detail="Водитель недоступен.")
    updated = driver_repo.update_driver_location(int(driver["id"]), lat, lon)
    if not updated:
        raise HTTPException(status_code=404, detail="Водитель не найден.")
    active_order = order_repo.get_active_order_for_driver(int(driver["id"]))
    emit_driver_location(updated, active_order=active_order)
    return updated


def list_available_orders(driver: dict[str, Any]) -> list[dict[str, Any]]:
    if not driver.get("is_online"):
        return []
    if driver.get("is_banned") or not driver.get("is_active"):
        return []
    if order_repo.get_active_order_for_driver(int(driver["id"])):
        return []
    return order_repo.list_searching_orders_for_driver(int(driver["id"]))
