import { useState, useMemo, memo } from "react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { supabase } from "@/integrations/supabase/client";
import { Play, Star, Film, Tv, Video, ChevronRight, Search, Clapperboard, Popcorn, Trophy, Heart, ListVideo, ArrowLeft, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { JuriFlixTituloEnriquecido } from "@/types/juriflix.types";
import { useInstantCache } from "@/hooks/useInstantCache";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { JuriflixFavoritoButton } from "@/components/juriflix/JuriflixFavoritoButton";
import { JuriflixBottomNav, type JuriflixTab } from "@/components/juriflix/JuriflixBottomNav";
import { useJuriflixFavoritos } from "@/hooks/useJuriflixFavorito";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

// Card estilo Netflix com shine effect
const NetflixCard = memo(({ titulo, onClick }: { titulo: JuriFlixTituloEnriquecido; onClick: () => void }) => {
  const imageUrl = titulo.poster_path || titulo.capa;
  
  return (
    <div className="w-[140px] sm:w-[160px] lg:w-[180px] xl:w-[200px] shrink-0 cursor-pointer group" onClick={onClick}>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card/50 mb-2 ring-1 ring-white/10 shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/20 group-hover:ring-blue-500/50 transition-all duration-300 group-hover:scale-105">
        {imageUrl ? (
          <img src={imageUrl} alt={titulo.nome} className="w-full h-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/50 to-blue-600/30">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        {/* Shine overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shine-sweep 1.5s ease-in-out infinite',
          }}
        />
        {titulo.nota && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            {titulo.nota}
          </div>
        )}
        <JuriflixFavoritoButton juriflixId={titulo.id} className="absolute top-2 right-2" size="sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <div className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-xl">
            <Play className="w-3 h-3 fill-black" />
            Ver mais
          </div>
        </div>
      </div>
      <h3 className="text-xs font-semibold line-clamp-2 leading-tight px-0.5">{titulo.nome}</h3>
      <div className="flex items-center gap-1.5 mt-0.5 px-0.5">
        <span className="text-[10px] text-muted-foreground">{titulo.ano}</span>
        {titulo.duracao && <span className="text-[10px] text-muted-foreground">• {titulo.duracao}min</span>}
      </div>
    </div>
  );
});
NetflixCard.displayName = "NetflixCard";

// Hero destaque
const HeroSection = memo(({ destaque, onPlay }: { destaque: JuriFlixTituloEnriquecido; onPlay: () => void }) => (
  <div className="relative h-56 sm:h-72 overflow-hidden rounded-2xl mx-4 mb-2">
    <img src={destaque.poster_path || destaque.capa} alt={destaque.nome} className="absolute inset-0 w-full h-full object-cover" loading="eager" fetchPriority="high" />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
    <div className="absolute top-3 left-3">
      <div className="flex items-center gap-1.5 bg-blue-600 px-2.5 py-1 rounded-md">
        <Clapperboard className="w-3 h-3 text-white" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Em Destaque</span>
      </div>
    </div>
    <JuriflixFavoritoButton juriflixId={destaque.id} className="absolute top-3 right-3" size="md" />
    <div className="absolute bottom-0 left-0 right-0 p-5">
      <Badge variant="secondary" className="mb-2 text-[10px] px-2.5 py-0.5 bg-white/15 backdrop-blur-sm border-white/20 text-white">{destaque.tipo}</Badge>
      <h1 className="text-xl sm:text-2xl font-bold mb-1.5 line-clamp-2 text-white drop-shadow-lg">{destaque.nome}</h1>
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
HeroSection.displayName = "HeroSection";

// Carrossel horizontal
const CarouselSection = memo(({ title, icon: Icon, items, onItemClick }: { title: string; icon: React.ElementType; items: JuriFlixTituloEnriquecido[]; onItemClick: (id: number) => void }) => {
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4.5 h-4.5 text-blue-500" />
          <h2 className="text-base font-bold">{title}</h2>
          <span className="text-xs text-muted-foreground font-medium">({items.length})</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 px-4 pb-3">
          {items.map((titulo) => (
            <NetflixCard key={titulo.id} titulo={titulo} onClick={() => onItemClick(titulo.id)} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </div>
  );
});
CarouselSection.displayName = "CarouselSection";

/** Retorna o índice do destaque do dia baseado na data atual */
function getDestaqueIndex(total: number): number {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % total;
}

// Grid de títulos reutilizável
const TitulosGrid = memo(({ titulos, onItemClick, emptyIcon: EmptyIcon, emptyText }: { 
  titulos: JuriFlixTituloEnriquecido[]; 
  onItemClick: (id: number) => void; 
  emptyIcon: React.ElementType;
  emptyText: string;
}) => {
  if (!titulos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <EmptyIcon className="w-12 h-12 text-blue-500/30 mb-3" />
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="px-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {titulos.map((titulo) => (
        <div key={titulo.id} className="cursor-pointer group" onClick={() => onItemClick(titulo.id)}>
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card/50 mb-2 ring-1 ring-white/10 shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/20 group-hover:ring-blue-500/40 transition-all duration-300 group-hover:scale-[1.03]">
            {(titulo.poster_path || titulo.capa) ? (
              <img src={titulo.poster_path || titulo.capa} alt={titulo.nome} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/50 to-blue-600/30">
                <Film className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)',
                backgroundSize: '200% 100%',
                animation: 'shine-sweep 1.5s ease-in-out infinite',
              }}
            />
            {titulo.nota && (
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {titulo.nota}
              </div>
            )}
            <JuriflixFavoritoButton juriflixId={titulo.id} className="absolute top-2 right-2" />
          </div>
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{titulo.nome}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{titulo.ano}</span>
            {titulo.duracao && <span className="text-xs text-muted-foreground">• {titulo.duracao} min</span>}
          </div>
        </div>
      ))}
    </div>
  );
});
TitulosGrid.displayName = "TitulosGrid";

// ===== SUB-VIEWS =====

// Ranking view — top rated
const RankingView = memo(({ titulos, onItemClick }: { titulos: JuriFlixTituloEnriquecido[]; onItemClick: (id: number) => void }) => {
  const ranked = useMemo(() => 
    [...titulos].sort((a, b) => (Number(b.nota) || 0) - (Number(a.nota) || 0)).slice(0, 30),
    [titulos]
  );

  return (
    <div className="space-y-4 pb-24">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2.5 mb-1">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-bold">Ranking — Melhores Avaliados</h2>
        </div>
        <p className="text-xs text-muted-foreground">Os títulos com as maiores notas no catálogo</p>
      </div>
      {ranked.map((titulo, idx) => (
        <div
          key={titulo.id}
          onClick={() => onItemClick(titulo.id)}
          className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors"
        >
          <span className={`text-2xl font-black w-8 text-center ${idx < 3 ? 'text-yellow-400' : 'text-muted-foreground/50'}`}>
            {idx + 1}
          </span>
          <div className="w-14 h-20 rounded-lg overflow-hidden bg-card/50 ring-1 ring-white/10 flex-shrink-0">
            {(titulo.poster_path || titulo.capa) ? (
              <img src={titulo.poster_path || titulo.capa} alt={titulo.nome} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold line-clamp-1">{titulo.nome}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400">{titulo.nota}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{titulo.ano}</span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-white/10 border-0">{titulo.tipo}</Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
RankingView.displayName = "RankingView";

// Favoritos view
const FavoritosView = memo(({ allTitulos, onItemClick }: { allTitulos: JuriFlixTituloEnriquecido[]; onItemClick: (id: number) => void }) => {
  const { user } = useAuth();
  const { data: favoritosData } = useJuriflixFavoritos();
  const favIds = useMemo(() => favoritosData?.map(f => f.juriflix_id) || [], [favoritosData]);
  
  const favTitulos = useMemo(() => 
    allTitulos.filter(t => favIds.includes(t.id)),
    [allTitulos, favIds]
  );

  return (
    <div className="space-y-4 pb-24 pt-4">
      <div className="px-4">
        <div className="flex items-center gap-2.5 mb-1">
          <Heart className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold">Meus Favoritos</h2>
          {favTitulos.length > 0 && <span className="text-xs text-muted-foreground">({favTitulos.length})</span>}
        </div>
        <p className="text-xs text-muted-foreground">Títulos que você marcou com ❤️</p>
      </div>
      <TitulosGrid 
        titulos={favTitulos} 
        onItemClick={onItemClick}
        emptyIcon={Heart}
        emptyText={user ? "Nenhum favorito ainda. Toque no ❤️ em um título para salvar!" : "Faça login para salvar seus favoritos"}
      />
    </div>
  );
});
FavoritosView.displayName = "FavoritosView";

// Plano view — watch later list
const PlanoView = memo(({ allTitulos, onItemClick }: { allTitulos: JuriFlixTituloEnriquecido[]; onItemClick: (id: number) => void }) => {
  const { user } = useAuth();

  const { data: planoData } = useQuery({
    queryKey: ["juriflix-plano", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as any)
        .from("juriflix_plano_assistir")
        .select("juriflix_id, ordem")
        .eq("user_id", user.id)
        .order("ordem", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const planoTitulos = useMemo(() => {
    if (!planoData) return [];
    const ids = planoData.map((p: any) => p.juriflix_id);
    return ids.map((id: number) => allTitulos.find(t => t.id === id)).filter(Boolean) as JuriFlixTituloEnriquecido[];
  }, [planoData, allTitulos]);

  return (
    <div className="space-y-4 pb-24 pt-4">
      <div className="px-4">
        <div className="flex items-center gap-2.5 mb-1">
          <ListVideo className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold">Meu Plano</h2>
          {planoTitulos.length > 0 && <span className="text-xs text-muted-foreground">({planoTitulos.length})</span>}
        </div>
        <p className="text-xs text-muted-foreground">Monte sua lista de títulos para assistir</p>
      </div>
      <TitulosGrid 
        titulos={planoTitulos} 
        onItemClick={onItemClick}
        emptyIcon={ListVideo}
        emptyText={user ? "Seu plano está vazio. Em breve você poderá adicionar títulos aqui!" : "Faça login para criar seu plano"}
      />
    </div>
  );
});
PlanoView.displayName = "PlanoView";

// Filme do Dia view
const FilmeDoDiaView = memo(({ allTitulos, onItemClick }: { allTitulos: JuriFlixTituloEnriquecido[]; onItemClick: (id: number) => void }) => {
  const filmeDoDia = useMemo(() => {
    if (!allTitulos.length) return null;
    const today = new Date();
    const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % allTitulos.length;
    return allTitulos[dayIndex];
  }, [allTitulos]);

  if (!filmeDoDia) return null;

  return (
    <div className="space-y-4 pb-24 pt-4 animate-fade-in">
      <div className="px-4">
        <div className="flex items-center gap-2.5 mb-1">
          <Clapperboard className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold">Filme do Dia</h2>
        </div>
        <p className="text-xs text-muted-foreground">Recomendação especial de hoje</p>
      </div>

      {/* Hero card */}
      <div className="mx-4 relative rounded-2xl overflow-hidden aspect-[2/3] max-h-[420px] cursor-pointer group" onClick={() => onItemClick(filmeDoDia.id)}>
        <img src={filmeDoDia.poster_path || filmeDoDia.capa} alt={filmeDoDia.nome} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Badge variant="secondary" className="mb-2 text-[10px] px-2.5 py-0.5 bg-blue-500/20 backdrop-blur-sm border-blue-500/30 text-blue-200">
            🎬 Filme do Dia
          </Badge>
          <h3 className="text-2xl font-bold text-white mb-1">{filmeDoDia.nome}</h3>
          <div className="flex items-center gap-2 text-white/70 text-xs mb-3">
            {filmeDoDia.nota && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> {filmeDoDia.nota}/10</span>}
            {filmeDoDia.ano && <span>{filmeDoDia.ano}</span>}
            {filmeDoDia.tipo && <span>{filmeDoDia.tipo}</span>}
            {filmeDoDia.plataforma && <span>• {filmeDoDia.plataforma}</span>}
          </div>
          {filmeDoDia.sinopse && (
            <p className="text-sm text-white/80 line-clamp-3 leading-relaxed mb-4">{filmeDoDia.sinopse}</p>
          )}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-full text-sm font-bold shadow-xl">
              <Play className="w-4 h-4 fill-black" /> Ver Detalhes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
FilmeDoDiaView.displayName = "FilmeDoDiaView";

// ===== MAIN COMPONENT =====

export const JuriflixHomeSection = () => {
  const navigate = useTransitionNavigate();
  const [bottomTab, setBottomTab] = useState<JuriflixTab | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: titulos, isLoading } = useInstantCache<JuriFlixTituloEnriquecido[]>({
    cacheKey: "juriflix-titulos-v2",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("JURIFLIX" as any)
        .select("id, nome, tipo, ano, nota, sinopse, capa, poster_path, plataforma, tmdb_id, popularidade, duracao")
        .order("nota", { ascending: false });
      if (error) throw error;
      return data as unknown as JuriFlixTituloEnriquecido[];
    },
    preloadImages: true,
    imageExtractor: (data) => data.slice(0, 20).map(t => t.poster_path || t.capa).filter(Boolean) as string[],
  });

  const { destaque, filmes, series, documentarios, filteredItems } = useMemo(() => {
    if (!titulos || titulos.length === 0) return { destaque: null, filmes: [], series: [], documentarios: [], filteredItems: [] };
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = (t: JuriFlixTituloEnriquecido) => !query || t.nome?.toLowerCase().includes(query);
    const all = query ? titulos.filter(matchesSearch) : titulos;
    const f = all.filter((t) => t.tipo?.toLowerCase().includes("filme"));
    const s = all.filter((t) => t.tipo?.toLowerCase().includes("série"));
    const d = all.filter((t) => t.tipo?.toLowerCase().includes("documentário"));
    let filtered = all;
    if (activeFilter === "filmes") filtered = f;
    else if (activeFilter === "series") filtered = s;
    else if (activeFilter === "documentarios") filtered = d;
    
    const destaqueIdx = getDestaqueIndex(titulos.length);
    
    return { destaque: titulos[destaqueIdx], filmes: f, series: s, documentarios: d, filteredItems: filtered };
  }, [titulos, activeFilter, searchQuery]);

  const handleItemClick = (id: number) => navigate(`/juriflix/${id}`);

  if (isLoading && !titulos) {
    return (
      <div className="pt-4 space-y-5 px-2">
        <div className="h-56 mx-2 rounded-2xl bg-card/50 animate-pulse" />
        <div className="px-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-card/50 rounded animate-pulse" />
              <div className="flex gap-3">
                {[1, 2, 3].map((j) => <div key={j} className="w-[140px] aspect-[2/3] bg-card/50 rounded-xl animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Shine keyframes */}
      <style>{`
        @keyframes shine-sweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Search Drawer */}
      <Drawer open={searchOpen} onOpenChange={setSearchOpen}>
        <DrawerContent className="max-h-[90vh] bg-background border-t border-blue-500/20">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSearchOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <h2 className="text-lg font-bold">Buscar no JuriFlix</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar filme, série ou documentário..."
                className="pl-9 h-12 text-base bg-white/5 border-white/10 rounded-xl"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto px-4 pb-8 max-h-[70vh]">
            {searchQuery.trim() && filteredItems.length > 0 ? (
              <div className="flex flex-col gap-2">
                {filteredItems.slice(0, 20).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSearchOpen(false); handleItemClick(t.id); }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                  >
                    {(t.poster_path || t.capa) && (
                      <img src={t.poster_path || t.capa} alt={t.nome} className="w-10 h-14 object-cover rounded-md flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{t.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.tipo} {t.ano ? `• ${t.ano}` : ''}</p>
                    </div>
                    {t.nota && (
                      <div className="flex items-center gap-1 text-xs text-yellow-400">
                        <Star className="w-3 h-3 fill-yellow-400" /> {t.nota}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum título encontrado</p>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                Digite para buscar filmes, séries ou documentários...
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ===== CATÁLOGO VIEW (default) ===== */}
      {bottomTab === null && (
        <div className="space-y-4 animate-fade-in">
          {/* Banner explicativo */}
          <div className="mx-4 flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'hsl(220 40% 12% / 0.6)', border: '1px solid hsl(var(--border)/0.2)' }}>
            <Popcorn className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Curadoria de <span className="text-foreground font-medium">filmes, séries e docs jurídicos</span> — aprenda enquanto se diverte 🍿
            </p>
          </div>

          {/* Hero */}
          {destaque && <HeroSection destaque={destaque} onPlay={() => handleItemClick(destaque.id)} />}

          {/* Filter tabs */}
          <div className="px-4">
            <div className="flex h-10 bg-card/50 rounded-xl p-1 gap-1">
              {[
                { value: "todos", icon: Clapperboard, label: "Todos" },
                { value: "filmes", icon: Film, label: "Filmes" },
                { value: "series", icon: Tv, label: "Séries" },
                { value: "documentarios", icon: Video, label: "Docs" },
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveFilter(tab.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs rounded-lg font-medium transition-colors ${
                    activeFilter === tab.value ? "bg-blue-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {activeFilter === "todos" ? (
            <div className="space-y-6">
              <CarouselSection title="Filmes" icon={Film} items={filmes} onItemClick={handleItemClick} />
              <CarouselSection title="Séries" icon={Tv} items={series} onItemClick={handleItemClick} />
              <CarouselSection title="Documentários" icon={Video} items={documentarios} onItemClick={handleItemClick} />
            </div>
          ) : (
            <TitulosGrid 
              titulos={filteredItems} 
              onItemClick={handleItemClick}
              emptyIcon={Film}
              emptyText="Nenhum título encontrado"
            />
          )}
        </div>
      )}

      {/* ===== RANKING VIEW ===== */}
      {bottomTab === 'ranking' && titulos && (
        <RankingView titulos={titulos} onItemClick={handleItemClick} />
      )}

      {/* ===== FAVORITOS VIEW ===== */}
      {bottomTab === 'favoritos' && titulos && (
        <FavoritosView allTitulos={titulos} onItemClick={handleItemClick} />
      )}

      {/* ===== PLANO VIEW ===== */}
      {bottomTab === 'plano' && titulos && (
        <PlanoView allTitulos={titulos} onItemClick={handleItemClick} />
      )}

      {/* Bottom Nav */}
      <JuriflixBottomNav
        activeTab={bottomTab as JuriflixTab}
        onTabChange={(tab) => {
          if (tab === 'buscar') {
            setSearchOpen(true);
            return;
          }
          if (tab === 'filmedia') {
            navigate('/filme-do-dia');
            return;
          }
          if (tab === null) {
            setBottomTab(null);
            return;
          }
          setBottomTab(prev => prev === tab ? null : tab);
        }}
      />
    </div>
  );
};
