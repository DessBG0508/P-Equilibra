export type RiskLevel = "verde" | "amarillo" | "rojo";

export type UserRole = "estudiante" | "psicologo" | "jefatura" | "coordinador";

export interface User {
  id: string;
  name: string;
  matricula: string;
  email: string;
  role: UserRole;
  carrera?: string;
  semestre?: string;
  grupo?: string;
  createdAt: string;
}

export type MoodId = "muy-bien" | "bien" | "regular" | "triste" | "muy-mal";

export interface Mood {
  id: MoodId;
  label: string;
  value: 1 | 2 | 3 | 4 | 5;
  tone: "teal" | "cyan" | "mint" | "lavender" | "deep";
}

export interface MoodCheckIn {
  date: string; // YYYY-MM-DD
  value: 1 | 2 | 3 | 4 | 5; // Escala interna: Feliz=1, Bien=2, Normal=3, Triste=4, Muy mal=5
  moodId: MoodId;
  createdAt?: string;
}

export interface CheckIn {
  id: string;
  studentId: string;
  academicLoad: 1 | 2 | 3 | 4 | 5;
  emotions: string[];
  createdAt: string;
  riskLevel: RiskLevel;
}

export interface CrisisResource {
  id: string;
  name: string;
  contact: string;
  kind: "phone" | "emergency" | "chat";
  available: string;
}

export type CaseStatus = "por_contactar" | "en_seguimiento" | "cita_programada" | "atendido";

export interface ClinicalNote {
  id: string;
  caseId: string;
  date: string;
  author: string;
  title: string;
  content: string;
  category: "contacto" | "sesion" | "emergencia" | "seguimiento";
}

export interface CaseSummary {
  id: string;
  initials: string;
  studentName?: string;
  matricula?: string;
  career?: string;
  semester?: string;
  riskLevel: RiskLevel;
  status?: CaseStatus;
  summary: string;
  lastCheckIn: string;
  accompanimentSummary: string;
  phq9: number;
  gad7: number;
  lastContactDate?: string;
  notesCount?: number;
  modo_acompanamiento?: boolean;
  bloqueado?: boolean;
}

export type AppointmentModality = "presencial" | "en-linea";
export type AppointmentStatus = "confirmada" | "pendiente" | "realizada" | "cancelada";

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 - 10:50"
  modality: AppointmentModality;
  psychologistName: string;
  psychologistRole?: string;
  locationOrLink: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  studentName?: string;
  caseId?: string;
  folioTamizaje?: string;
  // TODO(Supabase): mapear a solicitudes_cita.folio_tamizaje
  folio_tamizaje?: string;
  serviceType?: "TERAPIA PSICOLÓGICA" | "ORIENTACIÓN" | "CONSEJERÍA" | string;
}

export type ResourceCategory = "Ansiedad" | "Estrés" | "Sueño" | "Ánimo" | "Respiración";

export interface PsychoResource {
  id: string;
  title: string;
  shortDescription: string;
  category: ResourceCategory;
  readTime: string;
  iconName:
    "wind" | "moon" | "sun" | "heart" | "compass" | "brain" | "feather" | "smile" | "bookOpen";
  tone: "teal" | "cyan" | "mint" | "lavender" | "rose";
  content: string[];
  keyTakeaway?: string;
}
