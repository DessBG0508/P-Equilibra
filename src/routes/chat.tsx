import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "@/features/chat/chat-page";
import { BRAND } from "@/lib/branding";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: `Chat con ${BRAND.assistant} — ${BRAND.fullName}` },
      {
        name: "description",
        content: `Conversa con ${BRAND.assistant}, asistente conversacional de apoyo emocional en un espacio confidencial y seguro para la comunidad del TESH.`,
      },
      { property: "og:title", content: `Chat con ${BRAND.assistant} — ${BRAND.fullName}` },
      {
        property: "og:description",
        content: `Conversa con ${BRAND.assistant}, asistente conversacional de apoyo emocional en un espacio confidencial y seguro para la comunidad del TESH.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});
