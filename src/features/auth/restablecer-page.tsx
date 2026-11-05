import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, KeyRound, Link2, Lock, Mail, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/branding";
import { sanitizeText, isValidEmail } from "@/lib/security";
import { authIcons } from "@/config/icons";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { EquilibraBrand } from "@/components/ui/equilibra-brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetStep = "verify_otp" | "new_password";

export function RestablecerPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<ResetStep>("verify_otp");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [isUsingLink, setIsUsingLink] = useState(false);
  const [recoveryUrl, setRecoveryUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Leer email o token desde URL si viene de redirección o enlace
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      const tokenParam = params.get("token") || params.get("code");
      if (emailParam) {
        setEmail(emailParam);
      }
      if (tokenParam) {
        setToken(tokenParam);
      }

      // También verificar si Supabase Auth ya activó el evento PASSWORD_RECOVERY
      const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setStep("new_password");
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
    return undefined;
  }, []);

  // TAREA 3 — Paso 1: Verificar el código de 6 dígitos con supabase.auth.verifyOtp
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = sanitizeText(email, 120).toLowerCase();
    const cleanToken = sanitizeText(token, 20).replace(/\s+/g, "");

    if (!cleanEmail) {
      const msg = "El correo electrónico es obligatorio.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      const msg = "Ingresa un formato de correo válido (ej. alumno@tesh.mx).";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!cleanToken) {
      const msg = "Ingresa el código de verificación de 6 dígitos.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (cleanToken.length < 6) {
      const msg = "El código debe tener al menos 6 dígitos.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      setIsSubmitting(true);

      const { error: otpError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: "recovery",
      });

      if (otpError) {
        // Error claro sin sacar al usuario de la pantalla
        const userFriendlyMsg = "Código incorrecto o expirado";
        setErrorMessage(userFriendlyMsg);
        toast.error(userFriendlyMsg);
        return;
      }

      // Código verificado con éxito: avanzar al formulario de nueva contraseña
      toast.success("Código verificado. Ahora ingresa tu nueva contraseña.");
      setStep("new_password");
    } catch {
      const userFriendlyMsg = "Código incorrecto o expirado";
      setErrorMessage(userFriendlyMsg);
      toast.error(userFriendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // TAREA ÚNICA — Ruta alternativa: Pegar enlace de recuperación del correo
  const handleVerifyLink = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawUrl = recoveryUrl.trim();
    if (!rawUrl) {
      const errorMsg = "Enlace inválido o expirado. Solicita uno nuevo.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Extraer de la URL los parámetros token y type sin hacer fetch (solo parsear el texto)
    let extractedToken: string | null = null;
    try {
      const fullUrl =
        rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
          ? rawUrl
          : `https://${rawUrl}`;
      const parsed = new URL(fullUrl);
      extractedToken = parsed.searchParams.get("token") || parsed.searchParams.get("token_hash");

      if (!extractedToken && parsed.hash) {
        const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
        extractedToken = hashParams.get("token") || hashParams.get("token_hash");
      }
    } catch {
      const match = rawUrl.match(/[?&#]token(?:_hash)?=([^&#\s]+)/);
      if (match && match[1]) {
        extractedToken = decodeURIComponent(match[1]);
      }
    }

    if (!extractedToken) {
      const errorMsg = "Enlace inválido o expirado. Solicita uno nuevo.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setIsSubmitting(true);

      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: extractedToken,
        type: "recovery",
      });

      if (otpError) {
        const errorMsg = "Enlace inválido o expirado. Solicita uno nuevo.";
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.success("Enlace verificado con éxito. Ingresa tu nueva contraseña.");
      setStep("new_password");
    } catch {
      const errorMsg = "Enlace inválido o expirado. Solicita uno nuevo.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // TAREA 3 — Paso 2: Actualizar la contraseña con supabase.auth.updateUser
  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPassword = password.trim();

    if (!cleanPassword) {
      const msg = "La nueva contraseña es obligatoria.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (cleanPassword.length < 8) {
      const msg = "La nueva contraseña debe tener al menos 8 caracteres.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (cleanPassword.length > 100) {
      const msg = "La contraseña excede el límite seguro de 100 caracteres.";
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

      toast.success("¡Tu contraseña ha sido restablecida con éxito! Ya puedes iniciar sesión.");
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
            to="/recuperar"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver a solicitar código</span>
          </Link>

          {/* Header con Marca */}
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="scale-105 transform transition-transform hover:scale-110">
              <EquilibraBrand />
            </div>
            <div className="space-y-1 pt-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {step === "verify_otp"
                  ? isUsingLink
                    ? "Pega el enlace de tu correo"
                    : "Ingresa código de 6 dígitos"
                  : "Nueva contraseña"}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step === "verify_otp"
                  ? isUsingLink
                    ? "Pega el enlace completo de recuperación que recibiste por correo para validar tu cuenta."
                    : "Ingresa tu correo y el código de 6 dígitos recibido para continuar."
                  : "Define tu nueva contraseña de acceso a Equilibra TESH."}
              </p>
            </div>
          </div>

          {/* Mensaje de error general si ocurre */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === "verify_otp" ? (
            /* PASO 1: Ingreso de código de 6 dígitos o enlace alternativo */
            <form onSubmit={isUsingLink ? handleVerifyLink : handleVerifyOtp} className="space-y-4">
              {!isUsingLink ? (
                <>
                  {/* Campo: Correo */}
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-email" className="text-xs font-medium text-foreground">
                      Correo institucional o registrado
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="ej. alumno@tesh.mx"
                        value={email}
                        disabled={isSubmitting}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="rounded-xl border-border/70 bg-background/70 pl-10 text-sm focus-visible:border-accent focus-visible:ring-accent/30 disabled:opacity-60"
                        required
                      />
                    </div>
                  </div>

                  {/* Campo: Código de 6 dígitos */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reset-token" className="text-xs font-medium text-foreground">
                        Código de 6 dígitos
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Enviado a tu correo</span>
                    </div>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="reset-token"
                        type="text"
                        placeholder="123456"
                        maxLength={10}
                        value={token}
                        disabled={isSubmitting}
                        onChange={(e) => setToken(e.target.value)}
                        autoComplete="one-time-code"
                        className="rounded-xl border-border/70 bg-background/70 pl-10 font-mono tracking-widest text-sm focus-visible:border-accent focus-visible:ring-accent/30 disabled:opacity-60"
                        required
                      />
                    </div>
                    {/* Opción alternativa: pegar enlace de correo */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUsingLink(true);
                          setErrorMessage(null);
                        }}
                        className="text-xs text-accent hover:underline font-medium focus:outline-none"
                      >
                        ¿No tienes código? Pega el enlace de tu correo
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Campo de texto largo para pegar la URL completa */
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="recovery-url" className="text-xs font-medium text-foreground">
                      Enlace completo de tu correo
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUsingLink(false);
                        setErrorMessage(null);
                      }}
                      className="text-xs text-accent hover:underline font-medium focus:outline-none"
                    >
                      Ingresar código de 6 dígitos
                    </button>
                  </div>
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <textarea
                      id="recovery-url"
                      rows={3}
                      placeholder="https://...supabase.co/auth/v1/verify?token=...&type=recovery..."
                      value={recoveryUrl}
                      disabled={isSubmitting}
                      onChange={(e) => setRecoveryUrl(e.target.value)}
                      className="w-full rounded-xl border border-border/70 bg-background/70 pl-10 pr-3.5 py-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:ring-accent/30 disabled:opacity-60 resize-none break-all"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Pega la dirección URL completa que empieza con{" "}
                    <code className="text-foreground">https://.../auth/v1/verify...</code>
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-11 w-full gap-2 rounded-xl bg-accent font-semibold text-accent-foreground shadow-md transition-all hover:bg-accent/90 disabled:opacity-50"
              >
                <Check className="size-4" />
                <span>
                  {isSubmitting
                    ? "Verificando..."
                    : isUsingLink
                      ? "Verificar enlace"
                      : "Verificar código"}
                </span>
              </Button>
            </form>
          ) : (
            /* PASO 2: Formulario de Nueva Contraseña */
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* Campo: Nueva Contraseña */}
              <div className="space-y-1.5">
                <Label htmlFor="reset-new-password" className="text-xs font-medium text-foreground">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres (máx. 100)"
                    value={password}
                    disabled={isSubmitting}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="rounded-xl border-border/70 bg-background/70 pl-10 pr-10 text-sm focus-visible:border-accent focus-visible:ring-accent/30 disabled:opacity-60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? (
                      <authIcons.hidePassword className="size-4" />
                    ) : (
                      <authIcons.showPassword className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Campo: Confirmar Contraseña */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="reset-confirm-password"
                  className="text-xs font-medium text-foreground"
                >
                  Confirmar nueva contraseña
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    disabled={isSubmitting}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="rounded-xl border-border/70 bg-background/70 pl-10 text-sm focus-visible:border-accent focus-visible:ring-accent/30 disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-11 w-full gap-2 rounded-xl bg-accent font-semibold text-accent-foreground shadow-md transition-all hover:bg-accent/90 disabled:opacity-50"
              >
                <Check className="size-4" />
                <span>{isSubmitting ? "Actualizando..." : "Actualizar contraseña"}</span>
              </Button>
            </form>
          )}

          {/* Enlaces de pie */}
          <div className="flex flex-col items-center justify-center gap-2 pt-2 text-center text-xs text-muted-foreground">
            <div>
              <span>¿No te llegó el correo? </span>
              <Link
                to="/recuperar"
                className="font-medium text-accent hover:underline focus:outline-none"
              >
                Solicitar nuevo correo
              </Link>
            </div>
            <div>
              <Link
                to="/login"
                className="hover:underline focus:outline-none text-muted-foreground"
              >
                Volver a Iniciar sesión
              </Link>
            </div>
          </div>

          {/* Microcopy de seguridad */}
          <div className="rounded-xl bg-card/40 p-2.5 text-center text-xs text-muted-foreground">
            {BRAND.fullName} — Plataforma institucional segura del Tecnológico de Estudios
            Superiores de Huixquilucan.
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
