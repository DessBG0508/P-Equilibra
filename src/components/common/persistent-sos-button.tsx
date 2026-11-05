import { Link, useRouterState } from "@tanstack/react-router";
import { PhoneCall } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const STUDENT_ROUTES = ["/", "/checkin", "/chat", "/citas", "/recursos", "/perfil"];

/**
 * Botón SOS persistente para rutas del estudiante.
 * Flotante fijo en esquina inferior derecha con color sólido #1B198F.
 * Posición en móvil ajustada para no tapar la navegación inferior ni el botón central elevado.
 * Navega a /alerta y se oculta en /alerta y en paneles no-estudiante.
 */
export function PersistentSosButton() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cleanPath = (pathname || "/").replace(/\/$/, "") || "/";

  // No mostrar para roles institucionales (psicólogo, directivo)
  if (user && user.role !== "estudiante") {
    return null;
  }

  // En /alerta no se muestra (ya está en contexto de crisis)
  if (cleanPath === "/alerta" || cleanPath.startsWith("/alerta")) {
    return null;
  }

  // Solo mostrar en las rutas del estudiante especificadas
  const isStudentRoute = STUDENT_ROUTES.some(
    (route) => cleanPath === route || (route !== "/" && cleanPath.startsWith(route)),
  );

  if (!isStudentRoute) {
    return null;
  }

  return (
    <Link
      to="/alerta"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 rounded-full bg-[#1B198F] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#1B198F]/25 transition-all duration-200 hover:bg-[#1B198F] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#1B198F] focus:ring-offset-2"
      aria-label="Ayuda inmediata y contención de crisis"
      title="Ayuda inmediata — Contención de crisis"
    >
      <PhoneCall className="size-4 shrink-0 animate-pulse text-white" />
      <span className="font-semibold tracking-wide">Ayuda</span>
    </Link>
  );
}
