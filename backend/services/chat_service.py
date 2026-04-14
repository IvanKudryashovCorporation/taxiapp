from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from backend.core.constants import CHAT_KIND_OPERATOR, CHAT_KIND_RIDE, SENDER_DRIVER, SENDER_OPERATOR, SENDER_PASSENGER
from backend.realtime.publisher import emit_chat_message
from backend.repositories import auth as auth_repo
from backend.repositories import chats as chat_repo
from backend.repositories import orders as order_repo


def list_operator_chat_heads() -> list[dict[str, Any]]:
    return chat_repo.list_operator_chat_heads()


def list_operator_messages(driver_public_id: str, since_id: int = 0) -> list[dict[str, Any]]:
    return chat_repo.list_operator_messages(driver_public_id.upper(), since_id)


def send_operator_message(driver_public_id: str, text: str) -> dict[str, Any]:
    driver_public_id = driver_public_id.upper()
    driver = auth_repo.get_driver_by_public_id(driver_public_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Водитель не найден.")

    message = chat_repo.create_chat_message(
        chat_kind=CHAT_KIND_OPERATOR,
        driver_public_id=driver_public_id,
        ride_order_id=None,
        sender_type=SENDER_OPERATOR,
        sender_id="operator",
        receiver_type=SENDER_DRIVER,
        receiver_id=driver_public_id,
        text=text.strip(),
    )
    emit_chat_message(message, driver_public_id=driver_public_id, order_public_id=None, chat_kind=CHAT_KIND_OPERATOR)
    return message


def send_driver_operator_message(driver: dict[str, Any], text: str) -> dict[str, Any]:
    message = chat_repo.create_chat_message(
        chat_kind=CHAT_KIND_OPERATOR,
        driver_public_id=driver["public_id"],
        ride_order_id=None,
        sender_type=SENDER_DRIVER,
        sender_id=driver["public_id"],
        receiver_type=SENDER_OPERATOR,
        receiver_id="operator",
        text=text.strip(),
    )
    emit_chat_message(message, driver_public_id=driver["public_id"], order_public_id=None, chat_kind=CHAT_KIND_OPERATOR)
    return message


def list_ride_messages_for_passenger(order_public_id: str, passenger_id: int, since_id: int = 0) -> list[dict[str, Any]]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order or int(order["passenger_id"]) != int(passenger_id):
        raise HTTPException(status_code=404, detail="Заказ не найден.")
    return chat_repo.list_ride_messages(int(order["id"]), since_id)


def list_ride_messages_for_driver(order_public_id: str, driver_id: int, since_id: int = 0) -> list[dict[str, Any]]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order or int(order.get("driver_id") or 0) != int(driver_id):
        raise HTTPException(status_code=404, detail="Активный заказ не найден.")
    return chat_repo.list_ride_messages(int(order["id"]), since_id)


def send_passenger_ride_message(order_public_id: str, passenger: dict[str, Any], text: str) -> dict[str, Any]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order or int(order["passenger_id"]) != int(passenger["id"]):
        raise HTTPException(status_code=404, detail="Заказ не найден.")
    if not order.get("driver_public_id"):
        raise HTTPException(status_code=400, detail="Водитель еще не назначен.")

    message = chat_repo.create_chat_message(
        chat_kind=CHAT_KIND_RIDE,
        driver_public_id=order["driver_public_id"],
        ride_order_id=int(order["id"]),
        sender_type=SENDER_PASSENGER,
        sender_id=str(passenger["id"]),
        receiver_type=SENDER_DRIVER,
        receiver_id=order["driver_public_id"],
        text=text.strip(),
    )
    emit_chat_message(message, driver_public_id=order["driver_public_id"], order_public_id=order["public_id"], chat_kind=CHAT_KIND_RIDE)
    return message


def send_driver_ride_message(order_public_id: str, driver: dict[str, Any], text: str) -> dict[str, Any]:
    order = order_repo.get_order_by_public_id(order_public_id)
    if not order or int(order.get("driver_id") or 0) != int(driver["id"]):
        raise HTTPException(status_code=404, detail="Заказ не найден.")

    message = chat_repo.create_chat_message(
        chat_kind=CHAT_KIND_RIDE,
        driver_public_id=driver["public_id"],
        ride_order_id=int(order["id"]),
        sender_type=SENDER_DRIVER,
        sender_id=driver["public_id"],
        receiver_type=SENDER_PASSENGER,
        receiver_id=str(order["passenger_id"]),
        text=text.strip(),
    )
    emit_chat_message(message, driver_public_id=driver["public_id"], order_public_id=order["public_id"], chat_kind=CHAT_KIND_RIDE)
    return message


def legacy_register_driver(driver_public_id: str) -> dict[str, Any]:
    return {"ok": True, "driver_id": driver_public_id.upper()}


def legacy_send_message(driver_public_id: str, sender: str, text: str) -> dict[str, Any]:
    if sender == "driver":
        driver = auth_repo.get_driver_by_public_id(driver_public_id.upper())
        if not driver:
            driver = {"public_id": driver_public_id.upper()}
        message = chat_repo.create_chat_message(
            chat_kind=CHAT_KIND_OPERATOR,
            driver_public_id=driver_public_id.upper(),
            ride_order_id=None,
            sender_type=SENDER_DRIVER,
            sender_id=driver_public_id.upper(),
            receiver_type=SENDER_OPERATOR,
            receiver_id="operator",
            text=text.strip(),
        )
    else:
        message = chat_repo.create_chat_message(
            chat_kind=CHAT_KIND_OPERATOR,
            driver_public_id=driver_public_id.upper(),
            ride_order_id=None,
            sender_type=SENDER_OPERATOR,
            sender_id="operator",
            receiver_type=SENDER_DRIVER,
            receiver_id=driver_public_id.upper(),
            text=text.strip(),
        )
    emit_chat_message(message, driver_public_id=driver_public_id.upper(), order_public_id=None, chat_kind=CHAT_KIND_OPERATOR)
    return {
        "ok": True,
        "message": {
            "id": message["id"],
            "driver_id": driver_public_id.upper(),
            "sender": sender,
            "text": message["text"],
            "time_utc": str(message["created_at"]),
        },
    }


def legacy_list_messages(driver_public_id: str, since_id: int = 0) -> dict[str, Any]:
    rows = chat_repo.list_operator_messages(driver_public_id.upper(), since_id)
    messages = [
        {
            "id": row["id"],
            "driver_id": driver_public_id.upper(),
            "sender": "driver" if row["sender_type"] == SENDER_DRIVER else "admin",
            "text": row["text"],
            "time_utc": str(row["created_at"]),
        }
        for row in rows
    ]
    return {"messages": messages}
