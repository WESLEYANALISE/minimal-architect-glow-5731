import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, BookOpen, Brain, Target, FileText, Library, ScrollText, PlayCircle, ChevronRight, Search, BookMarked } from "lucide-react";
import { motion } from "framer-motion";
import { getAreaHex } from "@/lib/flashcardsAreaColors";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { UniversalImage } from "@/components/ui/universal-image";
import { LivroCard } from "@/components/LivroCard";
import { Input } from "@/components/ui/input";

import capaSem1 from "@/assets/capa-semestre-1.webp";
import capaSem2 from "@/assets/capa-semestre-2.webp";
import capaSem3 from "@/assets/capa-semestre-3.webp";
import capaSem4 from "@/assets/capa-semestre-4.webp";
import capaSem5 from "@/assets/capa-semestre-5.webp";
import capaSem6 from "@/assets/capa-semestre-6.webp";
import capaSem7 from "@/assets/capa-semestre-7.webp";
import capaSem8 from "@/assets/capa-semestre-8.webp";
import capaSem9 from "@/assets/capa-semestre-9.webp";
import capaSem10 from "@/assets/capa-semestre-10.webp";

const CAPAS_SEMESTRE = [capaSem1, capaSem2, capaSem3, capaSem4, capaSem5, capaSem6, capaSem7, capaSem8, capaSem9, capaSem10];

const TIPO_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  aulas: { label: "Aulas", icon: PlayCircle, color: "#b8334a" },
  resumos: { label: "Resumos", icon: FileText, color: "#0f766e" },
  biblioteca: { label: "Biblioteca", icon: Library, color: "#92400e" },
  flashcards: { label: "Flashcards", icon: Brain, color: "#1d4ed8" },
  questoes: { label: "Questões", icon: Target, color: "#c2410c" },
  simulado: { label: "Simulado", icon: ScrollText, color: "#7b2d8e" },
};

const CLASSICOS_POR_SEMESTRE: Record<number, { from: number; to: number }> = {
  1: { from: 0, to: 2 },
  2: { from: 3, to: 5 },
  3: { from: 6, to: 8 },
  4: { from: 9, to: 11 },
  5: { from: 12, to: 14 },
  6: { from: 15, to: 17 },
  7: { from: 18, to: 20 },
  8: { from: 21, to: 23 },
  9: { from: 24, to: 25 },
  10: { from: 26, to: 27 },
};

const MAX_VISIBLE = 6;

const FaculdadeSemestreConteudo = () => {
  const { universidadeId, numero, tipo } = useParams<{ universidadeId: string; numero: string; tipo: string }>();
  const navigate = useNavigate();
  const semestreNum = parseInt(numero || "1");
  const uniId = parseInt(universidadeId || "1");
  const tipoAtual = tipo || "resumos";
  const config = TIPO_CONFIG[tipoAtual] || TIPO_CONFIG.resumos;
  const TipoIcon = config.icon;

  const [bibliotecaTab, setBibliotecaTab] = useState<"estudos" | "classicos" | "plano">("estudos");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});

  const capaSemestre = CAPAS_SEMESTRE[(semestreNum - 1) % 10];

  // Fetch disciplinas do semestre com area_conteudo
  const { data: disciplinas, isLoading: loadingDisc } = useQuery({
    queryKey: ["faculdade-disc-areas", uniId, semestreNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculdade_disciplinas")
        .select("id, nome, area_conteudo")
        .eq("universidade_id", uniId)
        .eq("semestre", semestreNum)
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  const areasDoSemestre = [...new Set((disciplinas || []).map(d => (d as any).area_conteudo).filter(Boolean))] as string[];

  // Fetch content counts per area (for non-biblioteca types)
  const { data: conteudoAreas, isLoading: loadingContent } = useQuery({
    queryKey: ["faculdade-conteudo-areas", tipoAtual, areasDoSemestre],
    queryFn: async () => {
      if (areasDoSemestre.length === 0) return [];
      const results: { area: string; count: number; disciplinas: string[] }[] = [];
      for (const area of areasDoSemestre) {
        const discsArea = (disciplinas || []).filter(d => (d as any).area_conteudo === area).map(d => d.nome);
        let count = 0;
        try {
          if (tipoAtual === "resumos") {
            const { count: c } = await supabase.from("RESUMO").select("*", { count: "exact", head: true }).eq("area", area);
            count = c || 0;
          } else if (tipoAtual === "flashcards") {
            const { count: c } = await supabase.from("FLASHCARDS_GERADOS").select("*", { count: "exact", head: true }).eq("area", area);
            count = c || 0;
          } else if (tipoAtual === "questoes" || tipoAtual === "simulado") {
            const { count: c } = await supabase.from("QUESTOES_GERADAS").select("*", { count: "exact", head: true }).eq("area", area);
            count = c || 0;
          } else if (tipoAtual === "aulas") {
            const { count: c } = await supabase.from("aulas_interativas").select("*", { count: "exact", head: true }).eq("area", area);
            count = c || 0;
          }
        } catch { count = 0; }
        if (count > 0) {
          results.push({ area, count, disciplinas: discsArea });
        }
      }
      return results.sort((a, b) => b.count - a.count);
    },
    enabled: areasDoSemestre.length > 0 && tipoAtual !== "biblioteca",
  });

  // Fetch biblioteca books grouped by area
  const { data: livrosPorArea, isLoading: loadingLivros } = useQuery({
    queryKey: ["faculdade-biblioteca-carousel", areasDoSemestre],
    queryFn: async () => {
      if (areasDoSemestre.length === 0) return {};
      const grouped: Record<string, any[]> = {};
      for (const area of areasDoSemestre) {
        const { data } = await supabase
          .from("BIBLIOTECA-ESTUDOS")
          .select("id, Tema, \"Capa-livro\", url_capa_gerada, Sobre, Ordem")
          .eq("Área", area)
          .order("Ordem");
        if (data && data.length > 0) {
          grouped[area] = data;
        }
      }
      return grouped;
    },
    enabled: areasDoSemestre.length > 0 && tipoAtual === "biblioteca",
  });

  // Fetch classicos
  const { data: classicos, isLoading: loadingClassicos } = useQuery({
    queryKey: ["faculdade-classicos-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBLIOTECA-CLASSICOS")
        .select("id, livro, autor, imagem, sobre, area")
        .order("id");
      if (error) throw error;
      return data || [];
    },
    enabled: tipoAtual === "biblioteca",
  });

  // Fetch plano de leitura do usuario
  const { data: planoLeitura } = useQuery({
    queryKey: ["faculdade-plano-leitura", semestreNum],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("biblioteca_plano_leitura")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: tipoAtual === "biblioteca",
  });

  const classicosSemestre = useMemo(() => {
    if (!classicos) return [];
    const range = CLASSICOS_POR_SEMESTRE[semestreNum];
    if (!range) return [];
    return classicos.slice(range.from, range.to + 1);
  }, [classicos, semestreNum]);

  // Filter books by search query
  const filteredLivrosPorArea = useMemo(() => {
    if (!livrosPorArea || !searchQuery.trim()) return livrosPorArea || {};
    const q = searchQuery.toLowerCase();
    const filtered: Record<string, any[]> = {};
    for (const [area, livros] of Object.entries(livrosPorArea)) {
      const match = livros.filter((l: any) =>
        (l.Tema || "").toLowerCase().includes(q) || area.toLowerCase().includes(q)
      );
      if (match.length > 0) filtered[area] = match;
    }
    return filtered;
  }, [livrosPorArea, searchQuery]);

  const filteredClassicos = useMemo(() => {
    if (!searchQuery.trim()) return classicosSemestre;
    const q = searchQuery.toLowerCase();
    return classicosSemestre.filter((l: any) =>
      (l.livro || "").toLowerCase().includes(q) || (l.autor || "").toLowerCase().includes(q)
    );
  }, [classicosSemestre, searchQuery]);

  const isLoading = loadingDisc || (tipoAtual === "biblioteca" ? loadingLivros : loadingContent);

  // For questoes and flashcards, redirect to their full hub pages
  const shouldRedirectToHub = tipoAtual === "questoes" || tipoAtual === "flashcards";

  const handleAreaClick = (area: string) => {
    switch (tipoAtual) {
      case "resumos":
        navigate(`/resumos-juridicos/prontos/${encodeURIComponent(area)}`);
        break;
      case "flashcards":
        navigate(`/flashcards/temas?area=${encodeURIComponent(area)}`);
        break;
      case "questoes":
      case "simulado":
        navigate(`/ferramentas/questoes/temas?area=${encodeURIComponent(area)}`);
        break;
      case "aulas":
        navigate(`/aulas/area/${encodeURIComponent(area)}`);
        break;
    }
  };

  const getCountLabel = (count: number) => {
    switch (tipoAtual) {
      case "flashcards": return `${count} cards`;
      case "questoes": case "simulado": return `${count} questões`;
      case "aulas": return `${count} aulas`;
      case "resumos": return `${count} resumos`;
      default: return `${count} itens`;
    }
  };

  const totalLivros = Object.values(livrosPorArea || {}).reduce((acc, arr) => acc + arr.length, 0);

  // Biblioteca view
  const renderBiblioteca = () => {
    const areas = Object.keys(filteredLivrosPorArea);

    return (
      <div className="pb-24">
        {/* Search bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar livros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-card border-border rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Toggle Estudos / Clássicos / Plano */}
        <div className="px-4 py-2">
          <ToggleGroup
            type="single"
            value={bibliotecaTab}
            onValueChange={(val) => val && setBibliotecaTab(val as any)}
            className="justify-start gap-2"
          >
            <ToggleGroupItem
              value="estudos"
              className="rounded-full px-4 py-1.5 text-xs font-medium border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              📚 Estudos
            </ToggleGroupItem>
            <ToggleGroupItem
              value="classicos"
              className="rounded-full px-4 py-1.5 text-xs font-medium border border-border data-[state=on]:bg-amber-600 data-[state=on]:text-white"
            >
              📖 Clássicos
            </ToggleGroupItem>
            <ToggleGroupItem
              value="plano"
              className="rounded-full px-4 py-1.5 text-xs font-medium border border-border data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
            >
              📋 Plano
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {bibliotecaTab === "estudos" ? (
          loadingLivros ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : areas.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Library className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Nenhum livro encontrado" : "Nenhum livro disponível para este semestre"}
              </p>
            </div>
          ) : (
            <div className="space-y-5 pt-1">
              {areas.map((area, areaIdx) => {
                const livros = filteredLivrosPorArea[area] || [];
                const areaColor = getAreaHex(area);
                const isExpanded = expandedAreas[area];
                const visibleLivros = isExpanded ? livros : livros.slice(0, MAX_VISIBLE);
                const hasMore = livros.length > MAX_VISIBLE;

                return (
                  <motion.div
                    key={area}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: areaIdx * 0.08 }}
                  >
                    {/* Area header */}
                    <div className="flex items-center gap-2 px-4 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${areaColor}20` }}>
                        <BookOpen className="w-3.5 h-3.5" style={{ color: areaColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">{area}</h3>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{livros.length} livros</span>
                    </div>

                    {/* Horizontal carousel */}
                    <ScrollArea className="w-full">
                      <div className="flex gap-3 px-4 pb-2">
                        {visibleLivros.map((livro: any) => {
                          const capa = livro.url_capa_gerada || livro["Capa-livro"];
                          return (
                            <button
                              key={livro.id}
                              onClick={() => navigate(`/biblioteca-estudos/${livro.id}`)}
                              className="flex-shrink-0 w-[110px] group text-left"
                            >
                              <div className="relative w-[110px] h-[150px] rounded-xl overflow-hidden bg-gradient-to-br from-accent/20 to-accent/5 shadow-lg group-hover:shadow-xl transition-shadow shine-effect">
                                {capa ? (
                                  <UniversalImage
                                    src={capa}
                                    alt={livro.Tema || ""}
                                    containerClassName="w-full h-full"
                                    className="group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="w-8 h-8 text-accent/50" />
                                  </div>
                                )}
                              </div>
                              <p className="text-[11px] font-medium text-foreground mt-1.5 line-clamp-2 leading-tight">
                                {livro.Tema || "Sem título"}
                              </p>
                            </button>
                          );
                        })}

                        {/* Ver mais button inline */}
                        {hasMore && !isExpanded && (
                          <button
                            onClick={() => setExpandedAreas(prev => ({ ...prev, [area]: true }))}
                            className="flex-shrink-0 w-[80px] h-[150px] rounded-xl border border-border/50 bg-card/50 flex flex-col items-center justify-center gap-2 hover:bg-card transition-colors"
                          >
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground font-medium">
                              +{livros.length - MAX_VISIBLE}
                            </span>
                          </button>
                        )}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : bibliotecaTab === "classicos" ? (
          loadingClassicos ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredClassicos.length === 0 ? (
            <div className="text-center py-16 px-4">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Nenhum clássico encontrado" : "Nenhum clássico atribuído a este semestre"}
              </p>
            </div>
          ) : (
            <div className="px-3 space-y-3 pt-1">
              <p className="text-xs text-muted-foreground px-1">
                {filteredClassicos.length} {filteredClassicos.length === 1 ? "clássico recomendado" : "clássicos recomendados"} para o {semestreNum}º semestre
              </p>
              {filteredClassicos.map((livro: any, index: number) => (
                <motion.div
                  key={livro.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <LivroCard
                    titulo={livro.livro || "Sem título"}
                    autor={livro.autor}
                    capaUrl={livro.imagem}
                    sobre={livro.sobre?.substring(0, 150) + "..."}
                    numero={index + 1}
                    onClick={() => navigate(`/biblioteca-classicos/${livro.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          )
        ) : (
          /* Plano de leitura */
          <div className="px-4 pt-2 pb-24">
            {!planoLeitura || planoLeitura.length === 0 ? (
              <div className="text-center py-16">
                <BookMarked className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <h3 className="text-sm font-semibold text-foreground mb-1">Plano de Leitura</h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-[250px] mx-auto">
                  Organize seus livros por prioridade. Marque os que está lendo e os que já concluiu.
                </p>
                <button
                  onClick={() => navigate(`/bibliotecas`)}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Explorar Biblioteca
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {planoLeitura.length} {planoLeitura.length === 1 ? "livro" : "livros"} no seu plano
                </p>
                {planoLeitura.map((item: any, index: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    {item.capa_url && (
                      <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <UniversalImage src={item.capa_url} alt={item.titulo} containerClassName="w-full h-full" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">{item.titulo}</h4>
                      <p className="text-[11px] text-muted-foreground capitalize">{item.status}</p>
                      {item.progresso > 0 && (
                        <div className="w-full h-1.5 bg-muted rounded-full mt-1.5">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${item.progresso}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Generic area list view
  const renderAreaList = () => (
    isLoading ? (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    ) : !conteudoAreas || conteudoAreas.length === 0 ? (
      <div className="text-center py-16 px-4">
        <TipoIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhum conteúdo disponível para as áreas deste semestre</p>
      </div>
    ) : (
      <div className="px-3 py-4 space-y-2">
        {conteudoAreas.map((item, index) => {
          const areaColor = getAreaHex(item.area);
          return (
            <motion.button
              key={item.area}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleAreaClick(item.area)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${areaColor}20` }}>
                <BookOpen className="w-5 h-5" style={{ color: areaColor }} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{item.area}</h3>
                <p className="text-[11px] text-muted-foreground">{getCountLabel(item.count)}</p>
                {item.disciplinas.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{item.disciplinas.join(", ")}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
            </motion.button>
          );
        })}
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Big cover like simulados */}
      <div className="relative w-full h-[220px] overflow-hidden">
        <img
          src={capaSemestre}
          alt={`${semestreNum}º Semestre`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(`/faculdade/universidade/${uniId}/semestre/${semestreNum}`)}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${config.color}40` }}>
              <TipoIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/70 text-xs font-medium">{semestreNum}º Semestre</span>
          </div>
          <h1 className="text-xl font-bold text-white">{config.label}</h1>
          <p className="text-white/60 text-xs mt-0.5">
            {areasDoSemestre.length} áreas{tipoAtual === "biblioteca" ? ` · ${totalLivros} livros` : ""}
          </p>
        </div>
      </div>

      {tipoAtual === "biblioteca" ? renderBiblioteca() : renderAreaList()}
    </div>
  );
};

export default FaculdadeSemestreConteudo;
