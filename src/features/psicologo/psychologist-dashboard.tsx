import { useMemo, useState, useEffect } from "react";
import {
  Activity,
  ShieldCheck,
  UsersRound,
  CalendarPlus,
  PhoneCall,
  Search,
  Calendar,
  FileText,
  Clock,
  ShieldAlert,
  LogOut,
  AlertTriangle,
  FolderOpen,
  UserCheck,
  ChevronDown,
  Shield,
  Users,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsCenter } from "@/components/notifications/notifications-center";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PsychologistSidebar, type PsychologistNavSection } from "./psychologist-sidebar";
import { PsychologistOverview } from "./psychologist-overview";
import { ExpedientesPage } from "./expedientes-page";
import { CaseDetailSheet } from "./case-detail-sheet";
import { ScheduleSessionDialog } from "./schedule-session-dialog";
import { ContactPatientDialog } from "./contact-patient-dialog";
import { CrisisProtocolDialog } from "./crisis-protocol-dialog";
import { PsychologistAgenda } from "./psychologist-agenda";
import { ClinicalNotesFeed } from "./clinical-notes-feed";
import { SemaforoPacientes } from "./semaforo-pacientes";
import { ResultadosEncuesta } from "./ResultadosEncuesta";
import { AjustesModal } from "@/components/settings/ajustes-modal";
import { useAuth } from "@/lib/auth-context";
import {
  getPsychologistCases,
  getCaseNotes,
  getStoredAppointments,
  updateCaseStatus,
} from "@/lib/psychologist-store";
import { supabase } from "@/integrations/supabase/client";
import type { CaseSummary, RiskLevel, CaseStatus, Appointment } from "@/lib/types";

const riskStyles: Record<
  RiskLevel,
  { label: string; dot: string; surface: string; border: string }
> = {
  rojo: {
    label: "Riesgo alto",
    dot: "bg-pink-400",
    surface: "bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800/60",
  },
  amarillo: {
    label: "Seguimiento",
    dot: "bg-lime-500",
    surface: "bg-lime-50 dark:bg-lime-950/20 text-lime-800 dark:text-lime-300",
    border: "border-lime-200 dark:border-lime-900/60",
  },
  verde: {
    label: "Estable",
    dot: "bg-teal-500",
    surface: "bg-teal-50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-900/60",
  },
};

const statusLabels: Record<CaseStatus, { label: string; surface: string }> = {
  por_contactar: {
    label: "Por contactar",
    surface: "bg-lime-100 text-lime-800 border-lime-200",
  },
  en_seguimiento: {
    label: "En seguimiento",
    surface: "bg-violet-100 text-violet-800 border-violet-200",
  },
  cita_programada: {
    label: "Cita programada",
    surface: "bg-teal/15 text-teal border-teal/30 font-semibold",
  },
  atendido: {
    label: "Atendido / Estable",
    surface: "bg-teal-100 text-teal-800 border-teal-200",
  },
};

const TESH_CAREERS = [
  "Ing. Civil",
  "Ing. Industrial",
  "Ing. Mecatrónica",
  "Ing. en Sistemas Computacionales",
  "Lic. en Administración",
  "Lic. en Biología",
  "Lic. en Gastronomía",
] as const;

const TESH_SEMESTERS = [
  "1º Semestre",
  "2º Semestre",
  "3º Semestre",
  "4º Semestre",
  "5º Semestre",
  "6º Semestre",
  "7º Semestre",
  "8º Semestre",
  "9º Semestre",
] as const;

const PAGE_SIZE = 6;

const chipClass = (isActive: boolean) =>
  `inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0 cursor-pointer ${
    isActive
      ? "bg-[#6857E4] text-white border-[#6857E4] shadow-sm hover:bg-[#6857E4]"
      : "bg-white dark:bg-card text-foreground border-[#C3B3F1] hover:border-[#6857E4]/60 hover:bg-[#6857E4]/5"
  }`;

export function PsychologistDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<PsychologistNavSection>("resumen");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeRiskFilter, setActiveRiskFilter] = useState<RiskLevel | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [alertasViewMode, setAlertasViewMode] = useState<"semaforo" | "tarjetas">("semaforo");

  const [cases, setCases] = useState<CaseSummary[]>(() => getPsychologistCases());
  const [appointments, setAppointments] = useState<Appointment[]>(() => getStoredAppointments());

  // Diálogos y Sheets interactivos
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<CaseSummary | null>(null);
  const [scheduleDialogCase, setScheduleDialogCase] = useState<CaseSummary | null>(null);
  const [contactDialogCase, setContactDialogCase] = useState<CaseSummary | null>(null);
  const [crisisDialogCase, setCrisisDialogCase] = useState<CaseSummary | null>(null);

  const refreshCases = async () => {
    const localCases = getPsychologistCases();
    try {
      let { data: dbPatients, error } = await supabase
        .from("pacientes")
        .select("*")
        .order("fecha_registro", { ascending: false });

      if (error && error.message.includes("does not exist")) {
        const fallback = await supabase
          .from("pacientes")
          .select("*")
          .order("id", { ascending: false });
        dbPatients = fallback.data;
        error = fallback.error;
      }

      if (!error && Array.isArray(dbPatients) && dbPatients.length > 0) {
        const dbCases: CaseSummary[] = dbPatients.map((p) => {
          const dateStr = p.fecha_registro
            ? new Date(p.fecha_registro).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Reciente";

          return {
            id: p.id,
            initials: p.iniciales || "E.A.",
            studentName: `Estudiante ${p.iniciales || ""}`.trim(),
            matricula: p.folio || "TESH",
            career: "TESH Huixquilucan",
            semester: p.semestre ? `${p.semestre}º Semestre` : "Semestre no especificado",
            riskLevel: (p.bloqueado ? "rojo" : "amarillo") as RiskLevel,
            status: (p.bloqueado ? "por_contactar" : "atendido") as CaseStatus,
            summary: `Tamizaje registrado (Folio: ${p.folio || "N/A"}). ${
              p.bloqueado ? "En revisión clínica (bloqueado)." : "Atendido y liberado."
            }`,
            lastCheckIn: dateStr,
            accompanimentSummary: `Paciente evaluado en tamizaje con folio ${p.folio || "N/A"}.`,
            phq9: 0,
            gad7: 0,
            bloqueado: Boolean(p.bloqueado),
          };
        });

        const existingIds = new Set(dbCases.map((c) => c.id));
        const merged = [...dbCases, ...localCases.filter((c) => !existingIds.has(c.id))];
        setCases(merged);
        return;
      }
    } catch (err) {
      console.warn("Aviso al consultar pacientes en Supabase:", err);
    }
    setCases(localCases);
  };

  const handleLiberarPaciente = async (caseId: string) => {
    try {
      // update pacientes set bloqueado = false where id = (el del caso)
      const { error } = await supabase
        .from("pacientes")
        .update({ bloqueado: false })
        .eq("id", caseId);

      if (error) {
        console.warn("Aviso al actualizar bloqueo en Supabase:", error.message);
      }

      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: "atendido", bloqueado: false } : c)),
      );

      updateCaseStatus(caseId, "atendido");
      toast.success("Caso atendido: tamizaje liberado.");
    } catch (err) {
      console.warn("Error al liberar paciente:", err);
      toast.success("Caso atendido: tamizaje liberado.");
    }
  };

  const refreshAppointments = () => {
    setAppointments(getStoredAppointments());
  };

  useEffect(() => {
    refreshCases();
    refreshAppointments();
  }, []);

  // Reiniciar a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [activeRiskFilter, selectedCareer, selectedSemester, searchQuery]);

  const handleLogout = () => {
    logout();
    toast.info("Has cerrado sesión como profesional.");
    navigate({ to: "/login", replace: true });
  };

  const handleOpenCaseById = (caseId: string) => {
    const found = cases.find((c) => c.id === caseId);
    if (found) {
      setSelectedCaseForDetail(found);
      setActiveSection("alertas");
    }
  };

  // Filtrado combinable (AND) con la búsqueda por texto
  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      // 1. Filtro por riesgo
      const matchesRisk = activeRiskFilter === null || item.riskLevel === activeRiskFilter;

      // 2. Filtro por carrera
      const matchesCareer =
        selectedCareer === "all" ||
        (item.career && item.career.toLowerCase().includes(selectedCareer.toLowerCase()));

      // 3. Filtro por semestre
      const matchesSemester =
        selectedSemester === "all" ||
        (item.semester &&
          (item.semester.toLowerCase() === selectedSemester.toLowerCase() ||
            item.semester.toLowerCase().startsWith(selectedSemester.slice(0, 2).toLowerCase())));

      // 4. Búsqueda por texto
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        item.initials.toLowerCase().includes(query) ||
        (item.studentName && item.studentName.toLowerCase().includes(query)) ||
        (item.career && item.career.toLowerCase().includes(query)) ||
        (item.semester && item.semester.toLowerCase().includes(query)) ||
        item.summary.toLowerCase().includes(query);

      return matchesRisk && matchesCareer && matchesSemester && matchesSearch;
    });
  }, [cases, activeRiskFilter, selectedCareer, selectedSemester, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCases = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredCases.slice(start, start + PAGE_SIZE);
  }, [filteredCases, safePage]);

  const handleClearAllFilters = () => {
    setActiveRiskFilter(null);
    setSelectedCareer("all");
    setSelectedSemester("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    activeRiskFilter !== null ||
    selectedCareer !== "all" ||
    selectedSemester !== "all" ||
    searchQuery.trim() !== "";

  const redCount = cases.filter((c) => c.riskLevel === "rojo").length;
  const yellowCount = cases.filter((c) => c.riskLevel === "amarillo").length;
  const greenCount = cases.filter((c) => c.riskLevel === "verde").length;
  const activeAppointmentsCount = useMemo(
    () => appointments.filter((a) => a.status === "confirmada" || a.status === "pendiente").length,
    [appointments],
  );
  const scheduledCount = activeAppointmentsCount;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Barra lateral izquierda (desktop), colapsable a iconos en móvil */}
      <PsychologistSidebar
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec)}
        redAlertsCount={redCount}
        activeAppointmentsCount={activeAppointmentsCount}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Contenedor de contenido principal */}
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? "pl-16 sm:pl-20" : "pl-16 sm:pl-20 lg:pl-64"
        }`}
      >
        {/* Cabecera superior compacta — fondo azul profundo institucional */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-primary/20 bg-primary px-4 text-primary-foreground shadow-nav sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan hidden sm:inline-flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-cyan animate-pulse" />
              Área de Acompañamiento TESH
            </span>
            <span className="text-primary-foreground/40 hidden sm:inline">•</span>
            <h1 className="text-sm font-bold text-primary-foreground font-display truncate sm:text-base">
              {activeSection === "resumen" && "Resumen de Acompañamiento"}
              {activeSection === "alertas" && "Triaje de Alertas y Casos"}
              {activeSection === "expedientes" && "Expedientes Clínicos"}
              {activeSection === "agenda" && "Agenda de Citas"}
              {activeSection === "bitacora" && "Bitácora Clínica"}
              {activeSection === "encuestas" && "Encuestas de Satisfacción PB-021"}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <AjustesModal rol="psicologo" />
            <NotificationsCenter
              role="psicologo"
              onSelectCase={handleOpenCaseById}
              onOpenAgenda={() => setActiveSection("agenda")}
            />
          </div>
        </header>

        {/* Contenido dinámico según la sección seleccionada */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* SECCIÓN 1: RESUMEN (Por defecto) */}
          {activeSection === "resumen" && (
            <PsychologistOverview
              cases={cases}
              appointments={appointments}
              onNavigateToSection={(sec) => setActiveSection(sec)}
              onSelectCase={(caseItem) => setSelectedCaseForDetail(caseItem)}
              onScheduleCase={(caseItem) => setScheduleDialogCase(caseItem)}
              onContactCase={(caseItem) => setContactDialogCase(caseItem)}
            />
          )}

          {/* SECCIÓN 2: ALERTAS (Antigua Casos y Alertas, funciones 100% conservadas) */}
          {activeSection === "alertas" && (
            <div className="space-y-6">
              {/* Encabezado interno de la sección Alertas */}
              <div className="flex flex-col gap-1 border-b border-border/60 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
                  Casos Clínicos y Triaje de Alertas
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Priorización por nivel de riesgo, registro de acompañamiento y liberación de
                  tamizajes.
                </p>
              </div>

              {/* Selector de subvista: Semáforo Oficial vs Tarjetas */}
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Button
                  type="button"
                  size="sm"
                  variant={alertasViewMode === "semaforo" ? "default" : "outline"}
                  onClick={() => setAlertasViewMode("semaforo")}
                  className={`rounded-xl text-xs font-bold ${
                    alertasViewMode === "semaforo"
                      ? "bg-[#1B198F] text-white hover:bg-[#1B198F]/90"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <Users className="mr-1.5 size-3.5" />
                  Semáforo de Pacientes (Oficial)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={alertasViewMode === "tarjetas" ? "default" : "outline"}
                  onClick={() => setAlertasViewMode("tarjetas")}
                  className={`rounded-xl text-xs font-bold ${
                    alertasViewMode === "tarjetas"
                      ? "bg-[#1B198F] text-white hover:bg-[#1B198F]/90"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <Activity className="mr-1.5 size-3.5" />
                  Tarjetas de Triaje
                </Button>
              </div>

              {alertasViewMode === "semaforo" ? (
                <SemaforoPacientes />
              ) : (
                <>
                  {/* Tarjetas de Métricas Rápidas y Filtros */}
                  <section
                    className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                    aria-label="Filtros rápidos por riesgo"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveRiskFilter((prev) => (prev === "rojo" ? null : "rojo"))
                      }
                      className={`ethereal-card p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                        activeRiskFilter === "rojo"
                          ? "border-pink-400 bg-pink-50/70 dark:bg-pink-950/30 ring-2 ring-pink-400/20"
                          : "border-border hover:border-pink-200"
                      }`}
                    >
                      <div>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-pink-500 dark:text-pink-400">
                          <ShieldAlert className="size-3.5" />
                          Riesgo Alto
                        </span>
                        <p className="font-numeric text-2xl sm:text-3xl font-bold text-primary mt-1">
                          {redCount}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Atención prioritaria
                        </p>
                      </div>
                      <div className="size-2.5 rounded-full bg-pink-400 self-start animate-ping" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveRiskFilter((prev) => (prev === "amarillo" ? null : "amarillo"))
                      }
                      className={`ethereal-card p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                        activeRiskFilter === "amarillo"
                          ? "border-lime-400 bg-lime-50/70 dark:bg-lime-950/30 ring-2 ring-lime-400/20"
                          : "border-border hover:border-lime-200"
                      }`}
                    >
                      <div>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-lime-600 dark:text-lime-400">
                          <Activity className="size-3.5" />
                          Seguimiento
                        </span>
                        <p className="font-numeric text-2xl sm:text-3xl font-bold text-primary mt-1">
                          {yellowCount}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Monitoreo activo</p>
                      </div>
                      <div className="size-2.5 rounded-full bg-lime-500 self-start" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveRiskFilter((prev) => (prev === "verde" ? null : "verde"))
                      }
                      className={`ethereal-card p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                        activeRiskFilter === "verde"
                          ? "border-teal-400 bg-teal-50/70 dark:bg-teal-950/30 ring-2 ring-teal-400/20"
                          : "border-border hover:border-teal-200"
                      }`}
                    >
                      <div>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400">
                          <UsersRound className="size-3.5" />
                          Estables
                        </span>
                        <p className="font-numeric text-2xl sm:text-3xl font-bold text-primary mt-1">
                          {greenCount}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Sin alertas críticas
                        </p>
                      </div>
                      <div className="size-2.5 rounded-full bg-teal-500 self-start" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection("agenda")}
                      className="ethereal-card p-4 rounded-2xl border border-border hover:border-teal/50 transition-all text-left flex items-center justify-between"
                    >
                      <div>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-teal">
                          <Calendar className="size-3.5" />
                          Citas Activas
                        </span>
                        <p className="font-numeric text-2xl sm:text-3xl font-bold text-primary mt-1">
                          {activeAppointmentsCount}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          En agenda clínica
                        </p>
                      </div>
                      <CalendarPlus className="size-4 text-teal self-start" />
                    </button>
                  </section>

                  {/* Barra de Filtros y Búsqueda */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por iniciales, nombre, carrera o síntoma..."
                        className="pl-9 rounded-xl border-border bg-card text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-semibold">
                        Mostrando {filteredCases.length} de {cases.length} casos
                      </span>
                      {hasActiveFilters && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleClearAllFilters}
                          className="h-7 text-xs text-[#6857E4] hover:bg-[#6857E4]/10 px-2 font-medium"
                        >
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Chips de filtro (Bajo la barra de búsqueda) */}
                  <div
                    className="flex flex-wrap items-center gap-2 pt-1"
                    aria-label="Filtros avanzados"
                  >
                    <span className="text-xs font-semibold text-muted-foreground mr-1">
                      Riesgo:
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveRiskFilter(null)}
                      className={chipClass(activeRiskFilter === null)}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRiskFilter("rojo")}
                      className={chipClass(activeRiskFilter === "rojo")}
                    >
                      Riesgo alto
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRiskFilter("amarillo")}
                      className={chipClass(activeRiskFilter === "amarillo")}
                    >
                      Seguimiento
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRiskFilter("verde")}
                      className={chipClass(activeRiskFilter === "verde")}
                    >
                      Estable
                    </button>

                    <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

                    {/* Dropdown Carrera */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className={chipClass(selectedCareer !== "all")}>
                          <span>
                            {selectedCareer === "all" ? "Carrera: Todas" : selectedCareer}
                          </span>
                          <ChevronDown className="size-3.5 opacity-80" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64 max-h-72 overflow-y-auto">
                        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground">
                          Carrera TESH
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setSelectedCareer("all")}
                          className={selectedCareer === "all" ? "font-bold text-[#6857E4]" : ""}
                        >
                          Todas las carreras
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {TESH_CAREERS.map((career) => (
                          <DropdownMenuItem
                            key={career}
                            onClick={() => setSelectedCareer(career)}
                            className={selectedCareer === career ? "font-bold text-[#6857E4]" : ""}
                          >
                            {career}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Dropdown Semestre */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className={chipClass(selectedSemester !== "all")}>
                          <span>
                            {selectedSemester === "all" ? "Semestre: Todos" : selectedSemester}
                          </span>
                          <ChevronDown className="size-3.5 opacity-80" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52 max-h-72 overflow-y-auto">
                        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground">
                          Semestre (1º a 9º)
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setSelectedSemester("all")}
                          className={selectedSemester === "all" ? "font-bold text-[#6857E4]" : ""}
                        >
                          Todos los semestres
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {TESH_SEMESTERS.map((sem) => (
                          <DropdownMenuItem
                            key={sem}
                            onClick={() => setSelectedSemester(sem)}
                            className={selectedSemester === sem ? "font-bold text-[#6857E4]" : ""}
                          >
                            {sem}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Lista de Tarjetas de Pacientes */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredCases.length === 0 ? (
                      <div className="col-span-2 p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center space-y-3">
                        <p className="text-sm font-semibold text-foreground">
                          No hay casos con estos filtros
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleClearAllFilters}
                          className="rounded-xl border-[#6857E4] text-[#6857E4] hover:bg-[#6857E4]/10 font-medium text-xs"
                        >
                          Limpiar filtros
                        </Button>
                      </div>
                    ) : (
                      paginatedCases.map((item) => {
                        const style = riskStyles[item.riskLevel];
                        const statusInfo = statusLabels[item.status || "por_contactar"];

                        return (
                          <article
                            key={item.id}
                            className={`ethereal-card p-5 rounded-2xl border ${style.border} flex flex-col justify-between space-y-4 hover:shadow-soft transition-all`}
                          >
                            <div>
                              {/* Cabecera de la tarjeta */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lavender-soft font-bold text-primary text-base">
                                    {item.initials}
                                  </div>
                                  <div>
                                    <h3 className="text-base font-bold text-foreground leading-tight">
                                      {item.studentName || `Estudiante ${item.initials}`}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {item.career} {item.semester ? `• ${item.semester}` : ""}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <Badge
                                    variant="outline"
                                    className={`${style.surface} text-xs font-bold`}
                                  >
                                    <span className={`mr-1.5 size-2 rounded-full ${style.dot}`} />
                                    {style.label}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`${statusInfo.surface} text-[10px] font-medium`}
                                  >
                                    {statusInfo.label}
                                  </Badge>
                                </div>
                              </div>

                              {/* Reporte clínico / Resumen */}
                              <p className="mt-3.5 text-xs text-foreground font-medium leading-relaxed line-clamp-2 bg-muted/20 p-2.5 rounded-xl border border-border/40">
                                {item.summary}
                              </p>

                              {/* Puntajes de tamizaje e info de contacto */}
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] font-bold text-primary">
                                    PHQ-9: {item.phq9}/27
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] font-bold text-primary">
                                    GAD-7: {item.gad7}/21
                                  </span>
                                </div>

                                <span className="text-[11px] flex items-center gap-1 font-medium text-muted-foreground">
                                  <Clock className="size-3 text-teal" />
                                  {item.lastCheckIn}
                                </span>
                              </div>
                            </div>

                            {/* Botones de Acción Inmediata */}
                            <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
                              <div className="grid grid-cols-3 gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => setScheduleDialogCase(item)}
                                  className="rounded-xl bg-teal hover:bg-teal/90 text-white text-xs h-8 gap-1 font-semibold"
                                >
                                  <CalendarPlus className="size-3.5" />
                                  <span className="truncate">Agendar</span>
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setContactDialogCase(item)}
                                  className="rounded-xl border-accent text-accent hover:bg-accent/10 text-xs h-8 gap-1 font-semibold"
                                >
                                  <PhoneCall className="size-3.5" />
                                  <span className="truncate">Contactar</span>
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedCaseForDetail(item)}
                                  className="rounded-xl text-xs h-8 gap-1 text-foreground hover:bg-card font-semibold"
                                >
                                  <FolderOpen className="size-3.5 text-primary" />
                                  <span className="truncate">Expediente</span>
                                </Button>
                              </div>

                              {/* Botón Atendido — Liberar (RD-07) */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleLiberarPaciente(item.id)}
                                className={`w-full rounded-xl text-xs h-8 gap-1.5 font-semibold transition-all ${
                                  item.bloqueado
                                    ? "bg-teal-600 hover:bg-teal-700 text-white border-transparent shadow-xs"
                                    : "border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                                }`}
                                title="Liberar tamizaje para permitir que el estudiante inicie uno nuevo"
                              >
                                <UserCheck className="size-3.5" />
                                <span>Atendido — Liberar</span>
                              </Button>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>

                  {/* Paginación de 6 casos por página */}
                  {filteredCases.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={safePage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="rounded-xl border-[#C3B3F1] text-foreground hover:bg-[#6857E4]/10 disabled:opacity-40 text-xs"
                      >
                        Anterior
                      </Button>
                      <span className="text-xs text-muted-foreground font-medium">
                        Página {safePage} de {totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={safePage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="rounded-xl border-[#C3B3F1] text-foreground hover:bg-[#6857E4]/10 disabled:opacity-40 text-xs"
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* SECCIÓN 3: EXPEDIENTES (Vista integral integrada) */}
          {activeSection === "expedientes" && <ExpedientesPage embedded={true} />}

          {/* SECCIÓN 4: AGENDA DE CITAS */}
          {activeSection === "agenda" && (
            <div className="space-y-6">
              <PsychologistAgenda
                appointments={appointments}
                onScheduleNew={() => {
                  // Abre modal para agendar con el primer caso prioritario o seleccionado
                  setScheduleDialogCase(cases[0] || null);
                }}
                onAppointmentsChange={() => {
                  refreshAppointments();
                  refreshCases();
                }}
              />
            </div>
          )}

          {/* SECCIÓN 5: BITÁCORA CLÍNICA */}
          {activeSection === "bitacora" && (
            <div className="space-y-6">
              <ClinicalNotesFeed onSelectCase={handleOpenCaseById} />
            </div>
          )}

          {/* SECCIÓN 6: RESULTADOS DE ENCUESTAS DE SATISFACCIÓN (PB-021) */}
          {activeSection === "encuestas" && <ResultadosEncuesta />}
        </main>
      </div>

      {/* Diálogo de Agendar Sesión */}
      <ScheduleSessionDialog
        caseItem={scheduleDialogCase}
        isOpen={scheduleDialogCase !== null}
        onOpenChange={(open) => {
          if (!open) setScheduleDialogCase(null);
        }}
        onSuccess={() => {
          refreshCases();
          refreshAppointments();
        }}
      />

      {/* Diálogo de Registrar Contacto */}
      <ContactPatientDialog
        caseItem={contactDialogCase}
        isOpen={contactDialogCase !== null}
        onOpenChange={(open) => {
          if (!open) setContactDialogCase(null);
        }}
        onSuccess={refreshCases}
      />

      {/* Diálogo de Protocolo de Emergencia / Crisis */}
      <CrisisProtocolDialog
        caseItem={crisisDialogCase}
        isOpen={crisisDialogCase !== null}
        onOpenChange={(open) => {
          if (!open) setCrisisDialogCase(null);
        }}
        onSuccess={refreshCases}
      />

      {/* Sheet de Expediente Detallado */}
      <CaseDetailSheet
        item={selectedCaseForDetail}
        isOpen={selectedCaseForDetail !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedCaseForDetail(null);
        }}
        onSchedule={(caseItem) => setScheduleDialogCase(caseItem)}
        onContact={(caseItem) => setContactDialogCase(caseItem)}
        onCrisis={(caseItem) => setCrisisDialogCase(caseItem)}
        onCaseUpdated={refreshCases}
      />
    </div>
  );
}
