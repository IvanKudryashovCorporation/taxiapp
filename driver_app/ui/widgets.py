from __future__ import annotations

import re
from pathlib import Path

from kivy.app import App
from kivy.graphics import Color, Rectangle, RoundedRectangle
from kivy.metrics import dp
from kivy.properties import BooleanProperty, ListProperty, NumericProperty, StringProperty
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.label import Label
from kivy.uix.widget import Widget

_WINDOWS_EMOJI_FONT = Path(r"C:\Windows\Fonts\seguiemj.ttf")
_EMOJI_RE = re.compile(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]")


class PanelCard(BoxLayout):
    bg_color = ListProperty([1, 1, 1, 1])
    border_color = ListProperty([0.85, 0.89, 0.94, 1])
    radius = NumericProperty(16)


class NavButton(Button):
    icon = StringProperty("*")
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


class MessageBubble(FloatLayout):
    """Chat bubble: driver messages to the right, operator messages to the left."""

    _MAX_W = dp(260)

    def __init__(self, text: str, is_driver: bool, system: bool = False, **kwargs: object) -> None:
        super().__init__(size_hint_y=None, **kwargs)

        app = App.get_running_app()
        font_regular = getattr(app, "font_regular", "Roboto") if app else "Roboto"
        font_emoji = getattr(app, "font_emoji", "") if app else ""

        safe_text = (
            text.replace("&", "&amp;")
            .replace("[", "&#91;")
            .replace("]", "&#93;")
        )
        if font_emoji:
            safe_text = _EMOJI_RE.sub(lambda m: f"[font={font_emoji}]{m.group(0)}[/font]", safe_text)

        text_color = (
            (0.32, 0.39, 0.52, 1) if system else ((1, 1, 1, 1) if is_driver else (0.10, 0.15, 0.25, 1))
        )
        bg_color = (
            (0.93, 0.95, 0.99, 1) if system else ((0.03, 0.09, 0.22, 1) if is_driver else (1, 1, 1, 1))
        )

        label = Label(
            text=safe_text,
            markup=True,
            font_name=font_regular,
            font_size="14sp",
            text_size=(self._MAX_W - dp(24), None),
            halign="left",
            valign="middle",
            size_hint=(None, None),
            color=text_color,
        )
        label.texture_update()

        bubble_w = min(label.texture_size[0] + dp(24), self._MAX_W)
        bubble_h = label.texture_size[1] + dp(20)
        label.size = (bubble_w, bubble_h)
        label.text_size = (bubble_w - dp(24), None)

        if system:
            label.pos_hint = {"center_x": 0.5, "center_y": 0.5}
        else:
            label.pos_hint = {"right": 1, "center_y": 0.5} if is_driver else {"x": 0, "center_y": 0.5}

        with label.canvas.before:
            Color(*bg_color)
            rect = RoundedRectangle(pos=label.pos, size=label.size, radius=[dp(14)])

        label.bind(pos=lambda _, value: setattr(rect, "pos", value))

        self.height = bubble_h + dp(8)
        self.add_widget(label)
