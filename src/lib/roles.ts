/**
 * Catálogo y mapeo oficial de roles de la Base de Datos (enum app_role en Supabase).
 *
 * DECISIÓN DE ARQUITECTURA:
 * El rol directivo / jefatura de carrera se representa con el valor "jefatura" (y "coordinador")
 * del enum de la BD; la ruta de UI es "/directivo".
 * La rama "directivo" se eliminó por ser un rol inexistente en la BD.
 */

export type AppRole = "estudiante" | "psicologo" | "jefatura" | "coordinador";

export function rutaPorRol(rol?: string | null): string {
  switch (rol) {
    case "psicologo":
      return "/psicologo";
    case "jefatura":
    case "coordinador":
      return "/directivo";
    default:
      return "/";
  }
}
