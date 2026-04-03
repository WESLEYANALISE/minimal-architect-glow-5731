import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, BookOpen, Loader2, ArrowUp, ArrowLeft, ListOrdered, Search, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QuestoesTrilhaTemas } from "@/components/questoes/QuestoesTrilhaTemas";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { InstantBackground } from "@/components/ui/instant-background";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";

// Mapeamento de código curto para nome da tabela no Supabase
const getTableName = (codigo: string): string => {
  const mapping: Record<string, string> = {
    "cf": "CF - Constituição Federal",
    "cp": "CP - Código Penal",
    "cc": "CC - Código Civil",
    "cpc": "CPC – Código de Processo Civil",
    "cpp": "CPP – Código de Processo Penal",
    "cdc": "CDC – Código de Defesa do Consumidor",
    "clt": "CLT - Consolidação das Leis do Trabalho",
    "ctn": "CTN – Código Tributário Nacional",
    "ctb": "CTB Código de Trânsito Brasileiro",
    "ce": "CE – Código Eleitoral",
    "cpm": "CPM – Código Penal Militar",
    "cppm": "CPPM – Código de Processo Penal Militar",
    "ca": "CA - Código de Águas",
    "cba": "CBA Código Brasileiro de Aeronáutica",
    "cbt": "CBT Código Brasileiro de Telecomunicações",
    "ccom": "CCOM – Código Comercial",
    "cdm": "CDM – Código de Minas",
    "eca": "ESTATUTO - ECA",
    "estatuto-idoso": "ESTATUTO - IDOSO",
    "estatuto-oab": "ESTATUTO - OAB",
    "estatuto-pcd": "ESTATUTO - PESSOA COM DEFICIÊNCIA",
    "estatuto-igualdade": "ESTATUTO - IGUALDADE RACIAL",
    "estatuto-cidade": "ESTATUTO - CIDADE",
    "estatuto-torcedor": "ESTATUTO - TORCEDOR",
    "lep": "Lei 7.210 de 1984 - Lei de Execução Penal",
    "lcp": "LCP - Lei das Contravenções Penais",
    "drogas": "Lei 11.343 de 2006 - Lei de Drogas",
    "maria-da-penha": "Lei 11.340 de 2006 - Maria da Penha",
    "crimes-hediondos": "Lei 8.072 de 1990 - Crimes Hediondos",
    "tortura": "Lei 9.455 de 1997 - Tortura",
    "organizacoes-criminosas": "Lei 12.850 de 2013 - Organizações Criminosas",
    "lavagem-dinheiro": "LLD - Lei de Lavagem de Dinheiro",
    "interceptacao-telefonica": "Lei 9.296 de 1996 - Interceptação Telefônica",
    "abuso-autoridade": "Lei 13.869 de 2019 - Abuso de Autoridade",
    "juizados-especiais-criminais": "Lei 9.099 de 1995 - Juizados Especiais",
    "estatuto-desarmamento": "ESTATUTO - DESARMAMENTO",
    "lei-beneficios": "LEI 8213 - Benefícios",
    "lei-custeio": "LEI 8212 - Custeio",
    "sumulas-stf": "SÚMULAS STF",
    "sumulas-vinculantes": "SÚMULAS VINCULANTES",
    "sumulas-stj": "SÚMULAS STJ",
    "sumulas-tst": "SÚMULAS TST",
    "sumulas-tse": "SÚMULAS TSE",
    "sumulas-stm": "SÚMULAS STM",
    "enunciados-cnj": "ENUNCIADOS CNJ",
    "enunciados-cnmp": "ENUNCIADOS CNMP",
  };
  return mapping[codigo.toLowerCase()] || codigo;
};

const getAreaName = (codigo: string): string => {
  const mapping: Record<string, string> = {
    "cf": "Constituição Federal",
    "cp": "Código Penal",
    "cc": "Código Civil",
    "cpc": "Código de Processo Civil",
    "cpp": "Código de Processo Penal",
    "cdc": "Código de Defesa do Consumidor",
    "clt": "CLT",
    "ctn": "Código Tributário Nacional",
    "ctb": "Código de Trânsito Brasileiro",
    "ce": "Código Eleitoral",
    "cpm": "Código Penal Militar",
    "cppm": "Código de Processo Penal Militar",
    "ca": "Código de Águas",
    "cba": "Código Brasileiro de Aeronáutica",
    "cbt": "Código de Telecomunicações",
    "ccom": "Código Comercial",
    "cdm": "Código de Minas",
    "eca": "ECA",
    "estatuto-idoso": "Estatuto do Idoso",
    "estatuto-oab": "Estatuto da OAB",
    "estatuto-pcd": "Estatuto da Pessoa com Deficiência",
    "estatuto-igualdade": "Estatuto da Igualdade Racial",
    "estatuto-cidade": "Estatuto da Cidade",
    "estatuto-torcedor": "Estatuto do Torcedor",
    "lep": "Lei de Execução Penal",
    "lcp": "Lei das Contravenções Penais",
    "drogas": "Lei de Drogas",
    "maria-da-penha": "Lei Maria da Penha",
    "crimes-hediondos": "Crimes Hediondos",
    "tortura": "Lei de Tortura",
    "organizacoes-criminosas": "Organizações Criminosas",
    "lavagem-dinheiro": "Lavagem de Dinheiro",
    "interceptacao-telefonica": "Interceptação Telefônica",
    "abuso-autoridade": "Abuso de Autoridade",
    "juizados-especiais-criminais": "Juizados Especiais",
    "estatuto-desarmamento": "Estatuto do Desarmamento",
    "lei-beneficios": "Lei de Benefícios",
    "lei-custeio": "Lei de Custeio",
    "sumulas-stf": "Súmulas STF",
    "sumulas-vinculantes": "Súmulas Vinculantes",
    "sumulas-stj": "Súmulas STJ",
    "sumulas-tst": "Súmulas TST",
    "sumulas-tse": "Súmulas TSE",
    "sumulas-stm": "Súmulas STM",
    "enunciados-cnj": "Enunciados CNJ",
    "enunciados-cnmp": "Enunciados CNMP",
  };
  return mapping[codigo.toLowerCase()] || codigo;
};

const getDisplayName = (codigo: string): string => getAreaName(codigo);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeArtigoNumber = (numero: string): string => {
  return numero
    .replace(/[ºª°]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();
};

const normalizar = (str: string) =>
  str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

const FAVORITES_KEY = "resumos-artigos-lei-favoritos";

const getFavorites = (area: string): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, string[]>;
    return all[area] || [];
  } catch { return []; }
};

const toggleFavorite = (area: string, tema: string): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, string[]> : {};
    const current = all[area] || [];
    if (current.includes(tema)) {
      all[area] = current.filter(t => t !== tema);
    } else {
      all[area] = [...current, tema];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(all));
    return all[area];
  } catch { return []; }
};

// Convert RGB string to hex
const rgbToHex = (rgb: string): string => {
  const match = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#ef4444";
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};

// Skeleton for loading
const TrilhaSkeleton = ({ hex }: { hex: string }) => (
  <div className="flex flex-col items-center gap-6 py-8 px-4 animate-fade-in">
    {Array.from({ length: 7 }).map((_, i) => {
      const isLeft = Math.floor(i / 1) % 2 === 0;
      return (
        <div
          key={i}
          className="flex items-center gap-4"
          style={{ alignSelf: isLeft ? 'flex-start' : 'flex-end', marginLeft: isLeft ? '15%' : '0', marginRight: isLeft ? '0' : '15%' }}
        >
          <div
            className="w-[90px] h-[90px] rounded-full animate-pulse"
            style={{ backgroundColor: `${hex}25`, border: `2px solid ${hex}20` }}
          />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full animate-pulse" style={{ backgroundColor: `${hex}15` }} />
            <div className="h-2 w-16 rounded-full animate-pulse" style={{ backgroundColor: `${hex}10` }} />
          </div>
        </div>
      );
    })}
  </div>
);

const ResumosArtigosLeiTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo");
  const cor = searchParams.get("cor") || "rgb(239, 68, 68)";
  const hexColor = rgbToHex(cor);

  const [activeTab, setActiveTab] = useState<"ordem" | "favoritos" | "pesquisar">("ordem");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Generation states (admin background generation)
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingArtigos, setCurrentGeneratingArtigos] = useState<string[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const generationStartedRef = useRef(false);

  const { isPremium } = useSubscription();
  const lockedFromIndex = (isPremium) ? undefined : 2;

  // Load favorites
  useEffect(() => {
    if (codigo) {
      setFavorites(getFavorites(codigo));
    }
  }, [codigo]);

  // Hide footer
  useEffect(() => {
    const footer = document.querySelector('[data-footer="main"]');
    if (footer) (footer as HTMLElement).style.display = 'none';
    return () => { if (footer) (footer as HTMLElement).style.display = ''; };
  }, []);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleToggleFavorite = (tema: string) => {
    if (!codigo) return;
    const updated = toggleFavorite(codigo, tema);
    setFavorites(updated);
  };

  const tableName = codigo ? getTableName(codigo) : "";
  const areaName = codigo ? getAreaName(codigo) : "";
  const displayName = codigo ? getDisplayName(codigo) : "";

  // Fetch articles from vade mecum table
  const { data: artigos, isLoading: isLoadingArtigos, isError: isErrorArtigos, refetch: refetchArtigos } = useQuery({
    queryKey: ["vade-mecum-artigos-resumos", tableName],
    queryFn: async () => {
      const allArticles: { numero: string; id: number; ordem: number }[] = [];
      let offset = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('"Número do Artigo", id, ordem_artigo')
          .order('ordem_artigo', { ascending: true, nullsFirst: false })
          .range(offset, offset + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        const articles = data
          .filter((row: any) => row["Número do Artigo"])
          .map((row: any) => ({
            numero: String(row["Número do Artigo"]),
            id: row.id,
            ordem: row.ordem_artigo || 999999,
          }));
        allArticles.push(...articles);
        offset += batchSize;
        if (data.length < batchSize) break;
      }
      return allArticles.sort((a, b) => a.ordem - b.ordem);
    },
    enabled: !!codigo,
  });

  // Fetch existing resumos
  const { data: resumosData, refetch: refetchExistentes } = useQuery({
    queryKey: ["resumos-existentes-v2", codigo],
    queryFn: async () => {
      const { count } = await supabase
        .from("RESUMOS_ARTIGOS_LEI")
        .select("*", { count: 'exact', head: true })
        .eq("area", areaName);

      const allTemas: string[] = [];
      let offset = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("RESUMOS_ARTIGOS_LEI")
          .select("tema")
          .eq("area", areaName)
          .order("id", { ascending: true })
          .range(offset, offset + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allTemas.push(...data.map((row: any) => row.tema).filter(Boolean));
        offset += batchSize;
        if (data.length < batchSize) break;
      }

      const artigosComResumo = new Set<string>();
      allTemas.forEach((tema: string) => {
        const temaStr = String(tema);
        artigosComResumo.add(temaStr);
        artigosComResumo.add(normalizeArtigoNumber(temaStr));
      });

      return { artigos: artigosComResumo, total: count || 0 };
    },
    staleTime: 0,
    enabled: !!codigo,
  });

  const resumosExistentes = resumosData?.artigos;
  const totalResumos = resumosData?.total || 0;

  // Generate resumo
  const generateResumoForArtigo = async (artigoNumero: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-resumo-artigo-lei', {
        body: { tableName, artigo: artigoNumero }
      });
      if (error) return false;
      if (data?.success) {
        setGeneratedCount(prev => prev + 1);
        refetchExistentes();
        return true;
      }
      return data?.cached || false;
    } catch { return false; }
  };

  // Auto-generate missing resumos
  useEffect(() => {
    if (!artigos || !resumosExistentes || generationStartedRef.current) return;
    const artigosFaltando = artigos
      .filter(a => !resumosExistentes.has(a.numero) && !resumosExistentes.has(normalizeArtigoNumber(a.numero)))
      .sort((a, b) => {
        const numA = parseInt(a.numero.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.numero.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

    if (artigosFaltando.length === 0) return;
    generationStartedRef.current = true;
    setIsGenerating(true);
    setTotalToGenerate(artigosFaltando.length);

    const generateAll = async () => {
      const BATCH_SIZE = 100;
      for (let i = 0; i < artigosFaltando.length; i += BATCH_SIZE) {
        const batch = artigosFaltando.slice(i, i + BATCH_SIZE);
        setCurrentGeneratingArtigos(batch.map(a => a.numero));
        await Promise.all(batch.map(artigo => generateResumoForArtigo(artigo.numero)));
        await delay(2000);
      }
      setIsGenerating(false);
      setCurrentGeneratingArtigos([]);
      toast.success(`Geração concluída! ${artigosFaltando.length} processados.`);
    };

    generateAll();
  }, [artigos, resumosExistentes]);

  // Build trail data
  const temasForTrail = useMemo(() => {
    if (!artigos) return [];
    let filtered = artigos;

    if (activeTab === "pesquisar" && searchTerm.trim()) {
      const term = normalizar(searchTerm);
      filtered = artigos.filter(a => normalizar(a.numero).includes(term));
    } else if (activeTab === "favoritos") {
      filtered = artigos.filter(a => favorites.includes(a.numero));
    }

    return filtered.map((a, i) => {
      const hasResumo = resumosExistentes?.has(a.numero) || resumosExistentes?.has(normalizeArtigoNumber(a.numero));
      return {
        tema: `Art. ${a.numero}`,
        temQuestoes: !!hasResumo,
        parcial: false,
        subtemasGerados: hasResumo ? 1 : 0,
        totalSubtemas: 1,
        totalQuestoes: hasResumo ? 1 : 0,
        progressoPercent: hasResumo ? 100 : 0,
        ordem: a.ordem || i + 1,
      };
    });
  }, [artigos, activeTab, searchTerm, favorites, resumosExistentes]);

  const handleTemaClick = (tema: string) => {
    // Extract article number from "Art. X"
    const artigoNum = tema.replace(/^Art\.\s*/, '');
    sessionStorage.setItem(`scroll-resumos-${codigo}`, window.scrollY.toString());
    navigate(`/resumos-juridicos/artigos-lei/view?codigo=${codigo}&artigo=${artigoNum}`);
  };

  // Determine back route
  const getBackRoute = () => {
    const c = codigo?.toLowerCase() || '';
    if (c === 'cf') return '/resumos-juridicos/artigos-lei';
    if (['cp','cc','cpc','cpp','clt','cdc','ctn','ctb','ce','cpm','cppm','ca','cba','cbt','ccom','cdm'].includes(c)) return '/resumos-juridicos/artigos-lei/codigos';
    if (['eca','estatuto-idoso','estatuto-oab','estatuto-pcd','estatuto-igualdade','estatuto-cidade','estatuto-torcedor','estatuto-desarmamento'].includes(c)) return '/resumos-juridicos/artigos-lei/estatutos';
    if (['lep','lcp','drogas','maria-da-penha','crimes-hediondos','tortura','organizacoes-criminosas','lavagem-dinheiro','interceptacao-telefonica','abuso-autoridade','juizados-especiais-criminais'].includes(c)) return '/resumos-juridicos/artigos-lei/legislacao-penal';
    if (['lei-beneficios','lei-custeio'].includes(c)) return '/resumos-juridicos/artigos-lei/previdenciario';
    if (c.startsWith('sumulas-') || c.startsWith('enunciados-')) return '/resumos-juridicos/artigos-lei/sumulas';
    return '/resumos-juridicos/artigos-lei';
  };

  // Restore scroll position
  useEffect(() => {
    if (!codigo) return;
    const savedScrollPos = sessionStorage.getItem(`scroll-resumos-${codigo}`);
    if (savedScrollPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos));
        sessionStorage.removeItem(`scroll-resumos-${codigo}`);
      }, 100);
    }
  }, [codigo]);

  if (!codigo) {
    navigate("/resumos-juridicos/artigos-lei");
    return null;
  }

  const totalArtigos = artigos?.length || 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <InstantBackground
        src={bgAreasOab}
        alt="Artigos"
        blurCategory="oab"
        gradientClassName="bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]"
      />

      {/* Header with color gradient */}
      <div
        className="relative overflow-hidden z-10"
        style={{ background: `linear-gradient(135deg, ${cor}, ${cor}dd)` }}
      >
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <FileText className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 pt-6 pb-5 px-4">
          <div className="max-w-lg mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(getBackRoute())}
              className="mb-3 bg-black/30 hover:bg-black/50 border border-white/20 rounded-full backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>

            <div className="flex items-center gap-4 animate-fade-in">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white line-clamp-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {displayName}
                </h1>
                <p className="text-sm text-white/70 mt-0.5">
                  Escolha um artigo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Stats */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: hexColor }} />
              <span>{totalArtigos} artigos</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: hexColor }} />
              <span>{totalResumos} resumos</span>
            </div>
          </div>
        </div>

        {/* Generation banner */}
        {isGenerating && (
          <div className="px-4 pb-3">
            <Card className="bg-gradient-to-r from-amber-900/30 to-orange-800/20 border-amber-700/30">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-300">
                      Gerando resumos automaticamente...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {generatedCount}/{totalToGenerate} processados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab switcher */}
        <div className="px-4 pb-2">
          <div className="max-w-lg mx-auto flex rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
            {([
              { id: "ordem", label: "Ordem", icon: ListOrdered },
              { id: "favoritos", label: "Favoritos", icon: Heart },
              { id: "pesquisar", label: "Pesquisar", icon: Search },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab.id ? "text-white shadow-md" : "text-white/50 hover:text-white/70"
                }`}
                style={activeTab === tab.id ? { backgroundColor: `${hexColor}40` } : {}}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        {activeTab === "pesquisar" && (
          <div className="px-4 pb-3 animate-fade-in">
            <div className="max-w-lg mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar artigo..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/30 backdrop-blur-sm"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* Favorites empty state */}
        {activeTab === "favoritos" && temasForTrail.length === 0 && !isLoadingArtigos && (
          <div className="text-center py-16 text-white/50 animate-fade-in">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum artigo favoritado ainda.</p>
            <p className="text-xs mt-1 text-white/30">Toque no ♡ na aba Ordem para favoritar.</p>
          </div>
        )}

        {/* Serpentine Trail */}
        {isLoadingArtigos ? (
          <TrilhaSkeleton hex={hexColor} />
        ) : isErrorArtigos ? (
          <div className="text-center py-16 text-white/60 animate-fade-in">
            <p className="mb-3">Erro ao carregar artigos</p>
            <button onClick={() => refetchArtigos()} className="text-sm text-primary underline">Tente novamente</button>
          </div>
        ) : temasForTrail.length > 0 ? (
          <div className="px-2">
            <QuestoesTrilhaTemas
              temas={temasForTrail}
              hexColor={hexColor}
              onTemaClick={handleTemaClick}
              icon={FileText}
              badgeLabel="resumos"
              lockedFromIndex={lockedFromIndex}
              onLockedClick={() => setShowPremiumModal(true)}
              favoritos={favorites}
              onToggleFavorito={handleToggleFavorite}
            />
          </div>
        ) : activeTab !== "favoritos" ? (
          <div className="text-center py-16 text-gray-400">
            {activeTab === "pesquisar" && searchTerm.trim()
              ? "Nenhum artigo encontrado para essa busca."
              : "Nenhum artigo encontrado"}
          </div>
        ) : null}
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 left-4 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 animate-fade-in"
          style={{ backgroundColor: `${hexColor}cc` }}
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </button>
      )}

      <PremiumFloatingCard
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Mais artigos de Lei"
        sourceFeature="Resumos Artigos Lei"
      />
    </div>
  );
};

export default ResumosArtigosLeiTemas;
