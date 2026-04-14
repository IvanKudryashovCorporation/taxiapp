from __future__ import annotations

from typing import Any

import requests

from backend.core.utils import estimate_duration_seconds, haversine_meters

USER_AGENT = "rassvet-taxiapp/1.0"


def geocode_address(address: str) -> dict[str, Any]:
    response = requests.get(
        "https://nominatim.openstreetmap.org/search",
        headers={"User-Agent": USER_AGENT},
        params={"q": address, "format": "jsonv2", "limit": 1},
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json()
    if not payload:
        raise ValueError(f"Не удалось геокодировать адрес: {address}")
    item = payload[0]
    return {
        "address": item.get("display_name", address),
        "lat": float(item["lat"]),
        "lon": float(item["lon"]),
    }


def reverse_geocode(lat: float, lon: float) -> str:
    response = requests.get(
        "https://nominatim.openstreetmap.org/reverse",
        headers={"User-Agent": USER_AGENT},
        params={"lat": lat, "lon": lon, "format": "jsonv2"},
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json()
    return str(payload.get("display_name") or f"{lat:.5f}, {lon:.5f}")


def ensure_point(address: str | None, lat: float | None, lon: float | None) -> dict[str, Any]:
    if lat is not None and lon is not None:
        return {
            "address": address or reverse_geocode(lat, lon),
            "lat": float(lat),
            "lon": float(lon),
        }
    if address:
        return geocode_address(address)
    raise ValueError("Нужен адрес или координаты.")


def _point_geometry(points: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "type": "LineString",
        "coordinates": [[float(point["lon"]), float(point["lat"])] for point in points],
    }


def build_route(
    pickup: dict[str, Any],
    dropoff: dict[str, Any],
    waypoints: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    points = [pickup, *(waypoints or []), dropoff]
    coordinates = ";".join(f"{point['lon']},{point['lat']}" for point in points)
    url = f"https://router.project-osrm.org/route/v1/driving/{coordinates}"
    try:
        response = requests.get(
            url,
            params={"overview": "full", "geometries": "geojson", "steps": "false"},
            headers={"User-Agent": USER_AGENT},
            timeout=10,
        )
        response.raise_for_status()
        payload = response.json()
        routes = payload.get("routes") or []
        if routes:
            route = routes[0]
            return {
                "route_distance_meters": int(route.get("distance", 0)),
                "route_duration_seconds": int(route.get("duration", 0)),
                "route_geometry": route.get("geometry"),
            }
    except Exception:
        pass

    distance = 0
    for current, nxt in zip(points, points[1:]):
        distance += haversine_meters(
            float(current["lat"]),
            float(current["lon"]),
            float(nxt["lat"]),
            float(nxt["lon"]),
        )
    return {
        "route_distance_meters": distance,
        "route_duration_seconds": estimate_duration_seconds(distance),
        "route_geometry": _point_geometry(points),
    }
