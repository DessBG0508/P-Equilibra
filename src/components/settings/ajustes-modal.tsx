import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Settings,
  User,
  Shield,
  Palette,
  HelpCircle,
  Info,
  LogOut,
  X,
  ChevronRight,
  Moon,
  Sun,
  Laptop,
  ExternalLink,
  HeartHandshake,
  FileText,
  Mail,
  GraduationCap,
  Building,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";

export type RoleType = "psicologo" | "directivo" | "estudiante" | "jefatura" | "coordinador";

export interface AjustesModalProps {
  rol?: RoleType;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

type SectionKey = "cuenta" | "privacidad" | "apariencia" | "ayuda" | "acerca";

interface SidebarItem {
  id: SectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AjustesModal({
  rol: rolProp,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  className,
}: AjustesModalProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setIsOpen = setControlledOpen !== undefined ? setControlledOpen : setUncontrolledOpen;

  const [activeSection, setActiveSection] = useState<SectionKey>("cuenta");

  // Local state for Modo Acompañamiento
  const [modoAcompanamiento, setModoAcompanamiento] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("equilibra_modo_acompanamiento") === "true";
      } catch {
        return false;
      }
    }
    return false;
  });

  const activeRole: RoleType = (rolProp || (user?.role as RoleType) || "estudiante") as RoleType;
  const isEstudiante = activeRole === "estudiante";

  // Secciones del sidebar según el rol
  const sections: SidebarItem[] = [
    { id: "cuenta", label: "Cuenta", icon: User },
    ...(isEstudiante
      ? [{ id: "privacidad" as SectionKey, label: "Privacidad y datos", icon: Shield }]
      : []),
    { id: "apariencia", label: "Apariencia", icon: Palette },
    { id: "ayuda", label: "Ayuda y soporte", icon: HelpCircle },
    { id: "acerca", label: "Acerca de", icon: Info },
  ];

  const sectionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Keyboard navigation for sidebar (ArrowUp / ArrowDown)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % sections.length;
      sectionRefs.current[nextIndex]?.focus();
      setActiveSection(sections[nextIndex].id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + sections.length) % sections.length;
      sectionRefs.current[prevIndex]?.focus();
      setActiveSection(sections[prevIndex].id);
    }
  };

  const handleModoAcompanamientoToggle = (checked: boolean) => {
    setModoAcompanamiento(checked);
    try {
      localStorage.setItem("equilibra_modo_acompanamiento", checked ? "true" : "false");
      toast.success(
        checked
          ? "Modo Acompañamiento activado. El equipo de psicología podrá dar seguimiento confidencial a tus tamizajes."
          : "Modo Acompañamiento desactivado.",
      );
    } catch {
      // ignore
    }
  };

  const handleVerAvisoPrivacidad = () => {
    setIsOpen(false);
    // Navegar directamente a la ruta de consulta garantizando actualización inmediata
    setTimeout(() => {
      navigate({
        to: "/aviso-privacidad",
        search: { mode: "consulta" },
      });
    }, 50);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
      toast.success("Sesión cerrada correctamente");
      navigate({ to: "/login", replace: true });
    } catch {
      navigate({ to: "/login", replace: true });
    }
  };

  const displayName = user?.name || "Usuario Institucional";
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "EQ";

  const roleLabelMap: Record<string, string> = {
    estudiante: "Estudiante",
    psicologo: "Psicólogo / Terapeuta",
    jefatura: "Jefatura de Carrera",
    coordinador: "Coordinador Directivo",
    directivo: "Directivo Institucional",
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Abrir panel de configuración y ajustes"
            title="Ajustes y configuración"
            className={cn(
              "size-9 rounded-full border border-border/80 bg-background/80 text-foreground shadow-xs transition-all duration-200 hover:border-primary/50 hover:bg-muted focus-visible:ring-2 focus-visible:ring-[#6857E4]",
              className,
            )}
          >
            <Settings className="size-4.5 text-muted-foreground transition-transform duration-300 hover:rotate-45" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        role="dialog"
        aria-modal="true"
        aria-label="Configuración de Equilibra TESH"
        className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl h-[620px] max-h-[90vh] flex flex-col"
      >
        {/* Header Accesible con botón X */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/60 px-6 py-4 space-y-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#1B198F]/10 dark:bg-[#6857E4]/20 text-[#1B198F] dark:text-[#C3B3F1]">
              <Settings className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Configuración y Ajustes
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {BRAND.fullName} · Gestión de cuenta, privacidad y entorno
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar modal de configuración"
            className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </DialogHeader>

        {/* Mobile Navigation Bar (visible solo en pantallas pequeñas) */}
        <div className="flex md:hidden border-b border-border/60 bg-muted/40 p-2 overflow-x-auto gap-1 shrink-0">
          {sections.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0",
                  isActive
                    ? "bg-[#1B198F] text-white dark:bg-[#6857E4]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body: Sidebar izquierda + Contenido derecha */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar lateral izquierda (Desktop) */}
          <aside
            aria-label="Menú de configuración"
            className="hidden md:flex w-56 flex-col justify-between border-r border-border/60 bg-muted/20 p-3 shrink-0"
          >
            <nav className="flex flex-col gap-1">
              {sections.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      sectionRefs.current[idx] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Sección ${item.label}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveSection(item.id)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6857E4]",
                      isActive
                        ? "bg-[#1B198F]/10 text-[#1B198F] dark:bg-[#6857E4]/25 dark:text-[#C3B3F1] font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && <ChevronRight className="size-3.5 opacity-60" />}
                  </button>
                );
              })}
            </nav>

            {/* Separador y Cerrar Sesión en Sidebar */}
            <div className="pt-2">
              <Separator className="mb-2 bg-border/60" />
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión en Equilibra TESH"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
              >
                <LogOut className="size-4 shrink-0" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </aside>

          {/* Contenido Principal de la Sección Activa */}
          <main className="flex-1 overflow-y-auto p-6 text-sm">
            {/* 1. SECCIÓN: CUENTA */}
            {activeSection === "cuenta" && (
              <div className="flex flex-col gap-5 max-w-xl animate-in fade-in-50 duration-200">
                <div>
                  <h3 className="text-base font-bold text-foreground">Información de la Cuenta</h3>
                  <p className="text-xs text-muted-foreground">
                    Datos de acceso y credenciales institucionales vinculadas
                  </p>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-muted/30 p-4">
                  <Avatar className="size-14 border border-border">
                    <AvatarFallback className="bg-[#1B198F] text-white font-bold text-base dark:bg-[#6857E4]">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground text-sm truncate">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                      <Mail className="size-3" />
                      {user?.email || "correo@tesh.edu.mx"}
                    </span>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-[#1B198F]/10 text-[#1B198F] dark:text-[#C3B3F1] border-0 text-[11px] font-semibold capitalize"
                      >
                        {roleLabelMap[activeRole] || activeRole}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">· Activo</span>
                    </div>
                  </div>
                </div>

                {/* Detalles complementarios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 bg-card p-3.5 flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <GraduationCap className="size-3.5 text-primary" />
                      {isEstudiante ? "Carrera / División" : "Área de adscripción"}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {user?.carrera || "Ingeniería en Sistemas Computacionales"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-3.5 flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Building className="size-3.5 text-primary" />
                      Institución
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Tecnológico de Estudios Superiores de Huixquilucan
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs text-muted-foreground flex flex-col gap-1">
                  <span className="font-semibold text-foreground">Identificador seguro</span>
                  <span className="font-mono text-[11px] truncate">
                    ID: {user?.id || "sesion-local-autenticada"}
                  </span>
                </div>
              </div>
            )}

            {/* 2. SECCIÓN: PRIVACIDAD Y DATOS */}
            {activeSection === "privacidad" && (
              <div className="flex flex-col gap-5 max-w-xl animate-in fade-in-50 duration-200">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Privacidad y Protección de Datos
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Cumplimiento con la LFPDPPP y control de consentimiento clínico
                  </p>
                </div>

                {/* Enlace directo a consultar el Aviso de Privacidad */}
                <div className="rounded-xl border border-border/80 bg-muted/30 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-teal/15 text-[#12BDB6] dark:text-[#12BDB6] flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Aviso de Privacidad Integral
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Conoce el tratamiento, resguardo y derechos ARCO aplicables a tus datos.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleVerAvisoPrivacidad}
                    className="shrink-0 bg-[#1B198F] hover:bg-[#1B198F]/90 text-white text-xs font-semibold h-8.5 px-3"
                  >
                    <span>Ver Aviso</span>
                    <ExternalLink className="size-3.5 ml-1.5" />
                  </Button>
                </div>

                {/* Modo Acompañamiento (Solo para rol estudiante) */}
                {isEstudiante ? (
                  <div className="rounded-xl border border-border/80 bg-card p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <HeartHandshake className="size-4.5 text-[#6857E4]" />
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Modo Acompañamiento</h4>
                          <span className="text-[11px] text-muted-foreground">
                            Permite a los psicólogos del TESH dar seguimiento preventivo a tus
                            tamizajes
                          </span>
                        </div>
                      </div>

                      <Switch
                        checked={modoAcompanamiento}
                        onCheckedChange={handleModoAcompanamientoToggle}
                        aria-label="Activar o desactivar Modo Acompañamiento"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/40 pt-2.5">
                      Al activar este modo, los resultados de tus tamizajes (GAD-7 / PHQ-9) y notas
                      de voz podrán ser consultados bajo secreto profesional por el Área de
                      Psicología del TESH.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground block mb-1">
                      Privacidad del Personal Institucional
                    </span>
                    Tus acciones y revisiones en los expedientes quedan registradas en la bitácora
                    criptográfica inmutable de auditoría institucional conforme a la
                    NOM-024-SSA3-2012.
                  </div>
                )}

                {/* Marco Legal */}
                <div className="rounded-xl border border-border/60 bg-card p-3.5 flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Shield className="size-3.5 text-primary" />
                    Garantías de Confidencialidad
                  </span>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Tus respuestas y notas clínicas nunca se comparten con terceros, familiares ni
                    docentes. El acceso es restringido exclusivamente al personal acreditado de
                    salud mental del TESH.
                  </p>
                </div>
              </div>
            )}

            {/* 3. SECCIÓN: APARIENCIA */}
            {activeSection === "apariencia" && (
              <div className="flex flex-col gap-5 max-w-xl animate-in fade-in-50 duration-200">
                <div>
                  <h3 className="text-base font-bold text-foreground">Tema y Apariencia</h3>
                  <p className="text-xs text-muted-foreground">
                    Personaliza la interfaz visual para tu comodidad
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDark) toggleTheme();
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6857E4]",
                      !isDark
                        ? "border-[#1B198F] bg-[#1B198F]/5 text-[#1B198F] font-bold"
                        : "border-border bg-card text-muted-foreground hover:border-border/80",
                    )}
                  >
                    <Sun className="size-6 text-lime-500" />
                    <span className="text-xs">Modo Claro</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Contraste óptimo diurno
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isDark) toggleTheme();
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6857E4]",
                      isDark
                        ? "border-[#6857E4] bg-[#6857E4]/10 text-[#C3B3F1] font-bold"
                        : "border-border bg-card text-muted-foreground hover:border-border/80",
                    )}
                  >
                    <Moon className="size-6 text-[#6857E4]" />
                    <span className="text-xs">Modo Oscuro</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Menor fatiga visual
                    </span>
                  </button>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">Alternar tema actual</span>
                    <span className="text-[11px] text-muted-foreground">
                      Actualmente: {isDark ? "Modo Oscuro activado" : "Modo Claro activado"}
                    </span>
                  </div>
                  <Switch
                    checked={isDark}
                    onCheckedChange={toggleTheme}
                    aria-label="Alternar entre modo claro y modo oscuro"
                  />
                </div>
              </div>
            )}

            {/* 4. SECCIÓN: AYUDA Y SOPORTE */}
            {activeSection === "ayuda" && (
              <div className="flex flex-col gap-5 max-w-xl animate-in fade-in-50 duration-200">
                <div>
                  <h3 className="text-base font-bold text-foreground">Ayuda y Líneas de Apoyo</h3>
                  <p className="text-xs text-muted-foreground">
                    Canales de atención psicológica institucional y urgencias 24/7
                  </p>
                </div>

                {/* Líneas de emergencia de salud mental */}
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-destructive font-bold text-xs">
                    <HelpCircle className="size-4" />
                    <span>Líneas de Ayuda en Crisis (24 Horas / Gratuitas)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Si te encuentras en una situación de crisis emocional severa, contacta de
                    inmediato:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    <div className="rounded-lg bg-card p-2.5 border border-border/60 text-xs flex flex-col">
                      <span className="font-bold text-foreground">Línea de la Vida</span>
                      <span className="font-mono text-primary font-semibold">800 911 2000</span>
                    </div>
                    <div className="rounded-lg bg-card p-2.5 border border-border/60 text-xs flex flex-col">
                      <span className="font-bold text-foreground">SAPTEL Cruz Roja</span>
                      <span className="font-mono text-primary font-semibold">800 472 7835</span>
                    </div>
                  </div>
                </div>

                {/* Área de psicología TESH */}
                <div className="rounded-xl border border-border/80 bg-card p-4 flex flex-col gap-2 text-xs">
                  <span className="font-bold text-foreground">
                    Área de Psicología y Tutorías TESH
                  </span>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Ubicación: Edificio de Tutorías y Acompañamiento Estudiantil, Campus TESH.
                    Horario de atención: Lunes a Viernes de 8:00 a 18:00 hrs.
                  </p>
                  <span className="text-[11px] text-primary font-medium">
                    Contacto: psicologia@tesh.edu.mx
                  </span>
                </div>
              </div>
            )}

            {/* 5. SECCIÓN: ACERCA DE */}
            {activeSection === "acerca" && (
              <div className="flex flex-col gap-5 max-w-xl animate-in fade-in-50 duration-200">
                <div>
                  <h3 className="text-base font-bold text-foreground">Acerca de la Plataforma</h3>
                  <p className="text-xs text-muted-foreground">
                    Información institucional, versión y marco regulatorio
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{BRAND.fullName}</span>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      v2.4.0
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {BRAND.tagline}. Plataforma integral para la detección oportuna, tamizaje
                    clínico automatizado con Eli y acompañamiento psicológico universitario.
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-3.5 flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-foreground">Normatividad y Estándares</span>
                  <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-0.5 mt-1">
                    <li>LFPDPPP (Protección de Datos Personales en Posesión de Particulares)</li>
                    <li>
                      NOM-024-SSA3-2012 (Sistemas de Información de Registro Electrónico para la
                      Salud)
                    </li>
                    <li>Protocolo de Tamizaje PHQ-9 (Depresión) y GAD-7 (Ansiedad)</li>
                    <li>Bitácora de auditoría blockchain inmutable en Polygon Amoy</li>
                  </ul>
                </div>

                <div className="text-[11px] text-muted-foreground text-center pt-2">
                  © 2026 Tecnológico de Estudios Superiores de Huixquilucan. Todos los derechos
                  reservados.
                </div>
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
