import React from "react";
import { BadgeOrigen } from "./BadgeOrigen";
import type { ContextoPsicosocialData } from "./types";
import type { PacienteParaPsicologo } from "../semaforo-pacientes";

interface ContextoPsicosocialProps {
  paciente: PacienteParaPsicologo | null;
  contexto: ContextoPsicosocialData;
  onChange: (patch: Partial<ContextoPsicosocialData>) => void;
}

export const ContextoPsicosocial: React.FC<ContextoPsicosocialProps> = ({
  paciente,
  contexto,
  onChange,
}) => {
  const carreraSemestre =
    contexto.carrera_semestre ||
    `${paciente?.carrera || "Ing. en Sistemas Computacionales"} · ${
      paciente?.semestre ? `${paciente.semestre}º Semestre` : "6º Semestre"
    }`;
  const grupo = contexto.grupo || paciente?.grupo || "501";

  return (
    <div className="space-y-4">
      {/* Encabezado de Sección Canva Style */}
      <div className="flex flex-col gap-1 rounded-2xl bg-[#1B198F] px-4 py-3 text-white shadow-md sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
            05
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight text-white">
            Contexto psicosocial
          </h3>
        </div>
        <span className="text-xs font-normal text-violet-200 sm:ml-2">
          Con quién vive, de qué vive y con quién cuenta
        </span>
      </div>

      <div className="rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
        <div className="divide-y divide-border/60">
          {/* Carrera y semestre */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">
              Carrera y semestre:
            </span>
            <span className="text-xs font-bold text-foreground sm:w-1/2">{carreraSemestre}</span>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="AUTOMÁTICO" />
            </div>
          </div>

          {/* Grupo */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Grupo:</span>
            <span className="font-mono text-xs font-bold text-foreground sm:w-1/2">{grupo}</span>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="AUTOMÁTICO" />
            </div>
          </div>

          {/* Convivencia */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Convivencia:</span>
            <div className="sm:w-1/2">
              <input
                type="text"
                value={contexto.convivencia}
                onChange={(e) => onChange({ convivencia: e.target.value })}
                placeholder="(con quién vive: padres, pareja, solo/a, roomies)"
                className="w-full max-w-md rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="PSICÓLOGO" />
            </div>
          </div>

          {/* Situación laboral */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">
              Situación laboral:
            </span>
            <div className="sm:w-1/2">
              <input
                type="text"
                value={contexto.situacion_laboral}
                onChange={(e) => onChange({ situacion_laboral: e.target.value })}
                placeholder="(trabaja / solo estudia / medio tiempo)"
                className="w-full max-w-md rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="PSICÓLOGO" />
            </div>
          </div>

          {/* Red de apoyo */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Red de apoyo:</span>
            <div className="sm:w-1/2">
              <input
                type="text"
                value={contexto.red_apoyo}
                onChange={(e) => onChange({ red_apoyo: e.target.value })}
                placeholder="(familiares / amigos / tutores docentes)"
                className="w-full max-w-md rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="PSICÓLOGO" />
            </div>
          </div>

          {/* Factores de estrés actuales */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">
              Factores de estrés actuales:
            </span>
            <div className="sm:w-1/2">
              <input
                type="text"
                value={contexto.factores_estres}
                onChange={(e) => onChange({ factores_estres: e.target.value })}
                placeholder="(académicos / económicos / personales / familiares)"
                className="w-full max-w-md rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="PSICÓLOGO" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
