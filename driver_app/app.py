from __future__ import annotations

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from kivy.utils import platform as kivy_platform

IS_MOBILE = kivy_platform in ("android", "ios")

from kivy.config import Config

from driver_app.config import (
    APP_TITLE,
    KV_FILE,
    WINDOW_BACKGROUND,
    WINDOW_HEIGHT,
    WINDOW_MIN_HEIGHT,
    WINDOW_MIN_WIDTH,
    WINDOW_WIDTH,
)

if not IS_MOBILE:
    Config.set("graphics", "width", str(WINDOW_WIDTH))
    Config.set("graphics", "height", str(WINDOW_HEIGHT))
    Config.set("graphics", "minimum_width", str(WINDOW_MIN_WIDTH))
    Config.set("graphics", "minimum_height", str(WINDOW_MIN_HEIGHT))
    Config.set("graphics", "resizable", "1")
else:
    Config.set("graphics", "fullscreen", "auto")

from kivy.app import App
from kivy.core.window import Window
from kivy.lang import Builder
from kivy.properties import StringProperty

from driver_app.services.auth import InviteCodeRegistry
from driver_app.services.backend import ping_driver
from driver_app.ui.fonts import prepare_fonts
import driver_app.ui  # noqa: F401 - registers all KV widget and screen classes
from driver_app.ui.root import DriverRoot


class DriverMobileApp(App):
    title = APP_TITLE
    font_regular = StringProperty("Roboto")
    font_bold = StringProperty("Roboto-Bold")
    font_emoji = StringProperty("Roboto")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._invite_registry = InviteCodeRegistry()
        regular, bold = prepare_fonts()
        self.font_regular = regular
        self.font_bold = bold
        emoji_path = Path(r"C:\Windows\Fonts\seguiemj.ttf")
        self.font_emoji = emoji_path.as_posix() if emoji_path.exists() else regular

    def build(self) -> DriverRoot:
        if IS_MOBILE:
            Window.softinput_mode = "below_target"
        Window.clearcolor = WINDOW_BACKGROUND
        Builder.load_file(str(KV_FILE))
        return DriverRoot()

    def login_driver(self, invite_code: str) -> tuple[bool, str]:
        normalized_code, error = self._invite_registry.claim(invite_code)
        if error or normalized_code is None:
            return False, error or "Неверный код."

        if self.root is None:
            return False, "Сбой приложения. Перезапустите окно."

        dashboard = self.root.get_screen("dashboard")
        dashboard.apply_driver_code(normalized_code)

        ok, backend_error = ping_driver(normalized_code)
        self.root.current = "dashboard"

        if not ok:
            return True, f"Вход выполнен. Сервер недоступен: {backend_error}"

        return True, "ok"


if __name__ == "__main__":
    DriverMobileApp().run()
