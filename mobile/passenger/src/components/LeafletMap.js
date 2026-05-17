// LeafletMap (passenger) — Mapbox GL JS в WebView.
// HTML генерируется из shared/map/buildHTML.js (единый источник правды).
import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

import { buildHTML } from "../../../../shared/map/buildHTML.js";
import { YANDEX_PALETTE } from "../../../../shared/map/mapboxTweaks.js";
import { MAPBOX_TOKEN } from "../mapboxToken.local.js";

const LeafletMap = forwardRef(function LeafletMap(
  { centerLat = 55.7558, centerLon = 37.6173, onCenterChange, onReady, style },
  ref
) {
  const webviewRef = useRef(null);

  function send(obj) {
    webviewRef.current?.injectJavaScript(
      `(function(){var e=new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(obj))}});window.dispatchEvent(e);})();true;`
    );
  }

  useImperativeHandle(ref, () => ({
    setCenter(lat, lon, zoom = 16) {
      send({ cmd: "setView", lat, lon, zoom });
    },
    setUserLocation(lat, lon) {
      send({ cmd: "setUserLocation", lat, lon });
    },
    setMarkers(markers) {
      send({ cmd: "setMarkers", markers });
    },
    setRoute(coords) {
      send({ cmd: "setRoute", coords });
    },
    clearRoute() {
      send({ cmd: "clearRoute" });
    },
  }));

  const html = buildHTML({
    centerLat,
    centerLon,
    zoom: 16,
    token: MAPBOX_TOKEN,
  });

  return (
    <View style={[styles.root, style]}>
      <WebView
        ref={webviewRef}
        source={{ html, baseUrl: "https://localhost" }}
        style={styles.webview}
        scrollEnabled={false}
        allowFileAccessFromFileURLs={false}
        mixedContentMode="always"
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === "center" && onCenterChange) onCenterChange(data.lat, data.lon);
            else if (data.type === "ready" && onReady) onReady();
          } catch {}
        }}
        originWhitelist={["*"]}
        javaScriptEnabled
      />
    </View>
  );
});

export default LeafletMap;

const styles = StyleSheet.create({
  root:    { flex: 1, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: YANDEX_PALETTE.cream },
});
