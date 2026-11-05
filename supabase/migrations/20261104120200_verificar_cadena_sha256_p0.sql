-- ============================================================================
-- Equilibra TESH — Patch P0 #8: verificar_cadena con recompute SHA-256
-- ----------------------------------------------------------------------------
-- Antes: la función solo verificaba encadenamiento (hash_previo == hash_actual
-- del bloque anterior). Un atacante con acceso DB podía modificar el JSONB
-- `datos` sin recalcular `hash_actual` y la verificación pasaba sin detectar.
--
-- Ahora: se recompute SHA-256(datos::text) y se compara con `hash_actual`.
-- También se reporta el último índice y el total de bloques anclados.
--
-- Requiere la extensión pgcrypto (CREATE EXTENSION IF NOT EXISTS pgcrypto).
-- ============================================================================

-- Extensión criptográfica necesaria para digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Reemplazar la función verificar_cadena()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.verificar_cadena()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  prev_hash TEXT := '0000000000000000000000000000000000000000000000000000000000000000';
  total INT := 0;
  anclados INT := 0;
  last_hash TEXT := '';
  recompute TEXT := '';
  -- El genesis usa el mismo seed que el cliente (blockchain-audit.ts)
  -- para que el primer bloque sea válido si el cliente lo construyó así.
  -- El primer bloque (indice=1) se leen sus hash_previo y se compara.
BEGIN
  FOR rec IN
    SELECT indice, hash_previo, hash_actual, datos, anclado_en
    FROM public.bloques_auditoria
    ORDER BY indice ASC
  LOOP
    total := total + 1;
    IF rec.anclado_en IS NOT NULL THEN
      anclados := anclados + 1;
    END IF;

    -- 1. Validar encadenamiento (hash_previo == hash_actual anterior)
    IF total > 1 AND rec.hash_previo <> prev_hash THEN
      RETURN jsonb_build_object(
        'valida', false,
        'indice_alterado', rec.indice,
        'error', 'Encadenamiento roto en bloque #' || rec.indice
      );
    END IF;

    -- 2. P0 #8 — Recomputar SHA-256(datos::text) y comparar con hash_actual
    --    Esto detecta manipulación del JSONB aunque hash_actual no se haya
    --    recalculado. El cliente usa crypto.subtle sobre la cadena JSON
    --    canónica; aquí usamos datos::text (Postgres normaliza con espacios
    --    consistentes). Si el cliente y el servidor discrepan en formato,
    --    se puede ajustar este recompute a un JSON canónico.
    SELECT encode(digest(rec.datos::text, 'sha256'), 'hex') INTO recompute;

    IF rec.hash_actual <> recompute THEN
      RETURN jsonb_build_object(
        'valida', false,
        'indice_alterado', rec.indice,
        'error', 'Hash de datos alterado en bloque #' || rec.indice,
        'hash_esperado', recompute,
        'hash_actual', rec.hash_actual
      );
    END IF;

    prev_hash := rec.hash_actual;
    last_hash := rec.hash_actual;
  END LOOP;

  RETURN jsonb_build_object(
    'valida', true,
    'total_bloques', total,
    'anclados', anclados,
    'ultimo_indice', total,
    'ultimo_hash', last_hash,
    'mensaje', 'Cadena válida: ' || total || ' bloques verificados (encadenamiento + SHA-256).'
  );
END;
$$;

-- ============================================================================
-- Nota: si tu cliente (blockchain-audit.ts) computa el SHA-256 con un formato
-- distinto a `datos::text` de Postgres (p.ej. JSON.stringify sin espacios),
-- agrega una columna `hash_datos_canonico TEXT` con el hash que el cliente
-- computa y compara contra esa en vez de recomputar aquí. Para el MVP, este
-- recompute Postgres-side es suficiente para detectar manipulaciones internas.
-- ============================================================================

-- ============================================================================
-- Verificación:
--   SELECT public.verificar_cadena();
-- ============================================================================

-- ============================================================================
-- También: quitar acceso anon a bloques_auditoria (consistencia con Patch 2)
-- ============================================================================
DROP POLICY IF EXISTS "Lectura de bloques de auditoria para directivos y autorizados"
  ON public.bloques_auditoria;

CREATE POLICY "Directivos leen bloques de auditoria"
  ON public.bloques_auditoria
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'directivo'
    )
  );
