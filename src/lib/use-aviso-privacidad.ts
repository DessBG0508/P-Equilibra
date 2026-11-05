import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const AVISO_PRIVACIDAD_VERSION_ACTUAL = "1.0";
const SYNC_EVENT_NAME = "equilibra_aviso_privacidad_sync";

export interface AvisoPrivacidadStatus {
  needsAcceptance: boolean;
  isLoading: boolean;
  versionAceptada: string | null;
  fechaAceptacion: string | null;
  acceptAviso: (version?: string, modoAcompanamiento?: boolean) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export interface StoredAvisoInfo {
  aceptado: boolean;
  version: string | null;
  fecha: string | null;
}

/**
 * Genera la clave de localStorage scoped por user_id.
 */
export function getAvisoStorageKey(userId: string): string {
  return `equilibra_aviso_aceptado_${userId}`;
}

/**
 * Lee el estado del aviso desde localStorage para un usuario específico.
 */
export function getStoredAviso(userId?: string | null): StoredAvisoInfo | null {
  if (!userId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getAvisoStorageKey(userId));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          aceptado: Boolean(parsed.aceptado),
          version: typeof parsed.version === "string" ? parsed.version : null,
          fecha: typeof parsed.fecha === "string" ? parsed.fecha : null,
        };
      }
    } catch {
      if (raw === "true") {
        return {
          aceptado: true,
          version: AVISO_PRIVACIDAD_VERSION_ACTUAL,
          fecha: null,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Limpia todas las claves del localStorage que comiencen con equilibra_aviso_aceptado_
 * (y claves legadas) al cerrar sesión.
 */
export function clearAllAvisoStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("equilibra_aviso_aceptado_") ||
          key.startsWith("equilibra_aviso_privacidad_"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error("Error al limpiar claves de aviso en localStorage:", err);
  }
}

export function useAvisoPrivacidad(): AvisoPrivacidadStatus {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Inicialización síncrona scoped exclusivamente al user.id actual (evita falsos positivos de otros usuarios)
  const [needsAcceptance, setNeedsAcceptance] = useState<boolean>(() => {
    if (!user?.id) return false;
    const stored = getStoredAviso(user.id);
    if (stored?.aceptado && stored.version === AVISO_PRIVACIDAD_VERSION_ACTUAL) {
      return false;
    }
    return true;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [versionAceptada, setVersionAceptada] = useState<string | null>(() => {
    if (!user?.id) return null;
    return getStoredAviso(user.id)?.version ?? null;
  });

  const [fechaAceptacion, setFechaAceptacion] = useState<string | null>(() => {
    if (!user?.id) return null;
    return getStoredAviso(user.id)?.fecha ?? null;
  });

  const checkAviso = useCallback(async () => {
    if (isAuthLoading) return;

    if (!user?.id) {
      setIsLoading(false);
      setNeedsAcceptance(false);
      setVersionAceptada(null);
      setFechaAceptacion(null);
      return;
    }

    // 1. Verificación síncrona scoped en localStorage para el usuario actual
    const stored = getStoredAviso(user.id);
    if (stored?.aceptado && stored.version === AVISO_PRIVACIDAD_VERSION_ACTUAL) {
      setNeedsAcceptance(false);
      setVersionAceptada(stored.version);
      setFechaAceptacion(stored.fecha);
    } else {
      setNeedsAcceptance(true);
      setVersionAceptada(null);
      setFechaAceptacion(null);
    }

    // 2. Fuente de verdad: Consulta en Supabase
    let bdAceptado = false;
    let bdVersion: string | null = null;
    let bdFecha: string | null = null;

    try {
      // 2a. Consulta a la tabla avisos_aceptados
      const { data: avisoData, error: avisoError } = await supabase
        .from("avisos_aceptados")
        .select("user_id, version_aviso, fecha_aceptacion")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!avisoError && avisoData && avisoData.version_aviso) {
        bdAceptado = true;
        bdVersion = avisoData.version_aviso;
        bdFecha = avisoData.fecha_aceptacion ?? null;
      }
    } catch (e) {
      console.warn("Aviso al consultar avisos_aceptados:", e);
    }

    // 2b. Fallback a la tabla profiles si avisos_aceptados aún no tiene el registro
    if (!bdAceptado) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("aviso_privacidad_aceptado, aviso_privacidad_version, aviso_privacidad_fecha")
          .eq("id", user.id)
          .maybeSingle();

        if (!profileError && profileData && profileData.aviso_privacidad_aceptado === true) {
          bdAceptado = true;
          bdVersion = profileData.aviso_privacidad_version || AVISO_PRIVACIDAD_VERSION_ACTUAL;
          bdFecha = profileData.aviso_privacidad_fecha ?? null;
        }
      } catch (e) {
        console.warn("Aviso al consultar profiles:", e);
      }
    }

    // 3. Evaluar necesidad de aceptación
    const versionCoincide = bdVersion === AVISO_PRIVACIDAD_VERSION_ACTUAL;
    const debeAceptar = !(bdAceptado && versionCoincide);

    setNeedsAcceptance(debeAceptar);
    setVersionAceptada(bdVersion);
    setFechaAceptacion(bdFecha);

    // Sincronizar localStorage con clave scoped
    if (!debeAceptar && bdVersion) {
      try {
        localStorage.setItem(
          getAvisoStorageKey(user.id),
          JSON.stringify({
            aceptado: true,
            version: bdVersion,
            fecha: bdFecha,
          }),
        );
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.removeItem(getAvisoStorageKey(user.id));
      } catch {
        // ignore
      }
    }

    setIsLoading(false);
  }, [user?.id, isAuthLoading]);

  useEffect(() => {
    checkAviso();

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{
        userId?: string;
        needsAcceptance: boolean;
        version?: string;
        fecha?: string;
      }>;
      if (customEvent.detail) {
        if (!customEvent.detail.userId || customEvent.detail.userId === user?.id) {
          setNeedsAcceptance(customEvent.detail.needsAcceptance);
          if (customEvent.detail.version !== undefined) {
            setVersionAceptada(customEvent.detail.version);
          }
          if (customEvent.detail.fecha !== undefined) {
            setFechaAceptacion(customEvent.detail.fecha);
          }
        }
      } else {
        checkAviso();
      }
    };

    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [checkAviso, user?.id]);

  const acceptAviso = useCallback(
    async (
      version = AVISO_PRIVACIDAD_VERSION_ACTUAL,
      modoAcompanamiento?: boolean,
    ): Promise<boolean> => {
      if (!user?.id) return false;

      const timestamp = new Date().toISOString();

      // 1. Guardar de inmediato en localStorage con la clave scoped al user_id
      try {
        localStorage.setItem(
          getAvisoStorageKey(user.id),
          JSON.stringify({
            aceptado: true,
            version,
            fecha: timestamp,
          }),
        );
        if (modoAcompanamiento !== undefined) {
          localStorage.setItem(
            "equilibra_modo_acompanamiento",
            modoAcompanamiento ? "true" : "false",
          );
        }
      } catch {
        // ignore
      }

      // 2. Actualizar estado local síncronamente
      setNeedsAcceptance(false);
      setVersionAceptada(version);
      setFechaAceptacion(timestamp);

      // 3. Notificar a todas las instancias activas del hook
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(SYNC_EVENT_NAME, {
            detail: {
              userId: user.id,
              needsAcceptance: false,
              version,
              fecha: timestamp,
            },
          }),
        );
      }

      // 4. Persistir en la tabla avisos_aceptados en Supabase
      try {
        const { error: errorAviso } = await supabase.from("avisos_aceptados").upsert(
          {
            user_id: user.id,
            version_aviso: version,
            fecha_aceptacion: timestamp,
          },
          { onConflict: "user_id" },
        );
        if (errorAviso) {
          console.warn("Aviso al registrar en avisos_aceptados:", errorAviso);
        }
      } catch (err) {
        console.warn("Error al registrar en avisos_aceptados:", err);
      }

      // 5. Actualizar también en profiles para compatibilidad con la vista
      try {
        const updatePayload: Record<string, unknown> = {
          aviso_privacidad_aceptado: true,
          aviso_privacidad_version: version,
          aviso_privacidad_fecha: timestamp,
        };

        if (modoAcompanamiento !== undefined) {
          updatePayload.modo_acompaniamiento = modoAcompanamiento;
        }

        const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);
        if (error && error.message.includes("does not exist")) {
          if (modoAcompanamiento !== undefined) {
            await supabase
              .from("profiles")
              .update({ modo_acompaniamiento: modoAcompanamiento })
              .eq("id", user.id);
          }
        }
      } catch (err) {
        console.warn("Error al actualizar profiles:", err);
      }

      return true;
    },
    [user?.id],
  );

  return {
    needsAcceptance,
    isLoading,
    versionAceptada,
    fechaAceptacion,
    acceptAviso,
    refetch: checkAviso,
  };
}
