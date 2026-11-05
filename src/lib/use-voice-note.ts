import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const MAX_DURATION_SEC = 60;

export interface UseVoiceNoteReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  transcripcion: string | null;
  error: string | null;
  durationSec: number;
  startRecording: () => Promise<void>;
  stopRecording: (folio?: string) => Promise<string | null>;
  resetState: () => void;
}

export function useVoiceNote(): UseVoiceNoteReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcripcion, setTranscripcion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const currentFolioRef = useRef<string | undefined>(undefined);
  const mimeTypeRef = useRef<string>("audio/webm");
  const durationRef = useRef(0);

  // Resolver for stopRecording promise
  const stopResolverRef = useRef<((text: string | null) => void) | null>(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    cleanupStream();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
    setTranscripcion(null);
    setError(null);
    setDurationSec(0);
    durationRef.current = 0;
    stopResolverRef.current = null;
  }, [cleanupStream]);

  // Convert blob to raw base64 (without data:... prefix)
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (!result) {
          reject(new Error("No se pudo procesar el archivo de audio"));
          return;
        }
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Error al leer los datos de audio"));
      reader.readAsDataURL(blob);
    });
  };

  const handleAudioProcessing = useCallback(
    async (blob: Blob, duration: number, folio?: string): Promise<string | null> => {
      if (blob.size === 0) {
        const errMsg = "No se grabó ningún sonido. Intenta hablar más cerca del micrófono.";
        setError(errMsg);
        return null;
      }

      setIsTranscribing(true);
      setError(null);

      try {
        const audio_base64 = await blobToBase64(blob);

        // Invoke Supabase Edge Function: transcribir-voz
        const { data, error: fnError } = await supabase.functions.invoke("transcribir-voz", {
          body: {
            audio_base64,
            folio: folio || undefined,
            duracion_seg: duration,
            mime_type: mimeTypeRef.current.split(";")[0] || "audio/webm",
          },
        });

        if (fnError) {
          throw new Error(fnError.message || "Error al conectar con el servicio de transcripción");
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        const text = typeof data?.transcripcion === "string" ? data.transcripcion.trim() : "";
        if (!text) {
          throw new Error("No se pudo detectar audio entendible en la grabación");
        }

        setTranscripcion(text);
        return text;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Ocurrió un error al transcribir tu nota de voz. Por favor, intenta de nuevo.";
        setError(errorMessage);
        return null;
      } finally {
        setIsTranscribing(false);
        // Data minimization (LFPDPPP): audio binary is dropped from memory immediately
        chunksRef.current = [];
      }
    },
    [],
  );

  const stopRecording = useCallback(
    async (folio?: string): Promise<string | null> => {
      if (folio !== undefined) {
        currentFolioRef.current = folio;
      }

      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        return null;
      }

      return new Promise<string | null>((resolve) => {
        stopResolverRef.current = resolve;
        try {
          recorder.stop();
        } catch {
          cleanupStream();
          resolve(null);
        }
      });
    },
    [cleanupStream],
  );

  const startRecording = useCallback(async () => {
    // MediaRecorder / getUserMedia support check
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function" ||
      typeof window.MediaRecorder === "undefined"
    ) {
      setError("Tu navegador no soporta notas de voz. Usa Chrome o Edge, o escribe tu mensaje.");
      return;
    }

    resetState();

    try {
      // Pick best supported MIME type
      let selectedMime = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        selectedMime = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        selectedMime = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        selectedMime = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        selectedMime = "audio/ogg;codecs=opus";
      }
      mimeTypeRef.current = selectedMime;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: selectedMime });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        cleanupStream();
        const recordedBlob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        const finalDuration = durationRef.current;
        const result = await handleAudioProcessing(
          recordedBlob,
          finalDuration,
          currentFolioRef.current,
        );

        if (stopResolverRef.current) {
          stopResolverRef.current(result);
          stopResolverRef.current = null;
        }
      };

      recorder.onerror = () => {
        cleanupStream();
        setError("Error en la grabación de audio. Por favor intenta de nuevo.");
        setIsRecording(false);
        if (stopResolverRef.current) {
          stopResolverRef.current(null);
          stopResolverRef.current = null;
        }
      };

      recorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
      setDurationSec(0);
      durationRef.current = 0;

      // Timer
      timerRef.current = window.setInterval(() => {
        setDurationSec((prev) => {
          const next = prev + 1;
          durationRef.current = next;
          if (next >= MAX_DURATION_SEC) {
            // Auto stop at max duration
            void stopRecording(currentFolioRef.current);
          }
          return next;
        });
      }, 1000);
    } catch (err: unknown) {
      cleanupStream();
      setIsRecording(false);
      const isDenied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      if (isDenied) {
        setError("Permiso de micrófono denegado. Permite el acceso al micrófono en tu navegador.");
      } else {
        setError(
          "No se pudo iniciar la grabación de audio. Revisa tu micrófono e inténtalo de nuevo.",
        );
      }
    }
  }, [cleanupStream, handleAudioProcessing, resetState, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [cleanupStream]);

  return {
    isRecording,
    isTranscribing,
    transcripcion,
    error,
    durationSec,
    startRecording,
    stopRecording,
    resetState,
  };
}
