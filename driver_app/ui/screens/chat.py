from __future__ import annotations

from threading import Thread
from typing import Any

from kivy.clock import Clock
from kivy.properties import StringProperty
from kivy.uix.boxlayout import BoxLayout

from driver_app.ui.widgets import MessageBubble


class ChatPanel(BoxLayout):
    """Driver <-> operator chat panel with polling and persistent history."""

    status_text = StringProperty("")

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self._driver_id: str = ""
        self._last_id: int = 0
        self._poll_event = None
        self._known_ids: set[int] = set()

    def setup(self, driver_id: str) -> None:
        self._driver_id = driver_id
        self._last_id = 0
        self._known_ids.clear()
        self._clear()
        self.status_text = "История загружается..."

        def register_worker() -> None:
            try:
                from driver_app.services.chat import register_driver

                register_driver(driver_id)
            except Exception:
                Clock.schedule_once(
                    lambda *_: self._set_status("Сервер недоступен. История появится после восстановления соединения."),
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

        draft_text = msg_input.text
        text = draft_text.strip()
        if not text:
            self._set_status("Введите текст сообщения.")
            return

        if not self._driver_id:
            self._set_status("Чат не инициализирован. Перезайдите в диалог.")
            return

        self._set_status("")

        def send_worker() -> None:
            try:
                from driver_app.services.chat import send_message

                message = send_message(self._driver_id, "driver", text)

                def on_success(*_args: object) -> None:
                    current_input = self.ids.get("msg_input")
                    if current_input is not None and current_input.text == draft_text:
                        current_input.text = ""
                    self._append_from_payload(message)
                    self._set_status("")

                Clock.schedule_once(on_success, 0)
            except Exception:
                Clock.schedule_once(
                    lambda *_: self._set_status("Сообщение не отправлено. Проверьте подключение к backend."),
                    0,
                )

        Thread(target=send_worker, daemon=True).start()

    def add_emoji(self, symbol: str) -> None:
        msg_input = self.ids.get("msg_input")
        if msg_input is None:
            return
        msg_input.text = f"{msg_input.text}{symbol}"
        msg_input.focus = True

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

            messages = fetch_messages(self._driver_id, since=self._last_id)
            Clock.schedule_once(lambda *_: self._on_messages(messages), 0)
        except Exception:
            Clock.schedule_once(
                lambda *_: self._set_status("Сервер недоступен. Ожидаем восстановление соединения..."),
                0,
            )

    def _on_messages(self, messages: list[dict[str, Any]]) -> None:
        if messages:
            self._set_status("")
        elif not self._known_ids:
            self._set_status("История пуста. Напишите оператору первым.")

        for message in messages:
            self._append_from_payload(message)

    def _append_from_payload(self, message: dict[str, Any]) -> None:
        message_id = int(message.get("id", 0))
        if message_id and message_id in self._known_ids:
            return

        if message_id:
            self._known_ids.add(message_id)
            self._last_id = max(self._last_id, message_id)

        sender = str(message.get("sender", "admin"))
        text = str(message.get("text", ""))
        if not text:
            return

        self._append_bubble(text=text, is_driver=(sender == "driver"))

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
