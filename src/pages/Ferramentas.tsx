import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePrefetchRoute } from "@/hooks/usePrefetchRoute";
import { 
  MonitorSmartphone, GraduationCap, Wrench,
  Scale, ChevronRight, Settings, MapPin, Globe, ExternalLink, Link2, BookOpen,
  Bot, Target, Briefcase, Building2, Calendar, BookMarked, Brain, FileSearch,
  Rss, Landmark, Newspaper, Film, Crown
} from "lucide-react";
import { AnaliseJuridicaSection } from "@/components/home/AnaliseJuridicaSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceType } from "@/hooks/use-device-type";
import { DotPattern } from "@/components/ui/dot-pattern";

const GOLD = "hsl(40, 80%, 55%)";

interface FerramentaCard {
  id: string; title: string; description: string; icon: React.ElementType; iconBg: string; color: string; route: string;
}
interface FerramentaCategory {
  title: string; emoji: string; items: FerramentaCard[];
}

const CATEGORIAS: FerramentaCategory[] = [
  {
    title: "Faculdade", emoji: "🎓",
    items: [
      { id: "simulados", title: "Simulados", description: "Concursos e provas", icon: Target, iconBg: "bg-amber-500", color: GOLD, route: "/ferramentas/simulados" },
      { id: "carreiras", title: "Carreiras Jurídicas", description: "Guia de carreiras no Direito", icon: Briefcase, iconBg: "bg-amber-600", color: GOLD, route: "/carreiras-juridicas" },
      { id: "ranking", title: "Ranking de Faculdades", description: "Melhores faculdades de Direito", icon: GraduationCap, iconBg: "bg-emerald-500", color: GOLD, route: "/ranking-faculdades" },
      { id: "tcc", title: "Pesquisar TCC", description: "Busque temas e trabalhos", icon: FileSearch, iconBg: "bg-indigo-500", color: GOLD, route: "/ferramentas/tcc" },
      { id: "plano-estudos", title: "Plano de Estudos", description: "Organize sua rotina", icon: BookMarked, iconBg: "bg-sky-500", color: GOLD, route: "/plano-estudos" },
      { id: "mapa-mental", title: "Mapa Mental", description: "Visualize conceitos jurídicos", icon: Brain, iconBg: "bg-pink-500", color: GOLD, route: "/mapa-mental" },
    ],
  },
  {
    title: "Advogado", emoji: "💼",
    items: [
      { id: "evelyn", title: "Evelyn", description: "Sua assistente jurídica IA", icon: Bot, iconBg: "bg-violet-500", color: GOLD, route: "/evelyn" },
      { id: "dicionario", title: "Dicionário Jurídico", description: "Termos jurídicos", icon: BookOpen, iconBg: "bg-blue-500", color: GOLD, route: "/dicionario" },
      { id: "cnpj", title: "Consulta CNPJ", description: "Dados de empresas brasileiras", icon: Building2, iconBg: "bg-teal-500", color: GOLD, route: "/advogado/consulta-cnpj" },
      { id: "prazos", title: "Calculadora de Prazos", description: "Prazos em dias úteis", icon: Calendar, iconBg: "bg-orange-500", color: GOLD, route: "/advogado/prazos" },
      { id: "localizador", title: "Localizador Jurídico", description: "Tribunais e cartórios próximos", icon: MapPin, iconBg: "bg-teal-600", color: GOLD, route: "/ferramentas/locais-juridicos" },
      { id: "acesso-desktop", title: "Acesso Desktop", description: "Acesse a plataforma no computador", icon: MonitorSmartphone, iconBg: "bg-slate-500", color: GOLD, route: "/acesso-desktop" },
    ],
  },
  {
    title: "Informação", emoji: "📰",
    items: [
      { id: "boletins", title: "Boletins", description: "Notícias jurídicas diárias", icon: Rss, iconBg: "bg-orange-500", color: GOLD, route: "/ferramentas/boletins" },
      { id: "politica", title: "Política", description: "Cenário político e legislativo", icon: Landmark, iconBg: "bg-emerald-500", color: GOLD, route: "/politica" },
      { id: "analises", title: "Análises", description: "Explorar conteúdo jurídico", icon: Newspaper, iconBg: "bg-cyan-500", color: GOLD, route: "/vade-mecum/blogger/leis" },
      { id: "documentarios", title: "Documentários", description: "Filmes e séries jurídicas", icon: Film, iconBg: "bg-red-500", color: GOLD, route: "/ferramentas/documentarios-juridicos" },
    ],
  },
];

const ferramentasAdmin: FerramentaCard[] = [
  { id: "admin", title: "Administração", description: "Ferramentas de gestão do sistema", icon: Settings, iconBg: "bg-red-500", color: GOLD, route: "/admin" },
];

interface LinkUtilCard {
  id: string; title: string; description: string; icon: React.ElementType; iconBg: string; color: string; url: string;
}

const linksUteis: LinkUtilCard[] = [
  { id: "stf", title: "STF", description: "Portal oficial do Supremo Tribunal Federal", icon: Scale, iconBg: "bg-red-600", color: "#dc2626", url: "https://portal.stf.jus.br/" },
  { id: "stj", title: "STJ", description: "Portal oficial do Superior Tribunal de Justiça", icon: Scale, iconBg: "bg-green-600", color: "#16a34a", url: "https://www.stj.jus.br/" },
  { id: "cnj", title: "CNJ", description: "Conselho Nacional de Justiça", icon: Scale, iconBg: "bg-blue-600", color: "#2563eb", url: "https://www.cnj.jus.br/" },
  { id: "tst", title: "TST", description: "Tribunal Superior do Trabalho", icon: Scale, iconBg: "bg-amber-600", color: "#d97706", url: "https://www.tst.jus.br/" },
  { id: "tse", title: "TSE", description: "Tribunal Superior Eleitoral", icon: Scale, iconBg: "bg-purple-600", color: "#9333ea", url: "https://www.tse.jus.br/" },
  { id: "planalto", title: "Planalto", description: "Legislação brasileira oficial", icon: Globe, iconBg: "bg-emerald-600", color: "#059669", url: "https://www.planalto.gov.br/legislacao" },
  { id: "oab", title: "OAB Nacional", description: "Ordem dos Advogados do Brasil", icon: Scale, iconBg: "bg-slate-700", color: "#334155", url: "https://www.oab.org.br/" },
  { id: "conjur", title: "ConJur", description: "Portal de notícias jurídicas", icon: Globe, iconBg: "bg-orange-500", color: "#f97316", url: "https://www.conjur.com.br/" },
  { id: "migalhas", title: "Migalhas", description: "Informativo jurídico diário", icon: Globe, iconBg: "bg-rose-500", color: "#f43f5e", url: "https://www.migalhas.com.br/" },
  { id: "jota", title: "JOTA", description: "Jornalismo e dados sobre o sistema de Justiça", icon: Globe, iconBg: "bg-cyan-600", color: "#0891b2", url: "https://www.jota.info/" },
];

const CategoryGrid = ({ category, startIndex = 0 }: { category: FerramentaCategory; startIndex?: number }) => {
  const navigate = useNavigate();
  const { onTouchStart } = usePrefetchRoute();
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'hsl(40, 20%, 55%)' }}>
        {category.emoji} {category.title}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {category.items.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => navigate(card.route)}
              onTouchStart={() => onTouchStart(card.route)}
              className="backdrop-blur-sm rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all group shadow-lg"
              style={{
                background: 'hsla(345, 30%, 18%, 0.7)',
                borderLeft: `4px solid ${GOLD}`,
                borderTop: '1px solid hsla(40, 60%, 50%, 0.08)',
                borderRight: '1px solid hsla(40, 60%, 50%, 0.08)',
                borderBottom: '1px solid hsla(40, 60%, 50%, 0.08)',
                opacity: 0, transform: 'translateY(-20px) translateZ(0)',
                animation: `slideDown 0.5s ease-out ${(startIndex + index) * 0.06}s forwards`,
                willChange: 'transform, opacity',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2.5 shrink-0" style={{ background: 'hsla(40, 80%, 55%, 0.12)' }}>
                  <Icon className="w-5 h-5" style={{ color: GOLD }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold" style={{ color: 'hsl(40, 60%, 90%)' }}>{card.title}</h3>
                  <p className="text-sm line-clamp-1" style={{ color: 'hsl(40, 20%, 55%)' }}>{card.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: GOLD }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LinksUteisList = ({ links }: { links: LinkUtilCard[] }) => {
  const handleClick = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {links.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={`link-${card.id}`} onClick={() => handleClick(card.url)}
            className="backdrop-blur-sm rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all group shadow-lg"
            style={{
              background: 'hsla(345, 30%, 18%, 0.7)',
              borderLeft: `4px solid ${card.color}`,
              borderTop: '1px solid hsla(40, 60%, 50%, 0.08)',
              borderRight: '1px solid hsla(40, 60%, 50%, 0.08)',
              borderBottom: '1px solid hsla(40, 60%, 50%, 0.08)',
              opacity: 0, transform: 'translateY(-20px) translateZ(0)',
              animation: `slideDown 0.5s ease-out ${index * 0.08}s forwards`,
              willChange: 'transform, opacity',
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`${card.iconBg} rounded-lg p-2.5 shrink-0`}><Icon className="w-5 h-5 text-white" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold" style={{ color: 'hsl(40, 60%, 90%)' }}>{card.title}</h3>
                <p className="text-sm line-clamp-1" style={{ color: 'hsl(40, 20%, 55%)' }}>{card.description}</p>
              </div>
              <ExternalLink className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: GOLD }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EMAIL_ADMIN = "wn7corporation@gmail.com";

const Ferramentas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState("ferramentas");
  const { isDesktop } = useDeviceType();
  const isAdmin = user?.email === EMAIL_ADMIN;

  if (isDesktop) {
    let runningIndex = 0;
    return (
      <div className="flex" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-7 h-7" style={{ color: GOLD }} />
              <h1 className="text-2xl font-bold text-foreground">Ferramentas</h1>
            </div>
            {CATEGORIAS.map((cat) => {
              const start = runningIndex;
              runningIndex += cat.items.length;
              return <CategoryGrid key={cat.title} category={cat} startIndex={start} />;
            })}
            {isAdmin && (
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">⚙️ Admin</p>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {ferramentasAdmin.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.id} onClick={() => navigate(card.route)} className="bg-card/90 rounded-xl p-5 cursor-pointer hover:bg-accent/10 hover:scale-[1.01] transition-all border-l-4 group shadow-lg" style={{ borderLeftColor: card.color }}>
                        <div className="flex items-center gap-3">
                          <div className={`${card.iconBg} rounded-lg p-2.5`}><Icon className="w-5 h-5 text-white" /></div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground">{card.title}</h3>
                            <p className="text-sm text-muted-foreground">{card.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <AnaliseJuridicaSection />
          </div>
        </div>
        <div className="w-[300px] xl:w-[340px] flex-shrink-0 border-l border-border/30 bg-card/20 overflow-y-auto p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><Link2 className="w-4 h-4" /> Links Úteis</h3>
          <div className="space-y-2">
            {linksUteis.map((link) => {
              const Icon = link.icon;
              return (
                <div key={link.id} onClick={() => window.open(link.url, '_blank')} className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30 cursor-pointer hover:bg-accent/10 transition-all group">
                  <div className={`${link.iconBg} rounded-lg p-1.5`}><Icon className="w-4 h-4 text-white" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{link.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── MOBILE ───
  let mobileIndex = 0;
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, hsl(345, 65%, 28%), hsl(350, 40%, 12%))' }}>
      <DotPattern className="opacity-[0.15]" />

      <div className="relative z-10">
        {/* Hero */}
        <div className="px-4 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 h-6" style={{ color: GOLD }} />
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(40, 60%, 85%)' }}>
              Ferramentas
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'hsl(40, 30%, 70%)' }}>
            Todas as ferramentas úteis em um só lugar
          </p>
        </div>

        <div className="px-4 lg:px-8 pt-2 pb-24 max-w-6xl mx-auto">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
            <TabsList className="grid grid-cols-2 w-full lg:max-w-md h-auto p-1" style={{ background: 'hsla(345, 30%, 18%, 0.8)', border: '1px solid hsla(40, 60%, 50%, 0.12)' }}>
              <TabsTrigger value="ferramentas" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm" style={{ color: abaAtiva === 'ferramentas' ? GOLD : 'hsl(40, 20%, 55%)' }}>
                <Wrench className="w-4 h-4" /><span>Ferramentas</span>
              </TabsTrigger>
              <TabsTrigger value="links" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm" style={{ color: abaAtiva === 'links' ? GOLD : 'hsl(40, 20%, 55%)' }}>
                <Link2 className="w-4 h-4" /><span>Links Úteis</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="ferramentas" className="mt-0">
                {CATEGORIAS.map((cat) => {
                  const start = mobileIndex;
                  mobileIndex += cat.items.length;
                  return <CategoryGrid key={cat.title} category={cat} startIndex={start} />;
                })}
                <div className="mt-2 pt-4" style={{ borderTop: '1px solid hsla(40, 60%, 50%, 0.1)' }}>
                  <AnaliseJuridicaSection />
                </div>
                {isAdmin && (
                  <div className="mt-6 pt-4" style={{ borderTop: '1px solid hsla(40, 60%, 50%, 0.1)' }}>
                    <p className="text-xs mb-3 px-1" style={{ color: 'hsl(40, 20%, 50%)' }}>Administração</p>
                    <CategoryGrid category={{ title: "Admin", emoji: "⚙️", items: ferramentasAdmin }} />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="links" className="mt-0">
                <LinksUteisList links={linksUteis} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px) translateZ(0); }
          to { opacity: 1; transform: translateY(0) translateZ(0); }
        }
      `}</style>
    </div>
  );
};

export default Ferramentas;
