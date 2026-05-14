"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeMode = "light" | "dark";
interface ThemeCtxType { mode: ThemeMode; toggle: () => void; }

const ThemeCtx = createContext<ThemeCtxType>({ mode: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("rng-theme")) as ThemeMode | null;
    if (saved === "dark" || saved === "light") {
      setMode(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    }
  }, []);

  const toggle = () => {
    setMode((m) => {
      const next = m === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("rng-theme", next);
      return next;
    });
  };

  return <ThemeCtx.Provider value={{ mode, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}
