from __future__ import annotations

import os
import struct
import tempfile
import zlib
from threading import Lock, Thread

from kivy.clock import Clock
from kivy.properties import StringProperty
from kivy.uix.floatlayout import FloatLayout

from driver_app.services.location import DEFAULT_LOCATION, GeoLocation, get_best_location

try:
    from kivy_garden.mapview import MapMarker, MapView

    MAPVIEW_AVAILABLE = True
except Exception:
    MAPVIEW_AVAILABLE = False
    MapView = object   # type: ignore[assignment,misc]
    MapMarker = object  # type: ignore[assignment,misc]


# ---------------------------------------------------------------------------
# Red dot PNG — generated once at import time, written to a temp file
# ---------------------------------------------------------------------------

def _make_dot_png(size: int = 44) -> bytes:
    """
    Build a valid RGBA PNG with a red circle on transparent background.
    Pure Python — no Pillow, no numpy.
    Layers (outside-in): transparent → faint red ring → white border → red fill.
    """
    cx = cy = (size - 1) / 2.0
    r_ring  = size / 2.0 - 1   # outer semi-transparent halo
    r_white = size / 2.0 - 5   # white border
    r_fill  = size / 2.0 - 8   # solid red core

    rows: list[bytes] = []
    for y in range(size):
        row = bytearray([0])  # PNG filter byte = None
        for x in range(size):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if d <= r_fill:
                row += b'\xdc\x1e\x1e\xff'        # #DC1E1E solid red
            elif d <= r_white:
                row += b'\xff\xff\xff\xff'          # white border
            elif d <= r_ring:
                row += b'\xdc\x1e\x1e\xa0'        # semi-transparent red halo
            else:
                row += b'\x00\x00\x00\x00'         # transparent
        rows.append(bytes(row))

    raw = b''.join(rows)

    def _chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        crc = zlib.crc32(body) & 0xFFFF_FFFF
        return struct.pack('>I', len(data)) + body + struct.pack('>I', crc)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    return (
        b'\x89PNG\r\n\x1a\n'
        + _chunk(b'IHDR', ihdr)
        + _chunk(b'IDAT', zlib.compress(raw, 9))
        + _chunk(b'IEND', b'')
    )


def _dot_png_path() -> str:
    path = os.path.join(tempfile.gettempdir(), 'rassvet_location_dot.png')
    if not os.path.exists(path):
        with open(path, 'wb') as f:
            f.write(_make_dot_png())
    return path


_DOT_PNG: str = _dot_png_path()


# ---------------------------------------------------------------------------
# MapPanel
# ---------------------------------------------------------------------------

class MapPanel(FloatLayout):
    city_text       = StringProperty("Город: определяем…")
    gps_status_text = StringProperty("Поиск местоположения…")
    coord_text      = StringProperty("—, —")

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self._map_view: MapView | None = None
        self._marker: MapMarker | None = None
        self._lock = Lock()
        self._loading = False
        self._centered_once = False
        self._last: GeoLocation = DEFAULT_LOCATION
        Clock.schedule_once(lambda *_: self._init_map(), 0)

    # ------------------------------------------------------------------
    # Public API (called from KV buttons and DashboardScreen)
    # ------------------------------------------------------------------

    def refresh_location(self) -> None:
        """Fetch a fresh location and re-center the map."""
        self._fetch(center=True)

    def center_on_me(self) -> None:
        """Pan to the last known location without re-fetching."""
        if self._map_view is not None:
            self._map_view.center_on(self._last.latitude, self._last.longitude)
            self._map_view.zoom = 15

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------

    def _init_map(self) -> None:
        if not MAPVIEW_AVAILABLE:
            self.gps_status_text = "Карта недоступна: установите kivy-garden.mapview"
            self.city_text = "Город: недоступно"
            return

        lat, lon = DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude

        self._map_view = MapView(  # type: ignore[call-arg]
            lat=lat, lon=lon,
            zoom=12,
            size_hint=(1, 1),
        )
        self.add_widget(self._map_view)

        # Red dot marker at the default position; will be moved on first fix
        self._marker = MapMarker(  # type: ignore[call-arg]
            lat=lat, lon=lon,
            source=_DOT_PNG,
            anchor_x=0.5,
            anchor_y=0.5,
        )
        self._map_view.add_marker(self._marker)

        # Fetch real location right away, then refresh every 10 s
        self._fetch(center=True)
        Clock.schedule_interval(lambda *_: self._fetch(center=False), 10)

    # ------------------------------------------------------------------
    # Location fetching
    # ------------------------------------------------------------------

    def _fetch(self, center: bool) -> None:
        with self._lock:
            if self._loading:
                return
            self._loading = True

        def _worker() -> None:
            loc = get_best_location()
            Clock.schedule_once(lambda *_: self._apply(loc, center=center), 0)
            with self._lock:
                self._loading = False

        Thread(target=_worker, daemon=True).start()

    def _apply(self, loc: GeoLocation, *, center: bool) -> None:
        self._last = loc
        self.coord_text = f"{loc.latitude:.5f}, {loc.longitude:.5f}"
        self.city_text = f"Город: {loc.city}"

        if loc.source == "gps":
            self.gps_status_text = "GPS активен"
        elif loc.source == "network":
            self.gps_status_text = "GPS нет — по сети"
        else:
            self.gps_status_text = "GPS нет — тестовая точка"

        if self._map_view is None or self._marker is None:
            return

        # Move the red dot to the new coordinates
        self._marker.lat = loc.latitude
        self._marker.lon = loc.longitude

        # Center on the very first real fix, or when explicitly requested
        first_real = not self._centered_once and loc.source != "fallback"
        if center or first_real:
            self._map_view.center_on(loc.latitude, loc.longitude)
            self._map_view.zoom = 15
            if loc.source != "fallback":
                self._centered_once = True
