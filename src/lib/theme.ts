import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "equilibra_theme";

/**
 * Determina el tema inicial:
 * 1. Preferencia guardada en localStorage.
 * 2. Si no existe, respeta `prefers-color-scheme: dark`.
 */
export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyThemeClass(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function setStoredTheme(theme: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyThemeClass(theme);
    window.dispatchEvent(new CustomEvent("equilibra-theme-update", { detail: { theme } }));
  } catch {
    // ignore
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const current = getInitialTheme();
    setThemeState(current);
    applyThemeClass(current);

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: ThemeMode }>;
      if (
        customEvent.detail &&
        (customEvent.detail.theme === "dark" || customEvent.detail.theme === "light")
      ) {
        setThemeState(customEvent.detail.theme);
        applyThemeClass(customEvent.detail.theme);
      } else {
        const t = getInitialTheme();
        setThemeState(t);
        applyThemeClass(t);
      }
    };

    window.addEventListener("equilibra-theme-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // Escuchar cambios en el sistema operativo si no hay preferencia manual
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const hasStored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!hasStored) {
        const nextTheme = e.matches ? "dark" : "light";
        setThemeState(nextTheme);
        applyThemeClass(nextTheme);
      }
    };
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      window.removeEventListener("equilibra-theme-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setThemeState(nextTheme);
    setStoredTheme(nextTheme);
  }, [theme]);

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme,
    setTheme: (t: ThemeMode) => {
      setThemeState(t);
      setStoredTheme(t);
    },
  };
}
