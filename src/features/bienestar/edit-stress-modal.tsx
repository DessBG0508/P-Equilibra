import { useState, useEffect } from "react";
import { X, CircleGauge } from "lucide-react";
import { toast } from "sonner";

interface EditStressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStress: number;
  onSave: (value: number) => void;
}

const STRESS_LEVELS = [
  { value: 1, label: "Muy bajo", description: "Calma total, sin presión percibida" },
  { value: 2, label: "Bajo", description: "Bajo control, ritmo manejable" },
  { value: 3, label: "Moderado", description: "Tensión común del día a día" },
  { value: 4, label: "Alto", description: "Sobrecarga o agobio notable" },
  { value: 5, label: "Muy alto", description: "Estrés intenso que requiere pausa" },
];

export function EditStressModal({ isOpen, onClose, currentStress, onSave }: EditStressModalProps) {
  const [tempStress, setTempStress] = useState<number>(currentStress);

  useEffect(() => {
    if (isOpen) {
      setTempStress(currentStress);
    }
  }, [isOpen, currentStress]);

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
    onSave(tempStress);
    toast.success(`Nivel de estrés actualizado a ${tempStress.toFixed(1)}/5`);
    onClose();
  };

  const currentLevelObj =
    STRESS_LEVELS.find((l) => Math.round(tempStress) === l.value) || STRESS_LEVELS[2];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stress-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-violet-950/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-border/70 bg-card p-6 sm:p-7 shadow-2xl text-card-foreground animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-5 right-5 rounded-full p-1.5 text-muted-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="grid size-11 place-items-center rounded-2xl bg-lavender-soft text-accent">
            <CircleGauge className="size-5" />
          </div>
          <div>
            <h2
              id="stress-modal-title"
              className="font-display text-xl sm:text-2xl font-bold text-primary"
            >
              Nivel de Estrés
            </h2>
            <p className="text-xs text-muted-foreground">Tu percepción de tensión hoy</p>
          </div>
        </div>

        {/* Display del valor seleccionado */}
        <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-center mb-6">
          <p className="font-numeric text-4xl font-bold italic text-primary">
            {tempStress.toFixed(1)}
            <span className="font-sans text-sm font-normal not-italic text-muted-foreground ml-1">
              / 5
            </span>
          </p>
          <p className="text-sm font-semibold text-accent mt-1">{currentLevelObj.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{currentLevelObj.description}</p>
        </div>

        {/* Botones de nivel 1 a 5 */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-semibold text-muted-foreground block">
            Selecciona tu nivel estimado:
          </label>
          <div className="grid grid-cols-5 gap-2">
            {STRESS_LEVELS.map((lvl) => {
              const isSelected = Math.round(tempStress) === lvl.value;
              return (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => setTempStress(lvl.value)}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-sm font-bold transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border/60 bg-card hover:bg-muted/70 text-foreground"
                  }`}
                >
                  <span>{lvl.value}</span>
                  <span className="text-[10px] font-normal truncate max-w-full px-0.5 opacity-80">
                    {lvl.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider para ajuste fino */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Calma (1.0)</span>
            <span>Sobrecarga (5.0)</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="0.2"
            value={tempStress}
            onChange={(e) => setTempStress(parseFloat(e.target.value))}
            className="w-full accent-primary cursor-pointer"
            aria-label="Ajustar nivel de estrés"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            Guardar estrés
          </button>
        </div>
      </div>
    </div>
  );
}
