from __future__ import annotations

from pydantic import BaseModel, Field

from backend.schemas.orders import RideCreateIn


class DriverCreateIn(BaseModel):
    full_name: str = Field(min_length=3, max_length=255)
    phone: str | None = Field(default=None, max_length=32)
    passport_data: str = ""
    vehicle_make: str = ""
    vehicle_model: str = ""
    vehicle_plate: str = ""
    vehicle_color: str = ""
    documents_data: dict = Field(default_factory=dict)
    service_class: str = Field(default="econom")


class ManualOrderCreateIn(RideCreateIn):
    passenger_phone: str = Field(min_length=6, max_length=32)
