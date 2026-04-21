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
  html,body,#map{margin:0;padding:0;width:100%;height:100%;background:#0F121C;}
  .leaflet-container{background:#1a1e2e;}
  .car-wrap{filter:drop-shadow(0 4px 8px rgba(0,0,0,0.75));transform-origin:50% 50%;}
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
</style>
</head>
<body>

<!-- Иконка такси (скрытый шаблон) -->
<div id="car-tpl" style="display:none">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 90" width="100" height="45">
  <!-- Тень -->
  <ellipse cx="100" cy="87" rx="78" ry="5" fill="rgba(0,0,0,0.28)"/>

  <!-- Основной кузов -->
  <path d="M22,65 L20,54 L20,38 L24,32
           L42,32 L58,13 Q65,6 78,6
           L132,6 Q147,6 154,17
           L170,32 L176,34
           L180,42 L180,58 L176,65 Z"
        fill="#F5A623"/>

  <!-- Крыша чуть темнее -->
  <path d="M42,32 L58,13 Q65,6 78,6 L132,6 Q147,6 154,17 L170,32 Z"
        fill="#E8981A"/>

  <!-- Полоса шашек – фон (тёмная полоса) -->
  <rect x="20" y="44" width="160" height="16" fill="#1a1a1a"/>

  <!-- Шашки: чётные жёлтые, нечётные чёрные -->
  <rect x="20"  y="44" width="10" height="8" fill="#F5A623"/>
  <rect x="30"  y="44" width="10" height="8" fill="#111"/>
  <rect x="40"  y="44" width="10" height="8" fill="#F5A623"/>
  <rect x="50"  y="44" width="10" height="8" fill="#111"/>
  <rect x="60"  y="44" width="10" height="8" fill="#F5A623"/>
  <rect x="70"  y="44" width="10" height="8" fill="#111"/>
  <rect x="80"  y="44" width="10" height="8" fill="#F5A623"/>
  <rect x="90"  y="44" width="10" height="8" fill="#111"/>
  <rect x="100" y="44" width="10" height="8" fill="#F5A623"/>
  <rect x="110" y="44" width="10" height="8" fill="#111"/>
  <rect x="120" y="44" width="10" height="8" fill="#F5A623"/>
  <rect x="130" y="44" width="10" height="8" fill="#111"/>
  <rect x="140" y="44" width="10" height="8" fill="#F5A623"/>
  <rect x="150" y="44" width="10" height="8" fill="#111"/>
  <rect x="160" y="44" width="10" height="8" fill="#F5A623"/>
  <rect x="170" y="44" width="10" height="8" fill="#111"/>

  <rect x="20"  y="52" width="10" height="8" fill="#111"/>
  <rect x="30"  y="52" width="10" height="8" fill="#F5A623"/>
  <rect x="40"  y="52" width="10" height="8" fill="#111"/>
  <rect x="50"  y="52" width="10" height="8" fill="#F5A623"/>
  <rect x="60"  y="52" width="10" height="8" fill="#111"/>
  <rect x="70"  y="52" width="10" height="8" fill="#F5A623"/>
  <rect x="80"  y="52" width="10" height="8" fill="#111"/>
  <rect x="90"  y="52" width="10" height="8" fill="#F5A623"/>
  <rect x="100" y="52" width="10" height="8" fill="#111"/>
  <rect x="110" y="52" width="10" height="8" fill="#F5A623"/>
  <rect x="120" y="52" width="10" height="8" fill="#111"/>
  <rect x="130" y="52" width="10" height="8" fill="#F5A623"/>
  <rect x="140" y="52" width="10" height="8" fill="#111"/>
  <rect x="150" y="52" width="10" height="8" fill="#F5A623"/>
  <rect x="160" y="52" width="10" height="8" fill="#111"/>
  <rect x="170" y="52" width="10" height="8" fill="#F5A623"/>

  <!-- Стёкла (единая тёмная полоса) -->
  <path d="M46,30 L60,15 Q66,9 77,9 L133,9 Q145,9 151,19 L165,30 Z"
        fill="#262F42"/>

  <!-- Стойки между стёклами -->
  <line x1="95"  y1="10" x2="95"  y2="30" stroke="#E8981A" stroke-width="4"/>
  <line x1="130" y1="11" x2="130" y2="30" stroke="#E8981A" stroke-width="3.5"/>

  <!-- Знак такси на крыше -->
  <rect x="86" y="0" width="42" height="10" rx="3" fill="#1A3E5C"/>
  <text x="107" y="8.5" text-anchor="middle" fill="white"
        font-size="6.5" font-family="Arial" font-weight="bold">TAXI</text>

  <!-- Передний бампер (справа) -->
  <path d="M176,34 L180,42 L180,58 L176,65 L170,65 L168,56 L168,36 Z"
        fill="#5A3C00"/>
  <!-- Передняя фара -->
  <ellipse cx="178" cy="44" rx="4" ry="7" fill="#FFFDE7" opacity="0.97"/>
  <!-- Передний поворотник -->
  <ellipse cx="178" cy="55" rx="3.5" ry="4.5" fill="#FF9500" opacity="0.9"/>

  <!-- Задний бампер (слева) -->
  <path d="M24,32 L20,38 L20,54 L22,62 L28,65 L32,65 L32,36 Z"
        fill="#5A3C00"/>
  <!-- Задний стоп-сигнал -->
  <rect x="16" y="40" width="7" height="16" rx="2" fill="#DD1F00" opacity="0.92"/>

  <!-- Колёса -->
  <!-- Переднее (справа) -->
  <circle cx="148" cy="67" r="16" fill="#2a2a2a"/>
  <circle cx="148" cy="67" r="11" fill="#606060"/>
  <circle cx="148" cy="67" r="5.5" fill="white"/>
  <circle cx="148" cy="67" r="2.5" fill="#aaa"/>
  <!-- Заднее (слева) -->
  <circle cx="54"  cy="67" r="16" fill="#2a2a2a"/>
  <circle cx="54"  cy="67" r="11" fill="#606060"/>
  <circle cx="54"  cy="67" r="5.5" fill="white"/>
  <circle cx="54"  cy="67" r="2.5" fill="#aaa"/>

  <!-- Линии дверей -->
  <line x1="95"  y1="32" x2="95"  y2="65" stroke="#C87D00" stroke-width="1.5" opacity="0.5"/>
  <line x1="130" y1="32" x2="130" y2="65" stroke="#C87D00" stroke-width="1.5" opacity="0.5"/>
</svg>
</div>

<div id="map"></div>
<script>
  var map = L.map('map', {zoomControl:true, attributionControl:false}).setView([${centerLat},${centerLon}], 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);

  var carIcon = L.divIcon({
    className: '',
    html: '<div class="car-wrap">' + document.getElementById('car-tpl').innerHTML + '</div>',
    iconSize: [100, 45],
    iconAnchor: [50, 22]
  });

  var carMarker = null;
  var orderMarkers = [];

  function setCarPosition(lat, lon) {
    if (carMarker) {
      carMarker.setLatLng([lat, lon]);
    } else {
      carMarker = L.marker([lat, lon], {icon: carIcon, zIndexOffset: 1000}).addTo(map);
    }
  }

  function setOrderMarkers(list) {
    orderMarkers.forEach(function(m){ map.removeLayer(m); });
    orderMarkers = [];
    list.forEach(function(m){
      var marker = L.circleMarker([m.lat, m.lon], {
        radius: 16,
        color: m.color || 'yellow',
        fillColor: m.color || 'yellow',
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
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'markerTap', index: idx}));
        });
      })(m.index != null ? m.index : 0);

      orderMarkers.push(marker);
    });
  }

  map.on('moveend', function(){
    var c = map.getCenter();
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'center',lat:c.lat,lon:c.lng}));
  });

  document.addEventListener('message', handleMsg);
  window.addEventListener('message', handleMsg);
  function handleMsg(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.cmd === 'setView') map.setView([msg.lat, msg.lon], msg.zoom || 14);
      if (msg.cmd === 'setCar') setCarPosition(msg.lat, msg.lon);
      if (msg.cmd === 'setMarkers') setOrderMarkers(msg.markers);
    } catch(err) {}
  }
<\/script>
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
    setCenter(lat, lon, zoom = 14) {
      send({ cmd: "setView", lat, lon, zoom });
    },
    setCar(lat, lon) {
      send({ cmd: "setCar", lat, lon });
    },
    setMarkers(markers) {
      send({ cmd: "setMarkers", markers: markers.map((m, i) => ({ ...m, index: i })) });
    },
  }));

  return (
    <View style={[styles.root, style]}>
      <WebView
        ref={webviewRef}
        source={{ html: buildHTML(centerLat, centerLon) }}
        style={styles.webview}
        scrollEnabled={false}
        onLoadEnd={() => onReady?.()}
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
  root: { flex: 1, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "#0F121C" },
});
