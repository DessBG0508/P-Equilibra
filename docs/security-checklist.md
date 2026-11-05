# Lista de Verificación y Plan de Seguridad Backend / Supabase

**Proyecto:** Equilibra TESH  
**Capa:** Backend, Base de Datos (PostgreSQL / Supabase), APIs y Modelo de IA  
**Fecha de Auditoría Inicial:** Septiembre 2026  
**Estado:** Documentado para ejecución en fases de Backend

---

## Resumen Ejecutivo

Este documento define la matriz de controles de seguridad requeridos para la fase de migración desde el `DEMO_MODE` hacia la infraestructura persistente con **Supabase**, **PostgreSQL** y servicios de backend. Dado que Equilibra TESH gestiona datos sensibles de salud mental y acompañamiento estudiantil, el cumplimiento de principios de mínimo privilegio, confidencialidad estricta y trazabilidad es mandatorio.

---

## Matriz de Pendientes de Seguridad

| ID         | Control de Seguridad                               | Responsable                                  | Sprint Planificado               | Prioridad | Estado            |
| ---------- | -------------------------------------------------- | -------------------------------------------- | -------------------------------- | --------- | ----------------- |
| **SEC-01** | Row Level Security (RLS) por Rol                   | Ing. Backend / DBA Supabase                  | Sprint 4 (Infraestructura & BD)  | Crítica   | Pendiente Backend |
| **SEC-02** | Cifrado en Reposo de Datos Sensibles               | Arquitecto Cloud / Especialista en Seguridad | Sprint 4 (Infraestructura & BD)  | Crítica   | Pendiente Backend |
| **SEC-03** | Validación de Servidor y Bloqueo de Campos         | Ing. Backend (Edge Functions)                | Sprint 4 (Infraestructura & BD)  | Alta      | Pendiente Backend |
| **SEC-04** | Límites de Tasa de Respuestas (Rate Limiting)      | Ing. DevOps / Backend                        | Sprint 5 (Servicios & APIs)      | Alta      | Pendiente Backend |
| **SEC-05** | Protección Anti-Bots y Fuerza Bruta                | Ing. Frontend & Backend                      | Sprint 5 (Servicios & APIs)      | Media     | Pendiente Backend |
| **SEC-06** | Monitoreo de Consultas y Auditoría de Accesos      | Especialista en Ciberseguridad / Compliance  | Sprint 6 (Auditoría & Hardening) | Alta      | Pendiente Backend |
| **SEC-07** | Restricción y Sanitización de Archivos             | Ing. Backend (Storage)                       | Sprint 5 (Servicios & APIs)      | Media     | Pendiente Backend |
| **SEC-08** | Cookies Seguras (`httpOnly`, `Secure`, `SameSite`) | Ing. Full-stack                              | Sprint 4 (Infraestructura & BD)  | Alta      | Pendiente Backend |
| **SEC-09** | Guardarraíles de IA y Prevención de Inyección      | Ing. de IA / Prompt Engineer                 | Sprint 5 (Servicios & APIs)      | Crítica   | Pendiente Backend |

---

## Detalle Técnico de Controles Pendientes

### 1. RLS por Rol (Row Level Security en PostgreSQL)

- **Riesgo:** Fuga de historiales emocionales, notas clínicas o check-ins entre estudiantes o a usuarios no autorizados.
- **Implementación:**
  - Habilitar `ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;`, `citas`, `profiles`, `alertas`.
  - Política para estudiantes: `auth.uid() = user_id`.
  - Política para psicólogos: Lectura de alertas prioritarias y citas asignadas con rol verificado en JWT claims (`(auth.jwt() ->> 'role') = 'psicologo'`).
  - Validación de consentimiento: acceso a tamizajes de estudiantes condicionado a `modo_acompanamiento = true`.
- **Responsable:** Ing. Backend / DBA Supabase.
- **Sprint:** Sprint 4.

### 2. Cifrado en Reposo de Datos Clínicos y Sensibles

- **Riesgo:** Exposición de diagnósticos, puntuaciones PHQ-9/GAD-7 o notas confidenciales ante incidentes en almacenamiento.
- **Implementación:**
  - Cifrado a nivel de base de datos con AES-256 (TDE nativo en Supabase/Postgres).
  - Cifrado a nivel de columna (pgcrypto) o claves administradas en GCP Cloud KMS / Vault para campos de texto libre como notas de sesión y bitácoras del psicólogo.
- **Responsable:** Arquitecto Cloud / Especialista en Seguridad.
- **Sprint:** Sprint 4.

### 3. Validación de Servidor y Bloqueo de Manipulación de Campos

- **Riesgo:** Inyección de parámetros (ej. auto-asignarse rol de `'psicologo'`, modificar fechas pasadas de citas o alterar semáforos de riesgo).
- **Implementación:**
  - Esquemas de validación Zod en Supabase Edge Functions / Deno.
  - Bloqueo en PostgreSQL mediante `BEFORE INSERT OR UPDATE` triggers que impidan que un estudiante altere `role`, `status` de alerta o `matricula`.
  - Descarte estricto de campos no declarados en el payload (_whitelist validation_).
- **Responsable:** Ing. Backend (Edge Functions).
- **Sprint:** Sprint 4.

### 4. Límites de Tasa de Respuestas en API (Rate Limiting en Servidor)

- **Riesgo:** Ataques de denegación de servicio (DoS), saturación de peticiones al bot conversacional o raspado masivo de datos.
- **Implementación:**
  - Rate limiting centralizado en Edge Middleware con Redis / Upstash.
  - Límites diferenciados:
    - `/auth/v1/token`: 5 peticiones por minuto por IP.
    - `/api/chat/eli`: 15 mensajes por minuto por usuario autenticado.
    - Endpoints de consulta general: 100 peticiones por minuto por IP.
- **Responsable:** Ing. DevOps / Backend.
- **Sprint:** Sprint 5.

### 5. Protección Anti-Bots y Prevención de Fuerza Bruta

- **Riesgo:** Creación automatizada de cuentas espuria, relleno de credenciales (_credential stuffing_) en login.
- **Implementación:**
  - Integración de **Cloudflare Turnstile** o Google reCAPTCHA v3 en los flujos de registro y login.
  - Bloqueo progresivo por IP y cuenta en Supabase Auth (`rate_limit.email_sent`, `rate_limit.verify`).
- **Responsable:** Ing. Frontend & Backend.
- **Sprint:** Sprint 5.

### 6. Monitoreo de Consultas y Auditoría de Accesos

- **Riesgo:** Consultas no autorizadas a expedientes de estudiantes sin justificación clínica o trazabilidad.
- **Implementación:**
  - Tabla inmutable de auditoría `audit_logs` con triggers para operaciones `SELECT` sensibles y modificaciones sobre `alertas` y `citas`.
  - Registro de `timestamp`, `psychologist_id`, `student_id`, `action`, `ip_address` y `user_agent`.
  - Alertas automáticas en Datadog / GCP Cloud Monitoring ante picos anómalos de lectura de expedientes.
- **Responsable:** Especialista en Ciberseguridad / Compliance.
- **Sprint:** Sprint 6.

### 7. Restricción y Sanitización de Subida de Archivos

- **Riesgo:** Carga de scripts maliciosos, binarios ejecutables o archivos que sobrepasen el almacenamiento en Supabase Storage.
- **Implementación:**
  - Restricción estricta de extensiones y validación de cabeceras mágicas (MIME-type real): solo `.pdf`, `.jpg`, `.png`.
  - Límite de tamaño máximo a 5 MB por archivo.
  - Escaneo automático antivirus en tránsito con ClamAV en Cloud Functions antes de publicar el asset en buckets privados.
- **Responsable:** Ing. Backend (Storage).
- **Sprint:** Sprint 5.

### 8. Protección de Cookies Seguras (`httpOnly`, `Secure`, `SameSite`)

- **Riesgo:** Robo de tokens de sesión JWT mediante ataques XSS en cliente si se almacenaran en `localStorage`.
- **Implementación:**
  - Configuración de `supabase.auth` para almacenamiento de tokens de sesión (Refresh Token y Access Token) en cookies `httpOnly`, con flags `Secure` (exclusivo HTTPS) y `SameSite=Strict`.
  - Rotación automática de tokens de refresco (_Refresh Token Rotation_).
- **Responsable:** Ing. Full-stack.
- **Sprint:** Sprint 4.

### 9. Guardarraíles de IA y Prevención de Inyección de Prompts

- **Riesgo:** Ataques de _jailbreak_, inyección de instrucciones para eludir el protocolo de crisis o extracción del prompt de sistema del bot Eli.
- **Implementación:**
  - Capa intermediaria en servidor con validación semántica de entradas y clasificador de seguridad (Gemini Safety Settings).
  - Aislamiento estricto del contexto clínico: el modelo nunca recibe credenciales ni datos personales no anonimizados.
  - Detección determinista en servidor de palabras clave de autolesión como respaldo inmutable antes de invocar al LLM.
- **Responsable:** Ing. de IA / Prompt Engineer.
- **Sprint:** Sprint 5.
