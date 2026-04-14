from __future__ import annotations

import sys
from pathlib import Path
from threading import Thread

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
from kivy.clock import Clock
from kivy.core.window import Window
from kivy.lang import Builder
from kivy.properties import StringProperty

from driver_app.services import auth as session_store
from driver_app.services import chat as chat_store
from driver_app.services.backend import create_client, make_ws_url
from driver_app.ui.fonts import prepare_fonts
import driver_app.ui  # noqa: F401
from driver_app.ui.root import DriverRoot
from shared.ws_client import RealtimeClient


class DriverMobileApp(App):
    title = APP_TITLE
    font_regular = StringProperty("Roboto")
    font_bold = StringProperty("Roboto-Bold")
    font_display = StringProperty("Roboto-Bold")
    font_emoji = StringProperty("Roboto")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        regular, bold, display = prepare_fonts()
        self.font_regular = regular
        self.font_bold = bold
        self.font_display = display
        emoji_path = Path(r"C:\Windows\Fonts\seguiemj.ttf")
        self.font_emoji = emoji_path.as_posix() if emoji_path.exists() else regular
        self.api = create_client()
        self.ws_client: RealtimeClient | None = None
        self.driver: dict | None = None

    def build(self) -> DriverRoot:
        if IS_MOBILE:
            Window.softinput_mode = "below_target"
        Window.clearcolor = WINDOW_BACKGROUND
        Builder.load_file(str(KV_FILE))
        return DriverRoot()

    def on_start(self) -> None:
        session = session_store.load_session()
        if session and session.get("token"):
            self.api.set_token(session["token"])
            chat_store.configure(self.api)
            self._connect_ws(session["token"])
            self.refresh_driver_state(go_dashboard=True)

    def on_stop(self) -> None:
        if self.ws_client:
            self.ws_client.close()

    def login_driver(self, invite_code: str) -> tuple[bool, str]:
        invite_code = invite_code.strip().upper()
        if not invite_code:
            return False, "Введите пригласительный код."
        try:
            payload = self.api.post("/api/auth/driver/login", json_data={"invite_code": invite_code})
        except Exception as exc:
            return False, str(exc)

        token = payload["token"]
        self.driver = payload["driver"]
        self.api.set_token(token)
        session_store.save_session({"token": token})
        chat_store.configure(self.api)
        self._connect_ws(token)
        self.refresh_driver_state(go_dashboard=True)
        return True, "ok"

    def refresh_driver_state(self, *, go_dashboard: bool = False) -> None:
        def worker() -> None:
            try:
                payload = self.api.get("/api/driver/me")
                Clock.schedule_once(lambda *_: self._apply_driver_state(payload, go_dashboard), 0)
            except Exception as exc:
                message = str(exc)
                Clock.schedule_once(lambda *_ , message=message: self._apply_driver_error(message, go_dashboard), 0)

        Thread(target=worker, daemon=True).start()

    def _apply_driver_state(self, payload: dict, go_dashboard: bool) -> None:
        self.driver = payload.get("driver")
        if self.root is None:
            return
        dashboard = self.root.get_screen("dashboard")
        dashboard.apply_backend_state(payload)
        if go_dashboard:
            self.root.current = "dashboard"

    def _apply_driver_error(self, message: str, go_dashboard: bool) -> None:
        if self.root is None:
            return
        login = self.root.get_screen("login")
        login.status_text = message
        if go_dashboard:
            self.root.current = "login"

    def _connect_ws(self, token: str) -> None:
        if self.ws_client:
            self.ws_client.close()
        self.ws_client = RealtimeClient(
            make_ws_url(token),
            on_message=self._on_ws_message,
            on_state=self._on_ws_state,
        )
        self.ws_client.connect()

    def _on_ws_message(self, payload: dict) -> None:
        Clock.schedule_once(lambda *_: self._dispatch_ws_message(payload), 0)

    def _dispatch_ws_message(self, payload: dict) -> None:
        if self.root is None:
            return
        dashboard = self.root.get_screen("dashboard")
        dashboard.handle_ws_event(payload)

    def _on_ws_state(self, state: str) -> None:
        Clock.schedule_once(lambda *_: self._dispatch_ws_state(state), 0)

    def _dispatch_ws_state(self, state: str) -> None:
        if self.root is None:
            return
        dashboard = self.root.get_screen("dashboard")
        dashboard.ws_state = state


if __name__ == "__main__":
    DriverMobileApp().run()
