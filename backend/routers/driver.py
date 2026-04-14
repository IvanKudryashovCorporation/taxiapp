from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.schemas.chat import DriverOperatorChatSendIn, RideChatSendIn
from backend.schemas.driver import DriverCancelRideIn, DriverPresenceIn
from backend.schemas.orders import RideCancelIn, RideStatusUpdateIn
from backend.services import auth_service, chat_service, driver_service, order_service

router = APIRouter(prefix="/api/driver", tags=["driver"])


@router.get("/me")
def driver_me(driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return driver_service.serialize_driver_profile(driver)


@router.post("/presence")
def driver_presence(payload: DriverPresenceIn, driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return driver_service.set_presence(driver, payload.is_online, payload.current_lat, payload.current_lon)


@router.post("/location")
def driver_location(payload: DriverPresenceIn, driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return driver_service.update_location(driver, float(payload.current_lat), float(payload.current_lon))


@router.get("/orders/available")
def driver_available_orders(driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return {"items": driver_service.list_available_orders(driver)}


@router.get("/orders/current")
def driver_current_order(driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return {"order": order_service.get_current_driver_order(int(driver["id"]))}


@router.post("/orders/{order_public_id}/accept")
def driver_accept_order(order_public_id: str, driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return order_service.accept_order(driver, order_public_id)


@router.post("/orders/{order_public_id}/decline")
def driver_decline_order(order_public_id: str, payload: RideCancelIn, driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return order_service.decline_order(driver, order_public_id, payload.reason)


@router.post("/orders/{order_public_id}/status")
def driver_update_order_status(order_public_id: str, payload: RideStatusUpdateIn, driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return order_service.update_driver_status(driver, order_public_id, payload.status)


@router.post("/orders/{order_public_id}/cancel")
def driver_cancel_order(order_public_id: str, payload: DriverCancelRideIn, driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return order_service.cancel_by_driver(driver, order_public_id, payload.reason)


@router.get("/chat/operator")
def driver_operator_chat(since: int = 0, driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return {"messages": chat_service.list_operator_messages(driver["public_id"], since)}


@router.post("/chat/operator")
def driver_send_operator_chat(payload: DriverOperatorChatSendIn, driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return {"message": chat_service.send_driver_operator_message(driver, payload.text)}


@router.get("/orders/{order_public_id}/chat")
def driver_ride_chat(order_public_id: str, since: int = 0, driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return {
        "messages": chat_service.list_ride_messages_for_driver(order_public_id, int(driver["id"]), since)
    }


@router.post("/orders/{order_public_id}/chat")
def driver_send_ride_chat(order_public_id: str, payload: RideChatSendIn, driver: dict = Depends(auth_service.get_driver_from_header)) -> dict:
    return {"message": chat_service.send_driver_ride_message(order_public_id, driver, payload.text)}
