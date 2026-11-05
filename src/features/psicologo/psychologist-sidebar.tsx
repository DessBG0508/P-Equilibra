import {
  LayoutDashboard,
  ShieldAlert,
  FolderOpen,
  Calendar,
  FileText,
  Star,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BRAND } from "@/lib/branding";

export type PsychologistNavSection =
  "resumen" | "alertas" | "expedientes" | "agenda" | "bitacora" | "encuestas";

interface PsychologistSidebarProps {
  activeSection: PsychologistNavSection;
  onSelectSection: (section: PsychologistNavSection) => void;
  redAlertsCount: number;
  activeAppointmentsCount: number;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function PsychologistSidebar({
  activeSection,
  onSelectSection,
  redAlertsCount,
  activeAppointmentsCount,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}: PsychologistSidebarProps) {
  const navItems = [
    {
      id: "resumen" as PsychologistNavSection,
      label: "Resumen",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "alertas" as PsychologistNavSection,
      label: "Alertas",
      icon: ShieldAlert,
      badge: redAlertsCount > 0 ? redAlertsCount : null,
      badgeColor: "bg-pink-400 text-white",
    },
    {
      id: "expedientes" as PsychologistNavSection,
      label: "Expedientes",
      icon: FolderOpen,
      badge: null,
    },
    {
      id: "agenda" as PsychologistNavSection,
      label: "Agenda",
      icon: Calendar,
      badge: activeAppointmentsCount > 0 ? activeAppointmentsCount : null,
      badgeColor: "bg-teal text-white",
    },
    {
      id: "bitacora" as PsychologistNavSection,
      label: "Bitácora",
      icon: FileText,
      badge: null,
    },
    {
      id: "encuestas" as PsychologistNavSection,
      label: "Encuestas PB-021",
      icon: Star,
      badge: null,
    },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col justify-between border-r border-border/80 bg-card/95 backdrop-blur-xl transition-all duration-300 ${
        isCollapsed ? "w-16 sm:w-20" : "w-64"
      }`}
      aria-label="Navegación del panel de psicología"
    >
      {/* SECCIÓN SUPERIOR: LOGO / IDENTIDAD */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-border/70 px-3 sm:px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6857E4] to-[#12BDB6] text-white shadow-xs"
              aria-hidden="true"
            >
              <Sparkles className="size-4.5" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-display block text-sm font-bold tracking-tight text-foreground truncate">
                  {BRAND.name}
                </span>
                <span className="block text-[10px] font-semibold text-muted-foreground truncate">
                  Área Psicológica TESH
                </span>
              </div>
            )}
          </div>

          {/* Botón opcional para colapsar en desktop */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
              className="hidden lg:grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>
          )}
        </div>

        {/* MENÚ DE NAVEGACIÓN */}
        <nav className="space-y-1.5 p-2 sm:p-3" aria-label="Secciones del panel">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? "page" : undefined}
                title={isCollapsed ? item.label : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[#6857E4] text-white shadow-xs"
                    : "text-muted-foreground hover:bg-[#6857E4]/10 hover:text-foreground"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
              >
                <Icon
                  className={`size-4.5 shrink-0 transition-transform ${
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}

                {/* Badge de contador */}
                {item.badge !== null && (
                  <span
                    className={`${item.badgeColor || "bg-primary text-primary-foreground"} ${
                      isCollapsed
                        ? "absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold"
                        : "ml-auto rounded-full px-1.5 py-0.2 text-[10px] font-bold"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* SECCIÓN INFERIOR: PERFIL DE PSICÓLOGA Y CONTROLES */}
      <div className="border-t border-border/70 p-2 sm:p-3 space-y-2">
        {/* Información del profesional */}
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-2">
            <Avatar className="size-8.5 rounded-lg border border-border/60">
              <AvatarFallback className="bg-lavender-soft font-bold text-xs text-[#1B198F]">
                MG
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 truncate">
              <p className="truncate text-xs font-bold leading-tight text-foreground">
                Dra. Marta Gómez
              </p>
              <p className="truncate text-[10px] text-muted-foreground">Psicóloga • Cubículo 3</p>
            </div>
            <ThemeToggle className="size-7" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <Avatar className="size-8 rounded-lg border border-border/60">
              <AvatarFallback className="bg-lavender-soft font-bold text-[11px] text-[#1B198F]">
                MG
              </AvatarFallback>
            </Avatar>
            <ThemeToggle className="size-7" />
          </div>
        )}

        {/* Botón Cerrar sesión */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onLogout}
          aria-label="Cerrar sesión como profesional"
          title="Cerrar sesión activa"
          className={`w-full rounded-xl text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8.5 transition-colors ${
            isCollapsed ? "justify-center px-0" : "justify-start px-2.5 gap-2"
          }`}
        >
          <LogOut className="size-4 shrink-0" />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </Button>
      </div>
    </aside>
  );
}
