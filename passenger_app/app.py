from __future__ import annotations

import os
import sys
from pathlib import Path

from kivy.utils import platform as kivy_platform

IS_MOBILE = kivy_platform in ("android", "ios")

from kivy.config import Config

if not IS_MOBILE:
    Config.set("graphics", "width", "520")
    Config.set("graphics", "height", "860")
    Config.set("graphics", "resizable", "1")
else:
    Config.set("graphics", "fullscreen", "auto")

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from shared.api_client import send_ping

from kivy.app import App
from kivy.core.text import LabelBase
from kivy.core.window import Window
from kivy.graphics import Color, Rectangle, RoundedRectangle
from kivy.lang import Builder
from kivy.properties import StringProperty
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.widget import Widget

DEFAULT_BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")
APP_TYPE = "passenger"
APP_NAME = "passenger-mobile"


def _prepare_fonts() -> tuple[str, str]:
    regular = "Roboto"
    bold = "Roboto-Bold"

    if not IS_MOBILE:
        try:
            windows_fonts = Path(r"C:\Windows\Fonts")
            regular_path = windows_fonts / "segoeui.ttf"
            bold_path = windows_fonts / "seguisb.ttf"

            if not bold_path.exists():
                bold_path = windows_fonts / "segoeuib.ttf"

            if regular_path.exists() and bold_path.exists():
                LabelBase.register(name="RassvetRegular", fn_regular=str(regular_path))
                LabelBase.register(name="RassvetBold", fn_regular=str(bold_path))
                regular = "RassvetRegular"
                bold = "RassvetBold"
        except Exception:
            pass

    return regular, bold


FONT_REGULAR, FONT_BOLD = _prepare_fonts()

KV = f"""
#:import dp kivy.metrics.dp

<AppRoot>:
    canvas.before:
        Color:
            rgba: 0.93, 0.95, 0.98, 1
        Rectangle:
            pos: self.pos
            size: self.size

    BoxLayout:
        orientation: "vertical"
        padding: dp(30), dp(34), dp(30), dp(24)
        spacing: dp(14)

        Label:
            text: root.top_line
            color: 0.25, 0.34, 0.50, 1
            font_name: "{FONT_BOLD}"
            font_size: "21sp"
            text_size: self.width, None
            halign: "center"
            valign: "middle"
            size_hint_y: None
            height: dp(38)

        Label:
            text: 'ПРОФСОЮЗ\\n"РАССВЕТ"'
            color: 0.03, 0.10, 0.24, 1
            font_name: "{FONT_BOLD}"
            font_size: "58sp"
            line_height: 0.9
            text_size: self.width, None
            halign: "center"
            valign: "middle"
            size_hint_y: None
            height: dp(188)

        Label:
            text: root.subtitle
            color: 0.43, 0.51, 0.63, 1
            font_name: "{FONT_REGULAR}"
            font_size: "18sp"
            text_size: self.width, None
            halign: "center"
            valign: "middle"
            size_hint_y: None
            height: dp(62)

        AnchorLayout:
            size_hint_y: None
            height: dp(22)
            anchor_x: "center"
            anchor_y: "center"
            TaxiStripe:
                size_hint: None, None
                size: dp(182), dp(14)

        Widget:
            size_hint_y: 1

        BoxLayout:
            orientation: "vertical"
            size_hint_y: None
            height: dp(250)
            padding: dp(18)
            spacing: dp(12)
            canvas.before:
                Color:
                    rgba: 0.985, 0.99, 1, 1
                RoundedRectangle:
                    pos: self.pos
                    size: self.size
                    radius: [dp(20), dp(20), dp(20), dp(20)]

            Label:
                text: "Введите свой пригласительный код"
                color: 0.19, 0.27, 0.40, 1
                font_name: "{FONT_BOLD}"
                font_size: "17sp"
                text_size: self.width, None
                halign: "left"
                valign: "middle"
                size_hint_y: None
                height: dp(32)

            TextInput:
                id: invite_input
                hint_text: root.code_hint
                multiline: False
                input_type: "text"
                font_name: "{FONT_REGULAR}"
                font_size: "14sp"
                foreground_color: 0.20, 0.29, 0.41, 1
                hint_text_color: 0.56, 0.62, 0.70, 1
                background_normal: ""
                background_active: ""
                background_color: 0.97, 0.98, 1, 1
                cursor_color: 0.16, 0.26, 0.45, 1
                padding: dp(14), dp(17), dp(14), dp(10)
                size_hint_y: None
                height: dp(54)

            Button:
                text: "Продолжить"
                size_hint_y: None
                height: dp(56)
                background_normal: ""
                background_down: ""
                background_color: 0, 0, 0, 0
                color: 1, 1, 1, 1
                font_name: "{FONT_BOLD}"
                font_size: "18sp"
                on_release: root.submit_code()
                canvas.before:
                    Color:
                        rgba: 0.03, 0.09, 0.22, 1
                    RoundedRectangle:
                        pos: self.pos
                        size: self.size
                        radius: [dp(14), dp(14), dp(14), dp(14)]

            Label:
                text: root.status_text
                color: 0.36, 0.46, 0.60, 1
                font_name: "{FONT_REGULAR}"
                font_size: "12sp"
                text_size: self.width, None
                halign: "left"
                valign: "middle"
                size_hint_y: None
                height: dp(36)
"""


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


class AppRoot(BoxLayout):
    top_line = StringProperty("С Е Р В И С   Д Л Я   П А С С А Ж И Р О В")
    subtitle = StringProperty("Единый вход в приложение заказа такси")
    code_hint = StringProperty("Например: RASSVET-54321")
    status_text = StringProperty(" ")

    def submit_code(self) -> None:
        invite_code = self.ids.invite_input.text.strip()
        if not invite_code:
            self.status_text = "Введите пригласительный код."
            return

        try:
            result = send_ping(
                base_url=DEFAULT_BACKEND_URL,
                app_type=APP_TYPE,
                app_name=f"{APP_NAME}:{invite_code}",
            )
            count = result["counts"]["passenger_pings"]
            self.status_text = f"Код принят. Пинг отправлен. Всего пингов пассажиров: {count}."
        except Exception as exc:  # pragma: no cover - UI message only
            self.status_text = f"Сервер недоступен: {exc}"


class PassengerMobileApp(App):
    title = 'Профсоюз "Рассвет" | Пассажир'

    def build(self) -> AppRoot:
        if IS_MOBILE:
            Window.softinput_mode = "below_target"
        else:
            Window.minimum_width = 460
            Window.minimum_height = 760
        Window.clearcolor = (0.93, 0.95, 0.98, 1)
        Builder.load_string(KV)
        return AppRoot()


if __name__ == "__main__":
    PassengerMobileApp().run()
