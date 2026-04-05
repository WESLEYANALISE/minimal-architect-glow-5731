import { useState, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, Star, Film, Tv, Video, ChevronRight, Search, ArrowLeft, Clapperboard, Popcorn, Info, Calendar, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JuriFlixTituloEnriquecido } from "@/types/juriflix.types";
import { useInstantCache } from "@/hooks/useInstantCache";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useDeviceType } from "@/hooks/use-device-type";
import { JuriflixFavoritoButton } from "@/components/juriflix/JuriflixFavoritoButton";
import { JuriflixFavoritosSheet } from "@/components/juriflix/JuriflixFavoritosSheet";
import { useJuriflixFavoritos } from "@/hooks/useJuriflixFavorito";

// Card Netflix — aceita size variant
const NetflixCard = memo(({ titulo, onClick, size = "sm" }: { titulo: JuriFlixTituloEnriquecido; onClick: () => void; size?: "sm" | "md" | "lg" }) => {
  const imageUrl = titulo.poster_path || titulo.capa;
  const widthClass = size === "lg" ? "w-[200px]" : size === "md" ? "w-[160px]" : "w-[140px]";
  
  return (
    <div 
      className={`${widthClass} shrink-0 cursor-pointer group`}
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card/50 mb-2 ring-1 ring-white/10 shadow-lg group-hover:shadow-2xl group-hover:shadow-red-500/20 group-hover:ring-red-500/50 transition-all duration-300 group-hover:scale-105">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={titulo.nome || ""}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/50 to-red-600/30">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {titulo.nota && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            {titulo.nota}
          </div>
        )}

        <JuriflixFavoritoButton juriflixId={titulo.id} className="absolute top-2 right-2" size="sm" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
          <div className="p-3 w-full">
            <div className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-xl w-fit mx-auto">
              <Play className="w-3 h-3 fill-black" />
              Ver mais
            </div>
            {size === "lg" && titulo.sinopse && (
              <p className="text-[10px] text-white/80 line-clamp-2 mt-2">{titulo.sinopse}</p>
            )}
          </div>
        </div>
      </div>
      
      <h3 className={`font-semibold line-clamp-2 leading-tight px-0.5 ${size === "lg" ? "text-sm" : "text-xs"}`}>{titulo.nome}</h3>
      <div className="flex items-center gap-1.5 mt-0.5 px-0.5">
        <span className="text-[10px] text-muted-foreground">{titulo.ano}</span>
        {titulo.duracao && (
          <span className="text-[10px] text-muted-foreground">• {titulo.duracao}min</span>
        )}
      </div>
    </div>
  );
});

NetflixCard.displayName = "NetflixCard";

// Hero Desktop — fullwidth com backdrop
const HeroDesktop = memo(({ destaque, onPlay }: { destaque: JuriFlixTituloEnriquecido; onPlay: () => void }) => {
  const bgImage = destaque.backdrop_path || destaque.poster_path || destaque.capa;
  return (
    <div className="relative h-[400px] overflow-hidden">
      <img 
        src={bgImage || ""} 
        alt={destaque.nome || ""}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent" />
      
      <div className="absolute top-4 left-6">
        <div className="flex items-center gap-1.5 bg-red-600 px-3 py-1.5 rounded-lg">
          <Clapperboard className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Em Destaque</span>
        </div>
      </div>

      <JuriflixFavoritoButton juriflixId={destaque.id} className="absolute top-4 right-6" size="md" />

      <div className="absolute bottom-0 left-0 right-0 p-8 max-w-3xl">
        <Badge variant="secondary" className="mb-3 text-xs px-3 py-1 bg-white/15 backdrop-blur-sm border-white/20 text-white">
          {destaque.tipo}
        </Badge>
        <h1 className="text-3xl xl:text-4xl font-bold mb-2 text-white drop-shadow-lg">{destaque.nome}</h1>
        <p className="text-sm text-white/70 line-clamp-2 mb-4 max-w-xl">{destaque.sinopse}</p>
        <div className="flex items-center gap-4 text-sm text-white/80 mb-5">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{destaque.nota}</span>
          </div>
          <span>{destaque.ano}</span>
          {destaque.plataforma && <span>• {destaque.plataforma}</span>}
          {destaque.duracao && <span>• {destaque.duracao} min</span>}
        </div>
        <Button onClick={onPlay} className="h-10 bg-white text-black hover:bg-white/90 font-bold shadow-xl">
          <Play className="w-4 h-4 mr-2 fill-black" />
          Ver Detalhes
        </Button>
      </div>
    </div>
  );
});

HeroDesktop.displayName = "HeroDesktop";

// Hero Mobile
const HeroMobile = memo(({ destaque, onPlay }: { destaque: JuriFlixTituloEnriquecido; onPlay: () => void }) => (
  <div className="relative h-64 overflow-hidden rounded-2xl mx-4 mb-2">
    <img 
      src={destaque.poster_path || destaque.capa || ""} 
      alt={destaque.nome || ""}
      className="absolute inset-0 w-full h-full object-cover"
      loading="eager"
      fetchPriority="high"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
    
    <div className="absolute top-3 left-3">
      <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-md">
        <Clapperboard className="w-3 h-3 text-white" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Em Destaque</span>
      </div>
    </div>

    <JuriflixFavoritoButton juriflixId={destaque.id} className="absolute top-3 right-3" size="md" />

    <div className="absolute bottom-0 left-0 right-0 p-5">
      <Badge variant="secondary" className="mb-2 text-[10px] px-2.5 py-0.5 bg-white/15 backdrop-blur-sm border-white/20 text-white">
        {destaque.tipo}
      </Badge>
      <h1 className="text-xl font-bold mb-1.5 line-clamp-2 text-white drop-shadow-lg">{destaque.nome}</h1>
      <div className="flex items-center gap-2.5 text-xs text-white/80 mb-3">
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">{destaque.nota}</span>
        </div>
        <span>{destaque.ano}</span>
        {destaque.plataforma && <><span>•</span><span>{destaque.plataforma}</span></>}
      </div>
      <Button size="sm" onClick={onPlay} className="h-9 text-xs bg-white text-black hover:bg-white/90 font-bold shadow-xl">
        <Play className="w-3.5 h-3.5 mr-1.5 fill-black" />
        Ver Detalhes
      </Button>
    </div>
  </div>
));

HeroMobile.displayName = "HeroMobile";

// Carrossel horizontal
const CarouselSection = memo(({ 
  title, 
  icon: Icon, 
  items, 
  onItemClick,
  cardSize = "sm"
}: { 
  title: string; 
  icon: React.ElementType; 
  items: JuriFlixTituloEnriquecido[]; 
  onItemClick: (id: number) => void;
  cardSize?: "sm" | "md" | "lg";
}) => {
  if (!items.length) return null;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4 lg:px-0">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4.5 h-4.5 text-red-500" />
          <h2 className="text-base font-bold">{title}</h2>
          <span className="text-xs text-muted-foreground font-medium">({items.length})</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <ScrollArea className="w-full">
        <div className="flex gap-3 lg:gap-4 px-4 lg:px-0 pb-3">
          {items.map((titulo) => (
            <NetflixCard 
              key={titulo.id}
              titulo={titulo}
              onClick={() => onItemClick(titulo.id)}
              size={cardSize}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </div>
  );
});

CarouselSection.displayName = "CarouselSection";

// Tipos de aba do rodapé (mobile only)
type BottomTab = "catalogo" | "top-notas" | "por-ano" | "favoritos";
// Desktop inline section
type DesktopSection = "catalogo" | "top-notas" | "por-ano" | "favoritos";

const JuriFlix = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [bottomTab, setBottomTab] = useState<BottomTab>("catalogo");
  const [desktopSection, setDesktopSection] = useState<DesktopSection>("catalogo");
  const [anoFilter, setAnoFilter] = useState<number | null>(null);

  const { data: favoritosData } = useJuriflixFavoritos();
  const favIds = favoritosData?.map(f => f.juriflix_id) || [];

  const { data: titulos, isLoading } = useInstantCache<JuriFlixTituloEnriquecido[]>({
    cacheKey: "juriflix-titulos-v2",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("JURIFLIX" as any)
        .select("id, nome, tipo, ano, nota, sinopse, capa, poster_path, backdrop_path, plataforma, tmdb_id, popularidade, duracao")
        .order("nota", { ascending: false });

      if (error) throw error;
      return data as unknown as JuriFlixTituloEnriquecido[];
    },
    preloadImages: true,
    imageExtractor: (data) => data.slice(0, 20).map(t => t.poster_path || t.capa).filter(Boolean) as string[],
  });

  const { destaque, filmes, series, documentarios, filteredItems, anos, topNotas, favoritosTitulos } = useMemo(() => {
    if (!titulos) return { destaque: null, filmes: [], series: [], documentarios: [], filteredItems: [], anos: [], topNotas: [], favoritosTitulos: [] };
    
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = (t: JuriFlixTituloEnriquecido) =>
      !query || (t.nome || "").toLowerCase().includes(query);

    const all = query ? titulos.filter(matchesSearch) : titulos;
    const f = all.filter((t) => t.tipo?.toLowerCase().includes("filme"));
    const s = all.filter((t) => t.tipo?.toLowerCase().includes("série"));
    const d = all.filter((t) => t.tipo?.toLowerCase().includes("documentário"));
    
    let filtered = all;
    if (activeTab === "filmes") filtered = f;
    else if (activeTab === "series") filtered = s;
    else if (activeTab === "documentarios") filtered = d;

    const anosUnicos = [...new Set(titulos.map(t => t.ano).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0)) as number[];

    const topN = [...titulos].sort((a, b) => {
      const na = parseFloat(a.nota || "0");
      const nb = parseFloat(b.nota || "0");
      return nb - na;
    });

    const favTitulos = titulos.filter(t => favIds.includes(t.id));
    
    return {
      destaque: titulos[0],
      filmes: f,
      series: s,
      documentarios: d,
      filteredItems: filtered,
      anos: anosUnicos,
      topNotas: topN,
      favoritosTitulos: favTitulos,
    };
  }, [titulos, activeTab, searchQuery, favIds]);

  const handleItemClick = (id: number) => navigate(`/juriflix/${id}`);

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate('/inicio');
  };

  const currentSection = isDesktop ? desktopSection : bottomTab;

  // Renderiza conteúdo de seção (Top Notas, Por Ano, Favoritos)
  const renderSectionContent = () => {
    if (currentSection === "top-notas") {
      return (
        <div className={`space-y-3 ${isDesktop ? '' : 'px-4 pb-24'}`}>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            Top Notas
          </h2>
          <div className={isDesktop ? "grid grid-cols-1 xl:grid-cols-2 gap-2" : "space-y-1"}>
            {topNotas.slice(0, isDesktop ? 30 : undefined).map((t, i) => (
              <button
                key={t.id}
                onClick={() => handleItemClick(t.id)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-lg font-black text-muted-foreground w-7 text-center">{i + 1}</span>
                <div className="w-10 aspect-[2/3] rounded-lg overflow-hidden bg-card/50 shrink-0">
                  {(t.poster_path || t.capa) && (
                    <img src={t.poster_path || t.capa || ""} alt={t.nome || ""} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">{t.tipo} • {t.ano}</p>
                </div>
                <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-lg">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold">{t.nota}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (currentSection === "por-ano") {
      const titulosFiltrados = anoFilter
        ? (titulos || []).filter(t => t.ano === anoFilter)
        : [];
      return (
        <div className={`space-y-4 ${isDesktop ? '' : 'pb-24'}`}>
          <div className={isDesktop ? '' : 'px-4'}>
            <h2 className="text-base font-bold flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-red-500" />
              Por Ano
            </h2>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {anos.map(ano => (
                  <button
                    key={ano}
                    onClick={() => setAnoFilter(anoFilter === ano ? null : ano)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      anoFilter === ano ? "bg-red-600 text-white" : "bg-card/50 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {ano}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-1" />
            </ScrollArea>
          </div>
          {anoFilter ? (
            <div className={`grid gap-3 ${isDesktop ? 'grid-cols-4 xl:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 px-4'}`}>
              {titulosFiltrados.map(t => (
                <div key={t.id} className="cursor-pointer group" onClick={() => handleItemClick(t.id)}>
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card/50 mb-1.5 ring-1 ring-white/10">
                    {(t.poster_path || t.capa) && (
                      <img src={t.poster_path || t.capa || ""} alt={t.nome || ""} className="w-full h-full object-cover" />
                    )}
                    <JuriflixFavoritoButton juriflixId={t.id} className="absolute top-2 right-2" />
                  </div>
                  <h3 className="text-xs font-semibold line-clamp-2">{t.nome}</h3>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Selecione um ano acima</p>
          )}
        </div>
      );
    }

    if (currentSection === "favoritos") {
      return (
        <div className={isDesktop ? '' : 'px-4 pb-24'}>
          <h2 className="text-base font-bold flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            Meus Favoritos ({favoritosTitulos.length})
          </h2>
          {favoritosTitulos.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Heart className="w-10 h-10 text-muted-foreground/20 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Nenhum favorito ainda. Clique no ❤️ nos cards para salvar!
              </p>
            </div>
          ) : (
            <div className={`grid gap-3 ${isDesktop ? 'grid-cols-4 xl:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {favoritosTitulos.map(t => (
                <div key={t.id} className="cursor-pointer group" onClick={() => handleItemClick(t.id)}>
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card/50 mb-1.5 ring-1 ring-white/10 group-hover:ring-red-500/40 transition-all">
                    {(t.poster_path || t.capa) && (
                      <img src={t.poster_path || t.capa || ""} alt={t.nome || ""} className="w-full h-full object-cover" />
                    )}
                    <JuriflixFavoritoButton juriflixId={t.id} className="absolute top-2 right-2" />
                  </div>
                  <h3 className="text-xs font-semibold line-clamp-2">{t.nome}</h3>
                  <p className="text-[10px] text-muted-foreground">{t.tipo} • {t.ano}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Filter tabs component
  const FilterTabs = ({ className = "" }: { className?: string }) => (
    <div className={`flex h-10 bg-card/50 rounded-xl p-1 gap-1 ${className}`}>
      {[
        { value: "todos", icon: Clapperboard, label: "Todos" },
        { value: "filmes", icon: Film, label: "Filmes" },
        { value: "series", icon: Tv, label: "Séries" },
        { value: "documentarios", icon: Video, label: "Docs" },
      ].map(tab => (
        <button
          key={tab.value}
          onClick={() => setActiveTab(tab.value)}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs rounded-lg font-medium transition-colors ${
            activeTab === tab.value 
              ? "bg-red-600 text-white shadow-lg" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <tab.icon className="w-3.5 h-3.5" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  // Section tabs (Top Notas, Por Ano, Favoritos) — desktop inline or mobile bottom
  const SectionTabs = ({ className = "" }: { className?: string }) => {
    const sections = [
      { tab: "catalogo" as const, icon: Clapperboard, label: "Catálogo" },
      { tab: "top-notas" as const, icon: Star, label: "Top Notas" },
      { tab: "por-ano" as const, icon: Calendar, label: "Por Ano" },
      { tab: "favoritos" as const, icon: Heart, label: "Favoritos" },
    ];
    const current = isDesktop ? desktopSection : bottomTab;
    const setter = isDesktop ? setDesktopSection : setBottomTab;

    return (
      <div className={`flex gap-1 ${className}`}>
        {sections.map(({ tab, icon: Icon, label }) => (
          <button
            key={tab}
            onClick={() => setter(tab)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              current === tab
                ? "bg-red-600/20 text-red-400 ring-1 ring-red-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${current === tab && tab === "favoritos" ? "fill-red-400" : ""}`} />
            {label}
          </button>
        ))}
      </div>
    );
  };

  // Loading skeleton
  if (isLoading && !titulos) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-red-950/30 via-background to-background ${isDesktop ? '' : 'pb-20'}`}>
        {isDesktop ? (
          <div className="space-y-6">
            <div className="h-[400px] bg-card/50 animate-pulse" />
            <div className="max-w-7xl mx-auto px-6 space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-3">
                  <div className="h-5 w-40 bg-card/50 rounded animate-pulse" />
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map(j => (
                      <div key={j} className="w-[200px] aspect-[2/3] bg-card/50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-20 space-y-5">
            <div className="h-64 mx-4 rounded-2xl bg-card/50 animate-pulse" />
            <div className="px-4 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 bg-card/50 rounded animate-pulse" />
                  <div className="flex gap-3">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="w-[140px] aspect-[2/3] bg-card/50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Stats computadas
  const statsData = useMemo(() => {
    if (!titulos) return { total: 0, totalFilmes: 0, totalSeries: 0, totalDocs: 0, notaMedia: "0", plataformas: [] as string[] };
    const totalFilmes = titulos.filter(t => t.tipo?.toLowerCase().includes("filme")).length;
    const totalSeries = titulos.filter(t => t.tipo?.toLowerCase().includes("série")).length;
    const totalDocs = titulos.filter(t => t.tipo?.toLowerCase().includes("documentário")).length;
    const notas = titulos.map(t => parseFloat(t.nota || "0")).filter(n => n > 0);
    const notaMedia = notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : "0";
    const plataformas = [...new Set(titulos.map(t => t.plataforma).filter(Boolean))] as string[];
    return { total: titulos.length, totalFilmes, totalSeries, totalDocs, notaMedia, plataformas };
  }, [titulos]);

  // ===== DESKTOP LAYOUT =====
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-950/20 via-background to-background">
        {/* Hero fullwidth */}
        {destaque && desktopSection === "catalogo" && (
          <HeroDesktop destaque={destaque} onPlay={() => handleItemClick(destaque.id)} />
        )}

        {/* Toolbar: Section tabs + Filter tabs + Search */}
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <SectionTabs className="flex-1" />
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar filme, série ou documentário..."
                className="pl-9 h-9 text-sm bg-white/5 border-white/10 rounded-xl"
              />
            </div>
            <JuriflixFavoritosSheet />
          </div>

          {desktopSection === "catalogo" && (
            <FilterTabs />
          )}
        </div>

        {/* 3-column layout */}
        <div className="px-6 pb-8 grid grid-cols-[280px_1fr_280px] gap-6">
          {/* LEFT SIDEBAR — Stats & Info */}
          <aside className="space-y-4 sticky top-20 self-start">
            {/* Estatísticas */}
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 p-4 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-red-500" />
                Estatísticas
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-red-400">{statsData.total}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-yellow-400">{statsData.notaMedia}</p>
                  <p className="text-[10px] text-muted-foreground">Nota Média</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold">{statsData.totalFilmes}</p>
                  <p className="text-[10px] text-muted-foreground">Filmes</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold">{statsData.totalSeries}</p>
                  <p className="text-[10px] text-muted-foreground">Séries</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-lg font-bold">{statsData.totalDocs}</p>
                <p className="text-[10px] text-muted-foreground">Documentários</p>
              </div>
            </div>

            {/* Plataformas */}
            {statsData.plataformas.length > 0 && (
              <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 p-4 space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Tv className="w-4 h-4 text-red-500" />
                  Plataformas
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {statsData.plataformas.slice(0, 10).map(p => (
                    <span key={p} className="px-2.5 py-1 bg-white/5 rounded-lg text-[11px] text-muted-foreground">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Top 5 */}
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 p-4 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                Top 5 Notas
              </h3>
              <div className="space-y-1.5">
                {topNotas.slice(0, 5).map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => handleItemClick(t.id)}
                    className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="text-sm font-black text-muted-foreground/50 w-5 text-center">{i + 1}</span>
                    <div className="w-8 aspect-[2/3] rounded-md overflow-hidden bg-card/50 shrink-0">
                      {(t.poster_path || t.capa) && (
                        <img src={t.poster_path || t.capa || ""} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold line-clamp-1">{t.nome}</p>
                      <p className="text-[10px] text-muted-foreground">{t.ano}</p>
                    </div>
                    <div className="flex items-center gap-0.5 text-[10px] font-bold text-yellow-400">
                      <Star className="w-2.5 h-2.5 fill-yellow-400" />
                      {t.nota}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER — Main Content */}
          <div className="min-w-0">
            {desktopSection !== "catalogo" ? (
              renderSectionContent()
            ) : activeTab === "todos" ? (
              <div className="space-y-8">
                <CarouselSection title="Filmes" icon={Film} items={filmes} onItemClick={handleItemClick} cardSize="lg" />
                <CarouselSection title="Séries" icon={Tv} items={series} onItemClick={handleItemClick} cardSize="lg" />
                <CarouselSection title="Documentários" icon={Video} items={documentarios} onItemClick={handleItemClick} cardSize="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((titulo) => (
                  <div 
                    key={titulo.id} 
                    className="cursor-pointer group"
                    onClick={() => handleItemClick(titulo.id)}
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card/50 mb-2 ring-1 ring-white/10 shadow-lg group-hover:shadow-2xl group-hover:shadow-red-500/20 group-hover:ring-red-500/40 transition-all duration-300 group-hover:scale-[1.03]">
                      {(titulo.poster_path || titulo.capa) ? (
                        <img src={titulo.poster_path || titulo.capa || ""} alt={titulo.nome || ""} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/50 to-red-600/30">
                          <Film className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      {titulo.nota && (
                        <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {titulo.nota}
                        </div>
                      )}
                      <JuriflixFavoritoButton juriflixId={titulo.id} className="absolute top-2 right-2" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                        <div className="p-3 w-full">
                          <div className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold w-fit mx-auto">
                            <Play className="w-3 h-3 fill-black" />
                            Ver mais
                          </div>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{titulo.nome}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{titulo.ano}</span>
                      {titulo.duracao && <span className="text-xs text-muted-foreground">• {titulo.duracao} min</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR — Favoritos & Recentes */}
          <aside className="space-y-4 sticky top-20 self-start">
            {/* Meus Favoritos */}
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 p-4 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                Meus Favoritos
                <span className="text-[10px] text-muted-foreground ml-auto">{favoritosTitulos.length}</span>
              </h3>
              {favoritosTitulos.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <Heart className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                  <p className="text-[11px] text-muted-foreground">
                    Clique no ❤️ para salvar
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {favoritosTitulos.slice(0, 6).map(t => (
                    <div
                      key={t.id}
                      className="cursor-pointer group"
                      onClick={() => handleItemClick(t.id)}
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card/50 ring-1 ring-white/10 group-hover:ring-red-500/40 transition-all">
                        {(t.poster_path || t.capa) && (
                          <img src={t.poster_path || t.capa || ""} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <p className="text-[10px] font-medium line-clamp-1 mt-1">{t.nome}</p>
                    </div>
                  ))}
                </div>
              )}
              {favoritosTitulos.length > 6 && (
                <button
                  onClick={() => setDesktopSection("favoritos")}
                  className="w-full text-[11px] text-red-400 font-medium hover:underline"
                >
                  Ver todos ({favoritosTitulos.length})
                </button>
              )}
            </div>

            {/* Adicionados Recentes */}
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 p-4 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Film className="w-4 h-4 text-red-500" />
                Mais Recentes
              </h3>
              <div className="space-y-1.5">
                {(titulos || [])
                  .filter(t => t.ano)
                  .sort((a, b) => (b.ano || 0) - (a.ano || 0))
                  .slice(0, 6)
                  .map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleItemClick(t.id)}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-8 aspect-[2/3] rounded-md overflow-hidden bg-card/50 shrink-0">
                        {(t.poster_path || t.capa) && (
                          <img src={t.poster_path || t.capa || ""} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold line-clamp-1">{t.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{t.tipo} • {t.ano}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Dica */}
            <div className="bg-gradient-to-br from-red-950/30 to-card/60 rounded-2xl border border-red-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Popcorn className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold">Dica JuriFlix</h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Assista filmes e séries jurídicos para fixar conceitos do Direito de forma envolvente. 
                Dramas de tribunal e documentários sobre justiça são ótimos complementos ao estudo! 🍿
              </p>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // ===== MOBILE LAYOUT =====
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950/30 via-background to-background pb-20">
      {/* Header fixo */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 space-y-2.5">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack} 
            className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <span className="text-red-500">Juri</span>Flix
            </h1>
          </div>
          <JuriflixFavoritosSheet />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar filme, série ou documentário..."
            className="pl-9 h-9 text-sm bg-white/5 border-white/10 rounded-xl"
          />
        </div>
      </div>

      {bottomTab !== "catalogo" ? (
        <div className="pt-4">
          {renderSectionContent()}
        </div>
      ) : (
        <div className="pt-4 space-y-5">
          {/* Banner explicativo */}
          <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(0 60% 15% / 0.4) 100%)', border: '1px solid hsl(var(--border)/0.3)' }}>
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Popcorn className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-1 flex-1">
                <h2 className="text-sm font-bold flex items-center gap-1.5">
                  O que é o JuriFlix? <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sua curadoria de <span className="text-foreground font-medium">filmes, séries e documentários jurídicos</span>. 
                  Descubra produções que abordam o Direito de forma envolvente — de dramas de tribunal a documentários sobre justiça social. 
                  Aprenda enquanto se diverte! 🍿
                </p>
              </div>
            </div>
          </div>

          {/* Hero */}
          {destaque && (
            <HeroMobile destaque={destaque} onPlay={() => handleItemClick(destaque.id)} />
          )}

          {/* Tabs de filtro */}
          <div className="px-4">
            <FilterTabs />
          </div>

          {/* Conteúdo */}
          {activeTab === "todos" ? (
            <div className="space-y-6">
              <CarouselSection title="Filmes" icon={Film} items={filmes} onItemClick={handleItemClick} cardSize="md" />
              <CarouselSection title="Séries" icon={Tv} items={series} onItemClick={handleItemClick} cardSize="md" />
              <CarouselSection title="Documentários" icon={Video} items={documentarios} onItemClick={handleItemClick} cardSize="md" />
            </div>
          ) : (
            <div className="px-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredItems.map((titulo) => (
                <div 
                  key={titulo.id} 
                  className="cursor-pointer group"
                  onClick={() => handleItemClick(titulo.id)}
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card/50 mb-2 ring-1 ring-white/10 shadow-lg group-hover:shadow-2xl group-hover:shadow-red-500/20 group-hover:ring-red-500/40 transition-all duration-300 group-hover:scale-[1.03]">
                    {(titulo.poster_path || titulo.capa) ? (
                      <img src={titulo.poster_path || titulo.capa || ""} alt={titulo.nome || ""} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/50 to-red-600/30">
                        <Film className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    {titulo.nota && (
                      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {titulo.nota}
                      </div>
                    )}
                    <JuriflixFavoritoButton juriflixId={titulo.id} className="absolute top-2 right-2" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <div className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold">
                        <Play className="w-3 h-3 fill-black" />
                        Ver mais
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{titulo.nome}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{titulo.ano}</span>
                    {titulo.duracao && <span className="text-xs text-muted-foreground">• {titulo.duracao} min</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-white/10 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {[
            { tab: "catalogo" as BottomTab, icon: Clapperboard, label: "Catálogo" },
            { tab: "top-notas" as BottomTab, icon: Star, label: "Top Notas" },
            { tab: "por-ano" as BottomTab, icon: Calendar, label: "Por Ano" },
            { tab: "favoritos" as BottomTab, icon: Heart, label: "Favoritos" },
          ].map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              onClick={() => setBottomTab(tab)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                bottomTab === tab 
                  ? "text-red-500" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${bottomTab === tab && tab === "favoritos" ? "fill-red-500" : ""}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JuriFlix;
