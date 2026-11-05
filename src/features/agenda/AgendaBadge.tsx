import React from "react";
import type { AgendaBadgeType } from "./types";

interface AgendaBadgeProps {
  tipo: AgendaBadgeType;
  descripcion?: string;
  className?: string;
}

export const AgendaBadge: React.FC<AgendaBadgeProps> = ({ tipo, descripcion, className = "" }) => {
  const styles: Record<AgendaBadgeType, string> = {
    AUTO: "bg-[#1B198F] text-white",
    ESTUDIANTE: "bg-[#6857E4] text-white",
    PSICÓLOGO: "bg-[#6857E4] text-white",
    MIXTO: "bg-[#12BDB6] text-white",
  };

  const defaultDesc: Record<AgendaBadgeType, string> = {
    AUTO: "Sistema lo llena solo",
    ESTUDIANTE: "Estudiante interactúa",
    PSICÓLOGO: "Psicólogo interactúa",
    MIXTO: "Auto + editable",
  };

  return (
    <span
      title={descripcion || defaultDesc[tipo]}
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-xs select-none ${
        styles[tipo]
      } ${className}`}
    >
      {tipo}
    </span>
  );
};
