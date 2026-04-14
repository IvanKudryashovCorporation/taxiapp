from __future__ import annotations

from kivy.app import App
from kivy.properties import StringProperty
from kivy.uix.screenmanager import Screen


class LoginScreen(Screen):
    status_text = StringProperty("")

    def submit_phone(self) -> None:
        app = App.get_running_app()
        if app is None or not hasattr(app, "request_passenger_code"):
            self.status_text = "Ошибка приложения."
            return
        ok, message = app.request_passenger_code(self.ids.phone_input.text.strip())
        if ok:
            self.status_text = ""
        else:
            self.status_text = message
