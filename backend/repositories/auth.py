from __future__ import annotations

from datetime import datetime
from typing import Any

from backend.database import execute, query, query_one


def get_or_create_passenger(phone: str) -> dict[str, Any]:
    row = query_one("SELECT * FROM passengers WHERE phone = %s", (phone,))
    if row:
        return row

    passenger_id = execute(
        """
        INSERT INTO passengers(phone)
        VALUES (%s)
        RETURNING id
        """,
        (phone,),
    )
    return query_one("SELECT * FROM passengers WHERE id = %s", (passenger_id,)) or {}


def create_sms_code(phone: str, code: str, expires_at: datetime) -> int:
    return execute(
        """
        INSERT INTO sms_codes(phone, code, expires_at)
        VALUES (%s, %s, %s)
        RETURNING id
        """,
        (phone, code, expires_at),
    )


def get_valid_sms_code(phone: str, code: str) -> dict[str, Any] | None:
    return query_one(
        """
        SELECT *
        FROM sms_codes
        WHERE phone = %s
          AND code = %s
          AND used_at IS NULL
          AND expires_at >= NOW()
        ORDER BY id DESC
        LIMIT 1
        """,
        (phone, code),
    )


def mark_sms_code_used(code_id: int) -> None:
    execute("UPDATE sms_codes SET used_at = NOW() WHERE id = %s", (code_id,))


def create_session(token: str, actor_type: str, actor_id: int, expires_at: datetime | None) -> dict[str, Any]:
    execute(
        """
        INSERT INTO sessions(token, actor_type, actor_id, expires_at)
        VALUES (%s, %s, %s, %s)
        """,
        (token, actor_type, actor_id, expires_at),
    )
    return get_session(token) or {}


def get_session(token: str) -> dict[str, Any] | None:
    return query_one(
        """
        SELECT *
        FROM sessions
        WHERE token = %s
          AND (expires_at IS NULL OR expires_at >= NOW())
        """,
        (token,),
    )


def get_driver_by_invite_code(invite_code: str) -> dict[str, Any] | None:
    return query_one(
        """
        SELECT *
        FROM drivers
        WHERE invite_code = %s
        """,
        (invite_code,),
    )


def get_driver_by_public_id(public_id: str) -> dict[str, Any] | None:
    return query_one("SELECT * FROM drivers WHERE public_id = %s", (public_id,))


def get_passenger_by_id(passenger_id: int) -> dict[str, Any] | None:
    return query_one("SELECT * FROM passengers WHERE id = %s", (passenger_id,))


def get_driver_by_id(driver_id: int) -> dict[str, Any] | None:
    return query_one("SELECT * FROM drivers WHERE id = %s", (driver_id,))
