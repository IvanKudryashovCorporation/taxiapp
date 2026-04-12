from __future__ import annotations

from dataclasses import dataclass
from threading import Event
from typing import Any

import requests


@dataclass(slots=True)
class GeoLocation:
    latitude: float
    longitude: float
    city: str
    source: str


DEFAULT_LOCATION = GeoLocation(
    latitude=55.7558,
    longitude=37.6176,
    city="Москва",
    source="fallback",
)


def get_device_location(timeout: float = 6.0) -> GeoLocation:
    """Try to read device GPS coordinates via plyer on mobile builds."""

    try:
        from kivy.utils import platform as kivy_platform
    except Exception:
        kivy_platform = ""

    if kivy_platform not in {"android", "ios"}:
        raise RuntimeError("GPS provider is unsupported on this platform")

    try:
        from plyer import gps
    except Exception as exc:  # pragma: no cover - platform dependent
        raise RuntimeError("GPS provider is unavailable") from exc

    result: dict[str, Any] = {}
    ready = Event()

    def on_location(**kwargs):  # type: ignore[no-untyped-def]
        result.update(kwargs)
        ready.set()

    def on_status(_stype=None, _status=None):  # type: ignore[no-untyped-def]
        return None

    try:
        gps.configure(on_location=on_location, on_status=on_status)
        gps.start(minTime=1000, minDistance=0)
    except Exception as exc:  # pragma: no cover - platform dependent
        raise RuntimeError("GPS start failed") from exc

    got_fix = ready.wait(timeout)

    try:
        gps.stop()
    except Exception:
        pass

    if not got_fix:
        raise RuntimeError("GPS fix timeout")

    latitude = result.get("lat", result.get("latitude"))
    longitude = result.get("lon", result.get("longitude"))

    if latitude is None or longitude is None:
        raise RuntimeError("GPS did not return coordinates")

    city = reverse_city(float(latitude), float(longitude), timeout=6.0)
    return GeoLocation(float(latitude), float(longitude), city, "gps")


def get_network_location(timeout: float = 7.0) -> GeoLocation:
    """Get approximate location via network/IP when GPS is unavailable."""

    headers = {"User-Agent": "rassvet-driver/1.0 (+desktop)"}
    providers: list[tuple[str, str, str, str]] = [
        ("https://ipapi.co/json/", "latitude", "longitude", "city"),
        ("https://ipwho.is/", "latitude", "longitude", "city"),
    ]

    last_error: Exception | None = None
    for url, lat_key, lon_key, city_key in providers:
        try:
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            data: dict[str, Any] = response.json()

            latitude = data.get(lat_key)
            longitude = data.get(lon_key)
            city = data.get(city_key) or "Неизвестный город"

            if latitude is None or longitude is None:
                raise ValueError(f"Provider {url} did not return coordinates")

            return GeoLocation(float(latitude), float(longitude), str(city), "network")
        except Exception as exc:
            last_error = exc

    raise RuntimeError("All network location providers failed") from last_error


def get_best_location() -> GeoLocation:
    """GPS first, then network geolocation, then fallback."""

    try:
        return get_device_location()
    except Exception:
        pass

    try:
        return get_network_location()
    except Exception:
        return DEFAULT_LOCATION


def reverse_city(latitude: float, longitude: float, timeout: float = 8.0) -> str:
    """Resolve city name by coordinates using OpenStreetMap Nominatim."""

    headers = {"User-Agent": "rassvet-driver/1.0 (+desktop)"}
    params = {
        "format": "jsonv2",
        "lat": latitude,
        "lon": longitude,
        "zoom": 10,
        "addressdetails": 1,
    }

    response = requests.get(
        "https://nominatim.openstreetmap.org/reverse",
        headers=headers,
        params=params,
        timeout=timeout,
    )
    response.raise_for_status()
    payload: dict[str, Any] = response.json()

    address = payload.get("address", {})
    for key in ("city", "town", "village", "municipality", "state"):
        value = address.get(key)
        if value:
            return str(value)

    return "Неизвестный город"
