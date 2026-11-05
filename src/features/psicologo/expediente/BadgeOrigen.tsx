import React from "react";
import type { BadgeType } from "./types";

interface BadgeOrigenProps {
  tipo: BadgeType;
  className?: string;
}

export const BadgeOrigen: React.FC<BadgeOrigenProps> = ({ tipo, className = "" }) => {
  const styles: Record<BadgeType, string> = {
    AUTOMÁTICO: "bg-[#1B198F] text-white border-transparent",
    MIXTO: "bg-[#12BDB6] text-white border-transparent",
    PSICÓLOGO: "bg-[#6857E4] text-white border-transparent",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-xs select-none ${
        styles[tipo]
      } ${className}`}
    >
      {tipo}
    </span>
  );
};
