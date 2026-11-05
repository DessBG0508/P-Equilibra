// ============================================================================
// Equilibra TESH — Edge Function: enviar-encuesta
// ----------------------------------------------------------------------------
// Patch P0 #11 — Mueve la integración con Resend desde el cliente (donde la
// API key se empaquetaba en el bundle del navegador) a esta Edge Function.
//
// Recibe: { folio, user_id, trigger_tipo, destinatario_email, destinatario_nombre }
// Devuelve: { ok, messageId?, error?, modo? }
//
// Variables de entorno (configurar con `supabase secrets set`):
//   - RESEND_API_KEY         (obligatorio; sin ella se devuelve ok simulado)
//   - SUPABASE_URL           (lo inyecta Supabase automáticamente)
//   - SUPABASE_SERVICE_ROLE_KEY (lo inyecta Supabase automáticamente)
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM_ADDRESS = "Equilibra TESH <citas@equilibra-tesh.edu.mx>";
const TIMEOUT_MS = 12000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- Helpers ---------------------------------------------------------------

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSubject(triggerTipo: string): string {
  return triggerTipo === "abandono"
    ? "Equilibra TESH — Tu opinión nos importa (seguimiento de proceso)"
    : "Equilibra TESH — Encuesta de satisfacción tras tu sesión";
}

function buildHtmlEmail(params: {
  folio: string;
  destinatarioNombre: string;
  enlaceEncuesta: string;
  triggerTipo: string;
}): string {
  const { folio, destinatarioNombre, enlaceEncuesta, triggerTipo } = params;
  const saludo = destinatarioNombre ? `Hola ${escapeHtml(destinatarioNombre)},` : "Hola,";

  const contexto =
    triggerTipo === "abandono"
      ? "Notamos que no pudiste asistir a tus últimas citas programadas. Nos gustaría conocer tu experiencia para mejorar el acompañamiento que ofrecemos."
      : "Recientemente completaste una sesión de acompañamiento psicológico. Tu opinión es fundamental para mejorar el servicio de Bienestar Integral del TESH.";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Encuesta de Satisfacción — Equilibra TESH</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f5f5f7; margin:0; padding:24px;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:16px; padding:32px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
    <div style="text-align:center; margin-bottom:24px;">
      <div style="font-size:22px; font-weight:700; color:#1c2474;">Equilibra TESH</div>
      <div style="font-size:12px; color:#6b7280; margin-top:4px;">Bienestar Integral · Tecnológico de Estudios Superiores de Huixquilucan</div>
    </div>
    <p style="font-size:15px; color:#111827; margin:0 0 16px 0;">${saludo}</p>
    <p style="font-size:14px; color:#374151; line-height:1.6; margin:0 0 16px 0;">${contexto}</p>
    <p style="font-size:14px; color:#374151; line-height:1.6; margin:0 0 24px 0;">
      Te invitamos a responder una breve encuesta de 10 preguntas (3 minutos).
      Esta encuesta está identificada con tu follo de tamizaje
      <strong style="color:#1c2474;">${escapeHtml(folio)}</strong> (acuerdo MIN-008, no es anónima).
    </p>
    <div style="text-align:center; margin:32px 0;">
      <a href="${escapeHtml(enlaceEncuesta)}"
         style="display:inline-block; background:#6857E4; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:12px; font-weight:600; font-size:15px;">
        Responder encuesta
      </a>
    </div>
    <p style="font-size:12px; color:#6b7280; line-height:1.5; margin:24px 0 0 0; border-top:1px solid #e5e7eb; padding-top:16px;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
      <a href="${escapeHtml(enlaceEncuesta)}" style="color:#6857E4; word-break:break-all;">${escapeHtml(enlaceEncuesta)}</a>
    </p>
    <p style="font-size:11px; color:#9ca3af; line-height:1.5; margin:24px 0 0 0;">
      Este correo es confidencial y se envía en el marco del programa Equilibra TESH conforme a la LFPDPPP y NOM-024-SSA3-2012.
      Si crees que lo recibiste por error, ignóralo.
    </p>
  </div>
</body>
</html>`;
}

async function sendViaResend(
  apiKey: string,
  payload: {
    to: string;
    subject: string;
    html: string;
  },
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const errText = await response.text();
      return {
        ok: false,
        error: `Resend API ${response.status}: ${errText}`,
      };
    }
    const data = await response.json();
    return { ok: true, messageId: data.id };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: `Timeout tras ${TIMEOUT_MS}ms contactando Resend` };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Excepción desconocida" };
  } finally {
    clearTimeout(timeout);
  }
}

// --- Main handler ----------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Validar JWT del caller (solo usuarios autenticados pueden disparar encuestas)
  const authHeader = req.headers.get("Authorization") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "Configuración del servidor incompleta." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Validar JWT (cliente autenticado) — servicio usa service_role para escribir
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "No autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    return new Response(JSON.stringify({ ok: false, error: "Falta token de autorización." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Parsear body
  let body: {
    folio?: string;
    user_id?: string;
    trigger_tipo?: string;
    destinatario_email?: string;
    destinatario_nombre?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Body JSON inválido." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const folio = (body.folio || "").trim();
  const triggerTipo = body.trigger_tipo === "abandono" ? "abandono" : "alta";
  const destinatarioEmail = (body.destinatario_email || "").trim().toLowerCase();

  if (!folio) {
    return new Response(JSON.stringify({ ok: false, error: "folio es obligatorio." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!destinatarioEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatarioEmail)) {
    return new Response(JSON.stringify({ ok: false, error: "destinatario_email inválido." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. Construir enlace firmado simple (query param con folio + tipo)
  //    En una iteración futura se puede sustituir por un JWT firmado con exp.
  const appBase = Deno.env.get("APP_PUBLIC_URL") ?? "https://equilibra-tesh.edu.mx";
  const enlaceEncuesta = `${appBase}/encuesta?folio=${encodeURIComponent(folio)}&tipo=${triggerTipo}`;

  // 4. Enviar vía Resend (si hay API key configurada)
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey || !resendApiKey.startsWith("re_")) {
    // Modo simulado (desarrollo local sin secrets)
    console.warn("[enviar-encuesta] RESEND_API_KEY no configurada — modo simulado.");
    return new Response(
      JSON.stringify({
        ok: true,
        messageId: `sim-${Date.now()}`,
        modo: "simulado_local",
        mensaje: "Correo simulado (RESEND_API_KEY no configurada en el servidor).",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const subject = buildSubject(triggerTipo);
  const html = buildHtmlEmail({
    folio,
    destinatarioNombre: body.destinatario_nombre ?? "",
    enlaceEncuesta,
    triggerTipo,
  });

  const result = await sendViaResend(resendApiKey, { to: destinatarioEmail, subject, html });

  if (!result.ok) {
    console.error("[enviar-encuesta] Falló Resend:", result.error);
    return new Response(JSON.stringify({ ok: false, error: result.error, modo: "resend_api" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      messageId: result.messageId,
      modo: "resend_api",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
