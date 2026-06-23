"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeContextType = {
  themeMode: ThemeMode;
  themeColor: string;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const savedMode = localStorage.getItem("themeMode");

  return savedMode === "dark" ? "dark" : "light";
}

function getInitialThemeColor() {
  if (typeof window === "undefined") return "#9b6f45";

  return localStorage.getItem("themeColor") || "#9b6f45";
}

function applyTheme(mode: ThemeMode, color: string) {
  if (typeof document === "undefined") return;

  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.style.setProperty("--theme-color", color);
}

export function DashboardThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeMode, setThemeModeState] =
    useState<ThemeMode>(getInitialThemeMode);

  const [themeColor, setThemeColorState] =
    useState<string>(getInitialThemeColor);

  useEffect(() => {
    applyTheme(themeMode, themeColor);
  }, [themeMode, themeColor]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem("themeMode", mode);
    applyTheme(mode, themeColor);
  };

  const setThemeColor = (color: string) => {
    setThemeColorState(color);
    localStorage.setItem("themeColor", color);
    applyTheme(themeMode, color);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        themeColor,
        setThemeMode,
        setThemeColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useDashboardTheme must be used inside DashboardThemeProvider"
    );
  }

  return context;
}