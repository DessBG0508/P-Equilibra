export { ELI_SYSTEM_INSTRUCTIONS } from "@/config/eli-prompt";

export type ScreeningNivel = "verde" | "amarillo" | "rojo";

export interface ScreeningPatientData {
  iniciales: string;
  edad: number;
  sexo: string;
  semestre: string;
}

export interface ScreeningState {
  step:
    | "not_started"
    | "waiting_consent"
    | "declined"
    | "waiting_initials"
    | "waiting_age"
    | "waiting_sex"
    | "waiting_semestre"
    | "gad7"
    | "phq9"
    | "completed";
  currentQuestionIndex: number;
  paciente: ScreeningPatientData;
  gad7Items: number[];
  phq9Items: number[];
  folio?: string;
  nivel?: ScreeningNivel;
}

export const INITIAL_SCREENING_STATE: ScreeningState = {
  step: "not_started",
  currentQuestionIndex: 0,
  paciente: {
    iniciales: "",
    edad: 0,
    sexo: "",
    semestre: "",
  },
  gad7Items: [],
  phq9Items: [],
};

export const GAD7_QUESTIONS = [
  "1. Se ha sentido nervioso/a, ansioso/a o muy tenso/a.",
  "2. No ha sido capaz de dejar de preocuparse o de controlar la preocupación.",
  "3. Se ha preocupado demasiado por diferentes cosas.",
  "4. Ha tenido dificultad para relajarse.",
  "5. Se ha sentido tan inquieto/a que no ha podido permanecer quieto/a.",
  "6. Se ha sentido fácilmente molesto/a o irritable.",
  "7. Ha sentido miedo, como si algo terrible pudiera pasar.",
];

export const PHQ9_QUESTIONS = [
  "1. Poco interés o placer en hacer las cosas.",
  "2. Se ha sentido decaído(a), deprimido(a) o sin esperanza.",
  "3. Ha tenido dificultad para dormir o ha dormido demasiado.",
  "4. Se ha sentido cansado(a) o con poca energía.",
  "5. Ha tenido poco apetito o ha comido en exceso.",
  "6. Se ha sentido mal consigo mismo(a) o que ha decepcionado a su familia.",
  "7. Ha tenido dificultad para concentrarse.",
  "8. Se ha movido o hablado muy lento, o ha estado muy inquieto(a), más de lo habitual.",
  "9. Ha tenido pensamientos de que estaría mejor muerto(a) o de hacerse daño.",
];

export const GAD7_ANUNCIO =
  "Listo. Ahora 7 preguntas sobre ansiedad. Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas? Responde: Nunca / Varios días / Más de la mitad de los días / Casi todos los días.";

export const PHQ9_ANUNCIO =
  "Ahora 9 preguntas sobre estado de ánimo, mismas opciones de respuesta.";

export const CRISIS_MESSAGE =
  "Tu seguridad es importante. Te recomiendo contactar ahora a Línea de la Vida 800 911 2000 / SAPTEL 800 472 7835 o acudir a urgencias.";

export function generateFolio(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `EQ-${randomNum}`;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Convierte respuestas: Nunca=0, Varios días=1, Más de la mitad de los días=2, Casi todos los días=3.
 */
export function parseLikertOption(text: string): number | null {
  const norm = normalize(text);

  if (
    norm === "0" ||
    norm === "nunca" ||
    norm === "ningun dia" ||
    norm === "ninguno" ||
    norm === "jamas"
  ) {
    return 0;
  }

  if (
    norm === "1" ||
    norm === "varios dias" ||
    norm === "pocos dias" ||
    norm === "algunos dias" ||
    norm === "a veces"
  ) {
    return 1;
  }

  if (
    norm === "2" ||
    norm.includes("mas de la mitad") ||
    norm === "frecuente" ||
    norm === "frecuentemente"
  ) {
    return 2;
  }

  if (
    norm === "3" ||
    norm.includes("casi todos") ||
    norm.includes("todos los dias") ||
    norm === "diario" ||
    norm === "siempre"
  ) {
    return 3;
  }

  return null;
}

export interface ScreeningFinalJson {
  paciente: {
    iniciales: string;
    edad: number;
    sexo: string;
    semestre: string;
  };
  GAD_7: {
    total: number;
    items: number[];
  };
  PHQ_9: {
    total: number;
    items: number[];
    item9: number;
  };
  folio: string;
  nivel: ScreeningNivel;
  alerta: boolean;
  recomendaciones: string;
}

export interface EliStepResult {
  replyText: string;
  nextState: ScreeningState;
  isCrisis?: boolean;
  isCompleted?: boolean;
  finalJson?: ScreeningFinalJson;
  quickReplies?: string[];
  folio?: string;
  nivel?: ScreeningNivel;
  isReadyForSubmission?: boolean;
  submissionPayload?: {
    paciente: {
      iniciales: string;
      edad: number;
      sexo: string;
      semestre: string;
    };
    GAD7: number[];
    PHQ9: number[];
  };
}

export function processEliMessage(userText: string, currentState: ScreeningState): EliStepResult {
  const trimmed = userText.trim();

  // PASO 0 — Mensaje de bienvenida EXACTO
  if (currentState.step === "not_started") {
    return {
      replyText:
        "Hola. Soy Eli, asistente del Área de Psicología. La atención psicológica es un proceso en el que recibes apoyo y orientación profesional; a veces sabemos qué nos pasa y otras veces cuesta más identificarlo. Aquí responderás un tamizaje breve y confidencial. No doy diagnósticos: un profesional revisará tus respuestas. ¿Aceptas participar? (Sí/No)",
      nextState: {
        ...currentState,
        step: "waiting_consent",
      },
      quickReplies: ["Sí", "No"],
    };
  }

  // PASO 1 — Esperando consentimiento
  if (currentState.step === "waiting_consent") {
    const norm = normalize(trimmed);
    if (norm === "no" || norm === "no acepto" || norm === "rechazar" || norm === "cancelar") {
      return {
        replyText: "Gracias por tu tiempo. Si cambias de opinión, aquí estaré.",
        nextState: {
          ...currentState,
          step: "declined",
        },
      };
    }

    if (
      norm === "si" ||
      norm === "acepto" ||
      norm === "si acepto" ||
      norm === "ok" ||
      norm === "claro" ||
      norm === "de acuerdo" ||
      norm === "adelante"
    ) {
      return {
        replyText: "Perfecto. ¿Cuáles son tus iniciales? (p. ej. A.P.)",
        nextState: {
          ...currentState,
          step: "waiting_initials",
        },
      };
    }

    // Redirección
    return {
      replyText: "Anotado. ¿Aceptas participar? (Sí/No)",
      nextState: currentState,
      quickReplies: ["Sí", "No"],
    };
  }

  // Si ya había terminado o declinado, reiniciar
  if (currentState.step === "declined" || currentState.step === "completed") {
    return {
      replyText:
        "Hola. Soy Eli, asistente del Área de Psicología. La atención psicológica es un proceso en el que recibes apoyo y orientación profesional; a veces sabemos qué nos pasa y otras veces cuesta más identificarlo. Aquí responderás un tamizaje breve y confidencial. No doy diagnósticos: un profesional revisará tus respuestas. ¿Aceptas participar? (Sí/No)",
      nextState: {
        ...INITIAL_SCREENING_STATE,
        step: "waiting_consent",
      },
      quickReplies: ["Sí", "No"],
    };
  }

  // PASO 1 -> PASO 2: Iniciales
  if (currentState.step === "waiting_initials") {
    if (!trimmed || trimmed.length > 50) {
      return {
        replyText: "Anotado. ¿Cuáles son tus iniciales? (p. ej. A.P.)",
        nextState: currentState,
      };
    }

    return {
      replyText: "¿Qué edad tienes?",
      nextState: {
        ...currentState,
        paciente: {
          ...currentState.paciente,
          iniciales: trimmed.toUpperCase(),
        },
        step: "waiting_age",
      },
    };
  }

  // PASO 2 -> PASO 3: Edad
  if (currentState.step === "waiting_age") {
    const parsedAge = parseInt(trimmed.replace(/\D/g, ""), 10);
    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 115) {
      return {
        replyText: "Anotado. ¿Qué edad tienes?",
        nextState: currentState,
      };
    }

    return {
      replyText: "¿Tu sexo? (Hombre / Mujer / Otro)",
      nextState: {
        ...currentState,
        paciente: {
          ...currentState.paciente,
          edad: parsedAge,
        },
        step: "waiting_sex",
      },
      quickReplies: ["Hombre", "Mujer", "Otro"],
    };
  }

  // PASO 3 -> PASO 4: Sexo
  if (currentState.step === "waiting_sex") {
    const norm = normalize(trimmed);
    let resolvedSex = "";
    if (norm.startsWith("hom") || norm === "h" || norm === "masculino" || norm === "m") {
      resolvedSex = "Hombre";
    } else if (norm.startsWith("muj") || norm === "femenino" || norm === "f") {
      resolvedSex = "Mujer";
    } else if (
      norm.includes("otro") ||
      norm.includes("no binario") ||
      norm.includes("prefiero") ||
      norm.includes("nb")
    ) {
      resolvedSex = "Otro";
    }

    if (!resolvedSex) {
      return {
        replyText: "Anotado. ¿Tu sexo? (Hombre / Mujer / Otro)",
        nextState: currentState,
        quickReplies: ["Hombre", "Mujer", "Otro"],
      };
    }

    return {
      replyText: "¿Qué semestre cursas actualmente? (responde del 1 al 9, o escribe Otro)",
      nextState: {
        ...currentState,
        paciente: {
          ...currentState.paciente,
          sexo: resolvedSex,
        },
        step: "waiting_semestre",
      },
      quickReplies: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Otro"],
    };
  }

  // PASO 4 -> PASO 5: Semestre
  if (currentState.step === "waiting_semestre") {
    const norm = normalize(trimmed);
    let resolvedSemestre = "";

    const matchDigit = norm.match(/\b([1-9])\b/);
    if (matchDigit && matchDigit[1]) {
      resolvedSemestre = `${matchDigit[1]}º Semestre`;
    } else if (norm.includes("otro") || norm.includes("egresad") || norm.includes("posgrado")) {
      resolvedSemestre = "Otro";
    } else if (/^[1-9]$/.test(trimmed)) {
      resolvedSemestre = `${trimmed}º Semestre`;
    } else if (trimmed.length > 0 && trimmed.length <= 30) {
      resolvedSemestre = trimmed;
    }

    if (!resolvedSemestre) {
      return {
        replyText:
          "Anotado. ¿Qué semestre cursas actualmente? (responde del 1 al 9, o escribe Otro)",
        nextState: currentState,
        quickReplies: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Otro"],
      };
    }

    const nextState: ScreeningState = {
      ...currentState,
      paciente: {
        ...currentState.paciente,
        semestre: resolvedSemestre,
      },
      step: "gad7",
      currentQuestionIndex: 0,
      gad7Items: [],
    };

    return {
      replyText: `${GAD7_ANUNCIO}\n\n${GAD7_QUESTIONS[0]}`,
      nextState,
      quickReplies: ["Nunca", "Varios días", "Más de la mitad de los días", "Casi todos los días"],
    };
  }

  // PASO 5 — GAD-7 reactivos (7 preguntas)
  if (currentState.step === "gad7") {
    const score = parseLikertOption(trimmed);
    const qIndex = currentState.currentQuestionIndex;

    if (score === null) {
      return {
        replyText: `Anotado. ${GAD7_QUESTIONS[qIndex]}`,
        nextState: currentState,
        quickReplies: [
          "Nunca",
          "Varios días",
          "Más de la mitad de los días",
          "Casi todos los días",
        ],
      };
    }

    const updatedItems = [...currentState.gad7Items, score];

    // ¿Faltan más preguntas de GAD-7?
    if (qIndex + 1 < GAD7_QUESTIONS.length) {
      const nextQIndex = qIndex + 1;
      return {
        replyText: GAD7_QUESTIONS[nextQIndex],
        nextState: {
          ...currentState,
          currentQuestionIndex: nextQIndex,
          gad7Items: updatedItems,
        },
        quickReplies: [
          "Nunca",
          "Varios días",
          "Más de la mitad de los días",
          "Casi todos los días",
        ],
      };
    }

    // Terminó GAD-7 -> Pasar a PHQ-9 (PASO 6)
    return {
      replyText: `${PHQ9_ANUNCIO}\n\n${PHQ9_QUESTIONS[0]}`,
      nextState: {
        ...currentState,
        step: "phq9",
        currentQuestionIndex: 0,
        gad7Items: updatedItems,
        phq9Items: [],
      },
      quickReplies: ["Nunca", "Varios días", "Más de la mitad de los días", "Casi todos los días"],
    };
  }

  // PASO 6 — PHQ-9 reactivos (9 preguntas)
  if (currentState.step === "phq9") {
    const score = parseLikertOption(trimmed);
    const qIndex = currentState.currentQuestionIndex;

    if (score === null) {
      return {
        replyText: `Anotado. ${PHQ9_QUESTIONS[qIndex]}`,
        nextState: currentState,
        quickReplies: [
          "Nunca",
          "Varios días",
          "Más de la mitad de los días",
          "Casi todos los días",
        ],
      };
    }

    const updatedItems = [...currentState.phq9Items, score];

    // ¿Faltan más preguntas de PHQ-9?
    if (qIndex + 1 < PHQ9_QUESTIONS.length) {
      const nextQIndex = qIndex + 1;
      return {
        replyText: PHQ9_QUESTIONS[nextQIndex],
        nextState: {
          ...currentState,
          currentQuestionIndex: nextQIndex,
          phq9Items: updatedItems,
        },
        quickReplies: [
          "Nunca",
          "Varios días",
          "Más de la mitad de los días",
          "Casi todos los días",
        ],
      };
    }

    // Reactivo 9 de PHQ-9 respondido: evaluar el tamizaje de acuerdo con las instrucciones clínicas oficiales
    const gad7Total = currentState.gad7Items.reduce((acc, v) => acc + v, 0);
    const phq9Total = updatedItems.reduce((acc, v) => acc + v, 0);
    const item9Score = score;

    // Árbol de decisión clínico:
    // REGLA DE CRISIS (prioridad máxima) -> ROJO si item 9 > 0, PHQ-9 total >= 20 o GAD-7 total >= 15
    const isCrisis = item9Score > 0 || phq9Total >= 20 || gad7Total >= 15;
    let nivel: ScreeningNivel = "verde";
    if (isCrisis) {
      nivel = "rojo";
    } else if (phq9Total >= 10 || gad7Total >= 10) {
      nivel = "amarillo";
    } else {
      nivel = "verde";
    }

    const folio = generateFolio();

    let replyText = "";
    if (nivel === "rojo") {
      replyText = `${CRISIS_MESSAGE}\n\nRequieres atención prioritaria. Por favor agenda tu cita HOY MISMO en el apartado "Agenda de Citas" de esta plataforma y elige TERAPIA PSICOLÓGICA.\n\nTu folio de tamizaje es: ${folio}\nEscríbelo en el formulario para vincular tus resultados.\n\nGracias. Un profesional revisará tus respuestas.`;
    } else if (nivel === "amarillo") {
      replyText = `Tus resultados sugieren que sería beneficioso recibir apoyo profesional. Te recomiendo agendar una cita en el apartado "Agenda de Citas" de esta plataforma, eligiendo ORIENTACIÓN o TERAPIA PSICOLÓGICA.\n\nTu folio de tamizaje es: ${folio}\nEscríbelo en el formulario para vincular tus resultados.\n\nGracias. Un profesional revisará tus respuestas.`;
    } else {
      replyText = `Tus resultados no muestran señales de alerta en este momento. Si en algún momento lo deseas, puedes agendar una sesión de CONSEJERÍA en el apartado "Agenda de Citas" de esta plataforma.\n\nTu folio de tamizaje es: ${folio} por si deseas vincularlo.\n\nGracias. Un profesional revisará tus respuestas.`;
    }

    const finalJson: ScreeningFinalJson = {
      paciente: {
        iniciales: currentState.paciente.iniciales || "",
        edad: currentState.paciente.edad || 0,
        sexo: currentState.paciente.sexo || "",
        semestre: currentState.paciente.semestre || "",
      },
      GAD_7: {
        total: gad7Total,
        items: currentState.gad7Items,
      },
      PHQ_9: {
        total: phq9Total,
        items: updatedItems,
        item9: item9Score,
      },
      folio,
      nivel,
      alerta: isCrisis,
      recomendaciones:
        nivel === "rojo"
          ? "Atención prioritaria y terapia psicológica inmediata"
          : nivel === "amarillo"
            ? "Orientación o terapia psicológica recomendada"
            : "Consejería preventiva opcional",
    };

    return {
      replyText,
      nextState: {
        ...currentState,
        currentQuestionIndex: 8,
        phq9Items: updatedItems,
        step: "completed",
        folio,
        nivel,
      },
      folio,
      nivel,
      isCrisis,
      isCompleted: true,
      finalJson,
      isReadyForSubmission: true,
      submissionPayload: {
        paciente: {
          iniciales: currentState.paciente.iniciales || "",
          edad: currentState.paciente.edad || 0,
          sexo: currentState.paciente.sexo || "",
          semestre: currentState.paciente.semestre || "",
        },
        GAD7: currentState.gad7Items,
        PHQ9: updatedItems,
      },
    };
  }

  // Fallback seguro
  return {
    replyText:
      "Hola. Soy Eli, asistente del Área de Psicología. La atención psicológica es un proceso en el que recibes apoyo y orientación profesional; a veces sabemos qué nos pasa y otras veces cuesta más identificarlo. Aquí responderás un tamizaje breve y confidencial. No doy diagnósticos: un profesional revisará tus respuestas. ¿Aceptas participar? (Sí/No)",
    nextState: {
      ...INITIAL_SCREENING_STATE,
      step: "waiting_consent",
    },
    quickReplies: ["Sí", "No"],
  };
}
