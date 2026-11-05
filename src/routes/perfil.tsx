import { createFileRoute } from "@tanstack/react-router";
import { PerfilPage } from "@/features/perfil/perfil-page";
import { BRAND } from "@/lib/branding";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: `Mi Perfil — ${BRAND.fullName}` },
      {
        name: "description",
        content:
          "Consulta tus métricas de bienestar, gestiona tu consentimiento para el Modo Acompañamiento y revisa los datos de tu cuenta institucional.",
      },
      { property: "og:title", content: `Mi Perfil — ${BRAND.fullName}` },
      {
        property: "og:description",
        content:
          "Consulta tus métricas de bienestar, gestiona tu consentimiento para el Modo Acompañamiento y revisa los datos de tu cuenta institucional.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilPage,
});
