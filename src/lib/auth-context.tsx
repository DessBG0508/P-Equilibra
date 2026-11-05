import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "./supabase";
import { DEMO_MODE } from "./mock-data";
import type { User, UserRole } from "./types";
import { clearAllAvisoStorage } from "./use-aviso-privacidad";

export interface RegisterInput {
  name: string;
  matricula: string;
  email: string;
  password: string;
  carrera?: string;
  semestre?: string;
  grupo?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginAsDemo: (role: UserRole) => User;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = "equilibra_auth_session";
const REGISTERED_USERS_KEY = "equilibra_registered_users";
const LAST_ACTIVITY_KEY = "equilibra_last_activity_ts";
// Timeout de inactividad: protege datos sensibles de salud mental cerrando sesión tras 30 minutos sin interacción
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

// Usuarios mock iniciales para DEMO_MODE
const MOCK_USERS: Array<User & { passwordHash: string }> = [
  {
    id: "demo-student-dess",
    name: "Dess Bautista",
    matricula: "202310452",
    email: "dess@tesh.mx",
    role: "estudiante",
    carrera: "Ing. en Sistemas Computacionales",
    semestre: "5",
    grupo: "501",
    passwordHash: "password123",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "demo-psicologa-marta",
    name: "Dra. Marta Gómez",
    matricula: "PSI-88410",
    email: "dra.marta@tesh.mx",
    role: "psicologo",
    carrera: "Área de Psicología",
    semestre: "",
    grupo: "",
    passwordHash: "password123",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "demo-directivo-jefatura",
    name: "Mtro. Roberto Albarrán",
    matricula: "DIR-33201",
    email: "jefatura@tesh.mx",
    role: "jefatura",
    carrera: "Dirección Académica",
    semestre: "",
    grupo: "",
    passwordHash: "password123",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getRegisteredUsers(): Array<User & { passwordHash: string }> {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(REGISTERED_USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUser(user: User & { passwordHash: string }) {
  if (typeof window === "undefined") return;
  try {
    const list = getRegisteredUsers().filter((u) => u.email !== user.email);
    list.push(user);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("No se pudo guardar el usuario registrado localmente", e);
  }
}

/**
 * Consulta la tabla 'profiles' de Supabase para obtener el rol y datos institucionales
 */
async function fetchUserProfile(userId: string): Promise<{
  nombre?: string;
  matricula?: string;
  carrera?: string;
  semestre?: string;
  grupo?: string;
  rol?: UserRole;
} | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre, matricula, carrera, semestre, grupo, rol")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      nombre: data.nombre,
      matricula: data.matricula,
      carrera: data.carrera,
      semestre: data.semestre,
      grupo: data.grupo,
      rol: data.rol as UserRole,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastRecordedActivityRef = useRef<number>(Date.now());

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error("Error al cerrar sesión en Supabase:", e);
    }

    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.setItem("equilibra_logged_out", "true");
      clearAllAvisoStorage();

      // P0 #6 — Limpiar TODA la huella clínica local del navegador.
      // Antes solo se removían auth + aviso; quedaban expedientes clínicos,
      // notas psicología, sesiones de tamizaje PHQ-9/GAD-7, encuestas, citas,
      // mood check-ins y (en DEMO_MODE) contraseñas en plaintext.
      // Esto es crítico para equipos compartidos y para cumplimiento LFPDPPP.
      const CLINICAL_KEY_PATTERNS = [
        "equilibra_expediente_", // expedientes clínicos por folio
        "equilibra_psych_cases_v1",
        "equilibra_psych_notes_v1",
        "equilibra_eli_screening_sessions_v5",
        "equilibra_respuestas_encuesta_pb021",
        "equilibra_solicitudes_cita_v1",
        "equilibra_citas_v1",
        "equilibra_mood_checkins_v1",
        "equilibra_sleep_hours_v1",
        "equilibra_user_streak_v1",
        "equilibra_registered_users", // DEMO_MODE: contraseñas en plaintext
      ];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (CLINICAL_KEY_PATTERNS.some((p) => key === p || key.startsWith(p))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {
          // ignore
        }
      });
    } catch (e) {
      console.error("Error al eliminar la sesión local", e);
    }
  };

  // Inicialización de sesión y sincronización con Supabase Auth
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        // 1. Verificar si hay sesión activa en Supabase Auth
        if (isSupabaseConfigured) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            const profile = await fetchUserProfile(session.user.id);
            const activeRole: UserRole = (profile?.rol as UserRole) ?? "estudiante";

            const activeUser: User = {
              id: session.user.id,
              name:
                profile?.nombre ||
                session.user.user_metadata?.nombre ||
                session.user.email?.split("@")[0] ||
                "Usuario",
              matricula: profile?.matricula || session.user.user_metadata?.matricula || "",
              email: session.user.email || "",
              role: activeRole,
              carrera: profile?.carrera || session.user.user_metadata?.carrera,
              semestre: profile?.semestre || session.user.user_metadata?.semestre,
              grupo: profile?.grupo || session.user.user_metadata?.grupo,
              createdAt: session.user.created_at || new Date().toISOString(),
            };

            setUser(activeUser);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser));
            localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
            setIsLoading(false);
            return;
          }
        }

        // 2. Si no hay sesión de Supabase, verificar almacenamiento local o DEMO_MODE
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
        const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : 0;
        const now = Date.now();

        if (raw && lastActivity > 0 && now - lastActivity > INACTIVITY_TIMEOUT_MS) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          localStorage.setItem("equilibra_logged_out", "true");
        } else if (raw) {
          setUser(JSON.parse(raw));
          localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
        } else if (DEMO_MODE) {
          const hasLoggedOut = localStorage.getItem("equilibra_logged_out") === "true";
          if (!hasLoggedOut) {
            const defaultStudent: User = {
              id: "demo-student-dess",
              name: "Dess Bautista",
              matricula: "202310452",
              email: "dess@tesh.mx",
              role: "estudiante",
              carrera: "Ing. en Sistemas Computacionales",
              semestre: "5",
              grupo: "501",
              createdAt: "2026-09-01T00:00:00.000Z",
            };
            setUser(defaultStudent);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultStudent));
            localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
          }
        }
      } catch (e) {
        console.error("Error al inicializar la sesión:", e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    // 3. Suscripción a cambios de estado de Supabase Auth
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session) {
        clearAllAvisoStorage();
        const hasManualLogout = localStorage.getItem("equilibra_logged_out") === "true";
        if (hasManualLogout) {
          setUser(null);
        }
      } else if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        const activeRole: UserRole = (profile?.rol as UserRole) ?? "estudiante";

        const activeUser: User = {
          id: session.user.id,
          name:
            profile?.nombre ||
            session.user.user_metadata?.nombre ||
            session.user.email?.split("@")[0] ||
            "Usuario",
          matricula: profile?.matricula || session.user.user_metadata?.matricula || "",
          email: session.user.email || "",
          role: activeRole,
          carrera: profile?.carrera || session.user.user_metadata?.carrera,
          semestre: profile?.semestre || session.user.user_metadata?.semestre,
          grupo: profile?.grupo || session.user.user_metadata?.grupo,
          createdAt: session.user.created_at || new Date().toISOString(),
        };

        setUser(activeUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser));
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Monitor continuo de inactividad (30 minutos) mientras el usuario tiene sesión activa
  useEffect(() => {
    if (!user) return;

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastRecordedActivityRef.current > 10000) {
        lastRecordedActivityRef.current = now;
        try {
          localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
        } catch {
          // Ignorar cuota
        }
      }
    };

    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll", "click"];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    const checkInterval = setInterval(() => {
      try {
        const lastStr = localStorage.getItem(LAST_ACTIVITY_KEY);
        const lastTs = lastStr ? parseInt(lastStr, 10) : lastRecordedActivityRef.current;
        if (Date.now() - lastTs > INACTIVITY_TIMEOUT_MS) {
          logout();
          toast.info("Sesión cerrada por inactividad", {
            description:
              "Tu sesión ha expirado tras 30 minutos sin interacción para resguardar tu privacidad.",
          });
        }
      } catch (err) {
        console.error("Error verificando timeout de inactividad", err);
      }
    }, 20000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(checkInterval);
    };
  }, [user]);

  const login = async (email: string, password: string): Promise<User> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Intento oficial con Supabase Auth: signInWithPassword
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          // Si falla en Supabase pero es una cuenta mock de prueba predefinida, continúa al fallback
          const isMockAccount = MOCK_USERS.some(
            (u) => u.email.toLowerCase() === normalizedEmail && u.passwordHash === password,
          );
          if (!isMockAccount) {
            let errorMsg = error.message;
            if (errorMsg.includes("Invalid login credentials")) {
              errorMsg = "Credenciales incorrectas. Verifica tu correo y contraseña.";
            } else if (errorMsg.includes("Email not confirmed")) {
              errorMsg = "Por favor confirma tu correo electrónico antes de ingresar.";
            }
            throw new Error(errorMsg);
          }
        } else if (data.user) {
          // Leer el rol desde la tabla 'profiles'
          const profile = await fetchUserProfile(data.user.id);
          const activeRole: UserRole = (profile?.rol as UserRole) ?? "estudiante";

          const activeUser: User = {
            id: data.user.id,
            name:
              profile?.nombre ||
              data.user.user_metadata?.nombre ||
              normalizedEmail.split("@")[0] ||
              "Usuario",
            matricula: profile?.matricula || data.user.user_metadata?.matricula || "",
            email: data.user.email || normalizedEmail,
            role: activeRole,
            carrera: profile?.carrera || data.user.user_metadata?.carrera,
            semestre: profile?.semestre || data.user.user_metadata?.semestre,
            grupo: profile?.grupo || data.user.user_metadata?.grupo,
            createdAt: data.user.created_at || new Date().toISOString(),
          };

          setUser(activeUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser));
          localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
          localStorage.removeItem("equilibra_logged_out");
          return activeUser;
        }
      } catch (err: unknown) {
        const isMockAccount = MOCK_USERS.some(
          (u) => u.email.toLowerCase() === normalizedEmail && u.passwordHash === password,
        );
        if (!isMockAccount) {
          throw err;
        }
      }
    }

    // 2. Fallback de usuarios DEMO en desarrollo local
    if (DEMO_MODE) {
      const mockMatch = MOCK_USERS.find((u) => u.email.toLowerCase() === normalizedEmail);
      const registeredMatch = getRegisteredUsers().find(
        (u) => u.email.toLowerCase() === normalizedEmail,
      );

      const found = mockMatch || registeredMatch;

      if (!found) {
        throw new Error("El correo electrónico no coincide con ningún usuario registrado.");
      }

      if (password.length < 8 && found.passwordHash !== password) {
        throw new Error("La contraseña debe tener al menos 8 caracteres.");
      }

      const activeUser: User = {
        id: found.id,
        name: found.name,
        matricula: found.matricula,
        email: found.email,
        role: found.role,
        carrera: found.carrera,
        semestre: found.semestre,
        grupo: found.grupo,
        createdAt: found.createdAt,
      };

      setUser(activeUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser));
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      localStorage.removeItem("equilibra_logged_out");
      return activeUser;
    }

    throw new Error("Autenticación externa no configurada.");
  };

  const register = async (input: RegisterInput): Promise<User> => {
    const normalizedEmail = input.email.trim().toLowerCase();

    // 1. Registro oficial en Supabase Auth: signUp con options.data (nombre, matricula, carrera, semestre, grupo)
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: input.password,
        options: {
          data: {
            nombre: input.name,
            matricula: input.matricula,
            carrera: input.carrera || "",
            semestre: input.semestre || "",
            grupo: input.grupo || "",
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (msg.includes("User already registered")) {
          msg = "Este correo electrónico ya está registrado.";
        } else if (msg.includes("Password should be at least")) {
          msg = "La contraseña debe tener al menos 8 caracteres.";
        }
        throw new Error(msg);
      }

      if (data.user) {
        const activeUser: User = {
          id: data.user.id,
          name: input.name,
          matricula: input.matricula,
          email: normalizedEmail,
          role: "estudiante",
          carrera: input.carrera,
          semestre: input.semestre,
          grupo: input.grupo,
          createdAt: data.user.created_at || new Date().toISOString(),
        };

        setUser(activeUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser));
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        localStorage.removeItem("equilibra_logged_out");
        return activeUser;
      }
    }

    // 2. Fallback DEMO_MODE local
    if (DEMO_MODE) {
      const mockExists = MOCK_USERS.some((u) => u.email.toLowerCase() === normalizedEmail);
      const registeredExists = getRegisteredUsers().some(
        (u) => u.email.toLowerCase() === normalizedEmail,
      );

      if (mockExists || registeredExists) {
        throw new Error("Este correo electrónico ya está registrado.");
      }

      const newUser: User & { passwordHash: string } = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        matricula: input.matricula.trim(),
        email: normalizedEmail,
        role: "estudiante",
        carrera: input.carrera,
        semestre: input.semestre,
        grupo: input.grupo,
        passwordHash: input.password,
        createdAt: new Date().toISOString(),
      };

      saveRegisteredUser(newUser);

      const activeUser: User = {
        id: newUser.id,
        name: newUser.name,
        matricula: newUser.matricula,
        email: newUser.email,
        role: "estudiante",
        carrera: newUser.carrera,
        semestre: newUser.semestre,
        grupo: newUser.grupo,
        createdAt: newUser.createdAt,
      };

      setUser(activeUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser));
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      localStorage.removeItem("equilibra_logged_out");
      return activeUser;
    }

    throw new Error("Autenticación externa no configurada.");
  };

  /**
   * Activación exclusiva del modo demostración en el cliente.
   * Establece el usuario y rol localmente SIN llamar a Supabase Auth.
   */
  const loginAsDemo = (role: UserRole): User => {
    const mock = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];

    const activeUser: User = {
      id: mock.id,
      name: mock.name,
      matricula: mock.matricula,
      email: mock.email,
      role: mock.role,
      carrera: mock.carrera,
      semestre: mock.semestre,
      grupo: mock.grupo,
      createdAt: mock.createdAt,
    };

    setUser(activeUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser));
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      localStorage.removeItem("equilibra_logged_out");
    } catch {
      // ignore storage error
    }
    return activeUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginAsDemo,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
}
