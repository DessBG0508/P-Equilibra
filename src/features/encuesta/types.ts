/**
 * PB-021: Encuesta de Satisfacción del Servicio de Apoyo Psicológico
 * Equilibra TESH - Sistema de Tamizaje y Salud Mental
 *
 * NOTA DE SEGURIDAD Y NORMATIVA INSTITUCIONAL:
 * - Respuestas identificadas por FOLIO (confirmado acuerdo MIN-008, NO es anónima).
 * - Disparadores autorizados:
 *   · Alta clínica: cita completada -> envío en 24h
 *   · Abandono: 2 inasistencias consecutivas 'no_asistio' -> ventana de 15 días
 *   · Sin ventanas de 30/60/90 días.
 */

export type TriggerEncuestaTipo = "alta" | "abandono";

export interface RespuestaEncuesta {
  id: string;
  folio: string;
  user_id?: string | null;
  trigger_tipo: TriggerEncuestaTipo;
  trigger_fecha: string;
  enviada_en: string;
  respondida_en?: string | null;

  // Reactivos clínicos y de calidad institucional (1 a 5)
  q1_satisfaccion: number; // Nivel de satisfacción general
  q2_escuchado: number; // Sentirse escuchado y comprendido
  q3_claridad: number; // Claridad de las explicaciones y acuerdos
  q4_respeto: number; // Trato respetuoso y resguardo de confidencialidad
  q5_tiempo_espera: number; // Puntualidad y disponibilidad de horarios
  q6_utilidad: number; // Utilidad de las herramientas prácticas
  q7_mejoria: number; // Percepción de mejora en estado de ánimo/bienestar
  q8_recomendar: number; // Probabilidad de recomendar a otro estudiante

  // Campo de texto libre
  q9_comentarios?: string | null;

  // Reactivos sobre la Asistente Virtual de Tamizaje (Eli)
  q10a_facilidad_eli: number; // Experiencia y comodidad respondiendo el tamizaje
  q10b_util_eli: number; // Utilidad de la orientación previa de Eli

  // Integridad y trazabilidad blockchain
  hash_auditoria: string;
  created_at: string;
}

export interface MetricasEncuesta {
  totalEncuestas: number;
  totalRespondidas: number;
  tasaRespuesta: number; // Porcentaje
  promedioGeneral: number; // Sobre 5.0
  npsScore: number; // % promotores (4-5) - % detractores (1-2)
  promedioEli: number; // Promedio combinado Q10a y Q10b

  // Por disparador
  totalAltas: number;
  totalAbandonos: number;
  promedioAltas: number;
  promedioAbandonos: number;

  // Promedios por reactivo para gráfica de barras
  promediosPorReactivo: {
    clave: string;
    label: string;
    promedio: number;
    categoria: "general" | "psicologo" | "servicio" | "eli";
  }[];

  // Distribución de satisfacción para gráfica Donut
  distribucionSatisfaccion: {
    nombre: string;
    cantidad: number;
    color: string;
  }[];

  // Distribución por disparador para gráfica Donut alternativa
  distribucionTriggers: {
    nombre: string;
    cantidad: number;
    color: string;
  }[];
}

export interface ItemPreguntaConfig {
  id: keyof Omit<
    RespuestaEncuesta,
    | "id"
    | "folio"
    | "user_id"
    | "trigger_tipo"
    | "trigger_fecha"
    | "enviada_en"
    | "respondida_en"
    | "hash_auditoria"
    | "created_at"
    | "q9_comentarios"
  >;
  numero: string;
  titulo: string;
  descripcion: string;
  escala: {
    valor: number;
    etiqueta: string;
    icono?: string;
  }[];
}

export const ESCALA_LIKERT_5_ESTRELLAS = [
  { valor: 1, etiqueta: "Muy deficiente" },
  { valor: 2, etiqueta: "Regular" },
  { valor: 3, etiqueta: "Aceptable" },
  { valor: 4, etiqueta: "Bueno" },
  { valor: 5, etiqueta: "Excelente" },
];

export const ESCALA_ACUERDO_5 = [
  { valor: 1, etiqueta: "Totalmente en desacuerdo" },
  { valor: 2, etiqueta: "En desacuerdo" },
  { valor: 3, etiqueta: "Neutral" },
  { valor: 4, etiqueta: "De acuerdo" },
  { valor: 5, etiqueta: "Totalmente de acuerdo" },
];

export const PREGUNTAS_ENCUESTA: ItemPreguntaConfig[] = [
  {
    id: "q1_satisfaccion",
    numero: "1",
    titulo: "Satisfacción General con el Servicio",
    descripcion:
      "¿Cuál es tu nivel de satisfacción general con el apoyo psicológico y acompañamiento recibido en Equilibra TESH?",
    escala: ESCALA_LIKERT_5_ESTRELLAS,
  },
  {
    id: "q2_escuchado",
    numero: "2",
    titulo: "Escucha Activa y Validación Emocional",
    descripcion:
      "¿Te sentiste escuchado(a), comprendido(a) y sin juicios por parte del/la profesional que te atendió?",
    escala: [
      { valor: 1, etiqueta: "Nunca" },
      { valor: 2, etiqueta: "Rara vez" },
      { valor: 3, etiqueta: "A veces" },
      { valor: 4, etiqueta: "Casi siempre" },
      { valor: 5, etiqueta: "Siempre" },
    ],
  },
  {
    id: "q3_claridad",
    numero: "3",
    titulo: "Claridad de Explicaciones y Metas",
    descripcion:
      "¿Las reflexiones, acuerdos y recomendaciones compartidas durante tus sesiones fueron claras y comprensibles?",
    escala: [
      { valor: 1, etiqueta: "Muy confusas" },
      { valor: 2, etiqueta: "Poco claras" },
      { valor: 3, etiqueta: "Aceptables" },
      { valor: 4, etiqueta: "Claras" },
      { valor: 5, etiqueta: "Muy claras" },
    ],
  },
  {
    id: "q4_respeto",
    numero: "4",
    titulo: "Respeto, Ética y Confidencialidad",
    descripcion:
      "¿El trato del personal fue respetuoso, ético y sentiste que tu privacidad estuvo 100% protegida?",
    escala: ESCALA_ACUERDO_5,
  },
  {
    id: "q5_tiempo_espera",
    numero: "5",
    titulo: "Puntualidad e Instalaciones",
    descripcion:
      "¿Cómo calificas la puntualidad en el inicio de tus sesiones y el espacio físico del consultorio?",
    escala: ESCALA_LIKERT_5_ESTRELLAS,
  },
  {
    id: "q6_utilidad",
    numero: "6",
    titulo: "Utilidad de Estrategias y Tareas",
    descripcion:
      "¿Qué tan aplicables y útiles te resultaron las herramientas prácticas brindadas para tu vida diaria o académica?",
    escala: [
      { valor: 1, etiqueta: "Nada útiles" },
      { valor: 2, etiqueta: "Poco útiles" },
      { valor: 3, etiqueta: "Moderadamente útiles" },
      { valor: 4, etiqueta: "Útiles" },
      { valor: 5, etiqueta: "Muy útiles" },
    ],
  },
  {
    id: "q7_mejoria",
    numero: "7",
    titulo: "Percepción de Mejoría y Bienestar",
    descripcion:
      "¿En qué medida consideras que este proceso te ayudó a mejorar tu estabilidad emocional o resolver el motivo de consulta?",
    escala: [
      { valor: 1, etiqueta: "Sin cambios / Empeoró" },
      { valor: 2, etiqueta: "Leve mejoría" },
      { valor: 3, etiqueta: "Moderada mejoría" },
      { valor: 4, etiqueta: "Notable mejoría" },
      { valor: 5, etiqueta: "Gran mejoría" },
    ],
  },
  {
    id: "q8_recomendar",
    numero: "8",
    titulo: "Recomendación del Servicio",
    descripcion:
      "¿Recomendarías el servicio de apoyo psicológico de Equilibra TESH a un compañero o compañera que lo requiera?",
    escala: [
      { valor: 1, etiqueta: "Definitivamente no" },
      { valor: 2, etiqueta: "Probablemente no" },
      { valor: 3, etiqueta: "Tal vez" },
      { valor: 4, etiqueta: "Probablemente sí" },
      { valor: 5, etiqueta: "Definitivamente sí" },
    ],
  },
  {
    id: "q10a_facilidad_eli",
    numero: "10.A",
    titulo: "Experiencia con Eli (Asistente de Tamizaje)",
    descripcion:
      "¿Qué tan clara, rápida y cómoda te pareció la interacción inicial con Eli para contestar tus cuestionarios (GAD-7 / PHQ-9)?",
    escala: [
      { valor: 1, etiqueta: "Muy incómoda / confusa" },
      { valor: 2, etiqueta: "Poco cómoda" },
      { valor: 3, etiqueta: "Neutral" },
      { valor: 4, etiqueta: "Cómoda y ágil" },
      { valor: 5, etiqueta: "Excelente experiencia" },
    ],
  },
  {
    id: "q10b_util_eli",
    numero: "10.B",
    titulo: "Utilidad de la Orientación Previa de Eli",
    descripcion:
      "¿Consideras útil que Eli te haya canalizado con el área de psicología del TESH según tus respuestas de tamizaje?",
    escala: [
      { valor: 1, etiqueta: "Nada útil" },
      { valor: 2, etiqueta: "Poco útil" },
      { valor: 3, etiqueta: "Aceptable" },
      { valor: 4, etiqueta: "Útil" },
      { valor: 5, etiqueta: "Fundamental para buscar ayuda" },
    ],
  },
];
