import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function SelectableChip({ label, selected, onToggle }: SelectableChipProps) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "h-11 rounded-full border-border/70 px-4 shadow-none",
        selected
          ? "border-teal/30 bg-mint-soft text-primary hover:bg-mint-soft"
          : "bg-card/65 text-muted-foreground hover:bg-lavender-soft hover:text-primary",
      )}
    >
      {selected && <Check className="size-4 text-teal" aria-hidden="true" />}
      {label}
    </Button>
  );
}
