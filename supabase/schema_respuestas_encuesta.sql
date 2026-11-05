-- ==============================================================================
-- PB-021: TABLA RESPUESTAS_ENCUESTA (EQUILIBRA TESH)
-- 20 campos reglamentarios según especificación clínica y acuerdos MIN-008
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.respuestas_encuesta (
  -- 1. Identificador único
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 2. Identificación del paciente (MIN-008: NO anónima, identificada por folio)
  folio TEXT NOT NULL,

  -- 3. Referencia a la cuenta de usuario del estudiante (opcional si es pre-alta o enlace directo)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 4. Disparador institucional ('alta' = 24h tras completar | 'abandono' = 15 días tras 2 inasistencias)
  trigger_tipo TEXT NOT NULL CHECK (trigger_tipo IN ('alta', 'abandono')),

  -- 5. Fecha en que ocurrió el evento disparador
  trigger_fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- 6. Fecha de envío de la notificación por correo (Resend SMTP)
  enviada_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- 7. Fecha en que el estudiante completó la encuesta (NULL si aún está pendiente)
  respondida_en TIMESTAMPTZ,

  -- Reactivos Clínicos y de Calidad Institucional (Escala Likert 1 a 5)
  -- 8. Q1: Nivel de satisfacción general
  q1_satisfaccion INTEGER CHECK (q1_satisfaccion BETWEEN 1 AND 5),

  -- 9. Q2: Sentirse escuchado(a), comprendido(a) y validado(a)
  q2_escuchado INTEGER CHECK (q2_escuchado BETWEEN 1 AND 5),

  -- 10. Q3: Claridad de las explicaciones y metas acordadas
  q3_claridad INTEGER CHECK (q3_claridad BETWEEN 1 AND 5),

  -- 11. Q4: Trato respetuoso, ético y resguardo de confidencialidad
  q4_respeto INTEGER CHECK (q4_respeto BETWEEN 1 AND 5),

  -- 12. Q5: Puntualidad y condiciones del consultorio
  q5_tiempo_espera INTEGER CHECK (q5_tiempo_espera BETWEEN 1 AND 5),

  -- 13. Q6: Utilidad práctica de herramientas y tareas asignadas
  q6_utilidad INTEGER CHECK (q6_utilidad BETWEEN 1 AND 5),

  -- 14. Q7: Percepción de mejoría en estado de ánimo y bienestar
  q7_mejoria INTEGER CHECK (q7_mejoria BETWEEN 1 AND 5),

  -- 15. Q8: Probabilidad de recomendar el servicio a otro estudiante
  q8_recomendar INTEGER CHECK (q8_recomendar BETWEEN 1 AND 5),

  -- 16. Q9: Comentarios libres, sugerencias o agradecimientos
  q9_comentarios TEXT,

  -- Reactivos sobre la Asistente Virtual de Tamizaje (Eli)
  -- 17. Q10.A: Experiencia y comodidad al contestar el tamizaje inicial con Eli
  q10a_facilidad_eli INTEGER CHECK (q10a_facilidad_eli BETWEEN 1 AND 5),

  -- 18. Q10.B: Utilidad de la orientación previa de Eli para recibir atención oportuna
  q10b_util_eli INTEGER CHECK (q10b_util_eli BETWEEN 1 AND 5),

  -- 19. Hash criptográfico SHA-256 para auditoría e inmutabilidad blockchain
  hash_auditoria TEXT,

  -- 20. Auditoría de creación en base de datos
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de consulta frecuente para el dashboard del psicólogo y estudiante
CREATE INDEX IF NOT EXISTS idx_respuestas_encuesta_folio ON public.respuestas_encuesta(folio);
CREATE INDEX IF NOT EXISTS idx_respuestas_encuesta_trigger ON public.respuestas_encuesta(trigger_tipo);
CREATE INDEX IF NOT EXISTS idx_respuestas_encuesta_respondida ON public.respuestas_encuesta(respondida_en);

-- ==============================================================================
-- POLÍTICAS RLS (Row Level Security) - RNF01 / Privacidad
-- ==============================================================================
ALTER TABLE public.respuestas_encuesta ENABLE ROW LEVEL SECURITY;

-- 1. El estudiante solo puede ver y completar sus propias respuestas
CREATE POLICY "Estudiante puede ver su propia encuesta"
  ON public.respuestas_encuesta FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    folio IN (
      SELECT folio FROM public.respuestas_tamizaje WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Estudiante puede registrar o actualizar su encuesta"
  ON public.respuestas_encuesta FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

CREATE POLICY "Estudiante puede responder su encuesta pendiente"
  ON public.respuestas_encuesta FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    folio IN (
      SELECT folio FROM public.respuestas_tamizaje WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

-- 2. El psicólogo y directivos pueden ver todas las encuestas de sus pacientes
CREATE POLICY "Psicólogos y directivos ven resultados de encuestas"
  ON public.respuestas_encuesta FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('psicologo', 'directivo')
    )
  );

-- 3. Bloquear acceso a usuarios no autenticados (anon)
-- (Al habilitar RLS sin políticas para anon, el acceso no autenticado queda revocado por defecto)
