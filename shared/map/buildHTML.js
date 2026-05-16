// shared/map/buildHTML.js
// ────────────────────────────────────────────────────────────────────────────
// Возвращает полный HTML-документ для встраивания Google Map в WebView (React Native)
// или iframe (web fallback). Использует единые стили из ./style.js.
// ────────────────────────────────────────────────────────────────────────────

import { LIGHT_STYLE, DARK_STYLE, THEME_BG, DEFAULT_GMAPS_KEY } from "./style.js";

/**
 * @param {object} opts
 * @param {"light"|"dark"} [opts.theme="light"]
 * @param {string}  [opts.apiKey]                 — Google Maps API key
 * @param {number}  [opts.centerLat=44.6166]
 * @param {number}  [opts.centerLon=33.5254]
 * @param {number}  [opts.zoom=16]
 * @param {boolean} [opts.disableGesture=false]   — для preview-режима блокирует драг
 * @returns {string} HTML-документ
 */
export function buildHTML(opts = {}) {
  const {
    theme = "light",
    apiKey = DEFAULT_GMAPS_KEY,
    centerLat = 44.6166,
    centerLon = 33.5254,
    zoom = 16,
    disableGesture = false,
  } = opts;

  const styleArr = theme === "dark" ? DARK_STYLE : LIGHT_STYLE;
  const bgColor = THEME_BG[theme] || THEME_BG.light;
  const styleJson = JSON.stringify(styleArr);
  const gesture = disableGesture ? "none" : "greedy";

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: ${bgColor}; }
  .gm-style-cc { display: none !important; }
  .gmnoprint:not(.gm-bundled-control) { display: none !important; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map;
  var mapReady = false;
  var pendingCmds = [];

  function postMessage(obj) {
    var s = JSON.stringify(obj);
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(s);
    } else if (window.parent !== window) {
      window.parent.postMessage(s, '*');
    }
  }

  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: ${centerLat}, lng: ${centerLon} },
      zoom: ${zoom},
      disableDefaultUI: true,
      styles: ${styleJson},
      gestureHandling: '${gesture}',
      clickableIcons: false,
    });

    map.addListener('center_changed', function() {
      var c = map.getCenter();
      postMessage({ type: 'center', lat: c.lat(), lon: c.lng() });
    });
    map.addListener('dragstart', function() {
      postMessage({ type: 'userDrag' });
    });

    google.maps.event.addListenerOnce(map, 'idle', function() {
      mapReady = true;
      pendingCmds.forEach(function(cmd) { executeCmd(cmd); });
      pendingCmds = [];
      postMessage({ type: 'ready' });
    });
  }

  // Минимальное API команд (расширяется в driver/passenger через инжекцию)
  function executeCmd(msg) {
    if (msg.cmd === 'setView') {
      map.setCenter({ lat: msg.lat, lng: msg.lon });
      if (msg.zoom) map.setZoom(msg.zoom);
    } else if (msg.cmd === 'panTo') {
      map.panTo({ lat: msg.lat, lng: msg.lon });
    } else if (msg.cmd === 'setZoom') {
      map.setZoom(msg.zoom);
    } else if (window.__appMapHandlers && window.__appMapHandlers[msg.cmd]) {
      window.__appMapHandlers[msg.cmd](msg, map);
    }
  }

  // Слушаем сообщения от RN или от parent window (web preview)
  document.addEventListener('message', handleMsg);
  window.addEventListener('message', handleMsg);
  function handleMsg(e) {
    try {
      var msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (!mapReady) { pendingCmds.push(msg); return; }
      executeCmd(msg);
    } catch (err) {}
  }
<\/script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ru&region=RU&callback=initMap"><\/script>
</body>
</html>`;
}
