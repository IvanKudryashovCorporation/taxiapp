from __future__ import annotations

from threading import Thread

from kivy.app import App
from kivy.clock import Clock
from kivy.metrics import dp
from kivy.properties import StringProperty
from kivy.uix.label import Label
from kivy.uix.screenmanager import Screen

from passenger_app.services import chat as passenger_chat
from passenger_app.ui.widgets import MessageBubble, PanelCard


class MainScreen(Screen):
    mode = StringProperty("create")
    quote_text = StringProperty("Цена появится после расчета маршрута.")
    ride_text = StringProperty("Активного заказа нет.")
    status_text = StringProperty("")
    ws_state = StringProperty("offline")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_order = None
        self.history_items = []
        self.chat_last_id = 0

    def on_kv_post(self, *_args) -> None:
        if "panel_modes" in self.ids:
            self.ids.panel_modes.current = self.mode

    def switch_mode(self, mode: str) -> None:
        self.mode = mode
        self.ids.panel_modes.current = mode
        if mode == "history":
            self.render_history()
        elif mode == "ride":
            self.render_ride()

    def apply_state(self, payload: dict) -> None:
        self.current_order = payload.get("current_order")
        self.history_items = payload.get("history") or []
        self.ids.map_panel.set_ride_state(self.current_order)
        self.render_ride()
        if self.current_order and self.mode == "create":
            self.switch_mode("ride")
        elif not self.current_order and self.mode == "ride":
            self.switch_mode("create")
        if self.mode == "history":
            self.render_history()

    def use_center_for_pickup(self) -> None:
        lat, lon = self.ids.map_panel.get_center_point()
        self.ids.pickup_lat.text = str(lat)
        self.ids.pickup_lon.text = str(lon)
        self.status_text = "Точка А взята из центра карты."

    def use_center_for_dropoff(self) -> None:
        lat, lon = self.ids.map_panel.get_center_point()
        self.ids.dropoff_lat.text = str(lat)
        self.ids.dropoff_lon.text = str(lon)
        self.status_text = "Точка Б взята из центра карты."

    def quote_order(self) -> None:
        self._run_backend_action("quote")

    def create_order(self) -> None:
        self._run_backend_action("create")

    def cancel_order(self) -> None:
        if not self.current_order:
            return
        app = App.get_running_app()
        if app is None:
            return

        def worker():
            try:
                app.api.post(
                    f"/api/passenger/orders/{self.current_order['public_id']}/cancel",
                    json_data={"reason": "Отменено пассажиром"},
                )
                Clock.schedule_once(lambda *_: app.refresh_passenger_state(), 0)
            except Exception as exc:
                Clock.schedule_once(lambda *_: setattr(self, "status_text", str(exc)), 0)

        Thread(target=worker, daemon=True).start()

    def send_chat(self) -> None:
        if not self.current_order:
            return
        text = self.ids.chat_input.text.strip()
        if not text:
            return
        self.status_text = ""
        if not self.current_order.get("driver_public_id"):
            self.status_text = "Чат станет доступен после назначения водителя."
            return
        self.ids.chat_input.text = ""
        self.ids.chat_box.add_widget(MessageBubble(text=text, mine=True))

        def worker():
            try:
                passenger_chat.send_message(self.current_order["public_id"], text)
                passenger_chat.flush_outbox(self.current_order["public_id"])
                Clock.schedule_once(lambda *_: self.load_chat(), 0)
            except Exception as exc:
                Clock.schedule_once(lambda *_: setattr(self, "status_text", str(exc)), 0)

        Thread(target=worker, daemon=True).start()

    def load_chat(self) -> None:
        if not self.current_order:
            return

        def worker():
            try:
                items = passenger_chat.fetch_messages(self.current_order["public_id"], 0)
                Clock.schedule_once(lambda *_: self._apply_chat(items), 0)
            except Exception as exc:
                Clock.schedule_once(lambda *_: setattr(self, "status_text", str(exc)), 0)

        Thread(target=worker, daemon=True).start()

    def submit_feedback(self, rating: int, reason: str) -> None:
        if not self.current_order:
            return
        if self.current_order.get("status") != "completed":
            self.status_text = "Оценка станет доступна после завершения поездки."
            return
        app = App.get_running_app()
        if app is None:
            return

        def worker():
            try:
                app.api.post(
                    f"/api/passenger/orders/{self.current_order['public_id']}/feedback",
                    json_data={
                        "rating": rating,
                        "complaint_reason": reason or None,
                        "complaint_text": self.ids.feedback_text.text.strip(),
                    },
                )
                Clock.schedule_once(lambda *_: setattr(self, "status_text", "Отзыв отправлен оператору."), 0)
            except Exception as exc:
                Clock.schedule_once(lambda *_: setattr(self, "status_text", str(exc)), 0)

        Thread(target=worker, daemon=True).start()

    def render_ride(self) -> None:
        if not self.current_order:
            self.ride_text = "Сейчас нет активного заказа. Создайте новый маршрут на вкладке «Заказ»."
            self.ids.chat_box.clear_widgets()
            return
        order = self.current_order
        driver_name = order.get("driver_full_name") or "Ищем водителя"
        car_text = " ".join(
            [
                part
                for part in [
                    order.get("vehicle_make"),
                    order.get("vehicle_model"),
                    order.get("vehicle_plate"),
                ]
                if part
            ]
        ) or "машина появится после назначения"
        color_text = order.get("vehicle_color") or "цвет уточняется"
        eta_text = ""
        if order.get("driver_to_pickup_duration_seconds"):
            eta_text = f"\nПодача: {max(1, round(float(order['driver_to_pickup_duration_seconds']) / 60))} мин"
        self.ride_text = (
            f"Заказ {order.get('public_id')}\n"
            f"Статус: {self._human_status(order.get('status'))}\n"
            f"Водитель: {driver_name}\n"
            f"Машина: {car_text}\n"
            f"Цвет: {color_text}\n"
            f"Стоимость: {self._format_money(order.get('fare_total', 0))}{eta_text}"
        )
        self.load_chat()

    def render_history(self) -> None:
        box = self.ids.history_box
        box.clear_widgets()
        if not self.history_items:
            box.add_widget(self._make_history_card("История пока пустая.", "Ваши завершенные и отмененные поездки появятся здесь."))
            return
        for item in self.history_items:
            title = f"{item['pickup_address']} → {item['dropoff_address']}"
            subtitle = f"{item['public_id']} • {self._format_money(item.get('fare_total', 0))} • {self._human_status(item.get('status'))}"
            box.add_widget(self._make_history_card(title, subtitle))

    def handle_ws_event(self, payload: dict) -> None:
        if payload.get("type") in {
            "order.created",
            "order.accepted",
            "order.updated",
            "order.cancelled",
            "order.completed",
            "driver.location",
        }:
            app = App.get_running_app()
            if app is not None and hasattr(app, "refresh_passenger_state"):
                app.refresh_passenger_state()
        if payload.get("type") == "chat.message" and self.mode == "ride":
            self.load_chat()

    def _run_backend_action(self, action: str) -> None:
        app = App.get_running_app()
        if app is None or not hasattr(app, "api"):
            return
        self.status_text = ""
        payload = {
            "pickup_address": self.ids.pickup_address.text.strip() or None,
            "pickup_lat": self._as_float(self.ids.pickup_lat.text),
            "pickup_lon": self._as_float(self.ids.pickup_lon.text),
            "dropoff_address": self.ids.dropoff_address.text.strip() or None,
            "dropoff_lat": self._as_float(self.ids.dropoff_lat.text),
            "dropoff_lon": self._as_float(self.ids.dropoff_lon.text),
            "comment": self.ids.comment_input.text.strip(),
            "passengers_count": max(1, int((self.ids.passengers_count.text or "1").strip() or "1")),
            "car_class": self.ids.car_class.text,
            "payment_method": self.ids.payment_method.text,
            "promo_code": self.ids.promo_code.text.strip() or None,
            "waypoints": [],
        }

        def worker():
            try:
                if action == "quote":
                    response = app.api.post("/api/passenger/orders/quote", json_data=payload)
                    Clock.schedule_once(
                        lambda *_: setattr(
                            self,
                            "quote_text",
                            (
                                f"{self._format_money(response['fare_total'])} • "
                                f"{round(response['route_distance_meters'] / 1000, 1)} км • "
                                f"{max(1, round(response['route_duration_seconds'] / 60))} мин"
                            ),
                        ),
                        0,
                    )
                else:
                    app.api.post("/api/passenger/orders", json_data=payload)
                    Clock.schedule_once(lambda *_: app.refresh_passenger_state(go_main=True), 0)
            except Exception as exc:
                Clock.schedule_once(lambda *_: setattr(self, "status_text", str(exc)), 0)

        Thread(target=worker, daemon=True).start()

    def _apply_chat(self, items: list[dict]) -> None:
        box = self.ids.chat_box
        box.clear_widgets()
        for item in items:
            box.add_widget(MessageBubble(text=item.get("text", ""), mine=item.get("sender_type") == "passenger"))
            self.chat_last_id = max(self.chat_last_id, int(item.get("id") or 0))

    def _make_history_card(self, title: str, subtitle: str):
        app = App.get_running_app()
        font_bold = getattr(app, "font_bold", "Roboto-Bold") if app else "Roboto-Bold"
        font_regular = getattr(app, "font_regular", "Roboto") if app else "Roboto"
        card = PanelCard(
            orientation="vertical",
            size_hint_y=None,
            height=dp(92),
            padding=dp(14),
            spacing=dp(4),
            bg_color=[1, 1, 1, 1],
            border_color=[0.85, 0.89, 0.95, 1],
        )
        title_label = Label(
            text=title,
            font_name=font_bold,
            color=(0.07, 0.12, 0.22, 1),
            halign="left",
            valign="middle",
            size_hint_y=None,
            height=dp(38),
        )
        title_label.bind(width=lambda inst, value: setattr(inst, "text_size", (value, None)))
        card.add_widget(title_label)

        subtitle_label = Label(
            text=subtitle,
            font_name=font_regular,
            color=(0.39, 0.47, 0.60, 1),
            halign="left",
            valign="middle",
            size_hint_y=None,
            height=dp(24),
        )
        subtitle_label.bind(width=lambda inst, value: setattr(inst, "text_size", (value, None)))
        card.add_widget(subtitle_label)
        return card

    @staticmethod
    def _human_status(status: str | None) -> str:
        mapping = {
            "created": "новый",
            "searching_driver": "поиск водителя",
            "accepted": "водитель назначен",
            "driver_on_the_way": "водитель в пути",
            "driver_nearby_leave_now": "водитель подъезжает",
            "arrived": "водитель на месте",
            "ride_in_progress": "поездка идет",
            "completed": "поездка завершена",
            "cancelled": "заказ отменен",
        }
        return mapping.get(status or "", status or "—")

    @staticmethod
    def _format_money(value: float | int) -> str:
        return f"{float(value or 0):,.0f} ₽".replace(",", " ")

    @staticmethod
    def _as_float(raw: str) -> float | None:
        raw = (raw or "").strip().replace(",", ".")
        if not raw:
            return None
        return float(raw)
