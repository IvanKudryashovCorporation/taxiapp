from __future__ import annotations


class InviteCodeRegistry:
    """Keeps invite codes unique for one app runtime session."""

    def __init__(self) -> None:
        self._used_codes: set[str] = set()

    def claim(self, invite_code: str) -> tuple[str | None, str | None]:
        normalized = invite_code.strip().upper()
        if not normalized:
            return None, "Введите любой уникальный код, чтобы продолжить."

        if normalized in self._used_codes:
            return None, "Этот код уже использован. Введите другой уникальный код."

        self._used_codes.add(normalized)
        return normalized, None
