import React, { useState } from "react";
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  MessageSquare,
  Bot,
  ArrowRight,
  Home,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { TriggerEncuestaTipo } from "./types";
import { PREGUNTAS_ENCUESTA } from "./types";
import { guardarRespuestaEncuesta } from "./encuesta-service";

interface EncuestaSatisfaccionProps {
  folio?: string;
  triggerTipo?: TriggerEncuestaTipo;
  userId?: string;
  onCompletada?: (hash: string) => void;
}

export const EncuestaSatisfaccion: React.FC<EncuestaSatisfaccionProps> = ({
  folio = "TESH-2026-0842",
  triggerTipo = "alta",
  userId,
  onCompletada,
}) => {
  // Estado de respuestas (valores 1 a 5)
  const [respuestas, setRespuestas] = useState<Record<string, number>>({
    q1_satisfaccion: 0,
    q2_escuchado: 0,
    q3_claridad: 0,
    q4_respeto: 0,
    q5_tiempo_espera: 0,
    q6_utilidad: 0,
    q7_mejoria: 0,
    q8_recomendar: 0,
    q10a_facilidad_eli: 0,
    q10b_util_eli: 0,
  });

  const [q9Comentarios, setQ9Comentarios] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [completada, setCompletada] = useState(false);
  const [hashGenerado, setHashGenerado] = useState<string | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const esAlta = triggerTipo === "alta";

  const handleSelectValor = (preguntaId: string, valor: number) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));
    if (errorValidacion) setErrorValidacion(null);
  };

  const calcularAvance = () => {
    const totalPreguntas = 10;
    const contestadas = Object.values(respuestas).filter((v) => v > 0).length;
    return Math.round((contestadas / totalPreguntas) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que todas las preguntas numéricas obligatorias tengan valor
    const faltantes = PREGUNTAS_ENCUESTA.filter((p) => !respuestas[p.id] || respuestas[p.id] === 0);
    if (faltantes.length > 0) {
      setErrorValidacion(
        `Por favor responde la pregunta ${faltantes[0].numero} ("${faltantes[0].titulo}") antes de enviar.`,
      );
      // Scroll al inicio del error
      window.scrollTo({ top: 350, behavior: "smooth" });
      return;
    }

    try {
      setEnviando(true);
      setErrorValidacion(null);

      const res = await guardarRespuestaEncuesta({
        folio,
        user_id: userId || null,
        trigger_tipo: triggerTipo,
        trigger_fecha: new Date().toISOString(),
        enviada_en: new Date().toISOString(),
        q1_satisfaccion: respuestas.q1_satisfaccion,
        q2_escuchado: respuestas.q2_escuchado,
        q3_claridad: respuestas.q3_claridad,
        q4_respeto: respuestas.q4_respeto,
        q5_tiempo_espera: respuestas.q5_tiempo_espera,
        q6_utilidad: respuestas.q6_utilidad,
        q7_mejoria: respuestas.q7_mejoria,
        q8_recomendar: respuestas.q8_recomendar,
        q9_comentarios: q9Comentarios.trim() || null,
        q10a_facilidad_eli: respuestas.q10a_facilidad_eli,
        q10b_util_eli: respuestas.q10b_util_eli,
      });

      if (res.ok && res.hash) {
        setHashGenerado(res.hash);
        setCompletada(true);
        if (onCompletada) onCompletada(res.hash);
      } else {
        setErrorValidacion(res.error || "Ocurrió un error al registrar tu encuesta.");
      }
    } catch (err) {
      setErrorValidacion(
        err instanceof Error ? err.message : "Error inesperado de conexión con el servidor",
      );
    } finally {
      setEnviando(false);
    }
  };

  // PANTALLA DE ÉXITO FINAL
  if (completada) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="overflow-hidden rounded-3xl border border-[#C3B3F1] bg-card p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
            <CheckCircle2 className="size-9" />
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full bg-[#C3B3F1]/40 px-3 py-1 text-xs font-bold text-[#6857E4] uppercase tracking-wider">
              PB-021 · Encuesta Registrada
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1B198F] dark:text-white">
              ¡Muchas gracias por tu retroalimentación!
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Tus respuestas han quedado vinculadas formalmente al folio institucional{" "}
              <strong className="text-foreground">{folio}</strong> para el análisis continuo de
              calidad del departamento de psicología del TESH.
            </p>
          </div>

          {/* Bloque de Trazabilidad Blockchain */}
          <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[#12BDB6]" />
                Trazabilidad Criptográfica SHA-256
              </span>
              <span className="text-[10px] text-teal-600 font-mono">Inmutable</span>
            </div>
            <p className="font-mono text-[11px] text-foreground break-all bg-card p-2 rounded-xl border border-border">
              {hashGenerado || "0x8f3c...4a2b"}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6857E4] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#6857E4]/90 transition-all w-full sm:w-auto"
            >
              <Home className="size-4" />
              <span>Volver al Inicio</span>
            </Link>
            <Link
              to="/auditoria"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#C3B3F1] bg-card px-5 py-3 text-sm font-bold text-[#1B198F] dark:text-white hover:bg-muted/50 transition-all w-full sm:w-auto"
            >
              <span>Ver Auditoría Blockchain</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const avance = calcularAvance();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* HEADER INSTITUCIONAL CON PALETA MORADO + LAVANDA */}
      <header className="overflow-hidden rounded-3xl border border-[#C3B3F1] bg-gradient-to-br from-[#1B198F] via-[#1B198F] to-[#6857E4] p-6 sm:p-8 text-white shadow-xl relative">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
              PB-021 · Calidad Clínica
            </span>
            <span className="rounded-full bg-[#12BDB6]/30 border border-[#12BDB6]/40 px-3 py-1 text-[11px] font-bold text-white">
              Folio: {folio} (MIN-008)
            </span>
            <span className="rounded-full bg-lime-400/20 border border-lime-300/40 px-3 py-1 text-[11px] font-bold text-lime-200">
              {esAlta ? "Disparador: Alta de Proceso" : "Disparador: Inasistencia"}
            </span>
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Encuesta de Satisfacción y Acompañamiento
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#C3B3F1] leading-relaxed max-w-2xl">
              Tecnológico de Estudios Superiores de Huixquilucan. Esta encuesta nos permite evaluar
              la calidez, efectividad y pertinencia de la atención psicológica recibida.
            </p>
          </div>

          {/* BANNER CONTEXTUAL SEGÚN DISPARADOR */}
          <div
            className={`rounded-2xl p-4 border text-xs sm:text-sm leading-relaxed backdrop-blur-md ${
              esAlta
                ? "bg-white/10 border-white/20 text-white"
                : "bg-lime-500/20 border-lime-300/30 text-lime-100"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Clock className="size-4 shrink-0 mt-0.5 text-[#12BDB6]" />
              <div>
                <strong>
                  {esAlta
                    ? "Alta de atención psicológica (Enlace disponible en ventana de 24 horas):"
                    : "Seguimiento institucional por inasistencia (Ventana de 15 días naturales):"}
                </strong>
                <p className="mt-1 text-xs opacity-90">
                  {esAlta
                    ? "Tus opiniones nos guían para continuar ofreciendo un espacio seguro, ético y humano para toda la comunidad universitaria."
                    : "Notamos que no fue posible acudir a tus sesiones. Queremos conocer si hubo barreras de horario o traslado, para orientarte y reprogramar cuando te sea posible."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decoración geométrica */}
        <div className="absolute -right-12 -bottom-12 size-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </header>

      {/* BARRA DE PROGRESO */}
      <div className="sticky top-4 z-20 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-4 shadow-md flex items-center justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[#6857E4]" />
              Progreso de la encuesta
            </span>
            <span className="text-[#6857E4]">{avance}% completado</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6857E4] to-[#12BDB6] transition-all duration-300 rounded-full"
              style={{ width: `${avance}%` }}
            />
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] font-semibold text-muted-foreground block">
            Folio identificado
          </span>
          <span className="text-xs font-mono font-bold text-foreground">{folio}</span>
        </div>
      </div>

      {errorValidacion && (
        <div className="flex items-center gap-3 rounded-2xl border border-pink-300 bg-pink-50 p-4 text-xs font-semibold text-pink-700 dark:border-pink-800/60 dark:bg-pink-950/40 dark:text-pink-300 shadow-sm">
          <AlertCircle className="size-5 shrink-0 text-pink-500" />
          <span>{errorValidacion}</span>
        </div>
      )}

      {/* FORMULARIO DE REACTIVOS */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN A: PREGUNTAS DEL SERVICIO Y PSICÓLOGO (1 a 8) */}
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#6857E4]">
              Módulo I · Acompañamiento Psicológico Presencial
            </span>
            <p className="text-xs text-muted-foreground">
              Evalúa tu experiencia directa en el consultorio y la relación terapéutica.
            </p>
          </div>

          {PREGUNTAS_ENCUESTA.slice(0, 8).map((p) => {
            const valorActual = respuestas[p.id] || 0;

            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-5 transition-all ${
                  valorActual > 0
                    ? "border-[#C3B3F1] bg-card shadow-xs"
                    : "border-border/80 bg-card/60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-lg bg-[#C3B3F1]/40 text-xs font-bold text-[#6857E4]">
                        {p.numero}
                      </span>
                      <h3 className="font-bold text-sm text-foreground">{p.titulo}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                      {p.descripcion}
                    </p>
                  </div>
                </div>

                {/* Botones de Escala (1 a 5) */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 pl-0 sm:pl-8">
                  {p.escala.map((opt) => {
                    const seleccionado = valorActual === opt.valor;

                    return (
                      <button
                        key={opt.valor}
                        type="button"
                        onClick={() => handleSelectValor(p.id, opt.valor)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          seleccionado
                            ? "border-[#6857E4] bg-[#6857E4]/10 text-[#6857E4] font-bold shadow-xs scale-102 ring-2 ring-[#6857E4]/30"
                            : "border-border/70 bg-card hover:bg-muted/40 text-foreground text-xs"
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <Star
                            className={`size-4 ${
                              seleccionado
                                ? "fill-[#6857E4] text-[#6857E4]"
                                : "text-muted-foreground/40"
                            }`}
                          />
                          <span className="text-sm font-extrabold">{opt.valor}</span>
                        </div>
                        <span className="text-[11px] leading-tight line-clamp-2">
                          {opt.etiqueta}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* SECCIÓN B: PREGUNTA 9 - COMENTARIOS Y SUGERENCIAS ABIERTAS */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-[#C3B3F1]/40 text-xs font-bold text-[#6857E4]">
              9
            </span>
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-[#6857E4]" />
              <h3 className="font-bold text-sm text-foreground">
                Comentarios y Propuestas de Mejora
              </h3>
            </div>
            <span className="ml-auto text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Opcional
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed pl-8">
            ¿Hay algo que te gustaría comentarle a tu psicólogo(a), sugerencias sobre las
            instalaciones o reflexiones que quieras compartir?
          </p>

          <div className="pl-0 sm:pl-8 space-y-1">
            <textarea
              rows={3}
              value={q9Comentarios}
              onChange={(e) => setQ9Comentarios(e.target.value)}
              maxLength={500}
              placeholder="Escribe aquí tus comentarios, agradecimientos o áreas de mejora..."
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#6857E4] focus:outline-none focus:ring-2 focus:ring-[#6857E4]/20 resize-none"
            />
            <div className="flex justify-end text-[10px] text-muted-foreground">
              <span>{q9Comentarios.length} / 500 caracteres</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN C: PREGUNTAS 10.A Y 10.B - ASISTENTE VIRTUAL ELI */}
        <div className="space-y-4 rounded-3xl border border-[#C3B3F1] bg-[#C3B3F1]/10 p-5 sm:p-6">
          <div className="border-b border-[#C3B3F1]/60 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-xl bg-gradient-to-tr from-[#6857E4] to-[#12BDB6] text-white">
                <Bot className="size-4.5" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#6857E4]">
                  Módulo II · Asistente Virtual Eli
                </span>
                <p className="text-xs text-muted-foreground">
                  Evaluación de la etapa inicial de tamizaje (cuestionarios de ansiedad y
                  depresión).
                </p>
              </div>
            </div>
          </div>

          {PREGUNTAS_ENCUESTA.slice(8, 10).map((p) => {
            const valorActual = respuestas[p.id] || 0;

            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-5 transition-all bg-card ${
                  valorActual > 0 ? "border-[#6857E4] shadow-xs" : "border-border/80"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-lg bg-[#C3B3F1]/40 text-xs font-bold text-[#6857E4]">
                      {p.numero}
                    </span>
                    <h3 className="font-bold text-sm text-foreground">{p.titulo}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                    {p.descripcion}
                  </p>
                </div>

                {/* Botones de Escala */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 pl-0 sm:pl-8">
                  {p.escala.map((opt) => {
                    const seleccionado = valorActual === opt.valor;

                    return (
                      <button
                        key={opt.valor}
                        type="button"
                        onClick={() => handleSelectValor(p.id, opt.valor)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          seleccionado
                            ? "border-[#6857E4] bg-[#6857E4]/10 text-[#6857E4] font-bold shadow-xs scale-102 ring-2 ring-[#6857E4]/30"
                            : "border-border/70 bg-card hover:bg-muted/40 text-foreground text-xs"
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <Star
                            className={`size-4 ${
                              seleccionado
                                ? "fill-[#6857E4] text-[#6857E4]"
                                : "text-muted-foreground/40"
                            }`}
                          />
                          <span className="text-sm font-extrabold">{opt.valor}</span>
                        </div>
                        <span className="text-[11px] leading-tight line-clamp-2">
                          {opt.etiqueta}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTÓN DE ENVÍO FINAL */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p className="font-semibold text-foreground">
              Al enviar, se generará tu constancia criptográfica de participación.
            </p>
            <p>
              Tus respuestas son confidenciales y se almacenan vinculadas a tu folio institucional.
            </p>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6857E4] to-[#1B198F] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:opacity-95 disabled:opacity-50 active:scale-98 transition-all w-full sm:w-auto"
          >
            {enviando ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span>Enviar Encuesta PB-021</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
