import { useState } from "react";
import { ShieldAlert, PhoneCall, AlertOctagon, CheckCircle2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { activateCrisisProtocol } from "@/lib/psychologist-store";
import type { CaseSummary } from "@/lib/types";

interface CrisisProtocolDialogProps {
  caseItem: CaseSummary | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CrisisProtocolDialog({
  caseItem,
  isOpen,
  onOpenChange,
  onSuccess,
}: CrisisProtocolDialogProps) {
  const [details, setDetails] = useState<string>(
    "Estudiante contactado en condición de angustia o riesgo alto. Se brinda contención inmediata y se vincula con redes institucionales y Línea de la Vida.",
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!caseItem) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      activateCrisisProtocol(caseItem.id, details, "Dra. Marta Gómez");
      toast.error("Protocolo de Emergencia Activado", {
        description: `Se registró en la bitácora clínica la activación del protocolo para ${caseItem.studentName || caseItem.initials}.`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar protocolo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-pink-200 dark:border-pink-800 bg-card">
        <form onSubmit={handleActivate}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-pink-400/15 text-pink-500">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-xl font-display text-pink-500 dark:text-pink-400">
                  Protocolo de Atención en Crisis — Caso {caseItem.initials}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Acciones prioritarias y registro de intervención urgente
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-4 text-sm">
            {/* Canales de apoyo directo */}
            <div className="rounded-2xl border border-pink-200 dark:border-pink-800/60 bg-pink-50/70 dark:bg-pink-950/20 p-4 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-300 flex items-center gap-1.5">
                <AlertOctagon className="size-3.5" />
                Líneas de canalización inmediata
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <a
                  href="tel:8009112000"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border hover:border-pink-300 transition-colors"
                >
                  <div>
                    <p className="font-bold text-foreground">Línea de la Vida</p>
                    <p className="text-[10px] text-muted-foreground">800 911 2000 (24h)</p>
                  </div>
                  <PhoneCall className="size-4 text-pink-500" />
                </a>

                <a
                  href="tel:5558290000"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border hover:border-pink-300 transition-colors"
                >
                  <div>
                    <p className="font-bold text-foreground">Servicio Médico TESH</p>
                    <p className="text-[10px] text-muted-foreground">Edificio A, Ext. 109</p>
                  </div>
                  <PhoneCall className="size-4 text-teal" />
                </a>
              </div>
            </div>

            {/* Bitácora de la intervención */}
            <div className="space-y-1.5">
              <Label htmlFor="crisis-details" className="text-xs font-semibold text-foreground">
                Detalles de las medidas tomadas y acuerdos de contención
              </Label>
              <Textarea
                id="crisis-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="rounded-xl border-border bg-background text-xs"
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
              className="rounded-xl bg-pink-500 text-white hover:bg-pink-600 gap-1.5"
            >
              <CheckCircle2 className="size-4" />
              <span>Registrar Activación Oficial</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
