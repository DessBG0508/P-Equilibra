import { useNavigate } from "@tanstack/react-router";
import { X, Sparkles, Wind, BookOpen, MessageSquareHeart } from "lucide-react";
import type { MetricSuggestion } from "@/lib/metric-rules";

interface MetricSuggestionCardProps {
  suggestion: MetricSuggestion | null;
  onDismiss: () => void;
  onOpenBreathing: () => void;
}

export function MetricSuggestionCard({
  suggestion,
  onDismiss,
  onOpenBreathing,
}: MetricSuggestionCardProps) {
  const navigate = useNavigate();

  if (!suggestion) return null;

  const handleAction = (type?: MetricSuggestion["actionType"]) => {
    if (type === "respiracion-478") {
      onOpenBreathing();
      return;
    }

    if (type === "recursos-sueno") {
      try {
        sessionStorage.setItem("equilibra_recursos_category", "Sueño");
      } catch {
        // ignore
      }
      navigate({ to: "/recursos" });
      onDismiss();
      return;
    }

    if (type === "recursos-y-psicologo") {
      navigate({ to: "/recursos" });
      onDismiss();
      return;
    }
  };

  const handleSecondaryAction = () => {
    navigate({ to: "/citas" });
    onDismiss();
  };

  const isReinforcement = suggestion.level === "optimo";

  return (
    <aside
      aria-label="Sugerencia de bienestar"
      className="relative mt-4 overflow-hidden rounded-2xl border border-teal/30 bg-mint-soft/30 dark:bg-teal/10 p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      {/* Botón cerrar X */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar sugerencia"
        className="absolute top-3 right-3 rounded-full p-1 text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        <X className="size-3.5" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-lavender-soft text-accent">
          {suggestion.actionType === "respiracion-478" ? (
            <Wind className="size-4" />
          ) : isReinforcement ? (
            <Sparkles className="size-4" />
          ) : (
            <BookOpen className="size-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-teal">
            {isReinforcement ? "Pausa Positiva" : "Sugerencia orientativa"}
          </p>
          <p className="mt-0.5 text-xs sm:text-sm font-medium leading-relaxed text-foreground">
            {suggestion.message}
          </p>

          {/* Botones de acción según el tipo de sugerencia */}
          {suggestion.actionType && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {suggestion.primaryActionLabel && (
                <button
                  type="button"
                  onClick={() => handleAction(suggestion.actionType)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90 transition-opacity"
                >
                  {suggestion.actionType === "respiracion-478" && <Wind className="size-3" />}
                  {suggestion.actionType === "recursos-sueno" && <BookOpen className="size-3" />}
                  {suggestion.actionType === "recursos-y-psicologo" && (
                    <BookOpen className="size-3" />
                  )}
                  <span>{suggestion.primaryActionLabel}</span>
                </button>
              )}

              {suggestion.secondaryActionLabel && (
                <button
                  type="button"
                  onClick={handleSecondaryAction}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <MessageSquareHeart className="size-3 text-accent" />
                  <span>{suggestion.secondaryActionLabel}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
