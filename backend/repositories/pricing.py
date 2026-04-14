from __future__ import annotations

from typing import Any

from backend.database import query, query_one


def get_tariff(car_class: str) -> dict[str, Any] | None:
    return query_one("SELECT * FROM pricing_tariffs WHERE car_class = %s", (car_class,))


def get_all_tariffs() -> list[dict[str, Any]]:
    return query("SELECT * FROM pricing_tariffs ORDER BY car_class")


def get_settings() -> dict[str, float]:
    rows = query("SELECT key, value FROM pricing_settings")
    return {str(row["key"]): float(row["value"]) for row in rows}
