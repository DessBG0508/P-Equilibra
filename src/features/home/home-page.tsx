import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  BatteryMedium,
  BedDouble,
  Brain,
  CalendarHeart,
  CircleGauge,
  HeartPulse,
  Library,
  Sparkles,
  Wind,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MoodIllustration } from "@/components/ui/mood-illustration";
import { LiquidButton } from "@/components/effects/liquid-button";
import { TiltCard } from "@/components/effects/tilt-card";
import { PageShell } from "@/components/layout/page-shell";
import { WellbeingStatsGrid } from "@/features/bienestar/wellbeing-stats-grid";
import { moods } from "@/lib/mock-data";
import type { MoodId } from "@/lib/types";
import { BRAND } from "@/lib/branding";
import { useMoodStats, getTodayMoodCheckIn } from "@/lib/mood-store";
import { useAuth } from "@/lib/auth-context";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06, // 60ms stagger between cards
      delayChildren: 0.04,
    },
  },
};

const staggerCard = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 1, 0.5, 1],
    },
  },
};

const quickActions = [
  { title: "Check-in emocional", detail: "Tómate 2 min", icon: HeartPulse, tone: "bg-mint-soft" },
  {
    title: "Ejercicios de respiración",
    detail: "Respira y vuelve a ti",
    icon: Wind,
    tone: "bg-lavender-soft",
  },
  { title: "Recursos", detail: "Ideas para cuidarte", icon: Library, tone: "bg-cyan-soft" },
  { title: "Mis citas", detail: "Revisa tu agenda", icon: CalendarHeart, tone: "bg-green-soft" },
];
const statIcons = [Brain, BedDouble, CircleGauge, BatteryMedium];

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const nombre = user?.name ?? "Estudiante";
  const { todayMood, saveTodayMood } = useMoodStats();
  const [selectedMood, setSelectedMood] = useState<MoodId>(() => {
    const today = getTodayMoodCheckIn();
    return today ? today.moodId : "regular";
  });

  // Sincronía inversa: si se edita desde el panel de métricas o cambia hoy, actualizar el emocionómetro
  useEffect(() => {
    if (todayMood && todayMood !== selectedMood) {
      setSelectedMood(todayMood);
    }
  }, [todayMood, selectedMood]);

  const handleMoodSelect = (moodId: MoodId) => {
    setSelectedMood(moodId);
    saveTodayMood(moodId);
    toast("Registro guardado");
  };

  const shouldReduceMotion = useReducedMotion();

  const reducedVariants = {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 },
  };
  const activeContainerVariants = shouldReduceMotion ? reducedVariants : staggerContainer;
  const activeCardVariants = shouldReduceMotion ? reducedVariants : staggerCard;

  return (
    <PageShell>
      <main>
        <section className="mb-7 max-w-2xl animate-fade-in sm:mb-9">
          <p className="mb-1 text-sm font-semibold text-secondary">Sábado, 19 de septiembre</p>
          <h1 className="font-display text-4xl leading-tight text-primary sm:text-5xl">
            Hola, {nombre}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Qué bueno verte por aquí. Siempre es un buen momento para cuidar de ti.
          </p>
        </section>

        <motion.div
          variants={activeContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] lg:gap-7"
        >
          <div className="space-y-5 lg:space-y-7">
            {/* Tarjeta destacada de Eli — Asistente de apoyo emocional */}
            <motion.section
              variants={activeCardVariants}
              className="ethereal-card overflow-hidden p-5 sm:p-6 border-secondary/30 bg-card shadow-soft"
              aria-label={`Asistente ${BRAND.assistant}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar de Eli: Círculo con gradiente canónico (#1B198F a #6857E4) */}
                  <div className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-soft ring-2 ring-card">
                    <Sparkles className="size-6 text-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-cyan ring-2 ring-card" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-xl font-bold text-primary">
                        Habla con {BRAND.assistant}
                      </h2>
                      <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-[10px] font-bold text-cyan">
                        En línea
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      Tu asistente de apoyo emocional 24/7. Un espacio seguro y confidencial.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="rounded-2xl px-5 text-xs font-semibold shadow-soft transition-colors active:scale-95"
                >
                  <Link to="/chat">
                    <span>Conversar con {BRAND.assistant}</span>
                  </Link>
                </Button>
              </div>
            </motion.section>

            <motion.section
              variants={activeCardVariants}
              className="ethereal-card p-5 sm:p-7"
              aria-labelledby="mood-title"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase text-teal">Pausa contigo</p>
                  <h2 id="mood-title" className="font-display text-2xl text-primary sm:text-3xl">
                    ¿Cómo está tu cielo hoy?
                  </h2>
                </div>
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mint-soft text-teal">
                  <HeartPulse />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {moods.map((mood) => {
                  const active = selectedMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      aria-pressed={active}
                      aria-label={`Me siento ${mood.label.toLowerCase()}`}
                      onClick={() => handleMoodSelect(mood.id)}
                      className="group flex min-w-0 flex-col items-center gap-2 rounded-2xl py-1 focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/35"
                    >
                      <motion.span
                        animate={{ scale: active ? 1.12 : 1, y: active ? -3 : 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 18 }}
                        className={`mood-circle mood-${mood.tone} ${active ? "ring-4 ring-accent/20 shadow-float" : "shadow-soft"}`}
                      >
                        <MoodIllustration moodId={mood.id} />
                      </motion.span>
                      <span
                        className={`text-center text-[0.68rem] font-semibold leading-tight sm:text-xs ${active ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {mood.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            <motion.section variants={activeCardVariants} aria-labelledby="quick-title">
              <h2 id="quick-title" className="mb-4 font-display text-2xl text-primary">
                Para cuidar de ti
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {quickActions.map(({ title, detail, icon: Icon, tone }) =>
                  title === "Check-in emocional" ? (
                    <TiltCard key={title} className="h-full">
                      <Button
                        asChild
                        variant="outline"
                        className="ethereal-card group h-full w-full min-h-36 flex-col items-start justify-between whitespace-normal p-4 text-left sm:min-h-40 sm:p-5"
                      >
                        <Link to="/checkin">
                          <span
                            className={`grid size-11 place-items-center rounded-2xl ${tone} text-primary transition-transform group-hover:-rotate-3 group-hover:scale-105`}
                          >
                            <Icon />
                          </span>
                          <span>
                            <span className="block text-sm font-bold leading-snug text-primary sm:text-base">
                              {title}
                            </span>
                            <span className="mt-1 block text-xs font-medium text-muted-foreground">
                              {detail}
                            </span>
                          </span>
                        </Link>
                      </Button>
                    </TiltCard>
                  ) : title === "Ejercicios de respiración" || title === "Recursos" ? (
                    <TiltCard key={title} className="h-full">
                      <Button
                        asChild
                        variant="outline"
                        className="ethereal-card group h-full w-full min-h-36 flex-col items-start justify-between whitespace-normal p-4 text-left sm:min-h-40 sm:p-5"
                      >
                        <Link to="/recursos">
                          <span
                            className={`grid size-11 place-items-center rounded-2xl ${tone} text-primary transition-transform group-hover:-rotate-3 group-hover:scale-105`}
                          >
                            <Icon />
                          </span>
                          <span>
                            <span className="block text-sm font-bold leading-snug text-primary sm:text-base">
                              {title}
                            </span>
                            <span className="mt-1 block text-xs font-medium text-muted-foreground">
                              {detail}
                            </span>
                          </span>
                        </Link>
                      </Button>
                    </TiltCard>
                  ) : title === "Mis citas" ? (
                    <TiltCard key={title} className="h-full">
                      <Button
                        asChild
                        variant="outline"
                        className="ethereal-card group h-full w-full min-h-36 flex-col items-start justify-between whitespace-normal p-4 text-left sm:min-h-40 sm:p-5"
                      >
                        <Link to="/citas">
                          <span
                            className={`grid size-11 place-items-center rounded-2xl ${tone} text-primary transition-transform group-hover:-rotate-3 group-hover:scale-105`}
                          >
                            <Icon />
                          </span>
                          <span>
                            <span className="block text-sm font-bold leading-snug text-primary sm:text-base">
                              {title}
                            </span>
                            <span className="mt-1 block text-xs font-medium text-muted-foreground">
                              {detail}
                            </span>
                          </span>
                        </Link>
                      </Button>
                    </TiltCard>
                  ) : (
                    <TiltCard key={title} className="h-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toast("Próximamente")}
                        className="ethereal-card group h-full w-full min-h-36 flex-col items-start justify-between whitespace-normal p-4 text-left sm:min-h-40 sm:p-5"
                      >
                        <span
                          className={`grid size-11 place-items-center rounded-2xl ${tone} text-primary transition-transform group-hover:-rotate-3 group-hover:scale-105`}
                        >
                          <Icon />
                        </span>
                        <span>
                          <span className="block text-sm font-bold leading-snug text-primary sm:text-base">
                            {title}
                          </span>
                          <span className="mt-1 block text-xs font-medium text-muted-foreground">
                            {detail}
                          </span>
                        </span>
                      </Button>
                    </TiltCard>
                  ),
                )}
              </div>
            </motion.section>

            <motion.div variants={activeCardVariants}>
              <LiquidButton onClick={() => navigate({ to: "/citas" })}>
                Agendar cita con psicólogo
              </LiquidButton>
            </motion.div>
          </div>

          <motion.section
            variants={activeCardVariants}
            className="ethereal-card h-fit p-5 sm:p-7"
            aria-labelledby="stats-title"
          >
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase text-teal">Últimos 7 días</p>
                <h2 id="stats-title" className="font-display text-2xl text-primary sm:text-3xl">
                  Tu bienestar en números
                </h2>
              </div>
            </div>
            <WellbeingStatsGrid variant="home" />
            <p className="mt-5 rounded-2xl bg-mint-soft px-4 py-3 text-sm leading-relaxed text-primary/80">
              Tus días no tienen que ser perfectos para contar. Cada pausa también es un avance.
            </p>
          </motion.section>
        </motion.div>
      </main>
    </PageShell>
  );
}
