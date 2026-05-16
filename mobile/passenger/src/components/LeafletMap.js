// LeafletMap (passenger) — Google Maps в WebView со светлой темой.
// Стили из shared/map/style.js (единый источник правды для driver/passenger/operator-web).
import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

import { LIGHT_STYLE, THEME_BG, DEFAULT_GMAPS_KEY } from "../../../../shared/map/style.js";

function buildHTML(centerLat, centerLon) {
  const styleJson = JSON.stringify(LIGHT_STYLE);
  const bg = THEME_BG.light;
  const apiKey = DEFAULT_GMAPS_KEY;

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: ${bg}; }
  .gm-style-cc { display: none !important; }
  .gmnoprint:not(.gm-bundled-control) { display: none !important; }
  .gm-style a[href^="https://maps.google.com"],
  .gm-style a[href^="https://www.google.com/maps"] { display: none !important; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map, userDot, userRing;
  var routePolyline = null;
  var mapMarkers = [];
  var mapReady = false;
  var pendingCmds = [];

  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: ${centerLat}, lng: ${centerLon} },
      zoom: 16,
      disableDefaultUI: true,
      styles: ${styleJson},
      gestureHandling: 'greedy',
      clickableIcons: false,
    });

    map.addListener('center_changed', function() {
      var c = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'center', lat: c.lat(), lon: c.lng() }));
    });

    google.maps.event.addListenerOnce(map, 'idle', function() {
      mapReady = true;
      pendingCmds.forEach(function(cmd) { executeCmd(cmd); });
      pendingCmds = [];
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    });
  }

  function setUserLocation(lat, lon) {
    if (userRing) userRing.setMap(null);
    if (userDot)  userDot.setMap(null);
    var pos = { lat: lat, lng: lon };
    userRing = new google.maps.Circle({
      center: pos, map: map,
      radius: 22, fillColor: '#F5CF31', fillOpacity: 0.22,
      strokeWeight: 0, clickable: false,
    });
    userDot = new google.maps.Circle({
      center: pos, map: map,
      radius: 9, fillColor: '#F5CF31', fillOpacity: 1,
      strokeColor: '#FFFFFF', strokeWeight: 3, clickable: false,
    });
  }

  function setRoute(coords) {
    if (routePolyline) routePolyline.setMap(null);
    var path = coords.map(function(c) { return { lat: c[0], lng: c[1] }; });
    routePolyline = new google.maps.Polyline({
      path: path, map: map,
      strokeColor: '#1A1A17', strokeWeight: 5, strokeOpacity: 0.9,
    });
  }

  function clearRoute() {
    if (routePolyline) { routePolyline.setMap(null); routePolyline = null; }
  }

  function setMarkers(list) {
    mapMarkers.forEach(function(m) { m.setMap(null); });
    mapMarkers = [];
    list.forEach(function(m) {
      var isA = m.label === 'А' || m.label === 'A';
      var color = m.color || (isA ? '#F2A65A' : '#0E0E0C');
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
        '<circle cx="16" cy="16" r="13" fill="' + color + '" stroke="#FFFFFF" stroke-width="3"/>' +
        '<text x="16" y="20" font-size="12" font-weight="700" text-anchor="middle" fill="' +
        (isA ? '#0E0E0C' : '#FFFFFF') + '">' + (m.label || '') + '</text>' +
        '</svg>';
      var marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lon }, map: map,
        icon: {
          url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
        zIndex: 80, optimized: false,
      });
      mapMarkers.push(marker);
    });
  }

  function executeCmd(msg) {
    if (msg.cmd === 'setView') {
      map.setCenter({ lat: msg.lat, lng: msg.lon });
      if (msg.zoom) map.setZoom(msg.zoom);
    }
    if (msg.cmd === 'setUserLocation') setUserLocation(msg.lat, msg.lon);
    if (msg.cmd === 'setRoute')        setRoute(msg.coords);
    if (msg.cmd === 'clearRoute')      clearRoute();
    if (msg.cmd === 'setMarkers')      setMarkers(msg.markers || []);
  }

  document.addEventListener('message', handleMsg);
  window.addEventListener('message', handleMsg);
  function handleMsg(e) {
    try {
      var msg = JSON.parse(e.data);
      if (!mapReady) { pendingCmds.push(msg); return; }
      executeCmd(msg);
    } catch(err) {}
  }
<\/script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ru&region=RU&callback=initMap"><\/script>
</body>
</html>`;
}

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

  return (
    <View style={[styles.root, style]}>
      <WebView
        ref={webviewRef}
        source={{ html: buildHTML(centerLat, centerLon), baseUrl: 'https://localhost' }}
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
  webview: { flex: 1, backgroundColor: THEME_BG.light },
});
