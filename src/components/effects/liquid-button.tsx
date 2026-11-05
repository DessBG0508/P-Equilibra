import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LiquidButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl bg-[#1B198F] text-white shadow-soft transition-colors hover:bg-[#1B198F]/90 active:scale-[0.99]"
    >
      <span className="relative z-10">{children}</span>
      <ArrowUpRight className="relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Button>
  );
}
