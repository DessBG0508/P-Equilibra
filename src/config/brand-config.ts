// Configuración centralizada de marca, logo e ilustraciones del emocionómetro.
// Permite cambiar, editar o sustituir iconos e imágenes fácilmente en un solo lugar.

import type { MoodId } from "@/lib/types";
import { BRAND } from "@/lib/branding";

export interface BrandConfig {
  institutionName: string;
  appName: string;
  brandSubtext: string;
  logoUrl?: string | undefined; // Opcional: si se desea cargar una imagen PNG directa para el logo
}

export const brandConfig: BrandConfig = {
  institutionName: "TESH Huixquilucan — Centro de Apoyo Psicológico Universitario",
  appName: BRAND.fullName.toUpperCase(),
  brandSubtext: BRAND.tagline,
  logoUrl: undefined, // Si se define una URL de imagen, EquilibraBrand la usará como primera opción
};

export interface MoodIllustrationConfig {
  id: MoodId;
  label: string;
  src: string;
  alt: string;
  description: string;
}

export const moodIllustrationsConfig: Record<MoodId, MoodIllustrationConfig> = {
  "muy-bien": {
    id: "muy-bien",
    label: "Excelente",
    src: "/emocionometro/mood-feliz.png",
    alt: "Estrella sonriente y luminosa",
    description: "Te sientes con energía, vitalidad y apertura emocional",
  },
  bien: {
    id: "bien",
    label: "Bien",
    src: "/emocionometro/mood-bien.png",
    alt: "Nube suave y alegre",
    description: "Te sientes con tranquilidad y buen ánimo para tus actividades",
  },
  regular: {
    id: "regular",
    label: "Regular",
    src: "/emocionometro/mood-normal.png",
    alt: "Nube con expresión neutra",
    description: "Te sientes en balance o con un nivel manejable de cansancio",
  },
  triste: {
    id: "triste",
    label: "Triste",
    src: "/emocionometro/mood-triste.png",
    alt: "Gota de agua con semblante melancólico",
    description: "Sientes desánimo, vulnerabilidad o ganas de desconectar",
  },
  "muy-mal": {
    id: "muy-mal",
    label: "Muy mal",
    src: "/emocionometro/mood-muy-mal.png",
    alt: "Nube con tormenta y relámpago",
    description: "Sientes sobrecarga, dolor emocional o angustia intensa",
  },
};
