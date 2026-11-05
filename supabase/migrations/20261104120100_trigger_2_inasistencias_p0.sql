-- ============================================================================
-- Equilibra TESH — Patch P0 #5: Trigger DB para 2 inasistencias consecutivas
-- ----------------------------------------------------------------------------
-- Antes: la lógica vivía solo en `agenda-service.ts` (client-side). Si el
-- estado se actualizaba por SQL directo, otra sesión, o una Edge Function, el
-- email PB-021 abandono NO se disparaba.
--
-- Ahora: trigger server-side AFTER UPDATE que detecta 2 `no_asistio`
-- consecutivos y encola el envío de la encuesta para dentro de 15 días.
-- ============================================================================

-- ============================================================================
-- 0. Tabla cola_envios_encuesta (si no existe)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cola_envios_encuesta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger_tipo TEXT NOT NULL CHECK (trigger_tipo IN ('alta', 'abandono')),
  programada_para TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '15 days'),
  enviada BOOLEAN NOT NULL DEFAULT false,
  intentos INTEGER NOT NULL DEFAULT 0,
  ultimo_error TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cola_envios_pendientes
  ON public.cola_envios_encuesta (programada_para, enviada)
  WHERE enviada = false;

CREATE INDEX IF NOT EXISTS idx_cola_envios_folio
  ON public.cola_envios_encuesta (folio);

ALTER TABLE public.cola_envios_encuesta ENABLE ROW LEVEL SECURITY;

-- Solo service_role (Edge Functions) puede insertar/actualizar la cola.
-- Estudiantes y psicólogos no leen esta tabla (datos operativos internos).
REVOKE ALL ON public.cola_envios_encuesta FROM anon, authenticated;

-- Trigger updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at_cola()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_cola_updated_at ON public.cola_envios_encuesta;
CREATE TRIGGER trigger_cola_updated_at
  BEFORE UPDATE ON public.cola_envios_encuesta
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_cola();

-- ============================================================================
-- 1. Función detectora de 2 inasistencias consecutivas
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_detectar_dos_inasistencias()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_folio TEXT;
  v_ultima_estado TEXT;
  v_penultima_estado TEXT;
BEGIN
  -- Solo nos interesa cuando el estado pasa a 'no_asistio'
  IF NEW.estado <> 'no_asistio' OR OLD.estado = 'no_asistio' THEN
    RETURN NEW;
  END IF;

  SELECT user_id, folio INTO v_user_id, v_folio
  FROM public.solicitudes_cita
  WHERE id = NEW.id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Tomar las 2 últimas citas terminadas (no_asistio | completada | cancelada)
  -- del mismo estudiante, ordenadas por fecha/hora DESC.
  SELECT estado INTO v_ultima_estado
  FROM public.solicitudes_cita
  WHERE user_id = v_user_id
    AND estado IN ('no_asistio', 'completada', 'cancelada')
  ORDER BY fecha_cita DESC, hora_cita DESC
  LIMIT 1 OFFSET 0;

  SELECT estado INTO v_penultima_estado
  FROM public.solicitudes_cita
  WHERE user_id = v_user_id
    AND estado IN ('no_asistio', 'completada', 'cancelada')
  ORDER BY fecha_cita DESC, hora_cita DESC
  LIMIT 1 OFFSET 1;

  -- Si las 2 más recientes son 'no_asistio' => encolar encuesta abandono
  IF v_ultima_estado = 'no_asistio' AND v_penultima_estado = 'no_asistio' THEN
    INSERT INTO public.cola_envios_encuesta (folio, user_id, trigger_tipo, programada_para)
    VALUES (
      v_folio,
      v_user_id,
      'abandono',
      timezone('utc'::text, now()) + interval '15 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. Trigger AFTER UPDATE sobre solicitudes_cita
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_dos_inasistencias_consecutivas
  ON public.solicitudes_cita;

CREATE TRIGGER trigger_dos_inasistencias_consecutivas
  AFTER UPDATE OF estado ON public.solicitudes_cita
  FOR EACH ROW
  WHEN (NEW.estado = 'no_asistio' AND OLD.estado <> 'no_asistio')
  EXECUTE FUNCTION public.fn_detectar_dos_inasistencias();

-- ============================================================================
-- 3. Trigger complementario para cita completada -> encolar encuesta alta
--    (24 horas después)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_encolar_encuesta_alta()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_folio TEXT;
BEGIN
  IF NEW.estado <> 'completada' OR OLD.estado = 'completada' THEN
    RETURN NEW;
  END IF;

  SELECT user_id, folio INTO v_user_id, v_folio
  FROM public.solicitudes_cita
  WHERE id = NEW.id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.cola_envios_encuesta (folio, user_id, trigger_tipo, programada_para)
  VALUES (
    v_folio,
    v_user_id,
    'alta',
    timezone('utc'::text, now()) + interval '24 hours'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_encolar_encuesta_alta
  ON public.solicitudes_cita;

CREATE TRIGGER trigger_encolar_encuesta_alta
  AFTER UPDATE OF estado ON public.solicitudes_cita
  FOR EACH ROW
  WHEN (NEW.estado = 'completada' AND OLD.estado <> 'completada')
  EXECUTE FUNCTION public.fn_encolar_encuesta_alta();

-- ============================================================================
-- Verificación:
--   SELECT tgname, tgrelid::regclass, tgenabled
--   FROM pg_trigger
--   WHERE tgname LIKE 'trigger_%inasistencias%'
--      OR tgname LIKE 'trigger_encolar_encuesta_alta';
-- ============================================================================
