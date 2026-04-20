import React, { useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../state";
import { colors } from "../theme";
import LeafletMap from "../components/LeafletMap";

const DEFAULT_LAT = 55.7558;
const DEFAULT_LON = 37.6173;

export default function MapScreen() {
  const location = useStore((s) => s.location);
  const available = useStore((s) => s.available);
  const currentOrder = useStore((s) => s.currentOrder);
  const wsStatus = useStore((s) => s.wsStatus);
  const mapRef = useRef(null);

  // После загрузки карты сразу ставим машинку если GPS уже есть
  const handleMapReady = useCallback(() => {
    const loc = useStore.getState().location;
    if (loc) {
      mapRef.current?.setCenter(loc.lat, loc.lon, 14);
      mapRef.current?.setCar(loc.lat, loc.lon);
    }
  }, []);

  // Fly to driver location and update car icon when GPS updates
  useEffect(() => {
    if (location) {
      mapRef.current?.setCenter(location.lat, location.lon, 14);
      mapRef.current?.setCar(location.lat, location.lon);
    }
  }, [location?.lat, location?.lon]);

  // Update markers when orders change
  useEffect(() => {
    const markers = [];

    available.forEach((o) => {
      if (o.pickup_lat != null) {
        markers.push({
          lat: o.pickup_lat,
          lon: o.pickup_lon,
          color: "#F5CF31",
          label: `${Math.round(o.fare_total)} ₽ — ${o.pickup_address || ""}`,
        });
      }
    });

    if (currentOrder?.pickup_lat != null) {
      markers.push({
        lat: currentOrder.pickup_lat,
        lon: currentOrder.pickup_lon,
        color: "#FF5A4D",
        label: `Клиент: ${currentOrder.pickup_address || ""}`,
      });
    }
    if (currentOrder?.dropoff_lat != null) {
      markers.push({
        lat: currentOrder.dropoff_lat,
        lon: currentOrder.dropoff_lon,
        color: "#5CB8FF",
        label: `Точка Б: ${currentOrder.dropoff_address || ""}`,
      });
    }

    mapRef.current?.setMarkers(markers);
  }, [available, currentOrder]);

  return (
    <View style={styles.root}>
      <LeafletMap
        ref={mapRef}
        centerLat={location?.lat ?? DEFAULT_LAT}
        centerLon={location?.lon ?? DEFAULT_LON}
        style={StyleSheet.absoluteFill}
        onReady={handleMapReady}
      />

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.pill}>
          <View
            style={[
              styles.dot,
              { backgroundColor: wsStatus === "online" ? colors.success : colors.textDim },
            ]}
          />
          <Text style={styles.pillText}>
            {wsStatus === "online" ? "онлайн" : "офлайн"}
            {location ? `  •  ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : ""}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(23,26,38,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  pillText: { color: colors.text, fontSize: 12, fontWeight: "600" },
});
