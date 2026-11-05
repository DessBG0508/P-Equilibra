import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  History,
  RotateCcw,
  Plus,
  ChevronRight,
  Sparkles,
  Send,
  ArrowLeft,
  ShieldAlert,
  Phone,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Copy,
  Ticket,
} from "lucide-react";
import {
  resetBackendScreeningState,
  type EliMessage,
  type TamizajeSubmissionPayload,
} from "@/lib/api-client";
import { supabase } from "@/integrations/supabase/client";
import {
  INITIAL_SCREENING_STATE,
  type ScreeningState,
  type ScreeningNivel,
  processEliMessage,
  generateFolio,
  parseLikertOption,
  CRISIS_MESSAGE,
} from "@/lib/eli-screening";
import { sanitizeText } from "@/lib/security";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
  messages: EliMessage[];
  screeningState: ScreeningState;
}

const CHAT_SESSIONS_STORAGE_KEY = "equilibra_eli_screening_sessions_v5";
const ACTIVE_SESSION_STORAGE_KEY = "equilibra_eli_active_session_id_v5";

// Limpiar versiones obsoletas de almacenamiento para garantizar un reinicio limpio
if (typeof window !== "undefined") {
  try {
    [
      "equilibra_eli_screening_sessions_v4",
      "equilibra_eli_active_session_id_v4",
      "equilibra_eli_screening_sessions_v3",
      "equilibra_eli_chat_messages_v2",
      "equilibra_eli_chat_messages_v1",
    ].forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

function createFreshSession(): ChatSession {
  const id = `session-${Date.now()}`;
  return {
    id,
    title: "Nuevo tamizaje",
    updatedAt: "Ahora",
    preview: "Cuestionario de tamizaje clínico...",
    messages: [],
    screeningState: { ...INITIAL_SCREENING_STATE },
  };
}

export function ChatPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();

  // RD-07: Bloqueo persistente desde la base de datos (Supabase)
  const [isBlockedByBackend, setIsBlockedByBackend] = useState(false);
  // Gating intra-sesión: nivel amarillo/rojo de la conversación ACTUAL (solo durante la sesión en curso)
  const [intraSessionRiskBlocked, setIntraSessionRiskBlocked] = useState(false);

  // Inicializar sesiones
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [createFreshSession()];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const storedId = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (storedId && sessions.some((s) => s.id === storedId)) {
        return storedId;
      }
    } catch {
      // fallback
    }
    return sessions[0]?.id || "default-session";
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [pendingSubmissionPayload, setPendingSubmissionPayload] =
    useState<TamizajeSubmissionPayload | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Obtener sesión activa
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || createFreshSession();
  const messages = activeSession.messages;
  const screeningState = activeSession.screeningState || INITIAL_SCREENING_STATE;

  // RD-07: Evaluación de nivel de riesgo (amarillo o rojo)
  const isRiskNivel = screeningState.nivel === "amarillo" || screeningState.nivel === "rojo";

  // Fuente única de verdad del bloqueo de reinicio (gated si el tamizaje es amarillo o rojo, o bloqueado en BD)
  const isGatedByRisk =
    isBlockedByBackend ||
    intraSessionRiskBlocked ||
    (screeningState.step === "completed" && isRiskNivel);

  const isEffectiveBlocked = isGatedByRisk;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const messagesCount = messages.length;
  useEffect(() => {
    scrollToBottom();
  }, [messagesCount, isTyping, scrollToBottom]);

  // Persistir sesiones
  const persistSessions = (newSessions: ChatSession[], newActiveId?: string) => {
    setSessions(newSessions);
    try {
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(newSessions));
      if (newActiveId) {
        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, newActiveId);
      }
    } catch {
      // ignore storage errors
    }
  };

  // RD-07: Al montar el chat con sesión real: consultar pacientes por user_id (última fila).
  // Fuente única de verdad del bloqueo: Si bloqueado=false, NO debe existir ningún gating:
  // habilitar reinicios y placeholder normal, IGNORANDO y LIMPIANDO cualquier estado local
  // de "tamizaje completado" persistido del navegador.
  useEffect(() => {
    let isMounted = true;
    async function checkBlockedStatus() {
      let authUserId = user?.id;
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch {
        // usar id de contexto si existe
      }

      // Solo sesión real con UUID (no sesión de demostración)
      const UUID_REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!authUserId || !UUID_REGEX.test(authUserId)) {
        return;
      }

      try {
        let patientRow: { id?: string | number; bloqueado?: boolean | null } | null = null;
        let queryCompleted = false;

        // Intentar consultar ordenando por fecha_registro, created_at, o id
        const q1 = await supabase
          .from("pacientes")
          .select("id, bloqueado, fecha_registro")
          .eq("user_id", authUserId)
          .order("fecha_registro", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!q1.error) {
          patientRow = q1.data;
          queryCompleted = true;
        } else {
          const q2 = await supabase
            .from("pacientes")
            .select("id, bloqueado, created_at")
            .eq("user_id", authUserId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!q2.error) {
            patientRow = q2.data;
            queryCompleted = true;
          } else {
            const q3 = await supabase
              .from("pacientes")
              .select("id, bloqueado, fecha")
              .eq("user_id", authUserId)
              .order("fecha", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!q3.error) {
              patientRow = q3.data;
              queryCompleted = true;
            } else {
              const q4 = await supabase
                .from("pacientes")
                .select("id, bloqueado")
                .eq("user_id", authUserId)
                .order("id", { ascending: false })
                .limit(1)
                .maybeSingle();

              if (!q4.error) {
                patientRow = q4.data;
                queryCompleted = true;
              }
            }
          }
        }

        if (queryCompleted && isMounted) {
          if (patientRow && patientRow.bloqueado === true) {
            setIsBlockedByBackend(true);
          } else if (!patientRow || patientRow.bloqueado === false) {
            // FUENTE ÚNICA DE VERDAD: Si bloqueado=false en BD, ningún gating.
            setIsBlockedByBackend(false);
            setIntraSessionRiskBlocked(false);

            // Ignorar y limpiar cualquier estado local de "tamizaje completado" persistido del navegador
            try {
              localStorage.removeItem("equilibra_ultimo_folio_tamizaje");
            } catch {
              // ignore
            }

            setSessions((prevSessions) => {
              const hasCompleted = prevSessions.some((s) => s.screeningState?.step === "completed");
              if (hasCompleted || prevSessions.length === 0) {
                const fresh = createFreshSession();
                try {
                  localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify([fresh]));
                  localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, fresh.id);
                } catch {
                  // ignore
                }
                setActiveSessionId(fresh.id);
                return [fresh];
              }
              return prevSessions;
            });
          }
        }
      } catch (err) {
        console.warn("Aviso al consultar estado de bloqueo de paciente:", err);
      }
    }

    checkBlockedStatus();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // RECUPERACIÓN AUTOMÁTICA: Si el usuario respondió el reactivo 9 pero no se generó el mensaje de Eli con el folio
  useEffect(() => {
    if (!activeSession || !activeSession.screeningState) return;
    const st = activeSession.screeningState;
    const msgs = activeSession.messages;
    if (!msgs || msgs.length === 0) return;

    const lastMsg = msgs[msgs.length - 1];
    const hasAnsweredQ9 =
      (st.step === "phq9" &&
        (st.phq9Items.length === 9 || (st.phq9Items.length === 8 && lastMsg?.sender === "user"))) ||
      (st.step === "completed" &&
        !msgs.some(
          (m) => m.sender === "eli" && (m.text.includes("folio") || m.text.includes("EQ-")),
        ));

    const alreadyHasEliFolio = msgs.some(
      (m) => m.sender === "eli" && (m.text.includes("folio") || m.text.includes("EQ-")),
    );

    if (hasAnsweredQ9 && !alreadyHasEliFolio) {
      let q9Score = 1;
      if (lastMsg && lastMsg.sender === "user") {
        const parsed = parseLikertOption(lastMsg.text);
        if (parsed !== null) q9Score = parsed;
      }
      const phq9Items = st.phq9Items.length === 9 ? st.phq9Items : [...st.phq9Items, q9Score];
      const gad7Total = st.gad7Items.reduce((a, b) => a + b, 0);
      const phq9Total = phq9Items.reduce((a, b) => a + b, 0);
      const item9Score = phq9Items[8] ?? q9Score;
      const isCrisis = item9Score > 0 || phq9Total >= 20 || gad7Total >= 15;
      const nivel: ScreeningNivel = isCrisis
        ? "rojo"
        : phq9Total >= 10 || gad7Total >= 10
          ? "amarillo"
          : "verde";
      const existingFolio =
        st.folio || localStorage.getItem("equilibra_ultimo_folio_tamizaje") || generateFolio();

      let replyText = "";
      if (nivel === "rojo") {
        replyText = `${CRISIS_MESSAGE}\n\nRequieres atención prioritaria. Por favor agenda tu cita HOY MISMO en el apartado "Agenda de Citas" de esta plataforma y elige TERAPIA PSICOLÓGICA.\n\nTu folio de tamizaje es: ${existingFolio}\nEscríbelo en el formulario para vincular tus resultados.\n\nGracias. Un profesional revisará tus respuestas.`;
      } else if (nivel === "amarillo") {
        replyText = `Tus resultados sugieren que sería beneficioso recibir apoyo profesional. Te recomiendo agendar una cita en el apartado "Agenda de Citas" de esta plataforma, eligiendo ORIENTACIÓN o TERAPIA PSICOLÓGICA.\n\nTu folio de tamizaje es: ${existingFolio}\nEscríbelo en el formulario para vincular tus resultados.\n\nGracias. Un profesional revisará tus respuestas.`;
      } else {
        replyText = `Tus resultados no muestran señales de alerta en este momento. Si en algún momento lo deseas, puedes agendar una sesión de CONSEJERÍA en el apartado "Agenda de Citas" de esta plataforma.\n\nTu folio de tamizaje es: ${existingFolio} por si deseas vincularlo.\n\nGracias. Un profesional revisará tus respuestas.`;
      }

      const eliMsg: EliMessage = {
        id: crypto.randomUUID(),
        sender: "eli",
        text: replyText,
        isCrisisProtocol: isCrisis,
        crisisData: isCrisis
          ? {
              actionLabel: "Contactar a Línea de la Vida ahora",
              actionRoute: "/alerta",
              helplineName: "Línea de la Vida",
              helphoneNumber: "800 911 2000",
            }
          : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      try {
        localStorage.setItem("equilibra_ultimo_folio_tamizaje", existingFolio);
      } catch {
        // ignore
      }

      const updatedState: ScreeningState = {
        ...st,
        step: "completed",
        currentQuestionIndex: 8,
        phq9Items,
        folio: existingFolio,
        nivel,
      };

      const updatedSession: ChatSession = {
        ...activeSession,
        messages: [...msgs, eliMsg],
        screeningState: updatedState,
      };

      setSessions((prev) => {
        const nextSessions = prev.map((s) => (s.id === activeSession.id ? updatedSession : s));
        try {
          localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(nextSessions));
        } catch {
          // ignore
        }
        return nextSessions;
      });
      if (nivel === "rojo" || nivel === "amarillo") {
        setIntraSessionRiskBlocked(true);
      }
    }
  }, [activeSessionId, activeSession]);

  // REINICIAR CHAT COMPLETAMENTE (Bloqueado solo si hay gating efectivo)
  const handleResetChat = () => {
    if (isEffectiveBlocked) {
      toast.warning(
        "Tu tamizaje está en resguardo. Solo el psicólogo del TESH puede reactivar o autorizar una nueva evaluación.",
      );
      return;
    }
    resetBackendScreeningState();
    setSubmissionError(null);
    setPendingSubmissionPayload(null);
    try {
      localStorage.removeItem("equilibra_ultimo_folio_tamizaje");
    } catch {
      // ignore
    }
    const freshSession = createFreshSession();
    persistSessions([freshSession], freshSession.id);
    setActiveSessionId(freshSession.id);
    setInputText("");
    setIsTyping(false);
    toast.success("Chat reiniciado. Puedes comenzar un nuevo tamizaje.");
  };

  // REINTENTAR ENVÍO TRAS ERROR DE CONEXIÓN
  const handleRetrySubmission = async () => {
    if (!pendingSubmissionPayload || isTyping) return;
    setIsTyping(true);
    setSubmissionError(null);

    try {
      let finalPayload = pendingSubmissionPayload;
      if (finalPayload.user_id === undefined) {
        let currentUserId: string | null = null;
        try {
          const { data: authData } = await supabase.auth.getUser();
          const UUID_REGEX =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (authData?.user?.id && UUID_REGEX.test(authData.user.id)) {
            currentUserId = authData.user.id;
          }
        } catch {
          currentUserId = null;
        }
        finalPayload = { ...finalPayload, user_id: currentUserId };
      }

      let { data, error } = await supabase.functions.invoke("tamizaje", {
        body: finalPayload,
      });

      if (
        error &&
        (error.message?.includes("404") ||
          error.message?.includes("not found") ||
          error.message?.includes("Failed to send"))
      ) {
        const alt = await supabase.functions.invoke("tamizaje", {
          body: finalPayload,
        });
        if (!alt.error) {
          data = alt.data;
          error = null;
        }
      }

      if (error || data?.status === "error" || !data) {
        setSubmissionError(
          error?.message ||
            data?.error ||
            "Error al conectar con la función de tamizaje en Supabase. Por favor reintenta.",
        );
        return;
      }

      if (data.status === "completado" && data.data) {
        setPendingSubmissionPayload(null);
        setSubmissionError(null);

        const eliTimestamp = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const isCrisis = Boolean(data.data.alerta || data.data.nivel === "rojo");

        const eliMsg: EliMessage = {
          id: crypto.randomUUID(),
          sender: "eli",
          text: data.mensaje || "Tamizaje completado. Un profesional revisará tus respuestas.",
          isCrisisProtocol: isCrisis,
          crisisData: isCrisis
            ? {
                actionLabel: "Contactar a Línea de la Vida ahora",
                actionRoute: "/alerta",
                helplineName: "Línea de la Vida",
                helphoneNumber: "800 911 2000",
              }
            : undefined,
          timestamp: eliTimestamp,
        };

        const finalMessages = [...messages, eliMsg];

        try {
          localStorage.setItem("equilibra_ultimo_folio_tamizaje", data.data.folio);
        } catch {
          // ignore
        }

        const updatedState: ScreeningState = {
          ...screeningState,
          step: "completed",
          folio: data.data.folio,
          nivel: data.data.nivel,
        };

        const updatedSessionFinal: ChatSession = {
          ...activeSession,
          updatedAt: "Ahora",
          messages: finalMessages,
          preview: eliMsg.text.slice(0, 60),
          screeningState: updatedState,
        };

        const finalSessions = sessions.map((s) =>
          s.id === activeSession.id ? updatedSessionFinal : s,
        );
        persistSessions(finalSessions);
        if (data.data.nivel === "amarillo" || data.data.nivel === "rojo" || data.data.bloqueado) {
          setIsBlockedByBackend(true);
          setIntraSessionRiskBlocked(true);
        }
        toast.success("Tamizaje registrado correctamente");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error al conectar con la función de tamizaje en Supabase.";
      setSubmissionError(msg);
    } finally {
      setIsTyping(false);
    }
  };

  // NUEVA CONVERSACIÓN (Restringido solo si el bloqueo está activo)
  const handleNewConversation = () => {
    if (isEffectiveBlocked) {
      toast.warning(
        "Tu tamizaje está en revisión. Solo el psicólogo del TESH puede autorizar uno nuevo tras revisar tus respuestas.",
      );
      return;
    }
    const freshSession = createFreshSession();
    const updated = [freshSession, ...sessions];
    persistSessions(updated, freshSession.id);
    setActiveSessionId(freshSession.id);
    setIsHistoryOpen(false);
    setInputText("");
    toast.success("Nuevo tamizaje creado");
  };

  // SELECCIONAR SESIÓN
  const handleSelectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    try {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, session.id);
    } catch {
      // ignore
    }
    setIsHistoryOpen(false);
  };

  // BORRAR HISTORIAL COMPLETO
  const handleClearAllHistory = () => {
    if (isGatedByRisk) {
      toast.warning(
        "Tu tamizaje está en resguardo clínico. No se puede reiniciar mientras esté en revisión.",
      );
      return;
    }
    const freshSession = createFreshSession();
    persistSessions([freshSession], freshSession.id);
    setActiveSessionId(freshSession.id);
    setIsHistoryOpen(false);
    toast.info("Historial de tamizajes borrado.");
  };

  // DETERMINAR OPCIONES RÁPIDAS
  const getQuickReplies = (): string[] => {
    if (screeningState.step === "waiting_consent") {
      return ["Sí", "No"];
    }
    if (screeningState.step === "waiting_sex") {
      return ["Hombre", "Mujer", "Otro"];
    }
    if (screeningState.step === "waiting_semestre") {
      return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Otro"];
    }
    if (screeningState.step === "gad7" || screeningState.step === "phq9") {
      return ["Nunca", "Varios días", "Más de la mitad de los días", "Casi todos los días"];
    }
    return [];
  };

  // ENVIAR MENSAJE
  const handleSendMessage = async (textToSend?: string) => {
    const raw = textToSend !== undefined ? textToSend : inputText;
    const trimmed = raw.trim();
    if (!trimmed || isTyping || isEffectiveBlocked) return;

    const sanitized = sanitizeText(trimmed, 300);
    const userTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: EliMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: sanitized,
      timestamp: userTimestamp,
    };

    const newMessages = [...messages, userMsg];

    // Actualizar sesión con el mensaje de usuario de inmediato
    const sessionWithUser = {
      ...activeSession,
      updatedAt: "Ahora",
      messages: newMessages,
      preview: sanitized.slice(0, 60),
    };

    const updatedSessionsInterim = sessions.map((s) =>
      s.id === activeSession.id ? sessionWithUser : s,
    );
    persistSessions(updatedSessionsInterim);

    setInputText("");
    setIsTyping(true);
    setSubmissionError(null);

    // Procesar localmente la pregunta/respuesta actual
    const stepResult = processEliMessage(sanitized, screeningState);

    // Si respondió la pregunta 9 de PHQ-9, hacer UNA sola llamada a la función de Supabase 'tamizaje':
    if (stepResult.isReadyForSubmission && stepResult.submissionPayload) {
      // 1. Inmediatamente generar y publicar la respuesta de Eli con el Folio en el chat
      const eliTimestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const isCrisis = Boolean(stepResult.isCrisis || stepResult.nivel === "rojo");
      const calculatedFolio = stepResult.folio || generateFolio();
      const calculatedNivel = stepResult.nivel || "verde";

      const eliMsg: EliMessage = {
        id: crypto.randomUUID(),
        sender: "eli",
        text:
          stepResult.replyText ||
          `Tamizaje completado. Tu folio de tamizaje es: ${calculatedFolio}.\nEscríbelo en el formulario para vincular tus resultados.\n\nGracias. Un profesional revisará tus respuestas.`,
        isCrisisProtocol: isCrisis,
        crisisData: isCrisis
          ? {
              actionLabel: "Contactar a Línea de la Vida ahora",
              actionRoute: "/alerta",
              helplineName: "Línea de la Vida",
              helphoneNumber: "800 911 2000",
            }
          : undefined,
        timestamp: eliTimestamp,
      };

      const finalMessages = [...newMessages, eliMsg];

      try {
        localStorage.setItem("equilibra_ultimo_folio_tamizaje", calculatedFolio);
      } catch {
        // ignore
      }

      const updatedState: ScreeningState = {
        ...stepResult.nextState,
        step: "completed",
        folio: calculatedFolio,
        nivel: calculatedNivel,
      };

      const updatedSessionFinal: ChatSession = {
        ...activeSession,
        updatedAt: "Ahora",
        messages: finalMessages,
        preview: eliMsg.text.slice(0, 60),
        screeningState: updatedState,
      };

      setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? updatedSessionFinal : s)));
      persistSessions(sessions.map((s) => (s.id === activeSession.id ? updatedSessionFinal : s)));
      setIsTyping(false);

      if (calculatedNivel === "amarillo" || calculatedNivel === "rojo") {
        setIntraSessionRiskBlocked(true);
      }
      toast.success("Tamizaje completado con éxito");

      // 2. Registro asíncrono en Supabase (sin bloquear la visualización del folio en el chat)
      let currentUserId: string | null = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        const UUID_REGEX =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (authData?.user?.id && UUID_REGEX.test(authData.user.id)) {
          currentUserId = authData.user.id;
        }
      } catch {
        currentUserId = null;
      }

      const payloadWithUser: TamizajeSubmissionPayload = {
        ...stepResult.submissionPayload,
        user_id: currentUserId,
      };

      (async () => {
        try {
          const invokePromise = supabase.functions.invoke("tamizaje", {
            body: payloadWithUser,
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 6000),
          );
          const res = (await Promise.race([invokePromise, timeoutPromise])) as {
            data?: { data?: { folio?: string } };
            error?: Error | null;
          };

          if (res?.data?.data?.folio) {
            const serverFolio = res.data.data.folio;
            try {
              localStorage.setItem("equilibra_ultimo_folio_tamizaje", serverFolio);
            } catch {
              // ignore
            }
          }
        } catch {
          // El tamizaje ya quedó procesado y asegurado localmente en la sesión del chat
        }
      })();

      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    // Flujo normal de preguntas
    const eliTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const eliMsg: EliMessage = {
      id: crypto.randomUUID(),
      sender: "eli",
      text: stepResult.replyText,
      timestamp: eliTimestamp,
    };

    const finalMessages = [...newMessages, eliMsg];

    // Título de la sesión si se obtuvieron iniciales
    let sessionTitle = activeSession.title;
    if (stepResult.nextState.paciente.iniciales && sessionTitle === "Nuevo tamizaje") {
      sessionTitle = `Tamizaje — ${stepResult.nextState.paciente.iniciales}`;
    }

    const updatedSessionFinal: ChatSession = {
      ...activeSession,
      title: sessionTitle,
      updatedAt: "Ahora",
      messages: finalMessages,
      preview: eliMsg.text.slice(0, 60),
      screeningState: stepResult.nextState,
    };

    const finalSessions = sessions.map((s) =>
      s.id === activeSession.id ? updatedSessionFinal : s,
    );
    persistSessions(finalSessions);
    setIsTyping(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickReplies = getQuickReplies();

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      {/* 
        BARRA SUPERIOR PERMANENTE (Sticky, siempre visible)
        Incluye botón de salir explícito, identidad de Eli, botón de reiniciar y botón de historial
      */}
      <header className="sticky top-0 z-40 flex-none border-b border-border/80 bg-card/95 px-3 py-2.5 shadow-xs backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          {/* Lado izquierdo: Botón Salir + Identidad Eli */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/" })}
              className="h-8.5 gap-1.5 rounded-xl border-border/80 bg-background/80 px-2.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground active:scale-95"
              aria-label="Salir al inicio"
              title="Salir del chat y regresar al inicio"
            >
              <ArrowLeft className="size-4 text-primary" />
              <span>Salir</span>
            </Button>

            <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
              <div
                className="relative flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1B198F] to-[#6857E4] shadow-soft"
                aria-hidden="true"
              >
                <Sparkles className="size-4 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-teal-500 ring-2 ring-card" />
              </div>

              <div className="min-w-0 truncate">
                <div className="flex items-center gap-1.5">
                  <h1 className="truncate text-xs sm:text-sm font-bold leading-tight text-foreground">
                    {BRAND.assistant}
                  </h1>
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-md border-primary/30 bg-primary/10 px-1.5 py-0 text-[10px] font-semibold text-primary"
                  >
                    Tamizaje
                  </Badge>
                </div>
                <p className="truncate text-[10px] sm:text-[11px] text-muted-foreground">
                  PHQ-9 & GAD-7 • Confidencial TESH
                </p>
              </div>
            </div>
          </div>

          {/* Lado derecho: Reiniciar (oculto en riesgo) + Historial + Tema */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {!isGatedByRisk && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetChat}
                className="h-8.5 gap-1 rounded-xl border-border/80 bg-card/80 px-2.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted active:scale-95 sm:gap-1.5"
                aria-label="Reiniciar tamizaje"
                title="Reiniciar tamizaje"
              >
                <RotateCcw className="size-3.5 text-muted-foreground" />
                <span className="hidden xs:inline text-xs">Reiniciar</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="h-8.5 gap-1 rounded-xl border-border/80 bg-card/80 px-2.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted active:scale-95 sm:gap-1.5"
              aria-label="Ver historial de cuestionarios"
              title="Historial de conversaciones"
            >
              <History className="size-3.5 text-primary" />
              <span className="hidden xs:inline text-xs">Historial</span>
            </Button>

            <ThemeToggle className="size-8.5" />
          </div>
        </div>
      </header>

      {/* Banner de estado bloqueado (RD-07) */}
      {isEffectiveBlocked && (
        <div className="flex-none border-b border-lime-300 bg-lime-50/95 dark:border-lime-700 dark:bg-lime-950/80 px-4 py-3 text-lime-900 dark:text-lime-100 shadow-xs backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-start gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-lime-200/80 dark:bg-lime-800/80 text-lime-900 dark:text-lime-100">
              <ShieldAlert className="size-4.5" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold leading-relaxed">
                Tu tamizaje está en revisión. Un profesional lo revisará antes de permitir uno
                nuevo. Si necesitas apoyo inmediato, las líneas de ayuda siguen disponibles.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] font-bold">
                <a
                  href="tel:8009112000"
                  className="inline-flex items-center gap-1 text-teal hover:underline"
                >
                  <Phone className="size-3" />
                  Línea de la Vida 800 911 2000
                </a>
                <span className="text-lime-400 dark:text-lime-600">•</span>
                <a
                  href="tel:8004727835"
                  className="inline-flex items-center gap-1 text-teal hover:underline"
                >
                  <Phone className="size-3" />
                  SAPTEL 800 472 7835
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner discreto de confidencialidad y aviso de crisis */}
      <div className="flex-none border-b border-border/60 bg-muted/40 px-3 py-1.5 text-center backdrop-blur-xs">
        <p className="mx-auto max-w-3xl text-[11px] text-muted-foreground">
          Tamizaje confidencial. Si estás en crisis o peligro inmediato:{" "}
          <a
            href="tel:8009112000"
            className="font-bold text-teal underline decoration-teal/60 underline-offset-2 hover:decoration-teal"
          >
            Línea de la Vida 800 911 2000
          </a>{" "}
          o SAPTEL{" "}
          <a
            href="tel:8004727835"
            className="font-bold text-teal underline decoration-teal/60 underline-offset-2 hover:decoration-teal"
          >
            800 472 7835
          </a>
        </p>
      </div>

      {/* ÁREA CENTRAL DE MENSAJES (Scroll independiente) */}
      <main
        aria-label={`Tamizaje con ${BRAND.assistant}`}
        className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 overscroll-contain sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col space-y-3.5">
          {/* Tarjeta de bienvenida cuando la conversación está recién reiniciada */}
          {messages.length === 0 && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto w-full max-w-md rounded-2xl border border-primary/20 bg-card/90 p-4 text-center shadow-soft backdrop-blur-md"
            >
              <div className="mx-auto mb-2.5 grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <h2 className="text-sm font-bold text-foreground">
                Área de Psicología TESH — {BRAND.assistant}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                La atención psicológica es un proceso en el que recibes apoyo y orientación
                profesional. Aquí responderás un tamizaje breve y confidencial (GAD-7 y PHQ-9). Un
                profesional revisará tus respuestas y obtendrás tu folio para vincularlo a tu cita.
              </p>
              <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSendMessage("Hola")}
                  className="rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90"
                >
                  Comenzar tamizaje
                </Button>
              </div>
            </motion.div>
          )}

          {/* Lista de mensajes */}
          {messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <motion.div
                key={msg.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`relative max-w-[88%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed sm:max-w-[80%] sm:text-sm ${
                    isUser
                      ? // Estudiante → lavanda #C3B3F1 (texto azul profundo para contraste AA)
                        "rounded-tr-xs bg-lavender text-primary shadow-soft font-medium"
                      : // Eli → lila vívido #6857E4 (texto blanco)
                        "rounded-tl-xs border border-secondary/30 bg-secondary text-secondary-foreground shadow-soft"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Tarjeta destacada de Folio directamente en el mensaje de Eli */}
                  {!isUser && (msg.text.includes("folio") || msg.text.includes("EQ-")) && (
                    <div className="mt-3 rounded-xl border-2 border-primary/40 bg-primary/10 p-3 text-primary shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Ticket className="size-4 text-primary shrink-0" />
                          <span className="text-xs font-bold text-primary">Folio Oficial:</span>
                          <span className="font-mono text-base font-extrabold text-primary bg-background px-2.5 py-0.5 rounded-lg border border-primary/30">
                            {screeningState.folio ||
                              msg.text.match(/EQ-\d{4}/)?.[0] ||
                              (typeof window !== "undefined"
                                ? localStorage.getItem("equilibra_ultimo_folio_tamizaje")
                                : "") ||
                              "EQ-1234"}
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const f =
                              screeningState.folio ||
                              msg.text.match(/EQ-\d{4}/)?.[0] ||
                              (typeof window !== "undefined"
                                ? localStorage.getItem("equilibra_ultimo_folio_tamizaje")
                                : "") ||
                              "";
                            if (f) {
                              navigator.clipboard.writeText(f);
                              toast.success("Folio copiado al portapapeles");
                            }
                          }}
                          className="h-7 px-2.5 text-[11px] font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                        >
                          <Copy className="size-3" />
                          <span>Copiar</span>
                        </Button>
                      </div>
                      <p className="mt-1.5 text-[10px] text-muted-foreground leading-tight">
                        Escribe este folio en el apartado <strong>Agenda de Citas</strong> al
                        solicitar tu cita.
                      </p>
                    </div>
                  )}

                  <div
                    className={`mt-1 text-[10px] ${
                      isUser
                        ? "text-primary/60 text-right"
                        : "text-secondary-foreground/70 text-left"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {/* Tarjeta de emergencia si se detectó protocolo de crisis */}
                {msg.isCrisisProtocol && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2.5 w-full max-w-[94%] rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-3.5 shadow-md sm:max-w-[85%]"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="rounded-xl bg-destructive/20 p-2 text-destructive shrink-0">
                        <ShieldAlert className="size-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-xs sm:text-sm font-bold text-foreground">
                          Tu seguridad es lo más importante
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Por favor ponte en contacto de inmediato con líneas de apoyo gratuito y
                          confidencial 24/7 o acude al servicio médico de urgencias más cercano:
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <a
                            href="tel:8009112000"
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-destructive px-3 text-xs font-semibold text-destructive-foreground shadow-xs transition-transform hover:scale-102"
                          >
                            <Phone className="size-3.5" />
                            <span>Línea de la Vida (800 911 2000)</span>
                          </a>
                          <a
                            href="tel:8004727835"
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                          >
                            <Phone className="size-3.5 text-teal" />
                            <span>SAPTEL (800 472 7835)</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Mensaje de error visible con botón Reintentar si falla la función tamizaje de Supabase */}
          {submissionError && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto w-full max-w-md rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-center shadow-md space-y-2.5"
            >
              <div className="mx-auto grid size-10 place-items-center rounded-xl bg-destructive/20 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-destructive uppercase tracking-wider">
                  Error al registrar el tamizaje
                </h4>
                <p className="mt-1 text-xs text-foreground font-medium leading-relaxed">
                  {submissionError}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Tus respuestas están guardadas. Pulsa reintentar para volver a enviar.
                </p>
              </div>
              <div className="pt-1 flex justify-center">
                <Button
                  type="button"
                  onClick={handleRetrySubmission}
                  disabled={isTyping}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reintentar</span>
                </Button>
              </div>
            </motion.div>
          )}

          {/* Tarjeta de conclusión cuando el tamizaje está completo */}
          {screeningState.step === "completed" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto w-full max-w-md rounded-2xl border border-primary/30 bg-card p-5 text-center shadow-soft"
            >
              <div
                className={`mx-auto mb-2.5 grid size-11 place-items-center rounded-2xl ${
                  screeningState.nivel === "rojo"
                    ? "bg-alert/20 text-alert"
                    : screeningState.nivel === "amarillo"
                      ? "bg-lime/20 text-lime"
                      : "bg-teal/20 text-teal"
                }`}
              >
                {screeningState.nivel === "rojo" ? (
                  <ShieldAlert className="size-6" />
                ) : (
                  <CheckCircle2 className="size-6" />
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Badge
                  variant="outline"
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg ${
                    screeningState.nivel === "rojo"
                      ? "border-alert/50 bg-alert/10 text-alert"
                      : screeningState.nivel === "amarillo"
                        ? "border-lime/50 bg-lime/10 text-lime"
                        : "border-teal/50 bg-teal/10 text-teal"
                  }`}
                >
                  Nivel {screeningState.nivel || "verde"}
                </Badge>
              </div>

              <h3 className="text-base font-bold text-foreground">Tamizaje Finalizado</h3>

              {screeningState.folio && (
                <div className="my-3 rounded-xl border border-primary/30 bg-primary/5 p-3 flex flex-col items-center justify-center gap-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Tu Folio de Tamizaje
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-primary tracking-wider">
                      {screeningState.folio}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(screeningState.folio || "");
                        toast.success("Folio copiado al portapapeles");
                      }}
                      className="h-7 px-2 text-[11px] rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Escríbelo en el formulario de la Agenda para vincular tus resultados.
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground leading-relaxed">
                {screeningState.nivel === "rojo" &&
                  "Requieres atención prioritaria. Por favor agenda tu cita hoy mismo en 'Agenda de Citas' y elige TERAPIA PSICOLÓGICA."}
                {screeningState.nivel === "amarillo" &&
                  "Sería beneficioso recibir apoyo profesional. Te recomendamos agendar una cita eligiendo ORIENTACIÓN o TERAPIA PSICOLÓGICA."}
                {screeningState.nivel === "verde" &&
                  "Tus resultados no muestran señales de alerta. Si en algún momento lo deseas, puedes agendar una sesión de CONSEJERÍA."}
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => navigate({ to: "/citas" })}
                  className="rounded-xl bg-primary text-xs font-semibold text-primary-foreground gap-1.5 shadow-xs"
                >
                  <span>Ir a Agenda de Citas</span>
                </Button>
                {!isGatedByRisk && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetChat}
                    className="rounded-xl border-border bg-card text-xs font-semibold text-foreground gap-1.5 shadow-xs hover:bg-muted"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Nuevo tamizaje</span>
                  </Button>
                )}
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed sm:max-w-sm">
                  {isGatedByRisk
                    ? "Tu tamizaje ha quedado registrado y en resguardo clínico. Un profesional del TESH revisará tus respuestas. Para evitar alterar resultados, solo el área de psicología puede habilitar un nuevo tamizaje."
                    : "Tu evaluación ha sido registrada de forma confidencial. Un profesional del TESH revisará tus resultados."}
                </p>
              </div>
            </motion.div>
          )}

          {/* Indicador de escritura animado */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start"
              >
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-border/60 bg-card px-3.5 py-2.5 shadow-soft">
                  <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-2 rounded-full bg-primary animate-bounce" />
                  <span className="ml-1.5 text-xs text-muted-foreground font-medium">
                    {BRAND.assistant} está registrando...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </main>

      {/* 
        PIE DE PÁGINA PERMANENTE (Sticky, siempre visible)
        Incluye opciones rápidas (Likert/Sí-No) y campo de texto
      */}
      <footer className="sticky bottom-0 z-40 flex-none border-t border-border/80 bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur-md sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl space-y-2">
          {/* Botones de respuesta rápida cuando aplican al paso actual */}
          {quickReplies.length > 0 &&
            !isTyping &&
            !isEffectiveBlocked &&
            screeningState.step !== "completed" && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
                  Selecciona:
                </span>
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => handleSendMessage(reply)}
                    className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

          {/* Formulario de entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isEffectiveBlocked}
                placeholder={
                  isEffectiveBlocked
                    ? "El chat está finalizado. Tu tamizaje está en revisión."
                    : `Escribe tu respuesta para ${BRAND.assistant}...`
                }
                rows={1}
                className="max-h-24 min-h-[42px] w-full resize-none rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <Button
              type="submit"
              disabled={!inputText.trim() || isTyping || isEffectiveBlocked}
              aria-label="Enviar respuesta"
              className="size-10.5 shrink-0 rounded-2xl bg-primary text-primary-foreground shadow-xs hover:opacity-90 disabled:opacity-40"
            >
              <Send className="size-4" />
            </Button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>Enter para enviar • Shift + Enter para salto de línea</span>
            {!isGatedByRisk ? (
              <button
                type="button"
                onClick={handleResetChat}
                className="hover:text-primary transition-colors underline cursor-pointer"
              >
                Reiniciar tamizaje
              </button>
            ) : (
              <span className="font-medium text-muted-foreground/80">
                Tamizaje orientativo confidencial TESH
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* PANEL LATERAL DE HISTORIAL */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-card p-6">
          <SheetHeader className="text-left pb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <History className="size-4" />
              </div>
              <div>
                <SheetTitle className="font-display text-lg text-primary font-bold">
                  Historial de Tamizajes
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                  Consulta sesiones previas o inicia una nueva evaluación con {BRAND.assistant}.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {!isEffectiveBlocked ? (
              <Button
                type="button"
                onClick={handleNewConversation}
                className="w-full rounded-xl bg-primary text-primary-foreground font-semibold text-xs h-10 gap-2 shadow-xs transition-transform active:scale-98"
              >
                <Plus className="size-4" />
                <span>+ Nuevo tamizaje con {BRAND.assistant}</span>
              </Button>
            ) : (
              <div className="rounded-xl border border-lime-200 dark:border-lime-800/60 bg-lime-50/80 dark:bg-lime-950/40 p-3 text-xs text-lime-900 dark:text-lime-200">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="size-4 text-lime-600 shrink-0" />
                  Tamizaje en resguardo clínico
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Solo el psicólogo del TESH puede autorizar una nueva evaluación tras revisar tus
                  resultados para evitar alteraciones.
                </p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Sesiones Guardadas ({sessions.length})
                </p>
                {sessions.length > 1 && !isGatedByRisk && (
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="text-[11px] text-destructive hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="size-3" />
                    <span>Borrar todo</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {sessions.map((session) => {
                  const isActive = session.id === activeSession.id;
                  const isDone = session.screeningState?.step === "completed";

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => handleSelectSession(session)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? "border-primary/60 bg-primary/10 ring-1 ring-primary/30 shadow-xs"
                          : "border-border/70 bg-card hover:bg-muted/40 hover:border-border"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3
                            className={`text-xs font-bold truncate ${
                              isActive ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {session.title}
                          </h3>
                          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                            {session.updatedAt}
                          </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-1 leading-normal">
                          {session.preview || "Sin mensajes aún"}
                        </p>

                        <div className="flex items-center gap-1.5 pt-0.5">
                          {isActive && (
                            <Badge
                              variant="outline"
                              className="bg-primary/15 text-primary border-primary/30 text-[9px] font-semibold py-0 px-1.5"
                            >
                              Activa
                            </Badge>
                          )}
                          {isDone ? (
                            <Badge
                              variant="outline"
                              className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 text-[9px] font-semibold py-0 px-1.5"
                            >
                              Completado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-muted text-muted-foreground border-border text-[9px] font-semibold py-0 px-1.5"
                            >
                              {session.messages.length} mensajes
                            </Badge>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        className={`size-4 shrink-0 transition-transform ${
                          isActive ? "text-primary" : "text-muted-foreground/60"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
