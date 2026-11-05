import React, { useState, useEffect, useCallback } from "react";
import { Mic, Clock, FileAudio, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EscucharVozNota } from "@/components/voz/EscucharVozNota";
import { supabase } from "@/integrations/supabase/client";
import type { PacienteParaPsicologo } from "./semaforo-pacientes";

export interface NotaVoz {
  id: string;
  folio?: string | null;
  transcripcion: string;
  duracion_seg?: number | null;
  creado_en?: string | null;
}

interface NotasVozModalProps {
  paciente: PacienteParaPsicologo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotasVozModal({ paciente, open, onOpenChange }: NotasVozModalProps) {
  const [notas, setNotas] = useState<NotaVoz[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchNotas = useCallback(async () => {
    if (!paciente?.folio) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Consulta a la tabla notas_voz en Supabase
      const { data, error } = await supabase
        .from("notas_voz")
        .select("*")
        .eq("folio_tamizaje", paciente.folio)
        .order("creado_en", { ascending: false });

      if (error) {
        console.warn("Aviso al consultar notas_voz:", error);
        // Si la tabla no tiene registros para este folio específico, no es un error crítico
        setNotas([]);
      } else if (data && data.length > 0) {
        setNotas(data as NotaVoz[]);
      } else {
        setNotas([]);
      }
    } catch (err: unknown) {
      console.warn("Excepción al cargar notas_voz:", err);
      setErrorMessage("No fue posible cargar las notas de voz en este momento.");
    } finally {
      setIsLoading(false);
    }
  }, [paciente?.folio]);

  useEffect(() => {
    if (open && paciente?.folio) {
      fetchNotas();
    } else {
      setNotas([]);
      setErrorMessage(null);
    }
  }, [open, paciente?.folio, fetchNotas]);

  const formatFecha = (fechaStr?: string | null) => {
    if (!fechaStr) return "Fecha no registrada";
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return "Fecha no registrada";
      return format(d, "dd MMM yyyy, HH:mm 'hrs'", { locale: es });
    } catch {
      return "Fecha no registrada";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <DialogHeader className="p-6 border-b border-border/70 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#6857E4]/15 text-[#6857E4] dark:text-[#C3B3F1]">
                <FileAudio className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Notas de Voz del Paciente</span>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs border-[#6857E4]/40 text-[#6857E4]"
                  >
                    {paciente?.folio}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Estudiante: <strong className="text-foreground">{paciente?.iniciales}</strong> ·{" "}
                  {paciente?.carrera || "Carrera institucional"}
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fetchNotas}
              disabled={isLoading}
              title="Actualizar notas de voz"
              aria-label="Actualizar notas de voz"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`size-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-lime-500/30 bg-lime-500/10 p-4 text-xs text-lime-800 dark:text-lime-200 flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 text-lime-600 dark:text-lime-400 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Verifica tu conexión o los permisos de acceso al acompañamiento clínico.
                </p>
              </div>
            </div>
          ) : notas.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-border/80 bg-muted/20 space-y-2">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Mic className="size-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                Sin notas de voz registradas
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                El estudiante {paciente?.iniciales || "registrado"} aún no ha enviado grabaciones de
                voz en el chat con Eli o sus respuestas fueron solo por texto.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notas.map((nota, index) => (
                <div
                  key={nota.id || index}
                  className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-3 transition-colors hover:border-[#6857E4]/40"
                >
                  {/* Metadatos de la nota */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/60">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Clock className="size-3.5 text-[#6857E4]" />
                      <span>{formatFecha(nota.creado_en)}</span>
                    </span>

                    {typeof nota.duracion_seg === "number" && nota.duracion_seg > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-muted text-[10px] font-mono font-medium px-2 py-0.5"
                      >
                        {nota.duracion_seg} seg de grabación
                      </Badge>
                    )}
                  </div>

                  {/* Texto transcrito por IA */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Transcripción del estudiante:
                    </span>
                    <p className="text-xs sm:text-sm text-foreground bg-muted/30 p-3 rounded-xl border border-border/50 leading-relaxed font-medium select-text">
                      &ldquo;{nota.transcripcion}&rdquo;
                    </p>
                  </div>

                  {/* REPRODUCTOR DE VOZ DE ELI */}
                  <div className="pt-1">
                    <EscucharVozNota
                      transcripcion={nota.transcripcion}
                      className="border-border/60 bg-muted/20"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NotasVozModal;
