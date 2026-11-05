import React, { useState } from "react";
import { AgendaBadge } from "./AgendaBadge";
import { HORARIOS_CONFIGURADOS, type HorarioSlot } from "./types";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export interface CitaExistente {
  fecha_cita: string; // formato 'YYYY-MM-DD'
  hora_cita: string; // formato 'HH:MM' o 'HH:MM:SS'
  estado: string; // 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_asistio'
}

interface CalendarioCitasProps {
  folioEstudiante?: string;
  nombrePsicologo?: string;
  onSelectSlot: (fecha: string, hora: string) => void;
  fechaPrevia?: string;
  horaPrevia?: string;
  /**
   * P0 #10 — Citas ya reservadas para deshabilitar slots ocupados.
   * Solo se consideran ocupadas las citas con estado activo
   * (pendiente/confirmada). Las canceladas/completadas/no_asistio liberan el slot.
   */
  citasExistentes?: CitaExistente[];
}

export const CalendarioCitas: React.FC<CalendarioCitasProps> = ({
  folioEstudiante = "EQ-9374",
  nombrePsicologo = "Dra. Marta Gómez",
  onSelectSlot,
  fechaPrevia,
  horaPrevia,
  citasExistentes = [],
}) => {
  // Inicializar en noviembre 2026 (mes del semestre TESH actual)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date(2026, 10, 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string>(fechaPrevia || "");
  const [selectedHora, setSelectedHora] = useState<string>(horaPrevia || "");

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthName = currentMonthDate.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  // Generar días del mes actual
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Dom, 1 = Lun...

  // Ajuste para comenzar en Lunes (0 = Lun ... 6 = Dom)
  const startOffset = (firstDayOfWeek + 6) % 7;

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const isLaborable = (day: number) => {
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Lunes a Viernes
  };

  const handleDayClick = (day: number) => {
    if (!isLaborable(day)) return;
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const fullDateStr = `${year}-${formattedMonth}-${formattedDay}`;
    setSelectedDateStr(fullDateStr);
    // Limpiar la hora seleccionada si al cambiar de día la hora actual queda ocupada
    if (selectedHora && slotOcupado(fullDateStr, selectedHora)) {
      setSelectedHora("");
    }
  };

  // P0 #10 — Helper para saber si un slot está ocupado en la fecha dada.
  const slotOcupado = (fecha: string, hora: string): boolean => {
    const horaNormalizada = hora.length === 5 ? `${hora}:00` : hora;
    return citasExistentes.some((c) => {
      if (c.fecha_cita !== fecha) return false;
      if (c.estado === "cancelada" || c.estado === "completada" || c.estado === "no_asistio") {
        return false;
      }
      const cHora = c.hora_cita.length === 5 ? `${c.hora_cita}:00` : c.hora_cita;
      return cHora === horaNormalizada;
    });
  };

  const handleContinue = () => {
    if (selectedDateStr && selectedHora) {
      onSelectSlot(selectedDateStr, selectedHora);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado de Sección Canva Style */}
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
              <p className="text-xs text-violet-200">
                3 pantallas: calendario → solicitud → confirmación
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-violet-100">
            Pantalla 1 — Calendario con horarios disponibles
          </span>
        </div>
      </div>

      {/* Tarjeta de Datos Iniciales (AUTO) */}
      <div className="rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
        <div className="grid grid-cols-1 gap-4 divide-y divide-border/60 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          {/* Folio del estudiante */}
          <div className="flex items-center justify-between gap-3 pb-3 sm:pb-0 sm:pr-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Folio del estudiante:
              </span>
              <p className="font-mono text-sm font-black text-foreground">
                {folioEstudiante}{" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  (auto desde sesión)
                </span>
              </p>
            </div>
            <AgendaBadge tipo="AUTO" />
          </div>

          {/* Nombre del psicólogo */}
          <div className="flex items-center justify-between gap-3 pt-3 sm:pt-0 sm:pl-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Nombre del psicólogo:
              </span>
              <p className="text-sm font-bold text-foreground">
                {nombrePsicologo}{" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  (auto desde profiles)
                </span>
              </p>
            </div>
            <AgendaBadge tipo="AUTO" />
          </div>
        </div>
      </div>

      {/* Calendario Interactivo con Días Laborables Destacados */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Calendario Mensual */}
        <div className="space-y-4 rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AgendaBadge tipo="ESTUDIANTE" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Calendario: Mes actual con días laborables destacados
              </h3>
            </div>
          </div>

          <div className="flex items-center justify-between border-y border-border/60 py-2.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="font-display text-sm font-bold capitalize text-foreground">
              {monthName}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-muted-foreground">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d, i) => (
              <div key={d} className={`py-1.5 ${i >= 5 ? "text-muted-foreground/40" : ""}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Grilla de días */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const laborable = isLaborable(day);
              const formattedMonth = String(month + 1).padStart(2, "0");
              const formattedDay = String(day).padStart(2, "0");
              const dateString = `${year}-${formattedMonth}-${formattedDay}`;
              const isSelected = selectedDateStr === dateString;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={!laborable}
                  onClick={() => handleDayClick(day)}
                  className={`flex h-10 flex-col items-center justify-center rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#6857E4] ${
                    isSelected
                      ? "bg-[#1B198F] text-white shadow-md ring-2 ring-[#1B198F]"
                      : laborable
                        ? "border border-border/80 bg-card text-foreground hover:border-[#6857E4] hover:bg-violet-50/70 dark:hover:bg-violet-950/40"
                        : "cursor-not-allowed bg-muted/40 text-muted-foreground/30"
                  }`}
                >
                  <span>{day}</span>
                  {laborable && !isSelected && (
                    <span className="h-1 w-1 rounded-full bg-[#12BDB6]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[#12BDB6]" />
            <span>Días con atención presencial de Bienestar TESH (Lunes a Viernes).</span>
          </div>
        </div>

        {/* Columna Derecha: Horarios Disponibles */}
        <div className="space-y-4 rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AgendaBadge tipo="MIXTO" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Horarios disponibles
              </h3>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            9:00-13:00 y 15:00-18:00 (50 min por sesión, configurados por psicólogo)
          </p>

          {/* Lista de horas */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Turno Matutino:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {HORARIOS_CONFIGURADOS.filter((h) => h.turno === "matutino").map((slot) => {
                const isSelected = selectedHora === slot.hora;
                const ocupado = selectedDateStr ? slotOcupado(selectedDateStr, slot.hora) : false;
                return (
                  <button
                    key={slot.hora}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setSelectedHora(slot.hora)}
                    aria-label={`${slot.label} ${ocupado ? "no disponible" : "disponible"}`}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#6857E4] ${
                      isSelected
                        ? "border-[#6857E4] bg-[#6857E4] text-white shadow-sm"
                        : ocupado
                          ? "cursor-not-allowed border-border bg-muted/40 text-muted-foreground/50 line-through"
                          : "border-border bg-card text-foreground hover:border-[#6857E4]/60 hover:bg-muted/50"
                    }`}
                  >
                    <span>{slot.label}</span>
                    <Clock className="size-3.5 opacity-70" />
                  </button>
                );
              })}
            </div>

            <span className="block pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Turno Vespertino:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {HORARIOS_CONFIGURADOS.filter((h) => h.turno === "vespertino").map((slot) => {
                const isSelected = selectedHora === slot.hora;
                const ocupado = selectedDateStr ? slotOcupado(selectedDateStr, slot.hora) : false;
                return (
                  <button
                    key={slot.hora}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setSelectedHora(slot.hora)}
                    aria-label={`${slot.label} ${ocupado ? "no disponible" : "disponible"}`}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#6857E4] ${
                      isSelected
                        ? "border-[#6857E4] bg-[#6857E4] text-white shadow-sm"
                        : ocupado
                          ? "cursor-not-allowed border-border bg-muted/40 text-muted-foreground/50 line-through"
                          : "border-border bg-card text-foreground hover:border-[#6857E4]/60 hover:bg-muted/50"
                    }`}
                  >
                    <span>{slot.label}</span>
                    <Clock className="size-3.5 opacity-70" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen de selección actual */}
          <div className="mt-4 rounded-2xl bg-violet-50/70 p-3 text-xs dark:bg-violet-950/30">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Día seleccionado:</span>
              <span className="font-bold text-foreground">{selectedDateStr || "Ninguno"}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Hora seleccionada:</span>
              <span className="font-bold text-foreground">
                {selectedHora ? `${selectedHora} hrs` : "Ninguna"}
              </span>
            </div>
          </div>

          {/* Botón continuar */}
          <button
            type="button"
            disabled={!selectedDateStr || !selectedHora}
            onClick={handleContinue}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B198F] py-3 text-xs font-bold text-white shadow-float transition-all hover:bg-[#1B198F] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Continuar a solicitud</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
