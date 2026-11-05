import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  AlertTriangle,
  FolderOpen,
  UserCheck,
  RefreshCw,
  Users,
  AlertCircle,
  Clock,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  Mic,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { EscucharVozNota } from "@/components/voz/EscucharVozNota";
import { NotasVozModal } from "./notas-voz-modal";
import { ExpedienteClinico } from "./ExpedienteClinico";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface PacienteParaPsicologo {
  folio: string;
  iniciales: string;
  edad?: number | null;
  sexo?: string | null;
  semestre?: string | number | null;
  carrera?: string | null;
  grupo?: string | null;
  ultimo_nivel?: "rojo" | "amarillo" | "verde" | string | null;
  gad7_total?: number | null;
  phq9_total?: number | null;
  item9?: number | null;
  bloqueado?: boolean | null;
  tiene_alerta_activa?: boolean | null;
  ultimo_tamizaje?: string | null;
  alertas_pendientes?: number | null;
}

export const TESH_CAREERS = [
  "Ing. en Sistemas Computacionales",
  "Ing. Industrial",
  "Ing. Civil",
  "Ing. Mecatrónica",
  "Lic. en Administración",
  "Lic. en Biología",
  "Lic. en Gastronomía",
] as const;

const LEVEL_ORDER: Record<string, number> = {
  rojo: 1,
  amarillo: 2,
  verde: 3,
};

function formatFechaTamizaje(fechaStr?: string | null): string {
  if (!fechaStr) return "Sin registro";
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return "Sin registro";
    return format(d, "dd MMM yyyy", { locale: es });
  } catch {
    return "Sin registro";
  }
}

export function SemaforoPacientes() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pacientes, setPacientes] = useState<PacienteParaPsicologo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [nivelFilter, setNivelFilter] = useState<"todos" | "rojo" | "amarillo" | "verde">("todos");
  const [carreraFilter, setCarreraFilter] = useState<string>("todas");

  // Estado del modal de confirmación de liberación
  const [pacienteALiberar, setPacienteALiberar] = useState<PacienteParaPsicologo | null>(null);
  const [isLiberando, setIsLiberando] = useState<boolean>(false);

  // Estado del modal de notas de voz del paciente
  const [pacienteParaNotas, setPacienteParaNotas] = useState<PacienteParaPsicologo | null>(null);

  // Estado del modal de Expediente Clínico de 5 páginas
  const [pacienteParaExpediente, setPacienteParaExpediente] =
    useState<PacienteParaPsicologo | null>(null);

  const fetchPacientes = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Consulta oficial a la vista para_psicologo
      const { data, error } = await supabase
        .from("para_psicologo")
        .select("*")
        .order("ultimo_nivel");

      if (error) {
        throw error;
      }

      setPacientes((data as PacienteParaPsicologo[]) || []);
    } catch (err: unknown) {
      console.warn("Aviso al consultar vista para_psicologo:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "No fue posible conectar con la vista institucional de pacientes.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  // Ordenamiento con prioridad estricta:
  // 1. Rojo > Amarillo > Verde
  // 2. Alertas pendientes DESC
  // 3. Último tamizaje DESC
  const pacientesOrdenados = useMemo(() => {
    const sorted = [...pacientes].sort((a, b) => {
      const orderA = LEVEL_ORDER[a.ultimo_nivel?.toLowerCase() || ""] ?? 4;
      const orderB = LEVEL_ORDER[b.ultimo_nivel?.toLowerCase() || ""] ?? 4;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      const alertasA = a.alertas_pendientes ?? 0;
      const alertasB = b.alertas_pendientes ?? 0;
      if (alertasA !== alertasB) {
        return alertasB - alertasA;
      }

      const timeA = a.ultimo_tamizaje ? new Date(a.ultimo_tamizaje).getTime() : 0;
      const timeB = b.ultimo_tamizaje ? new Date(b.ultimo_tamizaje).getTime() : 0;
      return timeB - timeA;
    });

    return sorted;
  }, [pacientes]);

  // Filtrado por buscador, nivel y carrera
  const pacientesFiltrados = useMemo(() => {
    return pacientesOrdenados.filter((p) => {
      // Filtro de búsqueda (folio o iniciales)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesFolio = (p.folio || "").toLowerCase().includes(query);
        const matchesIniciales = (p.iniciales || "").toLowerCase().includes(query);
        if (!matchesFolio && !matchesIniciales) {
          return false;
        }
      }

      // Filtro de nivel
      if (nivelFilter !== "todos") {
        if ((p.ultimo_nivel || "").toLowerCase() !== nivelFilter) {
          return false;
        }
      }

      // Filtro de carrera
      if (carreraFilter !== "todas") {
        if (p.carrera !== carreraFilter) {
          return false;
        }
      }

      return true;
    });
  }, [pacientesOrdenados, searchTerm, nivelFilter, carreraFilter]);

  // Handler para ejecutar la función RPC liberar_paciente
  const handleConfirmLiberar = async () => {
    if (!pacienteALiberar) return;

    try {
      setIsLiberando(true);
      const { data, error } = await supabase.rpc("liberar_paciente", {
        p_folio: pacienteALiberar.folio,
      });

      if (error) {
        console.error("Error en RPC liberar_paciente:", error);
        toast.error("No se pudo liberar. Verifica permisos.");
        return;
      }

      if (data === true) {
        toast.success(
          `Paciente ${pacienteALiberar.iniciales} liberado con éxito. Puede realizar nuevo tamizaje.`,
        );
        setPacienteALiberar(null);
        await fetchPacientes();
      } else {
        toast.error("No se pudo liberar. Verifica permisos.");
      }
    } catch (err) {
      console.error("Fallo inesperado al liberar paciente:", err);
      toast.error("No se pudo liberar. Verifica permisos.");
    } finally {
      setIsLiberando(false);
    }
  };

  const conteoPorNivel = useMemo(() => {
    const rojos = pacientes.filter((p) => p.ultimo_nivel?.toLowerCase() === "rojo").length;
    const amarillos = pacientes.filter((p) => p.ultimo_nivel?.toLowerCase() === "amarillo").length;
    const verdes = pacientes.filter((p) => p.ultimo_nivel?.toLowerCase() === "verde").length;
    return { rojos, amarillos, verdes, total: pacientes.length };
  }, [pacientes]);

  return (
    <div className="space-y-6">
      {/* Encabezado del Semáforo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#6857E4]/15 text-[#6857E4]">
              <Users className="size-4" />
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Semáforo de Pacientes
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Monitoreo clínico continuo, triaje preventivo y liberación de tamizajes para el área de
            psicología.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchPacientes}
            disabled={isLoading}
            className="rounded-xl border-border bg-card text-xs font-semibold text-foreground shadow-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-[#6857E4]"
            aria-label="Actualizar listado de pacientes"
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Buscador */}
        <div className="relative md:col-span-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por folio (ej. EQ-9374) o iniciales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl border-border bg-card text-xs sm:text-sm text-foreground focus-visible:ring-2 focus-visible:ring-[#6857E4]"
            aria-label="Buscar pacientes por folio o iniciales"
          />
        </div>

        {/* Selector de Nivel */}
        <div className="md:col-span-4 flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setNivelFilter("todos")}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6857E4] ${
              nivelFilter === "todos"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Ver todos los niveles"
          >
            Todos ({conteoPorNivel.total})
          </button>
          <button
            type="button"
            onClick={() => setNivelFilter("rojo")}
            className={`flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6857E4] ${
              nivelFilter === "rojo"
                ? "bg-[#FF9CED] text-white shadow-xs"
                : "text-[#FF9CED] hover:bg-[#FF9CED]/10"
            }`}
            aria-label="Filtrar por nivel rojo"
          >
            <span className="size-2 rounded-full bg-current" />
            Rojo ({conteoPorNivel.rojos})
          </button>
          <button
            type="button"
            onClick={() => setNivelFilter("amarillo")}
            className={`flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6857E4] ${
              nivelFilter === "amarillo"
                ? "bg-[#A9DB1B] text-white shadow-xs"
                : "text-[#A9DB1B] hover:bg-[#A9DB1B]/10"
            }`}
            aria-label="Filtrar por nivel amarillo"
          >
            <span className="size-2 rounded-full bg-current" />
            Amarillo ({conteoPorNivel.amarillos})
          </button>
          <button
            type="button"
            onClick={() => setNivelFilter("verde")}
            className={`flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6857E4] ${
              nivelFilter === "verde"
                ? "bg-[#12BDB6] text-white shadow-xs"
                : "text-[#12BDB6] hover:bg-[#12BDB6]/10"
            }`}
            aria-label="Filtrar por nivel verde"
          >
            <span className="size-2 rounded-full bg-current" />
            Verde ({conteoPorNivel.verdes})
          </button>
        </div>

        {/* Filtro por Carrera */}
        <div className="md:col-span-3">
          <Select value={carreraFilter} onValueChange={setCarreraFilter}>
            <SelectTrigger
              className="rounded-xl border-border bg-card text-xs text-foreground focus:ring-[#6857E4]"
              aria-label="Filtrar por carrera del TESH"
            >
              <SelectValue placeholder="Todas las carreras" />
            </SelectTrigger>
            <SelectContent className="max-h-64 rounded-xl border-border bg-card">
              <SelectItem value="todas" className="text-xs">
                Todas las carreras (7)
              </SelectItem>
              {TESH_CAREERS.map((carrera) => (
                <SelectItem key={carrera} value={carrera} className="text-xs">
                  {carrera}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ESTADO 1: CARGANDO (SKELETON CON 5 FILAS) */}
      {isLoading && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 border-b border-border/40 py-2.5 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                  <Skeleton className="h-4 w-24 hidden md:block" />
                  <Skeleton className="h-6 w-16 rounded-lg hidden lg:block" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24 rounded-xl" />
                    <Skeleton className="h-8 w-28 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ESTADO 2: ERROR */}
      {!isLoading && errorMessage && (
        <Card className="rounded-2xl border-pink-300 dark:border-pink-800/60 bg-pink-50/50 dark:bg-pink-950/20 shadow-xs">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-6 text-pink-500 dark:text-pink-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Error al cargar la vista de pacientes
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={fetchPacientes}
              className="rounded-xl bg-[#1B198F] text-xs font-bold text-white hover:bg-[#1B198F]/90 shadow-xs shrink-0"
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ESTADO 3: VACÍO */}
      {!isLoading && !errorMessage && pacientesFiltrados.length === 0 && (
        <Card className="rounded-3xl border border-dashed border-border/80 bg-card/60 p-8 text-center shadow-xs">
          <CardContent className="flex flex-col items-center justify-center space-y-3 py-6">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-7" />
            </div>
            <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
              No hay pacientes para mostrar
            </h3>
            <p className="max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {searchTerm || nivelFilter !== "todos" || carreraFilter !== "todas"
                ? "Ningún registro coincide con los filtros aplicados. Intenta restablecer los parámetros de búsqueda."
                : "Actualmente no existen registros en la vista clínica de pacientes del TESH."}
            </p>
            {(searchTerm || nivelFilter !== "todos" || carreraFilter !== "todas") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setNivelFilter("todos");
                  setCarreraFilter("todas");
                }}
                className="mt-2 rounded-xl border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ESTADO 4: TABLA EN DESKTOP (RESPONSIVE) */}
      {!isLoading && !errorMessage && pacientesFiltrados.length > 0 && (
        <>
          {/* Vista Desktop (Tabla) */}
          <div className="hidden md:block rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border/80 hover:bg-transparent">
                  <TableHead className="py-3.5 pl-4 text-xs font-bold text-foreground">
                    Paciente
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-bold text-foreground">
                    Carrera y Semestre
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-bold text-foreground text-center">
                    Nivel
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-bold text-foreground text-center">
                    GAD-7 / PHQ-9 / Ítem 9
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-bold text-foreground text-center">
                    Estado
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-bold text-foreground text-center">
                    Alertas
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-bold text-foreground">
                    Último Tamizaje
                  </TableHead>
                  <TableHead className="py-3.5 pr-4 text-xs font-bold text-foreground text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-border/60">
                {pacientesFiltrados.map((paciente) => {
                  const nivelLower = (paciente.ultimo_nivel || "").toLowerCase();
                  const isBloqueado = Boolean(paciente.bloqueado);
                  const tieneItem9 = (paciente.item9 ?? 0) > 0;
                  const alertasNum = paciente.alertas_pendientes ?? 0;

                  return (
                    <TableRow
                      key={paciente.folio}
                      className="transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
                    >
                      {/* Paciente */}
                      <TableCell className="py-3 pl-4">
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-bold text-foreground">
                            {paciente.iniciales || "Estudiante"}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                            {paciente.folio}
                          </span>
                        </div>
                      </TableCell>

                      {/* Carrera y Semestre */}
                      <TableCell className="py-3">
                        <div className="flex flex-col max-w-[210px]">
                          <span className="text-xs font-medium text-foreground truncate">
                            {paciente.carrera || "Carrera no registrada"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {paciente.semestre
                              ? `${paciente.semestre}º Semestre`
                              : "Semestre no especificado"}
                            {paciente.grupo ? ` · Grupo ${paciente.grupo}` : ""}
                          </span>
                        </div>
                      </TableCell>

                      {/* Nivel */}
                      <TableCell className="py-3 text-center">
                        {nivelLower === "rojo" ? (
                          <Badge
                            variant="outline"
                            className="rounded-lg border-[#FF9CED]/40 bg-[#FF9CED]/15 px-2.5 py-1 text-[11px] font-bold text-[#FF9CED]"
                          >
                            <span className="mr-1.5 size-2 rounded-full bg-[#FF9CED]" />
                            Rojo (Alto)
                          </Badge>
                        ) : nivelLower === "amarillo" ? (
                          <Badge
                            variant="outline"
                            className="rounded-lg border-[#A9DB1B]/40 bg-[#A9DB1B]/15 px-2.5 py-1 text-[11px] font-bold text-[#A9DB1B]"
                          >
                            <span className="mr-1.5 size-2 rounded-full bg-[#A9DB1B]" />
                            Amarillo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-lg border-[#12BDB6]/40 bg-[#12BDB6]/15 px-2.5 py-1 text-[11px] font-bold text-[#12BDB6]"
                          >
                            <span className="mr-1.5 size-2 rounded-full bg-[#12BDB6]" />
                            Verde
                          </Badge>
                        )}
                      </TableCell>

                      {/* GAD-7 / PHQ-9 / Item 9 */}
                      <TableCell className="py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 px-2 py-1 text-xs">
                          <span className="font-semibold text-foreground" title="Total GAD-7">
                            G: {paciente.gad7_total ?? 0}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-semibold text-foreground" title="Total PHQ-9">
                            P: {paciente.phq9_total ?? 0}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span
                            title="Ítem 9 (Ideación/autolesión)"
                            className={`font-bold ${
                              tieneItem9 ? "text-[#FF9CED]" : "text-muted-foreground"
                            }`}
                          >
                            Ítem 9: {paciente.item9 ?? 0}
                          </span>
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="py-3 text-center">
                        {isBloqueado ? (
                          <Badge
                            variant="outline"
                            className="rounded-lg border-[#A9DB1B]/40 bg-[#A9DB1B]/15 px-2 py-0.5 text-[10px] font-bold text-[#A9DB1B]"
                          >
                            En revisión
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-lg border-[#12BDB6]/40 bg-[#12BDB6]/15 px-2 py-0.5 text-[10px] font-bold text-[#12BDB6]"
                          >
                            Atendido
                          </Badge>
                        )}
                      </TableCell>

                      {/* Alertas */}
                      <TableCell className="py-3 text-center">
                        {alertasNum > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 font-bold text-[#FF9CED] text-xs"
                            title={`${alertasNum} alerta(s) activa(s)`}
                          >
                            <AlertTriangle className="size-3.5" />
                            {alertasNum}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">0</span>
                        )}
                      </TableCell>

                      {/* Último Tamizaje */}
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-muted-foreground/80" />
                          {formatFechaTamizaje(paciente.ultimo_tamizaje)}
                        </span>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPacienteParaNotas(paciente)}
                            className="h-8 rounded-xl border-border bg-card px-2.5 text-xs font-semibold text-foreground shadow-xs hover:bg-[#6857E4]/10 hover:text-[#6857E4] focus-visible:ring-2 focus-visible:ring-[#6857E4]"
                            aria-label={`Ver y escuchar notas de voz del paciente ${paciente.iniciales || paciente.folio}`}
                            title="Ver y escuchar notas de voz del estudiante"
                          >
                            <Mic className="mr-1.5 size-3.5 text-[#6857E4]" />
                            <span>Notas de voz</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPacienteParaExpediente(paciente)}
                            className="h-8 rounded-xl border-border bg-card px-2.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-[#6857E4]"
                            aria-label={`Ver expediente del paciente ${paciente.iniciales || paciente.folio}`}
                          >
                            <FolderOpen className="mr-1.5 size-3.5 text-[#1B198F]" />
                            <span>Ver expediente</span>
                          </Button>

                          {isBloqueado && (
                            <Button
                              size="sm"
                              onClick={() => setPacienteALiberar(paciente)}
                              className="h-8 rounded-xl bg-[#12BDB6] px-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#12BDB6]/90 focus-visible:ring-2 focus-visible:ring-[#12BDB6]"
                              aria-label={`Liberar paciente ${paciente.iniciales || paciente.folio}`}
                            >
                              <UserCheck className="mr-1.5 size-3.5" />
                              <span>Atendido — Liberar</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Vista Móvil (Cards) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {pacientesFiltrados.map((paciente) => {
              const nivelLower = (paciente.ultimo_nivel || "").toLowerCase();
              const isBloqueado = Boolean(paciente.bloqueado);
              const tieneItem9 = (paciente.item9 ?? 0) > 0;
              const alertasNum = paciente.alertas_pendientes ?? 0;

              return (
                <Card
                  key={paciente.folio}
                  className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {paciente.iniciales || "Estudiante"}
                      </h4>
                      <p className="font-mono text-xs text-muted-foreground">{paciente.folio}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {nivelLower === "rojo" ? (
                        <Badge className="border-[#FF9CED]/40 bg-[#FF9CED]/15 text-[10px] font-bold text-[#FF9CED]">
                          Rojo (Alto)
                        </Badge>
                      ) : nivelLower === "amarillo" ? (
                        <Badge className="border-[#A9DB1B]/40 bg-[#A9DB1B]/15 text-[10px] font-bold text-[#A9DB1B]">
                          Amarillo
                        </Badge>
                      ) : (
                        <Badge className="border-[#12BDB6]/40 bg-[#12BDB6]/15 text-[10px] font-bold text-[#12BDB6]">
                          Verde
                        </Badge>
                      )}

                      {isBloqueado ? (
                        <span className="text-[10px] font-bold text-[#A9DB1B]">En revisión</span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#12BDB6]">Atendido</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="text-foreground font-medium flex items-center gap-1.5">
                      <GraduationCap className="size-3.5 text-primary" />
                      {paciente.carrera || "Carrera no registrada"}
                    </p>
                    <p className="pl-5 text-[11px]">
                      {paciente.semestre ? `${paciente.semestre}º Semestre` : "Sin semestre"}
                      {paciente.grupo ? ` · Grupo ${paciente.grupo}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-foreground">
                        GAD-7: {paciente.gad7_total ?? 0}
                      </span>
                      <span className="text-[11px] font-semibold text-foreground">
                        PHQ-9: {paciente.phq9_total ?? 0}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          tieneItem9 ? "text-[#FF9CED]" : "text-muted-foreground"
                        }`}
                      >
                        Ít.9: {paciente.item9 ?? 0}
                      </span>
                    </div>

                    {alertasNum > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF9CED]">
                        <AlertTriangle className="size-3" />
                        {alertasNum} alerta(s)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatFechaTamizaje(paciente.ultimo_tamizaje)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPacienteParaNotas(paciente)}
                        className="h-7 rounded-lg border-border text-[11px] font-semibold px-2 hover:bg-[#6857E4]/10 hover:text-[#6857E4]"
                        aria-label={`Ver notas de voz de ${paciente.iniciales}`}
                        title="Notas de voz"
                      >
                        <Mic className="mr-1 size-3 text-[#6857E4]" />
                        <span>Notas</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPacienteParaExpediente(paciente)}
                        className="h-7 rounded-lg border-border text-[11px] font-semibold px-2"
                        aria-label={`Ver expediente de ${paciente.iniciales}`}
                      >
                        Expediente
                      </Button>

                      {isBloqueado && (
                        <Button
                          size="sm"
                          onClick={() => setPacienteALiberar(paciente)}
                          className="h-7 rounded-lg bg-[#12BDB6] text-white text-[11px] font-bold px-2 hover:bg-[#12BDB6]/90"
                          aria-label={`Liberar paciente ${paciente.iniciales}`}
                        >
                          Liberar
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN DE LIBERACIÓN CLÍNICA */}
      <Dialog
        open={Boolean(pacienteALiberar)}
        onOpenChange={(open) => {
          if (!open) setPacienteALiberar(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#12BDB6]/15 text-[#12BDB6]">
              <UserCheck className="size-5" />
            </div>
            <DialogTitle className="font-display text-base sm:text-lg font-bold text-foreground">
              ¿Confirmas que atendiste a {pacienteALiberar?.iniciales}?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Folio: <strong className="text-foreground">{pacienteALiberar?.folio}</strong>
              <br />
              Al confirmar, se invocará la función institucional de liberación (RD-07) registrada en
              bloques de auditoría y se habilitará al estudiante para realizar un nuevo tamizaje
              cuando lo requiera.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isLiberando}
              onClick={() => setPacienteALiberar(null)}
              className="rounded-xl border-border text-xs font-semibold text-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isLiberando}
              onClick={handleConfirmLiberar}
              className="rounded-xl bg-[#12BDB6] text-xs font-bold text-white hover:bg-[#12BDB6]/90 shadow-xs focus-visible:ring-2 focus-visible:ring-[#12BDB6]"
            >
              {isLiberando ? (
                <>
                  <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                  Liberando...
                </>
              ) : (
                <>
                  <UserCheck className="mr-1.5 size-3.5" />
                  Confirmar atención y liberar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE NOTAS DE VOZ CON REPRODUCTOR ESPECÍFICO */}
      <NotasVozModal
        paciente={pacienteParaNotas}
        open={Boolean(pacienteParaNotas)}
        onOpenChange={(open) => {
          if (!open) setPacienteParaNotas(null);
        }}
      />

      {/* MODAL DEL EXPEDIENTE CLÍNICO OFICIAL DE 5 PÁGINAS */}
      <Dialog
        open={Boolean(pacienteParaExpediente)}
        onOpenChange={(open) => {
          if (!open) setPacienteParaExpediente(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-2 sm:p-4 sm:rounded-3xl border-[#C3B3F1] bg-card">
          <DialogHeader className="px-4 pt-2">
            <DialogTitle className="sr-only">
              Expediente Clínico de{" "}
              {pacienteParaExpediente?.iniciales || pacienteParaExpediente?.folio}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formato clínico oficial de 5 páginas de historia clínica, tamizajes y seguimiento
            </DialogDescription>
          </DialogHeader>
          {pacienteParaExpediente && (
            <ExpedienteClinico
              folio={pacienteParaExpediente.folio}
              onClose={() => setPacienteParaExpediente(null)}
              onPacienteLiberado={() => {
                fetchPacientes();
                setPacienteParaExpediente(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
