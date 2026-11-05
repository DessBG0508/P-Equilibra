import React from "react";
import { BadgeOrigen } from "./BadgeOrigen";
import type { ObjetivosSesionData } from "./types";
import type { PacienteParaPsicologo } from "../semaforo-pacientes";
import { Link } from "@tanstack/react-router";
import { Calendar, Unlock, Lock } from "lucide-react";

interface ObjetivosSesionProps {
  paciente: PacienteParaPsicologo | null;
  objetivos: ObjetivosSesionData;
  onChange: (patch: Partial<ObjetivosSesionData>) => void;
  onLiberarPaciente?: () => void;
}

export const ObjetivosSesion: React.FC<ObjetivosSesionProps> = ({
  paciente,
  objetivos,
  onChange,
  onLiberarPaciente,
}) => {
  const isBloqueado = paciente?.bloqueado ?? objetivos.estado_bloqueo === "bloqueado";

  return (
    <div className="space-y-4">
      {/* Encabezado de Sección Canva Style */}
      <div className="flex items-center gap-3 rounded-2xl bg-[#1B198F] px-4 py-3 text-white shadow-md">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
          09
        </span>
        <h3 className="font-display text-lg font-bold tracking-tight text-white">
          Objetivos iniciales y próxima sesión
        </h3>
      </div>

      <div className="space-y-6 rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
        <div className="divide-y divide-border/60">
          {/* Consentimiento informado */}
          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">
              Consentimiento informado:
            </span>
            <div className="flex items-center gap-3 sm:w-1/2">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={objetivos.consentimiento_firmado}
                  onChange={(e) => onChange({ consentimiento_firmado: e.target.checked })}
                  className="size-4.5 rounded-md border-border text-[#6857E4] focus:ring-[#6857E4]"
                />
                <span className="text-xs font-medium text-foreground">
                  Paciente firmó (psicólogo marca)
                </span>
              </label>
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="PSICÓLOGO" />
            </div>
          </div>

          {/* Frecuencia acordada */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">
              Frecuencia acordada:
            </span>
            <div className="sm:w-1/2">
              <select
                value={objetivos.frecuencia_acordada || "Semanal"}
                onChange={(e) => onChange({ frecuencia_acordada: e.target.value })}
                className="w-full max-w-xs rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              >
                <option value="Semanal">Semanal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
                <option value="A demanda">A demanda / Seguimiento puntual</option>
              </select>
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="PSICÓLOGO" />
            </div>
          </div>

          {/* Próxima cita con enlace a Agenda */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Próxima cita:</span>
            <div className="flex flex-wrap items-center gap-2 sm:w-1/2">
              <input
                type="text"
                value={objetivos.proxima_cita}
                onChange={(e) => onChange({ proxima_cita: e.target.value })}
                placeholder="Ej. 10-nov-2026 10:00 AM"
                className="w-full max-w-xs rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
              <Link
                to="/psicologo"
                className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-card px-2.5 py-1.5 text-[11px] font-semibold text-[#6857E4] hover:bg-muted"
              >
                <Calendar className="size-3.5" />
                <span>PB-009 Agenda</span>
              </Link>
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="PSICÓLOGO" />
            </div>
          </div>

          {/* Estado de bloqueo */}
          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">
              Estado de bloqueo:
            </span>
            <div className="flex items-center gap-3 sm:w-1/2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  isBloqueado
                    ? "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300"
                    : "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300"
                }`}
              >
                {isBloqueado ? (
                  <>
                    <Lock className="size-3" /> Bloqueado (auto por tamizaje rojo)
                  </>
                ) : (
                  <>
                    <Unlock className="size-3" /> Liberado para nuevo tamizaje
                  </>
                )}
              </span>

              {isBloqueado && onLiberarPaciente && (
                <button
                  type="button"
                  onClick={onLiberarPaciente}
                  className="rounded-xl bg-[#12BDB6] px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#00BCC8] focus:outline-none focus:ring-2 focus:ring-[#12BDB6]"
                >
                  Liberar paciente
                </button>
              )}
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="MIXTO" />
            </div>
          </div>
        </div>

        {/* Notas libres con badge PSICÓLOGO */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <BadgeOrigen tipo="PSICÓLOGO" />
            <label htmlFor="notas-libres-input" className="text-xs font-bold text-foreground">
              Notas libres:
            </label>
          </div>
          <textarea
            id="notas-libres-input"
            rows={5}
            value={objetivos.notas_libres}
            onChange={(e) => onChange({ notas_libres: e.target.value })}
            placeholder="Notas adicionales, observaciones, plan de acción..."
            className="w-full resize-y rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
          />
        </div>
      </div>
    </div>
  );
};
