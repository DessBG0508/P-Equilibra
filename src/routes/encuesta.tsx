import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EncuestaSatisfaccion } from "@/features/encuesta/EncuestaSatisfaccion";
import { BRAND } from "@/lib/branding";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

type ValidacionEstado = "cargando" | "valido" | "invalido" | "no_autenticado";

function EncuestaRouteComponent() {
  const { user, isLoading: authLoading } = useAuth();
  const [estado, setEstado] = useState<ValidacionEstado>("cargando");
  const [folio, setFolio] = useState<string>("");
  const [tipo, setTipo] = useState<"alta" | "abandono">("alta");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setEstado("no_autenticado");
      return;
    }

    let cancelado = false;

    async function validar() {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlFolio = params.get("folio");
        const urlTipo = params.get("tipo");

        if (!urlFolio) {
          if (!cancelado) setEstado("invalido");
          return;
        }

        // P0 #9 — Validar pertenencia del folio al usuario autenticado.
        // Antes: el folio se tomaba del query param sin verificación, lo que
        // permitía a un estudiante responder la encuesta de otro cambiando la
        // URL. Ahora consultamos respuestas_tamizaje para confirmar que el
        // folio pertenece al user.id de la sesión.
        const { data, error } = await supabase
          .from("respuestas_tamizaje")
          .select("folio")
          .eq("folio", urlFolio)
          .eq("user_id", user!.id)
          .maybeSingle();

        if (cancelado) return;

        if (error) {
          console.error("Error validando folio de encuesta:", error);
          setEstado("invalido");
          return;
        }

        if (!data) {
          setEstado("invalido");
          return;
        }

        setFolio(urlFolio);
        setTipo(urlTipo === "abandono" ? "abandono" : "alta");
        setEstado("valido");
      } catch (err) {
        console.error("Excepción validando encuesta:", err);
        if (!cancelado) setEstado("invalido");
      }
    }

    validar();
    return () => {
      cancelado = true;
    };
  }, [user, authLoading]);

  if (estado === "cargando" || authLoading) {
    return (
      <main className="min-h-screen bg-background grid place-items-center">
        <div className="text-center">
          <div
            className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-muted border-t-primary"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">Verificando enlace…</p>
        </div>
      </main>
    );
  }

  if (estado === "no_autenticado") {
    return (
      <main className="min-h-screen bg-background grid place-items-center px-6 py-12">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-tight">Inicia sesión para continuar</h1>
          <p className="mt-3 text-muted-foreground">
            Para responder la encuesta de satisfacción debes iniciar sesión con tu cuenta
            institucional del TESH.
          </p>
          <a
            href="/login"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ir a inicio de sesión
          </a>
        </div>
      </main>
    );
  }

  if (estado === "invalido") {
    return (
      <main className="min-h-screen bg-background grid place-items-center px-6 py-12">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-tight">Enlace no válido</h1>
          <p className="mt-3 text-muted-foreground">
            El folio no corresponde a tu cuenta, el enlace ya fue utilizado o ha expirado. Si crees
            que es un error, contacta a Bienestar Estudiantil del TESH.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <EncuestaSatisfaccion folio={folio} triggerTipo={tipo} userId={user?.id} />
    </main>
  );
}

export const Route = createFileRoute("/encuesta")({
  head: () => ({
    meta: [
      { title: `Encuesta de Satisfacción PB-021 — ${BRAND.fullName}` },
      {
        name: "description",
        content: `Encuesta de calidad y acompañamiento psicológico PB-021 de ${BRAND.fullName}.`,
      },
      { property: "og:title", content: `Encuesta de Satisfacción PB-021 — ${BRAND.fullName}` },
      {
        property: "og:description",
        content:
          "Formulario oficial de evaluación de calidad, confidencialidad y acompañamiento en salud mental del TESH.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: EncuestaRouteComponent,
});
