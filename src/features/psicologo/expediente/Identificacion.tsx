import React from "react";
import { BadgeOrigen } from "./BadgeOrigen";
import type { CamposClinicos } from "./types";
import type { PacienteParaPsicologo } from "../semaforo-pacientes";

interface IdentificacionProps {
  paciente: PacienteParaPsicologo | null;
  campos: CamposClinicos;
  onChange: (patch: Partial<CamposClinicos>) => void;
  fechaApertura?: string;
}

export const Identificacion: React.FC<IdentificacionProps> = ({
  paciente,
  campos,
  onChange,
  fechaApertura = "30-oct-2026",
}) => {
  const folio = paciente?.folio || "EQ-9374";
  const numExpediente = `EXP-2026-${folio.replace(/^EQ-?/i, "") || "9374"}`;

  return (
    <div className="space-y-4">
      {/* Encabezado de Sección Canva Style */}
      <div className="flex items-center gap-3 rounded-2xl bg-[#1B198F] px-4 py-3 text-white shadow-md">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
          01
        </span>
        <h3 className="font-display text-lg font-bold tracking-tight text-white">Identificación</h3>
      </div>

      <div className="rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Datos del estudiante:
        </p>

        <div className="divide-y divide-border/60">
          {/* Folio */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">
              Folio del paciente:
            </span>
            <span className="font-mono text-sm font-bold text-foreground sm:w-1/2">{folio}</span>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="AUTOMÁTICO" />
            </div>
          </div>

          {/* Iniciales */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Iniciales:</span>
            <div className="sm:w-1/2">
              <input
                type="text"
                value={campos.iniciales ?? paciente?.iniciales ?? ""}
                onChange={(e) => onChange({ iniciales: e.target.value })}
                placeholder="Ej. D.B."
                className="w-full max-w-xs rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="MIXTO" />
            </div>
          </div>

          {/* Edad */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Edad:</span>
            <div className="sm:w-1/2">
              <input
                type="number"
                value={campos.edad ?? paciente?.edad ?? ""}
                onChange={(e) => onChange({ edad: e.target.value ? Number(e.target.value) : "" })}
                placeholder="Ej. 21"
                className="w-24 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="MIXTO" />
            </div>
          </div>

          {/* Sexo */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Sexo:</span>
            <div className="sm:w-1/2">
              <select
                value={campos.sexo ?? paciente?.sexo ?? "Mujer"}
                onChange={(e) => onChange({ sexo: e.target.value })}
                className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              >
                <option value="Mujer">Mujer</option>
                <option value="Hombre">Hombre</option>
                <option value="Otro">Otro</option>
                <option value="Prefiero no decir">Prefiero no decir</option>
              </select>
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="MIXTO" />
            </div>
          </div>

          {/* Semestre */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Semestre:</span>
            <div className="sm:w-1/2">
              <input
                type="text"
                value={
                  campos.semestre ??
                  (paciente?.semestre ? `${paciente.semestre}º Semestre` : "6º Semestre")
                }
                onChange={(e) => onChange({ semestre: e.target.value })}
                placeholder="Ej. 6º Semestre"
                className="w-full max-w-xs rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="MIXTO" />
            </div>
          </div>

          {/* Carrera */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Carrera:</span>
            <div className="sm:w-1/2">
              <input
                type="text"
                value={campos.carrera ?? paciente?.carrera ?? "Ing. en Sistemas Computacionales"}
                onChange={(e) => onChange({ carrera: e.target.value })}
                placeholder="Ej. Ing. en Sistemas Computacionales"
                className="w-full max-w-sm rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="MIXTO" />
            </div>
          </div>

          {/* Grupo */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Grupo:</span>
            <div className="sm:w-1/2">
              <input
                type="text"
                value={campos.grupo ?? paciente?.grupo ?? "501"}
                onChange={(e) => onChange({ grupo: e.target.value })}
                placeholder="Ej. 501"
                className="w-28 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="MIXTO" />
            </div>
          </div>

          {/* Nº de expediente */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">
              Nº de expediente:
            </span>
            <span className="font-mono text-xs font-bold text-foreground sm:w-1/2">
              {numExpediente}
            </span>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="AUTOMÁTICO" />
            </div>
          </div>

          {/* Fecha de apertura */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">
              Fecha de apertura:
            </span>
            <span className="text-xs font-semibold text-foreground sm:w-1/2">{fechaApertura}</span>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="AUTOMÁTICO" />
            </div>
          </div>

          {/* Derivado por */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Derivado por:</span>
            <div className="sm:w-1/2">
              <input
                type="text"
                value={
                  campos.derivado_por ?? "Tamizaje preventivo Eli (Canalización institucional)"
                }
                onChange={(e) => onChange({ derivado_por: e.target.value })}
                placeholder="Ej. Tamizaje preventivo Eli"
                className="w-full max-w-sm rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="MIXTO" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
