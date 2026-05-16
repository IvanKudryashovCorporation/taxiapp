// AppMap — единая Google Maps карта для operator-web.
// Использует те же стили (LIGHT_STYLE/DARK_STYLE) что и mobile driver/passenger.
// Дополнительно: рендерит номера домов из OpenStreetMap (Overpass API) при zoom ≥ 17.
"use client";
import * as React from "react";
// @ts-expect-error — JS-модуль из ../../shared/, типов нет
import { LIGHT_STYLE, DARK_STYLE, THEME_BG, DEFAULT_GMAPS_KEY } from "../../../shared/map/style.js";
// @ts-expect-error
import { fetchBuildingNumbers } from "../../../shared/map/overpassBuildings.js";
// @ts-expect-error
import { buildNumberMarkerIcon } from "../../../shared/map/numberMarker.js";

declare global {
  interface Window {
    google?: any;
    __gmapsLoading?: Promise<void>;
    __gmapsLoaded?: boolean;
  }
}

function loadGmaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__gmapsLoaded) return Promise.resolve();
  if (window.__gmapsLoading) return window.__gmapsLoading;
  window.__gmapsLoading = new Promise<void>((resolve, reject) => {
    const cbName = `__gmapsCb_${Date.now()}`;
    (window as any)[cbName] = () => {
      window.__gmapsLoaded = true;
      delete (window as any)[cbName];
      resolve();
    };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ru&region=RU&callback=${cbName}`;
    s.async = true;
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
  return window.__gmapsLoading;
}

const HOUSE_NUMBER_MIN_ZOOM = 17;

export type AppMapProps = {
  theme?: "light" | "dark";
  centerLat?: number;
  centerLon?: number;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (map: any) => void;
};

export function AppMap({
  theme = "light",
  centerLat = 44.6166,
  centerLon = 33.5254,
  zoom = 16,
  className,
  style,
  onReady,
}: AppMapProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const houseMarkersRef = React.useRef<any[]>([]);
  const apiKey = process.env.NEXT_PUBLIC_GMAPS_KEY || DEFAULT_GMAPS_KEY;
  const bg = (THEME_BG as Record<string, string>)[theme] || "#F2F3F5";

  // Обновить номера домов при idle (только если zoom достаточно близко)
  const refreshHouseNumbers = React.useCallback(async () => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    const curZoom = map.getZoom();
    // Скрыть всё при недостаточном zoom
    if (curZoom < HOUSE_NUMBER_MIN_ZOOM) {
      houseMarkersRef.current.forEach((m) => m.setMap(null));
      houseMarkersRef.current = [];
      return;
    }
    const b = map.getBounds();
    if (!b) return;
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    const items: Array<{ lat: number; lon: number; number: string }> =
      await fetchBuildingNumbers(sw.lat(), sw.lng(), ne.lat(), ne.lng());
    // Снести старые
    houseMarkersRef.current.forEach((m) => m.setMap(null));
    // Создать новые
    houseMarkersRef.current = items.map((it) => {
      const icon = buildNumberMarkerIcon(it.number, theme);
      return new window.google.maps.Marker({
        position: { lat: it.lat, lng: it.lon },
        map,
        icon: {
          url: icon.url,
          scaledSize: new window.google.maps.Size(icon.width, icon.height),
          anchor: new window.google.maps.Point(icon.width / 2, icon.height / 2),
        },
        zIndex: 60,
        optimized: false,
        clickable: false,
      });
    });
  }, [theme]);

  React.useEffect(() => {
    let cancelled = false;
    loadGmaps(apiKey).then(() => {
      if (cancelled || !ref.current) return;
      const styleArr = theme === "dark" ? DARK_STYLE : LIGHT_STYLE;
      mapRef.current = new window.google.maps.Map(ref.current, {
        center: { lat: centerLat, lng: centerLon },
        zoom,
        disableDefaultUI: true,
        styles: styleArr,
        gestureHandling: "greedy",
        clickableIcons: false,
      });
      mapRef.current.addListener("idle", () => {
        refreshHouseNumbers();
      });
      window.google.maps.event.addListenerOnce(mapRef.current, "idle", () => {
        if (!cancelled) onReady?.(mapRef.current);
      });
    });
    return () => {
      cancelled = true;
      houseMarkersRef.current.forEach((m) => m.setMap(null));
      houseMarkersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Реакция на смену темы / центра / zoom после монтирования
  React.useEffect(() => {
    if (!mapRef.current || !window.google) return;
    const styleArr = theme === "dark" ? DARK_STYLE : LIGHT_STYLE;
    mapRef.current.setOptions({ styles: styleArr });
    // Перерисовать маркеры в новой теме
    refreshHouseNumbers();
  }, [theme, refreshHouseNumbers]);

  React.useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setCenter({ lat: centerLat, lng: centerLon });
  }, [centerLat, centerLon]);

  React.useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setZoom(zoom);
  }, [zoom]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: "100%", height: "100%", background: bg, ...style }}
    />
  );
}
