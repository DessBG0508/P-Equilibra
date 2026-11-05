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
        const responseText = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        return { text: responseText };
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido. Solo se acepta POST." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { paciente, GAD7, PHQ9, user_id } = body;

    if (!paciente || !Array.isArray(GAD7) || !Array.isArray(PHQ9)) {
      return new Response(
        JSON.stringify({
          status: "error",
          error: "Datos de tamizaje incompletos (paciente, GAD7, PHQ9 requeridos).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const gad7Total = GAD7.reduce((acc: number, val: number) => acc + (Number(val) || 0), 0);
    const phq9Total = PHQ9.reduce((acc: number, val: number) => acc + (Number(val) || 0), 0);
    const item9 = Number(PHQ9[8]) || 0;

    let nivel: "verde" | "amarillo" | "rojo" = "verde";
    let alerta = false;

    if (item9 > 0 || phq9Total >= 20 || gad7Total >= 15) {
      nivel = "rojo";
      alerta = true;
    } else if (phq9Total >= 10 || gad7Total >= 10) {
      nivel = "amarillo";
    }

    const folio = `EQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from("pacientes").upsert({
        folio,
        iniciales: paciente.iniciales || "N/A",
        edad: Number(paciente.edad) || null,
        sexo: paciente.sexo || null,
        semestre: paciente.semestre || null,
        user_id: user_id || null,
        bloqueado: nivel === "amarillo" || nivel === "rojo",
      });

      await supabase.from("respuestas_tamizaje").insert([
        {
          folio,
          instrumento: "GAD-7",
          total: gad7Total,
          nivel,
          item9: 0,
          alerta,
        },
        {
          folio,
          instrumento: "PHQ-9",
          total: phq9Total,
          nivel,
          item9,
          alerta,
        },
      ]);

      if (alerta || nivel === "rojo") {
        await supabase.from("alertas").insert({
          folio,
          tipo: item9 > 0 ? "emergencia" : "rojo",
          atendida: false,
        });
      }
    }

    return new Response(
      JSON.stringify({
        status: "completado",
        data: {
          folio,
          nivel,
          alerta,
          resultados: [
            {
              instrumento: "GAD-7",
              total: gad7Total,
              interpretacion:
                gad7Total >= 15
                  ? "Ansiedad severa"
                  : gad7Total >= 10
                    ? "Ansiedad moderada"
                    : gad7Total >= 5
                      ? "Ansiedad leve"
                      : "Mínima ansiedad",
              nivel,
            },
            {
              instrumento: "PHQ-9",
              total: phq9Total,
              interpretacion:
                phq9Total >= 20
                  ? "Depresión severa"
                  : phq9Total >= 15
                    ? "Depresión moderadamente severa"
                    : phq9Total >= 10
                      ? "Depresión moderada"
                      : phq9Total >= 5
                        ? "Depresión leve"
                        : "Mínima depresión",
              item9,
              nivel,
            },
          ],
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        status: "error",
        error: errorMsg,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
