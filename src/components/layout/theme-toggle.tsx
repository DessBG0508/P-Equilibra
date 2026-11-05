import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`relative inline-flex size-11 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground shadow-soft backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      {isDark ? (
        <Sun className="size-5 text-lime-300 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="size-5 text-primary transition-transform duration-300 -rotate-12 scale-100" />
      )}
    </button>
  );
}
