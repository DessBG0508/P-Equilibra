import React from "react";
import { BadgeOrigen } from "./BadgeOrigen";
import type { PacienteParaPsicologo } from "../semaforo-pacientes";

interface MotivoConsultaProps {
  paciente: PacienteParaPsicologo | null;
  motivoEnPalabras: string;
  onChange: (motivo: string) => void;
  tamizajeFecha?: string;
  transcriptVoz?: string | null;
}

export const MotivoConsulta: React.FC<MotivoConsultaProps> = ({
  paciente,
  motivoEnPalabras,
  onChange,
  tamizajeFecha = "18-oct-2026",
  transcriptVoz,
}) => {
  const phq9Total = paciente?.phq9_total ?? 9;
  const item9 = paciente?.item9 ?? 1;
  const nivel = (paciente?.ultimo_nivel || "ROJO").toUpperCase();

  const textoSugeridoDefault = `Estudiante canalizado desde tamizaje con nivel ${nivel} (PHQ-9: ${phq9Total}/27, ítem 9=${item9}) en fecha ${tamizajeFecha}. El sistema sugiere este texto basado en el último tamizaje; el psicólogo puede editar.`;

  return (
    <div className="space-y-4">
      {/* Encabezado de Sección Canva Style */}
      <div className="flex flex-col gap-1 rounded-2xl bg-[#1B198F] px-4 py-3 text-white shadow-md sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
            02
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight text-white">
            Motivo de consulta
          </h3>
        </div>
        <span className="text-xs font-normal text-violet-200 sm:ml-2">
          Con las palabras del estudiante, antes de traducirlo a lenguaje clínico
        </span>
      </div>

      <div className="space-y-4 rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
        {/* Banner Mixto con sugerencia basada en tamizaje */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#00BCC8] bg-[#00BCC8] p-4 dark:border-teal-800/40 dark:bg-teal-950/30 sm:flex-row sm:items-start sm:gap-4">
          <BadgeOrigen tipo="MIXTO" className="shrink-0 self-start" />
          <p className="text-xs leading-relaxed text-[#12BDB6] dark:text-teal-200">
            {textoSugeridoDefault}
          </p>
        </div>

        {/* Si existen notas de voz recientes transcritas, mostrar sugerencia rápida */}
        {transcriptVoz && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-3 text-xs text-violet-950 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-200">
            <span className="font-bold text-[#1B198F] dark:text-violet-300">
              Transcripción de voz detectada:
            </span>{" "}
            &ldquo;{transcriptVoz}&rdquo;
          </div>
        )}

        {/* Textarea para el motivo */}
        <div className="space-y-2">
          <label
            htmlFor="motivo-estudiante-input"
            className="block text-xs font-bold text-foreground"
          >
            Motivo en palabras del estudiante:
          </label>
          <textarea
            id="motivo-estudiante-input"
            rows={5}
            value={motivoEnPalabras}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe aquí el motivo en palabras del estudiante..."
            className="w-full resize-y rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
          />
        </div>
      </div>
    </div>
  );
};
