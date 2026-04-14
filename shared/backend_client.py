from __future__ import annotations

from typing import Any

import requests


class BackendClient:
    def __init__(self, base_url: str, token: str = "") -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.session = requests.Session()

    def set_token(self, token: str) -> None:
        self.token = token

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def request(self, method: str, path: str, *, json_data: dict[str, Any] | None = None, params: dict[str, Any] | None = None, timeout: float = 10.0) -> dict[str, Any]:
        response = self.session.request(
            method,
            f"{self.base_url}{path}",
            json=json_data,
            params=params,
            headers=self._headers(),
            timeout=timeout,
        )
        payload = response.json() if response.content else {}
        if not response.ok:
            detail = payload.get("detail") or payload.get("message") or f"HTTP {response.status_code}"
            raise RuntimeError(str(detail))
        return payload

    def get(self, path: str, *, params: dict[str, Any] | None = None, timeout: float = 10.0) -> dict[str, Any]:
        return self.request("GET", path, params=params, timeout=timeout)

    def post(self, path: str, *, json_data: dict[str, Any] | None = None, timeout: float = 10.0) -> dict[str, Any]:
        return self.request("POST", path, json_data=json_data, timeout=timeout)
