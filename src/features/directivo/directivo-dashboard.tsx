import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  GraduationCap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Brain,
  BedDouble,
  CircleGauge,
  BatteryMedium,
  Filter,
  BarChart3,
  PieChart,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AjustesModal } from "@/components/settings/ajustes-modal";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/branding";
import {
  TESH_CAREERS,
  type TeshCareer,
  getDirectivoKPIs,
  getSemesterChartData,
} from "@/lib/directivo-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DirectivoDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedCareer, setSelectedCareer] = useState<TeshCareer | "all">(
    "Ing. en Sistemas Computacionales",
  );

  const kpis = useMemo(() => getDirectivoKPIs(selectedCareer), [selectedCareer]);
  const semesterData = useMemo(() => getSemesterChartData(selectedCareer), [selectedCareer]);

  const handleLogout = () => {
    logout();
    toast.info("Has cerrado sesión.");
    navigate({ to: "/login", replace: true });
  };

  const getCareerTitle = () => {
    if (selectedCareer === "all") return "Todas las Carreras del Campus";
    return selectedCareer;
  };

  return (
    <PageShell showAppHeader={false} showBottomNav={false}>
      {/* Encabezado Institucional Directivo */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-5 sm:py-7 border-b border-border/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block size-1.5 rounded-full bg-teal" />
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-teal">
              Dirección Académica y Jefaturas • {BRAND.fullName}
            </p>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-primary font-bold tracking-tight">
            Panel Directivo de Bienestar Estudiantil
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
            Monitoreo estratégico y agregación confidencial de la salud mental y bienestar por
            carrera.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <AjustesModal rol="directivo" />
          <ThemeToggle />

          {/* Menú de Usuario Directivo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Menú de directivo"
              >
                <Avatar className="size-10 sm:size-11 border-2 border-teal/40 shadow-soft">
                  <AvatarFallback className="bg-primary font-semibold text-primary-foreground text-xs sm:text-sm">
                    {user?.name
                      ?.split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("") || "DIR"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 border-border bg-card p-2 rounded-2xl shadow-xl"
            >
              <DropdownMenuLabel className="space-y-1 p-2">
                <p className="truncate text-sm font-bold text-foreground">
                  {user?.name || "Jefatura de Carrera"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email || "jefatura@tesh.mx"}
                </p>
                <div className="pt-1">
                  <Badge
                    variant="outline"
                    className="rounded-lg border-teal/40 bg-teal/10 text-[10px] font-semibold text-teal capitalize"
                  >
                    Jefatura de Carrera / Directivo
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer gap-2 rounded-xl text-xs font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="size-4" />
                <span>Cerrar sesión institucional</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="space-y-6 pt-6 pb-16">
        {/* Selector de Carrera y Control de Segmentación */}
        <section
          aria-labelledby="career-selector-heading"
          className="ethereal-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-accent" />
              <h2
                id="career-selector-heading"
                className="text-sm font-bold text-foreground uppercase tracking-wide"
              >
                Carrera en Análisis
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              En producción (RLS), cada jefatura consulta únicamente su plan académico asignado.
            </p>
          </div>

          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2.5">
            <label htmlFor="career-select" className="sr-only">
              Seleccionar Carrera
            </label>
            <div className="relative w-full sm:w-80">
              <select
                id="career-select"
                value={selectedCareer}
                onChange={(e) => setSelectedCareer(e.target.value as TeshCareer | "all")}
                className="w-full appearance-none rounded-xl border border-border/80 bg-card px-3.5 py-2.5 pr-9 text-xs sm:text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="all">Todas las Carreras (Vista General)</option>
                <optgroup label="Carreras TESH">
                  {TESH_CAREERS.map((career) => (
                    <option key={career} value={career}>
                      {career}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>

            <Badge
              variant="outline"
              className="border-accent/40 bg-accent/10 text-accent text-[11px] px-2.5 py-1 rounded-lg shrink-0 font-medium"
            >
              Demo: Segmentación Libre
            </Badge>
          </div>
        </section>

        {/* Título de Carrera y Tendencia Global */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase text-teal tracking-wider">Últimos 7 días</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary">
              {getCareerTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-card border border-border/60 px-3 py-1.5 shadow-xs">
            {kpis.weeklyTrendPercent >= 0 ? (
              <TrendingUp className="size-4 text-teal-500" />
            ) : (
              <TrendingDown className="size-4 text-lime-500" />
            )}
            <span className="text-xs font-bold text-foreground">
              {kpis.weeklyTrendPercent >= 0
                ? `+${kpis.weeklyTrendPercent}%`
                : `${kpis.weeklyTrendPercent}%`}
            </span>
            <span className="text-[11px] text-muted-foreground">vs. semana anterior</span>
          </div>
        </div>

        {/* KPIs Agregados y Anónimos (Promedios 7 días) */}
        <section
          aria-label="Indicadores clave de bienestar"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {/* Ánimo */}
          <div className="ethereal-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ánimo Promedio
              </span>
              <div className="grid size-8 place-items-center rounded-xl bg-lavender-soft text-accent">
                <Brain className="size-4" />
              </div>
            </div>
            <p className="font-numeric text-3xl sm:text-4xl font-bold italic text-primary">
              {kpis.avgAnimo.toFixed(1)}
              <span className="font-sans text-xs font-normal not-italic text-muted-foreground ml-1">
                / 5
              </span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary/25">
              <div
                className="h-full rounded-full bg-teal transition-all duration-700"
                style={{ width: `${(kpis.avgAnimo / 5) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Índice agregado de percepción anímica
            </p>
          </div>

          {/* Sueño */}
          <div className="ethereal-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sueño Promedio
              </span>
              <div className="grid size-8 place-items-center rounded-xl bg-mint-soft text-teal">
                <BedDouble className="size-4" />
              </div>
            </div>
            <p className="font-numeric text-3xl sm:text-4xl font-bold italic text-primary">
              {kpis.avgSueno.toFixed(1)}
              <span className="font-sans text-xs font-normal not-italic text-muted-foreground ml-1">
                h / día
              </span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary/25">
              <div
                className="h-full rounded-full bg-teal transition-all duration-700"
                style={{ width: `${Math.min(100, (kpis.avgSueno / 9) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Horas reportadas por los estudiantes
            </p>
          </div>

          {/* Estrés */}
          <div className="ethereal-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estrés Promedio
              </span>
              <div className="grid size-8 place-items-center rounded-xl bg-lavender-soft text-accent">
                <CircleGauge className="size-4" />
              </div>
            </div>
            <p className="font-numeric text-3xl sm:text-4xl font-bold italic text-primary">
              {kpis.avgEstres.toFixed(1)}
              <span className="font-sans text-xs font-normal not-italic text-muted-foreground ml-1">
                / 5
              </span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary/25">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700"
                style={{ width: `${(kpis.avgEstres / 5) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Nivel de sobrecarga académica percibida
            </p>
          </div>

          {/* Energía */}
          <div className="ethereal-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Energía Promedio
              </span>
              <div className="grid size-8 place-items-center rounded-xl bg-mint-soft text-teal">
                <BatteryMedium className="size-4" />
              </div>
            </div>
            <p className="font-numeric text-3xl sm:text-4xl font-bold italic text-primary">
              {kpis.avgEnergia.toFixed(1)}
              <span className="font-sans text-xs font-normal not-italic text-muted-foreground ml-1">
                / 5
              </span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary/25">
              <div
                className="h-full rounded-full bg-teal transition-all duration-700"
                style={{ width: `${(kpis.avgEnergia / 5) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Vitalidad y disposición física</p>
          </div>
        </section>

        {/* Sección: Distribución de Riesgo por PORCENTAJES (Sin conteos de personas) */}
        <section aria-labelledby="risk-distribution-heading" className="ethereal-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <PieChart className="size-4 text-teal" />
                <h3 id="risk-distribution-heading" className="text-base font-bold text-foreground">
                  Distribución de Riesgo Académico-Emocional
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Proporción porcentual de estados de bienestar registrados en la carrera (sin conteos
                de personas).
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-[11px] font-semibold text-muted-foreground w-fit"
            >
              Escala Institucional TESH
            </Badge>
          </div>

          {/* Barra segmentada horizontal de porcentajes */}
          <div className="h-4 w-full overflow-hidden rounded-full bg-muted flex shadow-inner">
            <div
              className="bg-teal-500 transition-all duration-700"
              style={{ width: `${kpis.pctVerde}%` }}
              title={`Favorable: ${kpis.pctVerde}%`}
            />
            <div
              className="bg-lime-400 transition-all duration-700"
              style={{ width: `${kpis.pctAmarillo}%` }}
              title={`Moderado: ${kpis.pctAmarillo}%`}
            />
            <div
              className="bg-pink-400 transition-all duration-700"
              style={{ width: `${kpis.pctRojo}%` }}
              title={`Atención prioritaria: ${kpis.pctRojo}%`}
            />
          </div>

          {/* Tarjetas de Porcentaje de cada categoría (Verde / Amarillo / Rojo) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-teal-500" />
                  <span className="text-xs font-bold text-foreground">Favorable / Estable</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Bienestar adecuado y balance
                </p>
              </div>
              <span className="font-numeric text-2xl sm:text-3xl font-bold italic text-teal-600 dark:text-teal-400">
                {kpis.pctVerde}%
              </span>
            </div>

            <div className="rounded-2xl border border-lime-400/30 bg-lime-400/10 p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-lime-400" />
                  <span className="text-xs font-bold text-foreground">Seguimiento Preventivo</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tensión o fatiga moderada
                </p>
              </div>
              <span className="font-numeric text-2xl sm:text-3xl font-bold italic text-lime-600 dark:text-lime-400">
                {kpis.pctAmarillo}%
              </span>
            </div>

            <div className="rounded-2xl border border-pink-400/30 bg-pink-400/10 p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-pink-400" />
                  <span className="text-xs font-bold text-foreground">Atención Prioritaria</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Canalizado con psicología
                </p>
              </div>
              <span className="font-numeric text-2xl sm:text-3xl font-bold italic text-pink-500 dark:text-pink-400">
                {kpis.pctRojo}%
              </span>
            </div>
          </div>
        </section>

        {/* Gráfica por Semestre (1º a 9º): Barras con promedio de bienestar */}
        <section aria-labelledby="semester-chart-heading" className="ethereal-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-accent" />
                <h3 id="semester-chart-heading" className="text-base font-bold text-foreground">
                  Promedio de Bienestar por Semestre (1º a 9º)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comparativo anónimo del índice general de bienestar por ciclo formativo (escala 1 a
                5).
              </p>
            </div>
            <Badge variant="outline" className="text-[11px] font-semibold text-accent w-fit">
              Etiquetas de semestre únicamente
            </Badge>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={semesterData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="semesterLabel"
                  stroke="currentColor"
                  className="text-[11px] text-muted-foreground"
                  tickLine={false}
                  axisLine={{ stroke: "rgba(139, 124, 240, 0.2)" }}
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  stroke="currentColor"
                  className="text-[11px] text-muted-foreground"
                  tickLine={false}
                  axisLine={{ stroke: "rgba(139, 124, 240, 0.2)" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(139, 124, 240, 0.08)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as {
                        semesterLabel: string;
                        bienestarScore: number;
                      };
                      return (
                        <div className="rounded-xl border border-border/80 bg-card p-2.5 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground">{data.semesterLabel} Semestre</p>
                          <p className="text-primary font-numeric font-semibold">
                            Índice de bienestar: {data.bienestarScore.toFixed(1)} / 5.0
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Datos agregados de la cohorte
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="bienestarScore" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {semesterData.map((entry, index) => {
                    const score = entry.bienestarScore;
                    const fill =
                      score >= 4.0
                        ? "var(--color-teal, #12BDB6)"
                        : score >= 3.3
                          ? "var(--color-primary, #6857E4)"
                          : "var(--color-secondary, #6857E4)";
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-teal" />
              <span>Bienestar Óptimo (≥ 4.0)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-primary" />
              <span>Bienestar Estable (3.3 - 3.9)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#6857E4]" />
              <span>Seguimiento Sugerido (&lt; 3.3)</span>
            </span>
          </div>
        </section>

        {/* Nota Visible al Pie (Privacidad y Confidencialidad Institucional) */}
        <footer className="rounded-2xl border border-teal/40 bg-mint-soft/30 dark:bg-teal/10 p-4 sm:p-5 flex items-start gap-3.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal/20 text-teal mt-0.5">
            <ShieldCheck className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-bold text-foreground">
              Garantía de Confidencialidad Estudiantil TESH
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground font-medium">
              Datos agregados y anónimos. Sin acceso a nombres ni conversaciones.
            </p>
            <p className="text-[11px] text-muted-foreground/80">
              La información presentada cumple con las políticas éticas universitarias del
              Tecnológico de Estudios Superiores de Huixquilucan para la toma de decisiones
              pedagógicas y de bienestar sin comprometer la privacidad individual.
            </p>
          </div>
        </footer>
      </main>
    </PageShell>
  );
}
