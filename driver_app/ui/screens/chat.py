from __future__ import annotations

from threading import Thread
from typing import Any

from kivy.clock import Clock
from kivy.properties import StringProperty
from kivy.uix.boxlayout import BoxLayout

from driver_app.ui.widgets import MessageBubble


class ChatPanel(BoxLayout):
    status_text = StringProperty("")
    mode_title = StringProperty("Оператор")

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self._mode = "operator"
        self._order_public_id: str | None = None
        self._last_id = 0
        self._poll_event = None
        self._known_ids: set[int] = set()
        self._local_texts: list[str] = []

    def configure_mode(self, mode: str, order_public_id: str | None = None) -> None:
        self._mode = mode
        self._order_public_id = order_public_id
        self.mode_title = "Пассажир" if mode == "ride" else "Оператор"
        self._last_id = 0
        self._known_ids.clear()
        self._local_texts.clear()
        self._clear()
        if mode == "ride" and not order_public_id:
            self.status_text = "Нет активного заказа для переписки с пассажиром."
            self.stop_polling()
            return
        self.status_text = ""
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
            return
        msg_input.text = ""
        self._local_texts.append(text)
        self._append_bubble(text, True)

        def worker() -> None:
            from driver_app.services.chat import send_message

            send_message(self._mode, text, self._order_public_id)

        Thread(target=worker, daemon=True).start()

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

    def _fetch(self) -> None:
        Thread(target=self._do_fetch, daemon=True).start()

    def _do_fetch(self) -> None:
        try:
            from driver_app.services.chat import fetch_messages, flush_outbox

            flush_outbox(self._mode, self._order_public_id)
            messages = fetch_messages(self._mode, self._last_id, self._order_public_id)
            Clock.schedule_once(lambda *_: self._on_messages(messages), 0)
        except Exception as exc:
            message = str(exc)
            Clock.schedule_once(lambda *_ , message=message: setattr(self, "status_text", message), 0)

    def _on_messages(self, messages: list[dict[str, Any]]) -> None:
        for message in messages:
            self._append_from_payload(message)

    def _append_from_payload(self, message: dict[str, Any]) -> None:
        message_id = int(message.get("id", 0))
        if message_id and message_id in self._known_ids:
            return
        if message_id:
            self._known_ids.add(message_id)
            self._last_id = max(self._last_id, message_id)

        text = str(message.get("text") or "")
        sender_type = str(message.get("sender_type") or "")
        if not text:
            return
        if sender_type == "driver" and text in self._local_texts:
            self._local_texts.remove(text)
            return
        self._append_bubble(text, sender_type == "driver")

    def _append_bubble(self, text: str, is_driver: bool) -> None:
        box = self.ids.get("messages_list")
        if box is None:
            return
        box.add_widget(MessageBubble(text=text, is_driver=is_driver))
        Clock.schedule_once(lambda *_: self._scroll_to_bottom(), 0.05)

    def _scroll_to_bottom(self) -> None:
        scroll = self.ids.get("chat_scroll")
        if scroll is not None:
            scroll.scroll_y = 0
