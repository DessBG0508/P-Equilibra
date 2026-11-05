import { Link, useRouterState } from "@tanstack/react-router";
import { PhoneCall } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const STUDENT_ROUTES = new Set(["/", "/checkin", "/chat", "/citas", "/recursos", "/perfil"]);

/**
 * Botón SOS persistente para rutas de estudiantes.
 * Fijo en la esquina inferior derecha con color sólido #1B198F, sombra suave
 * y posicionamiento responsive que no obstruye la navegación inferior ni el botón central.
 */
export function PersistentSosButton() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Normalizar ruta
  const cleanPath = (pathname || "/").replace(/\/$/, "") || "/";

  // En /alerta no se muestra (ya está en contexto de crisis)
  if (cleanPath === "/alerta" || cleanPath.startsWith("/alerta")) {
    return null;
  }

  // No mostrar a personal administrativo/psicólogos en sus áreas
  if (
    user?.role === "psicologo" ||
    (user?.role as string) === "directivo" ||
    user?.role === "jefatura" ||
    user?.role === "coordinador"
  ) {
    return null;
  }

  // Verificar que corresponda a las rutas del estudiante
  const isStudentRoute =
    STUDENT_ROUTES.has(cleanPath) ||
    Array.from(STUDENT_ROUTES).some((r) => r !== "/" && cleanPath.startsWith(r));

  if (!isStudentRoute) {
    return null;
  }

  return (
    <Link
      to="/alerta"
      aria-label="Ayuda y contención inmediata en crisis"
      title="Ayuda y contención inmediata en crisis"
      className="fixed z-40 flex items-center gap-1.5 rounded-full bg-[#1B198F] px-3.5 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#1B198F] hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#1B198F]/40 bottom-[4.75rem] right-3.5 sm:bottom-20 sm:right-6 lg:bottom-7 lg:right-7"
    >
      <PhoneCall className="size-3.5 shrink-0 text-white" strokeWidth={2.5} />
      <span className="leading-none tracking-tight">Ayuda</span>
    </Link>
  );
}
