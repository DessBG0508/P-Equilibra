import { createFileRoute } from "@tanstack/react-router";
import { ResetPage } from "@/features/auth/reset-page";
import { BRAND } from "@/lib/branding";

export const Route = createFileRoute("/reset")({
  head: () => ({
    meta: [
      { title: `Restablecer contraseña — ${BRAND.fullName}` },
      {
        name: "description",
        content: "Crea una nueva contraseña segura para tu cuenta de Equilibra TESH.",
      },
      { property: "og:title", content: `Restablecer contraseña — ${BRAND.fullName}` },
      {
        property: "og:description",
        content: "Crea una nueva contraseña segura para tu cuenta de Equilibra TESH.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPage,
});
