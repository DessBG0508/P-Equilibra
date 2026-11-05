import { createFileRoute } from "@tanstack/react-router";
import { RecuperarPage } from "@/features/auth/recuperar-page";
import { BRAND } from "@/lib/branding";

export const Route = createFileRoute("/recuperar")({
  head: () => ({
    meta: [
      { title: `Recuperar contraseña — ${BRAND.fullName}` },
      {
        name: "description",
        content: "Recuperación de contraseña mediante Supabase Auth para la comunidad TESH.",
      },
      { property: "og:title", content: `Recuperar contraseña — ${BRAND.fullName}` },
      {
        property: "og:description",
        content: "Recuperación de contraseña mediante Supabase Auth para la comunidad TESH.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecuperarPage,
});
