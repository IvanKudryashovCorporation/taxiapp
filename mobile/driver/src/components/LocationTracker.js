import { useEffect } from "react";
import * as Location from "expo-location";
import { useStore } from "../state";
import { api } from "../api";
import { LOCATION_PUSH_INTERVAL } from "../config";

// Background-ish location pusher: keeps store.location fresh and pings backend
// whenever driver is online. Rendered once at the top of the tab navigator.
export default function LocationTracker() {
  const isOnline = useStore((s) => s.isOnline);
  const setLocation = useStore((s) => s.setLocation);

  useEffect(() => {
    let watcher = null;
    let pushTimer = null;
    let lastLoc = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      try {
        watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 20,
            timeInterval: 5_000,
          },
          (pos) => {
            const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            lastLoc = loc;
            setLocation(loc);
          }
        );
      } catch (e) {
        console.warn("Location watcher failed", e.message);
      }

      pushTimer = setInterval(() => {
        if (isOnline && lastLoc) {
          api.pushLocation(lastLoc.lat, lastLoc.lon).catch(() => {});
        }
      }, LOCATION_PUSH_INTERVAL);
    })();

    return () => {
      if (watcher) watcher.remove();
      if (pushTimer) clearInterval(pushTimer);
    };
  }, [isOnline, setLocation]);

  return null;
}
