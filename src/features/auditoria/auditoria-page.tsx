import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldAlert,
  Blocks,
  Link2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Layers,
  Sparkles,
  ArrowLeft,
  Info,
  Network,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BRAND } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  POLYGON_AMOY_CONFIG,
  fetchUltimosBloques,
  verificarCadenaAuditoria,
  type AuditBlock,
  type VerificationResult,
} from "@/lib/blockchain-audit";

export function AuditoriaPage() {
  const [bloques, setBloques] = useState<AuditBlock[]>([]);
  const [totalBloques, setTotalBloques] = useState<number>(0);
  const [ultimoHash, setUltimoHash] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verificacion, setVerificacion] = useState<VerificationResult | null>(null);
  const [isVerifying, startVerifyTransition] = useTransition();

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      const res = await fetchUltimosBloques(20);
      setBloques(res.bloques);
      setTotalBloques(res.total);
      setUltimoHash(res.ultimoHash);
    } catch {
      toast.error("No se pudieron cargar los bloques de auditoría");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCopiar = (texto: string, label = "Hash") => {
    navigator.clipboard.writeText(texto);
    setCopiedHash(texto);
    toast.success(`${label} copiado al portapapeles`);
    setTimeout(() => {
      setCopiedHash((curr) => (curr === texto ? null : curr));
    }, 2000);
  };

  const handleVerificarCadena = () => {
    startVerifyTransition(async () => {
      try {
        const resultado = await verificarCadenaAuditoria(bloques);
        setVerificacion(resultado);
        if (resultado.valida) {
          toast.success("Cadena de bloques verificada con éxito: CADENA VÁLIDA");
        } else {
          toast.error(`Alerta de integridad: ${resultado.error || "Discrepancia detectada"}`);
        }
      } catch {
        toast.error("Error al procesar la verificación de la cadena");
      }
    });
  };

  const ancladosCount = bloques.filter((b) => Boolean(b.anclado_en)).length;

  return (
    <PageShell showAppHeader={false} showBottomNav={false}>
      {/* Encabezado Institucional de Protección de Datos */}
      <header className="border-b border-border/60 py-5 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/directivo"
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mr-2"
              >
                <ArrowLeft className="size-3.5" />
                <span>Volver al Panel</span>
              </Link>
              <span className="inline-block size-1.5 rounded-full bg-teal" />
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-teal">
                Oficina de Protección de Datos • {BRAND.fullName}
              </p>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-primary">
              Auditoría — Verificación de Integridad
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
              Registro inmutable de trazabilidad clínica anclado en la red pública Polygon Amoy
              (PB-015 / RNF02).
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cargarDatos}
              disabled={isLoading}
              className="rounded-xl border-border bg-card text-xs font-semibold gap-1.5 shadow-xs"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-teal" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="space-y-6 pt-6 pb-20">
        {/* (4) NOTA VISIBLE OBLIGATORIA */}
        <section
          aria-label="Declaración de privacidad médica en blockchain"
          className="rounded-2xl border-2 border-teal/40 bg-teal/5 p-4 sm:p-5 shadow-soft"
        >
          <div className="flex items-start gap-3.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal/15 text-teal mt-0.5">
              <Lock className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal">
                  Garantía de Confidencialidad Criptográfica
                </h2>
                <Badge
                  variant="outline"
                  className="rounded-md border-teal/30 bg-teal/10 text-[10px] font-semibold text-teal py-0 px-1.5"
                >
                  Zero-Knowledge Privacy
                </Badge>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                Los datos clínicos nunca se almacenan en la blockchain; solo sus huellas
                criptográficas.
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-normal">
                Cada evento médico (tamizaje, cita o nota) genera un digest SHA-256 matemático
                irreversible. Terceros y evaluadores externos pueden verificar la autenticidad e
                integridad del expediente sin acceder jamás a nombres, diagnósticos ni respuestas de
                los estudiantes.
              </p>
            </div>
          </div>
        </section>

        {/* (1) CONTADOR DE BLOQUES Y ÚLTIMO HASH */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bloques Registrados */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-soft space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">
                Total de Bloques Locales
              </span>
              <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <Blocks className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
                {totalBloques}
              </span>
              <span className="text-xs text-muted-foreground font-medium">bloques enlazados</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cadena hash secuencial SHA-256 sin rupturas
            </p>
          </div>

          {/* Anclajes en Polygon Amoy */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-soft space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">
                Anclajes en Polygon Amoy
              </span>
              <div className="grid size-8 place-items-center rounded-xl bg-teal/15 text-teal">
                <Network className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-teal">
                {ancladosCount}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                de {bloques.length} en ventana
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-teal-500" />
              <span>Chain ID {POLYGON_AMOY_CONFIG.chainId} (Amoy Testnet)</span>
            </div>
          </div>

          {/* Último Hash de la Cadena */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-soft space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Último Hash (Head)</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleCopiar(ultimoHash, "Último Hash")}
                title="Copiar hash completo"
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
              >
                {copiedHash === ultimoHash ? (
                  <Check className="size-3.5 text-teal-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/40 p-2 font-mono text-[11px] break-all leading-tight text-foreground select-all">
              {ultimoHash || "—"}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Sello raíz criptográfico del bloque más reciente
            </p>
          </div>
        </section>

        {/* (3) BOTÓN "VERIFICAR CADENA" Y ESTADO DEL RESULTADO */}
        <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="size-4 text-teal" />
                <span>Auditoría Matemática de Integridad</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Recorre la cadena bloque por bloque y verifica que ningún registro haya sido
                alterado o suprimido.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleVerificarCadena}
              disabled={isVerifying || isLoading}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold gap-2 px-4 shadow-sm"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Verificando hashes...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4 text-teal" />
                  <span>Verificar cadena</span>
                </>
              )}
            </Button>
          </div>

          {/* Resultado de la Verificación */}
          <AnimatePresence mode="wait">
            {verificacion && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                className={`rounded-xl border-2 p-4 sm:p-5 text-sm transition-colors ${
                  verificacion.valida
                    ? "border-teal-500/50 bg-teal-500/10 text-teal-950 dark:text-teal-100"
                    : "border-destructive/60 bg-destructive/10 text-destructive-foreground dark:text-destructive"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                        verificacion.valida
                          ? "bg-teal-500/20 text-teal-600 dark:text-teal-400"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {verificacion.valida ? (
                        <ShieldCheck className="size-5" />
                      ) : (
                        <ShieldAlert className="size-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-sm sm:text-base font-extrabold uppercase tracking-wide ${
                            verificacion.valida
                              ? "text-teal-700 dark:text-teal-300"
                              : "text-destructive"
                          }`}
                        >
                          {verificacion.mensaje}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase rounded-md px-1.5 py-0 ${
                            verificacion.valida
                              ? "border-teal-500/40 bg-teal-500/15 text-teal-700 dark:text-teal-300"
                              : "border-destructive/40 bg-destructive/15 text-destructive"
                          }`}
                        >
                          {verificacion.valida ? "100% Integra" : "Alteración detectada"}
                        </Badge>
                      </div>
                      <p className="text-xs opacity-90 leading-relaxed">
                        {verificacion.valida
                          ? `Se verificaron exitosamente ${verificacion.total_bloques} bloques consecutivos. Cada bloque coincide de forma unívoca con el hash anterior y sus firmas SHA-256.`
                          : `Se detectó una inconsistencia matemática en el bloque #${verificacion.indice_alterado}. Motivo: ${verificacion.error}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] opacity-75 font-mono">
                    <p>Verificado: {new Date(verificacion.verificado_en).toLocaleTimeString()}</p>
                    <p className="capitalize">Método: {verificacion.metodo.replace("_", " ")}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* (2) TABLA DE LOS ÚLTIMOS 20 BLOQUES */}
        <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-soft space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Link2 className="size-4 text-teal" />
                <span>Libro Mayor — Últimos 20 Bloques</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Inspección pública de índices, firmas criptográficas y transacciones en Polygon.
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-lg border-border text-[11px] font-semibold text-muted-foreground"
            >
              Mostrando {bloques.length} bloques
            </Badge>
          </div>

          <div className="rounded-xl border border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-16 font-bold text-xs">Índice</TableHead>
                  <TableHead className="font-bold text-xs">Tipo de Evento</TableHead>
                  <TableHead className="font-bold text-xs font-mono">Hash Criptográfico</TableHead>
                  <TableHead className="font-bold text-xs">Anclado en Polygon</TableHead>
                  <TableHead className="font-bold text-xs text-right">Fecha / Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bloques.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-xs text-muted-foreground"
                    >
                      No se encontraron bloques de auditoría registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  bloques.map((b) => {
                    const isAnchored = Boolean(b.anclado_en);
                    const explorerUrl = isAnchored
                      ? `${POLYGON_AMOY_CONFIG.explorerBaseUrl}${b.anclado_en}`
                      : null;

                    return (
                      <TableRow key={b.indice} className="hover:bg-muted/20 transition-colors">
                        {/* Índice */}
                        <TableCell className="font-mono font-bold text-xs text-foreground">
                          #{b.indice}
                        </TableCell>

                        {/* Tipo de evento */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`rounded-lg text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                              b.tipo_evento === "BLOQUE_GENESIS"
                                ? "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                : b.tipo_evento.includes("CRISIS")
                                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                                  : b.tipo_evento.includes("TAMIZAJE")
                                    ? "border-teal/40 bg-teal/10 text-teal"
                                    : "border-cyan/40 bg-cyan/10 text-cyan-600 dark:text-cyan-400"
                            }`}
                          >
                            {b.tipo_evento.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>

                        {/* Hash abreviado con botón copiar */}
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-foreground hover:text-teal transition-colors select-all cursor-pointer"
                              onClick={() => handleCopiar(b.hash_actual, `Bloque #${b.indice}`)}
                              title={b.hash_actual}
                            >
                              {b.hash_abreviado}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopiar(b.hash_actual, `Bloque #${b.indice}`)}
                              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                              title="Copiar hash completo"
                            >
                              {copiedHash === b.hash_actual ? (
                                <Check className="size-3 text-teal-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                        </TableCell>

                        {/* Anclado en Polygon Sí/No con enlace */}
                        <TableCell>
                          {isAnchored && explorerUrl ? (
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 px-2 py-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-colors"
                              title={`Ver transacción en PolygonScan Amoy (${b.anclado_en})`}
                            >
                              <span className="size-1.5 rounded-full bg-teal-500" />
                              <span>Sí (Amoy #{b.bloque_ext || "Tx"})</span>
                              <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-lime-500/30 bg-lime-500/10 px-2 py-1 text-[11px] font-semibold text-lime-600 dark:text-lime-400">
                              <span className="size-1.5 rounded-full bg-lime-500 animate-pulse" />
                              <span>No (Pendiente)</span>
                            </span>
                          )}
                        </TableCell>

                        {/* Fecha */}
                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(b.creado_en).toLocaleString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Ficha técnica de anclaje público */}
        <section className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Info className="size-4 text-teal" />
            <span>Especificaciones de la Red de Anclaje</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <span className="font-semibold text-foreground">Red: </span>
              <span>{POLYGON_AMOY_CONFIG.name}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">Chain ID: </span>
              <span>{POLYGON_AMOY_CONFIG.chainId}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">Mecanismo: </span>
              <span>Hash en Data Tx (Sin almacenamiento de datos clínicos)</span>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
