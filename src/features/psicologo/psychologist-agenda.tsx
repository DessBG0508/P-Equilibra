import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  XCircle,
  CalendarPlus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getStoredAppointments,
  completeAppointment,
  cancelAppointment,
} from "@/lib/psychologist-store";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { ListaSolicitudes } from "./ListaSolicitudes";
import { DetalleCita } from "./DetalleCita";
import { getSolicitudesPsicologo, actualizarEstadoCitaPsicologo } from "../agenda/agenda-service";
import type { SolicitudCita, EstadoCita } from "../agenda/types";

interface PsychologistAgendaProps {
  appointments?: Appointment[];
  onScheduleNew: () => void;
  onAppointmentsChange?: () => void;
}

const statusStyles: Record<AppointmentStatus, { label: string; surface: string }> = {
  confirmada: { label: "Confirmada", surface: "bg-teal/15 text-teal border-teal/30" },
  pendiente: { label: "Pendiente", surface: "bg-lime-100 text-lime-800 border-lime-300" },
  realizada: { label: "Realizada", surface: "bg-teal-100 text-teal-800 border-teal-300" },
  cancelada: { label: "Cancelada", surface: "bg-pink-100 text-pink-700 border-pink-300" },
};

function formatFriendlyDate(dateStr: string) {
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3) return dateStr;
    const year = parts[0] ?? 2026;
    const month = parts[1] ?? 1;
    const day = parts[2] ?? 1;
    const dateObj = new Date(year, month - 1, day);
    const formatted = dateObj.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    // Capitalize first letter
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return dateStr;
  }
}

export function PsychologistAgenda({
  appointments: externalAppointments,
  onScheduleNew,
  onAppointmentsChange,
}: PsychologistAgendaProps) {
  const [internalAppointments, setInternalAppointments] = useState<Appointment[]>(() =>
    getStoredAppointments(),
  );

  const appointments = externalAppointments || internalAppointments;

  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);

  const upcomingCount = useMemo(
    () => appointments.filter((a) => a.status === "confirmada" || a.status === "pendiente").length,
    [appointments],
  );

  const pastCount = useMemo(
    () => appointments.filter((a) => a.status === "realizada" || a.status === "cancelada").length,
    [appointments],
  );

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (filter === "upcoming") {
        return a.status === "confirmada" || a.status === "pendiente";
      }
      if (filter === "past") {
        return a.status === "realizada" || a.status === "cancelada";
      }
      return true;
    });
  }, [appointments, filter]);

  const handleConfirmComplete = () => {
    if (!completingApt) return;
    const result = completeAppointment(completingApt.id);
    setInternalAppointments(result.appointments);
    setCompletingApt(null);
    setFilter("past");
    onAppointmentsChange?.();
    toast.success("Sesión completada y registrada en bitácora");
  };

  const handleConfirmCancel = () => {
    if (!cancellingApt) return;
    const updated = cancelAppointment(cancellingApt.id);
    setInternalAppointments(updated);
    setCancellingApt(null);
    setFilter("past");
    onAppointmentsChange?.();
    toast.success("Cita cancelada");
  };

  // Estados para PB-009 Solicitudes de Citas Presenciales
  const [activeTab, setActiveTab] = useState<"pb009" | "clasica">("pb009");
  const [solicitudes, setSolicitudes] = useState<SolicitudCita[]>([]);
  const [selectedCita, setSelectedCita] = useState<SolicitudCita | null>(null);
  const [triggerAbandono, setTriggerAbandono] = useState(false);
  const [isLoadingSolicitudes, setIsLoadingSolicitudes] = useState(false);

  const fetchSolicitudes = useCallback(async () => {
    setIsLoadingSolicitudes(true);
    try {
      const data = await getSolicitudesPsicologo();
      setSolicitudes(data);
    } finally {
      setIsLoadingSolicitudes(false);
    }
  }, []);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  const handleAceptar = async (id: string) => {
    await actualizarEstadoCitaPsicologo(id, "confirmada");
    toast.success("Cita confirmada exitosamente. Se notificó al estudiante.");
    fetchSolicitudes();
    if (selectedCita?.id === id) {
      setSelectedCita((prev) => (prev ? { ...prev, estado: "confirmada" } : null));
    }
  };

  const handleCancelar = async (id: string, motivo: string) => {
    await actualizarEstadoCitaPsicologo(id, "cancelada", motivo);
    toast.info("Cita cancelada.");
    fetchSolicitudes();
    if (selectedCita?.id === id) {
      setSelectedCita((prev) =>
        prev ? { ...prev, estado: "cancelada", motivo_cancelacion: motivo } : null,
      );
    }
  };

  const handleCompletar = async (id: string) => {
    await actualizarEstadoCitaPsicologo(id, "completada");
    toast.success("Sesión completada y registrada en el expediente clínico.");
    fetchSolicitudes();
    if (selectedCita?.id === id) {
      setSelectedCita((prev) => (prev ? { ...prev, estado: "completada" } : null));
    }
  };

  const handleNoAsistio = async (id: string) => {
    const res = await actualizarEstadoCitaPsicologo(id, "no_asistio");
    if (res.triggerEncuestaAbandono) {
      setTriggerAbandono(true);
      toast.warning(
        "Alerta PB-021: El estudiante acumuló 2 inasistencias consecutivas. Se activó encuesta de satisfacción y abandono.",
      );
    } else {
      toast.info("Inasistencia registrada.");
    }
    fetchSolicitudes();
    if (selectedCita?.id === id) {
      setSelectedCita((prev) => (prev ? { ...prev, estado: "no_asistio" } : null));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-primary">Agenda de Citas</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Sistema de solicitud y gestión de citas presenciales entre estudiante y psicólogo
            (PB-009).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={onScheduleNew}
            className="rounded-xl bg-teal text-white hover:bg-teal/90 gap-1.5 shadow-sm text-xs font-semibold h-9"
          >
            <CalendarPlus className="size-4" />
            <span>+ Agendar Cita con Paciente</span>
          </Button>
        </div>
      </div>

      {/* Pestañas PB-009 vs Agenda Clásica */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("pb009");
            setSelectedCita(null);
          }}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "pb009"
              ? "bg-[#1B198F] text-white shadow-xs"
              : "border border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          Gestión de Solicitudes PB-009 ({solicitudes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("clasica")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "clasica"
              ? "bg-[#1B198F] text-white shadow-xs"
              : "border border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          Vista Clásica de Citas ({appointments.length})
        </button>
      </div>

      {activeTab === "pb009" ? (
        selectedCita ? (
          <DetalleCita
            cita={selectedCita}
            onAceptar={() => handleAceptar(selectedCita.id)}
            onCancelar={(motivo) => handleCancelar(selectedCita.id, motivo)}
            onCompletar={() => handleCompletar(selectedCita.id)}
            onNoAsistio={() => handleNoAsistio(selectedCita.id)}
            onBack={() => setSelectedCita(null)}
            triggerAbandonoActivo={triggerAbandono}
          />
        ) : (
          <ListaSolicitudes
            solicitudes={solicitudes}
            onSelectCita={(cita) => setSelectedCita(cita)}
            onAceptarCita={handleAceptar}
            onCancelarCita={(id) => {
              const cita = solicitudes.find((s) => s.id === id);
              if (cita) setSelectedCita(cita);
            }}
            isLoading={isLoadingSolicitudes}
          />
        )
      ) : (
        <div className="space-y-6">
          {/* Filtros unificados de la agenda */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className={`h-8 rounded-lg text-xs ${
                filter === "all" ? "bg-primary text-primary-foreground" : "bg-card/70"
              }`}
            >
              Todas ({appointments.length})
            </Button>
            <Button
              size="sm"
              variant={filter === "upcoming" ? "default" : "outline"}
              onClick={() => setFilter("upcoming")}
              className={`h-8 rounded-lg text-xs ${
                filter === "upcoming" ? "bg-teal text-white" : "bg-card/70"
              }`}
            >
              Próximas ({upcomingCount})
            </Button>
            <Button
              size="sm"
              variant={filter === "past" ? "default" : "outline"}
              onClick={() => setFilter("past")}
              className={`h-8 rounded-lg text-xs ${
                filter === "past" ? "bg-accent text-accent-foreground" : "bg-card/70"
              }`}
            >
              Historial ({pastCount})
            </Button>
          </div>

          {/* Lista de citas */}
          <div className="grid gap-3">
            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50">
                <Calendar className="size-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">No hay citas en este filtro</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Programa una sesión con tus estudiantes para brindarles acompañamiento.
                </p>
              </div>
            ) : (
              filteredAppointments.map((apt) => {
                const statusStyle = statusStyles[apt.status] || statusStyles.pendiente;
                const isUpcoming = apt.status === "confirmada" || apt.status === "pendiente";
                const isCancelled = apt.status === "cancelada";

                return (
                  <div
                    key={apt.id}
                    className={`ethereal-card p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-all ${
                      isCancelled
                        ? "opacity-75 bg-muted/20 border-pink-200/50 dark:border-pink-950/40"
                        : "border-border/80 hover:border-border"
                    }`}
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${statusStyle.surface} text-xs font-bold`}
                        >
                          {statusStyle.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-card text-muted-foreground border-border text-xs"
                        >
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3 text-pink-400" /> Presencial
                          </span>
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                          <Clock className="size-3" />
                          {apt.timeSlot}
                        </span>
                        {apt.folioTamizaje && (
                          <Badge
                            variant="outline"
                            className="border-[#6857E4]/40 bg-[#6857E4]/10 text-primary font-mono text-[11px] font-bold"
                          >
                            Folio: {apt.folioTamizaje}
                          </Badge>
                        )}
                        {apt.serviceType && (
                          <Badge
                            variant="outline"
                            className="border-violet-400/30 bg-violet-50/50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 text-[10px] font-semibold"
                          >
                            {apt.serviceType}
                          </Badge>
                        )}
                      </div>

                      <div>
                        {/* Nombre del paciente en fuente serif cursiva display legible sin elementos encimados */}
                        <h3 className="font-display italic text-lg sm:text-xl font-semibold text-primary tracking-tight">
                          {apt.studentName || "Paciente TESH"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5 font-medium">
                          <span className="font-semibold text-foreground">
                            {formatFriendlyDate(apt.date)}
                          </span>
                          <span>•</span>
                          <span>{apt.locationOrLink}</span>
                        </div>

                        {apt.notes && (
                          <p className="text-xs text-foreground font-medium mt-2 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {isUpcoming && (
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <Button
                          size="sm"
                          onClick={() => setCompletingApt(apt)}
                          className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 gap-1.5 font-semibold shadow-xs"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Marcar completada</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCancellingApt(apt)}
                          className="rounded-xl border-pink-300 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/30 text-xs h-8 gap-1.5 font-medium"
                        >
                          <XCircle className="size-3.5" />
                          <span>Cancelar</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Modal de confirmación para Marcar Completada */}
          <AlertDialog
            open={completingApt !== null}
            onOpenChange={(open) => {
              if (!open) setCompletingApt(null);
            }}
          >
            <AlertDialogContent className="rounded-2xl border-border bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-xl text-primary flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-teal-600" />
                  ¿Deseas marcar esta sesión como completada?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Al confirmar, la sesión con{" "}
                  <strong className="text-foreground">
                    {completingApt?.studentName || "el paciente"}
                  </strong>{" "}
                  se moverá al historial de citas y se registrará automáticamente una nota de
                  evolución en la bitácora clínica confidencial.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel className="rounded-xl text-xs h-9">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmComplete}
                  className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 font-semibold"
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Modal de confirmación para Cancelar Cita */}
          <AlertDialog
            open={cancellingApt !== null}
            onOpenChange={(open) => {
              if (!open) setCancellingApt(null);
            }}
          >
            <AlertDialogContent className="rounded-2xl border-border bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-xl text-destructive flex items-center gap-2">
                  <AlertCircle className="size-5 text-pink-500" />
                  ¿Estás seguro de cancelar esta cita?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Esta acción marcará la cita con{" "}
                  <strong className="text-foreground">
                    {cancellingApt?.studentName || "el paciente"}
                  </strong>{" "}
                  como cancelada. El paciente será notificado y la cita quedará registrada en el
                  historial.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel className="rounded-xl text-xs h-9">Volver</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmCancel}
                  className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs h-9 font-semibold"
                >
                  Confirmar cancelación
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
