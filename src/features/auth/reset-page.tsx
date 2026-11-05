import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/branding";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { EquilibraBrand } from "@/components/ui/equilibra-brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\]/;

export function ResetPage() {
  const navigate = useNavigate();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMinLength = password.length >= 8;
  const hasSpecialChar = SPECIAL_CHAR_REGEX.test(password);

  useEffect(() => {
    let isMounted = true;

    // Escuchar eventos de cambio de sesión por si Supabase la establece durante la carga
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session) {
        setHasValidSession(true);
        setIsCheckingSession(false);
      }
    });

    // La decisión de qué mostrar se basa únicamente en getSession()
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (data?.session && !error) {
          setHasValidSession(true);
        } else {
          setHasValidSession(false);
        }
      } catch {
        if (isMounted) {
          setHasValidSession(false);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPassword = password.trim();

    if (!cleanPassword) {
      const msg = "Por favor ingresa una nueva contraseña.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (cleanPassword.length < 8) {
      const msg = "La contraseña debe tener al menos 8 caracteres.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!SPECIAL_CHAR_REGEX.test(cleanPassword)) {
      const msg = "La contraseña debe incluir al menos un carácter especial (ej. !@#$%^&*).";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (cleanPassword.length > 100) {
      const msg = "La contraseña no debe superar los 100 caracteres.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      const msg = "Las contraseñas no coinciden. Por favor verifícalas.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      setIsSubmitting(true);

      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      });

      if (updateError) {
        const updateMsg =
          updateError.message || "No se pudo actualizar la contraseña. Intenta nuevamente.";
        setErrorMessage(updateMsg);
        toast.error(updateMsg);
        return;
      }

      toast.success("Contraseña actualizada");
      navigate({ to: "/login", replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al actualizar tu contraseña.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuroraBackground>
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="ethereal-card relative w-full max-w-md space-y-6 rounded-3xl border border-white/40 bg-card/85 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 sm:p-8">
          {/* Selector de Tema */}
          <div className="absolute right-4 top-4">
            <ThemeToggle />
          </div>

          {/* Botón de regreso */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver a iniciar sesión</span>
          </Link>

          {isCheckingSession ? (
            /* Estado de carga mientras Supabase evalúa la sesión */
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <Loader2 className="size-8 animate-spin text-accent" />
              <p className="text-sm font-medium text-muted-foreground">
                Verificando enlace de recuperación...
              </p>
            </div>
          ) : !hasValidSession ? (
            /* Estado: Enlace inválido o expirado */
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="scale-105 transform transition-transform hover:scale-110">
                  <EquilibraBrand />
                </div>
                <div className="rounded-full bg-destructive/10 p-3 text-destructive mt-1">
                  <AlertCircle className="size-8" />
                </div>
                <div className="space-y-1.5 pt-1">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Enlace inválido o expirado
                  </h1>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    El enlace de recuperación es inválido, ha caducado o ya fue utilizado. Por favor
                    solicita uno nuevo.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  type="button"
                  onClick={() => navigate({ to: "/login", replace: true })}
                  className="h-11 w-full gap-2 rounded-xl bg-accent font-semibold text-accent-foreground shadow-md transition-all hover:bg-accent/90 cursor-pointer"
                >
                  <ArrowLeft className="size-4" />
                  <span>Volver a /login</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/recuperar" })}
                  className="h-10 w-full rounded-xl border-border/70 text-xs font-medium text-foreground hover:bg-accent/10 cursor-pointer"
                >
                  Solicitar nuevo enlace
                </Button>
              </div>
            </div>
          ) : (
            /* Estado: Sesión válida -> Formulario de nueva contraseña */
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="scale-105 transform transition-transform hover:scale-110">
                  <EquilibraBrand />
                </div>
                <div className="space-y-1 pt-1">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Nueva contraseña
                  </h1>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Define tu nueva contraseña de acceso a {BRAND.fullName}.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
                >
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* Campo: Nueva Contraseña */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reset-new-password"
                    className="text-xs font-medium text-foreground"
                  >
                    Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres y un símbolo"
                      value={password}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoComplete="new-password"
                      className="rounded-xl border-border/70 bg-background/70 pl-10 pr-10 text-sm focus-visible:border-accent focus-visible:ring-accent/30 disabled:opacity-60"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>

                  {/* Mensaje de validación y requisitos de complejidad debajo del campo */}
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <Info className="size-3.5 shrink-0" />
                      <span>Requisitos de seguridad de la contraseña:</span>
                    </div>
                    <ul className="space-y-1 text-[11px]">
                      <li
                        className={`flex items-center gap-2 transition-colors ${
                          isMinLength
                            ? "text-teal-600 dark:text-teal-400 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isMinLength ? (
                          <Check className="size-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                        ) : (
                          <span className="ml-1 mr-0.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                        )}
                        <span>Mínimo 8 caracteres</span>
                      </li>
                      <li
                        className={`flex items-center gap-2 transition-colors ${
                          hasSpecialChar
                            ? "text-teal-600 dark:text-teal-400 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {hasSpecialChar ? (
                          <Check className="size-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                        ) : (
                          <span className="ml-1 mr-0.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                        )}
                        <span>Incluir al menos un carácter especial (ej. ! @ # $ % & * _ -)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Campo: Confirmar Contraseña */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reset-confirm-password"
                    className="text-xs font-medium text-foreground"
                  >
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repite tu nueva contraseña"
                      value={confirmPassword}
                      disabled={isSubmitting}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="rounded-xl border-border/70 bg-background/70 pl-10 pr-10 text-sm focus-visible:border-accent focus-visible:ring-accent/30 disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-11 w-full gap-2 rounded-xl bg-accent font-semibold text-accent-foreground shadow-md transition-all hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="size-4" />
                  <span>
                    {isSubmitting ? "Actualizando contraseña..." : "Actualizar contraseña"}
                  </span>
                </Button>
              </form>
            </div>
          )}

          {/* Microcopy de seguridad y confidencialidad */}
          <div className="rounded-xl bg-card/40 p-2.5 text-center text-xs text-muted-foreground">
            {BRAND.fullName} protege tu privacidad bajo estándares de confidencialidad
            institucional.
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
