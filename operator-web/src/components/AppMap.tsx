// AppMap — единая Mapbox GL JS карта для operator-web.
// Использует mapbox/streets-v12 + Yandex-style tweaks (shared/map/mapboxTweaks.js).
// Тот же visual что в mobile WebView (через shared HTML builder).
"use client";
import * as React from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
// @ts-expect-error — JS-модуль из shared/, типов нет
import { applyYandexTweaks, MAPBOX_STYLE_URL, MAPBOX_TOKEN_DEFAULT, YANDEX_PALETTE } from "../../../shared/map/mapboxTweaks.js";

export type AppMapProps = {
  theme?: "light" | "dark";  // зарезервировано, но Yandex-look всегда light
  centerLat?: number;
  centerLon?: number;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (map: mapboxgl.Map) => void;
};

export function AppMap({
  centerLat = 44.6166,
  centerLon = 33.5254,
  zoom = 16,
  className,
  style,
  onReady,
}: AppMapProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || MAPBOX_TOKEN_DEFAULT;

  React.useEffect(() => {
    if (!ref.current) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: ref.current,
      style: MAPBOX_STYLE_URL,
      center: [centerLon, centerLat],
      zoom,
      pitch: 0,
      attributionControl: false, // спрячем Mapbox attribution для preview
      preserveDrawingBuffer: true, // нужно для screenshot в headless Chrome
    });

    map.on("style.load", () => {
      applyYandexTweaks(map);
    });

    map.on("load", () => {
      onReady?.(map);
    });

    mapRef.current = map;
    // DEV: экспортируем карты в window для debug через preview_eval
    if (typeof window !== "undefined") {
      (window as any).__mapboxMaps = (window as any).__mapboxMaps || [];
      (window as any).__mapboxMaps.push(map);
    }
    return () => {
      if (typeof window !== "undefined" && (window as any).__mapboxMaps) {
        (window as any).__mapboxMaps = (window as any).__mapboxMaps.filter((m: mapboxgl.Map) => m !== map);
      }
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Реакция на смену центра / zoom
  React.useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setCenter([centerLon, centerLat]);
  }, [centerLat, centerLon]);

  React.useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setZoom(zoom);
  }, [zoom]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: YANDEX_PALETTE.cream,
        ...style,
      }}
    />
  );
}
