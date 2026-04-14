from __future__ import annotations

from threading import Thread
from typing import Any

from kivy.app import App
from kivy.clock import Clock
from kivy.metrics import dp
from kivy.properties import BooleanProperty, StringProperty
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.screenmanager import Screen

from driver_app.ui.widgets import PanelCard


class DashboardScreen(Screen):
    active_tab = StringProperty("orders")
    current_title = StringProperty("Лента заказов")
    balance_text = StringProperty("0 ₽")
    driver_name = StringProperty("Водитель")
    driver_line = StringProperty("Профиль пока не загружен")
    stats_text = StringProperty("Сегодня 0 ₽ · Неделя 0 ₽ · Месяц 0 ₽")
    ws_state = StringProperty("offline")
    online_label = StringProperty("Не на линии")
    is_online = BooleanProperty(False)

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self._driver: dict[str, Any] | None = None
        self._current_order: dict[str, Any] | None = None
        self._available_orders: list[dict[str, Any]] = []
        self._chat_mode = "operator"

    def on_kv_post(self, *_args: object) -> None:
        self.switch_tab("orders")

    def apply_backend_state(self, payload: dict[str, Any]) -> None:
        self._driver = payload.get("driver")
        self._current_order = payload.get("current_order")
        self._available_orders = payload.get("available_orders") or []
        balance = payload.get("balance") or {}
        stats = payload.get("stats") or {}

        if self._driver:
            self.driver_name = self._driver.get("full_name") or "Водитель"
            vehicle = " • ".join(
                [
                    part
                    for part in [
                        self._driver.get("vehicle_make"),
                        self._driver.get("vehicle_model"),
                        self._driver.get("vehicle_plate"),
                    ]
                    if part
                ]
            ) or "машина еще не заполнена"
            self.driver_line = f"{self._driver.get('public_id', '')} • {vehicle}"
            self.is_online = bool(self._driver.get("is_online"))
            self.online_label = "На линии" if self.is_online else "Не на линии"

        self.balance_text = self._format_money(balance.get("balance", 0))
        self.stats_text = (
            f"Сегодня {self._format_money(stats.get('earnings_day', 0))} · "
            f"Неделя {self._format_money(stats.get('earnings_week', 0))} · "
            f"Месяц {self._format_money(stats.get('earnings_month', 0))}"
        )

        self._render_active_order()
        self._render_available_orders()
        self._update_map()
        self._refresh_chat_mode()

    def switch_tab(self, tab_name: str) -> None:
        self.active_tab = tab_name
        self.current_title = {
            "orders": "Лента заказов",
            "map": "Рабочая карта",
            "chat": "Связь и поддержка",
            "settings": "Профиль и статистика",
        }.get(tab_name, "Лента заказов")
        if "tab_content" in self.ids:
            self.ids.tab_content.current = tab_name
        if tab_name == "chat":
            self._refresh_chat_mode()

    def toggle_online(self, active: bool) -> None:
        app = App.get_running_app()
        if app is None or not hasattr(app, "api"):
            return

        def worker() -> None:
            try:
                app.api.post(
                    "/api/driver/presence",
                    json_data={"is_online": bool(active)},
                )
                Clock.schedule_once(lambda *_: app.refresh_driver_state(), 0)
            except Exception as exc:
                message = str(exc)
                Clock.schedule_once(lambda *_ , message=message: setattr(self, "stats_text", message), 0)

        Thread(target=worker, daemon=True).start()

    def refresh_data(self) -> None:
        app = App.get_running_app()
        if app is not None and hasattr(app, "refresh_driver_state"):
            app.refresh_driver_state()

    def handle_ws_event(self, payload: dict[str, Any]) -> None:
        event_type = payload.get("type")
        if event_type in {"order.created", "order.accepted", "order.updated", "order.cancelled", "order.completed", "driver.location", "driver.presence"}:
            self.refresh_data()
        if event_type == "chat.message" and self.active_tab == "chat":
            chat = self.ids.get("chat_panel")
            if chat is not None:
                chat.start_polling()

    def show_operator_chat(self) -> None:
        self._chat_mode = "operator"
        self._refresh_chat_mode()

    def show_passenger_chat(self) -> None:
        self._chat_mode = "ride"
        self._refresh_chat_mode()

    def accept_order(self, order_public_id: str) -> None:
        self._call_order_action(
            f"/api/driver/orders/{order_public_id}/accept",
            {},
        )

    def decline_order(self, order_public_id: str) -> None:
        self._call_order_action(
            f"/api/driver/orders/{order_public_id}/decline",
            {"reason": "Отклонено водителем"},
        )

    def update_active_status(self, status: str) -> None:
        if not self._current_order:
            return
        self._call_order_action(
            f"/api/driver/orders/{self._current_order['public_id']}/status",
            {"status": status},
        )

    def cancel_active_order(self) -> None:
        if not self._current_order:
            return
        self._call_order_action(
            f"/api/driver/orders/{self._current_order['public_id']}/cancel",
            {"reason": "Отменено водителем"},
        )

    def _call_order_action(self, path: str, payload: dict[str, Any]) -> None:
        app = App.get_running_app()
        if app is None or not hasattr(app, "api"):
            return

        def worker() -> None:
            try:
                app.api.post(path, json_data=payload)
                Clock.schedule_once(lambda *_: app.refresh_driver_state(), 0)
            except Exception as exc:
                message = str(exc)
                Clock.schedule_once(lambda *_ , message=message: setattr(self, "stats_text", message), 0)

        Thread(target=worker, daemon=True).start()

    def _render_active_order(self) -> None:
        box = self.ids.get("active_order_box")
        if box is None:
            return
        box.clear_widgets()
        if not self._current_order:
            box.add_widget(self._build_empty_state("Сейчас активного заказа нет. Когда поступит новая поездка, карточка появится здесь."))
            return

        order = self._current_order
        card = self._make_order_card(
            order,
            active=True,
            subtitle=f"Статус: {self._human_status(order.get('status'))} · Оплата: {self._human_payment(order.get('payment_method'))}",
        )
        box.add_widget(card)

        buttons = {
            "accepted": ("Выехал к пассажиру", "driver_on_the_way"),
            "driver_on_the_way": ("Подъезжаю, выходите", "driver_nearby_leave_now"),
            "driver_nearby_leave_now": ("Прибыл на место", "arrived"),
            "arrived": ("Начать поездку", "ride_in_progress"),
            "ride_in_progress": ("Завершить поездку", "completed"),
        }

        actions = BoxLayout(size_hint_y=None, height=dp(48), spacing=dp(8))
        if order["status"] in buttons:
            title, next_status = buttons[order["status"]]
            primary_btn = self._make_action_button(title, (0.03, 0.09, 0.22, 1))
            primary_btn.bind(on_release=lambda *_args: self.update_active_status(next_status))
            actions.add_widget(primary_btn)

        cancel_btn = self._make_action_button("Отменить заказ", (0.79, 0.24, 0.24, 1))
        cancel_btn.bind(on_release=lambda *_args: self.cancel_active_order())
        actions.add_widget(cancel_btn)
        box.add_widget(actions)

    def _render_available_orders(self) -> None:
        box = self.ids.get("available_orders_box")
        if box is None:
            return
        box.clear_widgets()

        if self._current_order:
            box.add_widget(self._build_empty_state("Новые заказы скрыты, пока не завершена текущая поездка."))
            return

        if not self._available_orders:
            box.add_widget(self._build_empty_state("Свободных заказов пока нет. Оставайтесь на линии, новые появятся автоматически."))
            return

        for order in self._available_orders:
            card = self._make_order_card(
                order,
                active=False,
                subtitle=f"{self._human_payment(order.get('payment_method'))} · {order.get('car_class', 'econom')}",
            )
            actions = BoxLayout(size_hint_y=None, height=dp(44), spacing=dp(8))

            accept_btn = self._make_action_button("Принять", (0.03, 0.09, 0.22, 1))
            accept_btn.bind(on_release=lambda _btn, public_id=order["public_id"]: self.accept_order(public_id))
            actions.add_widget(accept_btn)

            decline_btn = self._make_action_button(
                "Пропустить",
                (0.90, 0.93, 0.98, 1),
                text_color=(0.08, 0.12, 0.22, 1),
            )
            decline_btn.bind(on_release=lambda _btn, public_id=order["public_id"]: self.decline_order(public_id))
            actions.add_widget(decline_btn)

            card.add_widget(actions)
            box.add_widget(card)

    def _update_map(self) -> None:
        map_panel = self.ids.get("map_panel")
        if map_panel is not None:
            map_panel.set_payload(self._driver or {}, self._available_orders, self._current_order)

    def _refresh_chat_mode(self) -> None:
        chat = self.ids.get("chat_panel")
        if chat is None:
            return
        if self._chat_mode == "ride" and self._current_order:
            chat.configure_mode("ride", self._current_order["public_id"])
        elif self._chat_mode == "ride":
            chat.configure_mode("ride", None)
        else:
            chat.configure_mode("operator", None)

    def _make_order_card(self, order: dict[str, Any], *, active: bool, subtitle: str) -> PanelCard:
        app = App.get_running_app()
        font_bold = getattr(app, "font_bold", "Roboto-Bold") if app else "Roboto-Bold"
        font_regular = getattr(app, "font_regular", "Roboto") if app else "Roboto"

        card = PanelCard(
            size_hint_y=None,
            height=dp(176 if active else 188),
            padding=dp(14),
            spacing=dp(8),
            bg_color=[0.98, 0.99, 1, 1] if active else [1, 1, 1, 1],
            border_color=[0.93, 0.78, 0.23, 1] if active else [0.85, 0.89, 0.95, 1],
        )
        card.add_widget(self._build_card_label(f"{order['public_id']}  •  {self._format_money(order.get('fare_total', 0))}", font_bold, "17sp", (0.05, 0.10, 0.22, 1), dp(26)))
        card.add_widget(self._build_card_label(subtitle, font_regular, "12sp", (0.36, 0.45, 0.58, 1), dp(20)))
        card.add_widget(self._build_card_label(f"Подача\n{order['pickup_address']}", font_regular, "14sp", (0.08, 0.12, 0.22, 1), dp(42)))
        card.add_widget(self._build_card_label(f"Маршрут\n{order['dropoff_address']}", font_regular, "14sp", (0.08, 0.12, 0.22, 1), dp(42)))
        comment = (order.get("comment") or "").strip() or "Комментарий не указан"
        card.add_widget(self._build_card_label(f"Комментарий: {comment}", font_regular, "12sp", (0.36, 0.45, 0.58, 1), dp(24)))
        return card

    @staticmethod
    def _make_action_button(
        title: str,
        color: tuple[float, float, float, float],
        *,
        text_color: tuple[float, float, float, float] = (1, 1, 1, 1),
    ) -> Button:
        return Button(
            text=title,
            size_hint_y=None,
            height=dp(44),
            background_normal="",
            background_down="",
            background_color=color,
            color=text_color,
        )

    @staticmethod
    def _build_empty_state(text: str) -> Label:
        label = Label(
            text=text,
            color=(0.38, 0.47, 0.60, 1),
            halign="left",
            valign="middle",
            size_hint_y=None,
            height=dp(72),
        )
        label.bind(width=lambda inst, value: setattr(inst, "text_size", (value, None)))
        return label

    @staticmethod
    def _build_card_label(text: str, font_name: str, font_size: str, color: tuple[float, float, float, float], height: float) -> Label:
        label = Label(
            text=text,
            font_name=font_name,
            font_size=font_size,
            color=color,
            halign="left",
            valign="middle",
            size_hint_y=None,
            height=height,
        )
        label.bind(width=lambda inst, value: setattr(inst, "text_size", (value, None)))
        return label

    @staticmethod
    def _format_money(value: Any) -> str:
        return f"{float(value or 0):,.0f} ₽".replace(",", " ")

    @staticmethod
    def _human_status(status: str | None) -> str:
        mapping = {
            "created": "новый",
            "searching_driver": "ищет водителя",
            "accepted": "принят",
            "driver_on_the_way": "водитель в пути",
            "driver_nearby_leave_now": "водитель подъезжает",
            "arrived": "водитель на месте",
            "ride_in_progress": "поездка идет",
            "completed": "завершен",
            "cancelled": "отменен",
        }
        return mapping.get(status or "", status or "—")

    @staticmethod
    def _human_payment(payment_method: str | None) -> str:
        mapping = {"cash": "Наличные", "card": "Карта", "sbp": "СБП"}
        return mapping.get(payment_method or "", payment_method or "Оплата")
