import React from "react";
import { useTTSMode } from "@/lib/useTTSMode";

export interface EscucharVozNotaProps {
  transcripcion: string;
  className?: string;
}

export function EscucharVozNota({ transcripcion, className = "" }: EscucharVozNotaProps) {
  const {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    vozDisponible,
    velocidad,
    setVelocidad,
  } = useTTSMode();

  const handlePlayToggle = () => {
    if (!vozDisponible || !transcripcion) return;

    if (isSpeaking && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      speak(transcripcion);
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleVelocidadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setVelocidad(val);
    }
  };

  const handlePresetVelocidad = (vel: number) => {
    setVelocidad(vel);
    if (isSpeaking) {
      speak(transcripcion);
    }
  };

  return (
    <div
      role="region"
      aria-label="Reproductor de voz para nota transcrita"
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-slate-900 dark:text-slate-100 shadow-xs transition-all ${className}`}
    >
      {/* Encabezado del reproductor */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl text-base transition-colors ${
              isSpeaking && !isPaused
                ? "bg-[#6857E4] text-white animate-pulse"
                : "bg-[#1B198F]/10 text-[#1B198F] dark:text-[#C3B3F1]"
            }`}
          >
            <span aria-hidden="true">{vozDisponible ? "🔊" : "🔇"}</span>
          </div>
          <div>
            <h4 className="text-xs font-bold flex items-center gap-1.5">
              <span>Voz de Eli (Acompañamiento)</span>
              {isSpeaking && !isPaused && (
                <span className="inline-flex items-center rounded-full bg-[#6857E4]/15 text-[#1B198F] dark:text-[#C3B3F1] text-[10px] px-2 py-0.5 font-semibold animate-pulse">
                  Reproduciendo
                </span>
              )}
              {isPaused && (
                <span className="inline-flex items-center rounded-full border border-lime-400 text-lime-600 dark:text-lime-400 text-[10px] px-2 py-0.5 font-semibold">
                  En pausa
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {vozDisponible
                ? "Síntesis de voz en español neutro (es-MX) para revisión clínica"
                : "Síntesis de voz no compatible en este navegador"}
            </p>
          </div>
        </div>

        {/* Indicador de velocidad actual */}
        {vozDisponible && (
          <span className="inline-flex items-center rounded-md font-mono text-xs font-semibold px-2 py-0.5 border border-[#6857E4]/30 text-[#6857E4] dark:text-[#C3B3F1] bg-[#6857E4]/5">
            {velocidad.toFixed(1)}x
          </span>
        )}
      </div>

      {/* Alerta de navegador sin soporte */}
      {!vozDisponible ? (
        <div
          role="status"
          className="rounded-xl border border-lime-500/30 bg-lime-500/10 p-3 text-xs text-lime-800 dark:text-lime-200"
        >
          <p className="font-medium">
            La síntesis de voz no está habilitada en este navegador. Puedes leer la transcripción
            escrita sin inconvenientes.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Controles de reproducción principales */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayToggle}
                disabled={!transcripcion || !vozDisponible}
                aria-label={
                  isSpeaking && !isPaused
                    ? "Pausar lectura de nota de voz"
                    : isPaused
                      ? "Reanudar lectura de nota de voz"
                      : "Escuchar nota de voz con la voz de Eli"
                }
                className={`inline-flex items-center justify-center rounded-xl text-xs font-semibold h-9 px-3.5 shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSpeaking && !isPaused
                    ? "bg-lime-600 hover:bg-lime-700 text-white focus-visible:ring-lime-500"
                    : "bg-[#1B198F] hover:bg-[#1B198F]/90 text-white dark:bg-[#6857E4] dark:hover:bg-[#6857E4]/90 focus-visible:ring-[#6857E4]"
                }`}
              >
                <span className="mr-1.5" aria-hidden="true">
                  {isSpeaking && !isPaused ? "⏸" : "▶"}
                </span>
                <span>
                  {isSpeaking && !isPaused ? "Pausar" : isPaused ? "Reanudar" : "Escuchar nota"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleStop}
                disabled={!isSpeaking && !isPaused}
                aria-label="Detener reproducción de voz"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs h-9 px-3 text-slate-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="mr-1.5" aria-hidden="true">
                  ⏹
                </span>
                <span>Detener</span>
              </button>
            </div>

            {/* Presets rápidos de velocidad */}
            <div className="flex items-center gap-1" role="group" aria-label="Velocidades rápidas">
              {[0.8, 1.0, 1.2, 1.5].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetVelocidad(preset)}
                  aria-pressed={velocidad === preset}
                  aria-label={`Cambiar velocidad a ${preset}x`}
                  className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6857E4] ${
                    velocidad === preset
                      ? "bg-[#6857E4] text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>

          {/* Slider de ajuste fino de velocidad con input range nativo */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true">⏩</span>
                <span>Velocidad de reproducción</span>
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {velocidad.toFixed(1)}x
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={velocidad}
              onChange={handleVelocidadChange}
              aria-label="Velocidad de síntesis de voz (de 0.5x a 2.0x)"
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#6857E4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6857E4]"
            />

            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <span>0.5x (Lento)</span>
              <span>1.0x (Normal)</span>
              <span>2.0x (Rápido)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EscucharVozNota;
