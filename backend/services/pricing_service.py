from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import HTTPException

from backend.core.constants import CAR_CLASSES
from backend.core.utils import money_round
from backend.repositories import pricing as pricing_repo


def calculate_quote(
    *,
    route_distance_meters: int,
    route_duration_seconds: int,
    car_class: str,
    passengers_count: int,
    scheduled_for: datetime | None,
    promo_code: str | None,
) -> dict[str, Any]:
    if car_class not in CAR_CLASSES:
        raise HTTPException(status_code=400, detail="Неверный класс машины.")

    tariff = pricing_repo.get_tariff(car_class)
    if not tariff:
        raise HTTPException(status_code=500, detail=f"Тариф {car_class} не найден.")
    settings = pricing_repo.get_settings()

    distance_km = max(route_distance_meters, 0) / 1000.0
    duration_minutes = max(route_duration_seconds, 0) / 60.0

    fare_base = float(tariff["base_fare"])
    fare_distance_component = distance_km * float(tariff["per_km"])
    fare_time_component = duration_minutes * float(tariff["per_minute"])

    target_dt = scheduled_for or datetime.now()
    hour = target_dt.hour
    fare_night_multiplier = float(settings.get("night_multiplier", 1.0)) if hour >= 23 or hour < 6 else 1.0
    fare_weather_multiplier = float(settings.get("weather_multiplier", 1.0))
    fare_demand_multiplier = float(settings.get("demand_multiplier", 1.0))
    fare_class_multiplier = float(tariff["class_multiplier"])

    extra_passengers = max(passengers_count - 1, 0)
    fare_extra_conditions_component = float(settings.get("extra_passenger_fee", 50.0)) * extra_passengers

    subtotal = (fare_base + fare_distance_component + fare_time_component) * fare_night_multiplier
    subtotal *= fare_weather_multiplier
    subtotal *= fare_demand_multiplier
    subtotal *= fare_class_multiplier
    subtotal += fare_extra_conditions_component

    minimum_fare = float(tariff["min_fare"])
    subtotal = max(subtotal, minimum_fare)

    discount_amount = 0.0
    if promo_code:
        discount_amount = min(100.0, subtotal * 0.15)

    fare_total = max(subtotal - discount_amount, minimum_fare * 0.8)
    service_commission_percent = float(settings.get("commission_percent", 5.0))
    service_commission_amount = fare_total * service_commission_percent / 100.0
    driver_payout_amount = fare_total - service_commission_amount

    return {
        "route_distance_meters": int(route_distance_meters),
        "route_duration_seconds": int(route_duration_seconds),
        "fare_total": money_round(fare_total),
        "fare_base": money_round(fare_base),
        "fare_distance_component": money_round(fare_distance_component),
        "fare_time_component": money_round(fare_time_component),
        "fare_demand_multiplier": float(fare_demand_multiplier),
        "fare_weather_multiplier": float(fare_weather_multiplier),
        "fare_night_multiplier": float(fare_night_multiplier),
        "fare_class_multiplier": float(fare_class_multiplier),
        "fare_extra_conditions_component": money_round(fare_extra_conditions_component),
        "service_commission_percent": money_round(service_commission_percent),
        "service_commission_amount": money_round(service_commission_amount),
        "driver_payout_amount": money_round(driver_payout_amount),
        "discount_amount": money_round(discount_amount),
    }
