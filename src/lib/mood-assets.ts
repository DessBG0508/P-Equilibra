/**
 * Catálogo centralizado de assets del Emocionómetro (Equilibra TESH).
 * Bitácora 5.43 — Rutas públicas locales para evitar dependencias externas o prototipos.
 *
 * Cada estado cuenta con ruta absoluta a /public/, escala clínica (1-5),
 * etiquetas accesibles (alt y aria-label) sin emojis.
 */

export interface MoodAssetItem {
  id: string;
  value: number; // Escala 1 (Feliz) a 5 (Muy mal)
  label: string;
  src: string;
  alt: string;
  ariaLabel: string;
}

export const MOOD_ASSETS = {
  feliz: {
    id: "muy-bien",
    value: 1,
    label: "Feliz",
    src: "/emocionometro/mood-feliz.png",
    alt: "Estrella amarilla y radiante con semblante alegre",
    ariaLabel: "Estado de ánimo: Feliz (Nivel 1)",
  },
  bien: {
    id: "bien",
    value: 2,
    label: "Bien",
    src: "/emocionometro/mood-bien.png",
    alt: "Nube verde azulada sonriente con gesto afable",
    ariaLabel: "Estado de ánimo: Bien (Nivel 2)",
  },
  normal: {
    id: "regular",
    value: 3,
    label: "Normal",
    src: "/emocionometro/mood-normal.png",
    alt: "Nube suave en tonos lilas con expresión neutra y serena",
    ariaLabel: "Estado de ánimo: Normal (Nivel 3)",
  },
  triste: {
    id: "triste",
    value: 4,
    label: "Triste",
    src: "/emocionometro/mood-triste.png",
    alt: "Gota azul melancólica con pequeñas gotas a los costados",
    ariaLabel: "Estado de ánimo: Triste (Nivel 4)",
  },
  muyMal: {
    id: "muy-mal",
    value: 5,
    label: "Muy mal",
    src: "/emocionometro/mood-muy-mal.png",
    alt: "Nube de tormenta con relámpagos y semblante abrumado",
    ariaLabel: "Estado de ánimo: Muy mal (Nivel 5)",
  },
} as const;

export const MOOD_ASSETS_LIST: MoodAssetItem[] = [
  MOOD_ASSETS.feliz,
  MOOD_ASSETS.bien,
  MOOD_ASSETS.normal,
  MOOD_ASSETS.triste,
  MOOD_ASSETS.muyMal,
];

export type MoodAssetKey = keyof typeof MOOD_ASSETS;
