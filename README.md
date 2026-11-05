# Equilibra TESH — Plataforma de Apoyo Psicológico Universitario

![CI](https://github.com/DessBG0508/prueba/actions/workflows/ci.yml/badge.svg)

Sistema integral de salud mental y bienestar emocional desarrollado para la comunidad estudiantil del **Tecnológico de Estudios Superiores de Huixquilucan (TESH)**.

---

## Objetivo del Proyecto

Brindar un entorno seguro, confidencial y accesible para la detección temprana, acompañamiento emocional y canalización profesional de los estudiantes del TESH, garantizando atención presencial oportuna y protocolos de contención ante situaciones de crisis.

---

## Módulos Principales

### 1. Portal del Estudiante

- **Check-in Emocional Semanal:** Registro periódico del estado de ánimo y niveles de carga académica para monitorear tendencias de bienestar.
- **Citas de Orientación Presencial:** Solicitud y gestión de sesiones presenciales con los psicólogos del campus universitario.
- **Herramientas de Autorregulación:** Ejercicios interactivos de respiración guiada (técnica 4-7-8) y recursos psicoeducativos de autocuidado.
- **Botón SOS Permanente:** Acceso inmediato a líneas de emergencia nacionales (Línea de la Vida 800 911 2000, SAPTEL 800 472 7835 y Emergencias 911).

### 2. Eli — Asistente de Tamizaje Clínico

- Aplicación sistemática y confidencial de cuestionarios estandarizados de salud mental:
  - **GAD-7:** Evaluación de sintomatología ansiosa.
  - **PHQ-9:** Detección de sintomatología depresiva.
- **Regla de Crisis Prioritaria:** Detección automatizada de respuestas de riesgo en el ítem 9 con canalización inmediata a servicios de urgencia y notificación para revisión profesional.

### 3. Portal de Psicología y Orientación

- **Agenda Clínica:** Gestión integral de citas presenciales programadas e historial de atención.
- **Expedientes de Estudiantes:** Registro seguro de notas de evolución, escalas de riesgo y seguimiento continuo.
- **Atención de Alertas:** Bandeja prioritaria para estudiantes con alertas rojas o tamizajes de alto riesgo.

### 4. Coordinación y Dirección

- **Auditoría e Indicadores:** Estadísticas agregadas y anónimas del estado de salud mental de la comunidad estudiantil para la toma de decisiones institucionales.

---

## Stack Tecnológico

- **Frontend:** React 19, TypeScript, TanStack Start, TanStack Router.
- **Estilos e Interfaz:** Tailwind CSS, Radix UI, Lucide Icons, Framer Motion.
- **Persistencia y Autenticación:** Supabase (Auth con recuperación segura por correo, PostgreSQL y políticas Row Level Security).
- **Herramientas de Desarrollo:** Vite, ESLint, Prettier.

---

## Instalación y Desarrollo Local

### Prerrequisitos

- Node.js (versión 18 o superior recomendada)
- npm o bun

### Pasos

1. **Clonar el repositorio:**

   ```bash
   git clone <url-del-repositorio>
   cd equilibra-tesh
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crear un archivo `.env` basado en `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

4. **Iniciar el servidor de desarrollo:**

   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000`.

5. **Construir para producción:**
   ```bash
   npm run build
   ```

---

## Privacidad y Ética

Todos los datos recabados en los cuestionarios y sesiones se manejan con estricta confidencialidad clínica y apego a las normas de protección de datos institucionales.
