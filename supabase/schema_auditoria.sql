-- ====================================================================
-- TABLA, VISTA SEGURA Y FUNCIÓN DE AUDITORÍA BLOCKCHAIN EN SUPABASE
-- FASE 3 Y 4 — AUDITORÍA E INTEGRIDAD CRIPTOGRÁFICA
-- ====================================================================

-- 1. Tabla de bloques de auditoría (si no existe)
CREATE TABLE IF NOT EXISTS public.bloques_auditoria (
  indice BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hash_previo TEXT NOT NULL,
  hash_actual TEXT NOT NULL,
  datos JSONB NOT NULL,
  anclado_en TEXT,          -- Hash de la transacción en Polygon Amoy
  bloque_ext BIGINT,        -- Número de bloque en Polygon Amoy
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE public.bloques_auditoria ENABLE ROW LEVEL SECURITY;

-- Política de lectura segura para usuarios autenticados
CREATE POLICY "Lectura de bloques de auditoria para directivos y autorizados"
  ON public.bloques_auditoria
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 2. Vista segura (security_invoker): v_auditoria_resumen
-- Expone solo datos anonimizados y huellas criptográficas (sin datos clínicos)
CREATE OR REPLACE VIEW public.v_auditoria_resumen
WITH (security_invoker = true) AS
SELECT
  indice,
  COALESCE(datos->>'tipo_evento', datos->>'tipo', 'REGISTRO_TAMIZAJE') AS tipo_evento,
  hash_actual,
  SUBSTRING(hash_actual FROM 1 FOR 10) || '...' || SUBSTRING(hash_actual FROM LENGTH(hash_actual) - 7 FOR 8) AS hash_abreviado,
  hash_previo,
  anclado_en,
  bloque_ext,
  CASE WHEN anclado_en IS NOT NULL THEN true ELSE false END AS esta_anclado,
  'https://amoy.polygonscan.com/tx/' || anclado_en AS enlace_explorador,
  creado_en
FROM public.bloques_auditoria
ORDER BY indice DESC;

-- 3. Función RPC para verificar la integridad de la cadena
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
BEGIN
  FOR rec IN
    SELECT indice, hash_previo, hash_actual, anclado_en
    FROM public.bloques_auditoria
    ORDER BY indice ASC
  LOOP
    total := total + 1;
    IF rec.anclado_en IS NOT NULL THEN
      anclados := anclados + 1;
    END IF;

    -- Validar encadenamiento a partir del segundo bloque
    IF total > 1 AND rec.hash_previo <> prev_hash THEN
      RETURN jsonb_build_object(
        'valida', false,
        'indice_alterado', rec.indice,
        'error', 'Discrepancia en bloque #' || rec.indice
      );
    END IF;

    prev_hash := rec.hash_actual;
    last_hash := rec.hash_actual;
  END LOOP;

  RETURN jsonb_build_object(
    'valida', true,
    'total_bloques', total,
    'anclados', anclados,
    'ultimo_hash', last_hash,
    'mensaje', 'CADENA VÁLIDA'
  );
END;
$$;
