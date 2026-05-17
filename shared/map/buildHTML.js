// shared/map/buildHTML.js
// ────────────────────────────────────────────────────────────────────────────
// HTML-документ с Mapbox GL JS для встраивания в React Native WebView.
// Используется LeafletMap.js (driver + passenger).
//
// PostMessage interface (ReactNative ↔ WebView):
//   ⟶ setView { lat, lon, zoom? }     — центрировать
//   ⟶ panTo { lat, lon }              — плавно
//   ⟶ setUserLocation { lat, lon }    — точка пользователя (только passenger)
//   ⟶ setCar { lat, lon, heading? }   — машинка с поворотом (только driver)
//   ⟶ setMarkers { markers: [...] }   — маркеры заказа (A/B и т.п.)
//   ⟶ setRoute { coords: [[lat,lon]] } — линия маршрута
//   ⟶ clearRoute                       — убрать маршрут
//   ⟵ { type: 'ready' }                — карта готова
//   ⟵ { type: 'center', lat, lon }     — пользователь подвинул карту
//   ⟵ { type: 'userDrag' }             — пользователь начал драг
//   ⟵ { type: 'markerTap', index }     — клик по marker'у
// ────────────────────────────────────────────────────────────────────────────

import { MAPBOX_TOKEN_DEFAULT, MAPBOX_STYLE_URL, YANDEX_PALETTE } from "./mapboxTweaks.js";

/**
 * @param {object} opts
 * @param {"light"|"dark"} [opts.theme="light"]   — тема (light для passenger, dark можно но Yandex-aesthetic всегда light)
 * @param {string}  [opts.token]                  — Mapbox access token
 * @param {number}  [opts.centerLat=44.6166]
 * @param {number}  [opts.centerLon=33.5254]
 * @param {number}  [opts.zoom=16]
 * @param {string}  [opts.carImageSrc]            — base64 data: URI машинки (только driver)
 * @returns {string} HTML
 */
export function buildHTML(opts = {}) {
  const {
    token = MAPBOX_TOKEN_DEFAULT,
    centerLat = 44.6166,
    centerLon = 33.5254,
    zoom = 16,
    carImageSrc = null,
  } = opts;

  const bg = YANDEX_PALETTE.cream;
  const styleUrl = MAPBOX_STYLE_URL;

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet'>
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: ${bg}; }
  .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-logo { display: none !important; }
  .mapboxgl-canvas:focus { outline: none; }

  /* SVG-car marker для driver — добавляется через JS */
  .car-marker { width: 44px; height: 51px; transform-origin: 50% 50%; transition: transform 0.3s linear; }
  /* SVG-pin marker для passenger (А/Б точки) */
  .pin-marker { display: flex; align-items: center; justify-content: center; }
</style>
</head>
<body>
<div id="map"></div>
<script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
<script>
  var TOKEN  = ${JSON.stringify(token)};
  var STYLE  = ${JSON.stringify(styleUrl)};
  var CAR_SRC = ${JSON.stringify(carImageSrc || "")};
  mapboxgl.accessToken = TOKEN;

  var map;
  var mapReady = false;
  var pendingCmds = [];
  var carEl = null;     // div для машинки (driver)
  var carMarker = null; // mapboxgl.Marker
  var prevDeg = 0;
  var userDotMarker = null;
  var userRingMarker = null;
  var orderMarkers = [];
  var routeSourceId = '__route_source';
  var routeLayerId  = '__route_layer';

  function post(obj) {
    var s = JSON.stringify(obj);
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(s);
    } else if (window.parent !== window) {
      window.parent.postMessage(s, '*');
    }
  }

  map = new mapboxgl.Map({
    container: 'map',
    style: STYLE,
    center: [${centerLon}, ${centerLat}],
    zoom: ${zoom},
    pitch: 0,
    attributionControl: false,
    preserveDrawingBuffer: true,
  });

  map.on('movestart', function(e) {
    if (e.originalEvent) post({ type: 'userDrag' });
  });
  map.on('moveend', function() {
    var c = map.getCenter();
    post({ type: 'center', lat: c.lat, lon: c.lng });
  });

  map.on('load', function() {
    mapReady = true;
    // Прогнать накопленные команды
    pendingCmds.forEach(executeCmd);
    pendingCmds = [];
    post({ type: 'ready' });
  });

  function setUserLocation(lat, lon) {
    if (!mapReady) return;
    if (userDotMarker) userDotMarker.remove();
    if (userRingMarker) userRingMarker.remove();
    // Ring (полупрозрачное)
    var ring = document.createElement('div');
    ring.style.cssText = 'width:44px;height:44px;border-radius:50%;background:rgba(245,207,49,0.22);';
    userRingMarker = new mapboxgl.Marker({ element: ring, anchor: 'center' }).setLngLat([lon, lat]).addTo(map);
    // Dot
    var dot = document.createElement('div');
    dot.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#F5CF31;border:3px solid #FFFFFF;box-shadow:0 1px 4px rgba(0,0,0,0.3);';
    userDotMarker = new mapboxgl.Marker({ element: dot, anchor: 'center' }).setLngLat([lon, lat]).addTo(map);
  }

  function setCarPosition(lat, lon, compassHeading) {
    if (!mapReady || !CAR_SRC) return;
    var target = (compassHeading !== null && compassHeading !== undefined && compassHeading >= 0) ? compassHeading : prevDeg;
    var diff = ((target - prevDeg + 540) % 360) - 180;
    var smooth = prevDeg + diff;
    prevDeg = smooth;
    if (!carEl) {
      carEl = document.createElement('img');
      carEl.src = CAR_SRC;
      carEl.className = 'car-marker';
      carEl.style.filter = 'drop-shadow(0px 2px 4px rgba(0,0,0,0.55))';
      carMarker = new mapboxgl.Marker({ element: carEl, anchor: 'center' }).setLngLat([lon, lat]).addTo(map);
    } else {
      carMarker.setLngLat([lon, lat]);
    }
    carEl.style.transform = 'rotate(' + smooth + 'deg)';
  }

  function setMarkers(list) {
    if (!mapReady) return;
    // remove all
    orderMarkers.forEach(function(m) { m.remove(); });
    orderMarkers = [];
    list.forEach(function(item, idx) {
      var isA = item.label === 'А' || item.label === 'A';
      var color = item.color || (isA ? '#F2A65A' : '#0E0E0C');
      var textColor = isA ? '#0E0E0C' : '#FFFFFF';
      var wrap = document.createElement('div');
      wrap.className = 'pin-marker';
      wrap.style.cssText = 'width:32px;height:32px;border-radius:50%;background:' + color + ';border:3px solid #FFFFFF;color:' + textColor + ';font-size:12px;font-weight:700;font-family:system-ui,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.25);';
      wrap.textContent = item.label || '';
      var mIdx = item.index != null ? item.index : idx;
      wrap.addEventListener('click', function() { post({ type: 'markerTap', index: mIdx }); });
      var marker = new mapboxgl.Marker({ element: wrap, anchor: 'center' }).setLngLat([item.lon, item.lat]).addTo(map);
      orderMarkers.push(marker);
    });
  }

  function setRoute(coords) {
    if (!mapReady) return;
    var lineCoords = coords.map(function(c) { return [c[1], c[0]]; }); // [lat,lon] → [lon,lat]
    var geojson = { type: 'Feature', geometry: { type: 'LineString', coordinates: lineCoords } };
    if (map.getSource(routeSourceId)) {
      map.getSource(routeSourceId).setData(geojson);
    } else {
      map.addSource(routeSourceId, { type: 'geojson', data: geojson });
      map.addLayer({
        id: routeLayerId, source: routeSourceId, type: 'line',
        paint: { 'line-color': '#1A1A17', 'line-width': 5, 'line-opacity': 0.9 },
      });
    }
  }

  function clearRoute() {
    if (!mapReady) return;
    if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
    if (map.getSource(routeSourceId)) map.removeSource(routeSourceId);
  }

  function executeCmd(msg) {
    if (msg.cmd === 'setView') {
      map.flyTo({ center: [msg.lon, msg.lat], zoom: msg.zoom || map.getZoom(), duration: 600 });
    } else if (msg.cmd === 'panTo') {
      map.panTo([msg.lon, msg.lat]);
    } else if (msg.cmd === 'setUserLocation') {
      setUserLocation(msg.lat, msg.lon);
    } else if (msg.cmd === 'setCar') {
      setCarPosition(msg.lat, msg.lon, msg.heading);
    } else if (msg.cmd === 'setMarkers') {
      setMarkers(msg.markers || []);
    } else if (msg.cmd === 'setRoute') {
      setRoute(msg.coords || []);
    } else if (msg.cmd === 'clearRoute') {
      clearRoute();
    }
  }

  // Listen for postMessage from RN
  document.addEventListener('message', handleMsg);
  window.addEventListener('message', handleMsg);
  function handleMsg(e) {
    try {
      var msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (!mapReady) { pendingCmds.push(msg); return; }
      executeCmd(msg);
    } catch (err) {}
  }
</script>
</body>
</html>`;
}
