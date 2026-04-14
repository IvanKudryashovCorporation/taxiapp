from __future__ import annotations

import unittest
from unittest.mock import patch

from backend.core.utils import haversine_meters
from backend.services import geo_service


class GeoServiceTests(unittest.TestCase):
    def test_build_route_fallback_sums_all_segments_and_returns_geometry(self) -> None:
        pickup = {"address": "A", "lat": 55.75, "lon": 37.61}
        waypoint = {"address": "B", "lat": 55.76, "lon": 37.62}
        dropoff = {"address": "C", "lat": 55.77, "lon": 37.63}

        with patch("backend.services.geo_service.requests.get", side_effect=RuntimeError("osrm down")):
            route = geo_service.build_route(pickup, dropoff, [waypoint])

        expected_distance = haversine_meters(55.75, 37.61, 55.76, 37.62) + haversine_meters(55.76, 37.62, 55.77, 37.63)
        self.assertEqual(route["route_distance_meters"], expected_distance)
        self.assertEqual(route["route_geometry"]["type"], "LineString")
        self.assertEqual(len(route["route_geometry"]["coordinates"]), 3)


if __name__ == "__main__":
    unittest.main()
