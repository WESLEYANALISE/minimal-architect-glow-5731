import { useState, useMemo } from "react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { HandCoins, Calculator, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import brasaoRepublica from "@/assets/brasao-republica.webp";
import { DotPattern } from "@/components/ui/dot-pattern";
import { LeisToggleMenu, FilterMode } from "@/components/LeisToggleMenu";
import { useLeisFavoritas, useLeisRecentes, useToggleFavorita, useRegistrarAcesso } from "@/hooks/useLeisFavoritasRecentes";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumBadge } from "@/components/PremiumBadge";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";

interface LeiCard {
  id: string;
  sigla: string;
  titulo: string;
  numero: string;
  descricao: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  route: string;
}

const leis: LeiCard[] = [
  {
    id: "beneficios",
    sigla: "",
    titulo: "Lei de Benefícios da Previdência Social",
    numero: "Lei nº 8.213/1991",
    descricao: "Lei nº 8.213/1991",
    icon: HandCoins,
    color: "#22c55e",
    iconBg: "bg-green-500",
    route: "/lei-previdenciaria/beneficios"
  },
  {
    id: "custeio",
    sigla: "",
    titulo: "Lei do Custeio da Seguridade Social",
    numero: "Lei nº 8.212/1991",
    descricao: "Lei nº 8.212/1991",
    icon: Calculator,
    color: "#3b82f6",
    iconBg: "bg-blue-500",
    route: "/lei-previdenciaria/custeio"
  },
  {
    id: "complementar",
    sigla: "",
    titulo: "Lei da Previdência Complementar",
    numero: "LC nº 109/2001",
    descricao: "LC nº 109/2001",
    icon: CheckCircle,
    color: "#a855f7",
    iconBg: "bg-purple-500",
    route: "/previdenciario/complementar"
  }
];

const CATEGORIA = 'previdenciario' as const;

const Previdenciario = () => {
  const navigate = useTransitionNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  // Hooks de favoritos e recentes
  const { data: favoritas = [] } = useLeisFavoritas(CATEGORIA);
  const { data: recentes = [] } = useLeisRecentes(CATEGORIA);
  const { toggle: toggleFavorita, isLoading: isTogglingFavorita } = useToggleFavorita(CATEGORIA);
  const registrarAcesso = useRegistrarAcesso(CATEGORIA);

  const filteredLeis = useMemo(() => {
    let result = leis;

    // Filtrar por modo
    if (filterMode === 'favoritos') {
      const favoritasIds = favoritas.map(f => f.lei_id);
      result = leis.filter(lei => favoritasIds.includes(lei.id));
    } else if (filterMode === 'recentes') {
      const recentesIds = recentes.map(r => r.lei_id);
      result = recentesIds
        .map(id => leis.find(lei => lei.id === id))
        .filter((lei): lei is LeiCard => lei !== undefined);
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lei => 
        lei.sigla.toLowerCase().includes(query) || 
        lei.titulo.toLowerCase().includes(query) ||
        lei.numero.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, filterMode, favoritas, recentes]);

  // Previdenciário - todas gratuitas
  const FREE_LEIS_PREV = ['beneficios', 'custeio', 'complementar'];
  const isFreeLei = (id: string) => FREE_LEIS_PREV.includes(id);

  const handleCardClick = (lei: LeiCard) => {
    if (!isPremium && !isFreeLei(lei.id)) {
      setPremiumModalOpen(true);
      return;
    }
    registrarAcesso.mutate({
      lei_id: lei.id, titulo: lei.titulo, sigla: lei.sigla, cor: lei.color, route: lei.route,
    });
    navigate(lei.route);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(0, 0%, 7%)' }}>
      <PremiumFloatingCard isOpen={premiumModalOpen} onClose={() => setPremiumModalOpen(false)} title="Conteúdo Premium" sourceFeature="Previdenciário" />
      
      {/* Header Realeza */}
      <div className="relative" style={{ borderBottom: '1px solid hsla(40, 60%, 50%, 0.12)' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, hsl(0, 0%, 10%), hsl(0, 0%, 7%))' }} />
        <DotPattern className="fill-[hsla(40,50%,40%,0.12)]" />
        <div className="relative z-10 px-4 py-6 flex flex-col items-center text-center">
          <div className="rounded-full p-1" style={{ border: '2px solid hsla(40, 60%, 50%, 0.25)', boxShadow: '0 0 20px hsla(40, 60%, 50%, 0.1)' }}>
            <img src={brasaoRepublica} alt="Brasão da República" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white mt-3" style={{ fontFamily: "'Playfair Display', serif" }}>PREVIDENCIÁRIO</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(40, 70%, 60%)' }}>3 legislação(ões)</p>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="px-4 py-4 space-y-3" style={{ borderBottom: '1px solid hsla(40, 60%, 50%, 0.08)', background: 'hsl(0, 0%, 8%)' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(40, 50%, 50%)' }} />
          <Input placeholder="Buscar lei..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" style={{ background: 'hsl(0, 0%, 10%)', borderColor: 'hsla(40, 60%, 50%, 0.12)', color: 'white' }} />
          <Button size="sm" className="absolute right-1 top-1/2 -translate-y-1/2" style={{ background: 'hsl(40, 80%, 55%)', color: 'hsl(0,0%,7%)' }}>Buscar</Button>
        </div>
        <LeisToggleMenu value={filterMode} onChange={setFilterMode} favoritosCount={favoritas.length} recentesCount={recentes.length} />
      </div>

      {/* Lista de leis */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3 pb-24">
          {filteredLeis.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(40, 60%, 40%)' }} />
              <p style={{ color: 'hsl(40, 30%, 50%)' }}>
                {filterMode === 'favoritos' ? 'Nenhum favorito ainda' : 
                 filterMode === 'recentes' ? 'Nenhum acesso recente' : 
                 'Nenhuma lei encontrada'}
              </p>
            </div>
          ) : (
            filteredLeis.map((lei, index) => {
              const Icon = lei.icon;
              const isLocked = !isPremium && !isFreeLei(lei.id);
              return (
                <div
                  key={lei.id}
                  onClick={() => handleCardClick(lei)}
                  className="rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all group relative"
                  style={{ 
                    background: 'hsla(0, 0%, 100%, 0.04)',
                    border: '1px solid hsla(40, 60%, 50%, 0.08)',
                    borderLeft: `4px solid ${lei.color}`,
                    opacity: 0,
                    transform: 'translateY(-20px) translateZ(0)',
                    animation: `slideDown 0.5s ease-out ${index * 0.08}s forwards`,
                    willChange: 'transform, opacity'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${lei.iconBg} rounded-lg p-2.5 shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm text-white">{lei.titulo}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(0, 0%, 55%)' }}>{lei.numero}</p>
                    </div>
                    {isLocked && <PremiumBadge position="top-right" size="sm" className="relative top-auto right-auto" />}
                    {!isLocked && <CheckCircle className="w-5 h-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(40, 80%, 55%)' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Previdenciario;
