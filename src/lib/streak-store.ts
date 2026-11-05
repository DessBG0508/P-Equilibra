// Sistema de gestión de rachas de autocuidado emocional (Estilo Duolingo / TikTok)
// Diseñado para incentivar la consistencia diaria sin emojis, usando iconos Lucide y Tailwind.

export interface WeekDayStatus {
  dayKey: string;
  label: string;
  fullName: string;
  dateStr: string;
  completed: boolean;
  isToday: boolean;
  isPast: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckInDate: string;
  weekDays: WeekDayStatus[];
  hasCheckedInToday: boolean;
}

const STREAK_STORAGE_KEY = "equilibra_user_streak_v1";

function getFormattedDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAY_LABELS = [
  { dayKey: "L", label: "Lun", fullName: "Lunes", dayIndex: 1 },
  { dayKey: "M", label: "Mar", fullName: "Martes", dayIndex: 2 },
  { dayKey: "X", label: "Mié", fullName: "Miércoles", dayIndex: 3 },
  { dayKey: "J", label: "Jue", fullName: "Jueves", dayIndex: 4 },
  { dayKey: "V", label: "Vie", fullName: "Viernes", dayIndex: 5 },
  { dayKey: "S", label: "Sáb", fullName: "Sábado", dayIndex: 6 },
  { dayKey: "D", label: "Dom", fullName: "Domingo", dayIndex: 0 },
];

export function getStreakData(): StreakData {
  const now = new Date();
  const todayStr = getFormattedDate(now);
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...

  // Valores predeterminados motivadores para la demo del estudiante
  const defaultStreak: StreakData = {
    currentStreak: 5,
    longestStreak: 12,
    totalCheckIns: 28,
    lastCheckInDate: todayStr,
    hasCheckedInToday: true,
    weekDays: [],
  };

  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    let parsed = defaultStreak;
    if (raw) {
      parsed = { ...defaultStreak, ...JSON.parse(raw) };
    }

    // Calcular días de la semana actual (Lunes a Domingo)
    // El lunes de esta semana:
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const weekDays: WeekDayStatus[] = DAY_LABELS.map((item, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);
      const dayDateStr = getFormattedDate(dayDate);
      const isToday = dayDateStr === todayStr;
      const isPast = dayDateStr < todayStr;

      // Por defecto en demo, los días pasados de la racha actual están completados
      const daysAgo = Math.floor((now.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
      const completed =
        parsed.hasCheckedInToday && isToday ? true : isPast && daysAgo <= parsed.currentStreak;

      return {
        dayKey: item.dayKey,
        label: item.label,
        fullName: item.fullName,
        dateStr: dayDateStr,
        completed,
        isToday,
        isPast,
      };
    });

    return {
      ...parsed,
      hasCheckedInToday: parsed.lastCheckInDate === todayStr && parsed.hasCheckedInToday,
      weekDays,
    };
  } catch {
    return defaultStreak;
  }
}

export function recordCheckInSuccess(): StreakData {
  const now = new Date();
  const todayStr = getFormattedDate(now);
  const current = getStreakData();

  if (current.lastCheckInDate === todayStr && current.hasCheckedInToday) {
    // Ya había hecho check-in hoy, sólo actualiza total
    const updated: StreakData = {
      ...current,
      totalCheckIns: current.totalCheckIns + 1,
    };
    try {
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignorar error de almacenamiento
    }
    return getStreakData();
  }

  // Incrementa la racha
  const newStreak = current.currentStreak + 1;
  const newLongest = Math.max(newStreak, current.longestStreak);

  const updated: StreakData = {
    ...current,
    currentStreak: newStreak,
    longestStreak: newLongest,
    totalCheckIns: current.totalCheckIns + 1,
    lastCheckInDate: todayStr,
    hasCheckedInToday: true,
  };

  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignorar error de almacenamiento
  }

  return getStreakData();
}

export function resetDemoStreak(): StreakData {
  const now = new Date();
  const todayStr = getFormattedDate(now);
  const resetData: StreakData = {
    currentStreak: 1,
    longestStreak: 12,
    totalCheckIns: 14,
    lastCheckInDate: todayStr,
    hasCheckedInToday: true,
    weekDays: [],
  };
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(resetData));
  } catch {
    // Ignorar error de almacenamiento
  }
  return getStreakData();
}
