import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { saveCheckIn, triggerRedAlert } from "@/lib/api-client";
import { recordCheckInSuccess } from "@/lib/streak-store";
import { DEMO_MODE } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { mapCheckInRiskRD02 } from "@/lib/metric-rules";
import type { CheckIn, RiskLevel } from "@/lib/types";

const SCALE_VALUES = [1, 2, 3, 4, 5] as const;
const EMOTIONS = ["Tranquila", "Estrés leve", "Buen sueño", "Ansiedad", "Insomnio", "Ánimo bajo"];

export function CheckInPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [academicLoad, setAcademicLoad] = useState<CheckIn["academicLoad"] | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");
  const [needsSupport, setNeedsSupport] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (status !== "success") return;
    const timer = window.setTimeout(() => navigate({ to: "/" }), needsSupport ? 5200 : 3200);
    return () => window.clearTimeout(timer);
  }, [navigate, needsSupport, status]);

  const toggleEmotion = (emotion: string) => {
    setEmotions((current) =>
      current.includes(emotion)
        ? current.filter((item) => item !== emotion)
        : [...current, emotion],
    );
  };

  const handleSave = async () => {
    if (academicLoad === null) {
      setValidationMessage("Elige un número para contarnos cómo se sintió tu semana.");
      return;
    }

    setValidationMessage("");
    setStatus("saving");
    const riskLevel: RiskLevel = mapCheckInRiskRD02(academicLoad);

    const activeUserId = user?.id;
    const checkIn: CheckIn = {
      id: crypto.randomUUID(),
      studentId: activeUserId || (DEMO_MODE ? "demo-student-dess" : ""),
      academicLoad,
      emotions,
      createdAt: new Date().toISOString(),
      riskLevel,
    };

    try {
      const savedCheckIn = await saveCheckIn(checkIn, activeUserId);
      recordCheckInSuccess();
      const shouldOfferSupport = DEMO_MODE && riskLevel === "rojo";
      if (shouldOfferSupport) {
        await triggerRedAlert(savedCheckIn.id, activeUserId);
        await navigate({ to: "/alerta" });
        return;
      }
      setNeedsSupport(shouldOfferSupport);
      setStatus("success");
    } catch (err: unknown) {
      setStatus("idle");
      const errorMsg =
        err instanceof Error
          ? err.message
          : "No pudimos guardar tu check-in. Inténtalo de nuevo en un momento.";
      setValidationMessage(errorMsg);
    }
  };

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl pb-6">
        <header className="mb-6 sm:mb-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Volver al inicio"
            onClick={() => navigate({ to: "/" })}
            className="mb-4 bg-card/60"
          >
            <ArrowLeft />
          </Button>
          <p className="mb-1 text-xs font-bold uppercase text-teal">Un momento para ti</p>
          <h1 className="font-display text-4xl leading-tight text-primary sm:text-5xl">
            Check-in emocional
          </h1>
          <p className="mt-2 font-medium text-muted-foreground">
            Semana del 15 al 19 de septiembre
          </p>
        </header>

        <section className="ethereal-card p-5 sm:p-8" aria-labelledby="load-question">
          <div className="mb-7 flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lavender-soft text-accent">
              <Sparkles aria-hidden="true" />
            </div>
            <div>
              <h2
                id="load-question"
                className="font-display text-2xl leading-snug text-primary sm:text-3xl"
              >
                ¿Qué tan cargada sentiste esta semana académica?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Elige el número que más se acerque a tu experiencia.
              </p>
            </div>
          </div>

          <fieldset>
            <legend className="sr-only">Carga académica del 1 al 5</legend>
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {SCALE_VALUES.map((value) => {
                const selected = academicLoad === value;
                return (
                  <motion.div
                    key={value}
                    animate={{ scale: selected ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      aria-pressed={selected}
                      aria-label={`Carga académica ${value} de 5`}
                      onClick={() => setAcademicLoad(value)}
                      className={`size-12 rounded-full p-0 text-base shadow-none sm:size-14 ${selected ? "border-accent bg-accent text-accent-foreground hover:bg-accent" : "border-secondary/70 bg-card/70 text-primary hover:bg-lavender-soft"}`}
                    >
                      {value}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Ligera</span>
              <span>Muy cargada</span>
            </div>
          </fieldset>

          <div className="my-7 h-px bg-border/70" />

          <fieldset>
            <legend className="font-display text-xl text-primary sm:text-2xl">
              ¿Qué estuvo presente en tus días?
            </legend>
            <p className="mt-1 text-sm text-muted-foreground">
              Puedes elegir todas las opciones que necesites.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {EMOTIONS.map((emotion) => (
                <SelectableChip
                  key={emotion}
                  label={emotion}
                  selected={emotions.includes(emotion)}
                  onToggle={() => toggleEmotion(emotion)}
                />
              ))}
            </div>
          </fieldset>

          {validationMessage && (
            <p
              role="alert"
              className="mt-5 rounded-2xl bg-lavender-soft px-4 py-3 text-sm font-medium text-primary"
            >
              {validationMessage}
            </p>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              size="lg"
              onClick={handleSave}
              disabled={status === "saving"}
              className="bg-accent hover:bg-accent/90"
            >
              <ShieldCheck aria-hidden="true" />
              {status === "saving" ? "Guardando…" : "Guardar check-in"}
            </Button>
            <Button type="button" size="lg" variant="outline">
              <HeartHandshake aria-hidden="true" />
              Hablar con un psicólogo
            </Button>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {status === "success" && (
          <motion.div
            className="fixed inset-0 z-70 grid place-items-center bg-primary/20 px-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-7 text-center shadow-float sm:p-9"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.12, stiffness: 360, damping: 16 }}
                className="mx-auto grid size-16 place-items-center rounded-full bg-mint-soft text-teal"
              >
                <Check className="size-8" strokeWidth={3} aria-hidden="true" />
              </motion.div>
              <h2 id="success-title" className="mt-5 font-display text-3xl text-primary">
                Gracias por escucharte
              </h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Tu check-in quedó guardado. Reconocer cómo te sientes también es una forma de
                cuidarte.
              </p>
              {needsSupport && (
                <div className="mt-5 rounded-2xl bg-mint-soft p-4 text-left">
                  <p className="font-semibold text-primary">Estamos aquí para acompañarte.</p>
                  <p className="mt-1 text-sm leading-relaxed text-primary/75">
                    Notamos que esta semana pudo sentirse pesada. Muy pronto podrás ver opciones de
                    apoyo inmediato desde aquí.
                  </p>
                </div>
              )}
              <Button type="button" className="mt-6 w-full" onClick={() => navigate({ to: "/" })}>
                Volver al inicio
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Volverás al inicio en unos segundos.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
