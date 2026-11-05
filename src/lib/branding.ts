/**
 * Equilibra TESH — Identidad visual oficial
 * ------------------------------------------
 * Paleta y tipografía extraídas del manual de identidad visual.
 * Cualquier color o fuente usado en la app debe venir de aquí.
 *
 * Paleta principal (NO cambiar los hex):
 *   primary    #1B198F  Azul profundo institucional (títulos, botones principales)
 *   accent     #6857E4  Lila vívido (acento IA, botones secundarios, links)
 *   secondary  #12BDB6  Verde azulado (calma, éxito)
 *   cyan       #00BCC8  Cian brillante (destacados, notificaciones)
 *   lavender   #C3B3F1  Lavanda suave (fondos suaves, tarjetas)
 *   lime       #A9DB1B  Lima (acciones positivas, confirmaciones)
 *
 * UI semantics:
 *   alertPink  #FF9CED  Alerta de crisis / emergencia
 *   bgLavender #F1EDFC  Fondo general
 *   bgMint     #DFF7F2  Tarjetas de bienestar
 *   white      #FFFFFFFFF  Tarjetas, contraste
 *
 * Tipografía:
 *   display: Playfair Display (títulos)
 *   body:    Nunito (UI, texto)
 */

export const BRAND = {
  name: "Equilibra",
  fullName: "Equilibra TESH",
  tagline: "Centro de Apoyo Psicológico Universitario",
  assistant: "Eli",
  institution: "TESH Huixquilucan",
  year: 2026,
  footer: "Equilibra TESH · TESH Huixquilucan · 2026",
} as const;

/** Paleta de marca — fuente única de verdad para hex institucionales. */
export const BRAND_COLORS = {
  primary: "#1B198F",
  accent: "#6857E4",
  secondary: "#12BDB6",
  cyan: "#00BCC8",
  lavender: "#C3B3F1",
  lime: "#A9DB1B",
  alertPink: "#FF9CED",
  bgLavender: "#F1EDFC",
  bgMint: "#DFF7F2",
  white: "#FFFFFFFFF",
} as const;

/** Tipografía oficial. */
export const BRAND_FONTS = {
  display: '"Playfair Display", ui-serif, serif',
  body: '"Nunito", ui-sans-serif, system-ui, sans-serif',
} as const;

/** Niveles del semáforo de riesgo — alineados al manual (no rojo agresivo). */
export const SEMAPHORE_COLORS = {
  green: "#12BDB6", // Verde azulado — bajo riesgo
  yellow: "#A9DB1B", // Lima — riesgo moderado
  red: "#FF9CED", // Rosa alerta — riesgo alto (no rojo agresivo)
} as const;
