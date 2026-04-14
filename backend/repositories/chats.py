from __future__ import annotations

from typing import Any

from backend.core.constants import CHAT_KIND_OPERATOR, CHAT_KIND_RIDE
from backend.database import execute, query, query_one


def create_chat_message(
    *,
    chat_kind: str,
    driver_public_id: str | None,
    ride_order_id: int | None,
    sender_type: str,
    sender_id: str,
    receiver_type: str,
    receiver_id: str,
    text: str,
) -> dict[str, Any]:
    message_id = execute(
        """
        INSERT INTO chat_messages(
            driver_id,
            sender,
            text,
            time_utc,
            ride_order_id,
            chat_kind,
            sender_type,
            sender_id,
            receiver_type,
            receiver_id,
            message_text,
            created_at
        )
        VALUES (%s, %s, %s, NOW()::text, %s, %s, %s, %s, %s, %s, %s, NOW())
        RETURNING id
        """,
        (
            driver_public_id,
            "driver" if sender_type == "driver" else "admin",
            text,
            ride_order_id,
            chat_kind,
            sender_type,
            sender_id,
            receiver_type,
            receiver_id,
            text,
        ),
    )
    return get_message(message_id) or {}


def get_message(message_id: int) -> dict[str, Any] | None:
    return query_one(
        """
        SELECT
            id,
            ride_order_id,
            chat_kind,
            sender_type,
            sender_id,
            receiver_type,
            receiver_id,
            message_text AS text,
            created_at
        FROM chat_messages
        WHERE id = %s
        """,
        (message_id,),
    )


def list_operator_messages(driver_public_id: str, since_id: int = 0) -> list[dict[str, Any]]:
    return query(
        """
        SELECT
            id,
            driver_id,
            sender_type,
            sender_id,
            receiver_type,
            receiver_id,
            message_text AS text,
            created_at
        FROM chat_messages
        WHERE chat_kind = %s
          AND driver_id = %s
          AND id > %s
        ORDER BY id ASC
        """,
        (CHAT_KIND_OPERATOR, driver_public_id, since_id),
    )


def list_ride_messages(order_id: int, since_id: int = 0) -> list[dict[str, Any]]:
    return query(
        """
        SELECT
            id,
            ride_order_id,
            sender_type,
            sender_id,
            receiver_type,
            receiver_id,
            message_text AS text,
            created_at
        FROM chat_messages
        WHERE chat_kind = %s
          AND ride_order_id = %s
          AND id > %s
        ORDER BY id ASC
        """,
        (CHAT_KIND_RIDE, order_id, since_id),
    )


def list_operator_chat_heads() -> list[dict[str, Any]]:
    return query(
        """
        SELECT
            d.public_id,
            d.full_name,
            d.is_online,
            MAX(cm.created_at) AS last_message_at
        FROM drivers d
        LEFT JOIN chat_messages cm
            ON cm.driver_id = d.public_id
           AND cm.chat_kind = %s
        GROUP BY d.id, d.public_id, d.full_name, d.is_online
        ORDER BY last_message_at DESC NULLS LAST, d.public_id ASC
        """,
        (CHAT_KIND_OPERATOR,),
    )
