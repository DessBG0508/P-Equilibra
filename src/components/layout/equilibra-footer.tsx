import { BRAND } from "@/lib/branding";

/**
 * Footer institucional — aparece en todas las pantallas envueltas en PageShell.
 * Sticky al fondo (mt-auto en layout flex), respeta safe-area iOS.
 */
export function EquilibraFooter() {
  return (
    <footer className="mt-10 border-t border-lavender/40 py-6 text-center" role="contentinfo">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground">{BRAND.footer}</p>
      <p className="mt-1 text-[10px] text-muted-foreground/70">
        Centro de Apoyo Psicológico Universitario · {BRAND.institution}
      </p>
    </footer>
  );
}
