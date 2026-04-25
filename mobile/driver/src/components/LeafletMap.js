import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

/* ── Real car photo (IMG_3988.PNG resized to 104×180, base64-encoded) ──
   The photo is taken at ~40° clockwise from north, corrected by CAR_BASE_ANGLE = -40
   in the WebView JS so the car points north when heading = 0.               ── */
const CAR_B64 = "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";

function buildHTML(centerLat, centerLon, carB64) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  html,body,#map { margin:0; padding:0; width:100%; height:100%; background:#0F121C; }
  .leaflet-container { background:#1A1E2E; }
  .leaflet-control-zoom      { display:none !important; }
  .leaflet-control-attribution { display:none !important; }
  .leaflet-attribution-flag   { display:none !important; }

  .car-icon-outer {
    background: transparent !important;
    border: none !important;
    overflow: visible !important;
    display: block !important;
    opacity: 1 !important;
  }
  .car-rotate {
    width: 52px; height: 90px;
    transform-origin: 50% 50%;
    transition: transform 0.3s ease-out;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.7));
    display: block !important;
  }
  .car-rotate img { display: block !important; }

  .price-tip {
    background: rgba(245,207,49,0.95) !important;
    border: none !important;
    border-radius: 10px !important;
    color: #1a1a1a !important;
    font-weight: 800 !important;
    font-size: 13px !important;
    padding: 3px 8px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4) !important;
    white-space: nowrap !important;
  }
  .price-tip::before { display: none !important; }
<\/style>
<\/head>
<body>
<div id="map"><\/div>
<script>
  var map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    markerZoomAnimation: false,
    zoomSnap: 0.5
  }).setView([${centerLat},${centerLon}], 14);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  /* ── PNG car (base64, photo of real car rotated ~40° from north) ── */
  var CAR_B64 = '${carB64}';
  var CAR_BASE_ANGLE = -40;   /* correct for the photo tilt */

  /* ── Bearing helpers ── */
  var prevCarLat = null, prevCarLon = null, carBearing = 0;

  function getBearing(lat1, lon1, lat2, lon2) {
    var phi1 = lat1 * Math.PI / 180;
    var phi2 = lat2 * Math.PI / 180;
    var dl   = (lon2 - lon1) * Math.PI / 180;
    var y = Math.sin(dl) * Math.cos(phi2);
    var x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dl);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  /* ── Car marker ── */
  var carMarker = null;
  var orderMarkers = [];

  function setCarPosition(lat, lon, compassHeading) {
    if (compassHeading !== null && compassHeading !== undefined && compassHeading >= 0) {
      carBearing = compassHeading;
    } else if (prevCarLat !== null &&
               (Math.abs(lat - prevCarLat) > 0.00002 || Math.abs(lon - prevCarLon) > 0.00002)) {
      carBearing = getBearing(prevCarLat, prevCarLon, lat, lon);
    }
    prevCarLat = lat;
    prevCarLon = lon;

    var deg = carBearing + CAR_BASE_ANGLE;

    if (carMarker) {
      carMarker.setLatLng([lat, lon]);
      var el = carMarker.getElement();
      if (el) {
        var rot = el.querySelector('.car-rotate');
        if (rot) rot.style.transform = 'rotate(' + deg + 'deg)';
      }
    } else {
      var icon = L.divIcon({
        className: 'car-icon-outer',
        html: '<div class="car-rotate" style="transform:rotate(' + deg + 'deg)">' +
              '<img src="data:image/png;base64,' + CAR_B64 + '" width="52" height="90" style="display:block;"/>' +
              '<\\/div>',
        iconSize:   [52, 90],
        iconAnchor: [26, 45]
      });
      carMarker = L.marker([lat, lon], { icon: icon, zIndexOffset: 1000 }).addTo(map);
    }
  }

  /* ── Order markers ── */
  function setOrderMarkers(list) {
    orderMarkers.forEach(function(m) { map.removeLayer(m); });
    orderMarkers = [];
    list.forEach(function(m) {
      var marker = L.circleMarker([m.lat, m.lon], {
        radius: 16,
        color: m.color || '#F5CF31',
        fillColor: m.color || '#F5CF31',
        fillOpacity: 0.95,
        weight: 3
      }).addTo(map);

      marker.bindTooltip(m.priceLabel || m.label || '', {
        permanent: true,
        direction: 'top',
        offset: [0, -18],
        className: 'price-tip'
      });

      (function(idx) {
        marker.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerTap', index: idx }));
        });
      })(m.index != null ? m.index : 0);

      orderMarkers.push(marker);
    });
  }

  /* ── Messages from React Native ── */
  document.addEventListener('message', handleMsg);
  window.addEventListener('message', handleMsg);
  function handleMsg(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.cmd === 'setView')    map.setView([msg.lat, msg.lon], msg.zoom || 14);
      if (msg.cmd === 'setCar')     setCarPosition(msg.lat, msg.lon, msg.heading);
      if (msg.cmd === 'setMarkers') setOrderMarkers(msg.markers);
    } catch(err) {}
  }

  /* ── Map events → React Native ── */
  map.on('moveend', function() {
    var c = map.getCenter();
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'center', lat: c.lat, lon: c.lng }));
  });

  /* user touched the map → disable auto-follow */
  map.on('dragstart', function() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'userDrag' }));
  });

  map.whenReady(function() {
    setTimeout(function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    }, 300);
  });
<\/script>
<\/body>
<\/html>`;
}

const LeafletMap = forwardRef(function LeafletMap(
  { centerLat = 55.7558, centerLon = 37.6173, onCenterChange, onReady, onMessage, style },
  ref
) {
  const webviewRef = useRef(null);

  function send(obj) {
    webviewRef.current?.injectJavaScript(
      `(function(){var e=new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(obj))}});window.dispatchEvent(e);})();true;`
    );
  }

  useImperativeHandle(ref, () => ({
    setCenter(lat, lon, zoom = 14) {
      send({ cmd: "setView", lat, lon, zoom });
    },
    setCar(lat, lon, heading = null) {
      send({ cmd: "setCar", lat, lon, heading });
    },
    setMarkers(markers) {
      send({ cmd: "setMarkers", markers: markers.map((m, i) => ({ ...m, index: i })) });
    },
  }));

  return (
    <View style={[styles.root, style]}>
      <WebView
        ref={webviewRef}
        source={{ html: buildHTML(centerLat, centerLon, CAR_B64) }}
        style={styles.webview}
        scrollEnabled={false}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === "center" && onCenterChange) {
              onCenterChange(data.lat, data.lon);
            } else if (data.type === "ready") {
              onReady?.();
            } else if (onMessage) {
              onMessage(data);
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
  root:    { flex: 1, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "#0F121C" },
});
