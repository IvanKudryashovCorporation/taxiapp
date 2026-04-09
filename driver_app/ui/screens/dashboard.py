from __future__ import annotations

from typing import Any

from kivy.properties import StringProperty
from kivy.uix.screenmanager import Screen


class DashboardScreen(Screen):
    active_tab = StringProperty("orders")
    current_title = StringProperty("В заказе")
    earned_text = StringProperty("15 840 ₽")
    driver_line = StringProperty("ID водителя: DR-1024 · Комфорт+")

    def on_kv_post(self, *_args) -> None:
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

        if "tab_content" in self.ids:
            self.ids.tab_content.current = tab_name
            if tab_name == "map":
                map_panel = self._get_map_panel()
                if map_panel is not None:
                    map_panel.refresh_location()

    def apply_driver_code(self, invite_code: str) -> None:
        suffix = invite_code[-4:].upper() if invite_code else "1024"
        self.driver_line = f"ID водителя: DR-{suffix} · Комфорт+"

    def _get_map_panel(self) -> Any | None:
        tab_content = self.ids.get("tab_content")
        if tab_content is None:
            return None

        try:
            map_screen = tab_content.get_screen("map")
        except Exception:
            return None

        return map_screen.ids.get("map_panel")
