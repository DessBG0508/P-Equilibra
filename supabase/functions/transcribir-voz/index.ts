import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL_NAME = "gemini-3.8-flash";
const TIMEOUT_MS = 12000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Patrón de failover consistente con la arquitectura de Edge Functions de Equilibra TESH:
 * 1. Intenta con GEMINI_API_KEY
 * 2. Si falla (error HTTP 429, 500, quota o timeout), intenta con GEMINI_API_KEY_2
 * 3. Si ambas fallan, arroja error descriptivo
 */
async function callGeminiWithFailover(payload: unknown): Promise<{ text: string }> {
  const primaryKey = Deno.env.get("GEMINI_API_KEY");
  const secondaryKey = Deno.env.get("GEMINI_API_KEY_2");

  const keys = [primaryKey, secondaryKey].filter((k): k is string => Boolean(k && k.trim()));

  if (keys.length === 0) {
    throw new Error(
      "No hay llaves de API de Gemini configuradas (GEMINI_API_KEY / GEMINI_API_KEY_2).",
    );
  }

  let lastError: Error | null = null;

  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    const keyLabel = i === 0 ? "GEMINI_API_KEY" : "GEMINI_API_KEY_2";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const transcription = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        return { text: transcription };
      }

      const errorBody = await res.text();
      console.warn(
        `[Failover] Llave ${keyLabel} falló con estado HTTP ${res.status}: ${errorBody}`,
      );
      lastError = new Error(`Gemini API error (HTTP ${res.status}): ${errorBody}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[Failover] Error de conexión o timeout con llave ${keyLabel}: ${message}`);
      lastError = err instanceof Error ? err : new Error(message);
    }
  }

  throw lastError ?? new Error("Fallo en todas las llaves de Gemini disponibles.");
}

Deno.serve(async (req: Request) => {
  // Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido. Solo se acepta POST." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1. Verificación de autenticación (JWT del estudiante)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Cabecera Authorization faltante. Se requiere token Bearer." }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ error: "Variables de entorno de Supabase no configuradas en el servidor." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Cliente con el token del llamante para respetar RLS en la tabla notas_voz
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Usuario no autenticado o sesión expirada." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Validación del cuerpo de la petición
  let audio_base64: string | undefined;
  let folio: string | undefined;
  let duracion_seg: number | undefined;
  let mime_type = "audio/webm";

  try {
    const body = await req.json();
    audio_base64 = body.audio_base64;
    folio = body.folio;
    duracion_seg = body.duracion_seg;
    if (body.mime_type && typeof body.mime_type === "string") {
      mime_type = body.mime_type;
    }
  } catch {
    return new Response(JSON.stringify({ error: "Cuerpo de solicitud JSON inválido." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!audio_base64 || typeof audio_base64 !== "string" || audio_base64.trim().length === 0) {
    return new Response(JSON.stringify({ error: "El campo 'audio_base64' es obligatorio." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Limpiar prefijo data URL si viniera presente
  const cleanBase64 = audio_base64.includes(",") ? audio_base64.split(",")[1] : audio_base64;

  // 3. Preparación del payload para Gemini
  const promptInstrucciones =
    "Transcribe con fidelidad y exactitud el audio en español proporcionado por el estudiante. " +
    "Devuelve única y exclusivamente el texto transcrito. " +
    "No agregues introducciones, no agregues explicaciones, no agregues comillas ni comentarios.";

  const geminiPayload = {
    system_instruction: { parts: [{ text: promptInstrucciones }] },
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mime_type.split(";")[0],
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  // 4. Invocación con failover de llaves
  let transcripcion = "";
  try {
    const result = await callGeminiWithFailover(geminiPayload);
    transcripcion = result.text;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error del servicio de transcripción de audio";
    console.error("[TranscribirVoz] Error con Gemini:", msg);
    return new Response(
      JSON.stringify({
        error:
          "El servicio de transcripción no está disponible en este momento. Intenta de nuevo o escribe tu respuesta.",
        detalle: msg,
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // 5. Registro en tabla notas_voz respetando RLS
  let notaId = crypto.randomUUID();
  try {
    const { data: nota, error: dbError } = await supabase
      .from("notas_voz")
      .insert({
        user_id: user.id,
        folio: folio ?? null,
        transcripcion: transcripcion,
        duracion_seg: typeof duracion_seg === "number" ? duracion_seg : null,
      })
      .select("id")
      .maybeSingle();

    if (dbError) {
      console.warn("[TranscribirVoz] Advertencia al persistir en notas_voz:", dbError.message);
    } else if (nota?.id) {
      notaId = String(nota.id);
    }
  } catch (dbErr: unknown) {
    console.warn("[TranscribirVoz] Excepción al registrar en notas_voz:", dbErr);
  }

  // 6. Respuesta exitosa
  return new Response(
    JSON.stringify({
      transcripcion,
      nota_id: notaId,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
