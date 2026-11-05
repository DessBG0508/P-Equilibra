import React, { useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle, Send, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useVoiceNote, MAX_DURATION_SEC } from "@/lib/use-voice-note";
import { cn } from "@/lib/utils";

export interface VoiceNoteRecorderProps {
  onTranscriptionReady: (texto: string) => void;
  folio?: string;
  disabled?: boolean;
  className?: string;
}

export function VoiceNoteRecorder({
  onTranscriptionReady,
  folio,
  disabled = false,
  className,
}: VoiceNoteRecorderProps) {
  const {
    isRecording,
    isTranscribing,
    transcripcion,
    error,
    durationSec,
    startRecording,
    stopRecording,
    resetState,
  } = useVoiceNote();

  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Keyboard shortcut support (Escape to cancel/reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isRecording || isTranscribing || transcripcion || error)) {
        resetState();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecording, isTranscribing, transcripcion, error, resetState]);

  const handleMainButtonClick = async () => {
    if (disabled) return;

    if (isRecording) {
      await stopRecording(folio);
    } else if (!isTranscribing) {
      await startRecording();
    }
  };

  const handleSend = () => {
    if (transcripcion) {
      onTranscriptionReady(transcripcion);
      resetState();
    }
  };

  const handleReRecord = async () => {
    resetState();
    await startRecording();
  };

  const progressPercent = Math.min(100, (durationSec / MAX_DURATION_SEC) * 100);

  return (
    <div
      role="region"
      aria-label="Grabadora de notas de voz para tamizaje"
      className={cn("flex flex-col gap-2 w-full", className)}
    >
      {/* Transcribed Text Preview Bubble */}
      {transcripcion && !isTranscribing && (
        <div
          className="rounded-xl border border-border bg-card p-3.5 shadow-sm text-card-foreground transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-2"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-[#6857E4]/15 text-[#1B198F] dark:text-[#C3B3F1] border-0 text-xs font-semibold px-2 py-0.5"
              >
                Nota de voz
              </Badge>
              <span className="text-xs text-muted-foreground">Transcripción generada</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Presiona Enviar o revisa el texto
            </span>
          </div>

          <p className="text-sm font-medium leading-relaxed text-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50 mb-3 select-text">
            {transcripcion}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetState}
              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2.5"
              title="Descartar nota de voz (Esc)"
              aria-label="Borrar nota de voz"
            >
              <Trash2 className="size-3.5 mr-1.5" />
              Borrar
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReRecord}
              className="text-xs h-8 px-2.5"
              title="Volver a grabar"
              aria-label="Regrabar nota de voz"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Regrabar
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              className="bg-[#1B198F] hover:bg-[#1B198F]/90 text-white text-xs font-medium h-8 px-3 shadow-xs"
              aria-label="Enviar transcripción a Eli"
            >
              <Send className="size-3.5 mr-1.5" />
              Enviar a Eli
            </Button>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-lime-500/30 bg-lime-500/10 p-2.5 text-xs text-lime-700 dark:text-lime-300 flex items-start gap-2 animate-in fade-in-50"
        >
          <AlertCircle className="size-4 shrink-0 text-lime-600 dark:text-lime-400 mt-0.5" />
          <div className="flex-1 flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetState}
              className="h-6 px-1.5 text-xs hover:bg-lime-500/20 text-lime-800 dark:text-lime-200"
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {/* Recording status bar and recording button */}
      <div className="flex items-center gap-3">
        {/* Main Recording / State Trigger Button */}
        <div className="relative shrink-0">
          {/* Animated ping ring when actively recording */}
          {isRecording && (
            <span
              className="absolute -inset-1 rounded-full bg-destructive/30 animate-ping pointer-events-none"
              aria-hidden="true"
            />
          )}

          <Button
            type="button"
            disabled={disabled || isTranscribing}
            onClick={handleMainButtonClick}
            aria-label={
              isRecording
                ? "Detener grabación de audio"
                : isTranscribing
                  ? "Transcribiendo nota de voz..."
                  : error
                    ? "Error de grabación. Clic para reintentar"
                    : "Grabar nota de voz para Eli"
            }
            className={cn(
              "rounded-full transition-all duration-300 shadow-md flex items-center justify-center p-0",
              // Mobile: size-14 (3.5rem), Desktop: size-12 (3rem)
              "size-14 sm:size-12",
              // Idle state
              !isRecording &&
                !isTranscribing &&
                !error &&
                "bg-[#1B198F] text-white hover:bg-[#1B198F]/90 dark:bg-[#6857E4] dark:hover:bg-[#6857E4]/90",
              // Recording state
              isRecording &&
                "bg-destructive text-white hover:bg-destructive/90 ring-4 ring-destructive/30 animate-pulse",
              // Transcribing state
              isTranscribing && "bg-[#6857E4]/20 text-[#1B198F] dark:text-[#C3B3F1] cursor-wait",
              // Error state
              error && "bg-lime-500 text-white hover:bg-lime-600",
            )}
          >
            {isRecording ? (
              <Square className="size-5 fill-current" />
            ) : isTranscribing ? (
              <Loader2 className="size-5 animate-spin" />
            ) : error ? (
              <AlertCircle className="size-5" />
            ) : (
              <Mic className="size-5" />
            )}
          </Button>
        </div>

        {/* Dynamic Status / Progress while recording */}
        {isRecording && (
          <div className="flex-1 flex flex-col gap-1.5 min-w-0 animate-in fade-in-50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-destructive flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-destructive animate-ping" />
                Grabando...
              </span>
              <span className="font-mono tabular-nums text-foreground font-medium">
                {formatTime(durationSec)} / {formatTime(MAX_DURATION_SEC)}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-1.5 bg-destructive/15 [&>div]:bg-destructive transition-all"
            />
            <span className="text-[11px] text-muted-foreground">
              Habla claro y pausa cuando termines (máx 60s)
            </span>
          </div>
        )}

        {/* Dynamic Status while transcribing */}
        {isTranscribing && (
          <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in-50">
            <Loader2 className="size-4 animate-spin text-[#6857E4] shrink-0" />
            <span>Transcribiendo audio con inteligencia artificial...</span>
          </div>
        )}

        {/* Idle Helper Text when not recording or transcribing */}
        {!isRecording && !isTranscribing && !transcripcion && !error && (
          <div className="hidden sm:flex flex-col text-xs text-muted-foreground leading-tight">
            <span className="font-medium text-foreground">Nota de voz</span>
            <span className="text-[11px]">Toca el micrófono para hablar en vez de escribir</span>
          </div>
        )}
      </div>
    </div>
  );
}
