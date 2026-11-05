import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";
import { authIcons } from "@/config/icons";
import { useAuth } from "@/lib/auth-context";
import { sanitizeText, isValidEmail, isValidMatricula } from "@/lib/security";
import { rutaPorRol } from "@/lib/roles";
import { TESH_CAREERS } from "@/lib/directivo-data";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { EquilibraBrand } from "@/components/ui/equilibra-brand";
import { BRAND } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormErrors {
  name?: string;
  matricula?: string;
  email?: string;
  password?: string;
  carrera?: string;
  semestre?: string;
  grupo?: string;
  form?: string;
}

export function RegistroPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [matricula, setMatricula] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [carrera, setCarrera] = useState<string>("Ing. en Sistemas Computacionales");
  const [semestre, setSemestre] = useState<string>("1");
  const [grupo, setGrupo] = useState<string>("101");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const cleanName = sanitizeText(name, 100);
    const cleanMatricula = sanitizeText(matricula, 30);
    const cleanEmail = sanitizeText(email, 120);

    if (!cleanName) {
      newErrors.name = "El nombre completo es obligatorio.";
    } else if (cleanName.length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres.";
    }

    if (!cleanMatricula) {
      newErrors.matricula = "La matrícula institucional es obligatoria.";
    } else if (!isValidMatricula(cleanMatricula)) {
      newErrors.matricula = "Ingresa una matrícula válida (solo números, letras y guiones).";
    }

    const cleanGrupo = sanitizeText(grupo, 10);
    if (!cleanGrupo) {
      newErrors.grupo = "El grupo es obligatorio (ej. 101, 302).";
    }

    if (!cleanEmail) {
      newErrors.email = "El correo electrónico es obligatorio.";
    } else if (!isValidEmail(cleanEmail)) {
      newErrors.email = "Ingresa un formato de correo válido (ej. nombre@tesh.mx).";
    }

    if (!password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres.";
    } else if (password.length > 100) {
      newErrors.password = "La contraseña excede el límite seguro de 100 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanName = sanitizeText(name, 100);
    const cleanMatricula = sanitizeText(matricula, 30);
    const cleanEmail = sanitizeText(email, 120).toLowerCase();
    const cleanGrupo = sanitizeText(grupo, 10);

    try {
      setIsSubmitting(true);
      const user = await register({
        name: cleanName,
        matricula: cleanMatricula,
        email: cleanEmail,
        password,
        carrera,
        semestre,
        grupo: cleanGrupo,
      });

      toast.success(`Cuenta creada con éxito. ¡Bienvenido/a, ${user.name}!`);
      // Requisito normativo PB-002: Redirigir al Aviso de Privacidad antes de acceder a la plataforma
      navigate({ to: "/aviso-privacidad", replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al registrar tu cuenta. Intenta de nuevo.";
      setErrors((prev) => ({ ...prev, form: msg }));
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuroraBackground>
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="ethereal-card relative w-full max-w-lg space-y-6 rounded-3xl border border-white/40 bg-card/85 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Header con Marca */}
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="scale-105 transform transition-transform hover:scale-110">
              <EquilibraBrand />
            </div>
            <div className="space-y-1 pt-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Crea tu espacio seguro
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Comienza tu registro en {BRAND.fullName} para recibir el apoyo que necesitas.
              </p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <authIcons.alert className="mt-0.5 size-4 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Nombre completo */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-name" className="text-xs font-medium text-foreground">
                Nombre completo
              </Label>
              <div className="relative">
                <authIcons.user className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="ej. Denisse Bautista"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  autoComplete="name"
                  className="rounded-xl border-border/70 bg-background/70 pl-10 text-sm focus-visible:border-accent focus-visible:ring-accent/30"
                  required
                />
              </div>
              {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
            </div>

            {/* Matrícula institucional */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-matricula" className="text-xs font-medium text-foreground">
                Matrícula institucional
              </Label>
              <div className="relative">
                <authIcons.matricula className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-matricula"
                  type="text"
                  placeholder="ej. 202310452"
                  value={matricula}
                  onChange={(e) => {
                    setMatricula(e.target.value);
                    if (errors.matricula) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.matricula;
                        return next;
                      });
                    }
                  }}
                  className="rounded-xl border-border/70 bg-background/70 pl-10 text-sm focus-visible:border-accent focus-visible:ring-accent/30"
                  required
                />
              </div>
              {errors.matricula && (
                <p className="text-[11px] text-destructive">{errors.matricula}</p>
              )}
            </div>

            {/* Campos Académicos (Carrera, Semestre, Grupo) */}
            {/* Carrera */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-carrera" className="text-xs font-medium text-foreground">
                Carrera
              </Label>
              <div className="relative">
                <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="reg-carrera"
                  value={carrera}
                  onChange={(e) => setCarrera(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border/70 bg-background/70 pl-10 pr-3 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                  required
                >
                  {TESH_CAREERS.map((c) => (
                    <option key={c} value={c} className="bg-background text-foreground">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Semestre y Grupo en grid de 2 columnas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-semestre" className="text-xs font-medium text-foreground">
                  Semestre
                </Label>
                <div className="relative">
                  <BookOpen className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    id="reg-semestre"
                    value={semestre}
                    onChange={(e) => setSemestre(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border/70 bg-background/70 pl-10 pr-3 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                      <option
                        key={s}
                        value={s.toString()}
                        className="bg-background text-foreground"
                      >
                        {s}° Semestre
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-grupo" className="text-xs font-medium text-foreground">
                  Grupo
                </Label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-grupo"
                    type="text"
                    placeholder="ej. 501"
                    value={grupo}
                    onChange={(e) => {
                      setGrupo(e.target.value);
                      if (errors.grupo) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.grupo;
                          return next;
                        });
                      }
                    }}
                    className="rounded-xl border-border/70 bg-background/70 pl-10 text-sm focus-visible:border-accent focus-visible:ring-accent/30"
                    required
                  />
                </div>
                {errors.grupo && <p className="text-[11px] text-destructive">{errors.grupo}</p>}
              </div>
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-xs font-medium text-foreground">
                Correo electrónico
              </Label>
              <div className="relative">
                <authIcons.email className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="ej. alumno@tesh.mx"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.email;
                        return next;
                      });
                    }
                  }}
                  autoComplete="email"
                  className="rounded-xl border-border/70 bg-background/70 pl-10 text-sm focus-visible:border-accent focus-visible:ring-accent/30"
                  required
                />
              </div>
              {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-password" className="text-xs font-medium text-foreground">
                Contraseña (mínimo 8 caracteres)
              </Label>
              <div className="relative">
                <authIcons.password className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Al menos 8 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.password;
                        return next;
                      });
                    }
                  }}
                  autoComplete="new-password"
                  className="rounded-xl border-border/70 bg-background/70 pl-10 pr-10 text-sm focus-visible:border-accent focus-visible:ring-accent/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? (
                    <authIcons.hidePassword className="size-4" />
                  ) : (
                    <authIcons.showPassword className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-destructive">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 h-11 w-full gap-2 rounded-xl bg-accent font-semibold text-accent-foreground shadow-md transition-all hover:bg-accent/90"
            >
              <authIcons.submitRegister className="size-4" />
              <span>{isSubmitting ? "Creando cuenta..." : "Crear cuenta"}</span>
            </Button>
          </form>

          {/* Microcopy empático de confidencialidad */}
          <div className="flex items-center justify-center gap-2 rounded-xl bg-card/40 p-2.5 text-center text-xs text-muted-foreground">
            <authIcons.shield className="size-4 shrink-0 text-accent" />
            <span>Tu información está protegida y es confidencial.</span>
          </div>

          {/* Enlace a Login */}
          <div className="border-t border-border/40 pt-4 text-center text-xs text-muted-foreground">
            <span>¿Ya tienes una cuenta registrada? </span>
            <Link
              to="/login"
              className="font-semibold text-accent underline-offset-4 transition-colors hover:underline"
            >
              Iniciar sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
