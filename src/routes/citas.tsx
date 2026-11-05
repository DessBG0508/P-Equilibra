import { createFileRoute } from "@tanstack/react-router";
import { CitasPage } from "@/features/citas/citas-page";
import { BRAND } from "@/lib/branding";

export const Route = createFileRoute("/citas")({
  head: () => ({
    meta: [
      { title: `Mis Citas — ${BRAND.fullName}` },
      {
        name: "description",
        content:
          "Agenda y gestiona tus sesiones de orientación y acompañamiento psicológico en el TESH.",
      },
      { property: "og:title", content: `Mis Citas — ${BRAND.fullName}` },
      {
        property: "og:description",
        content:
          "Agenda y gestiona tus sesiones de orientación y acompañamiento psicológico en el TESH.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CitasPage,
});
