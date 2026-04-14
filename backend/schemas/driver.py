from __future__ import annotations

from pydantic import BaseModel


class DriverPresenceIn(BaseModel):
    is_online: bool
    current_lat: float | None = None
    current_lon: float | None = None
    city: str | None = None


class DriverCancelRideIn(BaseModel):
    reason: str = ""
