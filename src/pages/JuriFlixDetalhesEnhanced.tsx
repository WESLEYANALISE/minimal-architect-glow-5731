import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Play, Star, Calendar, Clock, TrendingUp, Users, Film, Tv, MonitorPlay, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JuriFlixTituloEnriquecido } from "@/types/juriflix.types";
import { JuriFlixCard } from "@/components/JuriFlixCard";
import { JuriflixComentariosSection } from "@/components/juriflix/JuriflixComentariosSection";
import { JuriflixAvaliacaoSection } from "@/components/juriflix/JuriflixAvaliacaoSection";
import { JuriflixFavoritoButton } from "@/components/juriflix/JuriflixFavoritoButton";
import { ShareJuriflixModal } from "@/components/juriflix/ShareJuriflixModal";
import AvaliacaoButtons from "@/components/filme-dia/FilmeAvaliacaoButtons";
import { normalizeTmdbLogoPath } from "@/lib/normalizeTmdbLogo";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useDeviceType } from "@/hooks/use-device-type";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const JuriFlixDetalhesEnhanced = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const [isEnriching, setIsEnriching] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: titulo, isLoading, refetch } = useQuery({
    queryKey: ["juriflix-detalhe-enhanced", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("JURIFLIX" as any)
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as JuriFlixTituloEnriquecido;
    },
  });

  const enrichMutation = useMutation({
    mutationFn: async (tituloData: JuriFlixTituloEnriquecido) => {
      const { data, error } = await supabase.functions.invoke('enriquecer-juriflix', {
        body: { juriflix_id: tituloData.id }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetch();
      setIsEnriching(false);
    },
    onError: () => {
      setIsEnriching(false);
    }
  });

  const syncStreamingMutation = useMutation({
    mutationFn: async (tituloData: JuriFlixTituloEnriquecido) => {
      if (!tituloData.tmdb_id) return null;
      const { data, error } = await supabase.functions.invoke('sync-disponibilidade-streaming', {
        body: {
          juriflix_id: tituloData.id,
          tmdb_id: tituloData.tmdb_id,
          tipo_tmdb: tituloData.tipo_tmdb
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetch();
    }
  });

  useEffect(() => {
    if (titulo && !titulo.tmdb_id && !isEnriching && !enrichMutation.isPending) {
      setIsEnriching(true);
      enrichMutation.mutate(titulo);
    }
  }, [titulo?.id, titulo?.tmdb_id]);

  useEffect(() => {
    if (titulo && titulo.tmdb_id && !titulo.onde_assistir?.flatrate) {
      syncStreamingMutation.mutate(titulo);
    }
  }, [titulo?.id, titulo?.tmdb_id]);

  const { data: similares } = useQuery({
    queryKey: ["juriflix-similares", titulo?.similares],
    queryFn: async () => {
      if (!titulo?.similares || (titulo.similares as any[]).length === 0) return [];
      const tmdbIds = (titulo.similares as any[]).map((s: any) => s.tmdb_id).filter(Boolean);
      if (tmdbIds.length === 0) return [];
      const { data } = await supabase
        .from("JURIFLIX" as any)
        .select("*")
        .in("tmdb_id", tmdbIds)
        .limit(6);
      return data as unknown as JuriFlixTituloEnriquecido[] || [];
    },
    enabled: !!titulo?.similares,
  });

  if (isLoading || isEnriching) {
    return (
      <div className="pb-20">
        <Skeleton className={`${isDesktop ? 'h-[450px]' : 'h-[300px]'} w-full`} />
        <div className={`${isDesktop ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-4 mt-8 space-y-4`}>
          {isEnriching && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground animate-pulse">
                🎬 Buscando informações do título...
              </p>
            </div>
          )}
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!titulo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-muted-foreground mb-4">Título não encontrado</p>
        <Button onClick={() => navigate("/juriflix")}>Voltar para JuriFlix</Button>
      </div>
    );
  }

  const backdropUrl = titulo.backdrop_path || titulo.capa;
  const posterUrl = titulo.poster_path || titulo.capa;
  const hasEnrichedData = !!titulo.tmdb_id;
  const trailers = titulo.videos as any[] || [];
  const mainTrailer = trailers.find((v: any) => v.tipo === 'Trailer') || trailers[0] || { url: titulo.trailer };
  const elenco = titulo.elenco as any[] || [];
  const generos = titulo.generos as string[] || [];
  const ondeAssistir = titulo.onde_assistir as any || {};
  const hasStreaming = ondeAssistir.flatrate?.length > 0 || ondeAssistir.rent?.length > 0 || ondeAssistir.buy?.length > 0;

  // Streaming providers section
  const StreamingSection = () => (
    <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="flex items-center gap-2 mb-4">
        <MonitorPlay className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Onde Assistir no Brasil</h2>
      </div>
      
      {hasStreaming ? (
        <div className="space-y-4">
          {ondeAssistir.flatrate?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Incluído na assinatura</p>
              <div className={`grid gap-3 ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {ondeAssistir.flatrate.map((provider: any, i: number) => {
                  const logoUrl = normalizeTmdbLogoPath(provider.logo_path);
                  return (
                    <a
                      key={i}
                      href={ondeAssistir.link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 rounded-lg p-3 transition-colors cursor-pointer"
                    >
                      {logoUrl && <img src={logoUrl} alt={provider.provider_name} className="w-8 h-8 rounded-lg" />}
                      <div className="min-w-0">
                        <span className="text-sm font-medium block truncate">{provider.provider_name}</span>
                        <span className="text-xs text-muted-foreground">Assistir →</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {(ondeAssistir.rent?.length > 0 || ondeAssistir.buy?.length > 0) && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Alugar / Comprar</p>
              <div className={`grid gap-3 ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {[...(ondeAssistir.rent || []), ...(ondeAssistir.buy || [])].map((provider: any, i: number) => {
                  const logoUrl = normalizeTmdbLogoPath(provider.logo_path);
                  return (
                    <a
                      key={i}
                      href={ondeAssistir.link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 rounded-lg p-3 transition-colors cursor-pointer"
                    >
                      {logoUrl && <img src={logoUrl} alt={provider.provider_name} className="w-8 h-8 rounded-lg" />}
                      <div className="min-w-0">
                        <span className="text-sm font-medium block truncate">{provider.provider_name}</span>
                        <span className="text-xs text-muted-foreground">Ver opções →</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Não disponível em streaming no momento. Verifique novamente em breve.
        </p>
      )}
    </Card>
  );

  // ===== DESKTOP LAYOUT =====
  if (isDesktop) {
    return (
      <div className="pb-8">
        {/* Backdrop hero — larger on desktop */}
        <div className="relative">
          <div
            className="h-[450px] bg-cover bg-center"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-6 -mt-56">
            <div className="flex gap-8">
              {/* Poster */}
              <div className="relative w-72 h-[430px] rounded-xl overflow-hidden shrink-0 bg-secondary shadow-2xl ring-1 ring-white/10">
                <img src={posterUrl || ""} alt={titulo.nome || ""} className="w-full h-full object-cover" />
                <JuriflixFavoritoButton juriflixId={titulo.id} className="absolute top-3 right-3" size="md" />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4 pt-20">
                <div>
                  <Badge className="mb-2">{titulo.tipo}</Badge>
                  {hasEnrichedData && titulo.titulo_original && (
                    <p className="text-sm text-muted-foreground mb-1">{titulo.titulo_original}</p>
                  )}
                  <h1 className="text-4xl font-bold mb-3">{titulo.nome}</h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {titulo.ano && (
                      <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{titulo.ano}</span></div>
                    )}
                    {titulo.duracao && (
                      <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{titulo.duracao} min</span></div>
                    )}
                    {(titulo.nota || titulo.popularidade) && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{titulo.nota || (titulo.popularidade ? (titulo.popularidade / 10).toFixed(1) : 'N/A')}</span>
                        {hasEnrichedData && titulo.votos_count && (
                          <span className="text-muted-foreground">({titulo.votos_count} votos)</span>
                        )}
                      </div>
                    )}
                    {hasEnrichedData && titulo.popularidade && titulo.popularidade > 50 && (
                      <Badge variant="secondary" className="gap-1"><TrendingUp className="w-3 h-3" />Popular</Badge>
                    )}
                  </div>

                  {generos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {generos.map((g, i) => <Badge key={i} variant="outline">{g}</Badge>)}
                    </div>
                  )}

                  {titulo.tagline && (
                    <p className="text-lg italic text-muted-foreground mt-3">"{titulo.tagline}"</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {mainTrailer?.url && (
                    <Button asChild>
                      <a href={mainTrailer.url.replace('/embed/', '/watch?v=')} target="_blank" rel="noopener noreferrer">
                        <Play className="w-4 h-4 mr-2" />Ver Trailer
                      </a>
                    </Button>
                  )}
                  {titulo.link && (
                    <Button variant="outline" asChild>
                      <a href={titulo.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />{titulo.plataforma || "Assistir"}
                      </a>
                    </Button>
                  )}
                  <Button onClick={() => setShareOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                    <MessageCircle className="w-4 h-4" />Compartilhar via WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content — desktop 2-column layout */}
        <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
          <AvaliacaoButtons tipo="filme" itemData={format(new Date(), "yyyy-MM-dd") + `-juriflix-${titulo.id}`} />

          <StreamingSection />

          {/* Sinopse + Info side by side */}
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3 space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-3">Sinopse</h2>
                <p className="text-muted-foreground leading-relaxed">{titulo.sinopse}</p>
              </Card>

              {titulo.beneficios && (
                <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                  <h2 className="text-xl font-bold mb-4 text-accent">🎓 Por que assistir este título?</h2>
                  <div className="space-y-3">
                    {titulo.beneficios.split(/\n|\.(?=\s)/).filter((s: string) => s.trim().length > 10).map((p: string, i: number) => (
                      <p key={i} className="leading-relaxed text-sm">
                        {p.trim().endsWith('.') ? p.trim() : p.trim() + '.'}
                      </p>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <div className="col-span-2 space-y-6">
              {hasEnrichedData && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-3">Informações Técnicas</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {titulo.diretor && <div><p className="text-muted-foreground">Diretor</p><p className="font-medium">{titulo.diretor}</p></div>}
                    {titulo.idioma_original && <div><p className="text-muted-foreground">Idioma Original</p><p className="font-medium">{titulo.idioma_original}</p></div>}
                    {titulo.orcamento && titulo.orcamento > 0 && <div><p className="text-muted-foreground">Orçamento</p><p className="font-medium">${(titulo.orcamento / 1000000).toFixed(1)}M</p></div>}
                    {titulo.bilheteria && titulo.bilheteria > 0 && <div><p className="text-muted-foreground">Bilheteria</p><p className="font-medium">${(titulo.bilheteria / 1000000).toFixed(1)}M</p></div>}
                  </div>
                </Card>
              )}

              {/* Elenco */}
              {elenco.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-3">Elenco</h2>
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    {elenco.slice(0, 9).map((ator: any, i: number) => (
                      <div key={i} className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-secondary">
                          {ator.foto ? (
                            <img src={ator.foto} alt={ator.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Users className="w-6 h-6 text-muted-foreground" /></div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium leading-tight">{ator.nome}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{ator.personagem}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Trailer + Similares side by side */}
          <div className={`grid gap-6 ${similares && similares.length > 0 && mainTrailer?.url ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {mainTrailer?.url && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Trailer</h2>
                <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
                  <iframe
                    width="100%" height="100%"
                    src={mainTrailer.url}
                    title="Trailer"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </Card>
            )}

            {similares && similares.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Film className="w-5 h-5" />Você também pode gostar
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {similares.slice(0, 6).map((similar) => (
                    <div key={similar.id} className="cursor-pointer group" onClick={() => navigate(`/juriflix/${similar.id}`)}>
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-card/50 mb-1 ring-1 ring-white/10 group-hover:ring-red-500/40 transition-all">
                        {(similar.poster_path || similar.capa) && (
                          <img src={similar.poster_path || similar.capa || ""} alt={similar.nome || ""} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <p className="text-xs font-medium line-clamp-2">{similar.nome}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Comentários e Avaliações */}
          <Tabs defaultValue="comentarios" className="w-full">
            <TabsList className="w-full h-10 bg-card/50">
              <TabsTrigger value="comentarios" className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white">Comentários</TabsTrigger>
              <TabsTrigger value="avaliacoes" className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white">Avaliações</TabsTrigger>
            </TabsList>
            <TabsContent value="comentarios" className="mt-4">
              <Card className="p-6"><JuriflixComentariosSection juriflixId={titulo.id} /></Card>
            </TabsContent>
            <TabsContent value="avaliacoes" className="mt-4">
              <Card className="p-6"><JuriflixAvaliacaoSection juriflixId={titulo.id} /></Card>
            </TabsContent>
          </Tabs>
        </div>

        <ShareJuriflixModal open={shareOpen} onOpenChange={setShareOpen} titulo={titulo} />
      </div>
    );
  }

  // ===== MOBILE LAYOUT =====
  return (
    <div className="pb-6">
      {/* Hero Banner */}
      <div className="relative">
        <div
          className="h-[300px] bg-cover bg-center"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 -mt-32">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-48 h-72 rounded-xl overflow-hidden shrink-0 bg-secondary shadow-2xl ring-1 ring-white/10">
              <img src={posterUrl || ""} alt={titulo.nome || ""} className="w-full h-full object-cover" />
              <JuriflixFavoritoButton juriflixId={titulo.id} className="absolute top-3 right-3" size="md" />
            </div>

            <div className="flex-1 space-y-4 text-center">
              <div>
                <Badge className="mb-2">{titulo.tipo}</Badge>
                {hasEnrichedData && titulo.titulo_original && (
                  <p className="text-sm text-muted-foreground mb-1">{titulo.titulo_original}</p>
                )}
                <h1 className="text-2xl font-bold mb-3">{titulo.nome}</h1>
                
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  {titulo.ano && <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{titulo.ano}</span></div>}
                  {titulo.duracao && <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{titulo.duracao} min</span></div>}
                  {(titulo.nota || titulo.popularidade) && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{titulo.nota || (titulo.popularidade ? (titulo.popularidade / 10).toFixed(1) : 'N/A')}</span>
                    </div>
                  )}
                </div>

                {generos.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {generos.map((g, i) => <Badge key={i} variant="outline">{g}</Badge>)}
                  </div>
                )}

                {titulo.tagline && (
                  <p className="text-base italic text-muted-foreground mt-3">"{titulo.tagline}"</p>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {mainTrailer?.url && (
                  <Button asChild>
                    <a href={mainTrailer.url.replace('/embed/', '/watch?v=')} target="_blank" rel="noopener noreferrer">
                      <Play className="w-4 h-4 mr-2" />Ver Trailer
                    </a>
                  </Button>
                )}
                {titulo.link && (
                  <Button variant="outline" asChild>
                    <a href={titulo.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />{titulo.plataforma || "Assistir"}
                    </a>
                  </Button>
                )}
                <Button onClick={() => setShareOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <MessageCircle className="w-4 h-4" />WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        <AvaliacaoButtons tipo="filme" itemData={format(new Date(), "yyyy-MM-dd") + `-juriflix-${titulo.id}`} />
        <StreamingSection />

        <Tabs defaultValue="sinopse" className="w-full">
          <TabsList className="w-full h-10 bg-card/50">
            <TabsTrigger value="sinopse" className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">Sinopse</TabsTrigger>
            <TabsTrigger value="elenco" className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">Elenco</TabsTrigger>
            <TabsTrigger value="comentarios" className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">Comentários</TabsTrigger>
            <TabsTrigger value="avaliacoes" className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">Avaliações</TabsTrigger>
          </TabsList>

          <TabsContent value="sinopse" className="space-y-6 mt-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-3">Sinopse</h2>
              <p className="text-muted-foreground leading-relaxed">{titulo.sinopse}</p>
            </Card>

            {titulo.beneficios && (
              <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <h2 className="text-xl font-bold mb-4 text-accent">🎓 Por que assistir este título?</h2>
                <div className="space-y-3">
                  {titulo.beneficios.split(/\n|\.(?=\s)/).filter((s: string) => s.trim().length > 10).map((p: string, i: number) => (
                    <p key={i} className="leading-relaxed text-sm">
                      {p.trim().endsWith('.') ? p.trim() : p.trim() + '.'}
                    </p>
                  ))}
                </div>
              </Card>
            )}

            {hasEnrichedData && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-3">Informações Técnicas</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {titulo.diretor && <div><p className="text-muted-foreground">Diretor</p><p className="font-medium">{titulo.diretor}</p></div>}
                  {titulo.idioma_original && <div><p className="text-muted-foreground">Idioma Original</p><p className="font-medium">{titulo.idioma_original}</p></div>}
                  {titulo.orcamento && titulo.orcamento > 0 && <div><p className="text-muted-foreground">Orçamento</p><p className="font-medium">${(titulo.orcamento / 1000000).toFixed(1)}M</p></div>}
                  {titulo.bilheteria && titulo.bilheteria > 0 && <div><p className="text-muted-foreground">Bilheteria</p><p className="font-medium">${(titulo.bilheteria / 1000000).toFixed(1)}M</p></div>}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="elenco" className="mt-4">
            <Card className="p-6">
              {elenco.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {elenco.slice(0, 12).map((ator: any, i: number) => (
                    <div key={i} className="text-center space-y-2">
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-secondary">
                        {ator.foto ? (
                          <img src={ator.foto} alt={ator.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Users className="w-8 h-8 text-muted-foreground" /></div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{ator.nome}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{ator.personagem}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Informações de elenco não disponíveis</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="comentarios" className="mt-4">
            <Card className="p-6"><JuriflixComentariosSection juriflixId={titulo.id} /></Card>
          </TabsContent>

          <TabsContent value="avaliacoes" className="mt-4">
            <Card className="p-6"><JuriflixAvaliacaoSection juriflixId={titulo.id} /></Card>
          </TabsContent>
        </Tabs>

        {mainTrailer?.url && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Trailer</h2>
            <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
              <iframe width="100%" height="100%" src={mainTrailer.url} title="Trailer" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </Card>
        )}

        {similares && similares.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Film className="w-5 h-5" />Você também pode gostar</h2>
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
              {similares.map((similar) => (
                <JuriFlixCard key={similar.id} titulo={similar} onClick={() => navigate(`/juriflix/${similar.id}`)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <ShareJuriflixModal open={shareOpen} onOpenChange={setShareOpen} titulo={titulo} />
    </div>
  );
};

export default JuriFlixDetalhesEnhanced;
