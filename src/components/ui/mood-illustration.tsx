import { useState } from "react";
import { moodIllustrationsConfig } from "@/config/brand-config";
import type { MoodId } from "@/lib/types";
import { Sparkles, Smile, Meh, Frown, CloudRain } from "lucide-react";

interface MoodIllustrationProps {
  moodId: MoodId;
  className?: string;
  customSrc?: string;
  alt?: string;
}

const FALLBACK_ICONS: Record<MoodId, React.ComponentType<{ className?: string }>> = {
  "muy-bien": Sparkles,
  bien: Smile,
  regular: Meh,
  triste: Frown,
  "muy-mal": CloudRain,
};

export function MoodIllustration({ moodId, className, customSrc, alt }: MoodIllustrationProps) {
  const [hasError, setHasError] = useState(false);
  const config = moodIllustrationsConfig[moodId];
  const src = customSrc || config?.src;
  const altText = alt || config?.alt || "Ilustración de estado de ánimo";
  const FallbackIcon = FALLBACK_ICONS[moodId] || Smile;

  if (hasError || !src) {
    return (
      <div className={`flex items-center justify-center ${className || "size-10"}`}>
        <FallbackIcon className="size-6 text-current" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={altText}
      onError={() => setHasError(true)}
      className={className || "mood-illustration"}
      loading="lazy"
      draggable={false}
    />
  );
}
