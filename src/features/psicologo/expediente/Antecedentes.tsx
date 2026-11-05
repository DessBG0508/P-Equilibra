import React from "react";
import type { AntecedentesData } from "./types";

interface AntecedentesProps {
  antecedentes: AntecedentesData;
  onChange: (patch: Partial<AntecedentesData>) => void;
}

export const Antecedentes: React.FC<AntecedentesProps> = ({ antecedentes, onChange }) => {
  const items: Array<{ key: keyof Omit<AntecedentesData, "detalle_antecedentes">; label: string }> =
    [
      { key: "tratamiento_psicologico_previo", label: "Tratamiento psicológico previo" },
      { key: "hospitalizaciones", label: "Hospitalizaciones" },
      { key: "seguimiento_psiquiatrico", label: "Seguimiento psiquiátrico" },
      { key: "antecedentes_familiares", label: "Antecedentes familiares" },
      { key: "medicacion_actual", label: "Medicación actual" },
      { key: "enfermedad_medica_relevante", label: "Enfermedad médica relevante" },
    ];

  return (
    <div className="space-y-4">
      {/* Encabezado de Sección Canva Style */}
      <div className="flex flex-col gap-1 rounded-2xl bg-[#1B198F] px-4 py-3 text-white shadow-md sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
            04
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight text-white">Antecedentes</h3>
        </div>
        <span className="text-xs font-normal text-violet-200 sm:ml-2">
          Marca lo que aplique y detalla lo relevante
        </span>
      </div>

      <div className="space-y-6 rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
        {/* Grid de 6 checkboxes como en Canva */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map(({ key, label }) => {
            const isChecked = Boolean(antecedentes[key]);
            return (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3.5 transition-colors hover:border-[#6857E4]/50 hover:bg-card"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onChange({ [key]: e.target.checked })}
                  className="size-4.5 rounded-md border-border text-[#6857E4] focus:ring-[#6857E4]"
                />
                <span className="text-xs font-medium text-foreground select-none">{label}</span>
              </label>
            );
          })}
        </div>

        {/* Textarea para Detalle de antecedentes */}
        <div className="space-y-2">
          <label
            htmlFor="detalle-antecedentes-input"
            className="block text-xs font-bold text-foreground"
          >
            Detalle de antecedentes:
          </label>
          <textarea
            id="detalle-antecedentes-input"
            rows={4}
            value={antecedentes.detalle_antecedentes}
            onChange={(e) => onChange({ detalle_antecedentes: e.target.value })}
            placeholder="Especifica medicamentos, fechas de tratamientos previos o detalles de relevancia clínica..."
            className="w-full resize-y rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
          />
        </div>
      </div>
    </div>
  );
};
