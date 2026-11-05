import { useState, useMemo, useEffect } from "react";
import { Calendar, Clock, MapPin, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { scheduleSessionFromPsychologist, getStoredAppointments } from "@/lib/psychologist-store";
import type { CaseSummary, AppointmentModality } from "@/lib/types";

interface ScheduleSessionDialogProps {
  caseItem: CaseSummary | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TIME_SLOTS = [
  "09:00 - 09:50",
  "10:00 - 10:50",
  "11:00 - 11:50",
  "12:00 - 12:50",
  "14:00 - 14:50",
  "15:00 - 15:50",
  "16:00 - 16:50",
];

const TOPICS = [
  "Valoración inicial y escucha activa",
  "Manejo de ansiedad y estrés académico",
  "Regulación emocional y técnicas de sueño",
  "Acompañamiento prioritario en crisis",
  "Seguimiento y estrategias de afrontamiento",
  "Orientación y vinculación institucional",
];

export function ScheduleSessionDialog({
  caseItem,
  isOpen,
  onOpenChange,
  onSuccess,
}: ScheduleSessionDialogProps) {
  // Default to next workday
  const [date, setDate] = useState<string>("2026-09-28");
  const [timeSlot, setTimeSlot] = useState<string>("11:00 - 11:50");
  const [modality, setModality] = useState<AppointmentModality>("presencial");
  const [topic, setTopic] = useState<string>(TOPICS[0] ?? "Primera sesión de valoración");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const appointments = useMemo(() => (isOpen ? getStoredAppointments() : []), [isOpen]);

  const occupiedSlots = useMemo(() => {
    return appointments
      .filter((a) => a.date === date && (a.status === "confirmada" || a.status === "pendiente"))
      .map((a) => a.timeSlot);
  }, [appointments, date]);

  // Si el horario seleccionado queda ocupado al cambiar la fecha, cambiar al primer disponible
  useEffect(() => {
    if (occupiedSlots.includes(timeSlot)) {
      const firstAvailable = TIME_SLOTS.find((s) => !occupiedSlots.includes(s));
      if (firstAvailable) {
        setTimeSlot(firstAvailable);
      }
    }
  }, [date, occupiedSlots, timeSlot]);

  if (!caseItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Por favor selecciona una fecha para la sesión.");
      return;
    }

    if (occupiedSlots.includes(timeSlot)) {
      toast.error("El horario seleccionado ya está ocupado para esa fecha. Por favor elige otro.");
      return;
    }

    setIsSubmitting(true);
    try {
      scheduleSessionFromPsychologist({
        caseId: caseItem.id,
        studentInitials: caseItem.initials,
        studentName: caseItem.studentName || `Estudiante ${caseItem.initials}`,
        date,
        timeSlot,
        modality,
        psychologistName: "Dra. Marta Gómez",
        sessionTopic: topic,
        notes,
      });

      toast.success("Sesión agendada exitosamente", {
        description: `Cita programada con ${caseItem.studentName || caseItem.initials} para el ${date} a las ${timeSlot}. Se notificó al estudiante.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo programar la cita.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border bg-card">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-teal/15 text-teal">
                <Calendar className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-xl font-display text-primary">
                  Agendar Sesión con {caseItem.initials}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {caseItem.studentName} — {caseItem.career || "Comunidad TESH"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-4 text-sm">
            {/* Modalidad */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Modalidad de atención</Label>
              <div className="flex items-center gap-2.5 rounded-xl border border-accent/40 bg-accent/5 p-3 text-left">
                <MapPin className="size-4 text-accent shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">Presencial</p>
                  <p className="text-[10px] text-muted-foreground">
                    Consultorio 3, Edificio de Bienestar Integral TESH
                  </p>
                </div>
                <span className="text-[10px] font-semibold bg-accent/15 text-accent px-2 py-0.5 rounded-md">
                  Presencial
                </span>
              </div>
            </div>

            {/* Fecha y Horario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="session-date" className="text-xs font-semibold text-foreground">
                  Fecha de la cita
                </Label>
                <Input
                  id="session-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min="2026-09-22"
                  className="rounded-xl border-border bg-background text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="session-slot" className="text-xs font-semibold text-foreground">
                  Horario disponible
                </Label>
                <div className="relative">
                  <select
                    id="session-slot"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {TIME_SLOTS.map((slot) => {
                      const isOccupied = occupiedSlots.includes(slot);
                      return (
                        <option
                          key={slot}
                          value={slot}
                          disabled={isOccupied}
                          className={isOccupied ? "text-muted-foreground italic" : ""}
                        >
                          {slot} {isOccupied ? "— (Ocupado)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Tema de la sesión */}
            <div className="space-y-1.5">
              <Label htmlFor="session-topic" className="text-xs font-semibold text-foreground">
                Objetivo principal de la sesión
              </Label>
              <select
                id="session-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Observaciones privadas */}
            <div className="space-y-1.5">
              <Label htmlFor="session-notes" className="text-xs font-semibold text-foreground">
                Notas previas u observaciones (opcional)
              </Label>
              <Textarea
                id="session-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Revisar técnicas de higiene del sueño y seguimiento del examen de cálculo..."
                className="min-h-16 rounded-xl border-border bg-background text-xs"
              />
            </div>
          </div>

          <DialogFooter className="mt-5 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-teal text-white hover:bg-teal/90 gap-1.5"
            >
              <CheckCircle className="size-4" />
              <span>Confirmar y Agendar</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
