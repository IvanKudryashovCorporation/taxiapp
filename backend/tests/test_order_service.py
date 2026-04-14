from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi import HTTPException

from backend.core.constants import ORDER_STATUS_ACCEPTED, ORDER_STATUS_SEARCHING
from backend.services import order_service


class OrderServiceTests(unittest.TestCase):
    def test_operator_cannot_assign_offline_driver(self) -> None:
        order = {"id": 51, "public_id": "ORD-0051", "status": ORDER_STATUS_SEARCHING}
        driver = {"id": 9, "is_online": False, "is_active": True, "is_banned": False}

        with patch("backend.services.order_service.order_repo.get_order_by_public_id", return_value=order), patch(
            "backend.services.order_service.auth_repo.get_driver_by_id", return_value=driver
        ), patch(
            "backend.services.order_service.order_repo.operator_assign_order"
        ) as operator_assign_order:
            with self.assertRaises(HTTPException) as ctx:
                order_service.operator_assign("ORD-0051", 9)

        self.assertEqual(ctx.exception.status_code, 409)
        operator_assign_order.assert_not_called()

    def test_build_quote_normalizes_legacy_cashless_payment_method(self) -> None:
        payload = {
            "pickup_address": "Точка А",
            "pickup_lat": 55.75,
            "pickup_lon": 37.61,
            "dropoff_address": "Точка Б",
            "dropoff_lat": 55.76,
            "dropoff_lon": 37.62,
            "payment_method": "cashless",
        }

        with patch(
            "backend.services.order_service.geo_service.build_route",
            return_value={"route_distance_meters": 1000, "route_duration_seconds": 300, "route_geometry": None},
        ), patch(
            "backend.services.order_service.pricing_service.calculate_quote",
            return_value={
                "route_distance_meters": 1000,
                "route_duration_seconds": 300,
                "fare_total": 250.0,
                "fare_base": 100.0,
                "fare_distance_component": 80.0,
                "fare_time_component": 20.0,
                "fare_demand_multiplier": 1.0,
                "fare_weather_multiplier": 1.0,
                "fare_night_multiplier": 1.0,
                "fare_class_multiplier": 1.0,
                "fare_extra_conditions_component": 0.0,
                "service_commission_percent": 5.0,
                "service_commission_amount": 12.5,
                "driver_payout_amount": 237.5,
                "discount_amount": 0.0,
            },
        ):
            quote = order_service.build_quote(payload)

        self.assertEqual(quote["payment_method"], "card")

    def test_build_quote_passes_waypoints_to_route_builder(self) -> None:
        payload = {
            "pickup_address": "Точка А",
            "pickup_lat": 55.75,
            "pickup_lon": 37.61,
            "dropoff_address": "Точка Б",
            "dropoff_lat": 55.76,
            "dropoff_lon": 37.62,
            "waypoints": [
                {"address": "Точка С", "lat": 55.755, "lon": 37.615},
                {"address": "Точка D", "lat": 55.758, "lon": 37.618},
            ],
        }

        with patch(
            "backend.services.order_service.geo_service.build_route",
            return_value={"route_distance_meters": 2000, "route_duration_seconds": 500, "route_geometry": None},
        ) as build_route, patch(
            "backend.services.order_service.pricing_service.calculate_quote",
            return_value={
                "route_distance_meters": 2000,
                "route_duration_seconds": 500,
                "fare_total": 320.0,
                "fare_base": 100.0,
                "fare_distance_component": 150.0,
                "fare_time_component": 30.0,
                "fare_demand_multiplier": 1.0,
                "fare_weather_multiplier": 1.0,
                "fare_night_multiplier": 1.0,
                "fare_class_multiplier": 1.0,
                "fare_extra_conditions_component": 0.0,
                "service_commission_percent": 5.0,
                "service_commission_amount": 16.0,
                "driver_payout_amount": 304.0,
                "discount_amount": 0.0,
            },
        ):
            order_service.build_quote(payload)

        self.assertEqual(len(build_route.call_args.args[2]), 2)
        self.assertEqual(build_route.call_args.args[2][0]["address"], "Точка С")

    def test_driver_cannot_skip_status_chain(self) -> None:
        driver = {"id": 7, "public_id": "DR-0007"}
        order = {"id": 11, "driver_id": 7, "status": ORDER_STATUS_ACCEPTED}

        with patch("backend.services.order_service.order_repo.get_order_by_public_id", return_value=order), patch(
            "backend.services.order_service.order_repo.set_order_status"
        ) as set_order_status:
            with self.assertRaises(HTTPException) as ctx:
                order_service.update_driver_status(driver, "ORD-0011", "completed")

        self.assertEqual(ctx.exception.status_code, 400)
        set_order_status.assert_not_called()

    def test_driver_cancel_reopens_order_and_records_penalty(self) -> None:
        driver = {"id": 7, "public_id": "DR-0007"}
        order = {
            "id": 25,
            "driver_id": 7,
            "status": ORDER_STATUS_ACCEPTED,
            "fare_total": 350.0,
            "public_id": "ORD-0025",
            "payment_method": "cash",
        }
        reopened = {"id": 25, "public_id": "ORD-0025", "status": ORDER_STATUS_SEARCHING, "driver_id": None}

        with patch("backend.services.order_service.order_repo.get_order_by_public_id", return_value=order), patch(
            "backend.services.order_service.driver_repo.record_balance_entry"
        ) as record_balance_entry, patch(
            "backend.services.order_service.order_repo.operator_unassign_order", return_value=reopened
        ), patch(
            "backend.services.order_service.order_repo.create_order_event"
        ), patch(
            "backend.services.order_service.order_repo.get_order_by_id", return_value=reopened
        ), patch(
            "backend.services.order_service.stats_repo.get_operator_dashboard", return_value={}
        ), patch(
            "backend.services.order_service.emit_order_event"
        ), patch(
            "backend.services.order_service.emit_dashboard_refresh"
        ):
            result = order_service.cancel_by_driver(driver, "ORD-0025", "driver_cancelled")

        self.assertEqual(result["status"], ORDER_STATUS_SEARCHING)
        record_balance_entry.assert_called_once()
        self.assertEqual(record_balance_entry.call_args.kwargs["entry_type"], "driver_penalty")
        self.assertEqual(record_balance_entry.call_args.kwargs["direction"], "debit")
        self.assertEqual(record_balance_entry.call_args.kwargs["amount"], 700.0)

    def test_operator_cannot_assign_busy_driver(self) -> None:
        order = {"id": 52, "public_id": "ORD-0052", "status": ORDER_STATUS_SEARCHING}
        driver = {"id": 10, "is_online": True, "is_active": True, "is_banned": False}
        active_order = {"id": 53, "public_id": "ORD-0053", "status": ORDER_STATUS_ACCEPTED}

        with patch("backend.services.order_service.order_repo.get_order_by_public_id", return_value=order), patch(
            "backend.services.order_service.auth_repo.get_driver_by_id", return_value=driver
        ), patch(
            "backend.services.order_service.order_repo.get_active_order_for_driver", return_value=active_order
        ), patch(
            "backend.services.order_service.order_repo.operator_assign_order"
        ) as operator_assign_order:
            with self.assertRaises(HTTPException) as ctx:
                order_service.operator_assign("ORD-0052", 10)

        self.assertEqual(ctx.exception.status_code, 409)
        operator_assign_order.assert_not_called()


if __name__ == "__main__":
    unittest.main()
