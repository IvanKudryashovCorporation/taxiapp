from __future__ import annotations

from threading import Lock, Thread
from typing import Callable
from pathlib import Path

from kivy.clock import Clock
from kivy.properties import StringProperty
from kivy.uix.floatlayout import FloatLayout

from driver_app.services.location import DEFAULT_LOCATION, GeoLocation, get_best_location, reverse_city

try:
    import kivy_garden.mapview as mapview_module
    from kivy_garden.mapview import MapMarker, MapView

    MAPVIEW_AVAILABLE = True
except Exception:
    MAPVIEW_AVAILABLE = False
    mapview_module = None  # type: ignore[assignment]
    MapView = object  # type: ignore[assignment]
    MapMarker = object  # type: ignore[assignment]


class ClickableMapView(MapView):
    """MapView with click callback while preserving drag/zoom behavior."""

    def __init__(self, on_click: Callable[[float, float], None], **kwargs):
        super().__init__(**kwargs)
        self._on_click = on_click

    def on_touch_up(self, touch):  # type: ignore[override]
        handled = super().on_touch_up(touch)

        if touch.is_mouse_scrolling:
            return handled

        moved_x = abs(getattr(touch, "dx", 0))
        moved_y = abs(getattr(touch, "dy", 0))

        if self.collide_point(*touch.pos) and moved_x < 6 and moved_y < 6:
            latitude, longitude = self.get_latlon_at(touch.x, touch.y)
            self._on_click(float(latitude), float(longitude))

        return handled


class MapPanel(FloatLayout):
    city_text = StringProperty("Город: определяем...")
    gps_status_text = StringProperty("GPS: поиск местоположения...")
    coord_text = StringProperty("--, --")
    tap_text = StringProperty("Точка выбора: не выбрана")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._map_view: ClickableMapView | None = None
        self._location_marker: MapMarker | None = None
        self._selection_marker: MapMarker | None = None
        self._selection_icon_source: str | None = None
        self._loader_lock = Lock()
        self._loading = False
        self._initialized = False
        self._last_location: GeoLocation = DEFAULT_LOCATION
        Clock.schedule_once(lambda *_: self._initialize(), 0)

    def refresh_location(self) -> None:
        self._request_location(center_map=True)

    def center_on_me(self) -> None:
        if self._map_view is None:
            return

        self._map_view.center_on(self._last_location.latitude, self._last_location.longitude)
        self._map_view.zoom = 14

    def _initialize(self) -> None:
        if self._initialized:
            return

        self._initialized = True

        if not MAPVIEW_AVAILABLE:
            self.gps_status_text = "Карта недоступна: установите kivy-garden.mapview"
            self.city_text = "Город: недоступно"
            return

        self._map_view = ClickableMapView(
            on_click=self._on_map_click,
            lat=DEFAULT_LOCATION.latitude,
            lon=DEFAULT_LOCATION.longitude,
            zoom=11,
            size_hint=(1, 1),
        )
        self.add_widget(self._map_view)

        # Default marker icon in mapview is red, works as "you are here" point.
        self._location_marker = MapMarker(lat=DEFAULT_LOCATION.latitude, lon=DEFAULT_LOCATION.longitude)
        self._map_view.add_marker(self._location_marker)
        self._selection_icon_source = self._resolve_selection_icon()

        self._apply_location(DEFAULT_LOCATION, center_map=True)
        self._request_location(center_map=True)
        Clock.schedule_interval(lambda *_: self._request_location(center_map=False), 20)

    def _request_location(self, center_map: bool) -> None:
        with self._loader_lock:
            if self._loading:
                return
            self._loading = True

        def worker() -> None:
            location = get_best_location()
            Clock.schedule_once(lambda *_: self._apply_location(location, center_map=center_map), 0)

            with self._loader_lock:
                self._loading = False

        Thread(target=worker, daemon=True).start()

    def _apply_location(self, location: GeoLocation, *, center_map: bool) -> None:
        self._last_location = location
        self.coord_text = f"{location.latitude:.5f}, {location.longitude:.5f}"
        self.city_text = f"Город: {location.city}"

        if location.source == "gps":
            self.gps_status_text = "GPS активен: точка обновляется автоматически"
        elif location.source == "network":
            self.gps_status_text = "GPS недоступен: используется геолокация сети"
        else:
            self.gps_status_text = "GPS недоступен: показана тестовая точка"

        if self._map_view is None or self._location_marker is None:
            return

        self._location_marker.lat = location.latitude
        self._location_marker.lon = location.longitude

        if center_map:
            self._map_view.center_on(location.latitude, location.longitude)
            self._map_view.zoom = 14

    def _on_map_click(self, latitude: float, longitude: float) -> None:
        self.tap_text = f"Точка выбора: {latitude:.5f}, {longitude:.5f}"
        if self._map_view is not None:
            if self._selection_marker is None:
                marker_kwargs = {"lat": latitude, "lon": longitude}
                if self._selection_icon_source:
                    marker_kwargs["source"] = self._selection_icon_source
                self._selection_marker = MapMarker(**marker_kwargs)
                self._map_view.add_marker(self._selection_marker)
            else:
                self._selection_marker.lat = latitude
                self._selection_marker.lon = longitude

        def reverse_worker() -> None:
            try:
                city_name = reverse_city(latitude, longitude)
            except Exception:
                city_name = "Не удалось определить город"
            Clock.schedule_once(lambda *_: self._set_selected_city(city_name, latitude, longitude), 0)

        Thread(target=reverse_worker, daemon=True).start()

    def _set_selected_city(self, city_name: str, latitude: float, longitude: float) -> None:
        self.tap_text = f"Точка выбора: {city_name} ({latitude:.5f}, {longitude:.5f})"

    def _resolve_selection_icon(self) -> str | None:
        if not MAPVIEW_AVAILABLE or mapview_module is None:
            return None

        icons_dir = Path(mapview_module.__file__).resolve().parent / "icons"
        cluster_icon = icons_dir / "cluster.png"
        if cluster_icon.exists():
            return str(cluster_icon)
        return None
