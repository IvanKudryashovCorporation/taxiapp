from __future__ import annotations

from pathlib import Path

from kivy.graphics import Color, Rectangle, RoundedRectangle
from kivy.properties import BooleanProperty, ListProperty, NumericProperty, StringProperty
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.widget import Widget

_WINDOWS_EMOJI_FONT = Path(r"C:\Windows\Fonts\seguiemj.ttf")


class PanelCard(BoxLayout):
    bg_color = ListProperty([1, 1, 1, 1])
    border_color = ListProperty([0.85, 0.89, 0.94, 1])
    radius = NumericProperty(16)


class NavButton(Button):
    icon = StringProperty("•")
    title_text = StringProperty("")
    subtitle_text = StringProperty("")
    active = BooleanProperty(False)
    display_text = StringProperty("")

    def on_kv_post(self, *_args) -> None:
        self._update_display_text()

    def on_icon(self, *_args) -> None:
        self._update_display_text()

    def on_title_text(self, *_args) -> None:
        self._update_display_text()

    def on_subtitle_text(self, *_args) -> None:
        self._update_display_text()

    def _update_display_text(self) -> None:
        # Build multiline label text in Python to avoid escaped \n artifacts in kv.
        if _WINDOWS_EMOJI_FONT.exists():
            emoji_font = _WINDOWS_EMOJI_FONT.as_posix()
            icon_line = f"[font={emoji_font}][size=20]{self.icon}[/size][/font]"
        else:
            icon_line = f"[size=20]{self.icon}[/size]"

        self.display_text = (
            f"{icon_line}\n"
            f"[b]{self.title_text}[/b]\n"
            f"[size=11]{self.subtitle_text}[/size]"
        )


class PriceBubble(Label):
    pass


class TaxiStripe(Widget):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.bind(pos=self._redraw, size=self._redraw)
        self._redraw()

    def _redraw(self, *_args) -> None:
        self.canvas.before.clear()
        with self.canvas.before:
            Color(0.19, 0.22, 0.30, 1)
            RoundedRectangle(pos=self.pos, size=self.size, radius=[self.height / 2] * 4)

            inset = 2
            segment_count = 10
            segment_width = (self.width - inset * 2) / segment_count if segment_count else self.width
            for index in range(segment_count):
                if index % 2 == 1:
                    Color(0.95, 0.80, 0.23, 1)
                    Rectangle(
                        pos=(self.x + inset + index * segment_width, self.y + inset),
                        size=(segment_width, max(self.height - inset * 2, 1)),
                    )


class OrderTile(PanelCard):
    status_text = StringProperty("Ожидает")
    route_text = StringProperty("")
    client_text = StringProperty("")
    price_text = StringProperty("0 ₽")
    active_order = BooleanProperty(False)