from __future__ import annotations

from fastapi import APIRouter

from backend.schemas.auth import DriverLoginIn, PassengerRequestCodeIn, PassengerVerifyCodeIn
from backend.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/passenger/request-code")
def passenger_request_code(payload: PassengerRequestCodeIn) -> dict:
    return auth_service.request_passenger_code(payload.phone)


@router.post("/passenger/verify-code")
def passenger_verify_code(payload: PassengerVerifyCodeIn) -> dict:
    return auth_service.verify_passenger_code(payload.phone, payload.code)


@router.post("/driver/login")
def driver_login(payload: DriverLoginIn) -> dict:
    return auth_service.driver_login(payload.invite_code)
