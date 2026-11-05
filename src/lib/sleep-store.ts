import { useState, useEffect, useCallback } from "react";

const SLEEP_HOURS_KEY = "equilibra_sleep_hours_v1";
const DEFAULT_SLEEP_HOURS = 6.4;

export function getStoredSleepHours(): number {
  if (typeof window === "undefined") return DEFAULT_SLEEP_HOURS;
  try {
    const raw = localStorage.getItem(SLEEP_HOURS_KEY);
    if (!raw) return DEFAULT_SLEEP_HOURS;
    const parsed = parseFloat(raw);
    return isNaN(parsed) ? DEFAULT_SLEEP_HOURS : parsed;
  } catch {
    return DEFAULT_SLEEP_HOURS;
  }
}

export function setStoredSleepHours(hours: number): void {
  if (typeof window === "undefined") return;
  try {
    const clamped = Math.max(0, Math.min(12, Math.round(hours * 2) / 2));
    localStorage.setItem(SLEEP_HOURS_KEY, clamped.toString());
    window.dispatchEvent(new CustomEvent("equilibra-sleep-update", { detail: { hours: clamped } }));
  } catch {
    // LocalStorage failure fallback
  }
}

export function calculateSleepProgress(hours: number): number {
  // Progreso calculado como horas / 9
  return Math.min(100, Math.max(0, Math.round((hours / 9) * 100)));
}

export function useSleepHours() {
  const [hours, setHoursState] = useState<number>(getStoredSleepHours);

  useEffect(() => {
    // Sincronizar estado inicial
    setHoursState(getStoredSleepHours());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ hours: number }>;
      if (customEvent.detail && typeof customEvent.detail.hours === "number") {
        setHoursState(customEvent.detail.hours);
      } else {
        setHoursState(getStoredSleepHours());
      }
    };

    window.addEventListener("equilibra-sleep-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("equilibra-sleep-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateHours = useCallback((newHours: number) => {
    setStoredSleepHours(newHours);
    setHoursState(newHours);
  }, []);

  const progress = calculateSleepProgress(hours);

  return {
    hours,
    progress,
    updateHours,
  };
}
