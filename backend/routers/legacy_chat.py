from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.schemas.chat import LegacyChatRegisterDriverRequest, LegacyChatSendRequest
from backend.services import chat_service, operator_service

router = APIRouter(tags=["legacy"])


def _normalize_driver_id(raw_driver_id: str) -> str:
    driver_id = raw_driver_id.strip().upper()
    if not driver_id:
        raise HTTPException(status_code=400, detail="driver_id is required")
    return driver_id


@router.post("/api/chat/register-driver")
def chat_register_driver(req: LegacyChatRegisterDriverRequest) -> dict:
    return chat_service.legacy_register_driver(_normalize_driver_id(req.driver_id))


@router.post("/api/chat/send")
def chat_send(req: LegacyChatSendRequest) -> dict:
    return chat_service.legacy_send_message(_normalize_driver_id(req.driver_id), req.sender, req.text)


@router.get("/api/chat/messages/{driver_id}")
def chat_messages(driver_id: str, since: int = 0) -> dict:
    return chat_service.legacy_list_messages(_normalize_driver_id(driver_id), max(0, int(since)))


@router.get("/api/chat/drivers")
def chat_drivers() -> dict:
    items = operator_service.list_drivers()
    return {"drivers": [str(item["public_id"]) for item in items if item.get("public_id")]}
