import React from "react";
import { BadgeOrigen } from "./BadgeOrigen";
import type { ValoracionRiesgoData, MarcadoresRiesgoData } from "./types";
import type { PacienteParaPsicologo } from "../semaforo-pacientes";

interface ValoracionRiesgoProps {
  paciente: PacienteParaPsicologo | null;
  valoracion: ValoracionRiesgoData;
  onChange: (patch: Partial<ValoracionRiesgoData>) => void;
}

export const ValoracionRiesgo: React.FC<ValoracionRiesgoProps> = ({
  paciente,
  valoracion,
  onChange,
}) => {
  const item9Valor = paciente?.item9 ?? valoracion.item9_valor ?? 1;

  const marcadoresConfig: Array<{ key: keyof MarcadoresRiesgoData; label: string }> = [
    { key: "ideacion_autolitica", label: "Ideación autolítica" },
    { key: "plan_estructurado", label: "Plan estructurado" },
    { key: "intentos_previos", label: "Intentos previos" },
    { key: "autolesiones", label: "Autolesiones" },
    { key: "consumo_sustancias", label: "Consumo de sustancias" },
    { key: "riesgo_terceros", label: "Riesgo hacia terceros" },
  ];

  const handleMarcadorChange = (key: keyof MarcadoresRiesgoData, checked: boolean) => {
    onChange({
      marcadores: {
        ...valoracion.marcadores,
        [key]: checked,
      },
    });
  };

  const getScaleColor = (num: number, isSelected: boolean) => {
    if (!isSelected) {
      return "border-border bg-card text-foreground hover:border-[#6857E4]/60 hover:bg-card";
    }
    if (num <= 3) {
      return "bg-teal-600 border-teal-600 text-white shadow-sm";
    }
    if (num <= 6) {
      return "bg-lime-500 border-lime-500 text-white shadow-sm";
    }
    return "bg-pink-500 border-pink-500 text-white shadow-sm";
  };

  return (
    <div className="space-y-4">
      {/* Encabezado de Sección Canva Style */}
      <div className="flex flex-col gap-1 rounded-2xl bg-[#1B198F] px-4 py-3 text-white shadow-md sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
            07
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight text-white">
            Valoración de riesgo.
          </h3>
        </div>
        <span className="text-xs font-normal text-violet-200 sm:ml-2">
          Pregúntalo de forma explícita. No preguntar no protege a nadie
        </span>
      </div>

      <div className="space-y-6 rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
        {/* Banner Automático de Ítem 9 PHQ-9 */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#00BCC8] bg-[#00BCC8] p-4 dark:border-teal-800/40 dark:bg-teal-950/30 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex items-center gap-2">
            <BadgeOrigen tipo="AUTOMÁTICO" className="shrink-0" />
            <span className="font-bold text-xs text-[#12BDB6] dark:text-teal-200">
              Item 9 del PHQ-9
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[#12BDB6] dark:text-teal-200">
            Valor del último PHQ-9: <strong className="font-bold">{item9Valor}</strong> (0=mínimo,
            3=máximo). Cualquier valor ≥ 1 indica riesgo autolítico y escaló automáticamente a nivel
            de atención prioritaria.
          </p>
        </div>

        {/* Marcadores de riesgo con badge PSICÓLOGO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgeOrigen tipo="PSICÓLOGO" />
              <span className="text-xs font-bold text-foreground">
                Marcadores de riesgo (preguntar explícitamente):
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {marcadoresConfig.map(({ key, label }) => {
              const checked = Boolean(valoracion.marcadores?.[key]);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3 transition-colors hover:border-[#6857E4]/50 hover:bg-card"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => handleMarcadorChange(key, e.target.checked)}
                    className="size-4.5 rounded-md border-border text-[#6857E4] focus:ring-[#6857E4]"
                  />
                  <span className="text-xs font-medium text-foreground select-none">{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Riesgo estimado en escala 0-10 con badge MIXTO */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <BadgeOrigen tipo="MIXTO" />
            <span className="text-xs font-bold text-foreground">
              Riesgo estimado en este momento (escala 0-10):
            </span>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = valoracion.riesgo_estimado === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onChange({ riesgo_estimado: num })}
                    className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border text-xs sm:text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#6857E4] ${getScaleColor(
                      num,
                      isSelected,
                    )}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1">
              <span className="text-teal-700 dark:text-teal-400">Sin riesgo (0-3)</span>
              <span className="text-lime-700 dark:text-lime-400">Medio (4-6)</span>
              <span className="text-pink-600 dark:text-pink-400">Riesgo alto (7-10)</span>
            </div>
          </div>
        </div>

        {/* Factores de protección y medidas acordadas */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <BadgeOrigen tipo="PSICÓLOGO" />
            <label
              htmlFor="factores-proteccion-input"
              className="text-xs font-bold text-foreground"
            >
              Factores de protección y medidas acordadas:
            </label>
          </div>
          <textarea
            id="factores-proteccion-input"
            rows={4}
            value={valoracion.factores_proteccion}
            onChange={(e) => onChange({ factores_proteccion: e.target.value })}
            placeholder="Factores de protección, medidas acordadas, plan de seguridad..."
            className="w-full resize-y rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
          />
        </div>
      </div>
    </div>
  );
};
