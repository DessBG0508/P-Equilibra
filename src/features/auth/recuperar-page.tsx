import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/branding";
import { sanitizeText, isValidEmail } from "@/lib/security";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { EquilibraBrand } from "@/components/ui/equilibra-brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecuperarPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmailAddress, setSentEmailAddress] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = sanitizeText(email, 120).toLowerCase();

    if (!cleanEmail) {
      const msg = "Por favor ingresa tu correo electrónico registrado.";
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

    try {
      setIsSubmitting(true);

      // Usar Supabase Auth nativo para enviar enlace de recuperación a /reset
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: "http://localhost:3000/reset",
      });

      if (error) {
        // En Supabase, por seguridad a veces no revela si el email existe o no, pero si hay error de rate limit u otro, se maneja:
        const msg = error.message.includes("rate")
          ? "Demasiadas solicitudes. Por favor espera unos momentos antes de intentar nuevamente."
          : error.message;
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      setSentEmailAddress(cleanEmail);
      setEmailSent(true);
      toast.success("Correo de recuperación enviado con éxito.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al enviar el correo de recuperación. Inténtalo de nuevo.";
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

          {/* Header con Marca */}
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="scale-105 transform transition-transform hover:scale-110">
              <EquilibraBrand />
            </div>
            <div className="space-y-1 pt-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {emailSent ? "Revisa tu correo electrónico" : "Recuperar contraseña"}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {emailSent
                  ? "Hemos enviado el enlace de recuperación a tu bandeja de entrada."
                  : `Ingresa tu correo institucional o registrado para recibir el enlace de recuperación.`}
              </p>
            </div>
          </div>

          {emailSent ? (
            /* Estado de éxito: Correo enviado */
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-2xl border border-teal-500/20 bg-teal-500/10 p-4 text-xs text-teal-950 dark:text-teal-200">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-teal-600 dark:text-teal-400" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Enlace enviado a:</p>
                  <p className="font-mono text-xs text-accent break-all">{sentEmailAddress}</p>
                  <p className="text-muted-foreground pt-1">
                    Revisa tu bandeja principal y la carpeta de spam. Abre el enlace que recibiste
                    para definir tu nueva contraseña.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <Button
                  type="button"
                  onClick={() => navigate({ to: "/login" })}
                  className="h-11 w-full gap-2 rounded-xl bg-accent font-semibold text-accent-foreground shadow-md transition-all hover:bg-accent/90 cursor-pointer"
                >
                  <ArrowLeft className="size-4" />
                  <span>Volver a iniciar sesión</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false);
                    setErrorMessage(null);
                  }}
                  className="h-10 w-full rounded-xl border-border/70 text-xs font-medium text-foreground hover:bg-accent/10 cursor-pointer"
                >
                  Reenviar a otro correo
                </Button>
              </div>
            </div>
          ) : (
            /* Formulario para ingresar correo */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
                >
                  <Mail className="mt-0.5 size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="recovery-email" className="text-xs font-medium text-foreground">
                  Correo institucional o registrado
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="recovery-email"
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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-11 w-full gap-2 rounded-xl bg-accent font-semibold text-accent-foreground shadow-md transition-all hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
              >
                <Send className="size-4" />
                <span>{isSubmitting ? "Enviando enlace..." : "Enviar enlace de recuperación"}</span>
              </Button>

              <div className="pt-2 text-center text-xs text-muted-foreground">
                <span>¿Recordaste tu contraseña? </span>
                <Link
                  to="/login"
                  className="font-medium text-accent hover:underline focus:outline-none"
                >
                  Inicia sesión aquí
                </Link>
              </div>
            </form>
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
