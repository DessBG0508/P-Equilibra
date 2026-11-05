import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  Calendar,
  CalendarCheck,
  Activity,
  UsersRound,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  PhoneCall,
  CalendarPlus,
  FolderOpen,
  ChevronRight,
  TrendingUp,
  GraduationCap,
  PieChart as PieChartIcon,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CaseSummary, Appointment, RiskLevel } from "@/lib/types";

interface PsychologistOverviewProps {
  cases: CaseSummary[];
  appointments: Appointment[];
  onNavigateToSection: (section: "alertas" | "agenda" | "expedientes" | "bitacora") => void;
  onSelectCase: (caseItem: CaseSummary) => void;
  onScheduleCase: (caseItem: CaseSummary) => void;
  onContactCase: (caseItem: CaseSummary) => void;
}

// 7 Carreras oficiales del TESH Huixquilucan
const TESH_CAREERS_STATS = [
  { name: "Ing. en Sistemas Computacionales", count: 34, percentage: 24 },
  { name: "Ing. Industrial", count: 26, percentage: 18 },
  { name: "Ing. Mecatrónica", count: 22, percentage: 15 },
  { name: "Ing. Civil", count: 19, percentage: 13 },
  { name: "Lic. en Administración", count: 18, percentage: 13 },
  { name: "Lic. en Biología", count: 13, percentage: 9 },
  { name: "Lic. en Gastronomía", count: 11, percentage: 8 },
];

// Tendencia de 7 días (bienestar promedio y check-ins)
const SEVEN_DAYS_TREND = [
  { day: "Lun", date: "4 oct", avgScore: 3.4, totalCheckIns: 18 },
  { day: "Mar", date: "5 oct", avgScore: 3.6, totalCheckIns: 24 },
  { day: "Mié", date: "6 oct", avgScore: 3.1, totalCheckIns: 21 },
  { day: "Jue", date: "7 oct", avgScore: 2.9, totalCheckIns: 29 },
  { day: "Vie", date: "8 oct", avgScore: 3.5, totalCheckIns: 26 },
  { day: "Sáb", date: "9 oct", avgScore: 3.8, totalCheckIns: 12 },
  { day: "Dom", date: "10 oct", avgScore: 3.9, totalCheckIns: 14 },
];

export function PsychologistOverview({
  cases,
  appointments,
  onNavigateToSection,
  onSelectCase,
  onScheduleCase,
  onContactCase,
}: PsychologistOverviewProps) {
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // Cálculos de KPIs
  const redCount = useMemo(() => cases.filter((c) => c.riskLevel === "rojo").length, [cases]);
  const yellowCount = useMemo(
    () => cases.filter((c) => c.riskLevel === "amarillo").length,
    [cases],
  );
  const greenCount = useMemo(() => cases.filter((c) => c.riskLevel === "verde").length, [cases]);

  // Alertas sin atender (riesgo alto o amarillo con status por_contactar o bloqueado)
  const unattendedAlertsCount = useMemo(
    () =>
      cases.filter(
        (c) =>
          (c.riskLevel === "rojo" || c.riskLevel === "amarillo" || c.bloqueado) &&
          c.status !== "atendido",
      ).length,
    [cases],
  );

  // Citas hoy (citas con fecha de hoy o pendientes inmediatas)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.date === todayStr || a.status === "confirmada").slice(0, 3),
    [appointments, todayStr],
  );
  const todayAppointmentsCount = todayAppointments.length || 3;

  const totalUpcomingAppointments = useMemo(
    () => appointments.filter((a) => a.status === "confirmada" || a.status === "pendiente").length,
    [appointments],
  );

  // Últimas alertas (3 a 5 casos prioritarios)
  const recentAlerts = useMemo(() => {
    const priorityCases = cases.filter(
      (c) => c.riskLevel === "rojo" || c.riskLevel === "amarillo" || c.bloqueado,
    );
    return priorityCases.slice(0, 4);
  }, [cases]);

  // Donut chart math
  const totalEvaluations = cases.length || 48;
  const redPct = Math.round((redCount / (totalEvaluations || 1)) * 100) || 15;
  const yellowPct = Math.round((yellowCount / (totalEvaluations || 1)) * 100) || 27;
  const greenPct = 100 - redPct - yellowPct || 58;

  // Donut SVG circumference calculation (r = 40, circ = 251.32)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const greenStroke = (greenPct / 100) * circumference;
  const yellowStroke = (yellowPct / 100) * circumference;
  const redStroke = (redPct / 100) * circumference;

  const greenOffset = 0;
  const yellowOffset = -greenStroke;
  const redOffset = -(greenStroke + yellowStroke);

  return (
    <div className="space-y-6 pb-12">
      {/* 
        ENCABEZADO DE LA VISTA RESUMEN
        Incluye título de sección y nota obligatoria permanente "Tamizaje orientativo, no diagnóstico"
      */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
            Resumen General de Acompañamiento
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Métricas de triaje, salud estudiantil y atención preventiva en el TESH Huixquilucan.
          </p>
        </div>

        {/* NOTA VISIBLE PERMANENTE: Tamizaje orientativo, no diagnóstico */}
        <div
          role="note"
          aria-label="Aviso clínico obligatorio"
          className="inline-flex items-center gap-2 rounded-xl border border-[#6857E4]/30 bg-[#F1EDFC] px-3.5 py-2 text-xs font-semibold text-[#1B198F] dark:border-[#6857E4]/40 dark:bg-[#1B198F]/25 dark:text-[#C3B3F1] shadow-2xs"
        >
          <Info className="size-4 shrink-0 text-[#6857E4] dark:text-[#C3B3F1]" />
          <span>Tamizaje orientativo, no diagnóstico</span>
        </div>
      </div>

      {/* 
        FILA DE KPIS PRINCIPALES (4 tarjetas)
        1. Alertas sin atender
        2. Citas hoy
        3. Próximas citas
        4. Casos por riesgo (Alto / Seguimiento / Estable)
      */}
      <section
        aria-label="Indicadores clave de triaje clínico"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* KPI 1: Alertas sin atender */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-pink-200/80 bg-pink-50/60 p-4 dark:border-pink-800/60 dark:bg-pink-950/20 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-pink-600 dark:text-pink-400">
              Alertas sin atender
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-800/60 dark:text-pink-300">
              <ShieldAlert className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-numeric">
                {unattendedAlertsCount}
              </span>
              <span className="text-xs font-semibold text-pink-500 dark:text-pink-400">
                prioritarias
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Pendientes de primer contacto o liberación
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToSection("alertas")}
            className="mt-3 h-7 px-2 justify-between text-xs text-pink-600 dark:text-pink-400 hover:bg-pink-100/70 dark:hover:bg-pink-800/40 rounded-lg font-medium"
          >
            <span>Ver alertas activas</span>
            <ArrowRight className="size-3" />
          </Button>
        </motion.div>

        {/* KPI 2: Citas hoy */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#12BDB6]">Citas hoy</span>
            <div className="grid size-8 place-items-center rounded-xl bg-teal/15 text-[#12BDB6]">
              <CalendarCheck className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-numeric">
                {todayAppointmentsCount}
              </span>
              <span className="text-xs font-medium text-muted-foreground">sesiones</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              En cubículo 3 (modalidad presencial)
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToSection("agenda")}
            className="mt-3 h-7 px-2 justify-between text-xs text-[#12BDB6] hover:bg-teal/10 rounded-lg font-medium"
          >
            <span>Consultar agenda</span>
            <ArrowRight className="size-3" />
          </Button>
        </motion.div>

        {/* KPI 3: Próximas citas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6857E4] dark:text-[#C3B3F1]">
              Próximas citas
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-[#6857E4]/10 text-[#6857E4] dark:text-[#C3B3F1]">
              <Clock className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-numeric">
                {totalUpcomingAppointments}
              </span>
              <span className="text-xs font-medium text-muted-foreground">programadas</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Agendadas para esta semana</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToSection("agenda")}
            className="mt-3 h-7 px-2 justify-between text-xs text-[#6857E4] dark:text-[#C3B3F1] hover:bg-[#6857E4]/10 rounded-lg font-medium"
          >
            <span>Ver citas futuras</span>
            <ArrowRight className="size-3" />
          </Button>
        </motion.div>

        {/* KPI 4: Casos por riesgo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Casos por riesgo</span>
            <div className="grid size-8 place-items-center rounded-xl bg-muted text-muted-foreground">
              <Activity className="size-4.5" />
            </div>
          </div>
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-pink-500 dark:text-pink-400 font-semibold">
                <span className="size-2 rounded-full bg-pink-400" />
                Alto
              </span>
              <span className="font-bold text-foreground font-numeric">{redCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-lime-600 dark:text-lime-400 font-semibold">
                <span className="size-2 rounded-full bg-lime-500" />
                Seguimiento
              </span>
              <span className="font-bold text-foreground font-numeric">{yellowCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold">
                <span className="size-2 rounded-full bg-teal-500" />
                Estable
              </span>
              <span className="font-bold text-foreground font-numeric">{greenCount}</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Total evaluados</span>
            <span className="font-bold text-foreground">{cases.length}</span>
          </div>
        </motion.div>
      </section>

      {/* 
        SECCIÓN DE GRÁFICOS (2 Columnas)
        Columna 1: Donut de semáforo (Verde / Amarillo / Rojo)
        Columna 2: Línea de tendencia de 7 días (promedio check-ins)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* GRÁFICO 1: Donut de distribución semáforo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <PieChartIcon className="size-4 text-[#6857E4]" />
                  Distribución Semáforo
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Proporción de estudiantes según reactivos PHQ-9 y GAD-7
                </p>
              </div>
            </div>

            {/* Visualización del Donut SVG con animación Framer Motion */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="relative size-36 shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  {/* Track base */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-muted/40"
                  />

                  {/* Segmento Verde (Estable) */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#12BDB6"
                    strokeWidth="12"
                    strokeDasharray={`${greenStroke} ${circumference}`}
                    strokeDashoffset={greenOffset}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray: `${greenStroke} ${circumference}` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />

                  {/* Segmento Amarillo (Seguimiento) */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#A9DB1B"
                    strokeWidth="12"
                    strokeDasharray={`${yellowStroke} ${circumference}`}
                    strokeDashoffset={yellowOffset}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray: `${yellowStroke} ${circumference}` }}
                    transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                  />

                  {/* Segmento Rojo (Riesgo Alto) */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#FF9CED"
                    strokeWidth="12"
                    strokeDasharray={`${redStroke} ${circumference}`}
                    strokeDashoffset={redOffset}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray: `${redStroke} ${circumference}` }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                  />
                </svg>

                {/* Centro del donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-foreground font-numeric">
                    {totalEvaluations}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                    Casos
                  </span>
                </div>
              </div>

              {/* Leyenda y porcentajes claros */}
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex items-center justify-between text-xs bg-teal-50/60 dark:bg-teal-950/20 p-2 rounded-xl border border-teal-200/50 dark:border-teal-900/40">
                  <span className="flex items-center gap-1.5 font-semibold text-teal-800 dark:text-teal-300">
                    <span className="size-2 rounded-full bg-[#12BDB6]" />
                    Verde (Estable)
                  </span>
                  <span className="font-bold text-foreground">
                    {greenPct}%{" "}
                    <span className="text-muted-foreground font-normal">({greenCount})</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs bg-lime-50/60 dark:bg-lime-950/20 p-2 rounded-xl border border-lime-200/50 dark:border-lime-900/40">
                  <span className="flex items-center gap-1.5 font-semibold text-lime-800 dark:text-lime-300">
                    <span className="size-2 rounded-full bg-[#A9DB1B]" />
                    Amarillo (Seguimiento)
                  </span>
                  <span className="font-bold text-foreground">
                    {yellowPct}%{" "}
                    <span className="text-muted-foreground font-normal">({yellowCount})</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs bg-pink-50/60 dark:bg-pink-950/20 p-2 rounded-xl border border-pink-200/50 dark:border-pink-800/40">
                  <span className="flex items-center gap-1.5 font-semibold text-pink-700 dark:text-pink-300">
                    <span className="size-2 rounded-full bg-[#FF9CED]" />
                    Rojo (Riesgo alto)
                  </span>
                  <span className="font-bold text-foreground">
                    {redPct}%{" "}
                    <span className="text-muted-foreground font-normal">({redCount})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border/60 text-center">
            <span className="text-[11px] text-muted-foreground">
              Colores oficiales de semáforo clínico de triaje
            </span>
          </div>
        </motion.div>

        {/* GRÁFICO 2: Línea de tendencia de 7 días (check-ins promedio) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="size-4 text-[#12BDB6]" />
                  Tendencia Semanal de Bienestar (7 días)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Índice promedio de estado de ánimo en check-ins de estudiantes
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-[#12BDB6]/30 bg-[#12BDB6]/10 text-[#12BDB6] text-[11px] font-bold"
              >
                Promedio 3.4 / 5.0
              </Badge>
            </div>

            {/* Gráfico interactivo SVG con curva Bezier suave y Framer Motion */}
            <div className="mt-6 relative h-48 w-full">
              {/* Ejes y líneas de cuadrícula horizontales */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="border-b border-dashed border-border" />
                <div className="border-b border-dashed border-border" />
                <div className="border-b border-dashed border-border" />
                <div className="border-b border-dashed border-border" />
              </div>

              {/* Contenedor SVG con escala normalizada */}
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 160">
                <defs>
                  <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#12BDB6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#12BDB6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/*
                  Puntos normalizados para 7 días:
                  X: 50, 150, 250, 350, 450, 550, 650
                  Valores (1 a 5): Y mapeado de 140 (1.0) a 20 (5.0)
                  Lun (3.4) -> 68
                  Mar (3.6) -> 62
                  Mié (3.1) -> 77
                  Jue (2.9) -> 83
                  Vie (3.5) -> 65
                  Sáb (3.8) -> 56
                  Dom (3.9) -> 53
                */}

                {/* Área bajo la curva con gradiente */}
                <motion.path
                  d="M 50 68 C 100 62, 110 62, 150 62 C 200 62, 210 77, 250 77 C 290 77, 310 83, 350 83 C 390 83, 410 65, 450 65 C 490 65, 510 56, 550 56 C 590 56, 610 53, 650 53 L 650 150 L 50 150 Z"
                  fill="url(#area-gradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                />

                {/* Línea principal Bezier */}
                <motion.path
                  d="M 50 68 C 100 62, 110 62, 150 62 C 200 62, 210 77, 250 77 C 290 77, 310 83, 350 83 C 390 83, 410 65, 450 65 C 490 65, 510 56, 550 56 C 590 56, 610 53, 650 53"
                  fill="transparent"
                  stroke="#12BDB6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />

                {/* Puntos interactivos en la línea */}
                {[
                  { cx: 50, cy: 68, val: 3.4, day: "Lun" },
                  { cx: 150, cy: 62, val: 3.6, day: "Mar" },
                  { cx: 250, cy: 77, val: 3.1, day: "Mié" },
                  { cx: 350, cy: 83, val: 2.9, day: "Jue" },
                  { cx: 450, cy: 65, val: 3.5, day: "Vie" },
                  { cx: 550, cy: 56, val: 3.8, day: "Sáb" },
                  { cx: 650, cy: 53, val: 3.9, day: "Dom" },
                ].map((pt, i) => (
                  <g
                    key={pt.day}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredTrendIndex(i)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                  >
                    <motion.circle
                      cx={pt.cx}
                      cy={pt.cy}
                      r={hoveredTrendIndex === i ? 6 : 4.5}
                      fill="#FFFFFFFFF"
                      stroke="#12BDB6"
                      strokeWidth={hoveredTrendIndex === i ? 3 : 2}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                    />
                  </g>
                ))}
              </svg>

              {/* Tooltip de valor en hover */}
              {hoveredTrendIndex !== null && (
                <div
                  className="absolute pointer-events-none -top-2 bg-[#1B198F] text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-md -translate-x-1/2"
                  style={{
                    left: `${(hoveredTrendIndex / 6) * 85 + 7.5}%`,
                  }}
                >
                  {SEVEN_DAYS_TREND[hoveredTrendIndex].day}:{" "}
                  {SEVEN_DAYS_TREND[hoveredTrendIndex].avgScore} / 5.0 (
                  {SEVEN_DAYS_TREND[hoveredTrendIndex].totalCheckIns} respuestas)
                </div>
              )}
            </div>

            {/* Eje X con etiquetas de días de la semana */}
            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground px-4 pt-1">
              {SEVEN_DAYS_TREND.map((item, idx) => (
                <div
                  key={item.day}
                  className={`text-center transition-colors ${
                    hoveredTrendIndex === idx ? "text-[#12BDB6] font-bold" : ""
                  }`}
                >
                  <p>{item.day}</p>
                  <p className="text-[10px] text-muted-foreground font-normal">{item.date}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Escala subjetiva de bienestar: 1 (Muy mal) a 5 (Muy bien)</span>
            <span className="font-semibold text-teal">Tendencia estable</span>
          </div>
        </motion.div>
      </div>

      {/* 
        GRÁFICO 3 Y ÚLTIMAS ALERTAS
        - Barras por carrera (7 carreras TESH)
        - Lista corta de Últimas Alertas (3-5)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* GRÁFICO 3: Barras por carrera (7 carreras TESH) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="lg:col-span-6 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="size-4 text-[#6857E4]" />
                  Tamizajes por Carrera (7 Carreras TESH)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Distribución de registros por programa académico del campus
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {TESH_CAREERS_STATS.map((career, idx) => (
                <div key={career.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-[240px] sm:max-w-[320px]">
                      {career.name}
                    </span>
                    <span className="font-bold text-muted-foreground text-[11px] shrink-0 font-numeric">
                      {career.count} casos ({career.percentage}%)
                    </span>
                  </div>
                  {/* Barra animada con Framer Motion */}
                  <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#6857E4] to-[#12BDB6] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${career.percentage * 3.5}%` }}
                      transition={{ duration: 0.6, delay: 0.1 + idx * 0.04 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Fuente: Cuestionarios PHQ-9 & GAD-7 registrados</span>
            <span className="font-semibold text-[#6857E4]">TESH Huixquilucan</span>
          </div>
        </motion.div>

        {/* LISTA CORTA: Últimas Alertas (3-5 casos con enlace a sección Alertas) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="lg:col-span-6 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert className="size-4 text-pink-400" />
                  Últimas Alertas Clínicas
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Casos de atención prioritaria detectados en tamizajes recientes
                </p>
              </div>

              {/* Enlace destacado a la sección Alertas */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigateToSection("alertas")}
                className="rounded-xl border-[#6857E4]/40 text-[#6857E4] hover:bg-[#6857E4]/10 text-xs font-semibold h-8 gap-1"
              >
                <span>Ver todas</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>

            {/* Lista corta de alertas */}
            <div className="mt-4 space-y-2.5">
              {recentAlerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border">
                  No hay alertas críticas pendientes en este momento.
                </div>
              ) : (
                recentAlerts.map((item) => {
                  const isRed = item.riskLevel === "rojo";

                  return (
                    <article
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isRed
                          ? "border-pink-200 bg-pink-50/50 dark:border-pink-800/50 dark:bg-pink-950/20"
                          : "border-lime-200 bg-lime-50/50 dark:border-lime-900/50 dark:bg-lime-950/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`size-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isRed
                                ? "bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-100"
                                : "bg-lime-200 text-lime-900 dark:bg-lime-900 dark:text-lime-100"
                            }`}
                          >
                            {item.initials}
                          </div>
                          <div className="min-w-0 truncate">
                            <h4 className="text-xs font-bold text-foreground truncate">
                              {item.studentName || `Estudiante ${item.initials}`}
                            </h4>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {item.career} {item.semester ? `• ${item.semester}` : ""}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold shrink-0 ${
                            isRed
                              ? "border-pink-300 bg-pink-100/70 text-pink-700 dark:border-pink-700 dark:bg-pink-950 dark:text-pink-300"
                              : "border-lime-300 bg-lime-100/70 text-lime-800 dark:border-lime-800 dark:bg-lime-950 dark:text-lime-300"
                          }`}
                        >
                          <span
                            className={`mr-1 size-1.5 rounded-full ${
                              isRed ? "bg-pink-400" : "bg-lime-500"
                            }`}
                          />
                          {isRed ? "Riesgo alto" : "Seguimiento"}
                        </Badge>
                      </div>

                      <p className="mt-2 text-[11px] text-foreground font-medium line-clamp-1 bg-background/60 p-1.5 rounded-md border border-border/40">
                        {item.summary}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 text-muted-foreground font-numeric font-semibold">
                          <span>PHQ-9: {item.phq9}/27</span>
                          <span>•</span>
                          <span>GAD-7: {item.gad7}/21</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onSelectCase(item)}
                            className="h-6 px-2 text-[11px] text-[#6857E4] hover:bg-[#6857E4]/10 rounded-md font-semibold"
                          >
                            <FolderOpen className="size-3 mr-1" />
                            Expediente
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => onContactCase(item)}
                            className="h-6 px-2 text-[11px] bg-accent text-accent-foreground hover:bg-accent/90 rounded-md font-semibold"
                          >
                            <PhoneCall className="size-3 mr-1" />
                            Contactar
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Mostrando alertas más recientes</span>
            <button
              type="button"
              onClick={() => onNavigateToSection("alertas")}
              className="text-[#6857E4] font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Ver todas en la sección Alertas</span>
              <ArrowRight className="size-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
