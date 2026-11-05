/**
 * Servicio de Gestión de Encuestas de Satisfacción PB-021
 * Equilibra TESH - Sistema de Calidad y Acompañamiento
 */

import { supabase } from "@/lib/supabase";
import { sha256 } from "@/lib/blockchain-audit";
import type { RespuestaEncuesta, MetricasEncuesta, TriggerEncuestaTipo } from "./types";
import { enviarNotificacionEncuestaResend } from "./resend-service";

const LOCAL_STORAGE_KEY = "equilibra_respuestas_encuesta_pb021";

/**
 * Semillas de encuestas iniciales realistas para TESH (MIN-008)
 */
const SEMILLAS_ENCUESTA: RespuestaEncuesta[] = [
  {
    id: "enc-001",
    folio: "TESH-2026-0842",
    user_id: "demo-student-01",
    trigger_tipo: "alta",
    trigger_fecha: "2026-10-18T10:00:00Z",
    enviada_en: "2026-10-18T10:30:00Z",
    respondida_en: "2026-10-18T16:45:00Z",
    q1_satisfaccion: 5,
    q2_escuchado: 5,
    q3_claridad: 5,
    q4_respeto: 5,
    q5_tiempo_espera: 4,
    q6_utilidad: 5,
    q7_mejoria: 5,
    q8_recomendar: 5,
    q9_comentarios:
      "La psicóloga me ayudó mucho con técnicas de respiración para mis ataques de ansiedad en temporada de exámenes.",
    q10a_facilidad_eli: 5,
    q10b_util_eli: 5,
    hash_auditoria: "a8fbc394819d7e002c91ba7204fca11283940182746592019482710394857291",
    created_at: "2026-10-18T16:45:00Z",
  },
  {
    id: "enc-002",
    folio: "TESH-2026-0915",
    user_id: "demo-student-02",
    trigger_tipo: "alta",
    trigger_fecha: "2026-10-22T14:00:00Z",
    enviada_en: "2026-10-22T14:15:00Z",
    respondida_en: "2026-10-23T09:20:00Z",
    q1_satisfaccion: 4,
    q2_escuchado: 5,
    q3_claridad: 4,
    q4_respeto: 5,
    q5_tiempo_espera: 4,
    q6_utilidad: 4,
    q7_mejoria: 4,
    q8_recomendar: 5,
    q9_comentarios:
      "Muy buen servicio. Me gustaría que hubiera más horarios disponibles por la tarde ya que estudio ingeniería industrial.",
    q10a_facilidad_eli: 4,
    q10b_util_eli: 5,
    hash_auditoria: "b192847c92840192837465019283746501928374650192837465019283746501",
    created_at: "2026-10-23T09:20:00Z",
  },
  {
    id: "enc-003",
    folio: "TESH-2026-0731",
    user_id: "demo-student-03",
    trigger_tipo: "abandono",
    trigger_fecha: "2026-10-25T11:00:00Z",
    enviada_en: "2026-10-25T11:10:00Z",
    respondida_en: "2026-10-26T18:00:00Z",
    q1_satisfaccion: 3,
    q2_escuchado: 4,
    q3_claridad: 3,
    q4_respeto: 4,
    q5_tiempo_espera: 3,
    q6_utilidad: 3,
    q7_mejoria: 2,
    q8_recomendar: 3,
    q9_comentarios:
      "Tuve que dejar de ir porque mis prácticas profesionales chocaban con el horario presencial de las 11 am.",
    q10a_facilidad_eli: 4,
    q10b_util_eli: 4,
    hash_auditoria: "c928374650192837465019283746501928374650192837465019283746501928",
    created_at: "2026-10-26T18:00:00Z",
  },
  {
    id: "enc-004",
    folio: "TESH-2026-1002",
    user_id: "demo-student-04",
    trigger_tipo: "alta",
    trigger_fecha: "2026-10-28T16:00:00Z",
    enviada_en: "2026-10-28T16:30:00Z",
    respondida_en: "2026-10-29T11:15:00Z",
    q1_satisfaccion: 5,
    q2_escuchado: 5,
    q3_claridad: 5,
    q4_respeto: 5,
    q5_tiempo_espera: 5,
    q6_utilidad: 5,
    q7_mejoria: 5,
    q8_recomendar: 5,
    q9_comentarios:
      "Agradezco mucho la privacidad y el apoyo. Eli al inicio fue súper directa y me dio confianza.",
    q10a_facilidad_eli: 5,
    q10b_util_eli: 5,
    hash_auditoria: "d019283746501928374650192837465019283746501928374650192837465019",
    created_at: "2026-10-29T11:15:00Z",
  },
  {
    id: "enc-005",
    folio: "TESH-2026-0649",
    user_id: "demo-student-05",
    trigger_tipo: "abandono",
    trigger_fecha: "2026-10-30T09:00:00Z",
    enviada_en: "2026-10-30T09:15:00Z",
    respondida_en: "2026-11-01T14:30:00Z",
    q1_satisfaccion: 3,
    q2_escuchado: 3,
    q3_claridad: 4,
    q4_respeto: 5,
    q5_tiempo_espera: 2,
    q6_utilidad: 3,
    q7_mejoria: 3,
    q8_recomendar: 4,
    q9_comentarios:
      "Se me dificultó llegar a tiempo por el transporte público desde Huixquilucan centro.",
    q10a_facilidad_eli: 4,
    q10b_util_eli: 4,
    hash_auditoria: "e192837465019283746501928374650192837465019283746501928374650192",
    created_at: "2026-11-01T14:30:00Z",
  },
];

function getLocalRespuestas(): RespuestaEncuesta[] {
  if (typeof window === "undefined") return SEMILLAS_ENCUESTA;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEMILLAS_ENCUESTA));
      return SEMILLAS_ENCUESTA;
    }
    return JSON.parse(raw);
  } catch {
    return SEMILLAS_ENCUESTA;
  }
}

function saveLocalRespuestas(list: RespuestaEncuesta[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Error guardando encuestas en localStorage:", err);
  }
}

/**
 * Obtener listado de respuestas de encuestas con filtros opcionales
 */
export async function getRespuestasEncuesta(filtros?: {
  trigger_tipo?: string;
  search?: string;
}): Promise<RespuestaEncuesta[]> {
  try {
    let query = supabase
      .from("respuestas_encuesta")
      .select("*")
      .order("created_at", { ascending: false });

    if (filtros?.trigger_tipo && filtros.trigger_tipo !== "todos") {
      query = query.eq("trigger_tipo", filtros.trigger_tipo);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      let filtered = data as RespuestaEncuesta[];
      if (filtros?.search) {
        const s = filtros.search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.folio.toLowerCase().includes(s) ||
            (r.q9_comentarios && r.q9_comentarios.toLowerCase().includes(s)),
        );
      }
      return filtered;
    }
  } catch {
    // Continuar con almacenamiento local
  }

  let local = getLocalRespuestas();
  if (filtros?.trigger_tipo && filtros.trigger_tipo !== "todos") {
    local = local.filter((r) => r.trigger_tipo === filtros.trigger_tipo);
  }
  if (filtros?.search) {
    const s = filtros.search.toLowerCase();
    local = local.filter(
      (r) =>
        r.folio.toLowerCase().includes(s) ||
        (r.q9_comentarios && r.q9_comentarios.toLowerCase().includes(s)),
    );
  }
  return local;
}

/**
 * Guardar una nueva respuesta de encuesta completada por el estudiante
 */
export async function guardarRespuestaEncuesta(
  payload: Omit<RespuestaEncuesta, "id" | "hash_auditoria" | "created_at" | "respondida_en">,
): Promise<{ ok: boolean; id?: string; hash?: string; error?: string }> {
  try {
    const ahora = new Date().toISOString();
    const stringParaHash = `${payload.folio}|${payload.trigger_tipo}|${ahora}|${payload.q1_satisfaccion}|${payload.q2_escuchado}|${payload.q3_claridad}|${payload.q4_respeto}|${payload.q5_tiempo_espera}|${payload.q6_utilidad}|${payload.q7_mejoria}|${payload.q8_recomendar}|${payload.q10a_facilidad_eli}|${payload.q10b_util_eli}`;
    const hash = await sha256(stringParaHash);

    const nuevaRespuesta: RespuestaEncuesta = {
      ...payload,
      id: `enc-${Date.now().toString(36)}`,
      respondida_en: ahora,
      hash_auditoria: hash,
      created_at: ahora,
    };

    // Intentar persistir en Supabase
    try {
      await supabase.from("respuestas_encuesta").insert({
        folio: nuevaRespuesta.folio,
        user_id: nuevaRespuesta.user_id || null,
        trigger_tipo: nuevaRespuesta.trigger_tipo,
        trigger_fecha: nuevaRespuesta.trigger_fecha,
        enviada_en: nuevaRespuesta.enviada_en,
        respondida_en: nuevaRespuesta.respondida_en,
        q1_satisfaccion: nuevaRespuesta.q1_satisfaccion,
        q2_escuchado: nuevaRespuesta.q2_escuchado,
        q3_claridad: nuevaRespuesta.q3_claridad,
        q4_respeto: nuevaRespuesta.q4_respeto,
        q5_tiempo_espera: nuevaRespuesta.q5_tiempo_espera,
        q6_utilidad: nuevaRespuesta.q6_utilidad,
        q7_mejoria: nuevaRespuesta.q7_mejoria,
        q8_recomendar: nuevaRespuesta.q8_recomendar,
        q9_comentarios: nuevaRespuesta.q9_comentarios || null,
        q10a_facilidad_eli: nuevaRespuesta.q10a_facilidad_eli,
        q10b_util_eli: nuevaRespuesta.q10b_util_eli,
        hash_auditoria: hash,
      });
    } catch {
      // Ignorar error de red y guardar en local
    }

    const localList = getLocalRespuestas();
    const updated = [nuevaRespuesta, ...localList.filter((r) => r.folio !== payload.folio)];
    saveLocalRespuestas(updated);

    return { ok: true, id: nuevaRespuesta.id, hash };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error inesperado al guardar la encuesta",
    };
  }
}

/**
 * Calcula métricas, promedios y datos para gráficas Donut y Barras
 */
export function calcularMetricasEncuesta(respuestas: RespuestaEncuesta[]): MetricasEncuesta {
  const respondidas = respuestas.filter((r) => Boolean(r.respondida_en));
  const total = respondidas.length;

  if (total === 0) {
    return {
      totalEncuestas: respuestas.length,
      totalRespondidas: 0,
      tasaRespuesta: 0,
      promedioGeneral: 0,
      npsScore: 0,
      promedioEli: 0,
      totalAltas: 0,
      totalAbandonos: 0,
      promedioAltas: 0,
      promedioAbandonos: 0,
      promediosPorReactivo: [],
      distribucionSatisfaccion: [],
      distribucionTriggers: [],
    };
  }

  // Sumas por reactivo
  let sumaQ1 = 0;
  let sumaQ2 = 0;
  let sumaQ3 = 0;
  let sumaQ4 = 0;
  let sumaQ5 = 0;
  let sumaQ6 = 0;
  let sumaQ7 = 0;
  let sumaQ8 = 0;
  let sumaQ10a = 0;
  let sumaQ10b = 0;

  let promotores = 0;
  let detractores = 0;

  let altasCount = 0;
  let altasSuma = 0;
  let abandonosCount = 0;
  let abandonosSuma = 0;

  const distribucionSatMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const r of respondidas) {
    sumaQ1 += r.q1_satisfaccion;
    sumaQ2 += r.q2_escuchado;
    sumaQ3 += r.q3_claridad;
    sumaQ4 += r.q4_respeto;
    sumaQ5 += r.q5_tiempo_espera;
    sumaQ6 += r.q6_utilidad;
    sumaQ7 += r.q7_mejoria;
    sumaQ8 += r.q8_recomendar;
    sumaQ10a += r.q10a_facilidad_eli;
    sumaQ10b += r.q10b_util_eli;

    const promedioIndiv =
      (r.q1_satisfaccion +
        r.q2_escuchado +
        r.q3_claridad +
        r.q4_respeto +
        r.q5_tiempo_espera +
        r.q6_utilidad +
        r.q7_mejoria +
        r.q8_recomendar) /
      8;

    if (r.trigger_tipo === "alta") {
      altasCount++;
      altasSuma += promedioIndiv;
    } else {
      abandonosCount++;
      abandonosSuma += promedioIndiv;
    }

    // NPS con Q8
    if (r.q8_recomendar >= 4) promotores++;
    else if (r.q8_recomendar <= 2) detractores++;

    // Distribución Q1
    distribucionSatMap[r.q1_satisfaccion] = (distribucionSatMap[r.q1_satisfaccion] || 0) + 1;
  }

  const promQ1 = Number((sumaQ1 / total).toFixed(2));
  const promQ2 = Number((sumaQ2 / total).toFixed(2));
  const promQ3 = Number((sumaQ3 / total).toFixed(2));
  const promQ4 = Number((sumaQ4 / total).toFixed(2));
  const promQ5 = Number((sumaQ5 / total).toFixed(2));
  const promQ6 = Number((sumaQ6 / total).toFixed(2));
  const promQ7 = Number((sumaQ7 / total).toFixed(2));
  const promQ8 = Number((sumaQ8 / total).toFixed(2));
  const promQ10a = Number((sumaQ10a / total).toFixed(2));
  const promQ10b = Number((sumaQ10b / total).toFixed(2));

  const promedioGeneral = Number(
    ((promQ1 + promQ2 + promQ3 + promQ4 + promQ5 + promQ6 + promQ7 + promQ8) / 8).toFixed(2),
  );

  const npsScore = Math.round(((promotores - detractores) / total) * 100);
  const promedioEli = Number(((promQ10a + promQ10b) / 2).toFixed(2));

  return {
    totalEncuestas: respuestas.length,
    totalRespondidas: total,
    tasaRespuesta: Math.round((total / (respuestas.length || 1)) * 100),
    promedioGeneral,
    npsScore,
    promedioEli,
    totalAltas: altasCount,
    totalAbandonos: abandonosCount,
    promedioAltas: altasCount > 0 ? Number((altasSuma / altasCount).toFixed(2)) : 0,
    promedioAbandonos: abandonosCount > 0 ? Number((abandonosSuma / abandonosCount).toFixed(2)) : 0,
    promediosPorReactivo: [
      { clave: "Q1", label: "Satisfacción", promedio: promQ1, categoria: "general" },
      { clave: "Q2", label: "Escucha/Empatía", promedio: promQ2, categoria: "psicologo" },
      { clave: "Q3", label: "Claridad", promedio: promQ3, categoria: "psicologo" },
      { clave: "Q4", label: "Respeto/Privacidad", promedio: promQ4, categoria: "psicologo" },
      { clave: "Q5", label: "Puntualidad/Espacio", promedio: promQ5, categoria: "servicio" },
      { clave: "Q6", label: "Herramientas", promedio: promQ6, categoria: "servicio" },
      { clave: "Q7", label: "Mejoría Emocional", promedio: promQ7, categoria: "general" },
      { clave: "Q8", label: "Recomendación", promedio: promQ8, categoria: "general" },
      { clave: "Q10.A", label: "Eli: Tamizaje", promedio: promQ10a, categoria: "eli" },
      { clave: "Q10.B", label: "Eli: Orientación", promedio: promQ10b, categoria: "eli" },
    ],
    distribucionSatisfaccion: [
      { nombre: "5 - Excelente", cantidad: distribucionSatMap[5] || 0, color: "#12BDB6" },
      { nombre: "4 - Bueno", cantidad: distribucionSatMap[4] || 0, color: "#6857E4" },
      { nombre: "3 - Aceptable", cantidad: distribucionSatMap[3] || 0, color: "#A9DB1B" },
      { nombre: "2 - Regular", cantidad: distribucionSatMap[2] || 0, color: "#A9DB1B" },
      { nombre: "1 - Muy deficiente", cantidad: distribucionSatMap[1] || 0, color: "#FF9CED" },
    ],
    distribucionTriggers: [
      { nombre: "Alta de Proceso", cantidad: altasCount, color: "#6857E4" },
      { nombre: "Abandono (2 Inasistencias)", cantidad: abandonosCount, color: "#A9DB1B" },
    ],
  };
}

/**
 * Disparador de envío institucional de la encuesta (confirmado MIN-008):
 * - Alta: psicólogo marca 'completada' -> enviar enlace en 24h
 * - Abandono: 2 'no_asistio' consecutivos -> enviar en ventana 15 días
 * - NO ventanas 30/60/90 días
 */
export async function triggerEnvioEncuesta(params: {
  folio: string;
  user_id?: string;
  trigger_tipo: TriggerEncuestaTipo;
  email?: string;
  nombre?: string;
}): Promise<{ ok: boolean; mensaje: string; idEnvio?: string }> {
  const ahora = new Date().toISOString();
  const urlBase =
    typeof window !== "undefined" ? window.location.origin : "https://equilibra-tesh.edu.mx";
  const enlace = `${urlBase}/encuesta?folio=${encodeURIComponent(params.folio)}&tipo=${params.trigger_tipo}`;

  // Enviar vía Resend SMTP
  const destinoEmail = params.email || `${params.folio.toLowerCase()}@comunidad.tesh.edu.mx`;
  const emailRes = await enviarNotificacionEncuestaResend({
    destinatarioEmail: destinoEmail,
    destinatarioNombre: params.nombre,
    folio: params.folio,
    triggerTipo: params.trigger_tipo,
    enlaceEncuesta: enlace,
  });

  const textoTipo =
    params.trigger_tipo === "alta" ? "alta de proceso (enlace 24h)" : "abandono (ventana 15 días)";

  return {
    ok: emailRes.ok,
    idEnvio: emailRes.messageId,
    mensaje: `Disparador PB-021 activado por ${textoTipo}. Notificación ${
      emailRes.modo === "resend_api"
        ? "enviada vía Resend SMTP"
        : "registrada en cola institucional"
    } para el folio ${params.folio}.`,
  };
}
