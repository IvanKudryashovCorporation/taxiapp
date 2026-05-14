import React, { useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

/* ── SVG машинки (вид сверху, 52×90 px) ────────────────────────────────────
   Встроен прямо в HTML через JSON.stringify — никаких внешних файлов,
   никаких проблем с URI/base64 на Android.                                  */
const CAR_IMG_SRC = 'data:image/png;base64,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';

function buildHTML(centerLat, centerLon) {
  const imgSrcJson = JSON.stringify(CAR_IMG_SRC);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  html,body,#map { margin:0; padding:0; width:100%; height:100%; background:#0F121C; }
  .leaflet-container { background:#1A1E2E; }
  .leaflet-control-zoom       { display:none !important; }
  .leaflet-control-attribution{ display:none !important; }
  .leaflet-attribution-flag   { display:none !important; }

  .car-icon-outer {
    background: transparent !important;
    border: none !important;
    overflow: visible !important;
    display: block !important;
  }
  .car-rotate {
    width: 66px; height: 76px;
    transform-origin: 33px 38px;
    transition: transform 0.4s ease-out;
    display: block !important;
    filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.55));
  }
  .car-rotate img { width: 66px; height: 76px; display: block !important; pointer-events: none; }

  .price-tip {
    background: #0E0E0C !important;
    border: none !important;
    border-radius: 12px !important;
    color: #F4F1EA !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    font-family: monospace !important;
    padding: 4px 10px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
    white-space: nowrap !important;
    letter-spacing: 0.3px !important;
  }
  .price-tip::before { display: none !important; }
<\/style>
<\/head>
<body>
<div id="map"><\/div>
<script>
  /* PNG машинки как data URL */
  var CAR_IMG_SRC = ${imgSrcJson};

  var map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    markerZoomAnimation: false,
    zoomSnap: 0.5
  }).setView([${centerLat},${centerLon}], 14);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  /* PNG машинки смотрит ~45 NE -> компенсируем */
  var CAR_BASE_ANGLE = -45;

  var prevCarLat = null, prevCarLon = null, carBearing = 0;

  function getBearing(lat1, lon1, lat2, lon2) {
    var phi1 = lat1 * Math.PI / 180;
    var phi2 = lat2 * Math.PI / 180;
    var dl   = (lon2 - lon1) * Math.PI / 180;
    var y = Math.sin(dl) * Math.cos(phi2);
    var x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dl);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

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

    var deg = (carBearing + CAR_BASE_ANGLE + 360) % 360;

    if (carMarker) {
      carMarker.setLatLng([lat, lon]);
      var el = carMarker.getElement();
      if (el) {
        var rot = el.querySelector('.car-rotate');
        if (rot) {
          var prev = parseFloat(rot.dataset.deg || 0);
          var diff = ((deg - prev + 540) % 360) - 180;
          var smooth = prev + diff;
          rot.dataset.deg = smooth;
          rot.style.transform = 'rotate(' + smooth + 'deg)';
        }
      }
    } else {
      var icon = L.divIcon({
        className: 'car-icon-outer',
        html: '<div class="car-rotate" style="transform:rotate(' + deg + 'deg)"><img src="' + CAR_IMG_SRC + '" alt=""/></div>',
        iconSize:   [66, 76],
        iconAnchor: [33, 38]
      });
      carMarker = L.marker([lat, lon], { icon: icon, zIndexOffset: 1000 }).addTo(map);
    }
  }

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
        permanent: true, direction: 'top', offset: [0, -18], className: 'price-tip'
      });

      (function(idx) {
        marker.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerTap', index: idx }));
        });
      })(m.index != null ? m.index : 0);

      orderMarkers.push(marker);
    });
  }

  document.addEventListener('message', handleMsg);
  window.addEventListener('message', handleMsg);
  function handleMsg(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.cmd === 'setView')    map.setView([msg.lat, msg.lon], msg.zoom || 14);
      if (msg.cmd === 'panTo')      map.panTo([msg.lat, msg.lon]);
      if (msg.cmd === 'setCar')     setCarPosition(msg.lat, msg.lon, msg.heading);
      if (msg.cmd === 'setMarkers') setOrderMarkers(msg.markers);
    } catch(err) {}
  }

  map.on('moveend', function() {
    var c = map.getCenter();
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'center', lat: c.lat, lon: c.lng }));
  });

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
    panTo(lat, lon) {
      send({ cmd: "panTo", lat, lon });
    },
    setCar(lat, lon, heading = null) {
      send({ cmd: "setCar", lat, lon, heading });
    },
    setMarkers(markers) {
      send({ cmd: "setMarkers", markers: markers.map((m, i) => ({ ...m, index: i })) });
    },
  }));

  const handleLoadEnd = useCallback(() => {
    onReady?.();
  }, [onReady]);

  return (
    <View style={[styles.root, style]}>
      <WebView
        ref={webviewRef}
        source={{ html: buildHTML(centerLat, centerLon) }}
        style={styles.webview}
        scrollEnabled={false}
        onLoadEnd={handleLoadEnd}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === "center" && onCenterChange) {
              onCenterChange(data.lat, data.lon);
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
