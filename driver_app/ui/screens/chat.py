from __future__ import annotations

from threading import Thread
from typing import Any

from kivy.clock import Clock
from kivy.properties import StringProperty
from kivy.uix.boxlayout import BoxLayout

from driver_app.ui.widgets import MessageBubble


class ChatPanel(BoxLayout):
    """Driver <-> operator chat panel with polling and send support."""

    status_text = StringProperty("")

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self._driver_id: str = ""
        self._last_id: int = 0
        self._poll_event = None
        self._known_ids: set[int] = set()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def setup(self, driver_id: str) -> None:
        self._driver_id = driver_id
        self._last_id = 0
        self._known_ids.clear()
        self._clear()
        self.status_text = ""

        self._append_system(f"Чат подключен: {driver_id}")

        def register_worker() -> None:
            try:
                from driver_app.services.chat import register_driver

                register_driver(driver_id)
            except Exception:
                Clock.schedule_once(
                    lambda *_: self._set_status("Сервер недоступен. Сообщения отправятся после восстановления."),
                    0,
                )

        Thread(target=register_worker, daemon=True).start()
        self.start_polling()

    def start_polling(self) -> None:
        if self._poll_event:
            self._poll_event.cancel()
        self._fetch()
        self._poll_event = Clock.schedule_interval(lambda *_: self._fetch(), 2.0)

    def stop_polling(self) -> None:
        if self._poll_event:
            self._poll_event.cancel()
            self._poll_event = None

    def send_message(self) -> None:
        msg_input = self.ids.get("msg_input")
        if msg_input is None:
            return

        text = msg_input.text.strip()
        if not text:
            self._set_status("Введите текст сообщения.")
            return

        if not self._driver_id:
            self._set_status("Чат не инициализирован. Перезайдите в диалог.")
            return

        msg_input.text = ""
        self._set_status("")

        def send_worker() -> None:
            try:
                from driver_app.services.chat import send_message

                message = send_message(self._driver_id, "driver", text)
                Clock.schedule_once(lambda *_: self._append_from_payload(message), 0)
            except Exception:
                Clock.schedule_once(lambda *_: self._set_status("Ошибка отправки. Проверьте подключение."), 0)

        Thread(target=send_worker, daemon=True).start()

    def add_emoji(self, symbol: str) -> None:
        msg_input = self.ids.get("msg_input")
        if msg_input is None:
            return
        msg_input.text = f"{msg_input.text}{symbol}"
        msg_input.focus = True

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _clear(self) -> None:
        box = self.ids.get("messages_list")
        if box is not None:
            box.clear_widgets()

    def _set_status(self, text: str) -> None:
        self.status_text = text

    def _fetch(self) -> None:
        if not self._driver_id:
            return
        Thread(target=self._do_fetch, daemon=True).start()

    def _do_fetch(self) -> None:
        try:
            from driver_app.services.chat import fetch_messages

            msgs = fetch_messages(self._driver_id, since=self._last_id)
            if msgs:
                Clock.schedule_once(lambda *_: self._on_messages(msgs), 0)
        except Exception:
            Clock.schedule_once(lambda *_: self._set_status("Сервер недоступен. Ожидаем восстановление..."), 0)

    def _on_messages(self, msgs: list[dict[str, Any]]) -> None:
        for msg in msgs:
            self._append_from_payload(msg)

    def _append_from_payload(self, msg: dict[str, Any]) -> None:
        msg_id = int(msg.get("id", 0))
        if msg_id and msg_id in self._known_ids:
            return

        if msg_id:
            self._known_ids.add(msg_id)
            self._last_id = max(self._last_id, msg_id)

        sender = str(msg.get("sender", "admin"))
        text = str(msg.get("text", ""))
        if not text:
            return

        self._append_bubble(text=text, is_driver=(sender == "driver"))

    def _append_system(self, text: str) -> None:
        self._append_bubble(text=text, is_driver=False, system=True)

    def _append_bubble(self, text: str, is_driver: bool, system: bool = False) -> None:
        box = self.ids.get("messages_list")
        if box is None:
            return

        bubble = MessageBubble(text=text, is_driver=is_driver, system=system)
        box.add_widget(bubble)

        Clock.schedule_once(lambda *_: self._scroll_to_bottom(), 0.05)

    def _scroll_to_bottom(self) -> None:
        scroll = self.ids.get("chat_scroll")
        if scroll is not None:
            scroll.scroll_y = 0
