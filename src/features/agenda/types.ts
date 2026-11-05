// ==============================================================================
// TIPOS DE DATOS: AGENDA DE CITAS PB-009 (Equilibra TESH)
// ==============================================================================

export type EstadoCita = "pendiente" | "confirmada" | "cancelada" | "completada" | "no_asistio";

export type ModalidadCita = "presencial";

export type CanceladoPor = "estudiante" | "psicologo" | "sistema";

export type AgendaBadgeType = "AUTO" | "ESTUDIANTE" | "PSICÓLOGO" | "MIXTO";

export interface SolicitudCita {
  id: string;
  folio: string;
  user_id: string;
  psicologo_id?: string | null;
  nombre_psicologo?: string;
  iniciales_estudiante?: string;
  carrera_estudiante?: string;
  semestre_estudiante?: string;
  nivel_tamizaje?: "rojo" | "amarillo" | "verde";
  puntaje_phq9?: number;
  puntaje_gad7?: number;
  fecha_solicitud: string;
  fecha_cita: string; // YYYY-MM-DD
  hora_cita: string; // HH:mm:ss o HH:mm
  modalidad: ModalidadCita;
  estado: EstadoCita;
  motivo?: string | null;
  cancelado_por?: CanceladoPor | null;
  motivo_cancelacion?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HorarioSlot {
  hora: string; // "09:00"
  label: string; // "09:00 - 09:50"
  turno: "matutino" | "vespertino";
  ocupado?: boolean;
}

export const HORARIOS_CONFIGURADOS: HorarioSlot[] = [
  { hora: "09:00", label: "09:00 - 09:50", turno: "matutino" },
  { hora: "10:00", label: "10:00 - 10:50", turno: "matutino" },
  { hora: "11:00", label: "11:00 - 11:50", turno: "matutino" },
  { hora: "12:00", label: "12:00 - 12:50", turno: "matutino" },
  { hora: "15:00", label: "15:00 - 15:50", turno: "vespertino" },
  { hora: "16:00", label: "16:00 - 16:50", turno: "vespertino" },
  { hora: "17:00", label: "17:00 - 17:50", turno: "vespertino" },
];

/**
 * Valida si faltan más de 2 horas para la cita.
 * Regla de negocio PB-009: solo cancelable mínimo 2 horas antes de la hora propuesta.
 */
export function verificarVentanaCancelacion(
  fechaCita: string,
  horaCita: string,
): { puedeCancelar: boolean; horasRestantes: number; mensaje?: string } {
  try {
    const fechaHoraStr = `${fechaCita}T${horaCita.length === 5 ? `${horaCita}:00` : horaCita}`;
    const citaDate = new Date(fechaHoraStr);
    const ahora = new Date();

    const diffMs = citaDate.getTime() - ahora.getTime();
    const horasRestantes = diffMs / (1000 * 60 * 60);

    if (horasRestantes >= 2) {
      return { puedeCancelar: true, horasRestantes };
    }

    if (horasRestantes < 0) {
      return {
        puedeCancelar: false,
        horasRestantes,
        mensaje: "La fecha y hora de la cita ya han pasado.",
      };
    }

    return {
      puedeCancelar: false,
      horasRestantes,
      mensaje: `Faltan menos de 2 horas (${Math.round(horasRestantes * 60)} min) para tu cita. Por política institucional, para cancelar con menos de 2 horas debes comunicarte directamente con Bienestar Estudiantil.`,
    };
  } catch {
    // P0 #7 — Fail-closed: antes devolvía `puedeCancelar: true` si horaCita
    // era null/undefined (lanzaba en `.length`). Eso era un bypass de seguridad.
    return {
      puedeCancelar: false,
      horasRestantes: 0,
      mensaje:
        "No se pudo validar la ventana de cancelación. Comunicate con Bienestar Estudiantil.",
    };
  }
}
