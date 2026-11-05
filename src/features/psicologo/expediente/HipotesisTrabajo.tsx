import React from "react";

interface HipotesisTrabajoProps {
  hipotesis: string;
  onChange: (hipotesis: string) => void;
}

export const HipotesisTrabajo: React.FC<HipotesisTrabajoProps> = ({ hipotesis, onChange }) => {
  return (
    <div className="space-y-4">
      {/* Encabezado de Sección Canva Style */}
      <div className="flex flex-col gap-1 rounded-2xl bg-[#1B198F] px-4 py-3 text-white shadow-md sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
            08
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight text-white">
            Hipótesis de trabajo.
          </h3>
        </div>
        <span className="text-xs font-normal text-violet-200 sm:ml-2">
          Provisional y por escrito: es lo que te permitirá corregirla más adelante
        </span>
      </div>

      <div className="rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
        <div className="space-y-2">
          <label
            htmlFor="hipotesis-trabajo-input"
            className="block text-xs font-bold text-foreground"
          >
            Formulación diagnóstica y conceptualización clínica inicial:
          </label>
          <textarea
            id="hipotesis-trabajo-input"
            rows={5}
            value={hipotesis}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe aquí tu hipótesis clínica provisional (ej: cuadro depresivo reactivo a situación académica con componente ansioso)..."
            className="w-full resize-y rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
          />
        </div>
      </div>
    </div>
  );
};
