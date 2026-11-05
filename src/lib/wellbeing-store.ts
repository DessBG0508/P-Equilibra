import { useState, useEffect, useCallback } from "react";

const STRESS_KEY = "equilibra_stress_level_v1";
const ENERGY_KEY = "equilibra_energy_level_v1";

const DEFAULT_STRESS_LEVEL = 3.4;
const DEFAULT_ENERGY_LEVEL = 3.6;

export function getStoredStress(): number {
  if (typeof window === "undefined") return DEFAULT_STRESS_LEVEL;
  try {
    const raw = localStorage.getItem(STRESS_KEY);
    if (!raw) return DEFAULT_STRESS_LEVEL;
    const val = parseFloat(raw);
    return isNaN(val) ? DEFAULT_STRESS_LEVEL : Math.max(1, Math.min(5, Math.round(val * 10) / 10));
  } catch {
    return DEFAULT_STRESS_LEVEL;
  }
}

export function setStoredStress(val: number): void {
  if (typeof window === "undefined") return;
  try {
    const clamped = Math.max(1, Math.min(5, Math.round(val * 10) / 10));
    localStorage.setItem(STRESS_KEY, clamped.toString());
    window.dispatchEvent(
      new CustomEvent("equilibra-stress-update", { detail: { value: clamped } }),
    );
  } catch {
    // ignore
  }
}

export function useStressLevel() {
  const [stress, setStressState] = useState<number>(getStoredStress);

  useEffect(() => {
    setStressState(getStoredStress());
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ value: number }>;
      if (customEvent.detail && typeof customEvent.detail.value === "number") {
        setStressState(customEvent.detail.value);
      } else {
        setStressState(getStoredStress());
      }
    };
    window.addEventListener("equilibra-stress-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("equilibra-stress-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateStress = useCallback((val: number) => {
    setStoredStress(val);
    setStressState(val);
  }, []);

  const progress = Math.min(100, Math.max(0, Math.round((stress / 5) * 100)));

  return {
    stress,
    progress,
    updateStress,
  };
}

export function getStoredEnergy(): number {
  if (typeof window === "undefined") return DEFAULT_ENERGY_LEVEL;
  try {
    const raw = localStorage.getItem(ENERGY_KEY);
    if (!raw) return DEFAULT_ENERGY_LEVEL;
    const val = parseFloat(raw);
    return isNaN(val) ? DEFAULT_ENERGY_LEVEL : Math.max(1, Math.min(5, Math.round(val * 10) / 10));
  } catch {
    return DEFAULT_ENERGY_LEVEL;
  }
}

export function setStoredEnergy(val: number): void {
  if (typeof window === "undefined") return;
  try {
    const clamped = Math.max(1, Math.min(5, Math.round(val * 10) / 10));
    localStorage.setItem(ENERGY_KEY, clamped.toString());
    window.dispatchEvent(
      new CustomEvent("equilibra-energy-update", { detail: { value: clamped } }),
    );
  } catch {
    // ignore
  }
}

export function useEnergyLevel() {
  const [energy, setEnergyState] = useState<number>(getStoredEnergy);

  useEffect(() => {
    setEnergyState(getStoredEnergy());
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ value: number }>;
      if (customEvent.detail && typeof customEvent.detail.value === "number") {
        setEnergyState(customEvent.detail.value);
      } else {
        setEnergyState(getStoredEnergy());
      }
    };
    window.addEventListener("equilibra-energy-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("equilibra-energy-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateEnergy = useCallback((val: number) => {
    setStoredEnergy(val);
    setEnergyState(val);
  }, []);

  const progress = Math.min(100, Math.max(0, Math.round((energy / 5) * 100)));

  return {
    energy,
    progress,
    updateEnergy,
  };
}
