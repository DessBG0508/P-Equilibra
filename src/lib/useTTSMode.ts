import { useState, useEffect, useRef, useCallback } from "react";

export const TTS_STORAGE_KEY = "equilibra_tts_prefs_v1";

export interface TTSPreferences {
  velocidad: number;
}

export interface UseTTSModeReturn {
  speak: (texto: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  vozDisponible: boolean;
  velocidad: number;
  setVelocidad: (velocidad: number) => void;
}

export function useTTSMode(): UseTTSModeReturn {
  const [vozDisponible, setVozDisponible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Cargar velocidad de localStorage (default: 1.0x, rango 0.5x a 2.0x)
  const [velocidad, setVelocidadState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(TTS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as TTSPreferences;
          if (
            typeof parsed.velocidad === "number" &&
            parsed.velocidad >= 0.5 &&
            parsed.velocidad <= 2.0
          ) {
            return parsed.velocidad;
          }
        }
      } catch {
        // Fallback
      }
    }
    return 1.0;
  });

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Guardar preferencia de velocidad en localStorage
  const setVelocidad = useCallback((nuevaVelocidad: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, Number(nuevaVelocidad.toFixed(1))));
    setVelocidadState(clamped);
    if (typeof window !== "undefined") {
      try {
        const prefs: TTSPreferences = { velocidad: clamped };
        localStorage.setItem(TTS_STORAGE_KEY, JSON.stringify(prefs));
      } catch {
        // ignore
      }
    }
  }, []);

  // Seleccionar la mejor voz en español (preferente es-MX)
  const pickSpanishVoice = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVozDisponible(false);
      return;
    }

    const synth = window.speechSynthesis;
    const voices = synth.getVoices();

    if (!voices || voices.length === 0) {
      setVozDisponible(false);
      return;
    }

    // 1. Buscar voz de México (es-MX)
    let selected = voices.find((v) => v.lang === "es-MX" || v.lang === "es_MX");

    // 2. Fallback: cualquier voz en español latinoamericano o neutro
    if (!selected) {
      selected = voices.find((v) => v.lang.startsWith("es-") || v.lang.startsWith("es_"));
    }

    // 3. Fallback: cualquier voz en español
    if (!selected) {
      selected = voices.find((v) => v.lang.toLowerCase().includes("es"));
    }

    voiceRef.current = selected || voices[0] || null;
    setVozDisponible(true);
  }, []);

  // Detectar soporte y cargar voces disponibles
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVozDisponible(false);
      return;
    }

    pickSpanishVoice();

    const synth = window.speechSynthesis;
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = pickSpanishVoice;
    }

    return () => {
      synth.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    };
  }, [pickSpanishVoice]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
    }
  }, []);

  const speak = useCallback(
    (texto: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      const cleanText = texto?.trim();
      if (!cleanText) return;

      const synth = window.speechSynthesis;

      // Cancelar cualquier locución previa
      synth.cancel();

      // En caso de que las voces no se hubieran cargado aún
      if (!voiceRef.current) {
        pickSpanishVoice();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      currentUtteranceRef.current = utterance;

      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
        utterance.lang = voiceRef.current.lang;
      } else {
        utterance.lang = "es-MX";
      }

      utterance.rate = velocidad;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        // Ignorar interrupciones manuales por cancelación
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("[useTTSMode] Error en reproducción de voz:", e);
        }
        setIsSpeaking(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      synth.speak(utterance);
    },
    [pickSpanishVoice, velocidad],
  );

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    vozDisponible,
    velocidad,
    setVelocidad,
  };
}
