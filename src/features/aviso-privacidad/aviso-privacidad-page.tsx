import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Shield,
  Download,
  ArrowRight,
  ArrowLeft,
  HeartHandshake,
  FileCheck2,
  Calendar,
  CheckCircle2,
  Info,
} from "lucide-react";
import { EquilibraBrand } from "@/components/ui/equilibra-brand";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout/page-shell";
import { useAuth } from "@/lib/auth-context";
import { rutaPorRol } from "@/lib/roles";
import {
  useAvisoPrivacidad,
  AVISO_PRIVACIDAD_VERSION_ACTUAL,
  getStoredAviso,
} from "@/lib/use-aviso-privacidad";
import { AVISO_PRIVACIDAD_METADATA, AVISO_PRIVACIDAD_SECCIONES } from "./aviso-privacidad-content";

export function AvisoPrivacidadPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    needsAcceptance,
    isLoading: isAvisoLoading,
    acceptAviso,
    fechaAceptacion,
    versionAceptada,
  } = useAvisoPrivacidad();

  // Detectar modo mediante query param o estado de aceptación
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const queryMode = searchParams.get("mode");

  // Consulta síncrona scoped al usuario actual
  const userStoredAviso = user?.id ? getStoredAviso(user.id) : null;
  const userYaAcepto =
    userStoredAviso?.aceptado === true &&
    userStoredAviso.version === AVISO_PRIVACIDAD_VERSION_ACTUAL;

  // MODO 2 (Consulta): si viene con ?mode=consulta o si el usuario autenticado ya aceptó y no requiere aceptación
  const isConsultationMode =
    queryMode === "consulta" ||
    (Boolean(user) &&
      !needsAcceptance &&
      !isAvisoLoading &&
      (userYaAcepto || Boolean(versionAceptada)) &&
      queryMode !== "forzar");

  // Checkbox: en consulta aparece premarcado; en forzada inicia desmarcado
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Toggle opcional de consentimiento de Modo Acompañamiento
  const [modoAcompanamientoConsent, setModoAcompanamientoConsent] = useState<boolean>(() => {
    try {
      return localStorage.getItem("equilibra_modo_acompanamiento") === "true";
    } catch {
      return false;
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isConsultationMode) {
      setAcceptedTerms(true);
    }
  }, [isConsultationMode]);

  const handleAcceptAndContinue = async () => {
    if (!acceptedTerms) {
      toast.warning("Debes marcar la casilla de aceptación para continuar.");
      return;
    }

    try {
      setIsSubmitting(true);
      await acceptAviso(AVISO_PRIVACIDAD_VERSION_ACTUAL, modoAcompanamientoConsent);
      toast.success("Aviso de Privacidad aceptado. Bienvenido/a a Equilibra TESH.");
      navigate({ to: "/", replace: true }); // FIX S4: Reemplazar historia para evitar bucle de retorno
    } catch {
      toast.error("Ocurrió un error al procesar tu consentimiento. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoHome = () => {
    if (user) {
      navigate({ to: rutaPorRol(user.role), replace: true });
    } else {
      navigate({ to: "/", replace: true });
    }
  };

  const handleReturnToProfile = () => {
    if (user?.role === "estudiante") {
      navigate({ to: "/perfil" });
    } else if (window.history.length > 1) {
      window.history.back();
    } else if (user) {
      navigate({ to: rutaPorRol(user.role), replace: true });
    } else {
      navigate({ to: "/", replace: true });
    }
  };

  const handleCancel = async () => {
    try {
      if (user) {
        await logout();
      }
    } catch (e) {
      console.error("Error al cerrar sesión al no aceptar aviso:", e);
    }
    toast.info("Has decidido no aceptar el Aviso de Privacidad. Sesión finalizada.");
    navigate({ to: "/login", replace: true });
  };

  const handleDownloadPdf = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info(
      "El documento formal en PDF avalado por la Dirección General del TESH se habilitará al concluir la validación de firmas institucionales.",
    );
  };

  const formattedFecha = fechaAceptacion
    ? new Date(fechaAceptacion).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <PageShell showAppHeader={false} showBottomNav={false}>
      <main className="mx-auto max-w-4xl px-3 py-8 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-8"
        >
          {/* Encabezado Principal */}
          <header className="flex flex-col items-center space-y-4 text-center">
            <div className="scale-105 transform transition-transform hover:scale-110">
              <EquilibraBrand size="lg" />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-lg border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary"
                >
                  <Shield className="mr-1.5 size-3.5 text-primary" />
                  Marco Normativo LFPDPPP & NOM-024
                </Badge>

                {isConsultationMode ? (
                  <Badge
                    variant="outline"
                    className="rounded-lg border-teal/40 bg-teal/15 px-3 py-1 text-xs font-bold text-teal"
                  >
                    <CheckCircle2 className="mr-1.5 size-3.5" />
                    Consentimiento Vigente (v{versionAceptada || AVISO_PRIVACIDAD_VERSION_ACTUAL})
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="rounded-lg border-lime/40 bg-lime/15 px-3 py-1 text-xs font-bold text-lime"
                  >
                    <Info className="mr-1.5 size-3.5" />
                    Aceptación Inicial Requerida
                  </Badge>
                )}

                <Badge
                  variant="outline"
                  className="rounded-lg border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  <Calendar className="mr-1.5 size-3.5" />
                  {AVISO_PRIVACIDAD_METADATA.fechaVigencia}
                </Badge>
              </div>

              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                Aviso de Privacidad Integral
              </h1>
              <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Equilibra TESH · Plataforma de Tamizaje y Apoyo Emocional Universitario
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/90 px-4 py-2.5 text-xs text-muted-foreground shadow-xs">
              <span>
                <strong className="text-foreground">Responsable del tratamiento:</strong>{" "}
                {AVISO_PRIVACIDAD_METADATA.responsable}
              </span>
            </div>
          </header>

          {/* Banner de Estado en Modo Consulta */}
          {isConsultationMode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-teal/30 bg-teal-soft/50 p-4 text-xs text-teal-900 dark:text-teal-100 flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-5 text-teal shrink-0" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm">
                    Estás consultando el Aviso de Privacidad en Modo Informativo
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formattedFecha
                      ? `Has aceptado estos términos el ${formattedFecha}. No requieres volver a aceptar.`
                      : "Tu consentimiento se encuentra activo y registrado en tu perfil escolar."}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleReturnToProfile}
                className="shrink-0 rounded-xl border-teal/40 text-xs font-bold text-teal hover:bg-teal/10"
              >
                Volver a mi perfil
              </Button>
            </motion.div>
          )}

          {/* Tarjeta de Contenido Legal con las 9 Secciones */}
          <section
            aria-label="Cuerpo del Aviso de Privacidad"
            className="rounded-3xl border border-border/80 bg-card p-5 shadow-float sm:p-8"
          >
            <div className="space-y-8 divide-y divide-border/60">
              {AVISO_PRIVACIDAD_SECCIONES.map((seccion) => (
                <article
                  key={seccion.id}
                  id={seccion.id}
                  className={`space-y-3 ${seccion.number > 1 ? "pt-7" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      {seccion.icon}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Sección {seccion.number}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-foreground">
                        {seccion.title}
                      </h2>
                    </div>
                  </div>

                  <div className="pl-0 sm:pl-12 pt-1">{seccion.content}</div>
                </article>
              ))}
            </div>
          </section>

          {/* Bloque de Consentimiento y Acciones */}
          <section
            aria-label="Consentimiento y Aceptación"
            className="space-y-5 rounded-3xl border-2 border-primary/30 bg-card p-5 shadow-float sm:p-7"
          >
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal/15 text-teal">
                <HeartHandshake className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  {isConsultationMode
                    ? "Estado de Acompañamiento Institucional"
                    : "Opciones de Acompañamiento Institucional"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Decide libremente cómo deseas interactuar con el equipo de Bienestar del TESH.
                </p>
              </div>
            </div>

            {/* Toggle de Modo Acompañamiento */}
            <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 pr-2">
                <span className="text-xs sm:text-sm font-semibold text-foreground">
                  Compartir mi tamizaje con Bienestar (Modo Acompañamiento)
                </span>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  Permites que el psicólogo del TESH consulte tus resultados para orientarte en caso
                  de necesitar apoyo. Es 100% reversible desde tu perfil.
                </p>
              </div>
              <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                <Switch
                  id="modo-acompaniamiento-toggle"
                  checked={modoAcompanamientoConsent}
                  onCheckedChange={setModoAcompanamientoConsent}
                  aria-label="Activar Modo Acompañamiento institucional"
                />
                <span className="text-xs font-bold text-primary">
                  {modoAcompanamientoConsent ? "Activado" : "Privado"}
                </span>
              </div>
            </div>

            {/* Checkbox de Aceptación (Interactivo en Modo 1, Solo Lectura en Modo 2) */}
            <div className="rounded-2xl border border-border bg-background/80 p-4">
              <label
                htmlFor="accept-privacy-terms"
                className={`flex items-start gap-3 select-none ${
                  isConsultationMode ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <Checkbox
                  id="accept-privacy-terms"
                  checked={acceptedTerms}
                  disabled={isConsultationMode}
                  onCheckedChange={(checked) => {
                    if (!isConsultationMode) {
                      setAcceptedTerms(checked === true);
                    }
                  }}
                  className="mt-0.5 size-5 rounded-md border-primary data-[state=checked]:bg-primary"
                />
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    {isConsultationMode
                      ? "Has leído y aceptado el Aviso de Privacidad Integral de Equilibra TESH."
                      : "He leído y acepto el Aviso de Privacidad Integral de Equilibra TESH."}
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Comprendo que la plataforma brinda orientación y tamizaje preventivo, y que no
                    sustituye un diagnóstico clínico médico formal.
                  </p>
                </div>
              </label>
            </div>

            {/* Botones de Acción según Modo */}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              {isConsultationMode ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoHome}
                    className="rounded-xl border-border bg-card text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                  >
                    <span>Ir al Inicio</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleReturnToProfile}
                    className="rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-float transition-all hover:opacity-95"
                  >
                    <ArrowLeft className="mr-1.5 size-3.5" />
                    <span>Volver a mi perfil</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="rounded-xl border-border bg-card text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                  >
                    <ArrowLeft className="mr-1.5 size-3.5" />
                    <span>No aceptar</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleAcceptAndContinue}
                    disabled={!acceptedTerms || isSubmitting}
                    className="rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-float transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{isSubmitting ? "Procesando..." : "Aceptar y continuar"}</span>
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Button>
                </>
              )}
            </div>
          </section>

          {/* Footer Formal */}
          <footer className="flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-4 text-teal" />
              <span>Equilibra TESH · 2026 · Versión {AVISO_PRIVACIDAD_METADATA.version}</span>
            </div>

            <a
              href="#descargar-pdf"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
            >
              <Download className="size-3.5" />
              <span>Descargar PDF</span>
            </a>
          </footer>
        </motion.div>
      </main>
    </PageShell>
  );
}
