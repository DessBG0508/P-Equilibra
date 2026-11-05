import React from "react";
import { BadgeOrigen } from "./BadgeOrigen";
import type { PacienteParaPsicologo } from "../semaforo-pacientes";

interface HistoriaProblemaProps {
  paciente: PacienteParaPsicologo | null;
  historiaClinica: string;
  onChange: (historia: string) => void;
  historialTamizajesTexto?: string;
}

export const HistoriaProblema: React.FC<HistoriaProblemaProps> = ({
  paciente,
  historiaClinica,
  onChange,
  historialTamizajesTexto,
}) => {
  const gad7 = paciente?.gad7_total ?? 14;
  const phq9 = paciente?.phq9_total ?? 9;
  const item9 = paciente?.item9 ?? 1;

  const defaultHistorialAuto =
    historialTamizajesTexto ||
    `El paciente tiene 3 tamizajes registrados: 02-oct (GAD-7: ${gad7}, amarillo), 17-oct (PHQ-9: ${phq9}, item9=${item9}, rojo), 18-oct (PHQ-9: ${phq9}, item9=${item9}, rojo). Tendencia: empeoramiento sostenido en último mes.`;

  return (
    <div className="space-y-4">
      {/* Encabezado de Sección Canva Style */}
      <div className="flex flex-col gap-1 rounded-2xl bg-[#1B198F] px-4 py-3 text-white shadow-md sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
            03
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight text-white">
            Historia del problema
          </h3>
        </div>
        <span className="text-xs font-normal text-violet-200 sm:ml-2">
          Cuándo empezó, cómo ha evolucionado y qué ha intentado hasta ahora
        </span>
      </div>

      <div className="space-y-4 rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
        {/* Banner Automático con historial de tamizajes */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#C3B3F1] bg-[#F1EDFC] p-4 dark:border-violet-800/40 dark:bg-violet-950/30 sm:flex-row sm:items-start sm:gap-4">
          <BadgeOrigen tipo="AUTOMÁTICO" className="shrink-0 self-start" />
          <p className="text-xs leading-relaxed text-[#1B198F] dark:text-violet-200">
            {defaultHistorialAuto}
          </p>
        </div>

        {/* Textarea para la historia clínica */}
        <div className="space-y-2">
          <label
            htmlFor="historia-clinica-input"
            className="block text-xs font-bold text-foreground"
          >
            Historia clínica del problema:
          </label>
          <textarea
            id="historia-clinica-input"
            rows={5}
            value={historiaClinica}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe aquí la evolución del problema, qué ha intentado, etc."
            className="w-full resize-y rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
          />
        </div>
      </div>
    </div>
  );
};
