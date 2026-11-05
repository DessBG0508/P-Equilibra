export type MetricType = "sueno" | "estres" | "energia" | "animo";

export type MetricLevel =
  "bajo" | "optimo" | "revisar" | "alto" | "baja" | "requiere apoyo" | "neutro";

export interface MetricSuggestion {
  id: string;
  metric: MetricType;
  level: MetricLevel;
  severity: number; // 4: animo/estres critico, 3: sueno bajo/revisar, 2: energia baja, 1: refuerzo positivo
  message: string;
  actionType?: "recursos-sueno" | "respiracion-478" | "recursos-y-psicologo";
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
}

/**
 * 1. Umbrales definidos según especificación:
 * - Sueño: < 6 h = "bajo" | 7-9 h = "óptimo" | > 10 h = "revisar" (6-7 h y 9-10 h = neutro, sin aviso)
 * - Estrés (escala interna 1-5): >= 4 = "alto"
 * - Energía (escala interna 1-5): <= 2 = "baja"
 * - Ánimo (escala interna 1-5): >= 4 = "requiere apoyo" (Feliz=1, Bien=2, Normal=3, Triste=4, Muy mal=5)
 */

export function evaluateSleepRule(hours: number): MetricSuggestion | null {
  if (hours < 6) {
    return {
      id: "sueno-bajo",
      metric: "sueno",
      level: "bajo",
      severity: 3,
      message:
        "Dormiste menos de 6 h. Puedes sentirte más cansado/a hoy. ¿Probamos una técnica de descanso?",
      actionType: "recursos-sueno",
      primaryActionLabel: "Ver técnicas de descanso",
    };
  }

  if (hours >= 7 && hours <= 9) {
    return {
      id: "sueno-optimo",
      metric: "sueno",
      level: "optimo",
      severity: 1,
      message: "¡Buen descanso!",
    };
  }

  if (hours > 10) {
    return {
      id: "sueno-revisar",
      metric: "sueno",
      level: "revisar",
      severity: 2,
      message:
        "Dormiste más de 10 h. A veces el exceso de sueño indica fatiga acumulada. Procura mantener un ritmo regular.",
      actionType: "recursos-sueno",
      primaryActionLabel: "Pautas de sueño",
    };
  }

  // 6-7 h y 9-10 h: neutro, sin aviso
  return null;
}

export function evaluateStressRule(level: number): MetricSuggestion | null {
  // Escala interna 1 a 5
  if (level >= 4) {
    return {
      id: "estres-alto",
      metric: "estres",
      level: "alto",
      severity: 4, // Prioridad alta (ánimo / estrés > sueño > energía)
      message: "Notamos que tu estrés está alto. Respirar 2 minutos puede ayudarte ahora.",
      actionType: "respiracion-478",
      primaryActionLabel: "Respiración 4-7-8",
    };
  }

  if (level <= 2) {
    return {
      id: "estres-optimo",
      metric: "estres",
      level: "optimo",
      severity: 1,
      message: "Nivel de estrés bajo y sereno. ¡Disfruta tu día!",
    };
  }

  return null;
}

export function evaluateEnergyRule(level: number): MetricSuggestion | null {
  // Escala interna 1 a 5
  if (level <= 2) {
    return {
      id: "energia-baja",
      metric: "energia",
      level: "baja",
      severity: 2,
      message:
        "Tu nivel de energía está bajo. Escucha a tu ritmo y date pausas amables. Estamos aquí para acompañarte.",
      actionType: "recursos-y-psicologo",
      primaryActionLabel: "Recursos de bienestar",
      secondaryActionLabel: "Hablar con un psicólogo",
    };
  }

  if (level >= 4) {
    return {
      id: "energia-optima",
      metric: "energia",
      level: "optimo",
      severity: 1,
      message: "¡Excelente energía para acompañar tu jornada!",
    };
  }

  return null;
}

export function evaluateMoodRule(internalValue: number): MetricSuggestion | null {
  // Escala interna 1 a 5: Feliz=1, Bien=2, Normal=3, Triste=4, Muy mal=5
  if (internalValue >= 4) {
    return {
      id: "animo-apoyo",
      metric: "animo",
      level: "requiere apoyo",
      severity: 4, // Prioridad alta (ánimo / estrés > sueño > energía)
      message:
        "Notamos que tu ánimo requiere apoyo hoy. Recuerda que no tienes que pasar por esto a solas.",
      actionType: "recursos-y-psicologo",
      primaryActionLabel: "Explorar recursos",
      secondaryActionLabel: "Hablar con un psicólogo",
    };
  }

  if (internalValue <= 2) {
    return {
      id: "animo-optimo",
      metric: "animo",
      level: "optimo",
      severity: 1,
      message: "¡Qué bueno verte con buen ánimo hoy!",
    };
  }

  return null;
}

/**
 * Regla de Decisión RD02:
 * Mapeo de escala de check-in (1-5) a nivel de riesgo:
 * - escala 1 a 3: 'verde'
 * - escala 4 a 5: 'rojo' (activa comportamiento de alerta)
 * NOTA CRÍTICA: NO usar 'amarillo' en el check-in diario; está reservado
 * exclusivamente al tamizaje clínico de Eli (GAD-7 / PHQ-9).
 */
export function mapCheckInRiskRD02(escala: number): "verde" | "rojo" {
  return escala >= 4 ? "rojo" : "verde";
}

export const evaluateCheckInRiskRD02 = mapCheckInRiskRD02;

/**
 * Resuelve la sugerencia más prioritaria entre una nueva y la existente:
 * Prioridad: ánimo/estrés (4) > sueño (3) > energía (2) > óptimo (1)
 */
export function prioritizeSuggestion(
  current: MetricSuggestion | null,
  incoming: MetricSuggestion | null,
): MetricSuggestion | null {
  if (!incoming) return current;
  if (!current) return incoming;

  if (incoming.severity >= current.severity) {
    return incoming;
  }
  return current;
}
