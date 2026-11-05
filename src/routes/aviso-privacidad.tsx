import { createFileRoute } from "@tanstack/react-router";
import { AvisoPrivacidadPage } from "@/features/aviso-privacidad/aviso-privacidad-page";
import { BRAND } from "@/lib/branding";

export const Route = createFileRoute("/aviso-privacidad")({
  validateSearch: (search: Record<string, unknown>): { mode?: string } => ({
    mode: typeof search.mode === "string" ? search.mode : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Aviso de Privacidad Integral — ${BRAND.fullName}` },
      {
        name: "description",
        content:
          "Aviso de Privacidad Integral de Equilibra TESH conforme a la LFPDPPP y NOM-024-SSA3-2012 para el resguardo confidencial de datos personales y tamizajes.",
      },
      { property: "og:title", content: `Aviso de Privacidad Integral — ${BRAND.fullName}` },
      {
        property: "og:description",
        content:
          "Aviso de Privacidad Integral de Equilibra TESH conforme a la LFPDPPP y NOM-024-SSA3-2012.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AvisoPrivacidadPage,
});
