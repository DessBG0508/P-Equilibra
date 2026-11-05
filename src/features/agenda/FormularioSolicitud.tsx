import React, { useState } from "react";
import { AgendaBadge } from "./AgendaBadge";
import { Calendar, Clock, MapPin, User, ArrowLeft, Send } from "lucide-react";

interface FormularioSolicitudProps {
  fechaCita: string;
  horaCita: string;
  nombrePsicologo?: string;
  onSubmit: (motivo: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const FormularioSolicitud: React.FC<FormularioSolicitudProps> = ({
  fechaCita,
  horaCita,
  nombrePsicologo = "Dra. Marta Gómez",
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [motivo, setMotivo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(motivo);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Canva Style */}
      <div className="rounded-2xl bg-[#1B198F] p-4 text-white shadow-md sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
              01
            </span>
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-white">
                Flujo del estudiante
              </h2>
              <p className="text-xs text-violet-200">Pantalla 2 — Formulario de solicitud</p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-violet-100">
            Página 2 de 6
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
          {/* Resumen de cita seleccionada */}
          <div className="mb-6 rounded-2xl bg-violet-50/70 p-4 dark:bg-violet-950/30">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Resumen de horario seleccionado:
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Calendar className="size-4 text-[#6857E4]" />
                <span>Fecha: {fechaCita}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Clock className="size-4 text-[#6857E4]" />
                <span>Hora: {horaCita} hrs</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <User className="size-4 text-[#6857E4]" />
                <span>{nombrePsicologo}</span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Modalidad: Presencial (AUTO) */}
            <div className="flex flex-col gap-1 rounded-2xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-foreground">
                    Modalidad: Presencial única
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Consultorio de Bienestar Integral TESH (decisión clínica confirmada 09-oct-2026).
                  No videollamada.
                </p>
              </div>
              <AgendaBadge tipo="AUTO" />
            </div>

            {/* Motivo (opcional) (ESTUDIANTE) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="motivo-solicitud-input"
                  className="text-xs font-bold text-foreground"
                >
                  Motivo (opcional):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {motivo.length}/200 caracteres
                  </span>
                  <AgendaBadge tipo="ESTUDIANTE" />
                </div>
              </div>
              <textarea
                id="motivo-solicitud-input"
                rows={4}
                maxLength={200}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Escribe brevemente si hay algún tema o inquietud en particular que quieras abordar..."
                className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-[#6857E4] focus:outline-none focus:ring-1 focus:ring-[#6857E4]"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card px-5 py-3 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
            >
              <ArrowLeft className="size-3.5" />
              <span>Cancelar (volver al calendario)</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B198F] px-6 py-3 text-xs font-bold text-white shadow-float transition-all hover:bg-[#1B198F] disabled:opacity-50"
            >
              <Send className="size-3.5" />
              <span>{isSubmitting ? "Enviando solicitud..." : "Solicitar cita"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
