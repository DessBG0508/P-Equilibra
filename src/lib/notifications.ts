import type { UserRole } from "./types";

export type NotificationType =
  | "alerta_roja"
  | "alerta_amarilla"
  | "cita_nueva"
  | "cita_recordatorio"
  | "checkin_nuevo"
  | "sistema";

export interface AppNotification {
  id: string;
  recipientRole: UserRole | "all";
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "alta" | "media" | "baja";
  caseId?: string;
  actionLabel?: string;
}

const STORAGE_KEY = "equilibra_notifications_v1";

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-01",
    recipientRole: "psicologo",
    type: "alerta_roja",
    title: "Alerta Prioritaria — Nivel Rojo",
    message:
      "Estudiante M.G. reportó insomnio y angustia sostenida en check-in semanal (PHQ-9: 14/27). Requiere primer contacto en menos de 24h.",
    timestamp: "Hace 15 minutos",
    read: false,
    priority: "alta",
    caseId: "case-mg",
    actionLabel: "Atender caso",
  },
  {
    id: "notif-02",
    recipientRole: "psicologo",
    type: "alerta_roja",
    title: "Alerta de Acompañamiento — L.R.",
    message:
      "Estudiante L.R. presenta carga académica alta y puntaje GAD-7 de 13/21. Activó solicitud de contacto discreto.",
    timestamp: "Hace 1 hora",
    read: false,
    priority: "alta",
    caseId: "case-lr",
    actionLabel: "Ver expediente",
  },
  {
    id: "notif-03",
    recipientRole: "psicologo",
    type: "cita_nueva",
    title: "Cita programada confirmada",
    message:
      "Sesión presencial agendada para el viernes 25 de septiembre a las 11:00 AM en Consultorio 3 (Edificio de Bienestar).",
    timestamp: "Hoy, 09:30 AM",
    read: false,
    priority: "media",
    actionLabel: "Ver en agenda",
  },
  {
    id: "notif-04",
    recipientRole: "psicologo",
    type: "alerta_amarilla",
    title: "Seguimiento preventivo — A.V.",
    message:
      "Estudiante A.V. registró incremento de estrés ante evaluaciones departamentales. Se sugiere envío de recursos psicoeducativos.",
    timestamp: "Ayer, 04:20 PM",
    read: true,
    priority: "media",
    caseId: "case-av",
    actionLabel: "Ver caso",
  },
  {
    id: "notif-05",
    recipientRole: "psicologo",
    type: "checkin_nuevo",
    title: "Check-in actualizado — N.T.",
    message:
      "Estudiante N.T. completó su check-in semanal reportando estabilidad emocional y buena red de soporte.",
    timestamp: "16 sep 2026",
    read: true,
    priority: "baja",
    caseId: "case-nt",
  },
  {
    id: "notif-est-01",
    recipientRole: "estudiante",
    type: "cita_recordatorio",
    title: "Recordatorio de cita de acompañamiento",
    message:
      "Tienes una sesión programada con la Dra. Marta Gómez el viernes 25 de septiembre a las 11:00 AM en Consultorio 3.",
    timestamp: "Hace 2 horas",
    read: false,
    priority: "alta",
    actionLabel: "Ver detalles de cita",
  },
  {
    id: "notif-est-02",
    recipientRole: "estudiante",
    type: "checkin_nuevo",
    title: "Momento para tu check-in semanal",
    message: "Regálate 2 minutos para reconocer cómo te sientes esta semana académica en el TESH.",
    timestamp: "Hoy, 08:00 AM",
    read: false,
    priority: "media",
    actionLabel: "Hacer check-in",
  },
];

export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error al leer notificaciones", err);
  }
  return DEFAULT_NOTIFICATIONS;
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (err) {
    console.error("Error al guardar notificaciones", err);
  }
}

export function getNotificationsForRole(role: UserRole): AppNotification[] {
  const all = getStoredNotifications();
  return all.filter((n) => n.recipientRole === role || n.recipientRole === "all");
}

export function markNotificationAsRead(id: string): AppNotification[] {
  const all = getStoredNotifications();
  const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
  return updated;
}

export function markAllNotificationsAsRead(role: UserRole): AppNotification[] {
  const all = getStoredNotifications();
  const updated = all.map((n) =>
    n.recipientRole === role || n.recipientRole === "all" ? { ...n, read: true } : n,
  );
  saveNotifications(updated);
  return updated;
}

export function addSystemNotification(
  notification: Omit<AppNotification, "id" | "timestamp" | "read">,
): AppNotification {
  const all = getStoredNotifications();
  const newNotif: AppNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: "Justo ahora",
    read: false,
  };
  const updated = [newNotif, ...all];
  saveNotifications(updated);
  return newNotif;
}
