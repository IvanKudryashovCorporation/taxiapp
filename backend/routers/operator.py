from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.schemas.chat import OperatorChatSendIn
from backend.schemas.operator import DriverCreateIn, ManualOrderCreateIn
from backend.schemas.orders import OperatorAssignIn, RideCancelIn
from backend.services import auth_service, chat_service, operator_service, order_service, stats_service

router = APIRouter(prefix="/api/operator", tags=["operator"])


@router.get("/dashboard")
def operator_dashboard() -> dict:
    return stats_service.get_operator_dashboard()


@router.get("/orders")
def operator_orders(active_only: bool = False) -> dict:
    return {"items": order_service.list_orders(active_only=active_only)}


@router.post("/orders/quote")
def operator_quote_order(payload: ManualOrderCreateIn) -> dict:
    data = payload.model_dump()
    data.pop("passenger_phone", None)
    return order_service.build_quote(data)


@router.post("/orders")
def operator_create_order(payload: ManualOrderCreateIn) -> dict:
    data = payload.model_dump()
    passenger_phone = auth_service.normalize_phone(data.pop("passenger_phone"))
    return order_service.create_operator_order(passenger_phone, data)


@router.post("/orders/{order_public_id}/assign")
def operator_assign_order(order_public_id: str, payload: OperatorAssignIn) -> dict:
    return order_service.operator_assign(order_public_id, payload.driver_id)


@router.post("/orders/{order_public_id}/unassign")
def operator_unassign_order(order_public_id: str) -> dict:
    return order_service.operator_unassign(order_public_id)


@router.post("/orders/{order_public_id}/cancel")
def operator_cancel_order(order_public_id: str, payload: RideCancelIn) -> dict:
    return order_service.operator_cancel(order_public_id, payload.reason)


@router.post("/orders/{order_public_id}/complete")
def operator_complete_order(order_public_id: str) -> dict:
    return order_service.operator_complete(order_public_id)


@router.get("/drivers")
def operator_drivers() -> dict:
    return {"items": operator_service.list_drivers()}


@router.post("/drivers")
def operator_create_driver(payload: DriverCreateIn) -> dict:
    return operator_service.create_driver(payload.model_dump())


@router.post("/drivers/{driver_public_id}/ban")
def operator_ban_driver(driver_public_id: str) -> dict:
    return operator_service.ban_driver(driver_public_id, True)


@router.get("/complaints")
def operator_complaints() -> dict:
    return {"items": stats_service.get_feedback_list()}


@router.get("/chat/{driver_public_id}")
def operator_chat(driver_public_id: str, since: int = 0) -> dict:
    return {"messages": chat_service.list_operator_messages(driver_public_id.upper(), since)}


@router.post("/chat/{driver_public_id}")
def operator_send_chat(driver_public_id: str, payload: OperatorChatSendIn) -> dict:
    if payload.driver_public_id.upper() != driver_public_id.upper():
        raise HTTPException(status_code=400, detail="driver_public_id в пути и теле запроса должны совпадать.")
    return {"message": chat_service.send_operator_message(driver_public_id.upper(), payload.text)}
