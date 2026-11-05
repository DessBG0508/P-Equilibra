// Tipos para el Expediente Clínico de Equilibra TESH (Diseño Canva 5 páginas)

export interface AntecedentesData {
  tratamiento_psicologico_previo: boolean;
  hospitalizaciones: boolean;
  seguimiento_psiquiatrico: boolean;
  antecedentes_familiares: boolean;
  medicacion_actual: boolean;
  enfermedad_medica_relevante: boolean;
  detalle_antecedentes: string;
}

export interface ContextoPsicosocialData {
  carrera_semestre?: string;
  grupo?: string;
  convivencia: string;
  situacion_laboral: string;
  red_apoyo: string;
  factores_estres: string;
}

export interface EstadoMentalData {
  aspecto_cuidado: boolean;
  orientado: boolean;
  contacto_adecuado: boolean;
  discurso_coherente: boolean;
  animo_bajo: boolean;
  ansiedad_manifiesta: boolean;
  enlentecimiento: boolean;
  inquietud_psicomotriz: boolean;
  sueno_alterado: boolean;
  pensamiento_perseverante: boolean;
  afecto_congruente: boolean;
  juicio_conservado: boolean;
  observaciones: string;
}

export interface MarcadoresRiesgoData {
  ideacion_autolitica: boolean;
  plan_estructurado: boolean;
  intentos_previos: boolean;
  autolesiones: boolean;
  consumo_sustancias: boolean;
  riesgo_terceros: boolean;
}

export interface ValoracionRiesgoData {
  item9_valor: number;
  item9_texto: string;
  marcadores: MarcadoresRiesgoData;
  riesgo_estimado: number; // 0 a 10
  factores_proteccion: string;
}

export interface ObjetivosSesionData {
  consentimiento_firmado: boolean;
  frecuencia_acordada: string;
  proxima_cita: string;
  estado_bloqueo: "bloqueado" | "liberado";
  notas_libres: string;
}

export interface TrazabilidadData {
  hash_expediente: string;
  hash_previo: string;
  anclado_en: string;
  liberado_por: string;
}

export interface CamposClinicos {
  // 01 Identificación
  iniciales?: string;
  edad?: number | string;
  sexo?: string;
  semestre?: string;
  carrera?: string;
  grupo?: string;
  derivado_por?: string;

  // 02 Motivo de consulta
  motivo_en_palabras: string;

  // 03 Historia del problema
  historia_clinica: string;

  // 04 Antecedentes
  antecedentes: AntecedentesData;

  // 05 Contexto psicosocial
  contexto_psicosocial: ContextoPsicosocialData;

  // 06 Exploración del estado mental (12 checkboxes)
  estado_mental: EstadoMentalData;

  // 07 Valoración de riesgo
  valoracion_riesgo: ValoracionRiesgoData;

  // 08 Hipótesis de trabajo
  hipotesis_trabajo: string;

  // 09 Objetivos iniciales y próxima sesión
  objetivos_sesion: ObjetivosSesionData;

  // 10 Trazabilidad blockchain
  trazabilidad: TrazabilidadData;
}

export interface ExpedienteDbRecord {
  id?: string;
  folio: string;
  psicologo_id: string;
  campos_clinicos: CamposClinicos;
  created_at?: string;
  updated_at?: string;
}

export type BadgeType = "AUTOMÁTICO" | "MIXTO" | "PSICÓLOGO";
