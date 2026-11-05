import { useState, useEffect } from "react";
import { X, Moon } from "lucide-react";
import { toast } from "sonner";

interface EditSleepModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHours: number;
  onSave: (hours: number) => void;
}

const SHORTCUT_HOURS = [4, 5, 6, 7, 8];

export function EditSleepModal({ isOpen, onClose, currentHours, onSave }: EditSleepModalProps) {
  const [tempHours, setTempHours] = useState<number>(currentHours);

  useEffect(() => {
    if (isOpen) {
      setTempHours(currentHours);
    }
  }, [isOpen, currentHours]);

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

  const handleSave = () => {
    onSave(tempHours);
    toast.success(`Horas de sueño actualizadas a ${tempHours.toFixed(1)} h`);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sleep-modal-title"
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
          <div className="grid size-8 place-items-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
            <Moon className="size-4" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
            Descanso y Recuperación
          </span>
        </div>

        <h3
          id="sleep-modal-title"
          className="font-display italic text-2xl sm:text-3xl font-bold text-primary"
        >
          Editar horas de sueño
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Ajusta tu promedio de descanso reciente para registrar tu evolución de bienestar al día.
        </p>

        {/* Número de horas grande en el centro con actualización en vivo */}
        <div className="my-7 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 py-5 text-center">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="font-numeric text-5xl sm:text-6xl font-bold italic text-primary">
              {tempHours.toFixed(1)}
            </span>
            <span className="font-sans text-base sm:text-lg font-semibold text-muted-foreground">
              horas
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Meta diaria recomendada: 7.0 a 9.0 horas
          </p>
        </div>

        {/* Slider de 0 a 12 horas con pasos de 0.5 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1">
            <span>0 h</span>
            <span className="text-primary font-bold">{tempHours.toFixed(1)} h</span>
            <span>12 h</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={tempHours}
            onChange={(e) => setTempHours(parseFloat(e.target.value))}
            className="w-full accent-violet-600 cursor-pointer h-2.5 rounded-lg bg-secondary/30 transition-all"
            aria-label="Selector de horas de sueño de 0 a 12 horas"
          />
        </div>

        {/* Atajos rápidos: 4, 5, 6, 7 y 8 horas */}
        <div className="mt-6 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Atajos rápidos
          </p>
          <div className="grid grid-cols-5 gap-2">
            {SHORTCUT_HOURS.map((h) => {
              const isSelected = tempHours === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTempHours(h)}
                  className={`rounded-xl py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-violet-600 text-white shadow-xs scale-102"
                      : "border border-border/80 bg-muted/40 text-slate-600 hover:bg-muted hover:text-foreground dark:text-slate-300"
                  }`}
                >
                  {h} h
                </button>
              );
            })}
          </div>
        </div>

        {/* Botones Cancelar y Guardar */}
        <div className="mt-8 flex items-center justify-end gap-3 pt-3 border-t border-border/50">
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
            className="rounded-full bg-gradient-to-r from-[#6857E4] to-[#6857E4] px-6 py-2.5 text-xs font-bold text-white shadow-soft transition-all hover:opacity-95 active:scale-98"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
