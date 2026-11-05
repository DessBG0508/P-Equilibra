import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { PageShell } from "@/components/layout/page-shell";
import { resourceIcons } from "@/config/icons";
import { psychoResources } from "@/lib/resources-data";
import type { PsychoResource, ResourceCategory } from "@/lib/types";
import { BRAND } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const CATEGORIES: Array<"Todos" | ResourceCategory> = [
  "Todos",
  "Ansiedad",
  "Estrés",
  "Sueño",
  "Ánimo",
  "Respiración",
];

function getCategoryTone(category: ResourceCategory): string {
  switch (category) {
    case "Respiración":
      return "bg-mint-soft text-teal border-mint/40";
    case "Ansiedad":
      return "bg-cyan-soft text-cyan-700 dark:text-cyan-400 border-cyan/40";
    case "Sueño":
      return "bg-lavender-soft text-[#6857E4] border-lavender/40";
    case "Estrés":
      return "bg-teal-soft text-teal border-teal/40";
    case "Ánimo":
      return "bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getIconComponent(iconName: PsychoResource["iconName"]) {
  switch (iconName) {
    case "wind":
      return resourceIcons.wind;
    case "moon":
      return resourceIcons.moon;
    case "sun":
      return resourceIcons.sun;
    case "heart":
      return resourceIcons.heart;
    case "compass":
      return resourceIcons.compass;
    case "brain":
      return resourceIcons.brain;
    case "feather":
      return resourceIcons.feather;
    case "smile":
      return resourceIcons.smile;
    case "bookOpen":
      return resourceIcons.bookOpen;
    default:
      return resourceIcons.bookOpen;
  }
}

export function RecursosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"Todos" | ResourceCategory>("Todos");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<"all" | "under5" | "over5">("all");
  const [activeResource, setActiveResource] = useState<PsychoResource | null>(null);

  const filteredResources = useMemo(() => {
    return psychoResources.filter((rec) => {
      const matchesCategory = selectedCategory === "Todos" || rec.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        rec.title.toLowerCase().includes(query) ||
        rec.shortDescription.toLowerCase().includes(query) ||
        rec.category.toLowerCase().includes(query);

      const minutes = parseInt(rec.readTime, 10) || 3;
      const matchesTime =
        selectedTimeFilter === "all" ||
        (selectedTimeFilter === "under5" && minutes < 5) ||
        (selectedTimeFilter === "over5" && minutes >= 5);

      return matchesCategory && matchesSearch && matchesTime;
    });
  }, [searchQuery, selectedCategory, selectedTimeFilter]);

  return (
    <PageShell>
      <main className="space-y-8 animate-fade-in pb-16">
        <AnimatePresence mode="wait">
          {activeResource ? (
            /* Vista de Lectura Completa del Recurso */
            <motion.article
              key="resource-detail"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveResource(null)}
                  className="h-9 gap-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-accent/10 hover:text-accent"
                >
                  <resourceIcons.arrowLeft className="size-4" />
                  <span>Volver a la biblioteca</span>
                </Button>

                <Badge
                  variant="secondary"
                  className={`rounded-xl px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getCategoryTone(
                    activeResource.category,
                  )}`}
                >
                  {activeResource.category}
                </Badge>
              </div>

              {/* Encabezado del artículo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                  <resourceIcons.clock className="size-3.5" />
                  <span>{activeResource.readTime}</span>
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  {activeResource.title}
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {activeResource.shortDescription}
                </p>
              </div>

              {/* Contenido en párrafos cómodos */}
              <div className="ethereal-card space-y-5 p-6 sm:p-8 text-foreground/90 leading-relaxed text-sm sm:text-base">
                {activeResource.content.map((paragraph, index) => (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}

                {activeResource.keyTakeaway && (
                  <div className="mt-6 rounded-2xl bg-lavender-soft/60 border border-accent/20 p-4 sm:p-5 text-primary">
                    <div className="flex items-center gap-2 font-display text-sm font-bold text-accent mb-1.5">
                      <resourceIcons.sparkles className="size-4" />
                      <span>Idea para recordar</span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                      {activeResource.keyTakeaway}
                    </p>
                  </div>
                )}
              </div>

              {/* Barra inferior de acciones */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveResource(null)}
                  className="rounded-2xl h-11 px-6 text-xs font-semibold"
                >
                  <resourceIcons.arrowLeft className="mr-2 size-4" />
                  <span>Regresar a recursos</span>
                </Button>

                <Button
                  asChild
                  className="rounded-2xl h-11 px-6 bg-[#6857E4] text-white hover:bg-[#6857E4] text-xs font-semibold shadow-soft"
                >
                  <Link to="/chat">
                    <resourceIcons.sparkles className="mr-2 size-4" />
                    <span>Conversar con {BRAND.assistant} sobre este tema</span>
                  </Link>
                </Button>
              </div>
            </motion.article>
          ) : (
            /* Vista Principal: Buscador, Filtros y Grid */
            <motion.div
              key="resource-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-7"
            >
              {/* Header de la sección */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-accent">
                  <resourceIcons.bookOpen className="size-3.5" />
                  <span>Biblioteca de autocuidado</span>
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  Recursos y herramientas de bienestar
                </h1>
                <p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
                  Lecturas breves, ejercicios prácticos y técnicas validadas para acompañarte a tu
                  propio ritmo.
                </p>
              </section>

              {/* Buscador interactivo */}
              <section className="relative max-w-md">
                <resourceIcons.search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por técnica, emoción o palabra clave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-2xl pl-10 pr-4 text-sm bg-card/80 border-border/80 shadow-soft focus-visible:ring-accent"
                />
              </section>

              {/* Filtros por Categoría en Chips */}
              <section aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-2xl px-4 py-2 text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-[#6857E4] text-white shadow-soft font-bold scale-[1.02]"
                          : "border border-border/70 bg-card/70 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </section>

              {/* Filtro por Tiempo de Lectura / Disponibilidad */}
              <section
                aria-label="Filtrar por tiempo de lectura"
                className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/60 p-3 sm:p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <resourceIcons.clock className="size-3.5 text-accent" />
                    <span>Tiempo de lectura</span>
                  </div>
                  {selectedTimeFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => setSelectedTimeFilter("all")}
                      className="text-[11px] font-semibold text-accent hover:underline"
                    >
                      Mostrar todas
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedTimeFilter("all")}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      selectedTimeFilter === "all"
                        ? "bg-accent/15 text-accent border border-accent/40 font-bold shadow-2xs"
                        : "border border-border/70 bg-card/80 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <span>Cualquier duración</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTimeFilter("under5")}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      selectedTimeFilter === "under5"
                        ? "bg-teal-soft text-teal border border-teal/40 font-bold shadow-2xs"
                        : "border border-border/70 bg-card/80 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <span>Menos de 5 min</span>
                    <span className="text-[10px] font-normal opacity-80">(Pausas breves)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTimeFilter("over5")}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      selectedTimeFilter === "over5"
                        ? "bg-lavender-soft text-[#6857E4] border border-lavender/40 font-bold shadow-2xs"
                        : "border border-border/70 bg-card/80 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <span>5 min o más</span>
                    <span className="text-[10px] font-normal opacity-80">(Guías detalladas)</span>
                  </button>
                </div>
              </section>

              {/* Grid de Cards (1 col móvil, 2 tablet, 3 escritorio) */}
              <section aria-labelledby="resources-grid-title" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2
                    id="resources-grid-title"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    {filteredResources.length} recurso
                    {filteredResources.length === 1 ? "" : "s"} disponible
                    {filteredResources.length === 1 ? "" : "s"}
                  </h2>
                </div>

                {filteredResources.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredResources.map((resource) => {
                      const IconComponent = getIconComponent(resource.iconName);
                      return (
                        <article
                          key={resource.id}
                          onClick={() => setActiveResource(resource)}
                          className="ethereal-card group flex flex-col justify-between p-5 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-float cursor-pointer"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              {/* Círculo suave con icono Lucide */}
                              <div
                                className={`grid size-11 shrink-0 place-items-center rounded-2xl ${getCategoryTone(
                                  resource.category,
                                )} transition-transform group-hover:scale-105`}
                              >
                                <IconComponent className="size-5" />
                              </div>

                              <Badge
                                variant="secondary"
                                className={`rounded-xl px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getCategoryTone(
                                  resource.category,
                                )}`}
                              >
                                {resource.category}
                              </Badge>
                            </div>

                            <div>
                              <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                                {resource.title}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                {resource.shortDescription}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-medium">
                              <resourceIcons.clock className="size-3.5 text-accent" />
                              <span>{resource.readTime}</span>
                            </span>

                            <span className="font-semibold text-accent group-hover:underline">
                              Leer técnica →
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  /* Estado sin resultados */
                  <div className="ethereal-card flex flex-col items-center justify-center p-8 text-center sm:p-12">
                    <resourceIcons.bookOpen className="size-10 text-muted-foreground/60 mb-3" />
                    <h3 className="font-display text-lg font-bold text-foreground">
                      No encontramos recursos con ese criterio
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                      Prueba buscando con otra palabra o selecciona "Todos" para ver todas las
                      técnicas disponibles.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("Todos");
                      }}
                      className="mt-4 rounded-xl text-xs font-semibold"
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageShell>
  );
}
