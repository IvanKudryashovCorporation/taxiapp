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
from kivy.clock import Clock
from kivy.core.window import Window
from kivy.lang import Builder
from kivy.properties import StringProperty

from passenger_app.services import auth as session_store
from passenger_app.services import chat as chat_store
from passenger_app.services.backend import create_client, make_ws_url
from passenger_app.ui.fonts import prepare_fonts
import passenger_app.ui  # noqa: F401 - registers KV classes
from passenger_app.ui.root import PassengerRoot
from shared.ws_client import RealtimeClient


class PassengerMobileApp(App):
    title = APP_TITLE
    font_regular = StringProperty("Roboto")
    font_bold = StringProperty("Roboto-Bold")
    font_display = StringProperty("Roboto-Bold")

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self.font_regular, self.font_bold, self.font_display = prepare_fonts()
        self.api = create_client()
        self.ws_client: RealtimeClient | None = None
        self.passenger: dict | None = None
        self.pending_phone = ""

    def build(self) -> PassengerRoot:
        if IS_MOBILE:
            Window.softinput_mode = "below_target"
        else:
            Window.minimum_width = WINDOW_MIN_WIDTH
            Window.minimum_height = WINDOW_MIN_HEIGHT
        Window.clearcolor = WINDOW_BACKGROUND
        Builder.load_file(str(KV_FILE))
        return PassengerRoot()

    def on_start(self) -> None:
        session = session_store.load_session()
        if session and session.get("token"):
            self.api.set_token(session["token"])
            chat_store.configure(self.api)
            self._connect_ws(session["token"])
            self.refresh_passenger_state(go_main=True)

    def on_stop(self) -> None:
        if self.ws_client:
            self.ws_client.close()

    def request_passenger_code(self, phone: str) -> tuple[bool, str]:
        phone = phone.strip()
        if not phone:
            return False, "Введите номер телефона."
        try:
            payload = self.api.post("/api/auth/passenger/request-code", json_data={"phone": phone})
        except Exception as exc:
            return False, str(exc)

        self.pending_phone = payload["phone"]
        if self.root is not None:
            verify = self.root.get_screen("verify")
            verify.phone_text = self.pending_phone
            verify.status_text = f"Тестовый код: {payload.get('test_code', '0000')}"
            verify.ids.code_input.text = ""
            self.root.current = "verify"
        return True, "ok"

    def verify_passenger_code(self, phone: str, code: str) -> tuple[bool, str]:
        phone = (phone or self.pending_phone).strip()
        code = code.strip()
        if not phone:
            return False, "Сначала запросите код."
        if not code:
            return False, "Введите SMS-код."
        try:
            payload = self.api.post(
                "/api/auth/passenger/verify-code",
                json_data={"phone": phone, "code": code},
            )
        except Exception as exc:
            return False, str(exc)

        token = payload["token"]
        self.passenger = payload["passenger"]
        self.api.set_token(token)
        session_store.save_session({"token": token})
        chat_store.configure(self.api)
        self._connect_ws(token)
        self.refresh_passenger_state(go_main=True)
        return True, "ok"

    def refresh_passenger_state(self, *, go_main: bool = False) -> None:
        def worker() -> None:
            try:
                me = self.api.get("/api/passenger/me")
                history = self.api.get("/api/passenger/orders/history")
                payload = {
                    "passenger": me.get("passenger"),
                    "current_order": me.get("current_order"),
                    "history": history.get("items", []),
                }
                Clock.schedule_once(lambda *_: self._apply_passenger_state(payload, go_main), 0)
            except Exception as exc:
                Clock.schedule_once(lambda *_: self._apply_passenger_error(str(exc), go_main), 0)

        Thread(target=worker, daemon=True).start()

    def _apply_passenger_state(self, payload: dict, go_main: bool) -> None:
        self.passenger = payload.get("passenger")
        if self.root is None:
            return
        main = self.root.get_screen("main")
        main.apply_state(payload)
        if go_main:
            self.root.current = "main"

    def _apply_passenger_error(self, message: str, go_main: bool) -> None:
        if self.root is None:
            return
        lowered = message.lower()
        if "401" in lowered or "authorization" in lowered or "сесс" in lowered:
            session_store.clear_session()
            self.api.set_token("")
            self.passenger = None
            login = self.root.get_screen("login")
            login.status_text = "Сессия истекла. Войдите заново."
            self.root.current = "login"
            return
        main = self.root.get_screen("main")
        main.status_text = message
        if go_main:
            self.root.current = "main"

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
        main = self.root.get_screen("main")
        main.handle_ws_event(payload)

    def _on_ws_state(self, state: str) -> None:
        Clock.schedule_once(lambda *_: self._dispatch_ws_state(state), 0)

    def _dispatch_ws_state(self, state: str) -> None:
        if self.root is None:
            return
        main = self.root.get_screen("main")
        main.ws_state = state


if __name__ == "__main__":
    PassengerMobileApp().run()
