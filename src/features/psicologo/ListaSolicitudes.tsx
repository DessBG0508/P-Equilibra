import React, { useState } from "react";
import { AgendaBadge } from "../agenda/AgendaBadge";
import type { SolicitudCita, EstadoCita } from "../agenda/types";
import {
  Calendar,
  Clock,
  Filter,
  Check,
  X,
  Eye,
  User,
  AlertCircle,
  FileText,
  Search,
} from "lucide-react";

interface ListaSolicitudesProps {
  solicitudes: SolicitudCita[];
  onSelectCita: (cita: SolicitudCita) => void;
  onAceptarCita: (citaId: string) => Promise<void>;
  onCancelarCita: (citaId: string) => void;
  isLoading?: boolean;
}

export const ListaSolicitudes: React.FC<ListaSolicitudesProps> = ({
  solicitudes,
  onSelectCita,
  onAceptarCita,
  onCancelarCita,
  isLoading = false,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<string>("all");
  const [filtroFecha, setFiltroFecha] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const estadosDisponibles: Array<{ val: string; label: string }> = [
    { val: "all", label: "Todos los estados" },
    { val: "pendiente", label: "Pendientes" },
    { val: "confirmada", label: "Confirmadas" },
    { val: "completada", label: "Completadas" },
    { val: "cancelada", label: "Canceladas" },
    { val: "no_asistio", label: "No asistió" },
  ];

  const filtradas = solicitudes.filter((item) => {
    if (filtroEstado !== "all" && item.estado !== filtroEstado) {
      return false;
    }
    if (filtroFecha && item.fecha_cita !== filtroFecha) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFolio = item.folio.toLowerCase().includes(q);
      const matchInit = (item.iniciales_estudiante || "").toLowerCase().includes(q);
      const matchMotivo = (item.motivo || "").toLowerCase().includes(q);
      return matchFolio || matchInit || matchMotivo;
    }
    return true;
  });

  const getStatusBadge = (estado: EstadoCita) => {
    switch (estado) {
      case "pendiente":
        return "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-300";
      case "confirmada":
        return "bg-teal/15 text-teal border border-teal/30";
      case "completada":
        return "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300";
      case "cancelada":
        return "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300";
      case "no_asistio":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Canva Style */}
      <div className="rounded-2xl bg-[#1B198F] p-4 text-white shadow-md sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
              02
            </span>
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-white">
                Flujo del psicólogo
              </h2>
              <p className="text-xs text-violet-200">
                2 pantallas: lista de solicitudes → detalle de cita
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-violet-100">
            Pantalla 1 — Lista de solicitudes
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7 space-y-6">
        {/* Barra de Filtros con Badges (PSICÓLOGO) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro por estado */}
            <div className="flex items-center gap-2">
              <AgendaBadge tipo="PSICÓLOGO" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-[#6857E4] focus:outline-none"
              >
                {estadosDisponibles.map((opt) => (
                  <option key={opt.val} value={opt.val}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por fecha */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-1 text-xs font-medium text-foreground focus:border-[#6857E4] focus:outline-none"
              />
              {filtroFecha && (
                <button
                  type="button"
                  onClick={() => setFiltroFecha("")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpiar fecha
                </button>
              )}
            </div>
          </div>

          {/* Buscador */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por folio o iniciales..."
              className="w-full rounded-xl border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#6857E4] focus:outline-none"
            />
          </div>
        </div>

        {/* Tabla / Lista de Solicitudes (AUTO) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AgendaBadge tipo="AUTO" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Solicitudes registradas ({filtradas.length})
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Cargando solicitudes de agenda...
            </div>
          ) : filtradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No se encontraron citas con los filtros seleccionados.
            </div>
          ) : (
            <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-card overflow-hidden">
              {filtradas.map((item) => {
                const esPendiente = item.estado === "pendiente";
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Datos del estudiante */}
                    <div className="space-y-1 sm:w-2/5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {item.folio}
                        </span>
                        {item.iniciales_estudiante && (
                          <span className="rounded-md bg-[#6857E4]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#6857E4]">
                            {item.iniciales_estudiante}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(
                            item.estado,
                          )}`}
                        >
                          {item.estado}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {item.motivo || "Sin motivo especificado por el estudiante."}
                      </p>
                    </div>

                    {/* Fecha y hora */}
                    <div className="space-y-0.5 sm:w-1/4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Calendar className="size-3.5 text-[#6857E4]" />
                        <span>{item.fecha_cita}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="size-3 text-muted-foreground" />
                        <span>{item.hora_cita} hrs (Presencial)</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:w-1/3">
                      {/* Botón Ver Detalle */}
                      <button
                        type="button"
                        onClick={() => onSelectCita(item)}
                        className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted shadow-xs"
                      >
                        <Eye className="size-3.5" />
                        <span>Detalle</span>
                      </button>

                      {/* Botones de acción directa si está pendiente */}
                      {esPendiente && (
                        <>
                          <button
                            type="button"
                            onClick={() => onAceptarCita(item.id)}
                            className="inline-flex items-center gap-1 rounded-xl bg-teal px-3 py-1.5 text-xs font-bold text-white hover:bg-teal/90 shadow-xs"
                          >
                            <Check className="size-3.5" />
                            <span>Aceptar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onCancelarCita(item.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-pink-200 bg-pink-50 px-2.5 py-1.5 text-xs font-semibold text-pink-600 hover:bg-pink-100 dark:border-pink-800/40 dark:bg-pink-950/20 dark:text-pink-300"
                          >
                            <X className="size-3.5" />
                            <span>Cancelar</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
