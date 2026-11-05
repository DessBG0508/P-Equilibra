import { useState, useEffect } from "react";
import {
  CalendarPlus,
  PhoneCall,
  ShieldAlert,
  PlusCircle,
  Clock,
  User,
  GraduationCap,
  Sparkles,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExpedienteClinico } from "./ExpedienteClinico";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getCaseNotes,
  addClinicalNote,
  updateCaseRisk,
  updateCaseStatus,
} from "@/lib/psychologist-store";
import type { CaseSummary, RiskLevel, CaseStatus, ClinicalNote } from "@/lib/types";

interface CaseDetailSheetProps {
  item: CaseSummary | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (item: CaseSummary) => void;
  onContact: (item: CaseSummary) => void;
  onCrisis: (item: CaseSummary) => void;
  onCaseUpdated?: () => void;
}

const riskStyles: Record<RiskLevel, { label: string; dot: string; surface: string }> = {
  rojo: {
    label: "Riesgo alto",
    dot: "bg-pink-400",
    surface: "bg-pink-50 text-pink-700 border-pink-200",
  },
  amarillo: {
    label: "Seguimiento",
    dot: "bg-lime-500",
    surface: "bg-lime-50 text-lime-800 border-lime-200",
  },
  verde: {
    label: "Estable",
    dot: "bg-teal-500",
    surface: "bg-teal-50 text-teal-800 border-teal-200",
  },
};

const statusLabels: Record<CaseStatus, { label: string; color: string }> = {
  por_contactar: { label: "Por contactar", color: "bg-lime-100 text-lime-800" },
  en_seguimiento: { label: "En seguimiento", color: "bg-violet-100 text-violet-800" },
  cita_programada: { label: "Cita programada", color: "bg-teal/15 text-teal font-semibold" },
  atendido: { label: "Atendido / Estable", color: "bg-teal-100 text-teal-800" },
};

export function CaseDetailSheet({
  item,
  isOpen,
  onOpenChange,
  onSchedule,
  onContact,
  onCrisis,
  onCaseUpdated,
}: CaseDetailSheetProps) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<ClinicalNote["category"]>("seguimiento");
  const [currentRisk, setCurrentRisk] = useState<RiskLevel>(item?.riskLevel || "verde");
  const [currentStatus, setCurrentStatus] = useState<CaseStatus>(item?.status || "por_contactar");
  const [openExpedienteOficial, setOpenExpedienteOficial] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setCurrentRisk(item.riskLevel);
      setCurrentStatus(item.status || "por_contactar");
      setNotes(getCaseNotes(item.id));
    }
  }, [item, isOpen]);

  if (!item) return null;

  const style = riskStyles[currentRisk];
  const statusInfo = statusLabels[currentStatus] || statusLabels.por_contactar;

  const handleRiskChange = (newRisk: RiskLevel) => {
    setCurrentRisk(newRisk);
    updateCaseRisk(item.id, newRisk, currentStatus);
    toast.success(`Nivel de riesgo actualizado a ${riskStyles[newRisk].label}`);
    onCaseUpdated?.();
  };

  const handleStatusChange = (newStatus: CaseStatus) => {
    setCurrentStatus(newStatus);
    updateCaseStatus(item.id, newStatus);
    toast.success(`Estado actualizado a ${statusLabels[newStatus].label}`);
    onCaseUpdated?.();
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const added = addClinicalNote({
      caseId: item.id,
      author: "Dra. Marta Gómez",
      title:
        newNoteCategory === "sesion"
          ? "Nota de sesión psicológica"
          : newNoteCategory === "emergencia"
            ? "Intervención prioritaria"
            : newNoteCategory === "contacto"
              ? "Registro de contacto"
              : "Nota de seguimiento clínico",
      category: newNoteCategory,
      content: newNoteContent.trim(),
    });

    setNotes([added, ...notes]);
    setNewNoteContent("");
    toast.success("Nota añadida al expediente confidencial");
    onCaseUpdated?.();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto border-border bg-card p-6 sm:p-8"
      >
        <SheetHeader className="text-left pb-4 border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal">
                Expediente Estudiantil
              </p>
              <SheetTitle className="font-display text-2xl sm:text-3xl text-primary mt-0.5">
                {item.studentName || `Caso ${item.initials}`}
              </SheetTitle>
            </div>
            <div className="grid size-12 place-items-center rounded-2xl bg-lavender-soft font-bold text-primary text-lg">
              {item.initials}
            </div>
          </div>

          <SheetDescription className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <GraduationCap className="size-3.5" />
              {item.career || "Comunidad TESH"}
            </span>
            {item.semester && <span>• {item.semester}</span>}
          </SheetDescription>
        </SheetHeader>

        {/* Estado y Riesgo Actual */}
        <div className="mt-5 p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Nivel de Riesgo</p>
              <div className="flex items-center gap-1.5 mt-1">
                {(["rojo", "amarillo", "verde"] as RiskLevel[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRiskChange(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      currentRisk === r
                        ? `${riskStyles[r].surface} font-bold shadow-sm ring-1 ring-primary/20`
                        : "bg-card text-muted-foreground border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`inline-block size-2 rounded-full mr-1.5 ${riskStyles[r].dot}`}
                    />
                    {riskStyles[r].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Estado del Caso</p>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
                className="mt-1 rounded-lg border border-input bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="por_contactar">Por contactar</option>
                <option value="en_seguimiento">En seguimiento</option>
                <option value="cita_programada">Cita programada</option>
                <option value="atendido">Atendido / Estable</option>
              </select>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Directas */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Button
            type="button"
            onClick={() => onSchedule(item)}
            className="rounded-xl bg-teal text-white hover:bg-teal/90 gap-1.5 text-xs h-10"
          >
            <CalendarPlus className="size-4" />
            <span>Agendar Cita</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onContact(item)}
            className="rounded-xl border-accent text-accent hover:bg-accent/10 gap-1.5 text-xs h-10 font-semibold"
          >
            <PhoneCall className="size-4" />
            <span>Registrar Contacto</span>
          </Button>

          {currentRisk === "rojo" ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => onCrisis(item)}
              className="rounded-xl col-span-2 sm:col-span-1 gap-1.5 text-xs h-10 font-bold shadow-sm"
            >
              <ShieldAlert className="size-4" />
              <span>Protocolo Crisis</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onCrisis(item)}
              className="rounded-xl col-span-2 sm:col-span-1 gap-1.5 text-xs h-10 text-muted-foreground hover:text-foreground"
            >
              <AlertTriangle className="size-4" />
              <span>Protocolo</span>
            </Button>
          )}
        </div>

        {/* Botón para abrir el Expediente Clínico Oficial de 5 páginas */}
        <div className="mt-4">
          <Button
            type="button"
            onClick={() => setOpenExpedienteOficial(true)}
            className="w-full rounded-2xl bg-[#1B198F] text-white hover:bg-[#1B198F] font-bold text-xs h-11 gap-2 shadow-xs transition-all"
          >
            <FileText className="size-4 text-violet-200" />
            <span>Abrir Expediente Clínico Oficial (5 Páginas)</span>
          </Button>
        </div>

        {/* Resumen del estudiante */}
        <div className="mt-6 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Motivo / Reporte en Check-in
          </p>
          <div className="rounded-2xl bg-lavender-soft/60 p-4 border border-accent/15">
            <p className="text-sm font-medium text-foreground leading-relaxed">{item.summary}</p>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {item.accompanimentSummary}
            </p>
            <p className="mt-3 text-[11px] font-semibold text-accent flex items-center gap-1">
              <Clock className="size-3" />
              Último check-in: {item.lastCheckIn}
            </p>
          </div>
        </div>

        {/* Puntajes de tamizaje */}
        <div className="mt-6 rounded-2xl bg-muted/40 p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Puntajes de Tamizaje Psicométrico
            </p>
            <span className="text-[10px] text-muted-foreground font-medium">
              Orientativo, no diagnóstico
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-card p-3 shadow-soft border border-border/50">
              <p className="text-[11px] font-bold text-muted-foreground">PHQ-9 (Depresión)</p>
              <p className="mt-1 font-numeric text-2xl font-bold text-primary">
                {item.phq9}
                <span className="font-sans text-xs font-normal text-muted-foreground">/27</span>
              </p>
              <p className="text-[10px] text-accent font-medium mt-1">
                {item.phq9 >= 15
                  ? "Severidad moderada-alta"
                  : item.phq9 >= 10
                    ? "Sintomatología moderada"
                    : "Leve o mínima"}
              </p>
            </div>

            <div className="rounded-xl bg-card p-3 shadow-soft border border-border/50">
              <p className="text-[11px] font-bold text-muted-foreground">GAD-7 (Ansiedad)</p>
              <p className="mt-1 font-numeric text-2xl font-bold text-primary">
                {item.gad7}
                <span className="font-sans text-xs font-normal text-muted-foreground">/21</span>
              </p>
              <p className="text-[10px] text-accent font-medium mt-1">
                {item.gad7 >= 15
                  ? "Ansiedad severa"
                  : item.gad7 >= 10
                    ? "Ansiedad moderada"
                    : "Ansiedad leve"}
              </p>
            </div>
          </div>
        </div>

        {/* Bitácora Clínica y Notas */}
        <section className="mt-7 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <FileText className="size-4 text-teal" />
              <h3 className="text-sm font-bold text-primary">
                Bitácora de Notas Clínicas ({notes.length})
              </h3>
            </div>
            <span className="text-[10px] text-muted-foreground">Confidencial</span>
          </div>

          {/* Formulario para nueva nota */}
          <form
            onSubmit={handleAddNote}
            className="rounded-2xl border border-border bg-card p-3.5 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="note-text" className="text-xs font-semibold text-foreground">
                Agregar nota de evolución
              </Label>
              <select
                value={newNoteCategory}
                onChange={(e) => setNewNoteCategory(e.target.value as ClinicalNote["category"])}
                className="rounded-lg border border-input bg-background px-2 py-0.5 text-[11px] text-foreground"
              >
                <option value="seguimiento">Seguimiento</option>
                <option value="sesion">Sesión</option>
                <option value="contacto">Contacto</option>
                <option value="emergencia">Emergencia</option>
              </select>
            </div>

            <Textarea
              id="note-text"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Escribe observaciones clínicas, acuerdos de la sesión o recomendaciones dadas..."
              className="min-h-16 rounded-xl border-border bg-background text-xs"
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!newNoteContent.trim()}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 text-xs h-8 gap-1"
              >
                <PlusCircle className="size-3.5" />
                <span>Guardar Nota</span>
              </Button>
            </div>
          </form>

          {/* Historial de Notas */}
          <div className="mt-4 space-y-2.5">
            {notes.length === 0 ? (
              <p className="text-center py-6 text-xs text-muted-foreground">
                No hay notas clínicas registradas todavía para este estudiante.
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-border/70 bg-card p-3 text-xs space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground">{note.title}</span>
                    <span className="text-[10px] text-muted-foreground">{note.date}</span>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {note.content}
                  </p>
                  <p className="text-[10px] font-semibold text-teal pt-1">Por: {note.author}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </SheetContent>

      {/* Modal del Expediente Clínico Oficial de 5 Páginas */}
      <Dialog open={openExpedienteOficial} onOpenChange={setOpenExpedienteOficial}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-2 sm:p-4 sm:rounded-3xl border-[#C3B3F1] bg-card">
          <DialogHeader className="px-4 pt-2">
            <DialogTitle className="sr-only">
              Expediente Clínico Oficial de {item?.studentName || item?.initials}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formato clínico oficial de 5 páginas de historia clínica, tamizajes y seguimiento
            </DialogDescription>
          </DialogHeader>
          {item && (
            <ExpedienteClinico
              folio={item.matricula || `EQ-${item.id.slice(0, 4)}`}
              onClose={() => setOpenExpedienteOficial(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
