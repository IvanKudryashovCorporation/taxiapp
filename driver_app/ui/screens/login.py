from __future__ import annotations

from kivy.app import App
from kivy.properties import StringProperty
from kivy.uix.screenmanager import Screen


class LoginScreen(Screen):
    status_text = StringProperty("")

    def submit_code(self) -> None:
        app = App.get_running_app()
        if app is None or not hasattr(app, "login_driver"):
            self.status_text = "Ошибка приложения. Перезапустите окно и попробуйте снова."
            return

        invite_code = self.ids.invite_input.text.strip()
        ok, message = app.login_driver(invite_code)

        if ok:
            self.status_text = ""
            self.ids.invite_input.text = ""
            return

        self.status_text = message
