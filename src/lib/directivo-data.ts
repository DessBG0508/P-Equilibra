import type { RiskLevel } from "./types";

export const TESH_CAREERS = [
  "Ing. Civil",
  "Ing. Industrial",
  "Ing. Mecatrónica",
  "Ing. en Sistemas Computacionales",
  "Lic. en Administración",
  "Lic. en Biología",
  "Lic. en Gastronomía",
] as const;

export type TeshCareer = (typeof TESH_CAREERS)[number];

export interface StudentAnonymizedRecord {
  id: string;
  career: TeshCareer;
  semester: number; // 1 a 9
  animo: number; // 1 a 5 (escala de bienestar visual: 5=Excelente, 1=Bajo)
  sueno: number; // horas
  estres: number; // 1 a 5 (1=Bajo, 5=Muy alto)
  energia: number; // 1 a 5 (5=Alta, 1=Baja)
  riskLevel: RiskLevel;
  date: string; // YYYY-MM-DD
}

/**
 * 20 registros mock anónimos y agregados distribuidos en las 7 carreras del TESH
 * y en semestres del 1º al 9º, para que la segmentación luzca realista.
 */
export const DIRECTIVO_MOCK_RECORDS: StudentAnonymizedRecord[] = [
  // Ing. en Sistemas Computacionales
  {
    id: "rec-isc-01",
    career: "Ing. en Sistemas Computacionales",
    semester: 1,
    animo: 4.2,
    sueno: 7.5,
    estres: 2.3,
    energia: 4.0,
    riskLevel: "verde",
    date: "2026-09-23",
  },
  {
    id: "rec-isc-02",
    career: "Ing. en Sistemas Computacionales",
    semester: 4,
    animo: 3.5,
    sueno: 6.2,
    estres: 3.6,
    energia: 3.2,
    riskLevel: "amarillo",
    date: "2026-09-22",
  },
  {
    id: "rec-isc-03",
    career: "Ing. en Sistemas Computacionales",
    semester: 6,
    animo: 2.6,
    sueno: 5.4,
    estres: 4.4,
    energia: 2.4,
    riskLevel: "rojo",
    date: "2026-09-23",
  },
  {
    id: "rec-isc-04",
    career: "Ing. en Sistemas Computacionales",
    semester: 8,
    animo: 3.8,
    sueno: 7.0,
    estres: 3.1,
    energia: 3.6,
    riskLevel: "verde",
    date: "2026-09-21",
  },

  // Ing. Industrial
  {
    id: "rec-ind-01",
    career: "Ing. Industrial",
    semester: 2,
    animo: 4.0,
    sueno: 7.2,
    estres: 2.5,
    energia: 4.1,
    riskLevel: "verde",
    date: "2026-09-23",
  },
  {
    id: "rec-ind-02",
    career: "Ing. Industrial",
    semester: 5,
    animo: 2.8,
    sueno: 5.6,
    estres: 4.2,
    energia: 2.5,
    riskLevel: "rojo",
    date: "2026-09-22",
  },
  {
    id: "rec-ind-03",
    career: "Ing. Industrial",
    semester: 7,
    animo: 3.4,
    sueno: 6.5,
    estres: 3.5,
    energia: 3.3,
    riskLevel: "amarillo",
    date: "2026-09-20",
  },

  // Ing. Civil
  {
    id: "rec-civ-01",
    career: "Ing. Civil",
    semester: 3,
    animo: 3.9,
    sueno: 6.8,
    estres: 2.9,
    energia: 3.7,
    riskLevel: "verde",
    date: "2026-09-23",
  },
  {
    id: "rec-civ-02",
    career: "Ing. Civil",
    semester: 6,
    animo: 3.2,
    sueno: 6.0,
    estres: 3.8,
    energia: 3.0,
    riskLevel: "amarillo",
    date: "2026-09-21",
  },
  {
    id: "rec-civ-03",
    career: "Ing. Civil",
    semester: 9,
    animo: 4.3,
    sueno: 7.6,
    estres: 2.4,
    energia: 4.2,
    riskLevel: "verde",
    date: "2026-09-22",
  },

  // Ing. Mecatrónica
  {
    id: "rec-mec-01",
    career: "Ing. Mecatrónica",
    semester: 2,
    animo: 3.7,
    sueno: 6.9,
    estres: 3.0,
    energia: 3.8,
    riskLevel: "verde",
    date: "2026-09-23",
  },
  {
    id: "rec-mec-02",
    career: "Ing. Mecatrónica",
    semester: 5,
    animo: 3.0,
    sueno: 5.8,
    estres: 4.1,
    energia: 2.9,
    riskLevel: "amarillo",
    date: "2026-09-22",
  },
  {
    id: "rec-mec-03",
    career: "Ing. Mecatrónica",
    semester: 8,
    animo: 2.5,
    sueno: 5.2,
    estres: 4.5,
    energia: 2.2,
    riskLevel: "rojo",
    date: "2026-09-21",
  },

  // Lic. en Administración
  {
    id: "rec-adm-01",
    career: "Lic. en Administración",
    semester: 1,
    animo: 4.4,
    sueno: 7.8,
    estres: 2.0,
    energia: 4.3,
    riskLevel: "verde",
    date: "2026-09-23",
  },
  {
    id: "rec-adm-02",
    career: "Lic. en Administración",
    semester: 4,
    animo: 3.8,
    sueno: 7.1,
    estres: 2.8,
    energia: 3.7,
    riskLevel: "verde",
    date: "2026-09-22",
  },
  {
    id: "rec-adm-03",
    career: "Lic. en Administración",
    semester: 7,
    animo: 3.3,
    sueno: 6.3,
    estres: 3.6,
    energia: 3.1,
    riskLevel: "amarillo",
    date: "2026-09-20",
  },

  // Lic. en Biología
  {
    id: "rec-bio-01",
    career: "Lic. en Biología",
    semester: 3,
    animo: 4.1,
    sueno: 7.4,
    estres: 2.6,
    energia: 3.9,
    riskLevel: "verde",
    date: "2026-09-23",
  },
  {
    id: "rec-bio-02",
    career: "Lic. en Biología",
    semester: 6,
    animo: 3.4,
    sueno: 6.4,
    estres: 3.4,
    energia: 3.4,
    riskLevel: "verde",
    date: "2026-09-22",
  },

  // Lic. en Gastronomía
  {
    id: "rec-gas-01",
    career: "Lic. en Gastronomía",
    semester: 2,
    animo: 4.0,
    sueno: 6.9,
    estres: 3.1,
    energia: 3.8,
    riskLevel: "verde",
    date: "2026-09-23",
  },
  {
    id: "rec-gas-02",
    career: "Lic. en Gastronomía",
    semester: 5,
    animo: 2.9,
    sueno: 5.7,
    estres: 4.0,
    energia: 2.8,
    riskLevel: "amarillo",
    date: "2026-09-21",
  },
];

export interface DirectivoAggregatedKPIs {
  avgAnimo: number; // 1-5
  avgSueno: number; // horas
  avgEstres: number; // 1-5
  avgEnergia: number; // 1-5
  pctVerde: number; // 0-100
  pctAmarillo: number; // 0-100
  pctRojo: number; // 0-100
  weeklyTrendPercent: number; // delta vs semana anterior (ej. +3.2%)
  totalSamples: number;
}

export interface SemesterBarData {
  semesterLabel: string; // "1º", "2º", ..., "9º"
  semesterNum: number;
  bienestarScore: number; // promedio escala 1-5
  hasData: boolean;
}

export function getDirectivoKPIs(careerFilter: TeshCareer | "all"): DirectivoAggregatedKPIs {
  const records =
    careerFilter === "all"
      ? DIRECTIVO_MOCK_RECORDS
      : DIRECTIVO_MOCK_RECORDS.filter((r) => r.career === careerFilter);

  if (records.length === 0) {
    return {
      avgAnimo: 3.5,
      avgSueno: 6.5,
      avgEstres: 3.0,
      avgEnergia: 3.5,
      pctVerde: 60,
      pctAmarillo: 30,
      pctRojo: 10,
      weeklyTrendPercent: 2.5,
      totalSamples: 0,
    };
  }

  const count = records.length;
  const sumAnimo = records.reduce((acc, r) => acc + r.animo, 0);
  const sumSueno = records.reduce((acc, r) => acc + r.sueno, 0);
  const sumEstres = records.reduce((acc, r) => acc + r.estres, 0);
  const sumEnergia = records.reduce((acc, r) => acc + r.energia, 0);

  const countVerde = records.filter((r) => r.riskLevel === "verde").length;
  const countAmarillo = records.filter((r) => r.riskLevel === "amarillo").length;
  const countRojo = records.filter((r) => r.riskLevel === "rojo").length;

  const pctVerde = Math.round((countVerde / count) * 100);
  const pctAmarillo = Math.round((countAmarillo / count) * 100);
  // Ajuste para asegurar que sumen 100%
  const pctRojo = Math.max(0, 100 - pctVerde - pctAmarillo);

  // Tendencia representativa calculada según el nivel de riesgo predominante
  const weeklyTrendPercent = pctVerde >= 60 ? 3.4 : pctRojo > 20 ? -2.1 : 1.2;

  return {
    avgAnimo: Math.round((sumAnimo / count) * 10) / 10,
    avgSueno: Math.round((sumSueno / count) * 10) / 10,
    avgEstres: Math.round((sumEstres / count) * 10) / 10,
    avgEnergia: Math.round((sumEnergia / count) * 10) / 10,
    pctVerde,
    pctAmarillo,
    pctRojo,
    weeklyTrendPercent,
    totalSamples: count,
  };
}

export function getSemesterChartData(careerFilter: TeshCareer | "all"): SemesterBarData[] {
  const records =
    careerFilter === "all"
      ? DIRECTIVO_MOCK_RECORDS
      : DIRECTIVO_MOCK_RECORDS.filter((r) => r.career === careerFilter);

  const semesters: SemesterBarData[] = [];

  for (let s = 1; s <= 9; s++) {
    const semRecords = records.filter((r) => r.semester === s);
    if (semRecords.length > 0) {
      // Bienestar = promedio de ánimo y energía, balanceado con el inverso del estrés
      const avgScore =
        semRecords.reduce((acc, r) => {
          const invEstres = 6 - r.estres;
          const score = (r.animo + r.energia + invEstres) / 3;
          return acc + score;
        }, 0) / semRecords.length;

      semesters.push({
        semesterLabel: `${s}º`,
        semesterNum: s,
        bienestarScore: Math.round(avgScore * 10) / 10,
        hasData: true,
      });
    } else {
      // Si la carrera seleccionada no tiene muestra en ese semestre específico,
      // estimar un valor representativo de tendencia académica
      const baseEstimate = s === 1 || s === 9 ? 4.1 : s >= 5 && s <= 6 ? 3.2 : 3.6;
      semesters.push({
        semesterLabel: `${s}º`,
        semesterNum: s,
        bienestarScore: baseEstimate,
        hasData: false,
      });
    }
  }

  return semesters;
}
