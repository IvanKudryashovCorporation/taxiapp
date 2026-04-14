from __future__ import annotations

from typing import Any

import psycopg2.extras

from backend.core.utils import make_public_driver_id
from backend.database import execute, query, query_one, transaction


def create_driver(payload: dict[str, Any]) -> dict[str, Any]:
    with transaction() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO drivers(
                    invite_code,
                    phone,
                    full_name,
                    passport_data,
                    vehicle_make,
                    vehicle_model,
                    vehicle_plate,
                    vehicle_color,
                    documents_data,
                    service_class
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    payload["invite_code"],
                    payload.get("phone"),
                    payload["full_name"],
                    payload.get("passport_data", ""),
                    payload.get("vehicle_make", ""),
                    payload.get("vehicle_model", ""),
                    payload.get("vehicle_plate", ""),
                    payload.get("vehicle_color", ""),
                    psycopg2.extras.Json(payload.get("documents_data", {})),
                    payload.get("service_class", "econom"),
                ),
            )
            driver = dict(cur.fetchone())
            public_id = make_public_driver_id(int(driver["id"]))
            cur.execute(
                "UPDATE drivers SET public_id = %s WHERE id = %s RETURNING *",
                (public_id, driver["id"]),
            )
            return dict(cur.fetchone())


def list_drivers() -> list[dict[str, Any]]:
    return query(
        """
        SELECT
            d.*,
            (
                SELECT COUNT(*)
                FROM ride_orders ro
                WHERE ro.driver_id = d.id
                  AND ro.status IN (
                    'accepted',
                    'driver_on_the_way',
                    'driver_nearby_leave_now',
                    'arrived',
                    'ride_in_progress'
                  )
            ) AS active_orders
        FROM drivers d
        ORDER BY d.is_online DESC, d.updated_at DESC, d.id DESC
        """
    )


def update_driver_presence(driver_id: int, *, is_online: bool, lat: float | None, lon: float | None) -> dict[str, Any] | None:
    return query_one(
        """
        UPDATE drivers
        SET
            is_online = %s,
            current_lat = COALESCE(%s, current_lat),
            current_lon = COALESCE(%s, current_lon),
            last_location_at = CASE WHEN %s IS NOT NULL AND %s IS NOT NULL THEN NOW() ELSE last_location_at END,
            updated_at = NOW()
        WHERE id = %s
        RETURNING *
        """,
        (is_online, lat, lon, lat, lon, driver_id),
    )


def update_driver_location(driver_id: int, lat: float, lon: float) -> dict[str, Any] | None:
    return query_one(
        """
        UPDATE drivers
        SET
            current_lat = %s,
            current_lon = %s,
            last_location_at = NOW(),
            updated_at = NOW()
        WHERE id = %s
        RETURNING *
        """,
        (lat, lon, driver_id),
    )


def set_driver_banned(driver_id: int, is_banned: bool) -> dict[str, Any] | None:
    return query_one(
        """
        UPDATE drivers
        SET
            is_banned = %s,
            is_active = CASE WHEN %s THEN FALSE ELSE is_active END,
            is_online = CASE WHEN %s THEN FALSE ELSE is_online END,
            updated_at = NOW()
        WHERE id = %s
        RETURNING *
        """,
        (is_banned, is_banned, is_banned, driver_id),
    )


def record_balance_entry(
    driver_id: int,
    *,
    ride_order_id: int | None,
    entry_type: str,
    direction: str,
    payment_method: str | None,
    amount: float,
    comment: str,
) -> int:
    return execute(
        """
        INSERT INTO driver_balance_entries(
            driver_id,
            ride_order_id,
            type,
            direction,
            payment_method,
            amount,
            comment
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (driver_id, ride_order_id, entry_type, direction, payment_method, amount, comment),
    )


def get_driver_balance_summary(driver_id: int) -> dict[str, Any]:
    row = query_one(
        """
        SELECT
            COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0) AS balance,
            COALESCE(SUM(CASE WHEN direction = 'credit' AND payment_method IN ('card', 'cashless') THEN amount ELSE 0 END), 0) AS card_income,
            COALESCE(SUM(CASE WHEN direction = 'credit' AND payment_method IN ('card', 'cashless', 'sbp') THEN amount ELSE 0 END), 0) AS cashless_income,
            COALESCE(SUM(CASE WHEN direction = 'credit' AND payment_method = 'cash' THEN amount ELSE 0 END), 0) AS cash_income,
            COALESCE(SUM(CASE WHEN direction = 'credit' AND payment_method = 'sbp' THEN amount ELSE 0 END), 0) AS sbp_income,
            COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END), 0) AS debits
        FROM driver_balance_entries
        WHERE driver_id = %s
        """,
        (driver_id,),
    )
    return row or {"balance": 0, "card_income": 0, "cashless_income": 0, "cash_income": 0, "sbp_income": 0, "debits": 0}


def get_driver_balance_history(driver_id: int, limit: int = 50) -> list[dict[str, Any]]:
    return query(
        """
        SELECT *
        FROM driver_balance_entries
        WHERE driver_id = %s
        ORDER BY created_at DESC
        LIMIT %s
        """,
        (driver_id, limit),
    )
