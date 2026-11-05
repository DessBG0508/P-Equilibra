import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PageShell } from "@/components/layout/page-shell";
import { profileIcons } from "@/config/icons";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/branding";
import { WellbeingStreakCard } from "./wellbeing-streak-card";
import { WellbeingStatsGrid } from "@/features/bienestar/wellbeing-stats-grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function getInitials(name?: string) {
  if (!name) return "ES";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";
  if (first && second) return `${first}${second}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "ES";
}

const STAT_ICONS = [
  profileIcons.brain,
  profileIcons.sleep,
  profileIcons.stress,
  profileIcons.energy,
];

const SECURITY_ITEMS = [
  {
    title: "Tus datos están cifrados",
    description:
      "Toda la información y registros de check-in viajan protegidos mediante cifrado en tránsito y reposo.",
    icon: profileIcons.lock,
  },
  {
    title: "Solo tú accedes a tus registros",
    description:
      "A menos que actives voluntariamente el Modo Acompañamiento, tus notas y emociones son 100% privadas.",
    icon: profileIcons.shieldCheck,
  },
  {
    title: "Consentimiento reversible",
    description:
      "Tú tienes el control absoluto: puedes encender o apagar el acompañamiento cuando lo desees.",
    icon: profileIcons.userCheck,
  },
  {
    title: "Acompañamiento sin repercusiones",
    description: `${BRAND.name} es un espacio de cuidado humano. Nunca se comparte con fines académicos ni disciplinarios.`,
    icon: profileIcons.heartPulse,
  },
];

export function PerfilPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Modo Acompañamiento (Consentimiento de supervisión psicológica)
  // Sincronizado con tabla 'profiles' en Supabase (columna modo_acompaniamiento)
  const [modoAcompanamiento, setModoAcompanamiento] = useState<boolean>(() => {
    try {
      return localStorage.getItem("equilibra_modo_acompanamiento") === "true";
    } catch {
      return false;
    }
  });
  const [isSavingAcompanamiento, setIsSavingAcompanamiento] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Campos de perfil: matrícula y correo SOLO LECTURA (fuente autoritativa institucional).
  // Editables: nombre, semestre, grupo, carrera.
  const [nombre, setNombre] = useState(user?.name || "Estudiante");
  const [email, setEmail] = useState(user?.email || "estudiante@tesh.mx");
  const [matricula, setMatricula] = useState(user?.matricula || "202310452");
  const [carrera, setCarrera] = useState(user?.carrera || "Ingeniería en Sistemas Computacionales");
  const [semestre, setSemestre] = useState(user?.semestre || "6to Semestre");
  const [grupo, setGrupo] = useState(user?.grupo || "501");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [lastSavedProfile, setLastSavedProfile] = useState({
    nombre: user?.name || "Estudiante",
    semestre: user?.semestre || "6to Semestre",
    grupo: user?.grupo || "501",
    carrera: user?.carrera || "Ingeniería en Sistemas Computacionales",
  });

  // 3. Al montar, leer los valores reales desde profiles (fuente única de verdad)
  useEffect(() => {
    let isMounted = true;
    async function loadProfileData() {
      let uid = user?.id;
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          uid = authData.user.id;
          if (authData.user.email) {
            setEmail(authData.user.email);
          }
        }
      } catch {
        // fallback a user context
      }

      const UUID_REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uid || !UUID_REGEX.test(uid)) {
        return;
      }

      try {
        let res = await supabase
          .from("profiles")
          .select(
            "id, nombre, matricula, email, carrera, semestre, grupo, modo_acompaniamiento, modo_acompanamiento",
          )
          .eq("id", uid)
          .maybeSingle();

        if (res.error && res.error.message.includes("does not exist")) {
          res = await supabase
            .from("profiles")
            .select("id, nombre, matricula, carrera, semestre, grupo, modo_acompaniamiento")
            .eq("id", uid)
            .maybeSingle();
        }

        if (!res.error && res.data && isMounted) {
          const loadedNombre = res.data.nombre || user?.name || "";
          const loadedSemestre = res.data.semestre || user?.semestre || "";
          const loadedGrupo = res.data.grupo || user?.grupo || "";
          const loadedCarrera = res.data.carrera || user?.carrera || "";
          const loadedMatricula = res.data.matricula || user?.matricula || "";
          const loadedEmail = res.data.email || user?.email || "";

          if (loadedNombre) setNombre(loadedNombre);
          if (loadedSemestre) setSemestre(loadedSemestre);
          if (loadedGrupo) setGrupo(loadedGrupo);
          if (loadedCarrera) setCarrera(loadedCarrera);
          if (loadedMatricula) setMatricula(loadedMatricula);
          if (loadedEmail) setEmail(loadedEmail);

          setLastSavedProfile({
            nombre: loadedNombre || "Estudiante",
            semestre: loadedSemestre || "",
            grupo: loadedGrupo || "",
            carrera: loadedCarrera || "",
          });

          const remoteVal =
            res.data.modo_acompaniamiento !== undefined && res.data.modo_acompaniamiento !== null
              ? Boolean(res.data.modo_acompaniamiento)
              : res.data.modo_acompanamiento !== undefined && res.data.modo_acompanamiento !== null
                ? Boolean(res.data.modo_acompanamiento)
                : false;
          setModoAcompanamiento(remoteVal);
          try {
            localStorage.setItem("equilibra_modo_acompanamiento", remoteVal ? "true" : "false");
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn("Aviso al consultar perfil desde Supabase:", err);
      }
    }

    loadProfileData();
    return () => {
      isMounted = false;
    };
  }, [
    user?.id,
    user?.name,
    user?.email,
    user?.matricula,
    user?.carrera,
    user?.semestre,
    user?.grupo,
  ]);

  // 1. Al cambiar el toggle: UPDATE public.profiles SET modo_acompaniamiento = <valor> WHERE id = <uid de la sesión>
  // 3. Feedback discreto de éxito/error; si falla el guardado, el toggle NO cambia de estado.
  const handleToggleAcompanamiento = async (checked: boolean) => {
    if (isSavingAcompanamiento) return;

    let uid = user?.id;
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        uid = authData.user.id;
      }
    } catch {
      // fallback
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // Si es demo o no hay UUID de sesión real
    if (!uid || !UUID_REGEX.test(uid)) {
      setModoAcompanamiento(checked);
      try {
        localStorage.setItem("equilibra_modo_acompanamiento", checked ? "true" : "false");
      } catch {
        // ignore
      }
      if (checked) {
        toast.success("Modo Acompañamiento activado", {
          description:
            "El equipo de Bienestar podrá ver tus tamizajes para brindarte orientación oportuna.",
        });
      } else {
        toast.info("Modo Privado activado", {
          description: "Tus registros y check-ins son confidenciales en tu dispositivo.",
        });
      }
      return;
    }

    setIsSavingAcompanamiento(true);
    try {
      let updateRes = await supabase
        .from("profiles")
        .update({ modo_acompaniamiento: checked })
        .eq("id", uid);

      if (updateRes.error && updateRes.error.message.includes("does not exist")) {
        updateRes = await supabase
          .from("profiles")
          .update({ modo_acompanamiento: checked })
          .eq("id", uid);
      }

      if (updateRes.error) {
        // Si falla el guardado, el toggle NO cambia de estado (nunca mostrar activado algo que no se guardó)
        toast.error("No se pudo actualizar tu preferencia en el servidor. Intenta de nuevo.");
        return;
      }

      // Éxito confirmado en BD
      setModoAcompanamiento(checked);
      try {
        localStorage.setItem("equilibra_modo_acompanamiento", checked ? "true" : "false");
      } catch {
        // ignore
      }

      if (checked) {
        toast.success("Preferencia guardada", {
          description:
            "Modo Acompañamiento activado. El equipo de Bienestar podrá ver tus tamizajes.",
        });
      } else {
        toast.info("Preferencia guardada", {
          description: "Modo Privado activado. Tus tamizajes no son compartidos con Bienestar.",
        });
      }
    } catch {
      // Si falla, el toggle NO cambia de estado
      toast.error("Error de conexión. Tu preferencia no se pudo guardar.");
    } finally {
      setIsSavingAcompanamiento(false);
    }
  };

  // 2. "Guardar cambios" persiste en public.profiles (nombre, semestre, grupo, carrera) vía Supabase
  // 4. Si un guardado falla por permisos, mostrar aviso discreto y no cambiar el estado de los campos.
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProfile) return;

    let uid = user?.id;
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        uid = authData.user.id;
      }
    } catch {
      // fallback
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uid || !UUID_REGEX.test(uid)) {
      setLastSavedProfile({
        nombre: nombre.trim(),
        semestre: semestre.trim(),
        grupo: grupo.trim(),
        carrera: carrera.trim(),
      });
      toast.success("Datos guardados en vista previa", {
        description:
          "En esta versión de demostración los datos de tu cuenta institucional están preconfigurados.",
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nombre: nombre.trim(),
          semestre: semestre.trim(),
          grupo: grupo.trim(),
          carrera: carrera.trim(),
        })
        .eq("id", uid);

      if (error) {
        // 4. Si un guardado falla por permisos, mostrar aviso discreto y no cambiar el estado de los campos
        toast.error("No se pudieron guardar los cambios por permisos.", {
          description: "Se restauró el estado anterior de tus datos institucionales.",
        });
        setNombre(lastSavedProfile.nombre);
        setSemestre(lastSavedProfile.semestre);
        setGrupo(lastSavedProfile.grupo);
        setCarrera(lastSavedProfile.carrera);
        return;
      }

      setLastSavedProfile({
        nombre: nombre.trim(),
        semestre: semestre.trim(),
        grupo: grupo.trim(),
        carrera: carrera.trim(),
      });
      toast.success("Perfil actualizado con éxito", {
        description: "Tus datos institucionales editables se han guardado en el sistema.",
      });
    } catch {
      toast.error("Error de conexión al guardar los datos.", {
        description: "Se restauró el estado anterior de tus datos.",
      });
      setNombre(lastSavedProfile.nombre);
      setSemestre(lastSavedProfile.semestre);
      setGrupo(lastSavedProfile.grupo);
      setCarrera(lastSavedProfile.carrera);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleConfirmLogout = () => {
    logout();
    toast.success("Has cerrado sesión de forma segura.");
    navigate({ to: "/login", replace: true });
  };

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl space-y-6 pb-20 animate-fade-in">
        {/* 1. HEADER: Avatar, Iniciales, Nombre, Matrícula */}
        <section
          className="ethereal-card relative overflow-hidden p-6 sm:p-8"
          aria-labelledby="perfil-heading"
        >
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            {/* Avatar con gradiente canónico de marca (#1B198F a #6857E4) */}
            <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1B198F] to-[#6857E4] shadow-float ring-4 ring-card">
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                {getInitials(user?.name)}
              </span>
              <span
                className={`absolute bottom-0 right-0 size-4 rounded-full border-2 border-card ${
                  modoAcompanamiento ? "bg-teal" : "bg-teal-500"
                }`}
                title={modoAcompanamiento ? "Modo Acompañamiento" : "Conectado"}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1
                  id="perfil-heading"
                  className="font-display text-2xl font-bold text-primary sm:text-3xl truncate"
                >
                  {user?.name || "Estudiante"}
                </h1>
                <Badge
                  variant="outline"
                  className="rounded-xl border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent"
                >
                  Estudiante TESH
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
                <span className="flex items-center gap-1.5">
                  <profileIcons.matricula className="size-3.5 text-accent" />
                  <span className="font-semibold text-foreground">
                    Matrícula: {user?.matricula || "202310452"}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <profileIcons.email className="size-3.5 text-accent" />
                  <span>{user?.email || "estudiante@tesh.mx"}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. RACHA DE AUTOCUIDADO EMOCIONAL (Estilo Duolingo / TikTok) */}
        <WellbeingStreakCard />

        {/* 3. SECCIONES EN CARDS */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Mi Bienestar */}
          <section
            className="ethereal-card flex flex-col justify-between p-6 sm:p-7"
            aria-labelledby="bienestar-heading"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-xl bg-teal-soft text-teal">
                    <profileIcons.stats className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal">
                      Últimos 7 días
                    </p>
                    <h2
                      id="bienestar-heading"
                      className="font-display text-lg font-bold text-primary"
                    >
                      Mi bienestar en números
                    </h2>
                  </div>
                </div>
              </div>
              <WellbeingStatsGrid variant="profile" />
            </div>

            <div className="mt-5 rounded-xl bg-mint-soft/80 p-3.5 text-xs text-primary/80 leading-relaxed border border-mint/30">
              <p>
                Tus días no tienen que ser perfectos para contar. Cada pausa y registro es un paso
                hacia tu bienestar.
              </p>
              <div className="mt-2 text-right">
                <Link
                  to="/checkin"
                  className="font-semibold text-teal hover:underline inline-flex items-center gap-1"
                >
                  <span>Registrar nuevo check-in</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Card 2: Modo Privado / Modo Acompañamiento (Consentimiento) */}
          <section
            className="ethereal-card flex flex-col justify-between p-6 sm:p-7"
            aria-labelledby="acompanamiento-heading"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-xl bg-lavender-soft text-[#6857E4]">
                    <profileIcons.shield className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6857E4]">
                      Consentimiento
                    </p>
                    <h2
                      id="acompanamiento-heading"
                      className="font-display text-lg font-bold text-primary"
                    >
                      Modo Acompañamiento
                    </h2>
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className={`rounded-xl px-2.5 py-0.5 text-xs font-bold ${
                    modoAcompanamiento
                      ? "bg-teal-soft text-teal border-teal/40"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {modoAcompanamiento ? "Acompañamiento activo" : "Modo Privado"}
                </Badge>
              </div>

              {/* Control de Toggle y Enlace al Aviso de Privacidad */}
              <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label
                        htmlFor="toggle-acompanamiento"
                        className="text-sm font-bold text-foreground cursor-pointer"
                      >
                        Compartir tamizajes con Bienestar
                      </Label>
                      <button
                        type="button"
                        onClick={() =>
                          navigate({ to: "/aviso-privacidad", search: { mode: "consulta" } })
                        }
                        className="text-xs font-semibold text-teal hover:underline focus:outline-none"
                      >
                        Ver aviso de privacidad
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {modoAcompanamiento
                        ? "El equipo de psicología puede contactarte si detecta riesgo"
                        : "Tus respuestas no son compartidas con nadie"}
                    </p>
                  </div>
                  <Switch
                    id="toggle-acompanamiento"
                    checked={modoAcompanamiento}
                    disabled={isSavingAcompanamiento}
                    onCheckedChange={handleToggleAcompanamiento}
                    className="data-[state=checked]:bg-teal"
                  />
                </div>
              </div>

              {/* Explicación en lenguaje claro */}
              <div
                className={`rounded-2xl p-4 text-xs leading-relaxed transition-all ${
                  modoAcompanamiento
                    ? "bg-teal-soft/70 text-primary border border-teal/30"
                    : "bg-card/90 text-muted-foreground border border-border/60"
                }`}
              >
                {modoAcompanamiento ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-teal flex items-center gap-1.5">
                      <profileIcons.check className="size-4" />
                      <span>Modo Acompañamiento encendido</span>
                    </p>
                    <p>
                      Permites que el equipo de Bienestar del TESH pueda ver tu tamizaje para
                      acompañarte y ofrecerte orientación oportuna. Puedes desactivarlo cuando
                      quieras.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <profileIcons.lock className="size-3.5 text-accent" />
                      <span>Modo Privado encendido</span>
                    </p>
                    <p>
                      Tus registros emocionales son exclusivamente tuyos. Nadie del personal
                      universitario puede ver tus check-ins ni respuestas.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground italic">
              * Tu consentimiento es voluntario y puedes cambiar esta preferencia en cualquier
              momento sin que afecte tus materias ni trámites escolares.
            </p>
          </section>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 3: Mi Cuenta (Edición visual en demo) */}
          <section className="ethereal-card p-6 sm:p-7 space-y-4" aria-labelledby="cuenta-heading">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <div className="grid size-8 place-items-center rounded-xl bg-cyan-soft text-cyan-700 dark:text-cyan-400">
                <profileIcons.user className="size-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  Información escolar
                </p>
                <h2 id="cuenta-heading" className="font-display text-lg font-bold text-primary">
                  Mi cuenta
                </h2>
              </div>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <Label htmlFor="cuenta-nombre" className="text-xs font-semibold text-foreground">
                  Nombre completo
                </Label>
                <Input
                  id="cuenta-nombre"
                  value={nombre}
                  disabled={isSavingProfile}
                  onChange={(e) => setNombre(e.target.value)}
                  className="h-10 rounded-xl bg-card/80 text-xs"
                />
              </div>

              {/* Matrícula y Correo: SOLO LECTURA INSTITUCIONAL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="cuenta-matricula"
                      className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                    >
                      <profileIcons.matricula className="size-3.5 text-muted-foreground" />
                      <span>Matrícula TESH</span>
                    </Label>
                    <span className="text-[10px] text-muted-foreground/85 font-medium flex items-center gap-1">
                      <profileIcons.lock className="size-2.5 text-muted-foreground/80" />
                      Solo lectura
                    </span>
                  </div>
                  <Input
                    id="cuenta-matricula"
                    value={matricula}
                    disabled
                    readOnly
                    className="h-10 rounded-xl bg-muted/70 text-xs text-muted-foreground font-mono cursor-not-allowed select-none opacity-85 border-border/70"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="cuenta-email"
                      className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                    >
                      <profileIcons.email className="size-3.5 text-muted-foreground" />
                      <span>Correo institucional</span>
                    </Label>
                    <span className="text-[10px] text-muted-foreground/85 font-medium flex items-center gap-1">
                      <profileIcons.lock className="size-2.5 text-muted-foreground/80" />
                      Solo lectura
                    </span>
                  </div>
                  <Input
                    id="cuenta-email"
                    value={email}
                    disabled
                    readOnly
                    className="h-10 rounded-xl bg-muted/70 text-xs text-muted-foreground font-mono cursor-not-allowed select-none opacity-85 border-border/70"
                  />
                </div>
              </div>

              {/* Nota al pie institucional */}
              <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5 pt-0.5">
                <profileIcons.lock className="size-3 shrink-0 text-muted-foreground/70" />
                <span>Datos institucionales — solo lectura</span>
              </p>

              {/* Carrera / Programa (editable) */}
              <div className="space-y-1">
                <Label htmlFor="cuenta-carrera" className="text-xs font-semibold text-foreground">
                  Carrera / Programa
                </Label>
                <Input
                  id="cuenta-carrera"
                  value={carrera}
                  disabled={isSavingProfile}
                  onChange={(e) => setCarrera(e.target.value)}
                  className="h-10 rounded-xl bg-card/80 text-xs"
                />
              </div>

              {/* Semestre y Grupo (editables) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="cuenta-semestre"
                    className="text-xs font-semibold text-foreground"
                  >
                    Semestre actual
                  </Label>
                  <Input
                    id="cuenta-semestre"
                    value={semestre}
                    disabled={isSavingProfile}
                    onChange={(e) => setSemestre(e.target.value)}
                    className="h-10 rounded-xl bg-card/80 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cuenta-grupo" className="text-xs font-semibold text-foreground">
                    Grupo
                  </Label>
                  <Input
                    id="cuenta-grupo"
                    value={grupo}
                    disabled={isSavingProfile}
                    placeholder="ej. 501"
                    onChange={(e) => setGrupo(e.target.value)}
                    className="h-10 rounded-xl bg-card/80 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="h-9 rounded-xl bg-[#6857E4] px-4 text-xs font-semibold text-white hover:bg-[#6857E4] disabled:opacity-60"
                >
                  <profileIcons.edit className="mr-1.5 size-3.5" />
                  <span>{isSavingProfile ? "Guardando cambios..." : "Guardar cambios"}</span>
                </Button>
              </div>
            </form>
          </section>

          {/* Card 4: Seguridad y Privacidad */}
          <section
            className="ethereal-card p-6 sm:p-7 space-y-4"
            aria-labelledby="seguridad-heading"
          >
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <div className="grid size-8 place-items-center rounded-xl bg-mint-soft text-teal">
                <profileIcons.shieldCheck className="size-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal">
                  Privacidad garantizada
                </p>
                <h2 id="seguridad-heading" className="font-display text-lg font-bold text-primary">
                  Seguridad
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {SECURITY_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/50 p-3"
                  >
                    <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-lavender-soft text-accent">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-foreground">{item.title}</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* 3. CERRAR SESIÓN: Botón outline rojo suave (NO rosa de crisis) con confirmación */}
        <section className="pt-4 flex justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full max-w-sm rounded-2xl border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-800/40 dark:text-pink-400 dark:hover:bg-pink-950/30 text-xs font-semibold gap-2 shadow-soft transition-colors"
              >
                <profileIcons.logout className="size-4" />
                <span>Cerrar sesión</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl p-6 sm:p-7 max-w-md border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-xl font-bold text-primary">
                  ¿Deseas cerrar tu sesión?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2">
                  Tus registros y configuraciones de bienestar se mantendrán guardados. Podrás
                  volver a ingresar cuando lo necesites con tu correo institucional y contraseña.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-5 gap-2 sm:gap-3">
                <AlertDialogCancel className="rounded-xl h-10 text-xs font-semibold">
                  Permanecer aquí
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmLogout}
                  className="rounded-xl h-10 bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold"
                >
                  Sí, cerrar sesión
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        {/* Modal de Aviso de Privacidad y Consentimiento Informado */}
        <Dialog open={isPrivacyModalOpen} onOpenChange={setIsPrivacyModalOpen}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border-border">
            <DialogHeader className="text-left space-y-1.5 pb-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-teal font-semibold text-xs tracking-wider uppercase">
                <profileIcons.shield className="size-4" />
                <span>Consentimiento Informado TESH</span>
              </div>
              <DialogTitle className="font-display text-xl font-bold text-primary">
                Aviso de Privacidad — Modo Acompañamiento
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tecnológico de Estudios Superiores de Huixquilucan • Departamento de Bienestar y
                Salud Mental
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs leading-relaxed text-foreground/90">
              <div className="rounded-xl bg-teal-soft/60 p-3.5 border border-teal/20 text-teal-900 dark:text-teal-200">
                <p className="font-semibold text-xs">
                  Tu bienestar y privacidad son nuestra prioridad institucional
                </p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  El Modo Acompañamiento te permite decidir libremente si deseas que el equipo de
                  psicología universitaria pueda revisar los resultados de tus tamizajes clínicos
                  (PHQ-9 y GAD-7) para ofrecerte orientación oportuna.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                  1. Finalidad del tratamiento de datos
                </h4>
                <p className="text-muted-foreground">
                  La información recabada se utiliza exclusivamente para fines de evaluación
                  preventiva, detección de riesgos emocionales y canalización profesional a
                  servicios de consejería y terapia psicológica dentro del TESH o servicios de
                  emergencia externa (Línea de la Vida).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                  2. Garantía de no repercusión académica
                </h4>
                <p className="text-muted-foreground">
                  El TESH garantiza formalmente que las respuestas a los cuestionarios y el estado
                  de tu salud mental nunca serán utilizados con fines punitivos, académicos,
                  disciplinarios ni para condicionar materias, calificaciones, becas o trámites
                  escolares.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                  3. Revocación del consentimiento en cualquier momento
                </h4>
                <p className="text-muted-foreground">
                  Puedes desactivar este consentimiento cuando lo desees activando el "Modo
                  Privado". Al desactivarlo, tus futuros registros emocionales permanecerán
                  estrictamente privados en tu dispositivo y no serán visibles para el equipo de
                  Bienestar.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                  4. Confidencialidad y Secreto Profesional
                </h4>
                <p className="text-muted-foreground">
                  Todo el personal de psicología se rige por el Código Ético profesional y la Ley
                  General de Protección de Datos Personales en Posesión de Sujetos Obligados. Tu
                  información se mantiene bajo estricto secreto profesional.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-border/50 pt-4">
              <Button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="rounded-xl bg-teal text-white hover:bg-teal/90 text-xs font-semibold px-4 h-9"
              >
                Entendido y cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </PageShell>
  );
}
