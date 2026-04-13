from __future__ import annotations

import logging
import os
import socket
import struct
import tempfile
import traceback
from concurrent.futures import TimeoutError, as_completed
from time import time
from urllib.parse import urlparse
import zlib
from threading import Lock, Thread

from kivy.clock import Clock
from kivy.graphics import Color, RoundedRectangle
from kivy.metrics import dp
from kivy.properties import StringProperty
from kivy.uix.boxlayout import BoxLayout
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
    proxy_keys = ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy")
    local_targets = {"127.0.0.1", "localhost"}

    for key in proxy_keys:
        value = os.environ.get(key, "")
        parsed = _parse_proxy_host_port(value)
        if parsed is None:
            continue

        host, port = parsed
        if host in local_targets and not _port_is_open(host, port):
            os.environ.pop(key, None)

    bypass_hosts = {
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

    existing = set()
    for key in ("NO_PROXY", "no_proxy"):
        value = os.environ.get(key, "")
        existing.update(part.strip() for part in value.split(",") if part.strip())

    merged = ",".join(sorted(existing | bypass_hosts))
    os.environ["NO_PROXY"] = merged
    os.environ["no_proxy"] = merged


class _SuppressMapMarkerDeprecationFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        if "Deprecated property" in message and ("allow_stretch" in message or "keep_ratio" in message):
            return False
        return True


def _configure_runtime_logging() -> None:
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)
    logging.getLogger("kivy_garden.mapview").setLevel(logging.WARNING)

    flt = _SuppressMapMarkerDeprecationFilter()
    for logger_name in ("kivy", ""):
        logger = logging.getLogger(logger_name)
        if not any(isinstance(existing, _SuppressMapMarkerDeprecationFilter) for existing in logger.filters):
            logger.addFilter(flt)


def _patch_mapview_downloader_tracebacks() -> None:
    try:
        from kivy_garden.mapview import downloader as map_downloader
    except Exception:
        return

    if getattr(map_downloader.Downloader, "_rassvet_quiet_patch", False):
        return

    def _safe_check_executor(self, _dt):  # type: ignore[no-untyped-def]
        start = time()
        try:
            for future in as_completed(self._futures[:], 0):
                self._futures.remove(future)
                try:
                    result = future.result()
                except Exception as exc:
                    # Ignore frequent tile network/proxy timeouts, but keep non-network tracebacks.
                    if not isinstance(exc, RequestException):
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

    map_downloader.Downloader._check_executor = _safe_check_executor
    map_downloader.Downloader._rassvet_quiet_patch = True


_prepare_network_env()
_configure_runtime_logging()

try:
    from kivy_garden.mapview import MapMarker, MapView

    _patch_mapview_downloader_tracebacks()
    MAPVIEW_AVAILABLE = True
except Exception:
    MAPVIEW_AVAILABLE = False
    MapView = object  # type: ignore[assignment,misc]
    MapMarker = object  # type: ignore[assignment,misc]


def _make_car_png(size: int = 64) -> bytes:
    """Create a small car icon PNG without external dependencies."""

    img = [[[0, 0, 0, 0] for _ in range(size)] for _ in range(size)]

    def fill_rect(x1: int, y1: int, x2: int, y2: int, rgba: tuple[int, int, int, int]) -> None:
        for y in range(max(y1, 0), min(y2, size)):
            for x in range(max(x1, 0), min(x2, size)):
                img[y][x] = [rgba[0], rgba[1], rgba[2], rgba[3]]

    def fill_circle(cx: int, cy: int, radius: int, rgba: tuple[int, int, int, int]) -> None:
        radius_sq = radius * radius
        for y in range(cy - radius, cy + radius + 1):
            if y < 0 or y >= size:
                continue
            for x in range(cx - radius, cx + radius + 1):
                if x < 0 or x >= size:
                    continue
                dx = x - cx
                dy = y - cy
                if dx * dx + dy * dy <= radius_sq:
                    img[y][x] = [rgba[0], rgba[1], rgba[2], rgba[3]]

    fill_circle(size // 2, 50, 18, (0, 0, 0, 60))
    fill_rect(12, 28, 52, 43, (11, 46, 115, 255))
    fill_rect(20, 20, 44, 30, (11, 46, 115, 255))
    fill_rect(23, 22, 32, 29, (196, 225, 255, 255))
    fill_rect(33, 22, 41, 29, (196, 225, 255, 255))
    fill_rect(50, 32, 53, 37, (255, 211, 102, 255))
    fill_circle(22, 43, 6, (28, 33, 44, 255))
    fill_circle(42, 43, 6, (28, 33, 44, 255))
    fill_circle(22, 43, 3, (215, 223, 235, 255))
    fill_circle(42, 43, 3, (215, 223, 235, 255))

    rows: list[bytes] = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            r, g, b, a = img[y][x]
            row += bytes([r, g, b, a])
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        crc = zlib.crc32(body) & 0xFFFF_FFFF
        return struct.pack(">I", len(data)) + body + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def _car_icon_path() -> str:
    path = os.path.join(tempfile.gettempdir(), "rassvet_car_marker.png")
    if not os.path.exists(path):
        with open(path, "wb") as output:
            output.write(_make_car_png())
    return path


_CAR_ICON = _car_icon_path()


class MapPanel(FloatLayout):
    city_text = StringProperty("Город: определяем...")
    gps_status_text = StringProperty("Поиск местоположения...")
    coord_text = StringProperty("—, —")

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self._map_view: MapView | None = None
        self._marker: MapMarker | None = None
        self._status_city: Label | None = None
        self._status_gps: Label | None = None
        self._lock = Lock()
        self._loading = False
        self._centered_once = False
        self._last: GeoLocation = DEFAULT_LOCATION
        Clock.schedule_once(lambda *_: self._init_ui(), 0)

    def refresh_location(self) -> None:
        self._fetch(center=True)

    def center_on_me(self) -> None:
        if self._map_view is not None:
            self._map_view.center_on(self._last.latitude, self._last.longitude)
            self._map_view.zoom = 15

    def _init_ui(self) -> None:
        if MAPVIEW_AVAILABLE:
            lat = DEFAULT_LOCATION.latitude
            lon = DEFAULT_LOCATION.longitude
            self._map_view = MapView(  # type: ignore[call-arg]
                lat=lat,
                lon=lon,
                zoom=14,
                size_hint=(1, 1),
            )
            self.add_widget(self._map_view)

            self._marker = MapMarker(  # type: ignore[call-arg]
                lat=lat,
                lon=lon,
                source=_CAR_ICON,
                anchor_x=0.5,
                anchor_y=0.22,
            )
            self._map_view.add_marker(self._marker)
        else:
            self.add_widget(
                Label(
                    text="Карта недоступна. Установите kivy-garden.mapview.",
                    color=(0.2, 0.3, 0.45, 1),
                    font_size="16sp",
                )
            )

        status_box = BoxLayout(
            orientation="vertical",
            size_hint=(1, None),
            height=dp(56),
            pos_hint={"top": 1},
            padding=(dp(12), dp(6), dp(12), dp(4)),
            spacing=dp(1),
        )
        with status_box.canvas.before:
            Color(1, 1, 1, 0.8)
            bg = RoundedRectangle(pos=status_box.pos, size=status_box.size, radius=[0, 0, dp(10), dp(10)])
        status_box.bind(pos=lambda _, value: setattr(bg, "pos", value))
        status_box.bind(size=lambda _, value: setattr(bg, "size", value))

        self._status_city = Label(
            text=self.city_text,
            color=(0.06, 0.12, 0.25, 1),
            font_size="14sp",
            halign="left",
            valign="middle",
        )
        self._status_city.bind(size=self._sync_text_size)

        self._status_gps = Label(
            text=self._status_line(),
            color=(0.23, 0.32, 0.46, 1),
            font_size="12sp",
            halign="left",
            valign="middle",
        )
        self._status_gps.bind(size=self._sync_text_size)

        status_box.add_widget(self._status_city)
        status_box.add_widget(self._status_gps)
        self.add_widget(status_box)

        self._apply(DEFAULT_LOCATION, center=False)
        self._fetch(center=True)
        Clock.schedule_interval(lambda *_: self._fetch(center=False), 8)

    @staticmethod
    def _sync_text_size(label: Label, _size: tuple[float, float]) -> None:
        label.text_size = (label.width, None)

    def _status_line(self) -> str:
        return f"{self.gps_status_text} • {self.coord_text}"

    def _fetch(self, center: bool) -> None:
        with self._lock:
            if self._loading:
                return
            self._loading = True

        def worker() -> None:
            loc = get_best_location()
            Clock.schedule_once(lambda *_: self._apply(loc, center=center), 0)
            with self._lock:
                self._loading = False

        Thread(target=worker, daemon=True).start()

    def _apply(self, loc: GeoLocation, *, center: bool) -> None:
        self._last = loc
        self.coord_text = f"{loc.latitude:.5f}, {loc.longitude:.5f}"
        self.city_text = f"Город: {loc.city}"

        if loc.source == "gps":
            self.gps_status_text = "GPS активен"
        elif loc.source == "network":
            self.gps_status_text = "GPS недоступен, использована геолокация сети"
        else:
            self.gps_status_text = "GPS недоступен, используется тестовая точка"

        if self._status_city is not None:
            self._status_city.text = self.city_text
        if self._status_gps is not None:
            self._status_gps.text = self._status_line()

        if self._map_view is None or self._marker is None:
            return

        self._marker.lat = loc.latitude
        self._marker.lon = loc.longitude

        first_real = not self._centered_once and loc.source != "fallback"
        if center or first_real:
            self._map_view.center_on(loc.latitude, loc.longitude)
            self._map_view.zoom = 15
            if loc.source != "fallback":
                self._centered_once = True
