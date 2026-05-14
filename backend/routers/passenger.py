from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.schemas.chat import PassengerOperatorChatSendIn, RideChatSendIn
from backend.schemas.orders import FeedbackIn, RideCreateIn, RideQuoteIn, RideCancelIn
from backend.services import auth_service, chat_service, order_service

router = APIRouter(prefix="/api/passenger", tags=["passenger"])


@router.get("/me")
def passenger_me(passenger: dict = Depends(auth_service.get_passenger_from_header)) -> dict:
    return {
        "passenger": passenger,
        "current_order": order_service.get_current_passenger_order(int(passenger["id"])),
    }


@router.post("/orders/quote")
def passenger_quote(payload: RideQuoteIn, passenger: dict = Depends(auth_service.get_passenger_from_header)) -> dict:
    return order_service.build_quote(payload.model_dump())


@router.post("/orders")
def passenger_create_order(payload: RideCreateIn, passenger: dict = Depends(auth_service.get_passenger_from_header)) -> dict:
    return order_service.create_passenger_order(passenger, payload.model_dump())


@router.get("/orders/current")
def passenger_current_order(passenger: dict = Depends(auth_service.get_passenger_from_header)) -> dict:
    return {"order": order_service.get_current_passenger_order(int(passenger["id"]))}


@router.get("/orders/history")
def passenger_history(passenger: dict = Depends(auth_service.get_passenger_from_header)) -> dict:
    return {"items": order_service.list_history(int(passenger["id"]))}


@router.post("/orders/{order_public_id}/cancel")
def passenger_cancel(order_public_id: str, payload: RideCancelIn, passenger: dict = Depends(auth_service.get_passenger_from_header)) -> dict:
    return order_service.cancel_by_passenger(passenger, order_public_id, payload.reason)


@router.post("/orders/{order_public_id}/feedback")
def passenger_feedback(order_public_id: str, payload: FeedbackIn, passenger: dict = Depends(auth_service.get_passenger_from_header)) -> dict:
    return order_service.submit_feedback(
        passenger,
        order_public_id,
        payload.rating,
        payload.complaint_reason,
        payload.complaint_text,
    )


@router.get("/orders/{order_public_id}/chat")
def passenger_ride_chat(order_public_id: str, since: int = 0, passenger: dict = Depends(auth_service.get_passenger_from_header)) -> dict:
    return {
        "messages": chat_service.list_ride_messages_for_passenger(
            order_public_id,
            int(passenger["id"]),
            since,
        )
    }


@router.post("/orders/{order_public_id}/chat")
def passenger_send_ride_chat(order_public_id: str, payload: RideChatSendIn, passenger: dict = Depends(auth_service.get_passenger_from_header)) -> dict:
    return {
        "message": chat_service.send_passenger_ride_message(
            order_public_id,
            passenger,
            payload.text,
        )
    }


@router.get("/chat/operator")
def passenger_operator_chat(since: int = 0, passenger: dict = Depends(auth_service.get_passenger_from_header)) -> dict:
    return {"messages": chat_service.list_passenger_operator_messages(int(passenger["id"]), since)}


@router.post("/chat/operator")
def passenger_send_operator_chat(payload: PassengerOperatorChatSendIn, passenger: dict = Depends(auth_service.get_passenger_from_header)) -> dict:
    return {"message": chat_service.send_passenger_operator_message(passenger, payload.text)}
