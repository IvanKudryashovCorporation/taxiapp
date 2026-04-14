from __future__ import annotations

import unittest
from datetime import datetime
from unittest.mock import patch

from backend.services import pricing_service


class PricingServiceTests(unittest.TestCase):
    def test_calculate_quote_applies_tariffs_discounts_and_commission(self) -> None:
        tariff = {
            "car_class": "comfort",
            "base_fare": 120.0,
            "per_km": 18.0,
            "per_minute": 6.0,
            "min_fare": 250.0,
            "class_multiplier": 1.1,
        }
        settings = {
            "night_multiplier": 1.5,
            "weather_multiplier": 1.0,
            "demand_multiplier": 1.0,
            "extra_passenger_fee": 50.0,
            "commission_percent": 5.0,
        }

        with patch("backend.services.pricing_service.pricing_repo.get_tariff", return_value=tariff), patch(
            "backend.services.pricing_service.pricing_repo.get_settings", return_value=settings
        ):
            quote = pricing_service.calculate_quote(
                route_distance_meters=10_000,
                route_duration_seconds=20 * 60,
                car_class="comfort",
                passengers_count=3,
                scheduled_for=datetime(2026, 4, 13, 23, 30, 0),
                promo_code="RASSVET",
            )

        self.assertEqual(quote["fare_total"], 693.0)
        self.assertEqual(quote["fare_extra_conditions_component"], 100.0)
        self.assertEqual(quote["fare_night_multiplier"], 1.5)
        self.assertEqual(quote["fare_class_multiplier"], 1.1)
        self.assertEqual(quote["service_commission_amount"], 34.65)
        self.assertEqual(quote["driver_payout_amount"], 658.35)


if __name__ == "__main__":
    unittest.main()
