from __future__ import annotations

from typing import Any

from kivy.properties import StringProperty
from kivy.uix.screenmanager import Screen


class DashboardScreen(Screen):
    active_tab = StringProperty("orders")
    current_title = StringProperty("В заказе")
    earned_text = StringProperty("15 840 ₽")
    driver_line = StringProperty("ID водителя: DR-1024 · Комфорт+")

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self._driver_id = "DR-1024"

    def on_kv_post(self, *_args: object) -> None:
        self.switch_tab("orders")

    def switch_tab(self, tab_name: str) -> None:
        self.active_tab = tab_name
        titles = {
            "orders": "В заказе",
            "map": "Карта",
            "chat": "Связь",
            "settings": "Настройки",
        }
        self.current_title = titles.get(tab_name, "В заказе")

        if "tab_content" not in self.ids:
            return

        self.ids.tab_content.current = tab_name

        if tab_name == "map":
            map_panel = self._get_map_panel()
            if map_panel is not None:
                map_panel.refresh_location()
            self._stop_chat_polling()
            return

        if tab_name == "chat":
            self._show_chat_contacts()
            self._stop_chat_polling()
            return

        self._stop_chat_polling()

    def apply_driver_code(self, invite_code: str) -> None:
        suffix = invite_code[-4:].upper() if invite_code else "1024"
        self._driver_id = f"DR-{suffix}"
        self.driver_line = f"ID водителя: {self._driver_id} · Комфорт+"

        chat = self._get_chat_panel()
        if chat is not None:
            chat.setup(self._driver_id)

    def open_chat(self, _contact: str) -> None:
        self.current_title = "Оператор"

        nav = self.ids.get("chat_nav")
        if nav is not None:
            nav.current = "conversation"

        chat = self._get_chat_panel()
        if chat is None:
            return

        if not getattr(chat, "_driver_id", ""):
            chat.setup(self._driver_id)
        else:
            chat.start_polling()

    def close_chat(self) -> None:
        self.current_title = "Связь"
        self._show_chat_contacts()
        self._stop_chat_polling()

    def _show_chat_contacts(self) -> None:
        nav = self.ids.get("chat_nav")
        if nav is not None:
            nav.current = "contacts"

    def _stop_chat_polling(self) -> None:
        chat = self._get_chat_panel()
        if chat is not None:
            chat.stop_polling()

    def _get_map_panel(self) -> Any | None:
        return self.ids.get("map_panel")

    def _get_chat_panel(self) -> Any | None:
        return self.ids.get("chat_panel")
