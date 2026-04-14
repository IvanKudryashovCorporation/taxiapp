from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi import HTTPException

from backend.services import driver_service


class DriverServiceTests(unittest.TestCase):
    def test_update_location_rejects_banned_or_inactive_driver(self) -> None:
        driver = {"id": 4, "is_banned": True, "is_active": False}

        with patch("backend.services.driver_service.driver_repo.update_driver_location") as update_location:
            with self.assertRaises(HTTPException) as ctx:
                driver_service.update_location(driver, 55.75, 37.61)

        self.assertEqual(ctx.exception.status_code, 403)
        update_location.assert_not_called()


if __name__ == "__main__":
    unittest.main()
