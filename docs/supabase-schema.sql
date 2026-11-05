-- ==============================================================================
-- EQUILIBRA TESH - Esquema de Base de Datos para Supabase
-- Proyecto: https://olnhxzsrhtnoyderzqce.supabase.co
-- ==============================================================================

-- 1. Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de perfiles de usuario (estudiante, psicólogo, directivo)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  matricula TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('estudiante', 'psicologo', 'directivo')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS para perfiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los psicólogos y directivos pueden ver perfiles de su campus"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('psicologo', 'directivo')
    )
  );

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Tabla de Check-ins Emocionales
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL,
  academic_load INTEGER NOT NULL CHECK (academic_load BETWEEN 1 AND 5),
  emotions TEXT[] DEFAULT '{}',
  risk_level TEXT NOT NULL CHECK (risk_level IN ('verde', 'amarillo', 'rojo')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS para check_ins
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estudiantes pueden registrar sus check-ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Estudiantes ven sus propios check-ins"
  ON public.check_ins FOR SELECT
  USING (student_id = auth.uid()::text OR student_id = 'demo-student-dess');

CREATE POLICY "Psicología tiene acceso a triaje de check-ins"
  ON public.check_ins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'psicologo'
    )
  );

-- 4. Tabla de Alertas Prioritarias (Nivel Rojo / Emergencia)
CREATE TABLE IF NOT EXISTS public.alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  atendida BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir inserción de alertas de emergencia"
  ON public.alertas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Personal de psicología atiende alertas"
  ON public.alertas FOR ALL
  USING (true);

-- 5. Tabla de Citas Psicológicas
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL,
  psychologist_name TEXT NOT NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('presencial', 'virtual')),
  status TEXT DEFAULT 'agendada' CHECK (status IN ('agendada', 'completada', 'cancelada')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven y gestionan sus citas"
  ON public.appointments FOR ALL
  USING (true);

-- 6. Tabla de Expedientes Clínicos
CREATE TABLE IF NOT EXISTS public.expedientes_clinicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio TEXT NOT NULL,
  psicologo_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campos_clinicos JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT expedientes_clinicos_folio_psicologo_unique UNIQUE (folio, psicologo_id)
);

ALTER TABLE public.expedientes_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psicólogo puede ver sus propios expedientes"
  ON public.expedientes_clinicos FOR SELECT
  TO authenticated
  USING (psicologo_id = auth.uid());

CREATE POLICY "Psicólogo puede registrar expedientes"
  ON public.expedientes_clinicos FOR INSERT
  TO authenticated
  WITH CHECK (psicologo_id = auth.uid());

CREATE POLICY "Psicólogo puede actualizar sus expedientes"
  ON public.expedientes_clinicos FOR UPDATE
  TO authenticated
  USING (psicologo_id = auth.uid())
  WITH CHECK (psicologo_id = auth.uid());

-- 7. Tabla de Solicitudes de Citas Presenciales (PB-009)
CREATE TABLE IF NOT EXISTS public.solicitudes_cita (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  psicologo_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  fecha_cita DATE NOT NULL,
  hora_cita TIME NOT NULL,
  modalidad TEXT NOT NULL DEFAULT 'presencial' CHECK (modalidad = 'presencial'),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (
    estado IN ('pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio')
  ),
  motivo TEXT CHECK (motivo IS NULL OR char_length(motivo) <= 200),
  cancelado_por TEXT CHECK (
    cancelado_por IS NULL OR cancelado_por IN ('estudiante', 'psicologo', 'sistema')
  ),
  motivo_cancelacion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.solicitudes_cita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estudiante puede ver sus propias solicitudes"
  ON public.solicitudes_cita FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Estudiante puede registrar solicitud"
  ON public.solicitudes_cita FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND modalidad = 'presencial' AND estado = 'pendiente');

CREATE POLICY "Estudiante puede cancelar con +2h de anticipacion"
  ON public.solicitudes_cita FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND estado IN ('pendiente', 'confirmada'))
  WITH CHECK (user_id = auth.uid() AND estado = 'cancelada' AND cancelado_por = 'estudiante');

CREATE POLICY "Psicólogo puede ver solicitudes de pacientes"
  ON public.solicitudes_cita FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('psicologo', 'directivo')
    )
  );

CREATE POLICY "Psicólogo gestiona estado de citas"
  ON public.solicitudes_cita FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'psicologo'
    )
  );

-- ==============================================================================
-- 7. PB-021: Encuesta de Satisfacción (20 campos reglamentarios y RLS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.respuestas_encuesta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger_tipo TEXT NOT NULL CHECK (trigger_tipo IN ('alta', 'abandono')),
  trigger_fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  enviada_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  respondida_en TIMESTAMPTZ,
  q1_satisfaccion INTEGER CHECK (q1_satisfaccion BETWEEN 1 AND 5),
  q2_escuchado INTEGER CHECK (q2_escuchado BETWEEN 1 AND 5),
  q3_claridad INTEGER CHECK (q3_claridad BETWEEN 1 AND 5),
  q4_respeto INTEGER CHECK (q4_respeto BETWEEN 1 AND 5),
  q5_tiempo_espera INTEGER CHECK (q5_tiempo_espera BETWEEN 1 AND 5),
  q6_utilidad INTEGER CHECK (q6_utilidad BETWEEN 1 AND 5),
  q7_mejoria INTEGER CHECK (q7_mejoria BETWEEN 1 AND 5),
  q8_recomendar INTEGER CHECK (q8_recomendar BETWEEN 1 AND 5),
  q9_comentarios TEXT,
  q10a_facilidad_eli INTEGER CHECK (q10a_facilidad_eli BETWEEN 1 AND 5),
  q10b_util_eli INTEGER CHECK (q10b_util_eli BETWEEN 1 AND 5),
  hash_auditoria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_respuestas_encuesta_folio ON public.respuestas_encuesta(folio);
CREATE INDEX IF NOT EXISTS idx_respuestas_encuesta_trigger ON public.respuestas_encuesta(trigger_tipo);
CREATE INDEX IF NOT EXISTS idx_respuestas_encuesta_respondida ON public.respuestas_encuesta(respondida_en);

ALTER TABLE public.respuestas_encuesta ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Psicólogos y directivos ven resultados de encuestas"
  ON public.respuestas_encuesta FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('psicologo', 'directivo')
    )
  );



