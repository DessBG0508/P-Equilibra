-- ==============================================================================
-- TABLA DE EXPEDIENTES CLÍNICOS - EQUILIBRA TESH
-- Conexión: Supabase PostgreSQL
-- ==============================================================================

-- 1. Crear tabla expedientes_clinicos si no existe
CREATE TABLE IF NOT EXISTS public.expedientes_clinicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT NOT NULL,
  psicologo_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campos_clinicos JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT expedientes_clinicos_folio_psicologo_unique UNIQUE (folio, psicologo_id)
);

-- 2. Índices para búsqueda rápida por folio y psicólogo
CREATE INDEX IF NOT EXISTS idx_expedientes_folio ON public.expedientes_clinicos(folio);
CREATE INDEX IF NOT EXISTS idx_expedientes_psicologo ON public.expedientes_clinicos(psicologo_id);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.expedientes_clinicos ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS:
-- El psicólogo puede SELECT, INSERT y UPDATE únicamente en sus propios expedientes
DROP POLICY IF EXISTS "Psicólogo puede ver sus propios expedientes" ON public.expedientes_clinicos;
CREATE POLICY "Psicólogo puede ver sus propios expedientes"
  ON public.expedientes_clinicos
  FOR SELECT
  TO authenticated
  USING (psicologo_id = auth.uid());

DROP POLICY IF EXISTS "Psicólogo puede registrar expedientes" ON public.expedientes_clinicos;
CREATE POLICY "Psicólogo puede registrar expedientes"
  ON public.expedientes_clinicos
  FOR INSERT
  TO authenticated
  WITH CHECK (psicologo_id = auth.uid());

DROP POLICY IF EXISTS "Psicólogo puede actualizar sus expedientes" ON public.expedientes_clinicos;
CREATE POLICY "Psicólogo puede actualizar sus expedientes"
  ON public.expedientes_clinicos
  FOR UPDATE
  TO authenticated
  USING (psicologo_id = auth.uid())
  WITH CHECK (psicologo_id = auth.uid());

-- 5. Trigger automático para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at_expedientes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_expedientes_updated_at ON public.expedientes_clinicos;
CREATE TRIGGER trigger_expedientes_updated_at
  BEFORE UPDATE ON public.expedientes_clinicos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_expedientes();
