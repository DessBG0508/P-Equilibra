import { useState, useEffect } from "react";
import { X, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { moods } from "@/lib/mock-data";
import { MoodIllustration } from "@/components/ui/mood-illustration";
import type { MoodId } from "@/lib/types";
import {
  MOOD_TO_INTERNAL_VALUE,
  INTERNAL_VALUE_TO_MOOD,
  displayedScoreToInternalValue,
  internalValueToDisplayedScore,
} from "@/lib/mood-store";

interface EditMoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMoodId: MoodId | null;
  onSave: (moodId: MoodId) => void;
}

const MOOD_DESCRIPTIONS: Record<MoodId, { label: string; detail: string; score: number }> = {
  "muy-bien": { label: "Feliz", detail: "Excelente ánimo y energía positiva", score: 5 },
  bien: { label: "Bien", detail: "Buen ánimo, tranquilo y con motivación", score: 4 },
  regular: { label: "Normal", detail: "Ánimo neutral o en calma", score: 3 },
  triste: { label: "Triste", detail: "Ánimo bajo o decaído", score: 2 },
  "muy-mal": { label: "Muy mal", detail: "Requiere apoyo y pausa contigo", score: 1 },
};

export function EditMoodModal({ isOpen, onClose, currentMoodId, onSave }: EditMoodModalProps) {
  const [selectedMood, setSelectedMood] = useState<MoodId>(currentMoodId || "regular");

  useEffect(() => {
    if (isOpen) {
      setSelectedMood(currentMoodId || "regular");
    }
  }, [isOpen, currentMoodId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentScore = internalValueToDisplayedScore(MOOD_TO_INTERNAL_VALUE[selectedMood]);
  const moodInfo = MOOD_DESCRIPTIONS[selectedMood];

  const handleScoreChange = (score: number) => {
    const internalVal = displayedScoreToInternalValue(score);
    const mappedMood = INTERNAL_VALUE_TO_MOOD[internalVal] || "regular";
    setSelectedMood(mappedMood);
  };

  const handleSave = () => {
    onSave(selectedMood);
    toast("Registro guardado");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mood-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-violet-950/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-border/70 bg-card p-6 sm:p-7 shadow-2xl text-card-foreground animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar esquina */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-5 right-5 rounded-full p-1.5 text-muted-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-2 mb-2">
          <div className="grid size-8 place-items-center rounded-xl bg-lavender-soft text-accent">
            <Brain className="size-4" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
            Bienestar Emocional
          </span>
        </div>

        <h3
          id="mood-modal-title"
          className="font-display italic text-2xl sm:text-3xl font-bold text-primary"
        >
          Editar estado de ánimo
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Ajusta tu registro de hoy para mantener al día tu indicador de bienestar y sincronizar el
          emocionómetro.
        </p>

        {/* Indicador grande central */}
        <div className="my-6 rounded-2xl bg-lavender-soft/40 border border-accent/20 py-4 px-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="size-12 shrink-0">
              <MoodIllustration moodId={selectedMood} />
            </div>
            <div className="text-left">
              <div className="flex items-baseline gap-1">
                <span className="font-numeric text-4xl sm:text-5xl font-bold italic text-primary">
                  {currentScore}.0
                </span>
                <span className="font-sans text-sm font-semibold text-muted-foreground">/ 5</span>
              </div>
              <p className="text-xs font-bold text-primary">{moodInfo.label}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{moodInfo.detail}</p>
        </div>

        {/* Emocionómetro en el modal */}
        <div className="space-y-2 mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Selecciona tu estado de hoy
          </p>
          <div className="grid grid-cols-5 gap-2">
            {moods.map((m) => {
              const active = selectedMood === m.id;
              const score = internalValueToDisplayedScore(MOOD_TO_INTERNAL_VALUE[m.id]);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  aria-pressed={active}
                  aria-label={`${m.label} (${score} de 5)`}
                  className={`group flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all ${
                    active
                      ? "bg-accent/10 ring-2 ring-accent shadow-xs scale-102"
                      : "border border-border/70 hover:bg-muted/50"
                  }`}
                >
                  <div className="size-8">
                    <MoodIllustration moodId={m.id} />
                  </div>
                  <span
                    className={`text-[10px] font-bold leading-tight ${
                      active ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </span>
                  <span className="text-[9px] font-semibold text-muted-foreground/75">
                    {score}/5
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider complementario de 1 a 5 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1">
            <span>1 (Requiere apoyo)</span>
            <span className="text-primary font-bold">{currentScore} / 5</span>
            <span>5 (Excelente ánimo)</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={currentScore}
            onChange={(e) => handleScoreChange(parseInt(e.target.value, 10))}
            className="w-full accent-violet-600 cursor-pointer h-2.5 rounded-lg bg-secondary/30 transition-all"
            aria-label="Selector de nivel de ánimo de 1 a 5"
          />
        </div>

        {/* Botones Cancelar y Guardar */}
        <div className="mt-7 flex items-center justify-end gap-3 pt-3 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6857E4] to-[#6857E4] px-6 py-2.5 text-xs font-bold text-white shadow-soft transition-all hover:opacity-95 active:scale-98"
          >
            <Sparkles className="size-3.5" />
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
