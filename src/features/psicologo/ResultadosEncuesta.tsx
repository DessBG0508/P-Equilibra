import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  Bot,
  Users,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { RespuestaEncuesta, MetricasEncuesta } from "../encuesta/types";
import { getRespuestasEncuesta, calcularMetricasEncuesta } from "../encuesta/encuesta-service";
import { ExportarEncuestaExcel } from "./ExportarEncuestaExcel";

export const ResultadosEncuesta: React.FC = () => {
  const [respuestas, setRespuestas] = useState<RespuestaEncuesta[]>([]);
  const [metricas, setMetricas] = useState<MetricasEncuesta | null>(null);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroTrigger, setFiltroTrigger] = useState<string>("todos");
  const [busquedaFolio, setBusquedaFolio] = useState<string>("");
  const [filaExpandida, setFilaExpandida] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const data = await getRespuestasEncuesta({
        trigger_tipo: filtroTrigger,
        search: busquedaFolio,
      });
      setRespuestas(data);
      setMetricas(calcularMetricasEncuesta(data));
    } catch (err) {
      console.error("Error al cargar encuestas:", err);
    } finally {
      setCargando(false);
    }
  }, [filtroTrigger, busquedaFolio]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const toggleExpandir = (id: string) => {
    setFilaExpandida((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ENCABEZADO CON PALETA INSTITUCIONAL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="rounded-full bg-[#C3B3F1]/50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#6857E4]">
              PB-021 · Calidad y Satisfacción
            </span>
            <span className="rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 px-2.5 py-0.5 text-[11px] font-bold">
              Identificado por Folio (MIN-008)
            </span>
            <span className="rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300 px-2.5 py-0.5 text-[11px] font-medium">
              Resend SMTP: 100 correos/día
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1B198F] dark:text-white">
            Resultados de Encuestas de Satisfacción
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitoreo en tiempo real de satisfacción clínica, calidad del servicio y evaluación de
            Eli.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={cargarDatos}
            title="Actualizar datos"
            className="grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <RefreshCw className={`size-4 ${cargando ? "animate-spin text-[#6857E4]" : ""}`} />
          </button>
          <ExportarEncuestaExcel respuestas={respuestas} />
        </div>
      </div>

      {/* TARJETAS DE INDICADORES CLAVE (KPIs) */}
      {metricas && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Promedio General */}
          <div className="rounded-2xl border border-[#C3B3F1] bg-card p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Promedio General</span>
              <Star className="size-4 fill-lime-400 text-lime-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-[#1B198F] dark:text-white">
                {metricas.promedioGeneral > 0 ? metricas.promedioGeneral.toFixed(2) : "—"}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">/ 5.0</span>
            </div>
            <p className="text-[11px] font-medium text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              <span>
                {metricas.promedioGeneral >= 4.5
                  ? "Excelente satisfacción institucional"
                  : "Nivel satisfactorio"}
              </span>
            </p>
          </div>

          {/* KPI 2: Tasa de Respuesta */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Tasa de Respuesta</span>
              <Users className="size-4 text-[#6857E4]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-[#6857E4]">
                {metricas.tasaRespuesta}%
              </span>
              <span className="text-xs text-muted-foreground">
                ({metricas.totalRespondidas} de {metricas.totalEncuestas})
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-block size-2 rounded-full bg-[#6857E4]" />
              <span>Alta: {metricas.totalAltas}</span>
              <span className="inline-block size-2 rounded-full bg-lime-500" />
              <span>Abandono: {metricas.totalAbandonos}</span>
            </div>
          </div>

          {/* KPI 3: Recomendación NPS */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Net Promoter Score (Q8)</span>
              <TrendingUp className="size-4 text-[#12BDB6]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-[#12BDB6]">
                {metricas.npsScore > 0 ? `+${metricas.npsScore}` : metricas.npsScore}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">puntos</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Estudiantes que recomendarían el servicio a sus compañeros.
            </p>
          </div>

          {/* KPI 4: Evaluación de Eli */}
          <div className="rounded-2xl border border-[#C3B3F1] bg-[#C3B3F1]/15 p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#6857E4]">
              <span>Asistente Virtual Eli</span>
              <Bot className="size-4 text-[#6857E4]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-[#1B198F] dark:text-white">
                {metricas.promedioEli > 0 ? metricas.promedioEli.toFixed(2) : "—"}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">/ 5.0</span>
            </div>
            <p className="text-[11px] text-[#6857E4] font-medium">
              Promedio de comodidad en tamizaje y canalización previa.
            </p>
          </div>
        </div>
      )}

      {/* SECCIÓN DE GRÁFICAS: DONUT Y BARRAS (RECHARTS) */}
      {metricas && metricas.totalRespondidas > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* GRÁFICA DONUT: DISTRIBUCIÓN DE SATISFACCIÓN */}
          <div className="lg:col-span-5 rounded-3xl border border-border/80 bg-card p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-[#1B198F] dark:text-white">
                  Distribución de Satisfacción General
                </h3>
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  Q1
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Proporción de respuestas por nivel de escala (1 a 5).
              </p>
            </div>

            <div className="h-64 w-full my-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metricas.distribucionSatisfaccion}
                    dataKey="cantidad"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {metricas.distribucionSatisfaccion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "14px",
                      border: "1px solid #C3B3F1",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Leyenda de la Donut */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border/60">
              {metricas.distribucionSatisfaccion.map((item) => (
                <div key={item.nombre} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground truncate">{item.nombre}:</span>
                  <strong className="text-foreground">{item.cantidad}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* GRÁFICA DE BARRAS: PROMEDIOS POR REACTIVO */}
          <div className="lg:col-span-7 rounded-3xl border border-border/80 bg-card p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-[#1B198F] dark:text-white">
                  Promedios por Dimensión Clínica y de Servicio
                </h3>
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  Escala 1 a 5
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Calificación promedio obtenida en cada reactivo del instrumento PB-021.
              </p>
            </div>

            <div className="h-64 w-full my-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metricas.promediosPorReactivo}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="clave"
                    tick={{ fontSize: 11, fontWeight: 700, fill: "#6857E4" }}
                    angle={0}
                    dy={5}
                  />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => [`${val.toFixed(2)} / 5.0`, "Promedio"]}
                    labelFormatter={(label) => {
                      const item = metricas.promediosPorReactivo.find((p) => p.clave === label);
                      return item ? `${item.clave}: ${item.label}` : label;
                    }}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "14px",
                      border: "1px solid #C3B3F1",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  />
                  <Bar dataKey="promedio" fill="#6857E4" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/60">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#6857E4]" />
                Dimensiones terapéuticas (Q1-Q8)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#12BDB6]" />
                Asistente Virtual Eli (Q10.A / Q10.B)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS Y TABLA DE RESULTADOS INDIVIDUALES */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Buscador de Folio */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por folio o comentario..."
                value={busquedaFolio}
                onChange={(e) => setBusquedaFolio(e.target.value)}
                className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#6857E4] focus:outline-none"
              />
            </div>

            {/* Filtro por Disparador */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs">
              <Filter className="size-3 text-muted-foreground" />
              <select
                value={filtroTrigger}
                onChange={(e) => setFiltroTrigger(e.target.value)}
                className="bg-transparent text-foreground focus:outline-none cursor-pointer text-xs font-semibold"
              >
                <option value="todos">Todos los disparadores</option>
                <option value="alta">Solo Alta (Completada 24h)</option>
                <option value="abandono">Solo Abandono (2 Inasistencias)</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-medium self-end sm:self-auto">
            Mostrando <strong>{respuestas.length}</strong> encuestas registradas
          </div>
        </div>

        {/* LISTADO / TABLA DE PACIENTES */}
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs">
          {respuestas.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <MessageSquare className="size-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-semibold">
                No se encontraron encuestas con estos filtros.
              </p>
              <p className="text-xs">
                Intenta limpiando el buscador o cambiando el tipo de disparador.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {respuestas.map((r) => {
                const esAlta = r.trigger_tipo === "alta";
                const expandida = filaExpandida === r.id;
                const promClinico = (
                  (r.q1_satisfaccion +
                    r.q2_escuchado +
                    r.q3_claridad +
                    r.q4_respeto +
                    r.q5_tiempo_espera +
                    r.q6_utilidad +
                    r.q7_mejoria +
                    r.q8_recomendar) /
                  8
                ).toFixed(1);
                const promEli = ((r.q10a_facilidad_eli + r.q10b_util_eli) / 2).toFixed(1);

                return (
                  <div key={r.id} className="p-4 sm:p-5 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Identificación del Paciente por Folio */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid size-11 place-items-center rounded-2xl font-bold text-xs shrink-0 ${
                            esAlta
                              ? "bg-[#C3B3F1]/40 text-[#6857E4]"
                              : "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-300"
                          }`}
                        >
                          {esAlta ? "ALTA" : "ABAN"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-sm text-[#1B198F] dark:text-white">
                              {r.folio}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                esAlta
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                  : "bg-lime-100 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300"
                              }`}
                            >
                              {esAlta ? "Alta (24h)" : "2 Inasistencias (15d)"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Clock className="size-3 text-muted-foreground" />
                            <span>
                              Respondida:{" "}
                              {r.respondida_en
                                ? new Date(r.respondida_en).toLocaleDateString("es-MX", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "Pendiente"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Calificaciones y Acciones */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Promedio Sesiones
                          </span>
                          <div className="flex items-center gap-1 font-bold text-sm text-foreground">
                            <Star className="size-3.5 fill-lime-400 text-lime-400" />
                            <span>{promClinico} / 5.0</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Eli Tamizaje
                          </span>
                          <span className="text-xs font-bold text-[#6857E4]">{promEli} / 5.0</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExpandir(r.id)}
                          className="flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                        >
                          <span>{expandida ? "Ocultar" : "Detalle"}</span>
                          {expandida ? (
                            <ChevronUp className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* VISTA EXPANDIDA CON TODAS LAS 10 PREGUNTAS Y COMENTARIOS */}
                    {expandida && (
                      <div className="mt-4 pt-4 border-t border-border/60 space-y-4 animate-fade-in text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-3.5 rounded-2xl">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Q1 Satisfacción
                            </span>
                            <strong className="text-foreground">{r.q1_satisfaccion}/5</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Q2 Escucha activa
                            </span>
                            <strong className="text-foreground">{r.q2_escuchado}/5</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Q3 Claridad metas
                            </span>
                            <strong className="text-foreground">{r.q3_claridad}/5</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Q4 Respeto/Ética
                            </span>
                            <strong className="text-foreground">{r.q4_respeto}/5</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Q5 Puntualidad
                            </span>
                            <strong className="text-foreground">{r.q5_tiempo_espera}/5</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Q6 Herramientas
                            </span>
                            <strong className="text-foreground">{r.q6_utilidad}/5</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Q7 Percepción mejoría
                            </span>
                            <strong className="text-foreground">{r.q7_mejoria}/5</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">
                              Q8 Recomendaría
                            </span>
                            <strong className="text-foreground">{r.q8_recomendar}/5</strong>
                          </div>
                        </div>

                        {/* Comentario Abierto Q9 */}
                        {r.q9_comentarios ? (
                          <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                            <span className="text-[10px] font-bold text-[#6857E4] uppercase tracking-wider block">
                              Comentarios del Estudiante (Q9):
                            </span>
                            <p className="italic text-foreground leading-relaxed">
                              "{r.q9_comentarios}"
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">
                            Sin comentarios adicionales registrados en Q9.
                          </p>
                        )}

                        {/* Evaluaciones de Eli y Hash Blockchain */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span>
                              <strong>Q10.A (Facilidad Eli):</strong> {r.q10a_facilidad_eli}/5
                            </span>
                            <span>
                              <strong>Q10.B (Utilidad Eli):</strong> {r.q10b_util_eli}/5
                            </span>
                          </div>

                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <ShieldCheck className="size-3.5 text-[#12BDB6]" />
                            <span>
                              Hash: {r.hash_auditoria ? r.hash_auditoria.slice(0, 16) : "—"}...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
