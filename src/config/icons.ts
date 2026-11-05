import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BatteryMedium,
  BedDouble,
  BookOpen,
  Brain,
  Calendar,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  Check,
  CheckCircle2,
  CircleGauge,
  Clock,
  Compass,
  Eye,
  EyeOff,
  Feather,
  GraduationCap,
  Heart,
  HeartHandshake,
  HeartPulse,
  IdCard,
  Info,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Mic,
  Moon,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  Sun,
  User,
  UserCheck,
  UserPlus,
  Video,
  Wind,
  XCircle,
} from "lucide-react";

/**
 * Catálogo centralizado de iconos para pantallas de autenticación (/login y /registro).
 * Para cambiar un icono en estas pantallas, edita únicamente este archivo.
 */
export const authIcons = {
  user: User,
  matricula: IdCard,
  email: Mail,
  password: Lock,
  showPassword: Eye,
  hidePassword: EyeOff,
  roleStudent: GraduationCap,
  rolePsychologist: HeartHandshake,
  submitLogin: LogIn,
  submitRegister: UserPlus,
  logout: LogOut,
  shield: ShieldCheck,
  back: ArrowLeft,
  arrowRight: ArrowRight,
  check: Check,
  alert: AlertCircle,
  sparkles: Sparkles,
  activity: Activity,
};

export type AuthIconsMap = typeof authIcons;

/**
 * Catálogo centralizado de iconos para el asistente Eli (/chat).
 * Para cambiar un icono en esta pantalla, edita únicamente este archivo.
 */
export const chatIcons = {
  back: ArrowLeft,
  mic: Mic,
  send: Send,
  phone: Phone,
  shieldAlert: ShieldAlert,
  info: Info,
  sparkles: Sparkles,
  heartHandshake: HeartHandshake,
};

export type ChatIconsMap = typeof chatIcons;

/**
 * Catálogo centralizado de iconos para la pantalla de citas (/citas).
 * Para cambiar un icono en esta pantalla, edita únicamente este archivo.
 */
export const appointmentIcons = {
  calendar: Calendar,
  calendarDays: CalendarDays,
  calendarPlus: CalendarPlus,
  calendarX: CalendarX,
  clock: Clock,
  video: Video,
  mapPin: MapPin,
  user: User,
  check: Check,
  checkCircle: CheckCircle2,
  xCircle: XCircle,
  refresh: RefreshCw,
  arrowLeft: ArrowLeft,
  info: Info,
  sparkles: Sparkles,
  alert: AlertCircle,
};

export type AppointmentIconsMap = typeof appointmentIcons;

/**
 * Catálogo centralizado de iconos para la biblioteca de recursos (/recursos).
 * Para cambiar un icono en esta pantalla, edita únicamente este archivo.
 */
export const resourceIcons = {
  search: Search,
  bookOpen: BookOpen,
  wind: Wind,
  moon: Moon,
  sun: Sun,
  heart: Heart,
  smile: Smile,
  compass: Compass,
  brain: Brain,
  feather: Feather,
  clock: Clock,
  arrowLeft: ArrowLeft,
  sparkles: Sparkles,
  check: Check,
  info: Info,
};

export type ResourceIconsMap = typeof resourceIcons;

/**
 * Catálogo centralizado de iconos para la pantalla de perfil (/perfil).
 * Para cambiar un icono en esta pantalla, edita únicamente este archivo.
 */
export const profileIcons = {
  user: User,
  userCheck: UserCheck,
  matricula: IdCard,
  email: Mail,
  role: GraduationCap,
  stats: Activity,
  brain: Brain,
  sleep: BedDouble,
  stress: CircleGauge,
  energy: BatteryMedium,
  heartPulse: HeartPulse,
  shield: Shield,
  shieldCheck: ShieldCheck,
  lock: Lock,
  logout: LogOut,
  edit: Pencil,
  check: Check,
  info: Info,
  sparkles: Sparkles,
};

export type ProfileIconsMap = typeof profileIcons;
