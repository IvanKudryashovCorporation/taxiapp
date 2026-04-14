from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WaypointIn(BaseModel):
    address: str
    lat: float
    lon: float


class RideQuoteIn(BaseModel):
    pickup_address: str | None = None
    pickup_lat: float | None = None
    pickup_lon: float | None = None
    dropoff_address: str | None = None
    dropoff_lat: float | None = None
    dropoff_lon: float | None = None
    waypoints: list[WaypointIn] = Field(default_factory=list)
    comment: str = ""
    passengers_count: int = Field(default=1, ge=1, le=8)
    car_class: str = Field(default="econom")
    payment_method: str = Field(default="cash")
    scheduled_for: datetime | None = None
    promo_code: str | None = None


class RideCreateIn(RideQuoteIn):
    pass


class RideStatusUpdateIn(BaseModel):
    status: str = Field(min_length=3, max_length=32)


class RideCancelIn(BaseModel):
    reason: str = ""


class OperatorAssignIn(BaseModel):
    driver_id: int


class FeedbackIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    complaint_reason: str | None = None
    complaint_text: str = ""


class OrderLocationUpdateIn(BaseModel):
    lat: float
    lon: float
    heading: float | None = None
    city: str | None = None


class RideOrderView(BaseModel):
    id: int
    public_id: str
    status: str
    passenger_id: int
    driver_id: int | None
    pickup_address: str
    dropoff_address: str
    pickup_lat: float
    pickup_lon: float
    dropoff_lat: float
    dropoff_lon: float
    waypoints: list[dict[str, Any]]
    fare_total: float
    driver_payout_amount: float
    payment_method: str
    car_class: str
