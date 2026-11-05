import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown, HeartHandshake, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { BreathingSphereView } from "@/components/effects/breathing-sphere-view";
import type { CrisisResource, RiskLevel } from "@/lib/types";
import { BRAND } from "@/lib/branding";

const ALERT_LEVEL: RiskLevel = "rojo";

const crisisResources: CrisisResource[] = [
  {
    id: "linea-vida",
    name: "Línea de la Vida",
    contact: "800 911 2000",
    kind: "phone",
    available: "Disponible las 24 horas",
  },
  {
    id: "emergencias",
    name: "Emergencias",
    contact: "911",
    kind: "emergency",
    available: "Atención inmediata",
  },
  {
    id: "eli",
    name: `Chat con ${BRAND.assistant}`,
    contact: "Próximamente",
    kind: "chat",
    available: "Acompañamiento por chat 24/7",
  },
];

export function AlertaPage() {
  const [showResources, setShowResources] = useState(false);
  const reduceMotion = useReducedMotion();

  const handleContact = () => {
    toast("Estamos preparando el contacto", {
      description: "En esta demostración, la solicitud quedó registrada.",
    });
  };

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl pb-6" data-risk-level={ALERT_LEVEL}>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary sm:text-sm">
          Atención prioritaria
        </p>

        <section
          className="relative overflow-hidden rounded-3xl bg-[#FF9CED] p-6 text-primary shadow-float sm:p-9 lg:p-12"
          style={{ backgroundColor: "#FF9CED" }}
          aria-labelledby="alert-title"
        >
          <img
            src="/emocionometro/mood-bien.png"
            alt=""
            className="pointer-events-none absolute -right-5 -top-4 w-28 rotate-6 opacity-20 sm:w-40"
            aria-hidden="true"
          />
          <img
            src="/emocionometro/mood-feliz.png"
            alt=""
            className="pointer-events-none absolute -bottom-6 right-20 w-20 -rotate-12 opacity-15 sm:w-28"
            aria-hidden="true"
          />
          <div className="relative max-w-2xl">
            <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-card/75 text-primary">
              <HeartHandshake className="size-6" aria-hidden="true" />
            </div>
            <h1
              id="alert-title"
              className="font-display text-3xl leading-tight sm:text-4xl lg:text-5xl"
            >
              Notamos que podrías necesitar apoyo ahora
            </h1>
            <p className="mt-4 max-w-xl text-base font-medium leading-relaxed sm:text-lg">
              No estás sola/o en esto. Hay alguien disponible para escucharte en este momento, sin
              costo y de forma confidencial.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                size="lg"
                onClick={handleContact}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Phone aria-hidden="true" />
                Hablar con alguien ahora
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                aria-expanded={showResources}
                aria-controls="crisis-resources"
                onClick={() => setShowResources((current) => !current)}
                className="w-full border-card bg-card text-primary hover:bg-card/90"
              >
                Ver recursos de apoyo
                <ChevronDown
                  className={`transition-transform ${showResources ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        </section>

        {showResources && (
          <motion.section
            id="crisis-resources"
            initial={reduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid gap-3 sm:grid-cols-3"
            aria-label="Recursos de apoyo"
          >
            {crisisResources.map((resource) => {
              const Icon = resource.kind === "chat" ? MessageCircle : Phone;
              const content = (
                <>
                  <span className="grid size-10 place-items-center rounded-2xl bg-mint-soft text-teal">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-primary">{resource.name}</span>
                    <span className="mt-0.5 block text-base font-bold text-foreground">
                      {resource.contact}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {resource.available}
                    </span>
                  </span>
                </>
              );

              return resource.kind === "chat" ? (
                <Link
                  key={resource.id}
                  to="/chat"
                  className="ethereal-card flex items-center gap-3 p-4 hover:border-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
                  aria-label={`Chat con ${BRAND.assistant} — Próximamente`}
                >
                  {content}
                </Link>
              ) : (
                <a
                  key={resource.id}
                  href={`tel:${resource.contact.replace(/\s/g, "")}`}
                  className="ethereal-card flex items-center gap-3 p-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
                >
                  {content}
                </a>
              );
            })}
          </motion.section>
        )}

        <section
          className="ethereal-card mt-5 grid items-center gap-7 p-6 sm:grid-cols-[minmax(13rem,0.7fr)_1.3fr] sm:p-9"
          aria-labelledby="breathing-title"
        >
          <div className="flex min-h-56 items-center justify-center" aria-hidden="true">
            <BreathingSphereView />
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2 text-teal">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.16em]">
                Respiración 4–7–8
              </span>
            </div>
            <h2 id="breathing-title" className="font-display text-3xl text-primary sm:text-4xl">
              Mientras tanto
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Respira lento cuatro segundos, sostén, y suelta. Estamos aquí contigo.
            </p>
          </div>
        </section>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Cuando te sientas listo/a, puedes volver cuando quieras</p>
          <Link
            to="/"
            className="mt-2 inline-block font-semibold text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
          >
            Volver al inicio
          </Link>
        </footer>
      </main>
    </PageShell>
  );
}
