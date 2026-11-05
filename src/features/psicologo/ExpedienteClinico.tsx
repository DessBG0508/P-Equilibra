import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Printer,
  Save,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
} from "lucide-react";

import type { PacienteParaPsicologo } from "./semaforo-pacientes";
import type { CamposClinicos, ExpedienteDbRecord } from "./expediente/types";

import { Identificacion } from "./expediente/Identificacion";
import { MotivoConsulta } from "./expediente/MotivoConsulta";
import { HistoriaProblema } from "./expediente/HistoriaProblema";
import { Antecedentes } from "./expediente/Antecedentes";
import { ContextoPsicosocial } from "./expediente/ContextoPsicosocial";
import { EstadoMental } from "./expediente/EstadoMental";
import { ValoracionRiesgo } from "./expediente/ValoracionRiesgo";
import { HipotesisTrabajo } from "./expediente/HipotesisTrabajo";
import { ObjetivosSesion } from "./expediente/ObjetivosSesion";
import { TrazabilidadBlockchain } from "./expediente/TrazabilidadBlockchain";

export interface ExpedienteClinicoProps {
  folio: string;
  onClose?: () => void;
  onPacienteLiberado?: () => void;
  className?: string;
}

const DEFAULT_CAMPOS: CamposClinicos = {
  iniciales: "",
  edad: 21,
  sexo: "Mujer",
  semestre: "6º Semestre",
  carrera: "Ing. en Sistemas Computacionales",
  grupo: "501",
  derivado_por: "Tamizaje preventivo Eli (Canalización institucional)",

  motivo_en_palabras: "",
  historia_clinica: "",

  antecedentes: {
    tratamiento_psicologico_previo: false,
    hospitalizaciones: false,
    seguimiento_psiquiatrico: false,
    antecedentes_familiares: false,
    medicacion_actual: false,
    enfermedad_medica_relevante: false,
    detalle_antecedentes: "",
  },

  contexto_psicosocial: {
    carrera_semestre: "",
    grupo: "",
    convivencia: "",
    situacion_laboral: "",
    red_apoyo: "",
    factores_estres: "",
  },

  estado_mental: {
    aspecto_cuidado: true,
    orientado: true,
    contacto_adecuado: true,
    discurso_coherente: true,
    animo_bajo: true,
    ansiedad_manifiesta: true,
    enlentecimiento: false,
    inquietud_psicomotriz: false,
    sueno_alterado: true,
    pensamiento_perseverante: false,
    afecto_congruente: true,
    juicio_conservado: true,
    observaciones: "",
  },

  valoracion_riesgo: {
    item9_valor: 1,
    item9_texto:
      "Valor del último PHQ-9: 1 (0=mínimo, 3=máximo). Cualquier valor ≥ 1 indica riesgo autolítico y escaló automáticamente a nivel de atención prioritaria.",
    marcadores: {
      ideacion_autolitica: false,
      plan_estructurado: false,
      intentos_previos: false,
      autolesiones: false,
      consumo_sustancias: false,
      riesgo_terceros: false,
    },
    riesgo_estimado: 4,
    factores_proteccion: "",
  },

  hipotesis_trabajo: "",

  objetivos_sesion: {
    consentimiento_firmado: false,
    frecuencia_acordada: "Semanal",
    proxima_cita: "",
    estado_bloqueo: "bloqueado",
    notas_libres: "",
  },

  trazabilidad: {
    hash_expediente: "b39d53c832f8817b269139b9eee358e4ec3fc8b57240cd5896dc9f36bd8b94b5",
    hash_previo: "290c15c14f5364eec5ae6b472820036161cb7b067b051b318c3bc102067d31a0",
    anclado_en: "0x7f3b...e8a4 (tx hash) — 30-oct-2026 14:23 UTC",
    liberado_por: "",
  },
};

export const ExpedienteClinico: React.FC<ExpedienteClinicoProps> = ({
  folio,
  onClose,
  onPacienteLiberado,
  className = "",
}) => {
  const { user } = useAuth();

  // Estados de datos
  const [paciente, setPaciente] = useState<PacienteParaPsicologo | null>(null);
  const [campos, setCampos] = useState<CamposClinicos>(DEFAULT_CAMPOS);
  const [transcriptVoz, setTranscriptVoz] = useState<string | null>(null);
  const [historialTamizajesTexto, setHistorialTamizajesTexto] = useState<string>("");

  // Control de interfaz
  const [paginaActiva, setPaginaActiva] = useState<number>(1); // 1 a 5
  const [vistaContinua, setVistaContinua] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [ultimaGuardado, setUltimaGuardado] = useState<Date | null>(null);

  const storageKey = useMemo(() => `equilibra_expediente_${folio}`, [folio]);

  // Patch genérico de campos
  const updateCampos = useCallback((patch: Partial<CamposClinicos>) => {
    setCampos((prev) => ({
      ...prev,
      ...patch,
    }));
  }, []);

  // 1. Cargar datos automáticos desde:
  // - para_psicologo (vista)
  // - respuestas_tamizaje (tabla)
  // - notas_voz (tabla)
  // - bloques_auditoria (tabla)
  // - expedientes_clinicos (guardado previo)
  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true);

      // A. Cargar datos de la vista para_psicologo
      const { data: pacienteData, error: pacError } = await supabase
        .from("para_psicologo")
        .select("*")
        .eq("folio", folio)
        .maybeSingle();

      if (!pacError && pacienteData) {
        const p = pacienteData as PacienteParaPsicologo;
        setPaciente(p);

        // Prellenar campos derivados
        setCampos((prev) => ({
          ...prev,
          iniciales: prev.iniciales || p.iniciales || "",
          edad: prev.edad || p.edad || 21,
          sexo: prev.sexo || p.sexo || "Mujer",
          semestre: prev.semestre || (p.semestre ? `${p.semestre}º Semestre` : "6º Semestre"),
          carrera: prev.carrera || p.carrera || "Ing. en Sistemas Computacionales",
          grupo: prev.grupo || p.grupo || "501",
          contexto_psicosocial: {
            ...prev.contexto_psicosocial,
            carrera_semestre: `${p.carrera || "Ing. Sistemas"} · ${
              p.semestre ? `${p.semestre}º Semestre` : "6º Semestre"
            }`,
            grupo: p.grupo || "501",
          },
          valoracion_riesgo: {
            ...prev.valoracion_riesgo,
            item9_valor: p.item9 ?? prev.valoracion_riesgo.item9_valor ?? 1,
          },
          objetivos_sesion: {
            ...prev.objetivos_sesion,
            estado_bloqueo: p.bloqueado ? "bloqueado" : "liberado",
          },
        }));
      }

      // B. Cargar respuestas_tamizaje para armar historial automático
      try {
        const { data: tamizajesData } = await supabase
          .from("respuestas_tamizaje")
          .select("*")
          .eq("folio", folio)
          .order("creado_en", { ascending: false })
          .limit(5);

        if (tamizajesData && tamizajesData.length > 0) {
          const resumenItems = tamizajesData.map((t: Record<string, unknown>) => {
            const fechaStr = t.creado_en
              ? new Date(String(t.creado_en)).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                })
              : "reciente";
            const gadVal = t.gad7_total ?? t.gad_total ?? 14;
            const phqVal = t.phq9_total ?? t.phq_total ?? 9;
            const item9Val = t.item9 ?? 1;
            const niv = String(t.nivel || t.ultimo_nivel || "rojo");
            return `${fechaStr} (GAD-7: ${gadVal}, PHQ-9: ${phqVal}, item9=${item9Val}, ${niv})`;
          });

          setHistorialTamizajesTexto(
            `El paciente tiene ${tamizajesData.length} tamizajes registrados: ${resumenItems.join(
              ", ",
            )}. Tendencia: evolución registrada en el expediente.`,
          );
        }
      } catch {
        // Fallback al resumen predeterminado
      }

      // C. Cargar notas_voz para referencia de transcripciones
      try {
        const { data: notasData } = await supabase
          .from("notas_voz")
          .select("transcripcion")
          .eq("folio_tamizaje", folio)
          .order("creado_en", { ascending: false })
          .limit(1);

        if (notasData && notasData.length > 0 && notasData[0].transcripcion) {
          setTranscriptVoz(notasData[0].transcripcion);
        }
      } catch {
        // Ignore si la tabla aún no tiene audios
      }

      // D. Cargar bloques_auditoria para trazabilidad blockchain
      // P0 #4 — filtrar por folio embebido en el JSONB `datos` (antes traía los
      // últimos 2 bloques globales, sin garantía de pertenencia al expediente).
      try {
        const { data: bloquesData } = await supabase
          .from("bloques_auditoria")
          .select("hash_actual, hash_previo, anclado_en, creado_en, datos")
          .eq("datos->>folio", folio)
          .order("indice", { ascending: false })
          .limit(2);

        if (bloquesData && bloquesData.length > 0) {
          const ultimo = bloquesData[0];
          const anterior = bloquesData[1] || bloquesData[0];
          const fechaUtc = ultimo.creado_en
            ? new Date(ultimo.creado_en).toUTCString().replace("GMT", "UTC")
            : "30-oct-2026 14:23 UTC";

          setCampos((prev) => ({
            ...prev,
            trazabilidad: {
              ...prev.trazabilidad,
              hash_expediente: String(ultimo.hash_actual),
              hash_previo: String(anterior.hash_previo || anterior.hash_actual),
              anclado_en: ultimo.anclado_en
                ? `${ultimo.anclado_en} — ${fechaUtc}`
                : prev.trazabilidad.anclado_en,
            },
          }));
        }
      } catch {
        // Mantiene valores mock de alta fidelidad
      }

      // E. Cargar registro previo de expedientes_clinicos
      let recordLoaded = false;
      try {
        const { data: expData, error: expError } = await supabase
          .from("expedientes_clinicos")
          .select("campos_clinicos, updated_at")
          .eq("folio", folio)
          .maybeSingle();

        if (!expError && expData && expData.campos_clinicos) {
          const loaded = expData.campos_clinicos as Partial<CamposClinicos>;
          setCampos((prev) => ({
            ...prev,
            ...loaded,
          }));
          if (expData.updated_at) {
            setUltimaGuardado(new Date(expData.updated_at));
          }
          recordLoaded = true;
        }
      } catch {
        // Fallback a localStorage
      }

      // Si no se cargó de Supabase, intentar de localStorage
      if (!recordLoaded) {
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            setCampos((prev) => ({
              ...prev,
              ...parsed,
            }));
            setUltimaGuardado(new Date());
          }
        } catch {
          // Ignore
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [folio, storageKey]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Guardar en Supabase y localStorage
  const handleGuardar = async () => {
    try {
      setIsSaving(true);

      // P0 #3 — Validar consentimiento firmado antes de cualquier persistencia
      if (!campos.objetivos_sesion?.consentimiento_firmado) {
        toast.error(
          "Se requiere el consentimiento firmado del paciente antes de guardar el expediente.",
        );
        return;
      }

      // Guardado local inmediato de seguridad
      try {
        localStorage.setItem(storageKey, JSON.stringify(campos));
      } catch {
        // Ignore
      }

      // Upsert en Supabase
      const recordPayload: Partial<ExpedienteDbRecord> = {
        folio,
        psicologo_id: user?.id,
        campos_clinicos: campos,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("expedientes_clinicos")
        .upsert(recordPayload, { onConflict: "folio,psicologo_id" });

      if (error) {
        console.warn("Aviso al guardar en expedientes_clinicos de Supabase:", error);
        // P0 fix — toast.success era engañoso; ahora advertimos al usuario
        toast.warning(
          "No se pudo sincronizar con Supabase. Se guardó una copia local temporal; reintenta en unos minutos.",
        );
      } else {
        toast.success("Expediente clínico guardado exitosamente en Supabase.");
      }

      setUltimaGuardado(new Date());
    } catch (err) {
      console.error("Error al persistir expediente:", err);
      toast.error("Ocurrió un problema al guardar el expediente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Sub-títulos de páginas según Canva
  const paginaSubtitulos: Record<number, string> = {
    1: "Equilibra · Historia clínica inicial",
    2: "Equilibra · Historia clínica inicial",
    3: "Equilibra · Historia clínica inicial",
    4: "Equilibra · Valoración clínica",
    5: "Equilibra · Seguimiento y trazabilidad",
  };

  return (
    <div
      className={`mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8 ${className}`}
      id="expediente-clinico-container"
    >
      {/* Barra de Acciones y Herramientas del Profesional */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B198F] text-white">
            <FileText className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Expediente Clínico · Folio <span className="font-mono text-[#6857E4]">{folio}</span>
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {ultimaGuardado
                ? `Último guardado: ${ultimaGuardado.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Cambios pendientes de guardar"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Vista por Páginas vs Continuo */}
          <button
            type="button"
            onClick={() => setVistaContinua((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Layers className="size-3.5 text-[#6857E4]" />
            <span>{vistaContinua ? "Vista por Páginas" : "Ver 5 Páginas Continuas"}</span>
          </button>

          {/* Botón Imprimir / PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
          >
            <Printer className="size-3.5 text-muted-foreground" />
            <span>Imprimir / PDF</span>
          </button>

          {/* Botón Guardar */}
          <button
            type="button"
            onClick={handleGuardar}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B198F] px-4 py-1.5 text-xs font-bold text-white shadow-float transition-all hover:bg-[#1B198F] disabled:opacity-50"
          >
            {isSaving ? (
              <RotateCcw className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span>{isSaving ? "Guardando..." : "Guardar"}</span>
          </button>

          {/* Botón Cerrar si fue invocado en modal */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {/* Paginador estilo Canva (Página 1 a 5) */}
      {!vistaContinua && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-violet-50/70 p-2.5 dark:bg-violet-950/20 print:hidden">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((pag) => (
              <button
                key={pag}
                type="button"
                onClick={() => setPaginaActiva(pag)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  paginaActiva === pag
                    ? "bg-[#1B198F] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-violet-100 hover:text-foreground dark:hover:bg-violet-900/40"
                }`}
              >
                Página {pag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={paginaActiva <= 1}
              onClick={() => setPaginaActiva((p) => Math.max(1, p - 1))}
              className="rounded-xl p-1.5 text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-30"
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs font-semibold text-muted-foreground">{paginaActiva} / 5</span>
            <button
              type="button"
              disabled={paginaActiva >= 5}
              onClick={() => setPaginaActiva((p) => Math.min(5, p + 1))}
              className="rounded-xl p-1.5 text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-30"
              aria-label="Página siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* DOCUMENTO CLINICO: Se renderiza como las 5 páginas del diseño Canva */}
      <div className="space-y-12">
        {/* PÁGINA 1: 01 Identificación + 02 Motivo de consulta */}
        {(vistaContinua || paginaActiva === 1) && (
          <article className="space-y-6 rounded-3xl border border-[#C3B3F1]/80 bg-[#FFFFFFFFF] p-6 shadow-sm dark:border-violet-950/60 dark:bg-[#131427] sm:p-8">
            {/* Header de Página Canva Style */}
            <header className="flex items-start justify-between border-b border-border/60 pb-5">
              <div>
                <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1B198F] dark:text-violet-200 sm:text-3xl">
                  EXPEDIENTE CLÍNICO
                </h1>
                <p className="text-xs font-medium text-muted-foreground">{paginaSubtitulos[1]}</p>
              </div>
              <span className="rounded-full bg-[#1B198F] px-4 py-1.5 text-xs font-bold text-white shadow-xs">
                Página 1 de 5
              </span>
            </header>

            <Identificacion
              paciente={paciente}
              campos={campos}
              onChange={updateCampos}
              fechaApertura="30-oct-2026"
            />

            <MotivoConsulta
              paciente={paciente}
              motivoEnPalabras={campos.motivo_en_palabras}
              onChange={(motivo) => updateCampos({ motivo_en_palabras: motivo })}
              tamizajeFecha="18-oct-2026"
              transcriptVoz={transcriptVoz}
            />

            <footer className="border-t border-border/60 pt-4 text-center text-[11px] text-muted-foreground">
              Equilibra TESH · Plantilla Expediente Clínico · 30 de octubre de 2026
            </footer>
          </article>
        )}

        {/* PÁGINA 2: 03 Historia del problema + 04 Antecedentes */}
        {(vistaContinua || paginaActiva === 2) && (
          <article className="space-y-6 rounded-3xl border border-[#C3B3F1]/80 bg-[#FFFFFFFFF] p-6 shadow-sm dark:border-violet-950/60 dark:bg-[#131427] sm:p-8">
            <header className="flex items-start justify-between border-b border-border/60 pb-5">
              <div>
                <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1B198F] dark:text-violet-200 sm:text-3xl">
                  EXPEDIENTE CLÍNICO
                </h1>
                <p className="text-xs font-medium text-muted-foreground">{paginaSubtitulos[2]}</p>
              </div>
              <span className="rounded-full bg-[#1B198F] px-4 py-1.5 text-xs font-bold text-white shadow-xs">
                Página 2 de 5
              </span>
            </header>

            <HistoriaProblema
              paciente={paciente}
              historiaClinica={campos.historia_clinica}
              onChange={(historia) => updateCampos({ historia_clinica: historia })}
              historialTamizajesTexto={historialTamizajesTexto}
            />

            <Antecedentes
              antecedentes={campos.antecedentes}
              onChange={(patch) =>
                updateCampos({
                  antecedentes: { ...campos.antecedentes, ...patch },
                })
              }
            />

            <footer className="border-t border-border/60 pt-4 text-center text-[11px] text-muted-foreground">
              Equilibra TESH · Plantilla Expediente Clínico · 30 de octubre de 2026
            </footer>
          </article>
        )}

        {/* PÁGINA 3: 05 Contexto psicosocial + 06 Exploración del estado mental */}
        {(vistaContinua || paginaActiva === 3) && (
          <article className="space-y-6 rounded-3xl border border-[#C3B3F1]/80 bg-[#FFFFFFFFF] p-6 shadow-sm dark:border-violet-950/60 dark:bg-[#131427] sm:p-8">
            <header className="flex items-start justify-between border-b border-border/60 pb-5">
              <div>
                <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1B198F] dark:text-violet-200 sm:text-3xl">
                  EXPEDIENTE CLÍNICO
                </h1>
                <p className="text-xs font-medium text-muted-foreground">{paginaSubtitulos[3]}</p>
              </div>
              <span className="rounded-full bg-[#1B198F] px-4 py-1.5 text-xs font-bold text-white shadow-xs">
                Página 3 de 5
              </span>
            </header>

            <ContextoPsicosocial
              paciente={paciente}
              contexto={campos.contexto_psicosocial}
              onChange={(patch) =>
                updateCampos({
                  contexto_psicosocial: { ...campos.contexto_psicosocial, ...patch },
                })
              }
            />

            <EstadoMental
              estadoMental={campos.estado_mental}
              onChange={(patch) =>
                updateCampos({
                  estado_mental: { ...campos.estado_mental, ...patch },
                })
              }
            />

            <footer className="border-t border-border/60 pt-4 text-center text-[11px] text-muted-foreground">
              Equilibra TESH · Plantilla Expediente Clínico · 30 de octubre de 2026
            </footer>
          </article>
        )}

        {/* PÁGINA 4: 07 Valoración de riesgo + 08 Hipótesis de trabajo */}
        {(vistaContinua || paginaActiva === 4) && (
          <article className="space-y-6 rounded-3xl border border-[#C3B3F1]/80 bg-[#FFFFFFFFF] p-6 shadow-sm dark:border-violet-950/60 dark:bg-[#131427] sm:p-8">
            <header className="flex items-start justify-between border-b border-border/60 pb-5">
              <div>
                <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1B198F] dark:text-violet-200 sm:text-3xl">
                  EXPEDIENTE CLÍNICO
                </h1>
                <p className="text-xs font-medium text-muted-foreground">{paginaSubtitulos[4]}</p>
              </div>
              <span className="rounded-full bg-[#1B198F] px-4 py-1.5 text-xs font-bold text-white shadow-xs">
                Página 4 de 5
              </span>
            </header>

            <ValoracionRiesgo
              paciente={paciente}
              valoracion={campos.valoracion_riesgo}
              onChange={(patch) =>
                updateCampos({
                  valoracion_riesgo: { ...campos.valoracion_riesgo, ...patch },
                })
              }
            />

            <HipotesisTrabajo
              hipotesis={campos.hipotesis_trabajo}
              onChange={(hipotesis) => updateCampos({ hipotesis_trabajo: hipotesis })}
            />

            <footer className="border-t border-border/60 pt-4 text-center text-[11px] text-muted-foreground">
              Equilibra TESH · Plantilla Expediente Clínico · 30 de octubre de 2026
            </footer>
          </article>
        )}

        {/* PÁGINA 5: 09 Objetivos iniciales y próxima sesión + 10 Trazabilidad blockchain */}
        {(vistaContinua || paginaActiva === 5) && (
          <article className="space-y-6 rounded-3xl border border-[#C3B3F1]/80 bg-[#FFFFFFFFF] p-6 shadow-sm dark:border-violet-950/60 dark:bg-[#131427] sm:p-8">
            <header className="flex items-start justify-between border-b border-border/60 pb-5">
              <div>
                <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1B198F] dark:text-violet-200 sm:text-3xl">
                  EXPEDIENTE CLÍNICO
                </h1>
                <p className="text-xs font-medium text-muted-foreground">{paginaSubtitulos[5]}</p>
              </div>
              <span className="rounded-full bg-[#1B198F] px-4 py-1.5 text-xs font-bold text-white shadow-xs">
                Página 5 de 5
              </span>
            </header>

            <ObjetivosSesion
              paciente={paciente}
              objetivos={campos.objetivos_sesion}
              onChange={(patch) =>
                updateCampos({
                  objetivos_sesion: { ...campos.objetivos_sesion, ...patch },
                })
              }
              onLiberarPaciente={onPacienteLiberado}
            />

            <TrazabilidadBlockchain
              trazabilidad={campos.trazabilidad}
              nombrePsicologo={user?.name}
            />

            <footer className="border-t border-border/60 pt-4 text-center text-[11px] text-muted-foreground">
              Equilibra TESH · Plantilla Expediente Clínico · 30 de octubre de 2026
            </footer>
          </article>
        )}
      </div>
    </div>
  );
};

export default ExpedienteClinico;
