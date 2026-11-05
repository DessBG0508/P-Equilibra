import { useState, useEffect } from "react";
import { PhoneCall, Mail, UserCheck, MessageSquare, CheckCircle } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordPatientContact } from "@/lib/psychologist-store";
import type { CaseSummary } from "@/lib/types";

interface ContactPatientDialogProps {
  caseItem: CaseSummary | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CHANNELS = [
  { id: "Llamada telefónica institucional", label: "Llamada institucional", icon: PhoneCall },
  { id: "Correo institucional @tesh.mx", label: "Correo oficial", icon: Mail },
  { id: "Presencial en cubículo de bienestar", label: "Presencial en cubículo", icon: UserCheck },
  { id: "Mensajería institucional segura", label: "Mensaje seguro", icon: MessageSquare },
];

const OUTCOMES = [
  "Contacto exitoso y estudiante receptivo",
  "Cita presencial acordada",
  "No contestó — Se enviará recordatorio por correo",
  "Requiere canalización a tutoría académica",
  "Atención de contención realizada satisfactoriamente",
];

export function ContactPatientDialog({
  caseItem,
  isOpen,
  onOpenChange,
  onSuccess,
}: ContactPatientDialogProps) {
  const [channel, setChannel] = useState<string>(CHANNELS[0]?.id ?? "llamada_telefonica");
  const [outcome, setOutcome] = useState<string>(
    OUTCOMES[0] ?? "Paciente contactado/a exitosamente",
  );
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setNotes("");
      setChannel(CHANNELS[0]?.id ?? "llamada_telefonica");
      setOutcome(OUTCOMES[0] ?? "Paciente contactado/a exitosamente");
    }
  }, [isOpen, caseItem]);

  if (!caseItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      recordPatientContact(caseItem.id, channel, outcome, notes, "Dra. Marta Gómez");

      toast.success("Contacto registrado en expediente", {
        description: `Se añadió el registro para ${caseItem.studentName || caseItem.initials} en la bitácora clínica.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo registrar el contacto.");
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
              <span className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent">
                <PhoneCall className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-xl font-display text-primary">
                  Registrar Contacto — {caseItem.initials}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {caseItem.studentName} ({caseItem.career || "TESH"})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-4 text-sm">
            {/* Canal utilizado */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Medio o canal de comunicación
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {CHANNELS.map(({ id, label, icon: Icon }) => {
                  const active = channel === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setChannel(id)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition-all ${
                        active
                          ? "border-accent bg-accent/10 font-semibold text-accent shadow-sm"
                          : "border-border/70 bg-card hover:bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resultado del contacto */}
            <div className="space-y-1.5">
              <Label htmlFor="contact-outcome" className="text-xs font-semibold text-foreground">
                Resultado de la intervención
              </Label>
              <select
                id="contact-outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Notas del contacto */}
            <div className="space-y-1.5">
              <Label htmlFor="contact-notes" className="text-xs font-semibold text-foreground">
                Resumen de la conversación y acuerdos
              </Label>
              <Textarea
                id="contact-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indica brevemente el estado anímico reportado por el alumno, acuerdos alcanzados o próximos pasos de acompañamiento..."
                className="min-h-24 rounded-xl border-border bg-background text-xs"
                required
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
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
            >
              <CheckCircle className="size-4" />
              <span>Guardar en Bitácora</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
