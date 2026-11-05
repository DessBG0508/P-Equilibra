import { CalendarDays, Home, Library, Sparkles, UserRound } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

interface NavItemConfig {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  route: string;
}

const leftNavItems: NavItemConfig[] = [
  { label: "Inicio", icon: Home, route: "/" },
  { label: "Recursos", icon: Library, route: "/recursos" },
];

const rightNavItems: NavItemConfig[] = [
  { label: "Citas", icon: CalendarDays, route: "/citas" },
  { label: "Perfil", icon: UserRound, route: "/perfil" },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentPath = (pathname || "/").replace(/\/$/, "") || "/";

  // Identificar el tab activo de forma precisa en todas las rutas
  const isInicioActive = currentPath === "/";
  const isRecursosActive = currentPath.startsWith("/recursos");
  const isCitasActive = currentPath.startsWith("/citas");
  const isPerfilActive = currentPath.startsWith("/perfil");

  // El botón central de sparkle se activa en el flujo de check-in emocional o chat con Eli
  const isCenterActive =
    currentPath.startsWith("/checkin") ||
    currentPath.startsWith("/chat") ||
    currentPath.startsWith("/alerta");

  // Destino inteligente del botón central: lleva a /checkin y si ya está en check-in alterna a /chat
  const centerTarget = currentPath.startsWith("/checkin") ? "/chat" : "/checkin";

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-nav backdrop-blur-xl lg:bottom-6 lg:left-1/2 lg:right-auto lg:w-[34rem] lg:-translate-x-1/2 lg:rounded-3xl lg:border"
    >
      <div className="grid grid-cols-5 items-end">
        {leftNavItems.map((item) => {
          const active = item.route === "/" ? isInicioActive : isRecursosActive;
          return <NavItem key={item.label} {...item} active={active} />;
        })}

        {/* Botón central redondo de Sparkle (Check-in emocional / Eli) */}
        <div className="flex justify-center">
          <Link
            to={centerTarget}
            aria-label="Check-in emocional y apoyo"
            title="Check-in emocional y apoyo"
            aria-current={isCenterActive ? "page" : undefined}
            className={`-mt-7 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1B198F] to-[#6857E4] shadow-float transition-all duration-200 ${
              isCenterActive
                ? "ring-4 ring-[#6857E4]/30 scale-105 shadow-md"
                : "ring-4 ring-background hover:scale-105 active:scale-95"
            }`}
          >
            <Sparkles className="size-6 text-white" strokeWidth={isCenterActive ? 2.5 : 2} />
          </Link>
        </div>

        {rightNavItems.map((item) => {
          const active = item.route === "/citas" ? isCitasActive : isPerfilActive;
          return <NavItem key={item.label} {...item} active={active} />;
        })}
      </div>
    </nav>
  );
}

function NavItem({ label, icon: Icon, route, active }: NavItemConfig & { active: boolean }) {
  return (
    <Link
      to={route}
      aria-current={active ? "page" : undefined}
      className={`group flex h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[0.68rem] transition-all duration-150 ${
        active
          ? "bg-violet-50 text-violet-600 font-bold dark:bg-violet-950/60 dark:text-violet-400"
          : "bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/80 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-900/30"
      }`}
    >
      <Icon
        className={`size-5 transition-transform group-hover:scale-105 ${
          active
            ? "text-violet-600 dark:text-violet-400"
            : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
        }`}
        strokeWidth={active ? 2.5 : 2}
      />
      <span className="leading-none tracking-tight">{label}</span>
    </Link>
  );
}
