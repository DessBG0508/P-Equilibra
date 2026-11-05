import { createFileRoute } from "@tanstack/react-router";
import { AuditoriaPage } from "@/features/auditoria/auditoria-page";
import { BRAND } from "@/lib/branding";

export const Route = createFileRoute("/auditoria")({
  head: () => ({
    meta: [
      { title: `Auditoría e Integridad Blockchain — ${BRAND.fullName}` },
      {
        name: "description",
        content: `Verificación criptográfica y libro mayor inmutable anclado en Polygon Amoy Testnet en ${BRAND.fullName}.`,
      },
      { property: "og:title", content: `Auditoría e Integridad Blockchain — ${BRAND.fullName}` },
      {
        property: "og:description",
        content:
          "Verificación matemática de trazabilidad clínica inmutable y anclajes en blockchain pública.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuditoriaPage,
});
