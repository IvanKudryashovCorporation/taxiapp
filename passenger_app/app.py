from __future__ import annotations

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from kivy.utils import platform as kivy_platform

IS_MOBILE = kivy_platform in ("android", "ios")

from kivy.config import Config

from passenger_app.config import (
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

from passenger_app.ui.fonts import prepare_fonts
import passenger_app.ui  # noqa: F401 — registers all KV widget/screen classes
from passenger_app.ui.screens.login import LoginScreen  # noqa: F401


class PassengerMobileApp(App):
    title = APP_TITLE
    font_regular = StringProperty("Roboto")
    font_bold = StringProperty("Roboto-Bold")

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self.font_regular, self.font_bold = prepare_fonts()

    def build(self) -> LoginScreen:
        if IS_MOBILE:
            Window.softinput_mode = "below_target"
        else:
            Window.minimum_width = WINDOW_MIN_WIDTH
            Window.minimum_height = WINDOW_MIN_HEIGHT
        Window.clearcolor = WINDOW_BACKGROUND
        Builder.load_file(str(KV_FILE))
        return LoginScreen()


if __name__ == "__main__":
    PassengerMobileApp().run()
