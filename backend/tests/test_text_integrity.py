from __future__ import annotations

import unittest
from pathlib import Path


class TextIntegrityTests(unittest.TestCase):
    ROOT = Path(__file__).resolve().parents[2]

    def test_critical_ui_files_use_utf8_without_bom(self) -> None:
        paths = [
            self.ROOT / "backend" / "main.py",
            self.ROOT / "backend" / "admin_page.html",
            self.ROOT / "driver_app" / "config.py",
            self.ROOT / "passenger_app" / "config.py",
            self.ROOT / "passenger_app" / "ui" / "kv" / "passenger.kv",
        ]
        for path in paths:
            with self.subTest(path=path):
                self.assertFalse(path.read_bytes().startswith(b"\xef\xbb\xbf"), f"{path} should not include UTF-8 BOM")

    def test_russian_labels_are_not_mojibake(self) -> None:
        passenger_kv = (self.ROOT / "passenger_app" / "ui" / "kv" / "passenger.kv").read_text(encoding="utf-8")
        backend_main = (self.ROOT / "backend" / "main.py").read_text(encoding="utf-8")
        admin_page = (self.ROOT / "backend" / "admin_page.html").read_text(encoding="utf-8")

        self.assertIn("СЕРВИС ДЛЯ ПАССАЖИРОВ", passenger_kv)
        self.assertIn("Пассажирский кабинет", passenger_kv)
        self.assertIn("ПРОФСОЮЗ", passenger_kv)
        self.assertNotIn("РЎР•Р Р’Р", passenger_kv)
        self.assertNotIn("РџР°СЃСЃР°Р¶", passenger_kv)
        self.assertIn('Профсоюз "Рассвет"', backend_main)
        self.assertIn('Профсоюз "Рассвет"', admin_page)


if __name__ == "__main__":
    unittest.main()
