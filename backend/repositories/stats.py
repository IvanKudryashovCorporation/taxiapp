from __future__ import annotations

from typing import Any

from backend.database import query, query_one


def get_operator_dashboard() -> dict[str, Any]:
    return query_one(
        """
        WITH today_orders AS (
            SELECT *
            FROM ride_orders
            WHERE created_at >= date_trunc('day', NOW())
        ),
        online_drivers AS (
            SELECT COUNT(*) AS value
            FROM drivers
            WHERE is_online = TRUE
              AND is_banned = FALSE
              AND is_active = TRUE
        )
        SELECT
            (SELECT COUNT(*) FROM today_orders) AS orders_today,
            (SELECT COUNT(*) FROM today_orders WHERE status = 'cancelled') AS cancelled_today,
            (SELECT COUNT(*) FROM ride_orders WHERE status IN ('searching_driver','accepted','driver_on_the_way','driver_nearby_leave_now','arrived','ride_in_progress')) AS active_orders,
            (SELECT value FROM online_drivers) AS online_drivers,
            (SELECT COUNT(*) FROM drivers WHERE is_active = TRUE AND is_banned = FALSE) AS active_drivers,
            (SELECT COALESCE(AVG(driver_to_pickup_duration_seconds), 0) FROM ride_orders WHERE accepted_at >= date_trunc('day', NOW())) AS avg_pickup_seconds,
            (SELECT COALESCE(AVG(fare_total), 0) FROM today_orders WHERE status = 'completed') AS avg_check,
            (SELECT COALESCE(SUM(fare_total), 0) FROM today_orders WHERE status = 'completed') AS revenue_today,
            (SELECT COUNT(*) FROM driver_feedback WHERE created_at >= date_trunc('day', NOW())) AS complaints_today
        """
    ) or {}


def get_order_status_breakdown() -> list[dict[str, Any]]:
    return query(
        """
        SELECT status, COUNT(*) AS count
        FROM ride_orders
        GROUP BY status
        ORDER BY status
        """
    )


def list_feedback(limit: int = 100) -> list[dict[str, Any]]:
    return query(
        """
        SELECT
            df.*,
            d.public_id AS driver_public_id,
            d.full_name AS driver_full_name,
            p.phone AS passenger_phone,
            ro.public_id AS order_public_id
        FROM driver_feedback df
        JOIN drivers d ON d.id = df.driver_id
        JOIN passengers p ON p.id = df.passenger_id
        JOIN ride_orders ro ON ro.id = df.ride_order_id
        ORDER BY df.created_at DESC
        LIMIT %s
        """,
        (limit,),
    )


def get_driver_stats(driver_id: int) -> dict[str, Any]:
    return query_one(
        """
        SELECT
            COALESCE(COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '1 day'), 0) AS rides_day,
            COALESCE(COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '7 day'), 0) AS rides_week,
            COALESCE(COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '30 day'), 0) AS rides_month,
            COALESCE(SUM(driver_payout_amount) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '1 day'), 0) AS earnings_day,
            COALESCE(SUM(driver_payout_amount) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '7 day'), 0) AS earnings_week,
            COALESCE(SUM(driver_payout_amount) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '30 day'), 0) AS earnings_month,
            COALESCE(COUNT(*) FILTER (WHERE cancellation_by = 'driver' AND cancelled_at >= NOW() - INTERVAL '30 day'), 0) AS driver_cancellations
        FROM ride_orders
        WHERE driver_id = %s
        """,
        (driver_id,),
    ) or {}
