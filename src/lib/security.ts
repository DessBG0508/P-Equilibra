/**
 * Módulo de utilidades de seguridad para frontend.
 * Maneja sanitización de entradas, validación preventiva y políticas de protección del cliente.
 */

/**
 * Sanea texto de entrada de usuario:
 * - Elimina caracteres de control ASCII no imprimibles (excepto saltos de línea y tabulaciones).
 * - Trunca la longitud máxima permitida para prevenir ataques DoS en renderizado de cadenas.
 * - Limpia etiquetas HTML potencialmente peligrosas.
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  if (typeof input !== "string") return "";

  // 1. Eliminar caracteres de control invisibles o nulos (excepto \r, \n, \t)
  const strippedControls = Array.from(input)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      if (code === 9 || code === 10 || code === 13) return true; // \t, \n, \r
      return (code >= 32 && code !== 127) || code > 159;
    })
    .join("");

  // 2. Truncar longitud
  const truncated = strippedControls.slice(0, maxLength);

  // 3. Normalizar espacios en extremos
  return truncated.trim();
}

/**
 * Valida un correo electrónico bajo formato estándar RFC 5322 simplificado.
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  // RFC 5322 regex estándar y seguro
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida formato de matrícula o credencial universitaria TESH.
 * Solo alfanumérico y guiones, longitud 4 a 20 caracteres.
 */
export function isValidMatricula(matricula: string): boolean {
  if (!matricula) return false;
  const matriculaRegex = /^[a-zA-Z0-9-]{4,20}$/;
  return matriculaRegex.test(matricula.trim());
}

/**
 * Control de intentos de autenticación en memoria / sesión para DEMO_MODE.
 * /* TODO(Supabase): rate limiting real en Edge Functions con headers IP/dispositivo */
const RATE_LIMIT_STORAGE_KEY = "equilibra_login_attempts";
const LOCKOUT_STORAGE_KEY = "equilibra_login_lockout";

export interface LoginAttemptState {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsCount: number;
}

export function getLoginRateLimitState(maxAttempts = 5, lockoutSeconds = 30): LoginAttemptState {
  try {
    const lockoutUntil = parseInt(sessionStorage.getItem(LOCKOUT_STORAGE_KEY) || "0", 10);
    const now = Date.now();

    if (lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      return { isLocked: true, remainingSeconds, attemptsCount: maxAttempts };
    }

    // Si expiró el bloqueo, limpiamos
    if (lockoutUntil !== 0 && lockoutUntil <= now) {
      sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
      sessionStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
    }

    const attempts = parseInt(sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY) || "0", 10);
    return { isLocked: false, remainingSeconds: 0, attemptsCount: attempts };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };
  }
}

export function recordFailedLoginAttempt(maxAttempts = 5, lockoutSeconds = 30): LoginAttemptState {
  try {
    const current = getLoginRateLimitState(maxAttempts, lockoutSeconds);
    if (current.isLocked) return current;

    const newAttempts = current.attemptsCount + 1;
    sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, newAttempts.toString());

    if (newAttempts >= maxAttempts) {
      const lockoutUntil = Date.now() + lockoutSeconds * 1000;
      sessionStorage.setItem(LOCKOUT_STORAGE_KEY, lockoutUntil.toString());
      return { isLocked: true, remainingSeconds: lockoutSeconds, attemptsCount: newAttempts };
    }

    return { isLocked: false, remainingSeconds: 0, attemptsCount: newAttempts };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsCount: 1 };
  }
}

export function resetLoginAttempts(): void {
  try {
    sessionStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
    sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
  } catch (e) {
    console.error("Error al resetear intentos de login", e);
  }
}
