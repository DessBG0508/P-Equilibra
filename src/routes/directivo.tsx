import { createFileRoute } from "@tanstack/react-router";
import { DirectivoDashboard } from "@/features/directivo/directivo-dashboard";
import { BRAND } from "@/lib/branding";

export const Route = createFileRoute("/directivo")({
  head: () => ({
    meta: [
      { title: `Panel directivo de bienestar — ${BRAND.fullName}` },
      {
        name: "description",
        content: `Métricas agregadas y anónimas de bienestar estudiantil por carrera en ${BRAND.fullName}.`,
      },
      { property: "og:title", content: `Panel directivo de bienestar — ${BRAND.fullName}` },
      {
        property: "og:description",
        content:
          "Datos agregados y anónimos de bienestar estudiantil para la toma de decisiones institucionales.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DirectivoDashboard,
});
