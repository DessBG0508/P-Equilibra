import { createFileRoute } from "@tanstack/react-router";
import { ExpedientesPage } from "@/features/psicologo/expedientes-page";
import { BRAND } from "@/lib/branding";

export const Route = createFileRoute("/expedientes")({
  head: () => ({
    meta: [
      { title: `Expedientes clínicos — ${BRAND.fullName}` },
      {
        name: "description",
        content: `Consulta, gestión y exportación de expedientes confidenciales de acompañamiento psicológico en ${BRAND.fullName}.`,
      },
      { property: "og:title", content: `Expedientes clínicos — ${BRAND.fullName}` },
      {
        property: "og:description",
        content:
          "Gestión confidencial de expedientes, tamizajes PHQ-9/GAD-7 y bitácoras clínicas del TESH.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExpedientesPage,
});
