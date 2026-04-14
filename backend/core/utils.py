from __future__ import annotations

import math
import random
import secrets
import string
from datetime import datetime, timedelta, timezone

from backend.core.constants import PAYMENT_CARD, PAYMENT_CASH, PAYMENT_SBP


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def utcnow_iso() -> str:
    return utcnow().isoformat()


def make_sms_code(length: int = 4) -> str:
    digits = string.digits
    return "".join(random.choice(digits) for _ in range(length))


def make_invite_code() -> str:
    return "RASSVET-" + "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))


def make_session_token() -> str:
    return secrets.token_urlsafe(32)


def session_expiration(hours: int) -> datetime:
    return utcnow() + timedelta(hours=hours)


def make_public_driver_id(driver_id: int) -> str:
    return f"DR-{driver_id:05d}"


def make_public_order_id(order_id: int) -> str:
    return f"ORD-{order_id:06d}"


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    radius = 6_371_000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return int(radius * c)


def estimate_duration_seconds(distance_meters: int, city_speed_kmh: float = 28.0) -> int:
    meters_per_second = max(city_speed_kmh, 5.0) * 1000 / 3600
    return int(distance_meters / meters_per_second)


def money_round(value: float) -> float:
    return round(float(value) + 1e-9, 2)


def normalize_payment_method(value: str | None) -> str:
    raw = (value or "").strip().lower()
    aliases = {
        "": PAYMENT_CASH,
        "cash": PAYMENT_CASH,
        "card": PAYMENT_CARD,
        "cashless": PAYMENT_CARD,
        "noncash": PAYMENT_CARD,
        "безнал": PAYMENT_CARD,
        "безналичные": PAYMENT_CARD,
        "sbp": PAYMENT_SBP,
        "сбп": PAYMENT_SBP,
    }
    return aliases.get(raw, PAYMENT_CASH)
