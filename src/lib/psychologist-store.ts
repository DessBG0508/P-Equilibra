import { psychologistCases, mockAppointments } from "./mock-data";
import { addSystemNotification } from "./notifications";
import type {
  CaseSummary,
  ClinicalNote,
  CaseStatus,
  RiskLevel,
  Appointment,
  AppointmentModality,
} from "./types";

const CASES_STORAGE_KEY = "equilibra_psych_cases_v1";
const NOTES_STORAGE_KEY = "equilibra_psych_notes_v1";
const APPOINTMENTS_STORAGE_KEY = "equilibra_citas_v1";

const INITIAL_CASES: CaseSummary[] = psychologistCases;

const INITIAL_NOTES: ClinicalNote[] = [
  {
    id: "note-01",
    caseId: "case-mg",
    date: "22 sep 2026, 11:20",
    author: "Dra. Marta Gómez",
    title: "Alerta de tamizaje recibida (Nivel Rojo)",
    category: "emergencia",
    content:
      "Se identificó puntuación PHQ-9 de 14 y reporte explícito de insomnio sostenido por entregas departamentales. Pendiente realizar llamada de contención y acordar cita presencial en cubículo 3.",
  },
  {
    id: "note-02",
    caseId: "case-lr",
    date: "22 sep 2026, 16:45",
    author: "Dra. Marta Gómez",
    title: "Contacto preventivo inicial",
    category: "contacto",
    content:
      "Se envió correo institucional al alumno ofreciendo un espacio de escucha respetuosa. El estudiante confirmó recepción indicando interés en técnicas de respiración diafragmática.",
  },
  {
    id: "note-03",
    caseId: "case-av",
    date: "23 sep 2026, 10:15",
    author: "Lic. Carlos Fuentes",
    title: "Check-in de seguimiento",
    category: "seguimiento",
    content:
      "Reporta mejor gestión del tiempo para las materias de ciencias básicas. Se sugiere continuar con registro semanal de check-in emocional.",
  },
];

export function getPsychologistCases(): CaseSummary[] {
  try {
    const stored = localStorage.getItem(CASES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length >= INITIAL_CASES.length) {
        return parsed.map((item: CaseSummary) => {
          const initial = INITIAL_CASES.find((c) => c.id === item.id);
          return {
            ...item,
            matricula: item.matricula || initial?.matricula,
            modo_acompanamiento:
              item.modo_acompanamiento !== undefined
                ? item.modo_acompanamiento
                : (initial?.modo_acompanamiento ?? true),
          };
        });
      }
    }
  } catch (e) {
    console.error("Error al leer casos", e);
  }
  return INITIAL_CASES;
}

export function savePsychologistCases(cases: CaseSummary[]): void {
  try {
    localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    console.error("Error al guardar casos", e);
  }
}

export function updateCaseRisk(
  caseId: string,
  riskLevel: RiskLevel,
  status?: CaseStatus,
): CaseSummary[] {
  const current = getPsychologistCases();
  const updated: CaseSummary[] = current.map((item) => {
    if (item.id === caseId) {
      const nextStatus = status ?? item.status;
      return {
        ...item,
        riskLevel,
        ...(nextStatus ? { status: nextStatus } : {}),
      };
    }
    return item;
  });
  savePsychologistCases(updated);
  return updated;
}

export function updateCaseStatus(caseId: string, status: CaseStatus): CaseSummary[] {
  const current = getPsychologistCases();
  const updated = current.map((item) => (item.id === caseId ? { ...item, status } : item));
  savePsychologistCases(updated);
  return updated;
}

export function getAllClinicalNotes(): ClinicalNote[] {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    if (stored) {
      const parsed: ClinicalNote[] = JSON.parse(stored);
      return parsed.filter(
        (n) =>
          !n.content.toLowerCase().includes("zpojz") &&
          !n.title.toLowerCase().includes("zpojz") &&
          !n.content.toLowerCase().includes("equilibra-tesh-tu-bienestar") &&
          !n.title.toLowerCase().includes("equilibra-tesh-tu-bienestar"),
      );
    }
  } catch (e) {
    console.error("Error al leer notas clínicas", e);
  }
  return INITIAL_NOTES;
}

export function saveClinicalNotes(notes: ClinicalNote[]): void {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error("Error al guardar notas clínicas", e);
  }
}

export function getCaseNotes(caseId: string): ClinicalNote[] {
  const all = getAllClinicalNotes();
  return all.filter((n) => n.caseId === caseId);
}

export function addClinicalNote(noteData: Omit<ClinicalNote, "id" | "date">): ClinicalNote {
  const all = getAllClinicalNotes();
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}, ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  const newNote: ClinicalNote = {
    ...noteData,
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    date: formattedDate,
  };

  const updatedNotes = [newNote, ...all];
  saveClinicalNotes(updatedNotes);

  // Actualizar contador en el caso correspondiente
  const cases = getPsychologistCases();
  const updatedCases = cases.map((c) =>
    c.id === noteData.caseId
      ? {
          ...c,
          notesCount: (c.notesCount || 0) + 1,
          lastContactDate: formattedDate,
        }
      : c,
  );
  savePsychologistCases(updatedCases);

  return newNote;
}

export function recordPatientContact(
  caseId: string,
  channel: string,
  outcome: string,
  notes: string,
  author: string = "Dra. Marta Gómez",
): void {
  const currentCases = getPsychologistCases();
  const targetCase = currentCases.find((c) => c.id === caseId);
  const initials = targetCase?.initials || "Estudiante";

  addClinicalNote({
    caseId,
    author,
    title: `Contacto institucional registrado (${channel})`,
    category: "contacto",
    content: `Canal: ${channel}\nResultado: ${outcome}\nDetalle: ${notes || "Sin observaciones adicionales."}`,
  });

  updateCaseStatus(
    caseId,
    outcome === "Cita acordada"
      ? "cita_programada"
      : outcome === "Atención finalizada / Estable"
        ? "atendido"
        : "en_seguimiento",
  );

  addSystemNotification({
    recipientRole: "psicologo",
    type: "sistema",
    title: `Contacto registrado: Caso ${initials}`,
    message: `Se registró contacto vía ${channel}. Resultado: ${outcome}.`,
    priority: "media",
    caseId,
  });
}

export function getStoredAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (raw) {
      const parsed: Appointment[] = JSON.parse(raw);
      // Ensure studentName fallback if missing
      return parsed.map((apt, idx) => {
        const matchingMock = mockAppointments.find((m) => m.id === apt.id);
        const fallbackNames = [
          "Mireya González",
          "Luis Ramírez",
          "Carlos Paredes",
          "Andrea Valdés",
          "Jimena Soto",
        ];
        const studentName =
          apt.studentName ??
          matchingMock?.studentName ??
          fallbackNames[idx % fallbackNames.length] ??
          "Estudiante";
        return {
          ...apt,
          studentName,
          modality: "presencial" as const,
          locationOrLink:
            apt.locationOrLink && apt.locationOrLink.toLowerCase().includes("videollamada")
              ? "Consultorio 3, Edificio de Bienestar Integral TESH"
              : apt.locationOrLink || "Consultorio 3, Edificio de Bienestar Integral TESH",
        };
      });
    }
  } catch (e) {
    console.error("Error al leer citas", e);
  }
  return mockAppointments;
}

export function saveStoredAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  } catch (e) {
    console.error("Error al guardar citas", e);
  }
}

export function completeAppointment(appointmentId: string): {
  appointments: Appointment[];
  completedAppointment: Appointment | null;
  clinicalNote: ClinicalNote | null;
} {
  const current = getStoredAppointments();
  const target = current.find((a) => a.id === appointmentId);
  if (!target) {
    return { appointments: current, completedAppointment: null, clinicalNote: null };
  }

  const updatedTarget: Appointment = {
    ...target,
    status: "realizada",
  };

  const updatedAppointments = current.map((a) => (a.id === appointmentId ? updatedTarget : a));
  saveStoredAppointments(updatedAppointments);

  // Determinar caso asociado
  const allCases = getPsychologistCases();
  let caseId = target.caseId;
  if (!caseId && target.studentName) {
    const foundCase = allCases.find(
      (c) => c.studentName?.toLowerCase() === target.studentName?.toLowerCase(),
    );
    if (foundCase) caseId = foundCase.id;
  }
  if (!caseId) {
    caseId = allCases[0]?.id || "case-mg";
  }

  // Registrar nota clínica automática bajo la categoría "sesion" (Sesión Clínica)
  const patientName = target.studentName || "Paciente";
  const note = addClinicalNote({
    caseId,
    author: target.psychologistName || "Dra. Marta Gómez",
    title: `Sesión clínica completada — ${patientName}`,
    category: "sesion",
    content: `Sesión de acompañamiento completada satisfactoriamente con ${patientName}.\nFecha: ${target.date} | Horario: ${target.timeSlot}\nModalidad: Presencial (Consultorio 3)\nObservaciones: ${target.notes || "Sesión realizada según plan de intervención."}`,
  });

  // Actualizar caso a atendido o en seguimiento
  updateCaseStatus(caseId, "atendido");

  return {
    appointments: updatedAppointments,
    completedAppointment: updatedTarget,
    clinicalNote: note,
  };
}

export function cancelAppointment(appointmentId: string): Appointment[] {
  const current = getStoredAppointments();
  const updatedAppointments = current.map((a) =>
    a.id === appointmentId ? { ...a, status: "cancelada" as const } : a,
  );
  saveStoredAppointments(updatedAppointments);
  return updatedAppointments;
}

export function scheduleSessionFromPsychologist(data: {
  caseId: string;
  studentInitials: string;
  studentName: string;
  date: string;
  timeSlot: string;
  modality: AppointmentModality;
  psychologistName: string;
  sessionTopic: string;
  notes?: string;
}): Appointment {
  const appointments = getStoredAppointments();

  const locationOrLink = "Consultorio 3, Edificio de Bienestar Integral TESH";

  const newAppointment: Appointment = {
    id: `apt-${Date.now()}`,
    studentName: data.studentName,
    caseId: data.caseId,
    date: data.date,
    timeSlot: data.timeSlot,
    modality: "presencial",
    psychologistName: data.psychologistName,
    psychologistRole: "Psicóloga clínica y bienestar estudiantil",
    locationOrLink,
    status: "confirmada",
    notes: `${data.sessionTopic}. ${data.notes ? `Observaciones: ${data.notes}` : ""}`,
    createdAt: new Date().toISOString(),
  };

  const updatedAppointments = [newAppointment, ...appointments];
  saveStoredAppointments(updatedAppointments);

  // Actualizar estado del caso
  updateCaseStatus(data.caseId, "cita_programada");

  // Registrar nota clínica automática
  addClinicalNote({
    caseId: data.caseId,
    author: data.psychologistName,
    title: "Cita programada (Presencial)",
    category: "sesion",
    content: `Fecha: ${data.date} | Horario: ${data.timeSlot}\nTema: ${data.sessionTopic}\nUbicación: ${locationOrLink}`,
  });

  // Notificación al sistema para el psicólogo
  addSystemNotification({
    recipientRole: "psicologo",
    type: "cita_nueva",
    title: `Nueva cita agendada: Caso ${data.studentInitials}`,
    message: `Sesión presencial programada para el ${data.date} a las ${data.timeSlot}.`,
    priority: "media",
    caseId: data.caseId,
  });

  // Notificación al sistema para el estudiante
  addSystemNotification({
    recipientRole: "estudiante",
    type: "cita_nueva",
    title: `Tu psicóloga ha programado una sesión contigo`,
    message: `Tienes cita el ${data.date} a las ${data.timeSlot} con ${data.psychologistName}.`,
    priority: "alta",
  });

  return newAppointment;
}

export function activateCrisisProtocol(
  caseId: string,
  details: string,
  author: string = "Dra. Marta Gómez",
): void {
  const currentCases = getPsychologistCases();
  const targetCase = currentCases.find((c) => c.id === caseId);
  const initials = targetCase?.initials || "Estudiante";

  addClinicalNote({
    caseId,
    author,
    title: "Protocolo de Emergencia / Riesgo Alto Activado",
    category: "emergencia",
    content: `Se activó protocolo de atención inmediata para el caso ${initials}.\nDetalles: ${details}\nAcciones inmediatas: Canalización a Línea de la Vida (800 911 2000), alerta preventiva a Coordinación de Tutorías y Servicio Médico TESH.`,
  });

  updateCaseRisk(caseId, "rojo", "en_seguimiento");

  addSystemNotification({
    recipientRole: "psicologo",
    type: "alerta_roja",
    title: `Protocolo Activado — Caso ${initials}`,
    message: `Se registró activación de protocolo de emergencia para ${initials}. Revisa el expediente para seguimiento continuo.`,
    priority: "alta",
    caseId,
  });
}
