// Fullscreen-стенд для итерации стиля shared/map/style.js.
// БЕЗ панельного layout (sidebar/topbar) — две карты бок-о-бок на весь экран.
// Используется через Chrome preview MCP для screenshot-тестирования.
"use client";
import * as React from "react";
import { AppMap } from "@/components/AppMap";

type Scenario = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  zoom: number;
  hint: string;
};

const SCENARIOS: Scenario[] = [
  { id: "city",     label: "Севаст. обзор",      lat: 44.6166, lon: 33.5254, zoom: 13, hint: "море + сетка районов" },
  { id: "harbor",   label: "Сев. бухта",         lat: 44.6135, lon: 33.5210, zoom: 15, hint: "море явно vs земля" },
  { id: "downtown", label: "Сев. центр z16",     lat: 44.6166, lon: 33.5254, zoom: 16, hint: "дома?" },
  { id: "houses",   label: "Сев. сектор z17",    lat: 44.5780, lon: 33.4720, zoom: 17, hint: "плотная застройка" },
  { id: "numbers",  label: "Сев. номера z18",    lat: 44.6066, lon: 33.5223, zoom: 18, hint: "номера на улицах" },
  { id: "moscow",   label: "Москва z17 (Арбат)", lat: 55.7494, lon: 37.5872, zoom: 17, hint: "Google имеет здания для Москвы" },
  { id: "mscZ18",   label: "Москва z18",         lat: 55.7494, lon: 37.5872, zoom: 18, hint: "номера на жилых улицах" },
];

export default function MapFullPreviewPage() {
  const [sc, setSc] = React.useState<Scenario>(SCENARIOS[2]);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { margin: 0; padding: 0; height: 100vh; overflow: hidden; background: #0E0E0C; font-family: system-ui, sans-serif; }
        .gm-style-cc { display: none !important; }
        .gmnoprint:not(.gm-bundled-control) { display: none !important; }
        .gm-style a[href^="https://maps.google.com"],
        .gm-style a[href^="https://www.google.com/maps"] { display: none !important; }
      ` }} />
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Тулбар */}
        <div style={{
          flex: "0 0 auto",
          background: "#1a1a17",
          color: "#E8EEF7",
          padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 8,
          borderBottom: "1px solid #2a2a26",
          fontSize: 13,
        }}>
          <span style={{ color: "#8A8780", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 11, marginRight: 6 }}>СЦЕНАРИЙ</span>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSc(s)}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: sc.id === s.id ? "1px solid #F2A65A" : "1px solid #2a2a26",
                background: sc.id === s.id ? "#F2A65A" : "#0E0E0C",
                color: sc.id === s.id ? "#0E0E0C" : "#E8EEF7",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}
          <span style={{ marginLeft: "auto", color: "#B8B5AD", fontSize: 12 }}>{sc.hint}</span>
          <span style={{ color: "#5C5A55", fontSize: 11, fontFamily: "monospace", marginLeft: 8 }}>
            {sc.lat.toFixed(4)}, {sc.lon.toFixed(4)} · z{sc.zoom}
          </span>
        </div>

        {/* Карты бок-о-бок */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#2a2a26" }}>
          <div style={{ position: "relative", background: "#F2F3F5" }}>
            <div style={{
              position: "absolute", top: 10, left: 10, zIndex: 10,
              background: "rgba(255,255,255,0.95)",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11, fontWeight: 700, color: "#1A1F2C",
              border: "1px solid #E0E0E0",
            }}>
              ☀ LIGHT (пассажир / operator)
            </div>
            <AppMap theme="light" centerLat={sc.lat} centerLon={sc.lon} zoom={sc.zoom} />
          </div>
          <div style={{ position: "relative", background: "#1B2433" }}>
            <div style={{
              position: "absolute", top: 10, left: 10, zIndex: 10,
              background: "rgba(15,24,37,0.95)",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11, fontWeight: 700, color: "#E8EEF7",
              border: "1px solid #2A3548",
            }}>
              ☾ DARK (водитель)
            </div>
            <AppMap theme="dark" centerLat={sc.lat} centerLon={sc.lon} zoom={sc.zoom} />
          </div>
        </div>
      </div>
    </>
  );
}
