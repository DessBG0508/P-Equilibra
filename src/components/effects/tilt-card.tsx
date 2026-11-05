import type { ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

export function TiltCard({ children, className = "" }: TiltCardProps) {
  return <div className={className}>{children}</div>;
}
