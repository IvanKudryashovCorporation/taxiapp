from __future__ import annotations

import logging
import os
import socket
import struct
import tempfile
import traceback
import zlib
from concurrent.futures import TimeoutError, as_completed
from threading import Lock, Thread
from time import time
from urllib.parse import urlparse

from kivy.app import App
from kivy.clock import Clock
from kivy.graphics import Color, Line
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.label import Label
from requests import RequestException

from driver_app.services.location import DEFAULT_LOCATION, GeoLocation, get_best_location


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

try:
    from kivy_garden.mapview import MapLayer, MapMarker, MapMarkerPopup, MapSource, MapView

    _patch_mapview_downloader_tracebacks()
    MAPVIEW_AVAILABLE = True
except Exception:
    MAPVIEW_AVAILABLE = False
    MapView = object  # type: ignore[assignment,misc]
    MapSource = object  # type: ignore[assignment,misc]
    MapMarker = object  # type: ignore[assignment,misc]
    MapMarkerPopup = object  # type: ignore[assignment,misc]
    MapLayer = object  # type: ignore[assignment,misc]


def _simple_osm_source() -> MapSource:
    return MapSource(
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        cache_key="osm_simple",
        min_zoom=2,
        max_zoom=19,
        tile_size=256,
        image_ext="png",
        attribution="(c) OpenStreetMap contributors",
        subdomains="abc",
    )


def _make_car_png(width: int = 128, height: int = 72) -> bytes:
    img = [[[0, 0, 0, 0] for _ in range(width)] for _ in range(height)]

    def fill_rect(x1: int, y1: int, x2: int, y2: int, rgba: tuple[int, int, int, int]) -> None:
        for y in range(max(y1, 0), min(y2, height)):
            for x in range(max(x1, 0), min(x2, width)):
                img[y][x] = [rgba[0], rgba[1], rgba[2], rgba[3]]

    def fill_circle(cx: int, cy: int, radius: int, rgba: tuple[int, int, int, int]) -> None:
        radius_sq = radius * radius
        for y in range(cy - radius, cy + radius + 1):
            if y < 0 or y >= height:
                continue
            for x in range(cx - radius, cx + radius + 1):
                if x < 0 or x >= width:
                    continue
                dx = x - cx
                dy = y - cy
                if dx * dx + dy * dy <= radius_sq:
                    img[y][x] = [rgba[0], rgba[1], rgba[2], rgba[3]]

    yellow = (247, 194, 0, 255)
    dark = (22, 27, 36, 255)
    wheel = (98, 98, 98, 255)
    wheel_center = (226, 226, 226, 255)
    glass = (106, 106, 106, 255)

    fill_rect(10, 28, 118, 52, yellow)
    fill_rect(40, 16, 96, 30, yellow)
    fill_rect(64, 10, 74, 16, (9, 58, 88, 255))
    fill_rect(46, 19, 90, 29, glass)
    fill_rect(66, 19, 70, 29, dark)
    fill_rect(10, 33, 16, 40, (95, 74, 9, 255))
    fill_rect(112, 34, 118, 40, (184, 22, 5, 255))
    for idx in range(8):
        x = 40 + idx * 8
        if idx % 2 == 0:
            fill_rect(x, 38, x + 4, 42, (0, 0, 0, 255))
        else:
            fill_rect(x, 34, x + 4, 38, (0, 0, 0, 255))
    fill_circle(30, 52, 11, wheel)
    fill_circle(98, 52, 11, wheel)
    fill_circle(30, 52, 6, wheel_center)
    fill_circle(98, 52, 6, wheel_center)

    rows: list[bytes] = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            r, g, b, a = img[y][x]
            row += bytes([r, g, b, a])
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        crc = zlib.crc32(body) & 0xFFFF_FFFF
        return struct.pack(">I", len(data)) + body + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def _car_icon_path() -> str:
    path = os.path.join(tempfile.gettempdir(), "rassvet_taxi_side_marker.png")
    if not os.path.exists(path):
        with open(path, "wb") as output:
            output.write(_make_car_png())
    return path


_CAR_ICON = _car_icon_path()


class RouteLayer(MapLayer):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.points: list[tuple[float, float]] = []

    def set_route(self, points: list[tuple[float, float]]) -> None:
        self.points = points
        self.reposition()

    def reposition(self) -> None:
        self.canvas.clear()
        if not self.parent or len(self.points) < 2:
            return
        mapview = self.parent
        pts: list[float] = []
        for lat, lon in self.points:
            x, y = mapview.get_window_xy_from(lat, lon, mapview.zoom)
            pts.extend([x, y])
        if len(pts) >= 4:
            with self.canvas:
                Color(0.05, 0.36, 0.84, 0.85)
                Line(points=pts, width=2.6)


class OrderMarker(MapMarkerPopup):
    def __init__(self, *, lat: float, lon: float, text: str, **kwargs):
        super().__init__(lat=lat, lon=lon, **kwargs)
        self.size = (36, 36)
        self.add_widget(
            Label(
                text=text,
                size_hint=(None, None),
                size=(72, 28),
                pos=(0, 26),
                color=(1, 1, 1, 1),
                bold=True,
            )
        )


class MapPanel(FloatLayout):
    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self._map_view: MapView | None = None
        self._driver_marker: MapMarker | None = None
        self._route_layer: RouteLayer | None = None
        self._lock = Lock()
        self._loading = False
        self._centered_once = False
        self._last: GeoLocation = DEFAULT_LOCATION
        self._available_order_markers: list[MapMarkerPopup] = []
        self._driver_payload: dict = {}
        self._available_orders: list[dict] = []
        self._current_order: dict | None = None
        Clock.schedule_once(lambda *_: self._init_ui(), 0)

    def set_payload(self, driver: dict, available_orders: list[dict], current_order: dict | None) -> None:
        self._driver_payload = driver or {}
        self._available_orders = available_orders or []
        self._current_order = current_order
        self._sync_markers()

    def refresh_location(self) -> None:
        self._fetch(center=True)

    def _init_ui(self) -> None:
        if MAPVIEW_AVAILABLE:
            lat = DEFAULT_LOCATION.latitude
            lon = DEFAULT_LOCATION.longitude
            self._map_view = MapView(lat=lat, lon=lon, zoom=11, size_hint=(1, 1), map_source=_simple_osm_source())  # type: ignore[call-arg]
            self.add_widget(self._map_view)
            self._route_layer = RouteLayer()
            self._map_view.add_widget(self._route_layer)
            self._driver_marker = MapMarker(lat=lat, lon=lon, source=_CAR_ICON, anchor_x=0.5, anchor_y=0.25)  # type: ignore[call-arg]
            self._map_view.add_marker(self._driver_marker)
        else:
            self.add_widget(Label(text="Карта недоступна. Установите kivy-garden.mapview.", color=(0.2, 0.3, 0.45, 1)))

        self._apply_location(DEFAULT_LOCATION, center=False)
        self._sync_markers()
        self._fetch(center=True)
        Clock.schedule_interval(lambda *_: self._fetch(center=False), 12)

    def _fetch(self, center: bool) -> None:
        with self._lock:
            if self._loading:
                return
            self._loading = True

        def worker() -> None:
            location = get_best_location()
            Clock.schedule_once(lambda *_: self._apply_location(location, center=center), 0)
            with self._lock:
                self._loading = False

        Thread(target=worker, daemon=True).start()

    def _apply_location(self, loc: GeoLocation, *, center: bool) -> None:
        self._last = loc
        if self._map_view and self._driver_marker:
            self._driver_marker.lat = loc.latitude
            self._driver_marker.lon = loc.longitude
            if center or (not self._centered_once and loc.source != "fallback"):
                self._map_view.center_on(loc.latitude, loc.longitude)
                self._map_view.zoom = 13
                if loc.source != "fallback":
                    self._centered_once = True
        self._push_location(loc)

    def _push_location(self, loc: GeoLocation) -> None:
        app = App.get_running_app()
        if app is None or not hasattr(app, "api") or not getattr(app.api, "token", ""):
            return

        def worker() -> None:
            try:
                app.api.post(
                    "/api/driver/location",
                    json_data={
                        "is_online": bool(self._driver_payload.get("is_online")),
                        "current_lat": loc.latitude,
                        "current_lon": loc.longitude,
                    },
                )
            except Exception:
                pass

        Thread(target=worker, daemon=True).start()

    def _sync_markers(self) -> None:
        if not self._map_view:
            return
        for marker in self._available_order_markers:
            self._map_view.remove_marker(marker)
        self._available_order_markers = []

        for order in self._available_orders:
            marker = OrderMarker(
                lat=float(order["pickup_lat"]),
                lon=float(order["pickup_lon"]),
                text=f"{float(order['fare_total']):.0f} ₽",
                source="atlas://data/images/defaulttheme/button_pressed",
                anchor_x=0.5,
                anchor_y=0.1,
            )  # type: ignore[call-arg]
            self._map_view.add_marker(marker)
            self._available_order_markers.append(marker)

        if self._route_layer:
            if self._current_order:
                geometry = self._current_order.get("route_geometry")
                if geometry and isinstance(geometry, dict) and geometry.get("coordinates"):
                    points = [(float(lat), float(lon)) for lon, lat in geometry["coordinates"]]
                else:
                    points = [
                        (float(self._current_order["pickup_lat"]), float(self._current_order["pickup_lon"])),
                        (float(self._current_order["dropoff_lat"]), float(self._current_order["dropoff_lon"])),
                    ]
                self._route_layer.set_route(points)
            else:
                self._route_layer.set_route([])
