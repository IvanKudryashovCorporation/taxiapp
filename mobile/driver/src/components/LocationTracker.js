import { useEffect } from "react";
import * as Location from "expo-location";
import { useStore } from "../state";
import { api } from "../api";
import { LOCATION_PUSH_INTERVAL } from "../config";

// Tracks GPS position + compass heading. Rendered once at root of tab navigator.
export default function LocationTracker() {
  const setLocation = useStore((s) => s.setLocation);
  const setHeading  = useStore((s) => s.setHeading);

  useEffect(() => {
    let posWatcher     = null;
    let headingWatcher = null;
    let pushTimer      = null;
    let lastLoc        = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      // ── GPS position ────────────────────────────────────────────────────
      try {
        posWatcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 5,
            timeInterval: 2_000,
          },
          (pos) => {
            const loc = {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            };
            lastLoc = loc;
            setLocation(loc);
          }
        );
      } catch (e) {
        console.warn("GPS watcher failed", e.message);
      }

      // ── Compass heading ──────────────────────────────────────────────────
      try {
        headingWatcher = await Location.watchHeadingAsync((h) => {
          // trueHeading = -1 when unavailable; fall back to magHeading
          const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (deg >= 0) setHeading(deg);
        });
      } catch (e) {
        console.warn("Heading watcher failed", e.message);
      }

      // ── Backend push (пропускаем в тест-режиме) ──────────────────────────
      pushTimer = setInterval(() => {
        if (lastLoc) {
          const token = useStore.getState().token;
          if (token && !token.startsWith("test-token-")) {
            api.pushLocation(lastLoc.lat, lastLoc.lon).catch(() => {});
          }
        }
      }, LOCATION_PUSH_INTERVAL);
    })();

    return () => {
      posWatcher?.remove();
      headingWatcher?.remove();
      if (pushTimer) clearInterval(pushTimer);
    };
  }, [setLocation, setHeading]);

  return null;
}
