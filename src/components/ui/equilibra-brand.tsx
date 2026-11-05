import { brandConfig } from "@/config/brand-config";
import { BRAND } from "@/lib/branding";

interface EquilibraBrandProps {
  className?: string;
  logoSrc?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function EquilibraBrand({
  className = "",
  logoSrc = brandConfig.logoUrl,
  showText = true,
  size = "md",
}: EquilibraBrandProps) {
  const sizeClasses = {
    sm: "size-8 sm:size-9",
    md: "size-11 sm:size-13",
    lg: "size-14 sm:size-16",
  }[size];

  const textClasses = {
    sm: "text-base sm:text-lg",
    md: "text-[1.35rem] sm:text-[1.65rem]",
    lg: "text-2xl sm:text-3xl",
  }[size];

  return (
    <div
      className={`flex min-w-0 items-center gap-3 ${className}`}
      aria-label={BRAND.fullName.toUpperCase()}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={`Logotipo ${BRAND.fullName.toUpperCase()}`}
          className={`${sizeClasses} shrink-0 object-contain rounded-full`}
        />
      ) : (
        /* Emblema vectorial fiel a equlibrat.png */
        <svg
          className={`${sizeClasses} shrink-0`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="eq-ring-grad"
              x1="15"
              y1="15"
              x2="85"
              y2="85"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#1B198F" />
              <stop offset="0.5" stopColor="#6857E4" />
              <stop offset="1" stopColor="#6857E4" />
            </linearGradient>
            <linearGradient
              id="eq-head-grad"
              x1="20"
              y1="30"
              x2="55"
              y2="70"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#12BDB6" />
              <stop offset="1" stopColor="#12BDB6" />
            </linearGradient>
            <linearGradient
              id="eq-brain-grad"
              x1="45"
              y1="20"
              x2="80"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6857E4" />
              <stop offset="1" stopColor="#6857E4" />
            </linearGradient>
          </defs>

          {/* Anillo exterior con degradado púrpura a menta */}
          <circle cx="50" cy="50" r="46" stroke="url(#eq-ring-grad)" strokeWidth="4.5" />
          <circle cx="50" cy="50" r="41" fill="currentColor" fillOpacity="0.03" />

          {/* Perfil de cabeza mirando a la izquierda en tono menta/turquesa */}
          <path
            d="M48 24C36 24 28 32 27 42C26.5 47 28 50 25 54C23.5 56 21 57 20 60C19.5 62 21 64 24 64C28 64 30 60 32 58C34 65 39 74 50 75C53 75.3 55 74 55 71C55 68 53 66 50 66C44 66 38 60 37 53C41 53 45 52 48 50C52 47 55 42 55 35C55 28 52 24 48 24Z"
            fill="url(#eq-head-grad)"
          />

          {/* Conexión cerebral y mano protectora en lavanda/púrpura */}
          <path
            d="M50 24C58 24 68 28 72 35C76 41 76 50 71 58C67 64 60 67 53 66C52 64 53 62 55 61C61 60 66 56 68 50C70 44 69 38 65 34C61 30 55 28 50 28C47 28 45 28.5 43 29.5C44 26 47 24 50 24Z"
            fill="url(#eq-brain-grad)"
          />

          {/* Surcos sinápticos internos de bienestar */}
          <path
            d="M50 33C54 33 58 36 59 40C60 44 57 47 53 48"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
          <path
            d="M45 42C48 42 51 44 51 47"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
        </svg>
      )}

      {showText && (
        <span
          className={`min-w-0 font-display font-bold tracking-tight leading-none text-primary ${textClasses}`}
        >
          {BRAND.name.toUpperCase()} <span className="text-teal">TESH</span>
        </span>
      )}
    </div>
  );
}
