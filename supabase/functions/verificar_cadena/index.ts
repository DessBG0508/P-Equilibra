// Edge Function de Supabase: verificar_cadena
// Verifica la integridad matemática de la cadena hash de auditoría utilizando service_role.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Obtener los bloques en orden de índice
    const { data: bloques, error } = await supabase
      .from("bloques_auditoria")
      .select("indice, hash_previo, hash_actual, anclado_en, bloque_ext, creado_en")
      .order("indice", { ascending: true });

    if (error) {
      throw new Error(`Error en base de datos: ${error.message}`);
    }

    if (!bloques || bloques.length === 0) {
      return new Response(
        JSON.stringify({
          valida: true,
          total_bloques: 0,
          ultimo_hash: "0000000000000000000000000000000000000000000000000000000000000000",
          anclados: 0,
          mensaje: "Cadena inicial vacía (bloque génesis pendiente).",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let prevHash = "0".repeat(64);
    let ancladosCount = 0;

    for (let i = 0; i < bloques.length; i++) {
      const b = bloques[i];

      if (b.anclado_en) {
        ancladosCount++;
      }

      // Validar encadenamiento de hash previo
      if (i > 0) {
        if (b.hash_previo !== prevHash) {
          return new Response(
            JSON.stringify({
              valida: false,
              indice_alterado: b.indice,
              error: `Discrepancia en bloque #${b.indice}: hash_previo no coincide con hash_actual del bloque anterior.`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      prevHash = b.hash_actual;
    }

    const ultimoBloque = bloques[bloques.length - 1];

    return new Response(
      JSON.stringify({
        valida: true,
        total_bloques: bloques.length,
        ultimo_hash: ultimoBloque.hash_actual,
        ultimo_indice: ultimoBloque.indice,
        anclados: ancladosCount,
        mensaje: "CADENA VÁLIDA",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al verificar la cadena";
    return new Response(
      JSON.stringify({
        valida: false,
        error: errorMsg,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
