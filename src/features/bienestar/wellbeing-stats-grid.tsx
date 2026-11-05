import { useState } from "react";
import { motion } from "motion/react";
import { Brain, BedDouble, CircleGauge, BatteryMedium, Pencil } from "lucide-react";
import { useSleepHours } from "@/lib/sleep-store";
import { useMoodStats, MOOD_TO_INTERNAL_VALUE } from "@/lib/mood-store";
import { useStressLevel, useEnergyLevel } from "@/lib/wellbeing-store";
import {
  evaluateSleepRule,
  evaluateStressRule,
  evaluateEnergyRule,
  evaluateMoodRule,
  prioritizeSuggestion,
  type MetricSuggestion,
} from "@/lib/metric-rules";
import type { MoodId } from "@/lib/types";
import { EditSleepModal } from "./edit-sleep-modal";
import { EditMoodModal } from "./edit-mood-modal";
import { EditStressModal } from "./edit-stress-modal";
import { EditEnergyModal } from "./edit-energy-modal";
import { BreathingModal } from "./breathing-modal";
import { MetricSuggestionCard } from "./metric-suggestion-card";

interface WellbeingStatsGridProps {
  variant?: "home" | "profile";
  className?: string;
}

export function WellbeingStatsGrid({ variant = "home", className = "" }: WellbeingStatsGridProps) {
  const {
    hours: sleepHours,
    progress: sleepProgress,
    updateHours: saveSleepHours,
  } = useSleepHours();

  const {
    displayValue: moodDisplayValue,
    progress: moodProgress,
    todayMood,
    saveTodayMood,
  } = useMoodStats();

  const {
    stress: stressLevel,
    progress: stressProgress,
    updateStress: saveStressLevel,
  } = useStressLevel();

  const {
    energy: energyLevel,
    progress: energyProgress,
    updateEnergy: saveEnergyLevel,
  } = useEnergyLevel();

  // Modals state
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isStressModalOpen, setIsStressModalOpen] = useState(false);
  const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState(false);

  // Sugerencia no bloqueante de sesión (orientativa, prioriza avisos severos)
  const [activeSuggestion, setActiveSuggestion] = useState<MetricSuggestion | null>(null);

  const handleOpenEdit = (id: string) => {
    if (id === "animo") {
      setIsMoodModalOpen(true);
    } else if (id === "sueno") {
      setIsSleepModalOpen(true);
    } else if (id === "estres") {
      setIsStressModalOpen(true);
    } else if (id === "energia") {
      setIsEnergyModalOpen(true);
    }
  };

  const getEditAriaLabel = (id: string) => {
    switch (id) {
      case "animo":
        return "Editar estado de ánimo";
      case "sueno":
        return "Editar horas de sueño";
      case "estres":
        return "Editar nivel de estrés";
      case "energia":
        return "Editar nivel de energía";
      default:
        return "Editar métrica";
    }
  };

  const getEditTitle = (id: string) => {
    switch (id) {
      case "animo":
        return "Haz clic para editar el estado de ánimo";
      case "sueno":
        return "Haz clic para editar las horas de sueño";
      case "estres":
        return "Haz clic para editar el nivel de estrés";
      case "energia":
        return "Haz clic para editar el nivel de energía";
      default:
        return "Haz clic para editar";
    }
  };

  // Manejo de guardado con evaluación de reglas y priorización
  const handleSaveSleep = (newHours: number) => {
    saveSleepHours(newHours);
    const suggestion = evaluateSleepRule(newHours);
    if (suggestion) {
      setActiveSuggestion((prev) => prioritizeSuggestion(prev, suggestion));
    }
  };

  const handleSaveMood = (newMoodId: MoodId) => {
    saveTodayMood(newMoodId);
    const internalVal = MOOD_TO_INTERNAL_VALUE[newMoodId] || 3;
    const suggestion = evaluateMoodRule(internalVal);
    if (suggestion) {
      setActiveSuggestion((prev) => prioritizeSuggestion(prev, suggestion));
    }
  };

  const handleSaveStress = (newStress: number) => {
    saveStressLevel(newStress);
    const suggestion = evaluateStressRule(newStress);
    if (suggestion) {
      setActiveSuggestion((prev) => prioritizeSuggestion(prev, suggestion));
    }
  };

  const handleSaveEnergy = (newEnergy: number) => {
    saveEnergyLevel(newEnergy);
    const suggestion = evaluateEnergyRule(newEnergy);
    if (suggestion) {
      setActiveSuggestion((prev) => prioritizeSuggestion(prev, suggestion));
    }
  };

  // Las 4 métricas conectadas reactivamente y editables
  const stats = [
    {
      id: "animo",
      label: "Ánimo",
      value: moodDisplayValue,
      suffix: "/5",
      progress: moodProgress,
      icon: Brain,
      isEditable: true,
    },
    {
      id: "sueno",
      label: "Sueño",
      value: sleepHours.toFixed(1),
      suffix: "h",
      progress: sleepProgress,
      icon: BedDouble,
      isEditable: true,
    },
    {
      id: "estres",
      label: "Estrés",
      value: stressLevel.toFixed(1),
      suffix: "/5",
      progress: stressProgress,
      icon: CircleGauge,
      isEditable: true,
    },
    {
      id: "energia",
      label: "Energía",
      value: energyLevel.toFixed(1),
      suffix: "/5",
      progress: energyProgress,
      icon: BatteryMedium,
      isEditable: true,
    },
  ];

  if (variant === "profile") {
    return (
      <>
        <div className={`grid grid-cols-2 gap-2.5 sm:gap-3 ${className}`}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                onClick={() => handleOpenEdit(stat.id)}
                className="group relative rounded-xl border border-border/60 bg-card/65 p-3 transition-all hover:border-violet-300 hover:shadow-xs cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenEdit(stat.id);
                  }
                }}
                aria-label={getEditAriaLabel(stat.id)}
                title={getEditTitle(stat.id)}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">{stat.label}</span>
                  <div className="flex items-center gap-1">
                    <Icon className="size-3.5 text-accent" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(stat.id);
                      }}
                      aria-label={getEditAriaLabel(stat.id)}
                      className="rounded p-0.5 text-slate-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:text-violet-600"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>
                </div>
                <p className="font-numeric text-xl font-bold italic text-primary">
                  {stat.value}
                  <span className="ml-0.5 font-sans text-xs font-normal not-italic text-muted-foreground">
                    {stat.suffix}
                  </span>
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary/25">
                  <motion.div
                    key={`progress-${stat.id}-${stat.progress}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-teal"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sugerencia orientativa de sesión */}
        <MetricSuggestionCard
          suggestion={activeSuggestion}
          onDismiss={() => setActiveSuggestion(null)}
          onOpenBreathing={() => setIsBreathingModalOpen(true)}
        />

        {/* Modales de edición */}
        <EditSleepModal
          isOpen={isSleepModalOpen}
          onClose={() => setIsSleepModalOpen(false)}
          currentHours={sleepHours}
          onSave={handleSaveSleep}
        />

        <EditMoodModal
          isOpen={isMoodModalOpen}
          onClose={() => setIsMoodModalOpen(false)}
          currentMoodId={todayMood}
          onSave={handleSaveMood}
        />

        <EditStressModal
          isOpen={isStressModalOpen}
          onClose={() => setIsStressModalOpen(false)}
          currentStress={stressLevel}
          onSave={handleSaveStress}
        />

        <EditEnergyModal
          isOpen={isEnergyModalOpen}
          onClose={() => setIsEnergyModalOpen(false)}
          currentEnergy={energyLevel}
          onSave={handleSaveEnergy}
        />

        <BreathingModal
          isOpen={isBreathingModalOpen}
          onClose={() => setIsBreathingModalOpen(false)}
        />
      </>
    );
  }

  // Variant "home"
  return (
    <>
      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-1 ${className}`}>
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.id}
              onClick={() => handleOpenEdit(stat.id)}
              className="group relative rounded-2xl border border-border/60 bg-card/65 p-4 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-4 transition-all hover:border-violet-300 hover:shadow-xs cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOpenEdit(stat.id);
                }
              }}
              aria-label={getEditAriaLabel(stat.id)}
              title={getEditTitle(stat.id)}
            >
              {/* Botón lápiz en esquina superior derecha */}
              <div className="absolute top-3 right-3 lg:static lg:order-last">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(stat.id);
                  }}
                  aria-label={getEditAriaLabel(stat.id)}
                  className="rounded p-1 text-slate-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:text-violet-600 hover:bg-violet-50/70 dark:hover:bg-violet-950/40"
                >
                  <Pencil className="size-4" />
                </button>
              </div>

              <div className="mb-3 grid size-9 place-items-center rounded-xl bg-lavender-soft text-accent lg:mb-0">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary/25">
                  <motion.div
                    key={`home-progress-${stat.id}-${stat.progress}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-teal"
                  />
                </div>
              </div>
              <p className="mt-2 font-numeric text-2xl font-semibold italic text-primary lg:mt-0">
                {stat.value}
                <span className="ml-0.5 font-sans text-xs font-semibold not-italic text-muted-foreground">
                  {stat.suffix}
                </span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Sugerencia orientativa de sesión */}
      <MetricSuggestionCard
        suggestion={activeSuggestion}
        onDismiss={() => setActiveSuggestion(null)}
        onOpenBreathing={() => setIsBreathingModalOpen(true)}
      />

      {/* Modales de edición */}
      <EditSleepModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        currentHours={sleepHours}
        onSave={handleSaveSleep}
      />

      <EditMoodModal
        isOpen={isMoodModalOpen}
        onClose={() => setIsMoodModalOpen(false)}
        currentMoodId={todayMood}
        onSave={handleSaveMood}
      />

      <EditStressModal
        isOpen={isStressModalOpen}
        onClose={() => setIsStressModalOpen(false)}
        currentStress={stressLevel}
        onSave={handleSaveStress}
      />

      <EditEnergyModal
        isOpen={isEnergyModalOpen}
        onClose={() => setIsEnergyModalOpen(false)}
        currentEnergy={energyLevel}
        onSave={handleSaveEnergy}
      />

      <BreathingModal
        isOpen={isBreathingModalOpen}
        onClose={() => setIsBreathingModalOpen(false)}
      />
    </>
  );
}
