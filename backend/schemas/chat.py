from __future__ import annotations

from pydantic import BaseModel, Field


class OperatorChatSendIn(BaseModel):
    driver_public_id: str = Field(min_length=1, max_length=64)
    text: str = Field(min_length=1, max_length=2000)


class DriverOperatorChatSendIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class RideChatSendIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class PassengerOperatorChatSendIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class OperatorToPassengerChatSendIn(BaseModel):
    passenger_id: int
    text: str = Field(min_length=1, max_length=2000)


class LegacyChatSendRequest(BaseModel):
    driver_id: str = Field(min_length=1, max_length=64)
    sender: str = Field(pattern="^(driver|admin)$")
    text: str = Field(min_length=1, max_length=1000)


class LegacyChatRegisterDriverRequest(BaseModel):
    driver_id: str = Field(min_length=1, max_length=64)
    source: str = "driver_app"
