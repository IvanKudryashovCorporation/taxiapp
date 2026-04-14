from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from backend.core.constants import (
    DRIVER_ALLOWED_TRANSITIONS,
    ORDER_STATUS_ACCEPTED,
    ORDER_STATUS_CANCELLED,
    ORDER_STATUS_COMPLETED,
    ORDER_STATUS_IN_PROGRESS,
    ORDER_STATUS_NEARBY,
    ORDER_STATUS_ON_THE_WAY,
    ORDER_STATUS_SEARCHING,
)
from backend.core.utils import estimate_duration_seconds, haversine_meters, money_round, normalize_payment_method
from backend.realtime.publisher import emit_dashboard_refresh, emit_order_event
from backend.repositories import auth as auth_repo
from backend.repositories import drivers as driver_repo
from backend.repositories import orders as order_repo
from backend.repositories import stats as stats_repo
from backend.services import geo_service, pricing_service


def _normalize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    pickup = geo_service.ensure_point(payload.get("pickup_address"), payload.get("pickup_lat"), payload.get("pickup_lon"))
    dropoff = geo_service.ensure_point(payload.get("dropoff_address"), payload.get("dropoff_lat"), payload.get("dropoff_lon"))
    waypoints = []
    for item in payload.get("waypoints", []):
        waypoints.append(
            geo_service.ensure_point(item.get("address"), item.get("lat"), item.get("lon"))
        )
    return {
        "pickup_address": pickup["address"],
        "pickup_lat": pickup["lat"],
        "pickup_lon": pickup["lon"],
        "dropoff_address": dropoff["address"],
        "dropoff_lat": dropoff["lat"],
        "dropoff_lon": dropoff["lon"],
        "waypoints": waypoints,
        "comment": (payload.get("comment") or "").strip(),
        "passengers_count": int(payload.get("passengers_count") or 1),
        "car_class": payload.get("car_class") or "econom",
        "payment_method": normalize_payment_method(payload.get("payment_method")),
        "scheduled_for": payload.get("scheduled_for"),
        "promo_code": payload.get("promo_code"),
    }


def build_quote(payload: dict[str, Any]) -> dict[str, Any]:
    normalized = _normalize_payload(payload)
    route = geo_service.build_route(
        {"address": normalized["pickup_address"], "lat": normalized["pickup_lat"], "lon": normalized["pickup_lon"]},
        {"address": normalized["dropoff_address"], "lat": normalized["dropoff_lat"], "lon": normalized["dropoff_lon"]},
        normalized["waypoints"],
    )
    pricing = pricing_service.calculate_quote(
        route_distance_meters=int(route["route_distance_meters"]),
        route_duration_seconds=int(route["route_duration_seconds"]),
        car_class=normalized["car_class"],
        passengers_count=normalized["passengers_count"],
        scheduled_for=normalized["scheduled_for"],
        promo_code=normalized["promo_code"],
    )
    return {**normalized, **route, **pricing}


def create_passenger_order(passenger: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    active = order_repo.get_active_order_for_passenger(int(passenger["id"]))
    if active:
        raise HTTPException(status_code=400, detail="У пассажира уже есть активный заказ.")
    quote = build_quote(payload)
    order = order_repo.create_order(int(passenger["id"]), quote, quote, created_source="passenger")
    emit_order_event("order.created", order)
    emit_dashboard_refresh(stats_repo.get_operator_dashboard())
    return order


def create_operator_order(passenger_phone: str, payload: dict[str, Any]) -> dict[str, Any]:
    passenger = auth_repo.get_or_create_passenger(passenger_phone)
    quote = build_quote(payload)
    order = order_repo.create_order(int(passenger["id"]), quote, quote, created_source="operator")
    emit_order_event("order.created", order)
    emit_dashboard_refresh(stats_repo.get_operator_dashboard())
    return order


def get_current_passenger_order(passenger_id: int) -> dict[str, Any] | None:
    return order_repo.get_active_order_for_passenger(passenger_id)


def get_current_driver_order(driver_id: int) -> dict[str, Any] | None:
    return order_repo.get_active_order_for_driver(driver_id)


def accept_order(driver: dict[str, Any], order_public_id: str) -> dict[str, Any]:
    if not driver.get("is_online"):
        raise HTTPException(status_code=400, detail="Сначала переведите статус в online.")
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден.")
    if order["status"] != ORDER_STATUS_SEARCHING or order.get("driver_id") is not None:
        raise HTTPException(status_code=409, detail="Заказ уже занят другим водителем.")

    driver_lat = driver.get("current_lat")
    driver_lon = driver.get("current_lon")
    if driver_lat is not None and driver_lon is not None:
        distance = haversine_meters(float(driver_lat), float(driver_lon), float(order["pickup_lat"]), float(order["pickup_lon"]))
        duration = estimate_duration_seconds(distance)
    else:
        distance = 0
        duration = 0

    updated = order_repo.accept_order(
        int(order["id"]),
        int(driver["id"]),
        driver_to_pickup_distance_meters=distance,
        driver_to_pickup_duration_seconds=duration,
    )
    if not updated:
        raise HTTPException(status_code=409, detail="Заказ уже принят другим водителем.")
    emit_order_event("order.accepted", updated)
    emit_dashboard_refresh(stats_repo.get_operator_dashboard())
    return updated


def decline_order(driver: dict[str, Any], order_public_id: str, reason: str = "") -> dict[str, Any]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден.")
    order_repo.reject_order(int(order["id"]), int(driver["id"]), reason)
    order_repo.create_order_event(int(order["id"]), "declined", "driver", driver["public_id"], {"reason": reason})
    emit_order_event("order.updated", order)
    return {"ok": True}


def update_driver_status(driver: dict[str, Any], order_public_id: str, next_status: str) -> dict[str, Any]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order or int(order.get("driver_id") or 0) != int(driver["id"]):
        raise HTTPException(status_code=404, detail="Активный заказ не найден.")
    current_status = str(order["status"])
    allowed = DRIVER_ALLOWED_TRANSITIONS.get(current_status, ())
    if next_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Переход {current_status} -> {next_status} запрещен.")

    updated = order_repo.set_order_status(int(order["id"]), driver_id=int(driver["id"]), status=next_status)
    if not updated:
        raise HTTPException(status_code=409, detail="Не удалось обновить статус заказа.")
    order_repo.create_order_event(int(order["id"]), next_status, "driver", driver["public_id"])

    if next_status == ORDER_STATUS_COMPLETED:
        driver_repo.record_balance_entry(
            int(driver["id"]),
            ride_order_id=int(order["id"]),
            entry_type="ride_income",
            direction="credit",
            payment_method=str(order["payment_method"]),
            amount=float(order["driver_payout_amount"]),
            comment=f"Начисление за заказ {order['public_id']}",
        )

    emit_order_event("order.updated", order_repo.get_order_by_id(int(order["id"])) or updated)
    emit_dashboard_refresh(stats_repo.get_operator_dashboard())
    return order_repo.get_order_by_id(int(order["id"])) or updated


def cancel_by_passenger(passenger: dict[str, Any], order_public_id: str, reason: str) -> dict[str, Any]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order or int(order["passenger_id"]) != int(passenger["id"]):
        raise HTTPException(status_code=404, detail="Заказ не найден.")

    updated = order_repo.passenger_cancel_order(int(order["id"]), int(passenger["id"]), reason or "Отмена пассажиром")
    if not updated:
        raise HTTPException(status_code=409, detail="Заказ уже завершен или отменен.")
    order_repo.create_order_event(int(order["id"]), "cancelled", "passenger", str(passenger["id"]), {"reason": reason})
    final = order_repo.get_order_by_id(int(order["id"])) or updated
    emit_order_event("order.cancelled", final)
    emit_dashboard_refresh(stats_repo.get_operator_dashboard())
    return final


def cancel_by_driver(driver: dict[str, Any], order_public_id: str, reason: str) -> dict[str, Any]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order or int(order.get("driver_id") or 0) != int(driver["id"]):
        raise HTTPException(status_code=404, detail="Заказ не найден.")
    if order["status"] not in {
        ORDER_STATUS_ACCEPTED,
        ORDER_STATUS_ON_THE_WAY,
        ORDER_STATUS_NEARBY,
        "arrived",
    }:
        raise HTTPException(status_code=400, detail="Водитель не может отменить заказ в текущем статусе.")

    penalty = money_round(float(order["fare_total"]) * 2.0)
    driver_repo.record_balance_entry(
        int(driver["id"]),
        ride_order_id=int(order["id"]),
        entry_type="driver_penalty",
        direction="debit",
        payment_method=None,
        amount=penalty,
        comment=f"Штраф за отмену заказа {order['public_id']}",
    )
    reopened = order_repo.operator_unassign_order(int(order["id"]))
    order_repo.create_order_event(int(order["id"]), "driver_cancelled", "driver", driver["public_id"], {"reason": reason, "penalty": penalty})
    final = order_repo.get_order_by_id(int(order["id"])) or reopened
    emit_order_event("order.updated", final)
    emit_dashboard_refresh(stats_repo.get_operator_dashboard())
    return final


def operator_assign(order_public_id: str, driver_id: int) -> dict[str, Any]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден.")
    driver = auth_repo.get_driver_by_id(driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Водитель не найден.")
    if driver.get("is_banned") or not driver.get("is_active"):
        raise HTTPException(status_code=403, detail="Водитель недоступен для назначения.")
    if not driver.get("is_online"):
        raise HTTPException(status_code=409, detail="Можно назначить только водителя в статусе online.")

    active_driver_order = order_repo.get_active_order_for_driver(int(driver["id"]))
    if active_driver_order and active_driver_order.get("public_id") != order_public_id:
        raise HTTPException(status_code=409, detail="У водителя уже есть активный заказ.")

    updated = order_repo.operator_assign_order(int(order["id"]), driver_id)
    if not updated:
        raise HTTPException(status_code=409, detail="Не удалось назначить водителя.")
    order_repo.create_order_event(int(order["id"]), "assigned", "operator", "operator", {"driver_id": driver_id})
    final = order_repo.get_order_by_id(int(order["id"])) or updated
    emit_order_event("order.accepted", final)
    emit_dashboard_refresh(stats_repo.get_operator_dashboard())
    return final


def operator_unassign(order_public_id: str) -> dict[str, Any]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден.")
    updated = order_repo.operator_unassign_order(int(order["id"]))
    if not updated:
        raise HTTPException(status_code=409, detail="Не удалось снять водителя.")
    order_repo.create_order_event(int(order["id"]), "unassigned", "operator", "operator")
    final = order_repo.get_order_by_id(int(order["id"])) or updated
    emit_order_event("order.updated", final)
    emit_dashboard_refresh(stats_repo.get_operator_dashboard())
    return final


def operator_cancel(order_public_id: str, reason: str) -> dict[str, Any]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден.")
    updated = order_repo.operator_cancel_order(int(order["id"]), reason or "Отменено оператором")
    if not updated:
        raise HTTPException(status_code=409, detail="Заказ уже завершен или отменен.")
    order_repo.create_order_event(int(order["id"]), "cancelled", "operator", "operator", {"reason": reason})
    final = order_repo.get_order_by_id(int(order["id"])) or updated
    emit_order_event("order.cancelled", final)
    emit_dashboard_refresh(stats_repo.get_operator_dashboard())
    return final


def operator_complete(order_public_id: str) -> dict[str, Any]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден.")
    updated = order_repo.operator_complete_order(int(order["id"]))
    if not updated:
        raise HTTPException(status_code=409, detail="Не удалось завершить заказ.")
    if order.get("driver_id"):
        driver_repo.record_balance_entry(
            int(order["driver_id"]),
            ride_order_id=int(order["id"]),
            entry_type="ride_income",
            direction="credit",
            payment_method=str(order["payment_method"]),
            amount=float(order["driver_payout_amount"]),
            comment=f"Начисление за заказ {order['public_id']}",
        )
    order_repo.create_order_event(int(order["id"]), "completed", "operator", "operator")
    final = order_repo.get_order_by_id(int(order["id"])) or updated
    emit_order_event("order.completed", final)
    emit_dashboard_refresh(stats_repo.get_operator_dashboard())
    return final


def list_orders(active_only: bool = False) -> list[dict[str, Any]]:
    return order_repo.list_orders(active_only=active_only, limit=200)


def list_history(passenger_id: int) -> list[dict[str, Any]]:
    return order_repo.list_passenger_history(passenger_id, limit=30)


def submit_feedback(passenger: dict[str, Any], order_public_id: str, rating: int, complaint_reason: str | None, complaint_text: str) -> dict[str, Any]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order or int(order["passenger_id"]) != int(passenger["id"]):
        raise HTTPException(status_code=404, detail="Заказ не найден.")
    if order["status"] != ORDER_STATUS_COMPLETED or not order.get("driver_id"):
        raise HTTPException(status_code=400, detail="Отзыв можно оставить только после завершения поездки.")

    feedback_id = order_repo.save_feedback(
        int(order["id"]),
        int(passenger["id"]),
        int(order["driver_id"]),
        rating,
        complaint_reason,
        complaint_text,
    )
    emit_dashboard_refresh(stats_repo.get_operator_dashboard())
    return {"ok": True, "feedback_id": feedback_id}
