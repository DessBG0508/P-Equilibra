import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import type { RespuestaEncuesta } from "../encuesta/types";

interface ExportarEncuestaExcelProps {
  respuestas: RespuestaEncuesta[];
  nombreArchivo?: string;
  className?: string;
  variante?: "boton" | "compacto";
}

export const ExportarEncuestaExcel: React.FC<ExportarEncuestaExcelProps> = ({
  respuestas,
  nombreArchivo = "Equilibra_TESH_Encuesta_Satisfaccion_PB021",
  className = "",
  variante = "boton",
}) => {
  const [generando, setGenerando] = useState(false);
  const [exito, setExito] = useState(false);

  const handleExportarExcel = async () => {
    try {
      setGenerando(true);
      setExito(false);

      // 1. Mapear filas por cada paciente según especificación MIN-008
      const filas = respuestas.map((r) => {
        const promClinico =
          (r.q1_satisfaccion +
            r.q2_escuchado +
            r.q3_claridad +
            r.q4_respeto +
            r.q5_tiempo_espera +
            r.q6_utilidad +
            r.q7_mejoria +
            r.q8_recomendar) /
          8;

        const promEli = (r.q10a_facilidad_eli + r.q10b_util_eli) / 2;

        return {
          "Folio Paciente (MIN-008)": r.folio,
          "Fecha Respondida": r.respondida_en
            ? new Date(r.respondida_en).toLocaleString("es-MX", {
                timeZone: "America/Mexico_City",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Pendiente",
          "Tipo Disparador":
            r.trigger_tipo === "alta" ? "Alta (Completada 24h)" : "Abandono (2 Inasistencias 15d)",
          "Fecha Disparador": new Date(r.trigger_fecha).toLocaleDateString("es-MX"),
          "Q1 Satisfacción General (1-5)": r.q1_satisfaccion,
          "Q2 Escucha y Validación (1-5)": r.q2_escuchado,
          "Q3 Claridad de Metas (1-5)": r.q3_claridad,
          "Q4 Respeto y Privacidad (1-5)": r.q4_respeto,
          "Q5 Puntualidad y Espacio (1-5)": r.q5_tiempo_espera,
          "Q6 Utilidad Estrategias (1-5)": r.q6_utilidad,
          "Q7 Percepción Mejoría (1-5)": r.q7_mejoria,
          "Q8 Recomendaría Servicio (1-5)": r.q8_recomendar,
          "Q9 Comentarios y Sugerencias": r.q9_comentarios || "—",
          "Q10.A Eli Tamizaje Inicial (1-5)": r.q10a_facilidad_eli,
          "Q10.B Eli Utilidad Orientación (1-5)": r.q10b_util_eli,
          "Promedio Acompañamiento": Number(promClinico.toFixed(2)),
          "Promedio Eli Asistente": Number(promEli.toFixed(2)),
          "Hash Auditoría SHA-256": r.hash_auditoria || "—",
        };
      });

      // 2. Crear hoja de trabajo y libro de cálculo con SheetJS
      const hoja = XLSX.utils.json_to_sheet(filas);

      // 3. Ajustar anchos automáticos de columnas para legibilidad profesional
      const anchos = [
        { wch: 18 }, // Folio
        { wch: 20 }, // Fecha Respondida
        { wch: 24 }, // Tipo Disparador
        { wch: 16 }, // Fecha Disparador
        { wch: 14 }, // Q1
        { wch: 14 }, // Q2
        { wch: 14 }, // Q3
        { wch: 14 }, // Q4
        { wch: 14 }, // Q5
        { wch: 14 }, // Q6
        { wch: 14 }, // Q7
        { wch: 14 }, // Q8
        { wch: 45 }, // Q9 Comentarios
        { wch: 16 }, // Q10A
        { wch: 16 }, // Q10B
        { wch: 16 }, // Promedio
        { wch: 16 }, // Promedio Eli
        { wch: 32 }, // Hash
      ];
      hoja["!cols"] = anchos;

      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Encuestas PB-021");

      // 4. Nombre con fecha actual
      const timestamp = new Date().toISOString().slice(0, 10);
      const nombreFinal = `${nombreArchivo}_${timestamp}.xlsx`;

      XLSX.writeFile(libro, nombreFinal);

      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      console.error("Error al exportar encuesta a Excel:", err);
    } finally {
      setGenerando(false);
    }
  };

  if (variante === "compacto") {
    return (
      <button
        type="button"
        onClick={handleExportarExcel}
        disabled={generando || respuestas.length === 0}
        title="Exportar base completa a Excel (.xlsx)"
        className={`inline-flex items-center gap-1.5 rounded-xl border border-[#C3B3F1] bg-card px-3 py-1.5 text-xs font-bold text-[#6857E4] shadow-xs hover:bg-[#6857E4]/10 disabled:opacity-40 transition-colors ${className}`}
      >
        {generando ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : exito ? (
          <CheckCircle2 className="size-3.5 text-teal-600" />
        ) : (
          <FileSpreadsheet className="size-3.5" />
        )}
        <span>{generando ? "Exportando..." : exito ? "Descargado" : "Excel"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleExportarExcel}
      disabled={generando || respuestas.length === 0}
      className={`inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6857E4] to-[#1B198F] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 active:scale-98 transition-all ${className}`}
    >
      {generando ? (
        <Loader2 className="size-4 animate-spin" />
      ) : exito ? (
        <CheckCircle2 className="size-4 text-teal-300" />
      ) : (
        <Download className="size-4" />
      )}
      <span>
        {generando
          ? "Generando Excel..."
          : exito
            ? "¡Descarga iniciada!"
            : `Exportar a Excel (.xlsx) [${respuestas.length}]`}
      </span>
    </button>
  );
};
