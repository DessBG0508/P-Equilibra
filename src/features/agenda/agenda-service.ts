import { supabase } from "@/lib/supabase";
import type { SolicitudCita, EstadoCita } from "./types";
import { verificarVentanaCancelacion } from "./types";
import { triggerEnvioEncuesta } from "../encuesta/encuesta-service";

const LOCAL_STORAGE_KEY = "equilibra_solicitudes_cita_v1";

// Citas iniciales sembradas para demostración interactiva inmediata
const SEED_SOLICITUDES: SolicitudCita[] = [
  {
    id: "sol-001",
    folio: "EQ-9374",
    user_id: "demo-user-student",
    psicologo_id: "psy-001",
    nombre_psicologo: "Dra. Marta Gómez",
    iniciales_estudiante: "D.B.",
    carrera_estudiante: "Ing. en Sistemas Computacionales",
    semestre_estudiante: "6º Semestre",
    nivel_tamizaje: "rojo",
    puntaje_phq9: 9,
    puntaje_gad7: 14,
    fecha_solicitud: new Date(Date.now() - 86400000).toISOString(),
    fecha_cita: "2026-11-06",
    hora_cita: "11:00",
    modalidad: "presencial",
    estado: "pendiente",
    motivo: "He sentido dificultad para concentrarme en exámenes y constante tensión.",
  },
  {
    id: "sol-002",
    folio: "EQ-4120",
    user_id: "demo-user-student-2",
    psicologo_id: "psy-001",
    nombre_psicologo: "Dra. Marta Gómez",
    iniciales_estudiante: "M.R.",
    carrera_estudiante: "Ing. Industrial",
    semestre_estudiante: "4º Semestre",
    nivel_tamizaje: "amarillo",
    puntaje_phq9: 6,
    puntaje_gad7: 11,
    fecha_solicitud: new Date(Date.now() - 172800000).toISOString(),
    fecha_cita: "2026-11-05",
    hora_cita: "15:00",
    modalidad: "presencial",
    estado: "confirmada",
    motivo: "Seguimiento de técnicas de respiración y manejo de ansiedad.",
  },
];

function getLocalSolicitudes(): SolicitudCita[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_SOLICITUDES));
      return SEED_SOLICITUDES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_SOLICITUDES;
  } catch {
    return SEED_SOLICITUDES;
  }
}

function saveLocalSolicitudes(list: SolicitudCita[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

/**
 * Obtener solicitudes del estudiante actual
 */
export async function getSolicitudesEstudiante(
  userId: string,
  folio?: string,
): Promise<SolicitudCita[]> {
  try {
    let query = supabase
      .from("solicitudes_cita")
      .select("*")
      .order("fecha_cita", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (folio) {
      query = query.eq("folio", folio);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return data as SolicitudCita[];
    }
  } catch {
    // Continuar a fallback
  }

  // Fallback local
  const localList = getLocalSolicitudes();
  if (folio) {
    const filtered = localList.filter((s) => s.folio === folio || s.user_id === userId);
    return filtered.length > 0 ? filtered : localList;
  }
  return localList;
}

/**
 * Obtener solicitudes para el panel del psicólogo con filtros
 */
export async function getSolicitudesPsicologo(filtros?: {
  fecha?: string;
  estado?: EstadoCita;
}): Promise<SolicitudCita[]> {
  try {
    let query = supabase
      .from("solicitudes_cita")
      .select("*")
      .order("fecha_cita", { ascending: true })
      .order("hora_cita", { ascending: true });

    if (filtros?.fecha) {
      query = query.eq("fecha_cita", filtros.fecha);
    }
    if (filtros?.estado) {
      query = query.eq("estado", filtros.estado);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return data as SolicitudCita[];
    }
  } catch {
    // Continuar a fallback
  }

  let list = getLocalSolicitudes();
  if (filtros?.fecha) {
    list = list.filter((s) => s.fecha_cita === filtros.fecha);
  }
  if (filtros?.estado) {
    list = list.filter((s) => s.estado === filtros.estado);
  }
  return list;
}

/**
 * Crear nueva solicitud de cita con validación de límite (máximo 1 activa pendiente)
 */
export async function crearSolicitudCita(
  solicitud: Omit<SolicitudCita, "id" | "fecha_solicitud" | "created_at" | "updated_at">,
): Promise<{ ok: boolean; cita?: SolicitudCita; error?: string }> {
  // Validar si ya tiene cita activa
  const existentes = await getSolicitudesEstudiante(solicitud.user_id, solicitud.folio);
  const activa = existentes.find((c) => c.estado === "pendiente");
  if (activa) {
    return {
      ok: false,
      error: `Ya cuentas con una solicitud pendiente para el ${activa.fecha_cita} a las ${activa.hora_cita}. Solo se permite 1 cita pendiente por estudiante a la vez.`,
    };
  }

  const nuevaCita: SolicitudCita = {
    ...solicitud,
    id: `sol-${Date.now().toString(36)}`,
    fecha_solicitud: new Date().toISOString(),
    modalidad: "presencial",
    estado: "pendiente",
  };

  try {
    const { data, error } = await supabase
      .from("solicitudes_cita")
      .insert({
        folio: nuevaCita.folio,
        user_id: nuevaCita.user_id,
        psicologo_id: nuevaCita.psicologo_id || null,
        fecha_cita: nuevaCita.fecha_cita,
        hora_cita: nuevaCita.hora_cita,
        modalidad: "presencial",
        estado: "pendiente",
        motivo: nuevaCita.motivo || null,
      })
      .select()
      .single();

    if (!error && data) {
      nuevaCita.id = data.id;
    }
  } catch {
    // Fallback local
  }

  const localList = getLocalSolicitudes();
  saveLocalSolicitudes([nuevaCita, ...localList]);

  return { ok: true, cita: nuevaCita };
}

/**
 * Cancelar cita por el estudiante (requiere mínimo 2h de anticipación)
 */
export async function cancelarCitaEstudiante(
  citaId: string,
  fechaCita: string,
  horaCita: string,
  motivo?: string,
): Promise<{ ok: boolean; error?: string }> {
  const check = verificarVentanaCancelacion(fechaCita, horaCita);
  if (!check.puedeCancelar) {
    return {
      ok: false,
      error: check.mensaje || "La cita solo puede cancelarse con al menos 2 horas de anticipación.",
    };
  }

  try {
    // P0 #7 — Antes: `await supabase.update()` sin revisar `.error` y siempre
    // hacía fallback a localStorage retornando `ok: true`. El usuario veía
    // "cita cancelada" pero el registro en Supabase seguía pendiente/confirmada
    // (RLS rechazaba silenciosamente). Ahora revisamos error y abortamos.
    const { error: updateError } = await supabase
      .from("solicitudes_cita")
      .update({
        estado: "cancelada",
        cancelado_por: "estudiante",
        motivo_cancelacion: motivo || "Cancelada por el estudiante vía portal",
        updated_at: new Date().toISOString(),
      })
      .eq("id", citaId);

    if (updateError) {
      console.error("Supabase rechazó la cancelación:", updateError);
      return {
        ok: false,
        error:
          "No se pudo cancelar la cita en el servidor. Verifica que la cita sea tuya, que falten al menos 2 horas y que su estado siga activo.",
      };
    }
  } catch (err) {
    console.error("Error de red al cancelar la cita:", err);
    return {
      ok: false,
      error: "Error de red al contactar el servidor. Revisa tu conexión e inténtalo de nuevo.",
    };
  }

  // Solo si Supabase OK, sincronizamos el cache local.
  const localList = getLocalSolicitudes();
  const index = localList.findIndex((c) => c.id === citaId);
  if (index !== -1) {
    localList[index] = {
      ...localList[index],
      estado: "cancelada",
      cancelado_por: "estudiante",
      motivo_cancelacion: motivo || "Cancelada por el estudiante vía portal",
    };
    saveLocalSolicitudes(localList);
  }

  return { ok: true };
}

/**
 * Actualizar estado de cita por el psicólogo (Aceptar / Cancelar / Completar / No asistió)
 * Regla: 2 inasistencias consecutivas 'no_asistio' -> trigger PB-021 encuesta de abandono
 */
export async function actualizarEstadoCitaPsicologo(
  citaId: string,
  nuevoEstado: EstadoCita,
  motivoCancelacion?: string,
): Promise<{ ok: boolean; triggerEncuestaAbandono: boolean }> {
  let triggerEncuestaAbandono = false;

  try {
    const updatePayload: Record<string, unknown> = {
      estado: nuevoEstado,
      updated_at: new Date().toISOString(),
    };

    if (nuevoEstado === "cancelada") {
      updatePayload.cancelado_por = "psicologo";
      updatePayload.motivo_cancelacion =
        motivoCancelacion || "Cancelada por el psicólogo por causas de fuerza mayor";
    }

    await supabase.from("solicitudes_cita").update(updatePayload).eq("id", citaId);
  } catch {
    // Continuar local
  }

  const localList = getLocalSolicitudes();
  const index = localList.findIndex((c) => c.id === citaId);
  if (index !== -1) {
    const target = localList[index];
    localList[index] = {
      ...target,
      estado: nuevoEstado,
      cancelado_por: nuevoEstado === "cancelada" ? "psicologo" : target.cancelado_por,
      motivo_cancelacion:
        nuevoEstado === "cancelada"
          ? motivoCancelacion || "Cancelada por el psicólogo"
          : target.motivo_cancelacion,
    };

    // Disparadores automáticos PB-021 (MIN-008):
    // 1. Alta clínica (cita completada) -> enlace en ventana de 24h
    if (nuevoEstado === "completada") {
      triggerEnvioEncuesta({
        folio: target.folio,
        user_id: target.user_id,
        trigger_tipo: "alta",
      }).catch((err) => console.error("Error al disparar PB-021 Alta:", err));
    }

    // 2. Abandono (2 inasistencias consecutivas 'no_asistio') -> ventana de 15 días
    if (nuevoEstado === "no_asistio") {
      const citasDelEstudiante = localList
        .filter((c) => c.folio === target.folio || c.user_id === target.user_id)
        .sort((a, b) => new Date(b.fecha_cita).getTime() - new Date(a.fecha_cita).getTime());

      if (
        citasDelEstudiante.length >= 2 &&
        citasDelEstudiante[0].estado === "no_asistio" &&
        citasDelEstudiante[1].estado === "no_asistio"
      ) {
        triggerEncuestaAbandono = true;
        triggerEnvioEncuesta({
          folio: target.folio,
          user_id: target.user_id,
          trigger_tipo: "abandono",
        }).catch((err) => console.error("Error al disparar PB-021 Abandono:", err));
      }
    }

    saveLocalSolicitudes(localList);
  }

  return { ok: true, triggerEncuestaAbandono };
}
