import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Flame,
  Trophy,
  CalendarCheck,
  Zap,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getStreakData,
  recordCheckInSuccess,
  resetDemoStreak,
  type StreakData,
} from "@/lib/streak-store";

export function WellbeingStreakCard() {
  const [streak, setStreak] = useState<StreakData>(getStreakData());

  useEffect(() => {
    setStreak(getStreakData());
  }, []);

  const handleSimulateCheckIn = () => {
    const updated = recordCheckInSuccess();
    setStreak(updated);
    toast.success("¡Check-in registrado!", {
      description: `¡Felicidades! Tu racha aumentó a ${updated.currentStreak} días seguidos.`,
    });
  };

  const handleResetStreak = () => {
    const reset = resetDemoStreak();
    setStreak(reset);
    toast.info("Racha restablecida para prueba.");
  };

  // Cálculo de la próxima meta de racha
  const nextMilestone =
    streak.currentStreak < 7
      ? 7
      : streak.currentStreak < 14
        ? 14
        : streak.currentStreak < 30
          ? 30
          : streak.currentStreak + 10;
  const progressPercent = Math.min(100, Math.round((streak.currentStreak / nextMilestone) * 100));

  return (
    <section
      className="ethereal-card relative overflow-hidden p-6 sm:p-7"
      aria-labelledby="streak-heading"
    >
      {/* Luz ambiental sutil en la esquina superior */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-gradient-to-br from-lime-500/10 via-[#6857E4]/5 to-transparent blur-2xl"
        aria-hidden="true"
      />

      {/* Encabezado del componente */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-tr from-lime-500 to-[#6857E4] text-white shadow-soft">
            <Flame className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lime-600 dark:text-lime-400">
                Constancia en Autocuidado
              </span>
              <Badge
                variant="outline"
                className="border-lime-500/30 bg-lime-500/10 px-2 py-0 text-[10px] font-bold text-lime-700 dark:text-lime-300"
              >
                Racha Activa
              </Badge>
            </div>
            <h2
              id="streak-heading"
              className="font-display text-xl font-bold text-primary sm:text-2xl"
            >
              Racha de Check-in Emocional
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetStreak}
          title="Reiniciar racha de prueba"
          className="text-muted-foreground hover:text-foreground text-[11px] font-medium flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="size-3" />
          <span className="hidden sm:inline">Restablecer demo</span>
        </button>
      </div>

      {/* Contador principal de la racha */}
      <div className="mt-5 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-lime-500/25 bg-gradient-to-b from-lime-500/10 to-transparent p-5 text-center sm:min-w-[170px]">
          <div className="flex items-baseline gap-1">
            <span className="font-numeric text-5xl font-extrabold italic tracking-tight text-lime-600 dark:text-lime-400 sm:text-6xl">
              {streak.currentStreak}
            </span>
            <span className="text-sm font-bold uppercase text-lime-700/80 dark:text-lime-300/80">
              días
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-foreground">Consecutivos cuidándote</p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Zap className="size-3 text-lime-500" />
            <span>Ritmo constante</span>
          </div>
        </div>

        <div className="space-y-3.5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Completar tu check-in diario fortalece tu autoconciencia emocional y te permite notar
            cambios en tu nivel de estrés antes de que se vuelva abrumador.
          </p>

          {/* Barra de progreso al próximo hito */}
          <div className="space-y-1.5 rounded-xl bg-card/60 p-3 border border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-lime-500" />
                <span>Próxima meta: {nextMilestone} días seguidos</span>
              </span>
              <span className="font-bold text-lime-600 dark:text-lime-400">
                {streak.currentStreak}/{nextMilestone} ({progressPercent}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-lime-500 to-[#6857E4]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visualizador de la semana actual (Lunes a Domingo) */}
      <div className="mt-6 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Progreso de esta semana
        </p>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {streak.weekDays.map((day) => {
            return (
              <div
                key={day.dayKey + day.dateStr}
                className={`flex flex-col items-center justify-between rounded-xl border p-2 sm:p-3 transition-all ${
                  day.completed
                    ? "border-lime-500/40 bg-gradient-to-b from-lime-500/15 to-lime-500/5 shadow-xs"
                    : day.isToday
                      ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
                      : "border-border/60 bg-card/40 opacity-70"
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  {day.label}
                </span>

                <div className="my-1.5 grid size-7 place-items-center rounded-full sm:size-8">
                  {day.completed ? (
                    <div className="grid size-6 place-items-center rounded-full bg-lime-500 text-white shadow-soft">
                      <Check className="size-3.5" strokeWidth={3} />
                    </div>
                  ) : day.isToday ? (
                    <div className="grid size-6 place-items-center rounded-full border-2 border-dashed border-primary text-primary">
                      <Flame className="size-3.5" />
                    </div>
                  ) : (
                    <div className="size-2 rounded-full bg-border" />
                  )}
                </div>

                <span
                  className={`text-[9px] font-bold ${
                    day.completed
                      ? "text-lime-600 dark:text-lime-400"
                      : day.isToday
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                >
                  {day.completed ? "Listo" : day.isToday ? "Hoy" : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estadísticas de consistencia y acciones */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <div className="rounded-xl border border-border/60 bg-card/65 p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold">Racha récord</span>
            <Trophy className="size-3.5 text-lime-500" />
          </div>
          <p className="font-numeric text-xl font-bold text-primary">
            {streak.longestStreak}{" "}
            <span className="text-xs font-normal text-muted-foreground">días</span>
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/65 p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold">Total registros</span>
            <CalendarCheck className="size-3.5 text-teal" />
          </div>
          <p className="font-numeric text-xl font-bold text-primary">
            {streak.totalCheckIns}{" "}
            <span className="text-xs font-normal text-muted-foreground">check-ins</span>
          </p>
        </div>

        <div className="col-span-2 rounded-xl border border-border/60 bg-card/65 p-3 sm:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold">Estado de hoy</span>
            <ShieldCheck className="size-3.5 text-teal-500" />
          </div>
          <p className="text-xs font-bold text-teal-600 dark:text-teal-400">
            {streak.hasCheckedInToday ? "Racha protegida" : "Pendiente de registro"}
          </p>
        </div>
      </div>

      {/* Botones de acción directos */}
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {streak.hasCheckedInToday
            ? "¡Excelente! Has cumplido con tu momento de autocuidado de hoy."
            : "Haz tu pausa de 2 minutos para mantener tu racha activa."}
        </p>

        <div className="flex items-center gap-2">
          {streak.hasCheckedInToday ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSimulateCheckIn}
              className="rounded-xl text-xs font-semibold gap-1.5 border-border"
            >
              <Check className="size-3.5 text-teal-500" />
              <span>Registrar otro momento</span>
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-gradient-to-r from-lime-500 to-[#6857E4] text-white text-xs font-semibold shadow-soft hover:opacity-95"
            >
              <Link to="/checkin">
                <span>Completar check-in de hoy</span>
                <ArrowRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-xl text-xs font-semibold text-primary hover:bg-muted"
          >
            <Link to="/checkin">
              <span>Ir al check-in</span>
              <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
