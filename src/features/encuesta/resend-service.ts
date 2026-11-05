/**
 * Integración con Resend para PB-021 Encuesta de Satisfacción
 * Equilibra TESH - Notificaciones Institucionales
 *
 * P0 #11 — Refactor arquitectónico:
 * - ANTES: la API key de Resend vivía en `VITE_RESEND_API_KEY` y se empaquetaba
 *   en el bundle del navegador, expuesta a cualquier usuario con DevTools.
 * - AHORA: este cliente invoca la Edge Function `enviar-encuesta` (Supabase
 *   Functions) que mantiene la API key en el servidor (Deno.env) y valida el
 *   JWT del caller. El navegador nunca ve la llave.
 *
 * NOTA ARQUITECTÓNICA (MIN-008):
 * - Se prefiere Resend sobre Supabase SMTP debido al límite de 2 correos por
 *   hora de Supabase. Resend free tier: 100 correos/día (3,000/mes).
 */

import { supabase } from "@/lib/supabase";

export interface EnviarEncuestaEmailParams {
  destinatarioEmail: string;
  destinatarioNombre?: string;
  folio: string;
  triggerTipo: "alta" | "abandono";
  enlaceEncuesta: string;
}

export interface EnviarEmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  modo: "resend_api" | "simulado_local";
}

/**
 * Envía la notificación de la encuesta delegando a la Edge Function
 * `enviar-encuesta`. Esta función construye el HTML y el asunto en el
 * servidor; el cliente solo pasa los parámetros necesarios.
 *
 * El parámetro `enlaceEncuesta` se conserva en la firma para no romper
 * callers existentes, pero la Edge Function lo reconstruye del lado del
 * servidor usando `APP_PUBLIC_URL` para evitar manipulación del cliente.
 */
export async function enviarNotificacionEncuestaResend(
  params: EnviarEncuestaEmailParams,
): Promise<EnviarEmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke("enviar-encuesta", {
      body: {
        folio: params.folio,
        trigger_tipo: params.triggerTipo,
        destinatario_email: params.destinatarioEmail,
        destinatario_nombre: params.destinatarioNombre ?? "",
        // Nota: la Edge reconstruye el enlace desde APP_PUBLIC_URL; este
        // campo se conserva solo para compatibilidad hacia atrás.
        enlace_encuesta: params.enlaceEncuesta,
      },
    });

    if (error) {
      console.error("[enviar-encuesta] Error de invocación:", error);
      return {
        ok: false,
        error: error.message ?? "Error invocando la Edge Function",
        modo: "resend_api",
      };
    }

    const result = data as {
      ok?: boolean;
      messageId?: string;
      error?: string;
      modo?: "resend_api" | "simulado_local";
      mensaje?: string;
    };

    if (!result?.ok) {
      return {
        ok: false,
        error: result?.error ?? "Respuesta inesperada del servidor",
        modo: "resend_api",
      };
    }

    return {
      ok: true,
      messageId: result.messageId,
      modo: result.modo ?? "resend_api",
    };
  } catch (err) {
    console.error("[enviar-encuesta] Excepción:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Excepción desconocida",
      modo: "resend_api",
    };
  }
}
