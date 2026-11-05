import React from "react";
import type { EstadoMentalData } from "./types";

interface EstadoMentalProps {
  estadoMental: EstadoMentalData;
  onChange: (patch: Partial<EstadoMentalData>) => void;
}

export const EstadoMental: React.FC<EstadoMentalProps> = ({ estadoMental, onChange }) => {
  // Exactamente 12 checkboxes como solicita la especificación del requerimiento
  const items: Array<{ key: keyof Omit<EstadoMentalData, "observaciones">; label: string }> = [
    { key: "aspecto_cuidado", label: "Aspecto cuidado" },
    { key: "orientado", label: "Orientado" },
    { key: "contacto_adecuado", label: "Contacto adecuado" },
    { key: "discurso_coherente", label: "Discurso coherente" },
    { key: "animo_bajo", label: "Ánimo bajo" },
    { key: "ansiedad_manifiesta", label: "Ansiedad manifiesta" },
    { key: "enlentecimiento", label: "Enlentecimiento" },
    { key: "inquietud_psicomotriz", label: "Inquietud psicomotriz" },
    { key: "sueno_alterado", label: "Sueño alterado" },
    { key: "pensamiento_perseverante", label: "Pensamiento perseverante" },
    { key: "afecto_congruente", label: "Afecto congruente" },
    { key: "juicio_conservado", label: "Juicio conservado" },
  ];

  return (
    <div className="space-y-4">
      {/* Encabezado de Sección Canva Style */}
      <div className="flex flex-col gap-1 rounded-2xl bg-[#1B198F] px-4 py-3 text-white shadow-md sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
            06
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight text-white">
            Exploración del estado mental
          </h3>
        </div>
        <span className="text-xs font-normal text-violet-200 sm:ml-2">
          Lo que observas tú, no lo que te cuenta el estudiante
        </span>
      </div>

      <div className="space-y-6 rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
        {/* 12 Checkboxes organizados en grid de 3 columnas responsivo */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ key, label }) => {
            const isChecked = Boolean(estadoMental[key]);
            return (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3 transition-colors hover:border-[#6857E4]/50 hover:bg-card"
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

        {/* Observaciones complementarias */}
        <div className="space-y-2">
          <label
            htmlFor="observaciones-mental-input"
            className="block text-xs font-bold text-foreground"
          >
            Observaciones semiológicas complementarias:
          </label>
          <textarea
            id="observaciones-mental-input"
            rows={3}
            value={estadoMental.observaciones}
            onChange={(e) => onChange({ observaciones: e.target.value })}
            placeholder="Alineación afectiva, modulación de voz, contacto ocular, etc."
            className="w-full resize-y rounded-2xl border border-border bg-card p-3.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
          />
        </div>
      </div>
    </div>
  );
};
