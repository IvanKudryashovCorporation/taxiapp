from __future__ import annotations

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


class PanelCard(BoxLayout):
    bg_color = ListProperty([1, 1, 1, 0.98])
    border_color = ListProperty([0.84, 0.88, 0.94, 1])
    radius = NumericProperty(22)


class SegmentButton(Button):
    active = BooleanProperty(False)


class MessageBubble(FloatLayout):
    _MAX_W = dp(270)

    def __init__(self, text: str, mine: bool, **kwargs: object) -> None:
        super().__init__(size_hint_y=None, **kwargs)
        app = App.get_running_app()
        font_regular = getattr(app, "font_regular", "Roboto") if app else "Roboto"
        font_emoji = _WINDOWS_EMOJI_FONT.as_posix() if _WINDOWS_EMOJI_FONT.exists() else ""

        safe_text = (
            (text or " ")
            .replace("&", "&amp;")
            .replace("[", "&#91;")
            .replace("]", "&#93;")
        )
        if font_emoji:
            for symbol in ("👍", "📍", "🚕", "📞", "💬"):
                safe_text = safe_text.replace(symbol, f"[font={font_emoji}]{symbol}[/font]")

        text_color = (1, 1, 1, 1) if mine else (0.09, 0.13, 0.22, 1)
        bg_color = (0.03, 0.09, 0.22, 1) if mine else (1, 1, 1, 1)
        border_color = (0.03, 0.09, 0.22, 1) if mine else (0.85, 0.89, 0.95, 1)

        label = Label(
            text=safe_text,
            markup=bool(font_emoji),
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
        bubble_h = label.texture_size[1] + dp(18)
        label.size = (bubble_w, bubble_h)
        label.text_size = (bubble_w - dp(24), None)
        label.pos_hint = {"right": 1, "center_y": 0.5} if mine else {"x": 0, "center_y": 0.5}

        with label.canvas.before:
            Color(*border_color)
            border = RoundedRectangle(pos=label.pos, size=label.size, radius=[dp(16)])
            Color(*bg_color)
            inner = RoundedRectangle(
                pos=(label.x + 1, label.y + 1),
                size=(label.width - 2, label.height - 2),
                radius=[dp(15)],
            )

        label.bind(pos=lambda _, value: setattr(border, "pos", value))
        label.bind(size=lambda _, value: setattr(border, "size", value))
        label.bind(pos=lambda _, value: setattr(inner, "pos", (value[0] + 1, value[1] + 1)))
        label.bind(size=lambda _, value: setattr(inner, "size", (value[0] - 2, value[1] - 2)))

        self.height = bubble_h + dp(10)
        self.add_widget(label)


class TaxiStripe(Widget):
    """Decorative taxi-style striped bar (navy + yellow segments)."""

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self.bind(pos=self._redraw, size=self._redraw)
        self._redraw()

    def _redraw(self, *_args: object) -> None:
        self.canvas.before.clear()
        with self.canvas.before:
            Color(0.19, 0.22, 0.30, 1)
            RoundedRectangle(pos=self.pos, size=self.size, radius=[self.height / 2] * 4)

            inset = 2
            segment_count = 10
            segment_width = (
                (self.width - inset * 2) / segment_count if segment_count else self.width
            )
            for index in range(segment_count):
                if index % 2 == 1:
                    Color(0.95, 0.80, 0.23, 1)
                    Rectangle(
                        pos=(self.x + inset + index * segment_width, self.y + inset),
                        size=(segment_width, max(self.height - inset * 2, 1)),
                    )
