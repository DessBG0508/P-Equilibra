import React from "react";
import { BadgeOrigen } from "./BadgeOrigen";
import type { TrazabilidadData } from "./types";
import { ShieldCheck, ExternalLink } from "lucide-react";

interface TrazabilidadBlockchainProps {
  trazabilidad: TrazabilidadData;
  nombrePsicologo?: string;
  txHashUrl?: string;
}

export const TrazabilidadBlockchain: React.FC<TrazabilidadBlockchainProps> = ({
  trazabilidad,
  nombrePsicologo,
  txHashUrl = "https://amoy.polygonscan.com",
}) => {
  const hashExpediente =
    trazabilidad.hash_expediente ||
    "b39d53c832f8817b269139b9eee358e4ec3fc8b57240cd5896dc9f36bd8b94b5";
  const hashPrevio =
    trazabilidad.hash_previo || "290c15c14f5364eec5ae6b472820036161cb7b067b051b318c3bc102067d31a0";
  const ancladoEn = trazabilidad.anclado_en || "0x7f3b...e8a4 (tx hash) — 30-oct-2026 14:23 UTC";
  const liberadoPor =
    trazabilidad.liberado_por ||
    (nombrePsicologo
      ? `Dr(a). ${nombrePsicologo}`
      : "Dr. Psicología TESH (auto desde liberar_paciente RPC)");

  return (
    <div className="space-y-4">
      {/* Encabezado de Sección Canva Style */}
      <div className="flex flex-col gap-1 rounded-2xl bg-[#1B198F] px-4 py-3 text-white shadow-md sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6857E4] text-sm font-black text-white">
            10
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight text-white">
            Trazabilidad blockchain
          </h3>
        </div>
        <span className="text-xs font-normal text-violet-200 sm:ml-2">
          Auto-filled · hash de auditoría del expediente
        </span>
      </div>

      <div className="rounded-3xl border border-[#C3B3F1] bg-white p-5 shadow-xs dark:border-violet-950/60 dark:bg-[#1a1b35] sm:p-7">
        <div className="divide-y divide-border/60">
          {/* Hash del expediente */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">
              Hash del expediente:
            </span>
            <div className="break-all font-mono text-[11px] font-semibold text-[#1B198F] dark:text-violet-300 sm:w-1/2">
              {hashExpediente}
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="AUTOMÁTICO" />
            </div>
          </div>

          {/* Hash previo */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Hash previo:</span>
            <div className="break-all font-mono text-[11px] font-medium text-muted-foreground sm:w-1/2">
              {hashPrevio}
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="AUTOMÁTICO" />
            </div>
          </div>

          {/* Anclado en Polygon Amoy */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">
              Anclado en Polygon Amoy:
            </span>
            <div className="flex items-center gap-2 text-xs font-medium text-foreground sm:w-1/2">
              <ShieldCheck className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>{ancladoEn}</span>
              <a
                href={txHashUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-[#6857E4] hover:underline"
                aria-label="Ver transacción en explorador Polygon"
              >
                <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="AUTOMÁTICO" />
            </div>
          </div>

          {/* Liberado por */}
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground sm:w-1/3">Liberado por:</span>
            <span className="text-xs font-semibold text-foreground sm:w-1/2">{liberadoPor}</span>
            <div className="sm:w-1/6 sm:text-right">
              <BadgeOrigen tipo="AUTOMÁTICO" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
