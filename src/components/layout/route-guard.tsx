import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useAvisoPrivacidad } from "@/lib/use-aviso-privacidad";
import { rutaPorRol } from "@/lib/roles";
import { EquilibraBrand } from "@/components/ui/equilibra-brand";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { PersistentSosButton } from "@/components/common/persistent-sos-button";

const PUBLIC_ROUTES = ["/login", "/registro", "/recuperar", "/reset", "/aviso-privacidad"];

/**
 * DECISIÓN DE ARQUITECTURA:
 * El rol directivo/jefatura de carrera se representa con el valor "jefatura" (y "coordinador")
 * del enum app_role en la BD; la ruta de UI es "/directivo".
 * La rama rol === "directivo" se eliminó por ser un rol inexistente en la BD.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { needsAcceptance, isLoading: isAvisoLoading } = useAvisoPrivacidad();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  useEffect(() => {
    if (isLoading || isAvisoLoading) return;

    // El Aviso de Privacidad es de acceso público universal para cualquier usuario o visitante
    if (pathname === "/aviso-privacidad") {
      return;
    }

    const isPublic = PUBLIC_ROUTES.includes(pathname);
    const isResetPage = pathname === "/reset";

    // 1. Sin sesión activa -> Redirigir a /login (excepto en rutas públicas)
    if (!user) {
      if (!isPublic) {
        navigate({ to: "/login", replace: true });
      }
      return;
    }

    // Aviso obligatorio para TODOS los roles en su primer inicio de sesión
    // (estudiante, psicólogo, jefatura, coordinador) — privacidad por defecto LFPDPPP
    if (needsAcceptance && !isResetPage) {
      navigate({ to: "/aviso-privacidad", replace: true });
      return;
    }

    const destinoAutorizado = rutaPorRol(user.role);

    // 3. Con sesión activa en ruta pública -> Redirigir según rol (salvo en /reset donde se actualiza contraseña)
    if (isPublic && !isResetPage && pathname !== "/aviso-privacidad") {
      navigate({ to: destinoAutorizado, replace: true });
      return;
    }

    // 3. Rol Psicólogo: solo puede ver /psicologo y /expedientes
    if (user.role === "psicologo") {
      if (!pathname.startsWith("/psicologo") && !pathname.startsWith("/expedientes")) {
        toast.info("Redirigido al panel de psicología correspondiente a tu rol.");
        navigate({ to: "/psicologo", replace: true });
      }
      return;
    }

    // 4. Roles Jefatura / Coordinador: solo pueden ver /directivo y /auditoria
    if (user.role === "jefatura" || user.role === "coordinador") {
      if (!pathname.startsWith("/directivo") && !pathname.startsWith("/auditoria")) {
        toast.info("Redirigido al panel directivo correspondiente a tu rol.");
        navigate({ to: "/directivo", replace: true });
      }
      return;
    }

    // 5. Rol Estudiante: puede ver /, /checkin, /alerta, /chat, /citas, /recursos, /perfil
    if (user.role === "estudiante") {
      if (
        pathname.startsWith("/psicologo") ||
        pathname.startsWith("/directivo") ||
        pathname.startsWith("/expedientes") ||
        pathname.startsWith("/auditoria")
      ) {
        toast.info("Esta sección es de acceso institucional.");
        navigate({ to: "/", replace: true });
      }
    }
  }, [user, isLoading, isAvisoLoading, needsAcceptance, pathname, navigate]);

  if (isLoading || (user && isAvisoLoading && pathname !== "/aviso-privacidad")) {
    return (
      <AuroraBackground>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="ethereal-card flex flex-col items-center gap-4 p-8 text-center">
            <EquilibraBrand />
            <div className="size-8 animate-spin rounded-full border-3 border-accent border-t-transparent" />
            <p className="text-sm font-medium text-muted-foreground">Preparando tu espacio...</p>
          </div>
        </div>
      </AuroraBackground>
    );
  }

  // Si no hay usuario y no es ruta pública, no renderizar contenido protegido mientras redirige
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  // Si hay usuario y está en una ruta que no le corresponde, no renderizar mientras redirige
  if (user) {
    const enReset = pathname === "/reset";
    if (needsAcceptance && pathname !== "/aviso-privacidad" && !enReset) {
      return null;
    }
    if (PUBLIC_ROUTES.includes(pathname) && !enReset && pathname !== "/aviso-privacidad")
      return null;
    if (
      user.role === "psicologo" &&
      pathname !== "/aviso-privacidad" &&
      !pathname.startsWith("/psicologo") &&
      !pathname.startsWith("/expedientes")
    )
      return null;
    if (
      (user.role === "jefatura" || user.role === "coordinador") &&
      pathname !== "/aviso-privacidad" &&
      !pathname.startsWith("/directivo") &&
      !pathname.startsWith("/auditoria")
    )
      return null;
    if (
      user.role === "estudiante" &&
      pathname !== "/aviso-privacidad" &&
      (pathname.startsWith("/psicologo") ||
        pathname.startsWith("/directivo") ||
        pathname.startsWith("/expedientes") ||
        pathname.startsWith("/auditoria"))
    )
      return null;
  }

  return (
    <>
      {children}
      <PersistentSosButton />
    </>
  );
}
