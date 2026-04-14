from __future__ import annotations

import re
from typing import Any

from fastapi import Header, HTTPException

from backend.core.constants import DEFAULT_SMS_CODE, SESSION_TTL_HOURS
from backend.core.utils import make_session_token, session_expiration
from backend.repositories import auth as auth_repo

_PHONE_RE = re.compile(r"[^\d+]+")


def normalize_phone(phone: str) -> str:
    normalized = _PHONE_RE.sub("", phone).strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="Телефон не указан.")
    if not normalized.startswith("+"):
        normalized = "+" + normalized
    return normalized


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Требуется Authorization: Bearer <token>.")
    prefix = "Bearer "
    if not authorization.startswith(prefix):
        raise HTTPException(status_code=401, detail="Неверный формат Authorization заголовка.")
    token = authorization[len(prefix) :].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Токен пустой.")
    return token


def request_passenger_code(phone: str) -> dict[str, Any]:
    normalized_phone = normalize_phone(phone)
    auth_repo.get_or_create_passenger(normalized_phone)
    code = DEFAULT_SMS_CODE
    auth_repo.create_sms_code(normalized_phone, code, session_expiration(1))
    return {
        "ok": True,
        "phone": normalized_phone,
        "test_code": code,
        "message": "Тестовый код создан. Архитектура готова к подключению SMS-провайдера.",
    }


def verify_passenger_code(phone: str, code: str) -> dict[str, Any]:
    normalized_phone = normalize_phone(phone)
    sms_code = auth_repo.get_valid_sms_code(normalized_phone, code.strip())
    if not sms_code:
        raise HTTPException(status_code=400, detail="Неверный или просроченный код.")

    auth_repo.mark_sms_code_used(int(sms_code["id"]))
    passenger = auth_repo.get_or_create_passenger(normalized_phone)
    token = make_session_token()
    auth_repo.create_session(
        token,
        "passenger",
        int(passenger["id"]),
        session_expiration(SESSION_TTL_HOURS),
    )
    return {"ok": True, "token": token, "passenger": passenger}


def driver_login(invite_code: str) -> dict[str, Any]:
    normalized = invite_code.strip().upper()
    if not normalized:
        raise HTTPException(status_code=400, detail="Пригласительный код пустой.")

    driver = auth_repo.get_driver_by_invite_code(normalized)
    if not driver:
        raise HTTPException(status_code=404, detail="Водитель с таким кодом не найден.")
    if not driver["is_active"] or driver["is_banned"]:
        raise HTTPException(status_code=403, detail="Водитель заблокирован или не активирован.")

    token = make_session_token()
    auth_repo.create_session(
        token,
        "driver",
        int(driver["id"]),
        session_expiration(SESSION_TTL_HOURS),
    )
    return {"ok": True, "token": token, "driver": driver}


def get_actor_from_token(token: str, actor_type: str | None = None) -> dict[str, Any]:
    session = auth_repo.get_session(token)
    if not session:
        raise HTTPException(status_code=401, detail="Сессия не найдена или истекла.")
    if actor_type and session["actor_type"] != actor_type:
        raise HTTPException(status_code=403, detail="Неверный тип сессии.")
    return session


def get_passenger_from_header(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    token = _extract_bearer_token(authorization)
    session = get_actor_from_token(token, "passenger")
    passenger = auth_repo.get_passenger_by_id(int(session["actor_id"]))
    if not passenger:
        raise HTTPException(status_code=404, detail="Пассажир не найден.")
    return passenger


def get_driver_from_header(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    token = _extract_bearer_token(authorization)
    session = get_actor_from_token(token, "driver")
    driver = auth_repo.get_driver_by_id(int(session["actor_id"]))
    if not driver:
        raise HTTPException(status_code=404, detail="Водитель не найден.")
    return driver


def get_driver_from_ws_token(token: str) -> dict[str, Any]:
    session = get_actor_from_token(token, "driver")
    driver = auth_repo.get_driver_by_id(int(session["actor_id"]))
    if not driver:
        raise HTTPException(status_code=404, detail="Водитель не найден.")
    return driver


def get_passenger_from_ws_token(token: str) -> dict[str, Any]:
    session = get_actor_from_token(token, "passenger")
    passenger = auth_repo.get_passenger_by_id(int(session["actor_id"]))
    if not passenger:
        raise HTTPException(status_code=404, detail="Пассажир не найден.")
    return passenger
