import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

function buildHTML(centerLat, centerLon, markers) {
  const markersJS = markers
    .map((m) => {
      const color = m.color || "red";
      return `L.circleMarker([${m.lat}, ${m.lon}], {radius:10,color:'${color}',fillColor:'${color}',fillOpacity:0.9}).addTo(map).bindPopup(${JSON.stringify(m.label || "")});`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;padding:0;width:100%;height:100%;background:#0F121C;}
  .leaflet-container{background:#1a1e2e;}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', {zoomControl:true, attributionControl:false}).setView([${centerLat},${centerLon}], 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    maxZoom:19
  }).addTo(map);
  ${markersJS}
  map.on('moveend', function(){
    var c = map.getCenter();
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'center',lat:c.lat,lon:c.lng}));
  });
</script>
</body>
</html>`;
}

const LeafletMap = forwardRef(function LeafletMap(
  { centerLat = 55.7558, centerLon = 37.6173, markers = [], onCenterChange, style },
  ref
) {
  const webviewRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setCenter(lat, lon, zoom = 14) {
      webviewRef.current?.injectJavaScript(
        `map.setView([${lat},${lon}],${zoom});true;`
      );
    },
    setMarkers(newMarkers) {
      const js = `
        map.eachLayer(function(l){if(l instanceof L.CircleMarker)map.removeLayer(l);});
        ${newMarkers.map((m) => `L.circleMarker([${m.lat},${m.lon}],{radius:10,color:'${m.color||"red"}',fillColor:'${m.color||"red"}',fillOpacity:0.9}).addTo(map).bindPopup(${JSON.stringify(m.label||"")});`).join("\n")}
        true;
      `;
      webviewRef.current?.injectJavaScript(js);
    },
  }));

  const html = buildHTML(centerLat, centerLon, markers);

  return (
    <View style={[styles.root, style]}>
      <WebView
        ref={webviewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === "center" && onCenterChange) {
              onCenterChange(data.lat, data.lon);
            }
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
  root: { flex: 1, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "#0F121C" },
});
