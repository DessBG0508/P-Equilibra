import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { appointmentIcons } from "@/config/icons";
import { mockAppointments } from "@/lib/mock-data";
import type { Appointment, AppointmentModality } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { CalendarioCitas } from "@/features/agenda/CalendarioCitas";
import { FormularioSolicitud } from "@/features/agenda/FormularioSolicitud";
import { EstadoCita } from "@/features/agenda/EstadoCita";
import {
  getSolicitudesEstudiante,
  crearSolicitudCita,
  cancelarCitaEstudiante,
} from "@/features/agenda/agenda-service";
import type { SolicitudCita } from "@/features/agenda/types";

const STORAGE_KEY = "equilibra_citas_v1";

const TIME_SLOTS = [
  { slot: "09:00 - 09:50", occupied: false },
  { slot: "10:00 - 10:50", occupied: true },
  { slot: "11:00 - 11:50", occupied: false },
  { slot: "12:00 - 12:50", occupied: false },
  { slot: "14:00 - 14:50", occupied: true },
  { slot: "15:00 - 15:50", occupied: false },
  { slot: "16:00 - 16:50", occupied: false },
];

const PSYCHOLOGISTS = [
  {
    name: "Dra. Marta Gómez",
    role: "Psicóloga clínica y bienestar estudiantil",
    office: "Consultorio 3, Edificio de Bienestar Integral TESH",
  },
  {
    name: "Lic. Carlos Fuentes",
    role: "Orientación psicológica y manejo del estrés",
    office: "Consultorio 1, Edificio de Bienestar Integral TESH",
  },
];

function formatDateDisplay(dateStr: string) {
  try {
    const parts = dateStr.split("-").map(Number);
    const year = parts[0] ?? 2026;
    const month = parts[1] ?? 1;
    const day = parts[2] ?? 1;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function CitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalizar modalidad a presencial según decisión clínica
          const normalized = parsed.map((a: Appointment) => ({
            ...a,
            modality: "presencial" as const,
            locationOrLink:
              a.locationOrLink && a.locationOrLink.toLowerCase().includes("videollamada")
                ? "Consultorio 3, Edificio de Bienestar Integral TESH"
                : a.locationOrLink || "Consultorio 3, Edificio de Bienestar Integral TESH",
          }));
          // Asegurar que la cita inicial de prueba tenga folio EQ-1234 visible si aún no tenía
          if (!normalized.some((a: Appointment) => a.folio_tamizaje || a.folioTamizaje)) {
            normalized[0].folio_tamizaje = "EQ-1234";
            normalized[0].folioTamizaje = "EQ-1234";
          }
          return normalized;
        }
      }
    } catch {
      // Fallback
    }
    return mockAppointments;
  });

  // Modal de Agendar / Reprogramar
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-28");
  const [selectedSlot, setSelectedSlot] = useState<string>("11:00 - 11:50");
  const [selectedModality, setSelectedModality] = useState<AppointmentModality>("presencial");
  const [selectedPsychologist, setSelectedPsychologist] = useState<string>("Dra. Marta Gómez");
  const [folioTamizaje, setFolioTamizaje] = useState<string>("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("TERAPIA PSICOLÓGICA");
  const [selectedSex, setSelectedSex] = useState<string>("");
  const [selectedSemestre, setSelectedSemestre] = useState<string>("");
  const [savedFolio, setSavedFolio] = useState<string | null>(null);

  // Modal de Éxito
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Modal de Cancelar
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    } catch (e) {
      console.error("Error al persistir citas", e);
    }
  }, [appointments]);

  // Estados del Flujo Oficial PB-009 (Canva)
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pb009_solicitud" | "historial">("pb009_solicitud");
  const [pbEtapa, setPbEtapa] = useState<"calendario" | "solicitud" | "estado">("calendario");
  const [pbFecha, setPbFecha] = useState<string>("");
  const [pbHora, setPbHora] = useState<string>("");
  const [pbCitaActiva, setPbCitaActiva] = useState<SolicitudCita | null>(null);
  const [pbTodasSolicitudes, setPbTodasSolicitudes] = useState<SolicitudCita[]>([]);
  const [isSubmittingPb, setIsSubmittingPb] = useState<boolean>(false);
  const [isCancelingPb, setIsCancelingPb] = useState<boolean>(false);

  const cargarCitasPb = useCallback(async () => {
    if (!user) return;
    const solicitudes = await getSolicitudesEstudiante(user.id, user.matricula);
    setPbTodasSolicitudes(solicitudes);
    const activa = solicitudes.find((s) => s.estado === "pendiente" || s.estado === "confirmada");
    if (activa) {
      setPbCitaActiva(activa);
      setPbEtapa("estado");
    } else if (solicitudes.length > 0) {
      setPbCitaActiva(solicitudes[0]);
    }
  }, [user]);

  useEffect(() => {
    cargarCitasPb();
  }, [cargarCitasPb]);

  const handleSelectSlotPb = (fecha: string, hora: string) => {
    setPbFecha(fecha);
    setPbHora(hora);
    setPbEtapa("solicitud");
  };

  const handleSubmitSolicitudPb = async (motivo: string) => {
    if (!pbFecha || !pbHora) return;
    setIsSubmittingPb(true);
    try {
      const res = await crearSolicitudCita({
        folio: user?.matricula || "EQ-9374",
        user_id: user?.id || "demo-student",
        nombre_psicologo: "Dra. Marta Gómez",
        iniciales_estudiante: user?.name ? user.name.slice(0, 2).toUpperCase() : "D.B.",
        fecha_cita: pbFecha,
        hora_cita: pbHora,
        modalidad: "presencial",
        estado: "pendiente",
        motivo: motivo || undefined,
      });

      if (res.ok && res.cita) {
        setPbCitaActiva(res.cita);
        setPbEtapa("estado");
        toast.success("Solicitud de cita presencial registrada exitosamente.");
      } else {
        toast.error(res.error || "No fue posible registrar la cita.");
      }
    } finally {
      setIsSubmittingPb(false);
    }
  };

  const handleCancelarCitaPb = async (citaId: string, motivo?: string) => {
    if (!pbCitaActiva) return;
    setIsCancelingPb(true);
    try {
      const res = await cancelarCitaEstudiante(
        citaId,
        pbCitaActiva.fecha_cita,
        pbCitaActiva.hora_cita,
        motivo,
      );
      if (res.ok) {
        toast.info("Cita cancelada correctamente.");
        setPbCitaActiva((prev) => (prev ? { ...prev, estado: "cancelada" } : null));
      } else {
        toast.error(res.error || "No es posible cancelar la cita.");
      }
    } finally {
      setIsCancelingPb(false);
    }
  };

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "confirmada" || a.status === "pendiente",
  );
  const historyAppointments = appointments.filter(
    (a) => a.status === "realizada" || a.status === "cancelada",
  );

  const handleOpenNewAppointment = () => {
    setEditingAppointment(null);
    setSelectedDate("2026-09-28");
    setSelectedSlot("11:00 - 11:50");
    setSelectedModality("presencial");
    setSelectedPsychologist("Dra. Marta Gómez");
    setSelectedServiceType("TERAPIA PSICOLÓGICA");
    setSelectedSex("");
    setSelectedSemestre("");

    // Detectar si el alumno generó un folio recientemente en el chat de Eli
    try {
      const stored = localStorage.getItem("equilibra_ultimo_folio_tamizaje");
      if (stored) {
        setSavedFolio(stored);
        setFolioTamizaje(stored);
      } else {
        setSavedFolio(null);
        setFolioTamizaje("");
      }
    } catch {
      setSavedFolio(null);
      setFolioTamizaje("");
    }

    setIsFormOpen(true);
  };

  const handleOpenReschedule = (apt: Appointment) => {
    setEditingAppointment(apt);
    setSelectedDate(apt.date);
    setSelectedSlot(apt.timeSlot);
    setSelectedModality("presencial");
    setSelectedPsychologist(apt.psychologistName);
    setFolioTamizaje(apt.folio_tamizaje || apt.folioTamizaje || "");
    setSelectedServiceType(apt.serviceType || "TERAPIA PSICOLÓGICA");
    setIsFormOpen(true);
  };

  const handleConfirmForm = () => {
    // Validación estricta en cliente de fecha, horario y modalidad
    if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      toast.error("Por favor selecciona una fecha válida para tu cita.");
      return;
    }

    if (!selectedSlot || !selectedSlot.includes(":")) {
      toast.error("Por favor selecciona un horario disponible.");
      return;
    }

    const defaultPsych = PSYCHOLOGISTS[0]!;
    const psychInfo = PSYCHOLOGISTS.find((p) => p.name === selectedPsychologist) ?? defaultPsych;
    const location = psychInfo.office;

    const cleanedFolio = folioTamizaje.trim() ? folioTamizaje.trim().toUpperCase() : undefined;

    if (editingAppointment) {
      // Reprogramar
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === editingAppointment.id
            ? {
                ...item,
                date: selectedDate,
                timeSlot: selectedSlot,
                modality: "presencial",
                psychologistName: psychInfo.name,
                psychologistRole: psychInfo.role,
                locationOrLink: location,
                status: "confirmada",
                // TODO(Supabase): mapear a solicitudes_cita.folio_tamizaje
                folio_tamizaje: cleanedFolio,
                folioTamizaje: cleanedFolio,
                serviceType: selectedServiceType,
              }
            : item,
        ),
      );
      setIsFormOpen(false);
      setShowSuccessOverlay(true);
    } else {
      // Nueva Cita
      const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        date: selectedDate,
        timeSlot: selectedSlot,
        modality: "presencial",
        psychologistName: psychInfo.name,
        psychologistRole: psychInfo.role,
        locationOrLink: location,
        status: "confirmada",
        createdAt: new Date().toISOString(),
        // TODO(Supabase): mapear a solicitudes_cita.folio_tamizaje
        folio_tamizaje: cleanedFolio,
        folioTamizaje: cleanedFolio,
        serviceType: selectedServiceType,
      };
      setAppointments((prev) => [newApt, ...prev]);
      setIsFormOpen(false);
      setShowSuccessOverlay(true);
    }
  };

  const handleConfirmCancel = () => {
    if (!appointmentToCancel) return;

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === appointmentToCancel.id ? { ...item, status: "cancelada" } : item,
      ),
    );
    const cancelledName = appointmentToCancel.psychologistName;
    setAppointmentToCancel(null);
    toast.success("Cita cancelada con éxito", {
      description: "No pasa nada, puedes reagendar cuando quieras.",
    });
  };

  // Generador de días del mes actual para el selector (Septiembre 2026, días 22 a 30)
  const availableDays = [
    { day: "22", weekday: "Mar", fullDate: "2026-09-22" },
    { day: "23", weekday: "Mié", fullDate: "2026-09-23" },
    { day: "24", weekday: "Jue", fullDate: "2026-09-24" },
    { day: "25", weekday: "Vie", fullDate: "2026-09-25" },
    { day: "28", weekday: "Lun", fullDate: "2026-09-28" },
    { day: "29", weekday: "Mar", fullDate: "2026-09-29" },
    { day: "30", weekday: "Mié", fullDate: "2026-09-30" },
  ];

  return (
    <PageShell>
      <main className="space-y-8 animate-fade-in pb-16">
        {/* Encabezado de la página */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-accent mb-1">
              <appointmentIcons.calendar className="size-3.5" />
              <span>Acompañamiento psicológico</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Mis sesiones de orientación
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground leading-relaxed">
              Reserva un espacio confidencial con los profesionales del TESH para cuidar de tu
              bienestar integral.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleOpenNewAppointment}
            className="h-11 gap-2 rounded-2xl bg-[#6857E4] px-5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-[#6857E4] hover:scale-[1.02] active:scale-[0.98]"
          >
            <appointmentIcons.calendarPlus className="size-4" />
            <span>Nueva cita</span>
          </Button>
        </section>

        {/* Selector de Pestañas: PB-009 vs Historial */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("pb009_solicitud")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "pb009_solicitud"
                ? "bg-[#1B198F] text-white shadow-xs"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            Agenda PB-009 · Solicitar Cita Presencial
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("historial")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "historial"
                ? "bg-[#1B198F] text-white shadow-xs"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            Historial de Citas ({appointments.length})
          </button>
        </div>

        {activeTab === "pb009_solicitud" ? (
          <div className="space-y-6">
            {pbEtapa === "calendario" && (
              <CalendarioCitas
                folioEstudiante={user?.matricula || "EQ-9374"}
                nombrePsicologo="Dra. Marta Gómez"
                fechaPrevia={pbFecha}
                horaPrevia={pbHora}
                onSelectSlot={handleSelectSlotPb}
                citasExistentes={pbTodasSolicitudes.map((s) => ({
                  fecha_cita: s.fecha_cita,
                  hora_cita: s.hora_cita,
                  estado: s.estado,
                }))}
              />
            )}

            {pbEtapa === "solicitud" && (
              <FormularioSolicitud
                fechaCita={pbFecha}
                horaCita={pbHora}
                nombrePsicologo="Dra. Marta Gómez"
                onSubmit={handleSubmitSolicitudPb}
                onCancel={() => setPbEtapa("calendario")}
                isSubmitting={isSubmittingPb}
              />
            )}

            {pbEtapa === "estado" && pbCitaActiva && (
              <EstadoCita
                cita={pbCitaActiva}
                onCancelarCita={handleCancelarCitaPb}
                onNuevaSolicitud={() => setPbEtapa("calendario")}
                isCanceling={isCancelingPb}
              />
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Sección 1: Próximas Citas */}
            <section aria-labelledby="upcoming-title" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="upcoming-title" className="font-display text-xl font-bold text-foreground">
                  Próximas citas
                </h2>
                <span className="text-xs font-semibold text-muted-foreground">
                  {upcomingAppointments.length} agendada
                  {upcomingAppointments.length === 1 ? "" : "s"}
                </span>
              </div>

              {upcomingAppointments.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcomingAppointments.map((apt) => (
                    <article
                      key={apt.id}
                      className="ethereal-card flex flex-col justify-between p-5 sm:p-6 transition-all hover:border-accent/30"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={`rounded-xl px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                              apt.status === "confirmada"
                                ? "border-teal-500/40 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                                : "border-lime-500/40 bg-lime-500/10 text-lime-600 dark:text-lime-400"
                            }`}
                          >
                            {apt.status === "confirmada" ? "Confirmada" : "Pendiente"}
                          </Badge>

                          <Badge
                            variant="secondary"
                            className="gap-1 rounded-xl bg-muted/80 text-[11px] font-medium text-muted-foreground"
                          >
                            <appointmentIcons.mapPin className="size-3 text-accent" />
                            <span>Presencial</span>
                          </Badge>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-foreground capitalize">
                            {formatDateDisplay(apt.date)}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-accent">
                            <appointmentIcons.clock className="size-3.5" />
                            <span>{apt.timeSlot}</span>
                          </div>

                          {(apt.folio_tamizaje || apt.folioTamizaje) && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-bold py-0.5 px-2 rounded-lg"
                              >
                                Folio: {apt.folio_tamizaje || apt.folioTamizaje}
                              </Badge>
                              {apt.serviceType && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-semibold bg-lavender-soft text-primary py-0.5 px-2 rounded-lg"
                                >
                                  {apt.serviceType}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 rounded-xl bg-background/60 p-3 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <appointmentIcons.user className="size-3.5 text-accent" />
                            <span>{apt.psychologistName}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {apt.psychologistRole || "Psicología TESH"}
                          </p>
                          <p className="pt-1 text-[11px] text-muted-foreground/90 border-t border-border/40">
                            {apt.locationOrLink}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAppointmentToCancel(apt)}
                          className="h-8 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <appointmentIcons.calendarX className="mr-1.5 size-3.5" />
                          <span>Cancelar</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReschedule(apt)}
                          className="h-8 rounded-xl border-accent/40 text-xs font-semibold text-accent hover:bg-accent/10"
                        >
                          <appointmentIcons.refresh className="mr-1.5 size-3.5" />
                          <span>Reprogramar</span>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                /* Estado vacío ilustrado con shape custom (nube suave) */
                <div className="ethereal-card flex flex-col items-center justify-center p-8 text-center sm:p-12">
                  {/* Custom SVG soft cloud shape */}
                  <div
                    className="relative mb-5 flex size-28 items-center justify-center rounded-full bg-lavender-soft text-accent/80"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 100 70"
                      className="size-20 fill-accent/20 stroke-accent stroke-[2.5]"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M25,55 C12,55 5,45 8,33 C10,23 20,18 29,22 C34,10 49,6 60,15 C70,7 86,13 88,27 C96,30 98,42 92,50 C87,56 79,55 75,55 Z"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </svg>
                    <appointmentIcons.calendar className="absolute size-8 text-accent" />
                  </div>

                  <h3 className="font-display text-xl font-bold text-foreground">
                    Aún no tienes citas
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
                    Dar el primer paso también es un acto de cuidado. Cuando sientas que es el
                    momento, aquí estaremos para ti.
                  </p>

                  <Button
                    type="button"
                    onClick={handleOpenNewAppointment}
                    className="mt-6 h-11 gap-2 rounded-2xl bg-[#6857E4] px-6 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-105 active:scale-95"
                  >
                    <appointmentIcons.calendarPlus className="size-4" />
                    <span>Agendar primera cita</span>
                  </Button>
                </div>
              )}
            </section>

            {/* Sección 2: Historial de Citas */}
            <section aria-labelledby="history-title" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="history-title" className="font-display text-xl font-bold text-foreground">
                  Historial de sesiones
                </h2>
                <span className="text-xs font-semibold text-muted-foreground">
                  {historyAppointments.length} anterior
                  {historyAppointments.length === 1 ? "" : "es"}
                </span>
              </div>

              {historyAppointments.length > 0 ? (
                <div className="space-y-3">
                  {historyAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/75 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                            apt.status === "realizada"
                              ? "bg-teal-500/15 text-teal-600"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {apt.status === "realizada" ? (
                            <appointmentIcons.checkCircle className="size-5" />
                          ) : (
                            <appointmentIcons.xCircle className="size-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground capitalize">
                              {formatDateDisplay(apt.date)}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`rounded-lg px-2 py-0 text-[10px] font-bold uppercase tracking-wider ${
                                apt.status === "realizada"
                                  ? "bg-teal-500/10 text-teal-600"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {apt.status === "realizada" ? "Realizada" : "Cancelada"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {apt.timeSlot} • Con {apt.psychologistName} (Presencial)
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenReschedule(apt)}
                          className="h-8 rounded-xl text-xs font-semibold text-accent hover:bg-accent/10"
                        >
                          <appointmentIcons.calendarPlus className="mr-1.5 size-3.5" />
                          <span>Volver a agendar</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No tienes sesiones anteriores registradas en tu historial.
                </p>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Modal / Dialog de Agendamiento y Reprogramación */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-accent mb-1">
              <appointmentIcons.sparkles className="size-3.5" />
              <span>{editingAppointment ? "Actualizar sesión" : "Agendar nueva sesión"}</span>
            </div>
            <DialogTitle className="font-display text-2xl font-bold text-primary">
              {editingAppointment ? "Reprogramar cita" : "Elige tu espacio de apoyo"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecciona el día, horario y modalidad que mejor se adapte a tu ritmo escolar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Tipo de atención sugerida */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                Tipo de atención solicitada
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "TERAPIA PSICOLÓGICA", label: "Terapia", desc: "Prioritaria / Regular" },
                  { id: "ORIENTACIÓN", label: "Orientación", desc: "Apoyo y seguimiento" },
                  { id: "CONSEJERÍA", label: "Consejería", desc: "Acompañamiento preventivo" },
                ].map((srv) => {
                  const isSelected = selectedServiceType === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedServiceType(srv.id)}
                      className={`rounded-xl p-2.5 text-left border transition-all ${
                        isSelected
                          ? "border-[#6857E4] bg-lavender-soft text-primary font-bold shadow-xs scale-102"
                          : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <p className="text-xs font-bold leading-tight">{srv.label}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {srv.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Datos complementarios (Sexo y Semestre con opciones Hombre/Mujer/Otro y 1°-9°/Otro) */}
            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              <div className="space-y-1">
                <label
                  htmlFor="student-sex-select"
                  className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Sexo (opcional)
                </label>
                <select
                  id="student-sex-select"
                  value={selectedSex}
                  onChange={(e) => setSelectedSex(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border/80 bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#6857E4]/30"
                >
                  <option value="">Selecciona...</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="student-semestre-select"
                  className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Semestre (opcional)
                </label>
                <select
                  id="student-semestre-select"
                  value={selectedSemestre}
                  onChange={(e) => setSelectedSemestre(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border/80 bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#6857E4]/30"
                >
                  <option value="">Selecciona...</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                    <option key={s} value={`${s}º Semestre`}>
                      {s}º Semestre
                    </option>
                  ))}
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {/* 1. Selector de fecha (Septiembre 2026) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                1. Fecha disponible (Septiembre 2026)
              </label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {availableDays.map((item) => {
                  const isSelected = selectedDate === item.fullDate;
                  return (
                    <button
                      key={item.fullDate}
                      type="button"
                      onClick={() => setSelectedDate(item.fullDate)}
                      className={`flex flex-col items-center justify-center rounded-xl p-2 transition-all ${
                        isSelected
                          ? "bg-[#6857E4] text-white shadow-soft font-bold scale-105"
                          : "border border-border/70 bg-card hover:border-accent/40 text-foreground"
                      }`}
                    >
                      <span className="text-[10px] opacity-80 uppercase">{item.weekday}</span>
                      <span className="text-sm font-bold">{item.day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Selector de horario (Chips de 50 min) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                2. Horario disponible (Sesión de 50 min)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map(({ slot, occupied }) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={occupied}
                      onClick={() => setSelectedSlot(slot)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all ${
                        occupied
                          ? "border border-border/40 bg-muted/40 text-muted-foreground/40 cursor-not-allowed opacity-60"
                          : isSelected
                            ? "bg-[#6857E4] text-white font-bold shadow-soft"
                            : "border border-border/80 bg-card text-foreground hover:border-accent"
                      }`}
                    >
                      <span>{slot}</span>
                      {occupied ? (
                        <span className="text-[10px] italic">Ocupado</span>
                      ) : isSelected ? (
                        <appointmentIcons.check className="size-3.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Modalidad fija en Presencial */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                3. Modalidad
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-accent/40 bg-lavender-soft/60 p-3 text-xs">
                <appointmentIcons.mapPin className="size-4 text-accent shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold text-foreground">Presencial</p>
                  <p className="text-[10px] text-muted-foreground font-normal">
                    Campus TESH • Consultorio de Bienestar Integral
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold bg-background/80 text-muted-foreground border border-border/50"
                >
                  Modalidad única
                </Badge>
              </div>
            </div>

            {/* 4. Profesional asignado */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                4. Especialista disponible
              </label>
              <div className="space-y-2">
                {PSYCHOLOGISTS.map((p) => {
                  const isSelected = selectedPsychologist === p.name;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setSelectedPsychologist(p.name)}
                      className={`w-full rounded-xl p-3 text-left transition-all ${
                        isSelected
                          ? "border-2 border-[#6857E4] bg-lavender-soft"
                          : "border border-border/70 bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{p.name}</span>
                        {isSelected && <appointmentIcons.check className="size-4 text-accent" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{p.role}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campo opcional: Folio de tamizaje (opcional) ubicado bajo el paso de especialista */}
            <div className="space-y-1.5 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between">
                <Label htmlFor="folio-tamizaje-input" className="text-xs font-bold text-foreground">
                  Folio de tamizaje (opcional)
                </Label>
                {savedFolio && folioTamizaje !== savedFolio && (
                  <button
                    type="button"
                    onClick={() => setFolioTamizaje(savedFolio)}
                    className="text-[11px] font-semibold text-[#6857E4] hover:underline"
                  >
                    Usar último folio ({savedFolio})
                  </button>
                )}
              </div>
              <Input
                id="folio-tamizaje-input"
                type="text"
                placeholder="EQ-1234"
                value={folioTamizaje}
                onChange={(e) => setFolioTamizaje(e.target.value.toUpperCase())}
                className="h-9 font-mono text-xs uppercase bg-card font-semibold rounded-xl border-border/80"
              />
              {folioTamizaje.trim() !== "" && !/^EQ-\d{4}$/.test(folioTamizaje.trim()) && (
                <p className="text-[11px] text-lime-600 dark:text-lime-400">
                  Aviso: El formato habitual es EQ- seguido de 4 dígitos (ej. EQ-1234). Puedes
                  guardar de todos modos.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground leading-snug">
                Si completaste el tamizaje con Eli, escribe aquí tu folio para vincular tus
                resultados con la cita.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-4 flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmForm}
              className="rounded-xl bg-[#6857E4] text-white hover:bg-[#6857E4]"
            >
              {editingAppointment ? "Confirmar reprogramación" : "Confirmar cita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overlay de Éxito al confirmar */}
      <Dialog open={showSuccessOverlay} onOpenChange={setShowSuccessOverlay}>
        <DialogContent className="max-w-md rounded-3xl p-6 text-center shadow-2xl sm:p-8">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-teal-500/15 text-teal-600">
            <appointmentIcons.checkCircle className="size-8" />
          </div>
          <DialogTitle className="font-display text-2xl font-bold text-foreground">
            Cita confirmada
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Tu cita quedó agendada. Te llegará confirmación por correo con los detalles y las
            instrucciones de acceso.
          </DialogDescription>

          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              onClick={() => setShowSuccessOverlay(false)}
              className="h-11 rounded-2xl bg-[#6857E4] px-8 text-sm font-semibold text-white shadow-soft"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación para Cancelar */}
      <Dialog
        open={Boolean(appointmentToCancel)}
        onOpenChange={(open) => !open && setAppointmentToCancel(null)}
      >
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-destructive/15 p-3 text-destructive">
              <appointmentIcons.alert className="size-6" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="font-display text-xl font-bold text-foreground">
                ¿Deseas cancelar esta cita?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                No pasa nada, puedes reagendar cuando quieras. Tu bienestar va a tu propio ritmo.
              </DialogDescription>
            </div>
          </div>

          <DialogFooter className="mt-6 flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAppointmentToCancel(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Mantener cita
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmCancel}
              className="rounded-xl text-xs font-semibold"
            >
              Sí, cancelar cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
