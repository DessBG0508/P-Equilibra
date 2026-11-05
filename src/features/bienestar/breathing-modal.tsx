import { useState, useEffect } from "react";
import { X, Wind, Play, Pause, RotateCcw } from "lucide-react";

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Phase = "inhale" | "hold" | "exhale";

export function BreathingModal({ isOpen, onClose }: BreathingModalProps) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [countdown, setCountdown] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsActive(true);
      setPhase("inhale");
      setCountdown(4);
      setCyclesCompleted(0);
    } else {
      setIsActive(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1;

        if (phase === "inhale") {
          setPhase("hold");
          return 7;
        } else if (phase === "hold") {
          setPhase("exhale");
          return 8;
        } else {
          setPhase("inhale");
          setCyclesCompleted((c) => c + 1);
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase]);

  if (!isOpen) return null;

  const phaseConfig = {
    inhale: {
      label: "Inhala suavemente por la nariz",
      duration: 4,
      tone: "text-teal",
      bg: "bg-teal/15",
    },
    hold: {
      label: "Sostén el aire con serenidad",
      duration: 7,
      tone: "text-accent",
      bg: "bg-accent/15",
    },
    exhale: {
      label: "Exhala despacio por la boca",
      duration: 8,
      tone: "text-teal-500",
      bg: "bg-teal-500/15",
    },
  }[phase];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="breathing-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-violet-950/50 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl text-card-foreground text-center animate-in zoom-in-95 duration-200"
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

        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-mint-soft text-teal">
          <Wind className="size-6 animate-pulse" />
        </div>

        <h2 id="breathing-modal-title" className="font-display text-2xl font-bold text-primary">
          Respiración 4-7-8
        </h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6">
          Una pausa de 2 minutos para relajar tu sistema nervioso
        </p>

        {/* Círculo animado */}
        <div className="relative mx-auto my-6 flex size-44 items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full transition-all duration-1000 ${phaseConfig.bg} ${
              phase === "inhale" ? "scale-100" : phase === "hold" ? "scale-105" : "scale-75"
            }`}
          />
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="font-numeric text-5xl font-bold text-primary italic">{countdown}</span>
            <span
              className={`text-xs font-semibold uppercase tracking-wider mt-1 ${phaseConfig.tone}`}
            >
              {phase === "inhale" ? "Inhala" : phase === "hold" ? "Sostén" : "Exhala"}
            </span>
          </div>
        </div>

        <p className="text-sm font-medium text-foreground min-h-10 flex items-center justify-center px-4">
          {phaseConfig.label}
        </p>

        <p className="text-xs text-muted-foreground mt-1">
          Ciclos completados: <span className="font-bold text-primary">{cyclesCompleted}</span>
        </p>

        {/* Controles de pausa / reinicio */}
        <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={() => setIsActive((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            {isActive ? (
              <>
                <Pause className="size-3.5" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="size-3.5" />
                <span>Reanudar</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase("inhale");
              setCountdown(4);
              setCyclesCompleted(0);
              setIsActive(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw className="size-3.5" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
