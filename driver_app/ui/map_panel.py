from __future__ import annotations

from threading import Lock, Thread

from kivy.clock import Clock
from kivy.graphics import Color, Ellipse, Line, RoundedRectangle
from kivy.metrics import dp
from kivy.properties import NumericProperty, StringProperty
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.widget import Widget

from driver_app.services.location import DEFAULT_LOCATION, GeoLocation, get_best_location


class _SimpleMapCanvas(Widget):
    """Lightweight map placeholder with a grid and one red location dot."""

    dot_x_ratio = NumericProperty(0.5)
    dot_y_ratio = NumericProperty(0.5)

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self.bind(pos=self._redraw, size=self._redraw)
        self.bind(dot_x_ratio=self._redraw, dot_y_ratio=self._redraw)
        self._redraw()

    def _redraw(self, *_args: object) -> None:
        self.canvas.before.clear()
        with self.canvas.before:
            # Card background
            Color(0.96, 0.97, 0.99, 1)
            RoundedRectangle(pos=self.pos, size=self.size, radius=[dp(14)])

            # Soft grid to mimic a simple map
            Color(0.86, 0.89, 0.94, 1)
            for step in range(1, 5):
                x = self.x + self.width * step / 5
                y = self.y + self.height * step / 5
                Line(points=[x, self.y + dp(8), x, self.top - dp(8)], width=1.0)
                Line(points=[self.x + dp(8), y, self.right - dp(8), y], width=1.0)

            # Current location red dot
            cx = self.x + self.width * self.dot_x_ratio
            cy = self.y + self.height * self.dot_y_ratio
            dot_r = dp(8)

            Color(0.86, 0.12, 0.12, 0.22)
            Ellipse(pos=(cx - dot_r * 2, cy - dot_r * 2), size=(dot_r * 4, dot_r * 4))

            Color(1, 1, 1, 1)
            Ellipse(pos=(cx - dot_r - dp(1), cy - dot_r - dp(1)), size=((dot_r + dp(1)) * 2, (dot_r + dp(1)) * 2))

            Color(0.86, 0.12, 0.12, 1)
            Ellipse(pos=(cx - dot_r, cy - dot_r), size=(dot_r * 2, dot_r * 2))


class MapPanel(BoxLayout):
    city_text = StringProperty("Город: определяем...")
    gps_status_text = StringProperty("Поиск местоположения...")
    coord_text = StringProperty("—, —")

    def __init__(self, **kwargs: object) -> None:
        super().__init__(orientation="vertical", spacing=dp(8), **kwargs)

        self._lock = Lock()
        self._loading = False
        self._last: GeoLocation = DEFAULT_LOCATION

        self._city_label = Label(
            text=self.city_text,
            size_hint_y=None,
            height=dp(22),
            font_size="14sp",
            color=(0.08, 0.16, 0.30, 1),
            halign="left",
            valign="middle",
        )
        self._city_label.bind(size=self._sync_text_size)

        self._gps_label = Label(
            text=self.gps_status_text,
            size_hint_y=None,
            height=dp(22),
            font_size="13sp",
            color=(0.28, 0.39, 0.55, 1),
            halign="left",
            valign="middle",
        )
        self._gps_label.bind(size=self._sync_text_size)

        self._coord_label = Label(
            text=self.coord_text,
            size_hint_y=None,
            height=dp(20),
            font_size="12sp",
            color=(0.37, 0.49, 0.66, 1),
            halign="left",
            valign="middle",
        )
        self._coord_label.bind(size=self._sync_text_size)

        self.add_widget(self._city_label)
        self.add_widget(self._gps_label)
        self.add_widget(self._coord_label)

        self._canvas = _SimpleMapCanvas()
        self.add_widget(self._canvas)

        controls = BoxLayout(size_hint_y=None, height=dp(44), spacing=dp(8))

        refresh_btn = Button(
            text="Обновить GPS",
            font_size="14sp",
            color=(1, 1, 1, 1),
            background_normal="",
            background_down="",
            background_color=(0.03, 0.09, 0.22, 1),
        )
        refresh_btn.bind(on_release=lambda *_: self.refresh_location())
        controls.add_widget(refresh_btn)

        center_btn = Button(
            text="Показать точку",
            font_size="14sp",
            color=(0.03, 0.09, 0.22, 1),
            background_normal="",
            background_down="",
            background_color=(0.88, 0.92, 0.98, 1),
        )
        center_btn.bind(on_release=lambda *_: self.center_on_me())
        controls.add_widget(center_btn)

        self.add_widget(controls)

        Clock.schedule_once(lambda *_: self._fetch(center=True), 0)
        Clock.schedule_interval(lambda *_: self._fetch(center=False), 12)

    def refresh_location(self) -> None:
        self._fetch(center=True)

    def center_on_me(self) -> None:
        self._apply_to_canvas(self._last, recenter=True)

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

        self.city_text = f"Город: {loc.city}"
        self.coord_text = f"{loc.latitude:.5f}, {loc.longitude:.5f}"

        if loc.source == "gps":
            self.gps_status_text = "GPS активен"
        elif loc.source == "network":
            self.gps_status_text = "GPS недоступен, используется сеть"
        else:
            self.gps_status_text = "GPS недоступен, тестовая точка"

        self._city_label.text = self.city_text
        self._gps_label.text = self.gps_status_text
        self._coord_label.text = self.coord_text

        self._apply_to_canvas(loc, recenter=center)

    def _apply_to_canvas(self, loc: GeoLocation, recenter: bool) -> None:
        # Lightweight projection from lon/lat into canvas ratios.
        rx = (loc.longitude + 180.0) / 360.0
        ry = 1.0 - ((loc.latitude + 90.0) / 180.0)

        # Keep the point safely inside rounded card edges.
        x_ratio = min(max(rx, 0.08), 0.92)
        y_ratio = min(max(ry, 0.08), 0.92)

        if recenter:
            self._canvas.dot_x_ratio = x_ratio
            self._canvas.dot_y_ratio = y_ratio
            return

        # Smooth movement for periodic refresh.
        self._canvas.dot_x_ratio = self._canvas.dot_x_ratio * 0.65 + x_ratio * 0.35
        self._canvas.dot_y_ratio = self._canvas.dot_y_ratio * 0.65 + y_ratio * 0.35

    @staticmethod
    def _sync_text_size(label: Label, _size: tuple[float, float]) -> None:
        label.text_size = (label.width, None)
