from __future__ import annotations

from kivy.app import App
from kivy.properties import StringProperty
from kivy.uix.screenmanager import Screen


class VerifyScreen(Screen):
    phone_text = StringProperty("")
    status_text = StringProperty("")

    def submit_code(self) -> None:
        app = App.get_running_app()
        if app is None or not hasattr(app, "verify_passenger_code"):
            self.status_text = "Ошибка приложения."
            return
        ok, message = app.verify_passenger_code(self.phone_text, self.ids.code_input.text.strip())
        if ok:
            self.status_text = ""
            self.ids.code_input.text = ""
        else:
            self.status_text = message
