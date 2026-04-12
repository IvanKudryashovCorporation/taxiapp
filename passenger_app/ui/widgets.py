from __future__ import annotations

from kivy.graphics import Color, Rectangle, RoundedRectangle
from kivy.uix.widget import Widget


class TaxiStripe(Widget):
    """Decorative taxi-style striped bar (navy + yellow segments)."""

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self.bind(pos=self._redraw, size=self._redraw)
        self._redraw()

    def _redraw(self, *_args: object) -> None:
        self.canvas.before.clear()
        with self.canvas.before:
            Color(0.19, 0.22, 0.30, 1)
            RoundedRectangle(pos=self.pos, size=self.size, radius=[self.height / 2] * 4)

            inset = 2
            segment_count = 10
            segment_width = (
                (self.width - inset * 2) / segment_count if segment_count else self.width
            )
            for index in range(segment_count):
                if index % 2 == 1:
                    Color(0.95, 0.80, 0.23, 1)
                    Rectangle(
                        pos=(self.x + inset + index * segment_width, self.y + inset),
                        size=(segment_width, max(self.height - inset * 2, 1)),
                    )
