import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

function buildHTML(centerLat, centerLon) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  html,body,#map { margin:0; padding:0; width:100%; height:100%; background:#F0EDE8; }
  .leaflet-container { background:#F0EDE8; }
  .leaflet-control-zoom { display:none !important; }
  .leaflet-attribution-flag { display:none !important; }
  .leaflet-control-attribution { display:none !important; }

  /* Popup для ETA */
  .eta-tip {
    background: #1A1A1A !important;
    border: none !important;
    border-radius: 20px !important;
    color: #fff !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    padding: 6px 14px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25) !important;
    white-space: nowrap !important;
  }
  .eta-tip::before { display:none !important; }

  /* Маркеры заказов */
  .order-marker {
    background: #F5CF31 !important;
    border: 2.5px solid #1A1A1A !important;
    border-radius: 50% !important;
  }
<\/style>
<\/head>
<body>
<div id="map"><\/div>
<script>
  var map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    zoomSnap: 0.5,
  }).setView([${centerLat},${centerLon}], 15);

  /* Светлая тема — как в Яндекс Go */
  L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=AIzaSyCxJVSEVOuJWMkVtuHsDDfFWdLbH0nvXUo', {
    maxZoom: 20,
    subdomains: ['mt0','mt1','mt2','mt3'],
  }).addTo(map);

  /* ── Точка пользователя (жёлтая, как в Яндекс Go) ── */
  var userDot  = null;
  var userRing = null;

  function setUserLocation(lat, lon) {
    if (userRing) map.removeLayer(userRing);
    if (userDot)  map.removeLayer(userDot);

    userRing = L.circleMarker([lat, lon], {
      radius: 18, color: '#F5CF31', fillColor: '#F5CF31',
      fillOpacity: 0.22, weight: 0,
    }).addTo(map);

    userDot = L.circleMarker([lat, lon], {
      radius: 9, color: '#fff', fillColor: '#F5CF31',
      fillOpacity: 1, weight: 3,
    }).addTo(map);
  }

  /* ── Маршрут (чёрная линия) ── */
  var routeLayer = null;

  function setRoute(coords) {
    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.polyline(coords, {
      color: '#1A1A1A', weight: 5,
      opacity: 0.88, lineJoin: 'round', lineCap: 'round',
    }).addTo(map);
    map.fitBounds(routeLayer.getBounds(), { padding: [80, 80] });
  }

  function clearRoute() {
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
  }

  /* ── Маркеры А/Б ── */
  var markerLayers = [];

  function setMarkers(list) {
    markerLayers.forEach(function(l) { map.removeLayer(l); });
    markerLayers = [];
    list.forEach(function(m) {
      var cm = L.circleMarker([m.lat, m.lon], {
        radius: 11,
        color: '#fff', fillColor: m.color || '#F5CF31',
        fillOpacity: 1, weight: 3,
      }).addTo(map);
      if (m.label) cm.bindTooltip(m.label, { permanent:true, direction:'top', offset:[0,-14], className:'eta-tip' });
      markerLayers.push(cm);
    });
  }

  /* ── Сообщения от React Native ── */
  document.addEventListener('message', handleMsg);
  window.addEventListener('message', handleMsg);
  function handleMsg(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.cmd === 'setView')         map.setView([msg.lat, msg.lon], msg.zoom || 15);
      if (msg.cmd === 'setUserLocation') setUserLocation(msg.lat, msg.lon);
      if (msg.cmd === 'setRoute')        setRoute(msg.coords);
      if (msg.cmd === 'clearRoute')      clearRoute();
      if (msg.cmd === 'setMarkers')      setMarkers(msg.markers || []);
    } catch(err) {}
  }

  /* ── События карты → React Native ── */
  map.on('moveend', function() {
    var c = map.getCenter();
    window.ReactNativeWebView.postMessage(JSON.stringify({ type:'center', lat:c.lat, lon:c.lng }));
  });

  map.whenReady(function() {
    setTimeout(function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:'ready' }));
    }, 200);
  });
<\/script>
<\/body>
<\/html>`;
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
    setCenter(lat, lon, zoom = 15) {
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
        source={{ html: buildHTML(centerLat, centerLon) }}
        style={styles.webview}
        scrollEnabled={false}
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
  webview: { flex: 1, backgroundColor: "#F0EDE8" },
});
