from __future__ import annotations

from typing import Any

import psycopg2.extras

from backend.core.constants import ACTIVE_ORDER_STATUSES, ORDER_STATUS_SEARCHING
from backend.core.utils import make_public_order_id
from backend.database import execute, query, query_one, transaction

ORDER_SELECT = """
    SELECT
        ro.*,
        p.phone AS passenger_phone,
        d.public_id AS driver_public_id,
        d.full_name AS driver_full_name,
        d.vehicle_make,
        d.vehicle_model,
        d.vehicle_plate,
        d.vehicle_color,
        d.phone AS driver_phone,
        d.rating AS driver_rating,
        d.current_lat AS driver_current_lat,
        d.current_lon AS driver_current_lon
    FROM ride_orders ro
    JOIN passengers p ON p.id = ro.passenger_id
    LEFT JOIN drivers d ON d.id = ro.driver_id
"""


def get_order_by_id(order_id: int) -> dict[str, Any] | None:
    return query_one(f"{ORDER_SELECT} WHERE ro.id = %s", (order_id,))


def get_order_by_public_id(public_id: str) -> dict[str, Any] | None:
    return query_one(f"{ORDER_SELECT} WHERE ro.public_id = %s", (public_id,))


def get_active_order_for_passenger(passenger_id: int) -> dict[str, Any] | None:
    placeholders = ", ".join(["%s"] * len(ACTIVE_ORDER_STATUSES))
    return query_one(
        f"{ORDER_SELECT} WHERE ro.passenger_id = %s AND ro.status IN ({placeholders}) ORDER BY ro.id DESC LIMIT 1",
        (passenger_id, *ACTIVE_ORDER_STATUSES),
    )


def get_active_order_for_driver(driver_id: int) -> dict[str, Any] | None:
    placeholders = ", ".join(["%s"] * len(ACTIVE_ORDER_STATUSES))
    return query_one(
        f"{ORDER_SELECT} WHERE ro.driver_id = %s AND ro.status IN ({placeholders}) ORDER BY ro.id DESC LIMIT 1",
        (driver_id, *ACTIVE_ORDER_STATUSES),
    )


def list_searching_orders_for_driver(driver_id: int) -> list[dict[str, Any]]:
    return query(
        f"""
        {ORDER_SELECT}
        WHERE ro.status = %s
          AND ro.driver_id IS NULL
          AND NOT EXISTS (
              SELECT 1
              FROM ride_order_rejections rej
              WHERE rej.ride_order_id = ro.id
                AND rej.driver_id = %s
          )
        ORDER BY ro.created_at DESC
        """,
        (ORDER_STATUS_SEARCHING, driver_id),
    )


def list_orders(*, active_only: bool = False, limit: int = 200) -> list[dict[str, Any]]:
    if active_only:
        placeholders = ", ".join(["%s"] * len(ACTIVE_ORDER_STATUSES))
        return query(
            f"{ORDER_SELECT} WHERE ro.status IN ({placeholders}) ORDER BY ro.created_at DESC LIMIT %s",
            (*ACTIVE_ORDER_STATUSES, limit),
        )
    return query(f"{ORDER_SELECT} ORDER BY ro.created_at DESC LIMIT %s", (limit,))


def create_order(passenger_id: int, payload: dict[str, Any], pricing: dict[str, Any], *, created_source: str) -> dict[str, Any]:
    with transaction() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO ride_orders(
                    passenger_id,
                    status,
                    created_source,
                    pickup_address,
                    pickup_lat,
                    pickup_lon,
                    dropoff_address,
                    dropoff_lat,
                    dropoff_lon,
                    waypoints,
                    route_distance_meters,
                    route_duration_seconds,
                    route_geometry,
                    comment,
                    passengers_count,
                    car_class,
                    payment_method,
                    scheduled_for,
                    promo_code,
                    discount_amount,
                    fare_total,
                    fare_base,
                    fare_distance_component,
                    fare_time_component,
                    fare_demand_multiplier,
                    fare_weather_multiplier,
                    fare_night_multiplier,
                    fare_class_multiplier,
                    fare_extra_conditions_component,
                    service_commission_percent,
                    service_commission_amount,
                    driver_payout_amount
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                RETURNING *
                """,
                (
                    passenger_id,
                    ORDER_STATUS_SEARCHING,
                    created_source,
                    payload["pickup_address"],
                    payload["pickup_lat"],
                    payload["pickup_lon"],
                    payload["dropoff_address"],
                    payload["dropoff_lat"],
                    payload["dropoff_lon"],
                    psycopg2.extras.Json(payload.get("waypoints", [])),
                    pricing["route_distance_meters"],
                    pricing["route_duration_seconds"],
                    psycopg2.extras.Json(pricing.get("route_geometry")) if pricing.get("route_geometry") is not None else None,
                    payload.get("comment", ""),
                    payload.get("passengers_count", 1),
                    payload["car_class"],
                    payload["payment_method"],
                    payload.get("scheduled_for"),
                    payload.get("promo_code"),
                    pricing.get("discount_amount", 0),
                    pricing["fare_total"],
                    pricing["fare_base"],
                    pricing["fare_distance_component"],
                    pricing["fare_time_component"],
                    pricing["fare_demand_multiplier"],
                    pricing["fare_weather_multiplier"],
                    pricing["fare_night_multiplier"],
                    pricing["fare_class_multiplier"],
                    pricing["fare_extra_conditions_component"],
                    pricing["service_commission_percent"],
                    pricing["service_commission_amount"],
                    pricing["driver_payout_amount"],
                ),
            )
            order = dict(cur.fetchone())
            public_id = make_public_order_id(int(order["id"]))
            cur.execute(
                "UPDATE ride_orders SET public_id = %s WHERE id = %s RETURNING id",
                (public_id, order["id"]),
            )
            cur.execute(
                """
                INSERT INTO ride_order_events(ride_order_id, event_type, actor_type, actor_id, payload)
                VALUES (%s, 'created', 'passenger', %s, %s)
                """,
                (
                    order["id"],
                    str(passenger_id),
                    psycopg2.extras.Json(
                        {
                            "fare_total": pricing["fare_total"],
                            "car_class": payload["car_class"],
                            "payment_method": payload["payment_method"],
                        }
                    ),
                ),
            )
    return get_order_by_public_id(make_public_order_id(int(order["id"]))) or {}


def create_order_event(order_id: int, event_type: str, actor_type: str, actor_id: str, payload: dict[str, Any] | None = None) -> None:
    execute(
        """
        INSERT INTO ride_order_events(ride_order_id, event_type, actor_type, actor_id, payload)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (order_id, event_type, actor_type, actor_id, psycopg2.extras.Json(payload or {})),
    )


def reject_order(order_id: int, driver_id: int, reason: str = "") -> None:
    execute(
        """
        INSERT INTO ride_order_rejections(ride_order_id, driver_id, reason)
        VALUES (%s, %s, %s)
        ON CONFLICT (ride_order_id, driver_id) DO UPDATE
        SET reason = EXCLUDED.reason, created_at = NOW()
        """,
        (order_id, driver_id, reason),
    )


def accept_order(order_id: int, driver_id: int, *, driver_to_pickup_distance_meters: int, driver_to_pickup_duration_seconds: int) -> dict[str, Any] | None:
    with transaction() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM ride_orders WHERE id = %s FOR UPDATE", (order_id,))
            order = cur.fetchone()
            if not order:
                return None
            if order["driver_id"] is not None or order["status"] != ORDER_STATUS_SEARCHING:
                return None

            cur.execute(
                """
                UPDATE ride_orders
                SET
                    driver_id = %s,
                    status = 'accepted',
                    accepted_at = NOW(),
                    driver_to_pickup_distance_meters = %s,
                    driver_to_pickup_duration_seconds = %s,
                    updated_at = NOW()
                WHERE id = %s
                RETURNING id
                """,
                (driver_id, driver_to_pickup_distance_meters, driver_to_pickup_duration_seconds, order_id),
            )
            cur.execute(
                """
                INSERT INTO ride_order_events(ride_order_id, event_type, actor_type, actor_id, payload)
                VALUES (%s, 'accepted', 'driver', %s, %s)
                """,
                (
                    order_id,
                    str(driver_id),
                    psycopg2.extras.Json(
                        {
                            "driver_to_pickup_distance_meters": driver_to_pickup_distance_meters,
                            "driver_to_pickup_duration_seconds": driver_to_pickup_duration_seconds,
                        }
                    ),
                ),
            )
    return get_order_by_id(order_id)


def set_order_status(order_id: int, *, driver_id: int | None, status: str, cancellation_by: str | None = None, cancellation_reason: str | None = None) -> dict[str, Any] | None:
    fields = ["status = %s", "updated_at = NOW()"]
    params: list[Any] = [status]

    timestamp_field_map = {
        "accepted": "accepted_at",
        "arrived": "arrived_at",
        "ride_in_progress": "started_at",
        "completed": "completed_at",
        "cancelled": "cancelled_at",
    }
    if status in timestamp_field_map:
        fields.append(f"{timestamp_field_map[status]} = NOW()")
    if cancellation_by is not None:
        fields.append("cancellation_by = %s")
        params.append(cancellation_by)
    if cancellation_reason is not None:
        fields.append("cancellation_reason = %s")
        params.append(cancellation_reason)

    where = ["id = %s"]
    params.append(order_id)
    if driver_id is not None:
        where.append("driver_id = %s")
        params.append(driver_id)

    return query_one(
        f"""
        UPDATE ride_orders
        SET {", ".join(fields)}
        WHERE {" AND ".join(where)}
        RETURNING *
        """,
        tuple(params),
    )


def passenger_cancel_order(order_id: int, passenger_id: int, reason: str) -> dict[str, Any] | None:
    return query_one(
        """
        UPDATE ride_orders
        SET
            status = 'cancelled',
            cancellation_by = 'passenger',
            cancellation_reason = %s,
            cancelled_at = NOW(),
            updated_at = NOW()
        WHERE id = %s
          AND passenger_id = %s
          AND status <> 'completed'
          AND status <> 'cancelled'
        RETURNING *
        """,
        (reason, order_id, passenger_id),
    )


def operator_assign_order(order_id: int, driver_id: int) -> dict[str, Any] | None:
    return query_one(
        """
        UPDATE ride_orders
        SET
            driver_id = %s,
            status = 'accepted',
            accepted_at = COALESCE(accepted_at, NOW()),
            updated_at = NOW()
        WHERE id = %s
          AND status <> 'completed'
          AND status <> 'cancelled'
        RETURNING *
        """,
        (driver_id, order_id),
    )


def operator_unassign_order(order_id: int) -> dict[str, Any] | None:
    return query_one(
        """
        UPDATE ride_orders
        SET
            driver_id = NULL,
            status = 'searching_driver',
            updated_at = NOW()
        WHERE id = %s
          AND status <> 'completed'
          AND status <> 'cancelled'
        RETURNING *
        """,
        (order_id,),
    )


def operator_cancel_order(order_id: int, reason: str) -> dict[str, Any] | None:
    return query_one(
        """
        UPDATE ride_orders
        SET
            status = 'cancelled',
            cancellation_by = 'operator',
            cancellation_reason = %s,
            cancelled_at = NOW(),
            updated_at = NOW()
        WHERE id = %s
          AND status <> 'completed'
          AND status <> 'cancelled'
        RETURNING *
        """,
        (reason, order_id),
    )


def operator_complete_order(order_id: int) -> dict[str, Any] | None:
    return query_one(
        """
        UPDATE ride_orders
        SET
            status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = %s
          AND status <> 'completed'
          AND status <> 'cancelled'
        RETURNING *
        """,
        (order_id,),
    )


def save_feedback(order_id: int, passenger_id: int, driver_id: int, rating: int, complaint_reason: str | None, complaint_text: str) -> int:
    return execute(
        """
        INSERT INTO driver_feedback(ride_order_id, passenger_id, driver_id, rating, complaint_reason, complaint_text)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (ride_order_id) DO UPDATE
        SET rating = EXCLUDED.rating,
            complaint_reason = EXCLUDED.complaint_reason,
            complaint_text = EXCLUDED.complaint_text
        RETURNING id
        """,
        (order_id, passenger_id, driver_id, rating, complaint_reason, complaint_text),
    )


def list_passenger_history(passenger_id: int, limit: int = 30) -> list[dict[str, Any]]:
    return query(
        f"{ORDER_SELECT} WHERE ro.passenger_id = %s ORDER BY ro.created_at DESC LIMIT %s",
        (passenger_id, limit),
    )
