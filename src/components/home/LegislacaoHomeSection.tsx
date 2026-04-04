import { memo, useCallback, useState } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { UniversalImage } from "@/components/ui/universal-image";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { usePrefetchRoute } from "@/hooks/usePrefetchRoute";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Scale, Landmark, BookOpen, Bell, Loader2, Settings, Shield, Newspaper, Users } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import brasaoBrasil from "@/assets/brasao-brasil.webp";
import brasaoBrasilHD from "@/assets/brasao-brasil-hd.webp";
import { useNoticiasLegislativas } from "@/hooks/useNoticiasLegislativas";
import { PersonalizarAcessoRapidoSheet, loadAcessoRapidoConfig, AcessoRapidoItem } from "./PersonalizarAcessoRapidoSheet";


// Seções da Legislação
const SECOES_LEGISLACAO = [
  { id: "vademecum", title: "Vade Mecum", description: "Códigos e Leis", icon: Shield, route: "/vade-mecum" },
  { id: "leis-diarias", title: "Leis Diárias", description: "Novas leis", icon: Bell, route: "/vade-mecum/resenha-diaria" },
];

export const LegislacaoHomeSection = memo(() => {
  const navigate = useTransitionNavigate();
  const { onTouchStart } = usePrefetchRoute();
  const { isPremium } = useSubscription();
  const { noticias: noticiasLeg, loading: loadingLeg } = useNoticiasLegislativas(10);
  const [acessoRapido, setAcessoRapido] = useState<AcessoRapidoItem[]>(loadAcessoRapidoConfig);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  
  const enabledItems = acessoRapido.filter(i => i.enabled);

  // Buscar explicações leis do dia
  const { data: explicacoes, isLoading: loadingExplicacoes } = useQuery({
    queryKey: ["explicacoes-educativas-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lei_seca_explicacoes")
        .select("id, ordem, titulo, descricao_curta, url_capa")
        .order("ordem")
        .limit(10);
      if (error) return [];
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Removido: query de proposições inline — agora usa ProposicaoTipoCarousel

  // Contar atualizações de leis recentes (últimos 7 dias)
  const { data: qtdAtualizacoes } = useQuery({
    queryKey: ["atualizacoes-leis-count"],
    queryFn: async () => {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      const { count, error } = await supabase
        .from("leis_do_dia" as any)
        .select("id", { count: "exact", head: true })
        .gte("created_at", seteDiasAtras.toISOString());
      if (error) return 0;
      return count || 0;
    },
    staleTime: 1000 * 60 * 10,
  });


  return (
    <div className="px-2 space-y-6 pb-8 pt-4">

      {/* === Notícias Legislativas (Câmara) — TOPO === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20">
              <Landmark className="w-4 h-4 text-emerald-300" />
            </div>
              <h3 className="text-base font-bold text-foreground tracking-tight">Notícias Legislativas</h3>
          </div>
          <button
            onClick={() => navigate("/noticias-legislativas")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-medium"
          >
            Ver todas
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loadingLeg ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          </div>
        ) : noticiasLeg.length > 0 ? (
          <ScrollArea className="w-full">
            <div className="flex gap-2.5 px-2 pb-2">
              {noticiasLeg.map((n: any, index: number) => (
                <button
                  key={n.id}
                  onClick={() => navigate(`/noticias-legislativas/${n.id}`, {
                    state: {
                      noticia: {
                        id: n.id,
                        titulo: n.titulo,
                        portal: n.fonte || 'Câmara dos Deputados',
                        capa: n.imagem_webp || n.imagem || '',
                        link: n.link,
                        dataHora: n.data_publicacao,
                        categoria: n.categoria,
                      }
                    }
                  })}
                  className="w-[190px] flex-shrink-0 text-left group opacity-0"
                  style={{
                    animation: `newsSlideIn 350ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 60}ms forwards`,
                    willChange: 'transform, opacity',
                  }}
                >
                  <div className="flex flex-col rounded-xl bg-card border border-border shadow-lg overflow-hidden h-full">
                    <div className="relative w-full aspect-[16/9] overflow-hidden flex-shrink-0 cover-reflection">
                      {n.imagem ? (
                        <UniversalImage
                          src={n.imagem_webp || n.imagem}
                          alt={n.titulo}
                          blurCategory="news"
                          priority={index < 2}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-900/40 via-background to-background">
                          <Landmark className="w-8 h-8 text-emerald-400/50" />
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium text-white bg-emerald-600 shadow-md z-10">
                        {n.categoria || 'Legislativo'}
                      </span>
                    </div>
                    <div className="p-2.5 flex flex-col gap-1 flex-1 min-h-[60px]">
                      <h3 className="text-xs font-semibold text-card-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors flex-1">
                        {n.titulo_curto || n.titulo}
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
            <p className="text-xs text-muted-foreground">Nenhuma notícia legislativa disponível</p>
          </div>
        )}
      </div>


      {/* === Título Legislação + Funções === */}
      <div className="space-y-3 px-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20">
            <BookOpen className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight">Legislação Brasileira</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
        {/* Vade Mecum - Verde (mesma cor de Resumos) */}
        <button
          onClick={() => navigate("/vade-mecum")}
          onTouchStart={() => onTouchStart("/vade-mecum")}
          className="group relative bg-gradient-to-br from-[#0f766e] to-[#064e3b] rounded-xl p-3 h-[120px] flex flex-col items-start justify-between text-left overflow-hidden border border-white/[0.06] active:scale-95 transition-transform"
          style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
        >
          <img
            src={brasaoBrasilHD}
            alt=""
            className="absolute -bottom-3 -right-3 w-[80px] h-[80px] pointer-events-none rotate-[-8deg] opacity-40"
          />
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
            <div
              className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
              style={{ animation: 'shinePratique 4s ease-in-out infinite 1.1s' }}
            />
          </div>
          <div className="flex items-start justify-between w-full relative z-[1]">
            <div className="bg-white/15 p-3 rounded-xl">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <span className="text-[11px] font-black tracking-wider mt-1" style={{ color: '#5eead4', textShadow: '0 0 8px #5eead4aa, 0 0 20px #5eead466' }}>2026</span>
          </div>
          <div className="text-left relative z-[1] w-full flex items-end justify-between">
            <div>
              <span className="text-[15px] sm:text-base font-bold text-white block leading-tight">Vade Mecum</span>
              <span className="text-[11px] sm:text-xs text-white/60 block">Lei Seca</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #5eead480, transparent)' }} />
        </button>

        {/* Atualizações - Rosa (mesma cor de Cursos) */}
        <button
          onClick={() => navigate("/vade-mecum/resenha-diaria")}
          onTouchStart={() => onTouchStart("/vade-mecum")}
          className="group relative bg-gradient-to-br from-[#b8334a] to-[#6e1a2c] rounded-xl p-3 h-[120px] flex flex-col items-start justify-between text-left overflow-hidden border border-white/[0.06] active:scale-95 transition-transform"
          style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
        >
          {typeof qtdAtualizacoes === 'number' && qtdAtualizacoes > 0 && (
            <span className="absolute top-2.5 right-2.5 z-[2] min-w-[22px] h-[22px] flex items-center justify-center bg-white text-rose-700 text-[11px] font-bold rounded-full px-1.5 shadow-lg animate-pulse">
              {qtdAtualizacoes > 99 ? '99+' : qtdAtualizacoes}
            </span>
          )}
          <Bell
            className="absolute -bottom-2 -right-2 w-[60px] h-[60px] pointer-events-none rotate-[-12deg] blur-[0.3px]"
            strokeWidth={1.2}
            style={{ animation: 'ghostGlow 6s ease-in-out infinite 0.9s', opacity: 0.3, color: 'rgba(255,255,255,0.35)' }}
          />
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
            <div
              className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
              style={{ animation: 'shinePratique 4s ease-in-out infinite 1.2s' }}
            />
          </div>
          <div className="flex items-start justify-between w-full relative z-[1]">
            <div className="bg-white/15 p-3 rounded-xl">
              <Bell className="w-7 h-7 text-white" />
            </div>
            <span className="text-[11px] font-black tracking-wider mt-1" style={{ color: '#f9a8d4', textShadow: '0 0 8px #f9a8d4aa, 0 0 20px #f9a8d466' }}>2026</span>
          </div>
          <div className="text-left relative z-[1] w-full flex items-end justify-between">
            <div>
              <span className="text-[15px] sm:text-base font-bold text-white block leading-tight">Leis Diárias</span>
              <span className="text-[11px] sm:text-xs text-white/60 block">Novas leis</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #f9a8d480, transparent)' }} />
        </button>
        </div>
      </div>

      {/* === Acesso Rápido === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20">
              <Scale className="w-4 h-4 text-amber-100" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight">Acesso Rápido</h3>
            </div>
          </div>
          {isPremium && (
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-100 text-[11px] font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Personalizar
            </button>
          )}
        </div>

        <ScrollArea className="w-full">
          <div className="flex flex-nowrap gap-2.5 px-2 pb-2">
            {enabledItems.map((codigo, index) => {
              const Icon = codigo.icon;
              const delay = index * 0.05;
              return (
                <button
                  key={codigo.id}
                  onClick={() => navigate(codigo.route)}
                  onTouchStart={() => onTouchStart(codigo.route)}
                  className={`w-[140px] lg:w-[160px] shrink-0 group relative bg-gradient-to-br ${codigo.bg} rounded-xl p-3 h-[120px] lg:h-[130px] flex flex-col items-start justify-between text-left overflow-hidden border border-white/[0.06] active:scale-95 transition-transform`}
                  style={{
                    boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  <Icon
                    className="absolute -bottom-2 -right-2 w-[65px] h-[65px] pointer-events-none rotate-[-12deg] blur-[0.3px]"
                    strokeWidth={1.2}
                    style={{
                      animation: `ghostGlow 6s ease-in-out infinite ${index * 0.9}s`,
                      opacity: 0.3,
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  />
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                    <div
                      className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                      style={{ animation: `shinePratique 4s ease-in-out infinite ${delay + 1}s` }}
                    />
                  </div>
                  <div className="flex items-start justify-between relative z-[1] w-full">
                    <div className="bg-white/15 p-2 rounded-lg">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[9px] font-black tracking-wider mt-0.5" style={{ color: codigo.accent, textShadow: `0 0 8px ${codigo.accent}aa, 0 0 20px ${codigo.accent}66` }}>2026</span>
                  </div>
                  <span className="text-[13px] font-bold text-white leading-tight whitespace-pre-line relative z-[1]">{codigo.title}</span>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[3px]"
                    style={{ background: `linear-gradient(90deg, transparent, ${codigo.accent}80, transparent)` }}
                  />
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <PersonalizarAcessoRapidoSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onUpdate={setAcessoRapido}
      />

      {/* === Explicações (artigos educativos) === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20">
              <BookOpen className="w-4 h-4 text-amber-100" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight">Explicações</h3>
            </div>
          </div>
          <button
            onClick={() => navigate("/leis/explicacoes")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-medium"
          >
            Ver todas
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loadingExplicacoes ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : explicacoes && explicacoes.length > 0 ? (
          <ScrollArea className="w-full">
            <div className="flex gap-3 px-2 pb-2">
              {explicacoes.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => navigate("/leis/explicacoes")}
                  className="w-[140px] shrink-0 group text-left bg-card rounded-xl overflow-hidden shadow-md shadow-black/30 ring-1 ring-white/[0.06] hover:shadow-xl hover:ring-white/15 transition-all duration-300"
                >
                  {/* Capa */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {item.url_capa ? (
                      <img
                        src={item.url_capa}
                        alt={item.titulo}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="eager"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] font-bold text-amber-300 bg-black/50 px-1.5 py-0.5 rounded-full">{item.ordem}</span>
                    </div>
                  </div>
                  {/* Título e descrição abaixo */}
                  <div className="p-2.5">
                    <h4 className="font-bold text-foreground text-[11px] leading-tight line-clamp-2">
                      {item.titulo}
                    </h4>
                    {item.descricao_curta && (
                      <p className="text-muted-foreground text-[9px] line-clamp-2 leading-snug mt-0.5">{item.descricao_curta}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <div className="px-2">
            <button
              onClick={() => navigate("/leis/explicacoes")}
              className="w-full bg-card border border-border/30 rounded-xl p-4 text-center hover:border-primary/30 transition-all"
            >
              <BookOpen className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Ver Explicações de Leis</p>
            </button>
          </div>
        )}
      </div>

      {/* === Legislativo === */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20">
            <Landmark className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight">Legislativo</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 px-2">
          {/* Câmara dos Deputados */}
          <button
            onClick={() => navigate("/legislativo/camara")}
            className="group relative bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-xl p-3 h-[120px] flex flex-col items-start justify-between text-left overflow-hidden border border-white/[0.06] active:scale-95 transition-transform"
            style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
          >
            <Landmark
              className="absolute -bottom-2 -right-2 w-[65px] h-[65px] pointer-events-none rotate-[-12deg] blur-[0.3px]"
              strokeWidth={1.2}
              style={{ animation: 'ghostGlow 6s ease-in-out infinite 0.3s', opacity: 0.3, color: 'rgba(255,255,255,0.35)' }}
            />
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
              <div
                className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                style={{ animation: 'shinePratique 4s ease-in-out infinite 0.5s' }}
              />
            </div>
            <div className="bg-white/15 p-2.5 rounded-xl relative z-[1]">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div className="text-left relative z-[1] w-full flex items-end justify-between">
              <div>
                <span className="text-[14px] font-bold text-white block leading-tight">Câmara dos</span>
                <span className="text-[14px] font-bold text-white block leading-tight">Deputados</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #6ee7b780, transparent)' }} />
          </button>

          {/* Senado Federal */}
          <button
            onClick={() => navigate("/legislativo/senado")}
            className="group relative bg-gradient-to-br from-blue-800 to-blue-950 rounded-xl p-3 h-[120px] flex flex-col items-start justify-between text-left overflow-hidden border border-white/[0.06] active:scale-95 transition-transform"
            style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
          >
            <Users
              className="absolute -bottom-2 -right-2 w-[65px] h-[65px] pointer-events-none rotate-[-12deg] blur-[0.3px]"
              strokeWidth={1.2}
              style={{ animation: 'ghostGlow 6s ease-in-out infinite 0.6s', opacity: 0.3, color: 'rgba(255,255,255,0.35)' }}
            />
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
              <div
                className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                style={{ animation: 'shinePratique 4s ease-in-out infinite 0.8s' }}
              />
            </div>
            <div className="bg-white/15 p-2.5 rounded-xl relative z-[1]">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-left relative z-[1] w-full flex items-end justify-between">
              <div>
                <span className="text-[14px] font-bold text-white block leading-tight">Senado</span>
                <span className="text-[14px] font-bold text-white block leading-tight">Federal</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #60a5fa80, transparent)' }} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes newsSlideIn {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
});

LegislacaoHomeSection.displayName = 'LegislacaoHomeSection';
export default LegislacaoHomeSection;
