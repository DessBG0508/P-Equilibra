// Edge Function de Supabase: anclar_hash
// Anclaje criptográfico en la blockchain pública Polygon Amoy Testnet (Chain ID 80002)
// Solo el hash SHA-256 viaja en el campo 'data' de la transacción (cero datos clínicos).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6";

const RPC = "https://rpc-amoy.polygon.technology/";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KEY = Deno.env.get("ANCHOR_WALLET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!KEY) {
    return new Response(
      JSON.stringify({
        error: "Secreto ANCHOR_WALLET_KEY no configurado en Supabase Secrets.",
        status: "error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Toma los bloques de auditoría aún no anclados en orden de índice
    const { data: pendientes, error: dbError } = await supabase
      .from("bloques_auditoria")
      .select("*")
      .is("anclado_en", null)
      .order("indice")
      .limit(5);

    if (dbError) {
      throw new Error(`Error en base de datos: ${dbError.message}`);
    }

    if (!pendientes || pendientes.length === 0) {
      return new Response(
        JSON.stringify({
          mensaje: "No hay bloques pendientes de anclar.",
          anclados: 0,
          status: "completado",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(KEY, provider);
    const walletAddress = await wallet.getAddress();

    const resultados = [];

    for (const b of pendientes) {
      // El hash del bloque viaja como data de una transacción (solo el hash, jamás datos clínicos)
      const formattedHash = b.hash_actual.startsWith("0x") ? b.hash_actual : "0x" + b.hash_actual;

      const tx = await wallet.sendTransaction({
        to: walletAddress,
        data: formattedHash,
      });

      const rec = await tx.wait();

      if (rec && rec.hash) {
        await supabase
          .from("bloques_auditoria")
          .update({
            anclado_en: rec.hash,
            bloque_ext: rec.blockNumber,
          })
          .eq("indice", b.indice);

        resultados.push({
          indice: b.indice,
          tx_hash: rec.hash,
          bloque_ext: rec.blockNumber,
          hash_anclado: b.hash_actual,
        });
      }
    }

    return new Response(
      JSON.stringify({
        status: "completado",
        anclados: resultados.length,
        bloques: resultados,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al anclar bloques en Polygon Amoy";
    return new Response(
      JSON.stringify({
        status: "error",
        error: errorMsg,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
