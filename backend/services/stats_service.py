from __future__ import annotations

from typing import Any

from backend.repositories import orders as order_repo
from backend.repositories import stats as stats_repo


def get_operator_dashboard() -> dict[str, Any]:
    summary = stats_repo.get_operator_dashboard()
    summary["status_breakdown"] = stats_repo.get_order_status_breakdown()
    summary["active_orders"] = order_repo.list_orders(active_only=True, limit=200)
    return summary


def get_feedback_list() -> list[dict[str, Any]]:
    return stats_repo.list_feedback()
