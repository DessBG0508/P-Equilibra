import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/login-page";
import { BRAND } from "@/lib/branding";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: `Iniciar sesión — ${BRAND.fullName}` },
      {
        name: "description",
        content: "Accede a tu espacio de acompañamiento y bienestar emocional en el TESH.",
      },
      { property: "og:title", content: `Iniciar sesión — ${BRAND.fullName}` },
      {
        property: "og:description",
        content: "Accede a tu espacio de acompañamiento y bienestar emocional en el TESH.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});
