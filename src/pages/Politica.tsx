import { useNavigate } from "react-router-dom";
import { 
  Eye, 
  Trophy,
  ChevronRight,
  Newspaper,
  Library,
  Loader2
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { EstudosPoliticosSection } from "@/components/politica";
import ResumosDisponiveisCarousel from '@/components/ResumosDisponiveisCarousel';
import { useNoticiasPoliticas } from "@/hooks/useNoticiasPoliticas";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { decodeHtmlEntities } from "@/lib/decodeHtmlEntities";
import { useDeviceType } from "@/hooks/use-device-type";

const Politica = () => {
  const navigate = useNavigate();
  const { noticias, isLoading } = useNoticiasPoliticas(10);
  const { isDesktop } = useDeviceType();

  if (isDesktop) {
    return (
      <div className="h-[calc(100vh-4.5rem)] overflow-y-auto bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Política</h1>
              <p className="text-xs text-muted-foreground">Acompanhe seus representantes</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Notícias */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-red-300" />
                    <h3 className="text-base font-bold text-foreground">Notícias Políticas</h3>
                  </div>
                  <button onClick={() => navigate("/politica/noticias")} className="text-xs text-red-400 hover:underline">Ver todas →</button>
                </div>
                {isLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-red-400" /></div>
                ) : (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                    {noticias.slice(0, 6).map((n) => (
                      <button key={n.id} onClick={() => navigate(`/politica/noticias/${n.id}`)} className="text-left group rounded-xl bg-card/50 border border-border/30 overflow-hidden hover:border-red-500/30 transition-all">
                        <div className="relative aspect-[16/9] overflow-hidden">
                          {n.imagem_url_webp || n.imagem_url ? (
                            <img src={n.imagem_url_webp || n.imagem_url || ''} alt={decodeHtmlEntities(n.titulo)} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-red-900/20"><Newspaper className="w-8 h-8 text-red-400/50" /></div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <h3 className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-red-400 transition-colors">{decodeHtmlEntities(n.titulo)}</h3>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <ResumosDisponiveisCarousel tipo="politica" />
              <EstudosPoliticosSection />
            </div>
            {/* Sidebar */}
            <div className="space-y-4">
              <button onClick={() => navigate("/politica/rankings")} className="w-full group relative bg-gradient-to-br from-amber-700 to-amber-900 rounded-xl p-4 h-[100px] flex flex-col items-start justify-between text-left overflow-hidden border border-white/[0.06]">
                <div className="bg-white/15 p-2 rounded-xl"><Trophy className="w-5 h-5 text-white" /></div>
                <span className="text-sm font-bold text-white">Ranking Político</span>
              </button>
              <button onClick={() => navigate("/biblioteca-politica")} className="w-full group relative bg-gradient-to-br from-red-700 to-red-900 rounded-xl p-4 h-[100px] flex flex-col items-start justify-between text-left overflow-hidden border border-white/[0.06]">
                <div className="bg-white/15 p-2 rounded-xl"><Library className="w-5 h-5 text-white" /></div>
                <span className="text-sm font-bold text-white">Biblioteca Política</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-neutral-950 via-red-950/20 to-neutral-950 pb-20">
      <PageHero
        title="Política"
        subtitle="Acompanhe seus representantes"
        icon={Eye}
        iconGradient="from-red-500/20 to-red-600/10"
        iconColor="text-red-400"
        lineColor="via-red-500"
        pageKey="politica"
        showGenerateButton={true}
        showBackButton={true}
        backPath="/inicio"
      />

      <div className="px-2 space-y-8 pb-8 pt-4">

        {/* === Notícias Políticas — TOPO === */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-500/20">
                <Newspaper className="w-4 h-4 text-red-300" />
              </div>
              <h3 className="text-base font-bold text-foreground tracking-tight">Notícias Políticas</h3>
            </div>
            <button
              onClick={() => navigate("/politica/noticias")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-500/20 text-red-200 text-[10px] font-medium"
            >
              Ver todas
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading && noticias.length === 0 ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-red-400" />
            </div>
          ) : noticias.length > 0 ? (
            <ScrollArea className="w-full">
              <div className="flex gap-2.5 px-2 pb-2">
                {noticias.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => navigate(`/politica/noticias/${n.id}`)}
                    className="w-[190px] flex-shrink-0 text-left group"
                  >
                    <div className="flex flex-col rounded-xl bg-card border border-border shadow-lg overflow-hidden h-full">
                      <div className="relative w-full aspect-[16/9] overflow-hidden flex-shrink-0 cover-reflection">
                        {n.imagem_url_webp || n.imagem_url ? (
                          <img src={n.imagem_url_webp || n.imagem_url || ''} alt={decodeHtmlEntities(n.titulo)} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 via-background to-background">
                            <Newspaper className="w-8 h-8 text-red-400/50" />
                          </div>
                        )}
                        {n.espectro && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium text-white bg-red-600 shadow-md z-10">
                            {n.fonte}
                          </span>
                        )}
                      </div>
                      <div className="p-2.5 flex flex-col gap-1 flex-1 min-h-[60px]">
                        <h3 className="text-xs font-semibold text-card-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors flex-1">
                          {decodeHtmlEntities(n.titulo)}
                        </h3>
                        {n.data_publicacao && (
                          <p className="text-[9px] text-muted-foreground">
                            {new Date(n.data_publicacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {new Date(n.data_publicacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="px-2 text-center py-4">
              <p className="text-xs text-muted-foreground">Nenhuma notícia política disponível</p>
            </div>
          )}
        </div>

        {/* === Cards de Ação: Ranking + Biblioteca === */}
        <div className="grid grid-cols-2 gap-2.5 px-2">
          {/* Ranking Político */}
          <button
            onClick={() => navigate("/politica/rankings")}
            className="group relative bg-gradient-to-br from-amber-700 to-amber-900 rounded-xl p-3 h-[120px] flex flex-col items-start justify-between text-left overflow-hidden border border-white/[0.06] active:scale-95 transition-transform"
            style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
          >
            <Trophy
              className="absolute -bottom-2 -right-2 w-[60px] h-[60px] pointer-events-none rotate-[-12deg] blur-[0.3px]"
              strokeWidth={1.2}
              style={{ animation: 'ghostGlow 6s ease-in-out infinite 0.9s', opacity: 0.3, color: 'rgba(255,255,255,0.35)' }}
            />
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
              <div
                className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                style={{ animation: 'shinePratique 4s ease-in-out infinite 1.1s' }}
              />
            </div>
            <div className="bg-white/15 p-3 rounded-xl relative z-[1]">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div className="text-left relative z-[1] w-full flex items-end justify-between">
              <div>
                <span className="text-[15px] sm:text-base font-bold text-white block leading-tight">Ranking</span>
                <span className="text-[11px] sm:text-xs text-white/60 block">Político</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #fbbf2480, transparent)' }} />
          </button>

          {/* Biblioteca Política */}
          <button
            onClick={() => navigate("/biblioteca-politica")}
            className="group relative bg-gradient-to-br from-red-700 to-red-900 rounded-xl p-3 h-[120px] flex flex-col items-start justify-between text-left overflow-hidden border border-white/[0.06] active:scale-95 transition-transform"
            style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
          >
            <Library
              className="absolute -bottom-2 -right-2 w-[60px] h-[60px] pointer-events-none rotate-[-12deg] blur-[0.3px]"
              strokeWidth={1.2}
              style={{ animation: 'ghostGlow 6s ease-in-out infinite 1.2s', opacity: 0.3, color: 'rgba(255,255,255,0.35)' }}
            />
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
              <div
                className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                style={{ animation: 'shinePratique 4s ease-in-out infinite 1.3s' }}
              />
            </div>
            <div className="bg-white/15 p-3 rounded-xl relative z-[1]">
              <Library className="w-7 h-7 text-white" />
            </div>
            <div className="text-left relative z-[1] w-full flex items-end justify-between">
              <div>
                <span className="text-[15px] sm:text-base font-bold text-white block leading-tight">Biblioteca</span>
                <span className="text-[11px] sm:text-xs text-white/60 block">Política</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #f8717180, transparent)' }} />
          </button>
        </div>

        {/* === Boletins Políticos === */}
        <ResumosDisponiveisCarousel tipo="politica" />

        {/* === Estudos Políticos === */}
        <EstudosPoliticosSection />
      </div>
    </div>
  );
};

export default Politica;
