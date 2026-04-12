from __future__ import annotations

from kivy.app import App
from kivy.properties import StringProperty
from kivy.uix.boxlayout import BoxLayout

from passenger_app.config import APP_NAME, APP_TYPE, BACKEND_URL
from shared.api_client import send_ping


class LoginScreen(BoxLayout):
    status_text = StringProperty(" ")

    def submit_code(self) -> None:
        invite_code = self.ids.invite_input.text.strip()
        if not invite_code:
            self.status_text = "Введите пригласительный код."
            return

        try:
            result = send_ping(
                base_url=BACKEND_URL,
                app_type=APP_TYPE,
                app_name=f"{APP_NAME}:{invite_code}",
            )
            count = result["counts"]["passenger_pings"]
            self.status_text = f"Код принят. Пассажиров онлайн: {count}."
        except Exception as exc:
            self.status_text = f"Сервер недоступен: {exc}"
