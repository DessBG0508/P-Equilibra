import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Search,
  ChevronDown,
  Printer,
  FileText,
  PhoneCall,
  User,
  GraduationCap,
  Calendar,
  AlertTriangle,
  Clock,
  LogOut,
  FolderOpen,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getPsychologistCases,
  getCaseNotes,
  savePsychologistCases,
} from "@/lib/psychologist-store";
import type { CaseSummary, RiskLevel, ClinicalNote } from "@/lib/types";
import { BRAND } from "@/lib/branding";

import { CaseDetailSheet } from "./case-detail-sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ContactPatientDialog } from "./contact-patient-dialog";
import { ScheduleSessionDialog } from "./schedule-session-dialog";
import { CrisisProtocolDialog } from "./crisis-protocol-dialog";

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

const PAGE_SIZE = 8;

const riskStyles: Record<
  RiskLevel,
  { label: string; dot: string; surface: string; badgeClass: string }
> = {
  rojo: {
    label: "Riesgo alto",
    dot: "bg-pink-400",
    surface:
      "bg-pink-50/80 text-pink-700 border-pink-200 dark:bg-pink-950/20 dark:text-pink-300 dark:border-pink-800/50",
    badgeClass: "bg-[#FF9CED]/20 text-[#FF9CED] border-[#FF9CED]/40",
  },
  amarillo: {
    label: "Seguimiento",
    dot: "bg-lime-500",
    surface:
      "bg-lime-50/80 text-lime-800 border-lime-200 dark:bg-lime-950/20 dark:text-lime-300 dark:border-lime-900/50",
    badgeClass: "bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-950/40 dark:text-lime-300",
  },
  verde: {
    label: "Estable",
    dot: "bg-teal-500",
    surface:
      "bg-teal-50/80 text-teal-800 border-teal-200 dark:bg-teal-950/20 dark:text-teal-300 dark:border-teal-900/50",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300",
  },
};

const chipClass = (isActive: boolean) =>
  `inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0 cursor-pointer ${
    isActive
      ? "bg-[#6857E4] text-white border-[#6857E4] shadow-sm hover:bg-[#6857E4]"
      : "bg-white dark:bg-card text-foreground border-[#C3B3F1] hover:border-[#6857E4]/60 hover:bg-[#6857E4]/5"
  }`;

export interface ExpedientesPageProps {
  embedded?: boolean;
}

export function ExpedientesPage({ embedded = false }: ExpedientesPageProps = {}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Estados de datos
  const [cases, setCases] = useState<CaseSummary[]>(() =>
    getPsychologistCases().filter((c) => c.modo_acompanamiento === true),
  );

  // Filtros
  const [activeRiskFilter, setActiveRiskFilter] = useState<RiskLevel | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modales
  const [viewingCase, setViewingCase] = useState<CaseSummary | null>(null);
  const [contactingCase, setContactingCase] = useState<CaseSummary | null>(null);
  const [schedulingCase, setSchedulingCase] = useState<CaseSummary | null>(null);
  const [crisisCase, setCrisisCase] = useState<CaseSummary | null>(null);

  // Estado para impresión PDF
  const [printingCase, setPrintingCase] = useState<CaseSummary | null>(null);
  const [printingNotes, setPrintingNotes] = useState<ClinicalNote[]>([]);

  const refreshCases = useCallback(() => {
    const updated = getPsychologistCases().filter((c) => c.modo_acompanamiento === true);
    setCases(updated);
  }, []);

  useEffect(() => {
    refreshCases();
  }, [refreshCases]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeRiskFilter, selectedCareer, selectedSemester, searchQuery]);

  const handleLogout = () => {
    logout();
    toast.info("Has cerrado sesión como profesional.");
    navigate({ to: "/login", replace: true });
  };

  // Filtrado combinable (AND)
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

      // 4. Búsqueda por texto (nombre, matrícula, carrera, semestre, motivo)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        (item.studentName && item.studentName.toLowerCase().includes(query)) ||
        (item.matricula && item.matricula.toLowerCase().includes(query)) ||
        (item.initials && item.initials.toLowerCase().includes(query)) ||
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

  // Preparar y disparar exportación PDF (Vista de Impresión)
  const handleExportPdf = (caseItem: CaseSummary) => {
    setPrintingCase(caseItem);
    const notes = getCaseNotes(caseItem.id);
    setPrintingNotes(notes);

    toast.info("Preparando vista de impresión del expediente...", {
      description: `Generando documento clínico confidencial de ${caseItem.studentName || caseItem.initials}`,
    });

    // Pequeño timeout para permitir que el DOM renderice la plantilla de impresión
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const content = (
    <>
      {/* ============================================================ */}
      {/* VISTA EN PANTALLA (Se oculta durante @media print) */}
      {/* ============================================================ */}
      <div className="print:hidden space-y-6">
        {/* Encabezado Institucional del Panel Psicólogo */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 sm:py-6 border-b border-border/60">
          <div className="min-w-0">
            {!embedded && (
              <div className="flex items-center gap-2 mb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/psicologo" })}
                  className="h-7 px-2 text-xs font-semibold text-[#6857E4] hover:bg-[#6857E4]/10 -ml-2 gap-1 rounded-lg"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Volver al panel</span>
                </Button>
                <span className="text-muted-foreground/40">•</span>
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal flex items-center gap-1.5">
                  <span className="inline-block size-1.5 rounded-full bg-teal" />
                  Servicio de Acompañamiento Psicológico TESH
                </p>
              </div>
            )}
            <h1 className="font-display text-2xl sm:text-3xl text-primary font-bold">
              Expedientes Clínicos de Acompañamiento
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consulta confidencial, seguimiento integral y exportación oficial de expedientes
              estudiantiles.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/psicologo" })}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border-[#C3B3F1] text-xs font-semibold hover:bg-[#6857E4]/10"
            >
              <ArrowLeft className="size-3.5" />
              <span>Regresar a Casos</span>
            </Button>

            <ThemeToggle />

            {/* Menú de Usuario Psicólogo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Menú de psicólogo"
                >
                  <Avatar className="size-11 border-2 border-teal/40 shadow-soft">
                    <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                      {user?.name
                        ?.split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("") || "MG"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 border-border bg-card">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {user?.name || "Dra. Marta Gómez"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email || "dra.marta@tesh.mx"}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1 w-fit bg-teal/10 text-teal border-teal/20 text-[10px] font-bold"
                    >
                      Psicóloga Clínica TESH
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/psicologo" })}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <FolderOpen className="size-3.5 text-[#6857E4]" />
                  <span>Panel Clínico Principal</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive gap-2 text-xs"
                >
                  <LogOut className="size-3.5" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ============================================================ */}
        {/* BARRA SUPERIOR: BUSCADOR + CHIPS DE FILTRO */}
        {/* ============================================================ */}
        <section className="space-y-3" aria-label="Controles de búsqueda y filtros">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Buscador */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, matrícula (ej. 2023-TESH), carrera o motivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-card border-border/70 focus-visible:ring-[#6857E4] text-xs sm:text-sm"
              />
            </div>

            {/* Contador en tiempo real y botón reset */}
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <span className="text-xs text-muted-foreground font-semibold">
                Mostrando {filteredCases.length} de {cases.length} expedientes
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

          {/* Chips de Filtro */}
          <div className="flex flex-wrap items-center gap-2 pt-1" aria-label="Filtros avanzados">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Riesgo:</span>
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
                  <span>{selectedCareer === "all" ? "Carrera: Todas" : selectedCareer}</span>
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
                  <span>{selectedSemester === "all" ? "Semestre: Todos" : selectedSemester}</span>
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
        </section>

        {/* ============================================================ */}
        {/* LISTADO DE EXPEDIENTES (FILA COMPACTA) */}
        {/* ============================================================ */}
        <section aria-label="Lista de expedientes clínicos">
          {filteredCases.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center space-y-3">
              <p className="text-sm font-semibold text-foreground">
                No hay casos con estos filtros
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                No se encontraron expedientes con los criterios seleccionados. Puedes restablecer la
                búsqueda o los filtros aplicados.
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
            <div className="space-y-2.5">
              {paginatedCases.map((item) => {
                const style = riskStyles[item.riskLevel];

                return (
                  <article
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-[#6857E4]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    {/* Bloque principal del estudiante */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      {/* Iniciales anónimas */}
                      <div className="size-10 sm:size-11 rounded-xl bg-[#6857E4]/10 border border-[#6857E4]/20 flex items-center justify-center font-display font-bold text-sm text-[#6857E4] shrink-0">
                        {item.initials}
                      </div>

                      {/* Info condensada */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {item.studentName || item.initials}
                          </span>
                          {item.matricula && (
                            <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/50">
                              {item.matricula}
                            </span>
                          )}

                          {/* Chip semaforizado de riesgo */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${style.badgeClass}`}
                          >
                            <span className={`size-1.5 rounded-full ${style.dot}`} />
                            {style.label}
                          </span>

                          <span className="text-xs text-muted-foreground/70 hidden lg:inline">
                            •
                          </span>

                          {/* Carrera y Semestre */}
                          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <GraduationCap className="size-3 text-muted-foreground" />
                            {item.career || "TESH"} — {item.semester || "Regular"}
                          </span>
                        </div>

                        {/* Motivo resumido y último check-in */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                          <p className="text-foreground/80 line-clamp-1 italic">
                            &ldquo;{item.summary}&rdquo;
                          </p>
                          <span className="hidden sm:inline text-muted-foreground/50">•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium shrink-0">
                            <Clock className="size-3 text-muted-foreground" />
                            Check-in: {item.lastCheckIn}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones: [Ver expediente] [Exportar PDF] [Canalizar] */}
                    <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/50 shrink-0 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingCase(item)}
                        className="h-8 px-2.5 rounded-xl border-[#C3B3F1] text-xs font-semibold text-foreground hover:bg-[#6857E4]/10 hover:text-[#6857E4] gap-1"
                        title="Abrir expediente clínico completo"
                      >
                        <FileText className="size-3.5 text-[#6857E4]" />
                        <span>Ver expediente</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPdf(item)}
                        className="h-8 px-2.5 rounded-xl border-border text-xs font-medium text-foreground hover:bg-muted gap-1"
                        title="Exportar resumen a PDF / Vista de impresión"
                      >
                        <Printer className="size-3.5 text-muted-foreground" />
                        <span>Exportar PDF</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setContactingCase(item)}
                        className="h-8 px-3 rounded-xl bg-[#6857E4] hover:bg-[#6857E4] text-white text-xs font-semibold gap-1 shadow-xs"
                        title="Registrar contacto y canalizar a bitácora"
                      >
                        <PhoneCall className="size-3.5" />
                        <span>Canalizar</span>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ============================================================ */}
          {/* PAGINACIÓN (8 casos por página) */}
          {/* ============================================================ */}
          {filteredCases.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border-[#C3B3F1] text-foreground hover:bg-[#6857E4]/10 disabled:opacity-40 text-xs gap-1"
              >
                <ChevronLeft className="size-3.5" />
                <span>Anterior</span>
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
                className="rounded-xl border-[#C3B3F1] text-foreground hover:bg-[#6857E4]/10 disabled:opacity-40 text-xs gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* ============================================================ */}
      {/* VISTA DE IMPRESIÓN PARA @media print */}
      {/* ============================================================ */}
      {printingCase && (
        <div
          id="print-expediente-document"
          className="hidden print:block font-sans text-slate-900 bg-white p-4 max-w-4xl mx-auto"
        >
          {/* Encabezado Institucional Equilibra */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                  Tecnológico de Estudios Superiores de Huixquilucan
                </p>
                <h1 className="text-2xl font-bold text-slate-950 font-display mt-0.5">
                  {BRAND.name.toUpperCase()} — Sistema de Acompañamiento Psicológico
                </h1>
                <p className="text-xs text-slate-700 font-medium">
                  Expediente de Acompañamiento y Tamizaje de Bienestar Estudiantil
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block border border-slate-900 px-2 py-0.5 text-xs font-mono font-bold bg-slate-100">
                  EXP-{printingCase.id.toUpperCase()}-2026
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Folio institucional oficial</p>
              </div>
            </div>
          </div>

          {/* Datos del Estudiante */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 border-b border-slate-200 pb-1">
              1. Ficha del Estudiante
            </h2>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
              <div>
                <span className="font-semibold text-slate-700">Nombre completo: </span>
                <span className="font-bold text-slate-900">
                  {printingCase.studentName || "Confidencial"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Iniciales anónimas: </span>
                <span className="font-bold text-slate-900">{printingCase.initials}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Matrícula TESH: </span>
                <span className="font-mono font-bold text-slate-900">
                  {printingCase.matricula || "2026-TESH-S/M"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Carrera: </span>
                <span className="text-slate-900">{printingCase.career || "No especificada"}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Semestre: </span>
                <span className="text-slate-900">{printingCase.semester || "Regular"}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Último check-in: </span>
                <span className="text-slate-900">{printingCase.lastCheckIn}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Nivel de riesgo clínico: </span>
                <span className="font-bold uppercase text-slate-950">
                  {riskStyles[printingCase.riskLevel].label}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Estatus actual: </span>
                <span className="capitalize text-slate-900">
                  {printingCase.status?.replace("_", " ") || "En seguimiento"}
                </span>
              </div>
            </div>
          </div>

          {/* Puntajes PHQ-9 / GAD-7 y Nota de Tamizaje */}
          <div className="mb-6 border border-slate-300 rounded-lg p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 border-b border-slate-200 pb-1">
              2. Resultados de Tamizaje Psicométrico
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs mb-3">
              <div className="border border-slate-200 rounded p-3 bg-white">
                <p className="font-bold text-slate-900 text-sm">Escala PHQ-9 (Depresión)</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-950">
                    {printingCase.phq9}
                  </span>
                  <span className="text-slate-500">/ 27 puntos</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {printingCase.phq9 >= 15
                    ? "Sintomatología moderadamente severa"
                    : printingCase.phq9 >= 10
                      ? "Sintomatología moderada"
                      : printingCase.phq9 >= 5
                        ? "Sintomatología leve"
                        : "Mínima o sin sintomatología"}
                </p>
              </div>

              <div className="border border-slate-200 rounded p-3 bg-white">
                <p className="font-bold text-slate-900 text-sm">Escala GAD-7 (Ansiedad)</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-950">
                    {printingCase.gad7}
                  </span>
                  <span className="text-slate-500">/ 21 puntos</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {printingCase.gad7 >= 15
                    ? "Ansiedad severa"
                    : printingCase.gad7 >= 10
                      ? "Ansiedad moderada"
                      : printingCase.gad7 >= 5
                        ? "Ansiedad leve"
                        : "Mínima o sin ansiedad"}
                </p>
              </div>
            </div>

            {/* NOTA OBLIGATORIA */}
            <div className="bg-lime-50 border-l-4 border-lime-500 p-3 rounded-r text-xs text-lime-950 font-medium">
              <span className="font-bold">Tamizaje orientativo, no diagnóstico.</span> Las escalas
              PHQ-9 y GAD-7 son herramientas psicométricas de cribado inicial destinadas a la
              priorización de apoyo en el entorno universitario de {BRAND.fullName}; no sustituyen
              una evaluación psiquiátrica ni un psicodiagnóstico clínico formal.
            </div>
          </div>

          {/* Resumen de Bitácora y Síntesis de Acompañamiento */}
          <div className="mb-6 border border-slate-200 rounded-lg p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 border-b border-slate-200 pb-1">
              3. Síntesis y Resumen de Bitácora Clínica
            </h2>
            <div className="text-xs text-slate-800 space-y-3">
              <div>
                <p className="font-semibold text-slate-700">
                  Motivo de atención y reporte inicial:
                </p>
                <p className="italic text-slate-900 mt-0.5">&ldquo;{printingCase.summary}&rdquo;</p>
              </div>

              <div>
                <p className="font-semibold text-slate-700">Resumen clínico del acompañamiento:</p>
                <p className="text-slate-900 leading-relaxed mt-0.5">
                  {printingCase.accompanimentSummary}
                </p>
              </div>

              {/* Historial de notas clínicas de bitácora */}
              <div className="pt-2">
                <p className="font-semibold text-slate-700 mb-1.5">
                  Registros asentados en bitácora ({printingNotes.length}):
                </p>
                {printingNotes.length === 0 ? (
                  <p className="text-slate-500 italic text-[11px]">
                    Sin registros adicionales en la bitácora clínica a la fecha.
                  </p>
                ) : (
                  <div className="space-y-2 border-t border-slate-100 pt-2">
                    {printingNotes.map((note) => (
                      <div key={note.id} className="border-l-2 border-slate-400 pl-2 text-[11px]">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-bold text-slate-900">{note.title}</span>
                          <span className="font-mono">{note.date}</span>
                        </div>
                        <p className="text-slate-700 mt-0.5">{note.content}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Por: {note.author} ({note.category})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pie con fecha y confidencialidad */}
          <div className="border-t-2 border-slate-900 pt-4 mt-8 flex items-end justify-between text-[11px] text-slate-600">
            <div>
              <p className="font-bold text-slate-900 uppercase">
                Documento confidencial — uso clínico interno
              </p>
              <p className="mt-0.5">
                Emisión oficial: 23 de septiembre de 2026 • Servicio de Acompañamiento Psicológico
                TESH
              </p>
              <p className="text-[10px] text-slate-500">
                El manejo de esta información se apega al secreto profesional y normativa de datos
                personales.
              </p>
            </div>
            <div className="text-right">
              <div className="w-44 border-b border-slate-400 pb-1 mb-1 text-center font-serif text-xs">
                Dra. Marta Gómez
              </div>
              <p className="text-[10px] text-slate-700 text-center">
                Psicóloga Clínica TESH • Céd. Prof. 8492015
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALES REUTILIZADOS (Sheet de Expediente y Diálogos) */}
      {/* ============================================================ */}
      <CaseDetailSheet
        item={viewingCase}
        isOpen={Boolean(viewingCase)}
        onOpenChange={(open) => !open && setViewingCase(null)}
        onSchedule={(item) => {
          setViewingCase(null);
          setSchedulingCase(item);
        }}
        onContact={(item) => {
          setViewingCase(null);
          setContactingCase(item);
        }}
        onCrisis={(item) => {
          setViewingCase(null);
          setCrisisCase(item);
        }}
        onCaseUpdated={refreshCases}
      />

      <ContactPatientDialog
        caseItem={contactingCase}
        isOpen={Boolean(contactingCase)}
        onOpenChange={(open) => !open && setContactingCase(null)}
        onSuccess={refreshCases}
      />

      <ScheduleSessionDialog
        caseItem={schedulingCase}
        isOpen={Boolean(schedulingCase)}
        onOpenChange={(open) => !open && setSchedulingCase(null)}
        onSuccess={refreshCases}
      />

      <CrisisProtocolDialog
        caseItem={crisisCase}
        isOpen={Boolean(crisisCase)}
        onOpenChange={(open) => !open && setCrisisCase(null)}
        onSuccess={refreshCases}
      />
    </>
  );

  if (embedded) {
    return <div className="space-y-6">{content}</div>;
  }

  return (
    <PageShell showAppHeader={false} showBottomNav={false}>
      {content}
    </PageShell>
  );
}
