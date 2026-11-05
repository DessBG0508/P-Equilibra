-- ============================================================================
-- Equilibra TESH — Patch P0 #2: Fix RLS holes críticos de auditoría
-- ----------------------------------------------------------------------------
-- Ejecutar en Supabase SQL Editor (o como migración).
-- Cierra los 4 huecos críticos + 3 policies demasiado permisivas detectados
-- en la auditoría de seguridad del Sprint 4.
--
-- Tablas afectadas:
--   1. alertas               — `FOR ALL USING (true)` (cualquiera ve/edita/borra)
--   2. appointments          — `FOR ALL USING (true)` (cualquiera ve/edita/borra)
--   3. check_ins             — `INSERT WITH CHECK (true)` (impersonación)
--   4. bloques_auditoria     — `TO authenticated, anon USING (true)` (anon lee)
--   5. solicitudes_cita      — psicólogo ve TODAS las citas (falta psicologo_id)
--   6. respuestas_encuesta   — `OR user_id IS NULL` (inyección de encuestas)
--   7. profiles              — UPDATE sin WITH CHECK (escala de privilegios)
-- ============================================================================

-- ============================================================================
-- 1. alertas — restringir a estudiante (propias) + psicólogo/directivo (todas)
-- ============================================================================
DROP POLICY IF EXISTS "Personal de psicología atiende alertas" ON public.alertas;

CREATE POLICY "Estudiante ve sus alertas"
  ON public.alertas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Psicólogo/directivo gestiona alertas"
  ON public.alertas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('psicologo', 'directivo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('psicologo', 'directivo')
    )
  );

-- ============================================================================
-- 2. appointments — estudiante ve solo sus citas; psicólogo solo las asignadas
-- ============================================================================
DROP POLICY IF EXISTS "Usuarios ven y gestionan sus citas" ON public.appointments;

CREATE POLICY "Estudiante ve sus citas"
  ON public.appointments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Psicólogo ve sus citas asignadas"
  ON public.appointments
  FOR SELECT TO authenticated
  USING (
    psicologo_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'directivo'
    )
  );

CREATE POLICY "Psicólogo actualiza sus citas asignadas"
  ON public.appointments
  FOR UPDATE TO authenticated
  USING (psicologo_id = auth.uid())
  WITH CHECK (psicologo_id = auth.uid());

-- ============================================================================
-- 3. check_ins — quitar WITH CHECK (true) para evitar impersonación
-- ============================================================================
DROP POLICY IF EXISTS "Estudiante registra check_ins" ON public.check_ins;
DROP POLICY IF EXISTS "Estudiante ve sus check_ins" ON public.check_ins;

CREATE POLICY "Estudiante registra sus check_ins"
  ON public.check_ins
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid()::text);

CREATE POLICY "Estudiante ve sus check_ins"
  ON public.check_ins
  FOR SELECT TO authenticated
  USING (student_id = auth.uid()::text);

CREATE POLICY "Psicólogo/directivo ve check_ins agregados"
  ON public.check_ins
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('psicologo', 'directivo')
    )
  );

-- ============================================================================
-- 4. bloques_auditoria — quitar acceso anónimo
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

-- ============================================================================
-- 5. solicitudes_cita — psicólogo solo ve/edita SUS citas (psicologo_id)
-- ============================================================================
DROP POLICY IF EXISTS "Psicólogo puede ver solicitudes de pacientes"
  ON public.solicitudes_cita;
DROP POLICY IF EXISTS "Psicólogo gestiona estado de citas"
  ON public.solicitudes_cita;

CREATE POLICY "Psicólogo ve sus solicitudes asignadas"
  ON public.solicitudes_cita
  FOR SELECT TO authenticated
  USING (
    psicologo_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'directivo'
    )
  );

CREATE POLICY "Psicólogo actualiza estado de sus citas"
  ON public.solicitudes_cita
  FOR UPDATE TO authenticated
  USING (psicologo_id = auth.uid())
  WITH CHECK (psicologo_id = auth.uid());

-- ============================================================================
-- 6. respuestas_encuesta — eliminar OR user_id IS NULL (inyección de encuestas)
-- ============================================================================
DROP POLICY IF EXISTS "Estudiante puede registrar o actualizar su encuesta"
  ON public.respuestas_encuesta;
DROP POLICY IF EXISTS "Estudiante puede responder su encuesta pendiente"
  ON public.respuestas_encuesta;

CREATE POLICY "Estudiante registra su encuesta"
  ON public.respuestas_encuesta
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Estudiante responde su encuesta"
  ON public.respuestas_encuesta
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 7. profiles — WITH CHECK en UPDATE para evitar escala de privilegios
-- ============================================================================
DROP POLICY IF EXISTS "Usuario actualiza su perfil" ON public.profiles;

CREATE POLICY "Usuario actualiza su perfil"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role IN ('estudiante', 'psicologo', 'directivo')
  );

-- ============================================================================
-- Verificación post-migración:
--   SELECT tablename, policyname, cmd, roles, qual
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
-- ============================================================================
