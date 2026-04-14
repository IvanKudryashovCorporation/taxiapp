from __future__ import annotations

from kivy.uix.screenmanager import ScreenManager


class PassengerRoot(ScreenManager):
    def on_kv_post(self, *_args: object) -> None:
        if self.has_screen("login"):
            self.current = "login"
