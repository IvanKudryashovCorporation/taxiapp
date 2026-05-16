// LeafletMap (driver) — Google Maps в WebView с тёмной темой.
// Стили из shared/map/style.js (единый источник правды для driver/passenger/operator-web).
import React, { useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

import { DARK_STYLE, THEME_BG, DEFAULT_GMAPS_KEY } from "../../../../shared/map/style.js";
import { CAR_IMG_SRC } from "./carImage.js";

function buildHTML(centerLat, centerLon) {
  const styleJson = JSON.stringify(DARK_STYLE);
  const carSrcJson = JSON.stringify(CAR_IMG_SRC);
  const bg = THEME_BG.dark;
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
  var map;
  var mapReady = false;
  var pendingCmds = [];
  var orderMarkers = [];
  var carOverlay = null;
  var CarOverlayClass = null;
  var prevDeg = 0;

  function initCarOverlayClass() {
    // Вызывается ПОСЛЕ загрузки Maps API (внутри initMap), когда google.maps доступен
    function CarOverlay() { this.latLng = null; this.deg = 0; }
    CarOverlay.prototype = Object.create(google.maps.OverlayView.prototype);
    CarOverlay.prototype.constructor = CarOverlay;
    CarOverlay.prototype.onAdd = function() {
      var div = document.createElement('div');
      div.style.cssText = 'position:absolute;width:80px;height:80px;margin-left:-40px;margin-top:-40px;pointer-events:none;';
      var img = document.createElement('img');
      img.src = ${carSrcJson};
      img.style.cssText = 'width:44px;height:51px;position:absolute;left:18px;top:14.5px;filter:drop-shadow(0px 2px 4px rgba(0,0,0,0.55));transform-origin:22px 25.5px;transition:transform 0.3s linear;';
      div.appendChild(img);
      this._div = div;
      this._img = img;
      this.getPanes().overlayLayer.appendChild(div);
    };
    CarOverlay.prototype.draw = function() {
      if (!this.latLng || !this._div) return;
      var p = this.getProjection().fromLatLngToDivPixel(this.latLng);
      this._div.style.left = Math.round(p.x) + 'px';
      this._div.style.top  = Math.round(p.y) + 'px';
    };
    CarOverlay.prototype.onRemove = function() {
      if (this._div && this._div.parentNode) this._div.parentNode.removeChild(this._div);
      this._div = null;
    };
    CarOverlay.prototype.setPositionAndAngle = function(lat, lon, deg) {
      this.latLng = new google.maps.LatLng(lat, lon);
      if (this._img) this._img.style.transform = 'rotate(' + deg + 'deg)';
      this.draw();
    };
    CarOverlayClass = CarOverlay;
  }

  function initMap() {
    initCarOverlayClass();
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
    map.addListener('dragstart', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'userDrag' }));
    });

    google.maps.event.addListenerOnce(map, 'idle', function() {
      mapReady = true;
      pendingCmds.forEach(function(cmd) { executeCmd(cmd); });
      pendingCmds = [];
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    });
  }

  function setCarPosition(lat, lon, compassHeading) {
    var target = (compassHeading !== null && compassHeading !== undefined && compassHeading >= 0) ? compassHeading : prevDeg;
    var diff   = ((target - prevDeg + 540) % 360) - 180;
    var smooth = prevDeg + diff;
    prevDeg = smooth;
    if (!carOverlay) {
      carOverlay = new CarOverlayClass();
      carOverlay.setMap(map);
    }
    carOverlay.setPositionAndAngle(lat, lon, smooth);
  }

  function setOrderMarkers(list) {
    orderMarkers.forEach(function(m) { m.setMap(null); });
    orderMarkers = [];
    list.forEach(function(m) {
      var color = m.color || '#F5CF31';
      var label = m.priceLabel || m.label || '';
      var svgCircle = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">' +
        '<circle cx="20" cy="20" r="17" fill="' + color + '" stroke="#0E0E0C" stroke-width="2.5"/>' +
        '</svg>';
      var marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lon },
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgCircle),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
        label: label ? { text: label, color: '#0E0E0C', fontSize: '11px', fontWeight: '700', fontFamily: 'monospace' } : undefined,
        zIndex: 50, optimized: false,
      });
      (function(idx) {
        marker.addListener('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerTap', index: idx }));
        });
      })(m.index != null ? m.index : 0);
      orderMarkers.push(marker);
    });
  }

  function executeCmd(msg) {
    if (msg.cmd === 'setView') {
      map.setCenter({ lat: msg.lat, lng: msg.lon });
      if (msg.zoom) map.setZoom(msg.zoom);
    } else if (msg.cmd === 'panTo') {
      map.panTo({ lat: msg.lat, lng: msg.lon });
    } else if (msg.cmd === 'setCar') {
      setCarPosition(msg.lat, msg.lon, msg.heading);
    } else if (msg.cmd === 'setMarkers') {
      setOrderMarkers(msg.markers);
    }
  }

  document.addEventListener('message', handleMsg);
  window.addEventListener('message', handleMsg);
  function handleMsg(e) {
    try {
      var msg = JSON.parse(e.data);
      if (!mapReady) { pendingCmds.push(msg); return; }
      executeCmd(msg);
    } catch (err) {}
  }
<\/script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ru&region=RU&callback=initMap"><\/script>
</body>
</html>`;
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
    setCenter(lat, lon, zoom = 16) {
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
        source={{ html: buildHTML(centerLat, centerLon), baseUrl: 'https://localhost' }}
        style={styles.webview}
        scrollEnabled={false}
        allowFileAccessFromFileURLs={false}
        mixedContentMode="always"
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
  webview: { flex: 1, backgroundColor: THEME_BG.dark },
});
