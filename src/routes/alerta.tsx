import { createFileRoute } from "@tanstack/react-router";
import { AlertaPage } from "@/features/alerta/alerta-page";
import { BRAND } from "@/lib/branding";

export const Route = createFileRoute("/alerta")({
  head: () => ({
    meta: [
      { title: `Atención prioritaria — ${BRAND.fullName}` },
      {
        name: "description",
        content:
          "Apoyo psicológico inmediato, confidencial y cercano para estudiantes de la comunidad TESH.",
      },
      { property: "og:title", content: `Atención prioritaria — ${BRAND.fullName}` },
      {
        property: "og:description",
        content: "Encuentra acompañamiento y recursos de apoyo disponibles en este momento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertaPage,
});
