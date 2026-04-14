from __future__ import annotations

import logging
import os
import socket
import traceback
from concurrent.futures import TimeoutError, as_completed
from threading import Lock, Thread
from time import time
from urllib.parse import urlparse

from kivy.clock import Clock
from kivy.graphics import Color, Line
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.label import Label
from requests import RequestException

from driver_app.services.location import DEFAULT_LOCATION, get_best_location
from driver_app.ui.map_panel import _CAR_ICON

try:
    from kivy_garden.mapview import MapLayer, MapMarker, MapSource, MapView

    MAPVIEW_AVAILABLE = True
except Exception:
    MAPVIEW_AVAILABLE = False
    MapView = object  # type: ignore[assignment,misc]
    MapSource = object  # type: ignore[assignment,misc]
    MapMarker = object  # type: ignore[assignment,misc]
    MapLayer = object  # type: ignore[assignment,misc]


def _parse_proxy_host_port(proxy_value: str) -> tuple[str, int] | None:
    raw = proxy_value.strip()
    if not raw:
        return None
    if "://" not in raw:
        raw = f"http://{raw}"
    parsed = urlparse(raw)
    if not parsed.hostname or parsed.port is None:
        return None
    return parsed.hostname, parsed.port


def _port_is_open(host: str, port: int, timeout: float = 0.25) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _prepare_network_env() -> None:
    for key in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
        value = os.environ.get(key, "")
        parsed = _parse_proxy_host_port(value)
        if parsed and parsed[0] in {"127.0.0.1", "localhost"} and not _port_is_open(*parsed):
            os.environ.pop(key, None)

    bypass = {
        "127.0.0.1",
        "localhost",
        "tile.openstreetmap.org",
        "a.tile.openstreetmap.org",
        "b.tile.openstreetmap.org",
        "c.tile.openstreetmap.org",
        "ipapi.co",
        "ipwho.is",
        "nominatim.openstreetmap.org",
    }
    current = set()
    for key in ("NO_PROXY", "no_proxy"):
        current.update(part.strip() for part in os.environ.get(key, "").split(",") if part.strip())
    merged = ",".join(sorted(current | bypass))
    os.environ["NO_PROXY"] = merged
    os.environ["no_proxy"] = merged


class _SuppressMapMarkerDeprecationFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        if "Deprecated property" in msg and ("allow_stretch" in msg or "keep_ratio" in msg):
            return False
        return True


def _configure_runtime_logging() -> None:
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)
    flt = _SuppressMapMarkerDeprecationFilter()
    for name in ("kivy", ""):
        logger = logging.getLogger(name)
        if not any(isinstance(existing, _SuppressMapMarkerDeprecationFilter) for existing in logger.filters):
            logger.addFilter(flt)


def _patch_mapview_downloader_tracebacks() -> None:
    try:
        from kivy_garden.mapview import downloader as map_downloader
    except Exception:
        return
    if getattr(map_downloader.Downloader, "_rassvet_quiet_patch", False):
        return

    def _check_executor(self, _dt):  # type: ignore[no-untyped-def]
        start = time()
        try:
            for future in as_completed(self._futures[:], 0):
                self._futures.remove(future)
                try:
                    result = future.result()
                except Exception as exc:
                    if not isinstance(exc, (RequestException, IndexError)):
                        traceback.print_exc()
                    continue
                if result is None:
                    continue
                callback, args = result
                callback(*args)
                if time() - start > self.cap_time:
                    break
        except TimeoutError:
            pass

    map_downloader.Downloader._check_executor = _check_executor
    map_downloader.Downloader._safe_check_executor = _check_executor
    map_downloader.Downloader._rassvet_quiet_patch = True


_prepare_network_env()
_configure_runtime_logging()
if MAPVIEW_AVAILABLE:
    _patch_mapview_downloader_tracebacks()


def _osm_source() -> MapSource:
    return MapSource(
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        cache_key="osm_passenger",
        min_zoom=2,
        max_zoom=19,
        tile_size=256,
        image_ext="png",
        attribution="(c) OpenStreetMap contributors",
        subdomains="abc",
    )


class RouteLayer(MapLayer):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.points = []

    def set_route(self, points):
        self.points = points
        self.reposition()

    def reposition(self):
        self.canvas.clear()
        if not self.parent or len(self.points) < 2:
            return
        mapview = self.parent
        pts = []
        for lat, lon in self.points:
            x, y = mapview.get_window_xy_from(lat, lon, mapview.zoom)
            pts.extend([x, y])
        if len(pts) >= 4:
            with self.canvas:
                Color(0.03, 0.36, 0.84, 0.85)
                Line(points=pts, width=2.6)


class PassengerMapPanel(FloatLayout):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._map = None
        self._route = None
        self._driver_marker = None
        self._lock = Lock()
        self._loading = False
        Clock.schedule_once(lambda *_: self._build(), 0)

    def _build(self):
        if MAPVIEW_AVAILABLE:
            self._map = MapView(
                lat=DEFAULT_LOCATION.latitude,
                lon=DEFAULT_LOCATION.longitude,
                zoom=12,
                size_hint=(1, 1),
                map_source=_osm_source(),
            )  # type: ignore[call-arg]
            self.add_widget(self._map)
            self._route = RouteLayer()
            self._map.add_widget(self._route)
            self._driver_marker = MapMarker(
                lat=DEFAULT_LOCATION.latitude,
                lon=DEFAULT_LOCATION.longitude,
                source=_CAR_ICON,
                anchor_x=0.5,
                anchor_y=0.25,
            )  # type: ignore[call-arg]
            self._map.add_marker(self._driver_marker)
        else:
            self.add_widget(Label(text="Карта недоступна", color=(0.2, 0.3, 0.45, 1)))

        self.add_widget(
            Label(
                text="◎",
                color=(0.98, 0.78, 0.18, 1),
                font_size="32sp",
                pos_hint={"center_x": 0.5, "center_y": 0.5},
            )
        )
        self.refresh_location()

    def refresh_location(self):
        with self._lock:
            if self._loading:
                return
            self._loading = True

        def worker():
            loc = get_best_location()
            Clock.schedule_once(lambda *_: self._apply_location(loc), 0)
            with self._lock:
                self._loading = False

        Thread(target=worker, daemon=True).start()

    def _apply_location(self, loc):
        if self._map:
            self._map.center_on(loc.latitude, loc.longitude)
            self._map.zoom = 13

    def get_center_point(self):
        if not self._map:
            return DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude
        return float(self._map.lat), float(self._map.lon)

    def set_ride_state(self, order: dict | None):
        if self._route is None:
            return
        if not order:
            self._route.set_route([])
            if self._driver_marker:
                self._driver_marker.lat = DEFAULT_LOCATION.latitude
                self._driver_marker.lon = DEFAULT_LOCATION.longitude
            return
        geometry = order.get("route_geometry")
        if geometry and geometry.get("coordinates"):
            points = [(float(lat), float(lon)) for lon, lat in geometry["coordinates"]]
        else:
            points = [
                (float(order["pickup_lat"]), float(order["pickup_lon"])),
                (float(order["dropoff_lat"]), float(order["dropoff_lon"])),
            ]
        self._route.set_route(points)
        if order.get("driver_current_lat") is not None and self._driver_marker:
            self._driver_marker.lat = float(order["driver_current_lat"])
            self._driver_marker.lon = float(order["driver_current_lon"])
