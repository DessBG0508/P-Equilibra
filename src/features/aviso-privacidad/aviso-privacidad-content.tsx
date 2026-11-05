import type { ReactNode } from "react";
import {
  Building2,
  FileText,
  Target,
  UserCheck,
  ShieldCheck,
  Globe,
  Lock,
  Clock,
  RefreshCw,
} from "lucide-react";

export interface PrivacySection {
  id: string;
  number: number;
  title: string;
  icon: ReactNode;
  content: ReactNode;
}

export const AVISO_PRIVACIDAD_METADATA = {
  version: "1.0",
  fechaVigencia: "20 de octubre de 2026",
  responsable: "Tecnológico de Estudios Superiores de Huixquilucan (TESH)",
  domicilio: "[POR VALIDAR CON TESH]",
  contactoDpo: "[POR VALIDAR CON TESH]",
};

export const AVISO_PRIVACIDAD_SECCIONES: PrivacySection[] = [
  {
    id: "responsable",
    number: 1,
    title: "Identidad y Domicilio del Responsable",
    icon: <Building2 className="size-4.5 text-primary" aria-hidden="true" />,
    content: (
      <div className="space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        <p>
          El{" "}
          <strong className="text-foreground">
            Tecnológico de Estudios Superiores de Huixquilucan (TESH)
          </strong>
          , a través de la Subdirección de Servicios Escolares y el Área de Psicología y Bienestar
          Universitario, es el responsable del tratamiento y resguardo de los datos personales y
          datos personales sensibles proporcionados por la comunidad estudiantil y docente a través
          de la plataforma digital <strong className="text-foreground">Equilibra TESH</strong>.
        </p>
        <div className="rounded-xl border border-border/70 bg-muted/40 p-3 space-y-1 text-xs">
          <p>
            <strong className="text-foreground">Domicilio institucional:</strong>{" "}
            <span className="font-mono text-muted-foreground">
              {AVISO_PRIVACIDAD_METADATA.domicilio}
            </span>
          </p>
          <p>
            <strong className="text-foreground">
              Contacto del Oficial de Protección de Datos (DPO):
            </strong>{" "}
            <span className="font-mono text-muted-foreground">
              {AVISO_PRIVACIDAD_METADATA.contactoDpo}
            </span>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "datos-recopilados",
    number: 2,
    title: "Datos Personales Recopilados",
    icon: <FileText className="size-4.5 text-primary" aria-hidden="true" />,
    content: (
      <div className="space-y-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        <p>
          Para cumplir con las finalidades de acompañamiento y orientación emocional, se recaban las
          siguientes categorías de datos:
        </p>
        <ul className="space-y-2 pl-2">
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Datos de identificación y académicos:</strong>{" "}
              Nombre completo, matrícula de estudiante, correo electrónico institucional, carrera
              profesional, semestre y grupo.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Datos demográficos:</strong> Edad y sexo
              autoidentificado.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Datos clínicos y de tamizaje (sensibles):</strong>{" "}
              Respuestas a las escalas estandarizadas de salud mental PHQ-9 (estado de ánimo y
              depresión) y GAD-7 (ansiedad), clasificación de nivel de riesgo clínico (verde,
              amarillo o rojo) y folio alfanumérico único{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-primary font-mono font-semibold">
                EQ-XXXX
              </code>
              .
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Métricas de bienestar y uso:</strong> Check-ins
              diarios en el emocionómetro, registros subjetivos de horas de sueño, nivel de estrés
              percibido y nivel de energía.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "finalidades",
    number: 3,
    title: "Finalidades del Tratamiento",
    icon: <Target className="size-4.5 text-primary" aria-hidden="true" />,
    content: (
      <div className="space-y-2.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        <div>
          <h4 className="font-semibold text-foreground">
            Finalidades Primarias (necesarias para el servicio):
          </h4>
          <ul className="mt-1.5 space-y-1.5 pl-2">
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
              <span>
                Aplicación guiada del tamizaje psicométrico mediante la asistente clínica Eli.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
              <span>
                Cálculo automatizado de índices clínicos de riesgo para canalización oportuna.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
              <span>
                Generación y vinculación del folio oficial en la Agenda de Citas con el Área de
                Psicología del TESH.
              </span>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground">
            Finalidades Secundarias (no indispensables):
          </h4>
          <ul className="mt-1.5 space-y-1.5 pl-2">
            <li className="flex items-start gap-2">
              <span
                className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground"
                aria-hidden="true"
              />
              <span>
                Generación de estadísticas e indicadores institucionales de salud mental
                estudiantil, de forma estrictamente agregada, anonimizada y disociada de tu
                identidad.
              </span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "modo-acompanamiento",
    number: 4,
    title: "Consentimiento Explícito — Modo Acompañamiento",
    icon: <UserCheck className="size-4.5 text-primary" aria-hidden="true" />,
    content: (
      <div className="space-y-2.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        <p>
          En estricto apego al principio de autodeterminación informativa y a la{" "}
          <strong className="text-foreground">NOM-024-SSA3-2012</strong> (Sistemas de Información de
          Registro Electrónico para la Salud):
        </p>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
          <p className="font-medium text-foreground">
            El <strong className="text-primary">Modo Acompañamiento</strong> es un consentimiento
            explícito y reversible que permite al personal de psicología del TESH consultar tus
            resultados de tamizaje y notas de evolución clínica. Puedes activarlo o desactivarlo
            libremente en cualquier momento desde tu Perfil.
          </p>
          <p className="text-xs">
            Al desactivar el consentimiento, el acceso del psicólogo a nuevas lecturas queda
            revocado de manera inmediata en el sistema. Las notas clínicas y registros generados con
            anterioridad se conservan bajo resguardo confidencial por obligaciones normativas de
            trazabilidad médica universitaria.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "derechos-arco",
    number: 5,
    title: "Ejercicio de Derechos ARCO",
    icon: <ShieldCheck className="size-4.5 text-primary" aria-hidden="true" />,
    content: (
      <div className="space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        <p>
          Como titular de los datos personales, tienes derecho a solicitar el{" "}
          <strong className="text-foreground">Acceso</strong> a tus datos, la{" "}
          <strong className="text-foreground">Rectificación</strong> si son inexactos o incompletos,
          la <strong className="text-foreground">Cancelación</strong> de tus registros o la{" "}
          <strong className="text-foreground">Oposición</strong> a su tratamiento para fines
          específicos (Derechos ARCO), conforme a la Ley General de Protección de Datos Personales
          en Posesión de Sujetos Obligados (LGPDPPSO).
        </p>
        <p>
          Para ejercer cualquiera de estos derechos, podrás enviar una solicitud formal dirigida a
          la Unidad de Transparencia y Protección de Datos del TESH al correo{" "}
          <span className="font-mono text-primary font-semibold">
            {AVISO_PRIVACIDAD_METADATA.contactoDpo}
          </span>{" "}
          con el asunto &ldquo;Solicitud ARCO — Equilibra TESH&rdquo;, adjuntando tu credencial
          institucional o identificación oficial.
        </p>
      </div>
    ),
  },
  {
    id: "transferencias",
    number: 6,
    title: "Proveedores Tecnológicos y Transferencias Internacionales",
    icon: <Globe className="size-4.5 text-primary" aria-hidden="true" />,
    content: (
      <div className="space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        <p>
          Para la operación de la infraestructura tecnológica, Equilibra TESH hace uso de
          proveedores de nube especializados sujetos a estrictas cláusulas de confidencialidad y
          estándares internacionales de seguridad:
        </p>
        <ul className="space-y-1.5 pl-2">
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>
              <strong className="text-foreground">
                Supabase Inc. (PostgreSQL, Auth y Edge Functions):
              </strong>{" "}
              Servidores ubicados en Estados Unidos de América para alojamiento seguro de bases de
              datos bajo cifrado en reposo.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Google Cloud / Gemini API:</strong> Procesamiento
              de lenguaje natural en tiempo real en servidores de Estados Unidos para la guía
              conversacional de Eli, sin almacenamiento ni entrenamiento de modelos con datos de los
              estudiantes.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>
              <strong className="text-foreground">OpenAI Whisper API (módulo a futuro):</strong>{" "}
              Transcripción opcional de notas de voz en servidores de alta seguridad en Estados
              Unidos.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Red Polygon (Testnet Amoy):</strong> Red
              descentralizada pública utilizada exclusivamente para el anclaje criptográfico de
              integridad (hashes matemáticos SHA-256).{" "}
              <strong className="text-foreground">
                NUNCA se transmiten ni publican datos personales ni clínicos
              </strong>{" "}
              en la cadena de bloques.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "seguridad",
    number: 7,
    title: "Medidas de Seguridad de la Información",
    icon: <Lock className="size-4.5 text-primary" aria-hidden="true" />,
    content: (
      <div className="space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        <p>
          Equilibra TESH implementa medidas administrativas, técnicas y físicas orientadas a
          proteger tus datos contra pérdida, alteración, destrucción o uso no autorizado:
        </p>
        <ul className="space-y-1.5 pl-2">
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Seguridad a Nivel de Fila (RLS):</strong>{" "}
              Políticas en base de datos que garantizan que cada usuario solo puede consultar su
              propia información autorizada.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Cifrado robusto en tránsito:</strong> Todo el
              tráfico entre tu navegador y los servidores se transmite mediante conexiones
              encriptadas HTTPS/TLS 1.3.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Cero credenciales en cliente:</strong> Las claves
              de servicio y firmas criptográficas se procesan en microservicios backend seguros,
              nunca expuestas en el navegador.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Auditoría inmutable:</strong> Cada tamizaje genera
              una prueba criptográfica verificable para certificar la no manipulación del expediente
              clínico.
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "retencion",
    number: 8,
    title: "Plazos de Conservación y Retención de Datos",
    icon: <Clock className="size-4.5 text-primary" aria-hidden="true" />,
    content: (
      <div className="space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        <p>
          Los datos personales y clínicos se conservarán durante el periodo en que el estudiante se
          encuentre matriculado en el TESH y hasta por el tiempo que señale la normativa médica y
          educativa aplicable para fines de seguimiento integral.
        </p>
        <p className="rounded-xl border border-dashed border-border p-3 text-[11px] text-muted-foreground">
          <strong className="text-foreground">Nota institucional:</strong> La política de retención
          definitiva, disposición y depuración documental de expedientes inactivos se encuentra en
          proceso de armonización formal con la Dirección General del TESH [POR DEFINIR EN SPRINT
          5].
        </p>
      </div>
    ),
  },
  {
    id: "cambios",
    number: 9,
    title: "Modificaciones al Aviso de Privacidad",
    icon: <RefreshCw className="size-4.5 text-primary" aria-hidden="true" />,
    content: (
      <div className="space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        <p>
          El presente Aviso de Privacidad puede sufrir modificaciones, cambios o actualizaciones
          derivadas de nuevos requerimientos legales, de necesidades institucionales del TESH o de
          mejoras en las funciones de la plataforma Equilibra.
        </p>
        <p>
          Cualquier cambio sustancial será notificado oportunamente a través de avisos en la
          plataforma web al iniciar sesión y en el portal institucional del TESH.
        </p>
      </div>
    ),
  },
];
