from __future__ import annotations

import os
from pathlib import Path

APP_TITLE = 'Профсоюз "Рассвет" | Водитель'
APP_TYPE = "driver"
APP_NAME = "driver-mobile"
BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")

WINDOW_WIDTH = 520
WINDOW_HEIGHT = 860
WINDOW_MIN_WIDTH = 460
WINDOW_MIN_HEIGHT = 760
WINDOW_BACKGROUND = (0.93, 0.95, 0.98, 1)

KV_FILE = Path(__file__).resolve().parent / "ui" / "kv" / "driver.kv"
