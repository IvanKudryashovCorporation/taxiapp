from __future__ import annotations

from pydantic import BaseModel, Field


class PassengerRequestCodeIn(BaseModel):
    phone: str = Field(min_length=6, max_length=32)


class PassengerVerifyCodeIn(BaseModel):
    phone: str = Field(min_length=6, max_length=32)
    code: str = Field(min_length=4, max_length=8)


class DriverLoginIn(BaseModel):
    invite_code: str = Field(min_length=4, max_length=64)


class PingRequest(BaseModel):
    app_type: str = Field(pattern="^(driver|passenger)$")
    app_name: str = "desktop-client"
