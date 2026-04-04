import { memo, useCallback, useState, useRef, useEffect } from "react";
import { GraduationCap, FileCheck2, Video, Target, ChevronRight, Brain, Headphones, BookOpen, Footprints, Settings, Scale, Briefcase, Trophy, Flame, Wrench, Film, Landmark, Camera, Bot, Newspaper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


import { PersonalizarEstudosSheet, getEstudosPrefs } from "@/components/PersonalizarEstudosSheet";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import brasaoRepublica from "@/assets/brasao-republica.webp";

interface EmAltaSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
  onProfessora?: () => void;
}

type MainTab = 'estudos' | 'emalta';

// Keys that remain FREE after trial expires
const FREE_ESTUDOS = new Set(["videoaulas", "vademecum"]);

const DEFAULT_ESTUDOS_ORDER = ["vademecum", "evelyn", "simulados", "audioaulas", "dicionario", "documentarios", "politica", "tribuna", "analises"];

// Itens de ESTUDOS
const itensEstudos = [
  { id: "juriflix", title: "JuriFlix", description: "Filmes e séries jurídicas", icon: Film, route: "/juriflix" },
  { id: "evelyn", title: "Evelyn", description: "Sua assistente jurídica IA", icon: Bot, route: "/evelyn" },
  { id: "simulados", title: "Simulados", description: "Concursos e provas", icon: Trophy, route: "/ferramentas/simulados" },
  { id: "audioaulas", title: "Áudio Aulas", description: "Aprenda ouvindo", icon: Headphones, route: "/audioaulas" },
  { id: "dicionario", title: "Dicionário", description: "Termos jurídicos", icon: BookOpen, route: "/dicionario" },
  { id: "documentarios", title: "Documentários", description: "Os mais assistidos", icon: Film, route: "/documentarios" },
  { id: "politica", title: "Política", description: "Cenário político e legislativo", icon: Landmark, route: "/politica" },
  { id: "tribuna", title: "Tribuna", description: "Galeria institucional", icon: Camera, route: "/tribuna" },
  { id: "analises", title: "Análises", description: "Explorar conteúdo jurídico", icon: Newspaper, route: "/vade-mecum/blogger/leis" },
];

// Ranking "Em Alta" — funções mais acessadas
const rankingEmAlta = [
  { position: 1, title: "Vade Mecum", description: "Lei Seca atualizada", icon: Scale, route: "/vade-mecum" },
  { position: 2, title: "Flashcards", description: "Memorização ativa", icon: Brain, route: "/flashcards/areas" },
  { position: 3, title: "Questões", description: "Pratique com provas reais", icon: Target, route: "/questoes" },
  { position: 4, title: "Resumos", description: "Conteúdo direto ao ponto", icon: FileCheck2, route: "/resumos-juridicos" },
  { position: 5, title: "Videoaulas", description: "Assista e aprenda", icon: Video, route: "/videoaulas" },
  { position: 6, title: "Biblioteca", description: "Acervo jurídico completo", icon: BookOpen, route: "/bibliotecas" },
  { position: 7, title: "Áudio Aulas", description: "Aprenda ouvindo", icon: Headphones, route: "/audioaulas" },
];

const getMedalColor = (pos: number) => {
  if (pos === 1) return "text-amber-400";
  if (pos === 2) return "text-gray-300";
  if (pos === 3) return "text-amber-600";
  return "text-white/40";
};

const getMedalBg = (pos: number) => {
  if (pos === 1) return "bg-amber-500/20 border-amber-500/30";
  if (pos === 2) return "bg-gray-400/15 border-gray-400/20";
  if (pos === 3) return "bg-amber-700/15 border-amber-700/20";
  return "bg-white/5 border-white/10";
};

const tabVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const EmAltaSection = memo(({ isDesktop, navigate, handleLinkHover, onProfessora }: EmAltaSectionProps) => {
  const handleNavigate = useCallback((route: string) => {
    if (route === '__professora__') {
      onProfessora?.();
      return;
    }
    navigate(route);
  }, [navigate, onProfessora]);

  const { user } = useAuth();
  const { trialExpired, loading: trialLoading } = useTrialStatus();
  const { isPremium } = useSubscription();
  const isBlocked = !!user && !trialLoading && trialExpired && !isPremium;

  const [mainTab, setMainTab] = useState<MainTab>('estudos');
  const [personalizarOpen, setPersonalizarOpen] = useState(false);
  const [estudosPrefs, setEstudosPrefs] = useState(getEstudosPrefs);

  const reloadPrefs = useCallback(() => {
    setEstudosPrefs(getEstudosPrefs());
  }, []);

  const effectiveOrder = isBlocked ? DEFAULT_ESTUDOS_ORDER : estudosPrefs.order;
  const filteredEstudos = effectiveOrder
    .map((id) => itensEstudos.find((item) => item.id === id))
    .filter(Boolean) as typeof itensEstudos;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMainTabChange = useCallback((tab: MainTab) => {
    setMainTab(tab);
  }, []);

  const isFocusMode = false;

  const containerBg = mainTab === 'emalta'
    ? "bg-gradient-to-br from-[hsl(0,25%,12%)] via-[hsl(0,20%,10%)] to-[hsl(0,15%,8%)] border-[hsl(0,30%,20%)]/40"
    : "bg-gradient-to-br from-[hsl(0,25%,12%)] via-[hsl(0,20%,10%)] to-[hsl(0,15%,8%)] border-[hsl(0,30%,20%)]/40";

  return (
    <>
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleMainTabChange('estudos')}
          />
        )}
      </AnimatePresence>

      <div
        className={`space-y-3 mt-2 transition-all duration-300 ${isFocusMode ? 'relative z-[9999]' : ''}`}
        data-tutorial="em-alta"
        ref={containerRef}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-xl">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                Ferramentas
              </h3>
              <p className="text-muted-foreground text-xs">
                Recursos de estudo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('/carreiras-juridicas')}
              className="p-2 rounded-xl bg-amber-500/20 transition-colors hover:bg-amber-500/30"
              aria-label="Carreiras Jurídicas"
            >
              <Briefcase className="w-4 h-4 text-amber-200" />
            </button>
            <button
              onClick={() => {
                if (isBlocked) {
                  toast("Assine para personalizar seus estudos", { icon: "👑" });
                  return;
                }
                setPersonalizarOpen(true);
              }}
              className={`p-2 rounded-xl bg-amber-500/20 transition-colors ${isBlocked ? 'opacity-50' : ''}`}
              aria-label="Personalizar estudos"
            >
              <Settings className="w-4 h-4 text-amber-200" />
            </button>
          </div>
        </div>

        {/* Container */}
        <div className={`rounded-3xl p-4 relative overflow-hidden shadow-2xl border transition-all duration-300 ${containerBg} ${isFocusMode ? 'ring-1 ring-white/20 shadow-[0_0_60px_rgba(0,0,0,0.5)]' : ''}`}>
          {/* Toggle Tabs - 3 botões */}
          <div className="flex items-center w-full bg-[hsl(0,20%,10%)]/60 rounded-full p-1 gap-0.5 mb-4">
            <button
              onClick={() => handleMainTabChange('estudos')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                mainTab === 'estudos'
                  ? "bg-white/20 text-white shadow-md backdrop-blur-sm ring-1 ring-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Estudos</span>
            </button>
            <button
              onClick={() => handleMainTabChange('emalta')}
              className={`relative overflow-hidden flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                mainTab === 'emalta'
                  ? "bg-white/20 text-white shadow-md backdrop-blur-sm ring-1 ring-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Em Alta</span>
              {mainTab !== 'emalta' && (
                <span className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                  <span className="absolute top-0 left-[-100%] w-[60%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[searchShine_3s_ease-in-out_infinite] skew-x-[-20deg]" />
                </span>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mainTab === 'estudos' && (
              <motion.div key="estudos" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <div className={`grid gap-2 relative z-10 ${isDesktop ? 'grid-cols-3 gap-4 xl:gap-5' : 'grid-cols-2 gap-3'}`}>
                  {filteredEstudos.map((item, index) => {
                    const Icon = item.icon;
                    const hasBrasao = 'useBrasao' in item && (item as any).useBrasao;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.route)} 
                        className={`group bg-white/8 rounded-xl p-2.5 text-left transition-all duration-300 hover:bg-white/12 hover:shadow-lg hover:scale-[1.02] flex flex-col gap-1.5 border border-white/10 hover:border-white/20 overflow-hidden relative ${isDesktop ? 'min-h-[160px] xl:min-h-[180px] 2xl:min-h-[200px] rounded-2xl p-5 xl:p-6 gap-3' : 'h-[130px] rounded-2xl p-3 gap-2'}`}
                        style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)' }}
                      >
                        <div className={`bg-white/20 rounded-lg w-fit group-hover:bg-white/30 transition-colors shadow-lg ${isDesktop ? 'p-3 xl:p-3.5 rounded-xl' : 'p-2 rounded-xl'}`}>
                          {hasBrasao ? (
                            <img src={brasaoRepublica} alt="Brasão" className={`object-contain drop-shadow-md ${isDesktop ? 'w-7 h-7 xl:w-8 xl:h-8' : 'w-5 h-5'}`} />
                          ) : (
                            <Icon className={`text-amber-100 drop-shadow-md ${isDesktop ? 'w-7 h-7 xl:w-8 xl:h-8' : 'w-5 h-5'}`} />
                          )}
                        </div>
                        
                        <div>
                          <h4 className={`font-extrabold text-white mb-1 group-hover:translate-x-0.5 transition-transform tracking-tight ${isDesktop ? 'text-base xl:text-lg' : 'text-[15px] leading-tight'}`} style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className={`text-white/80 line-clamp-2 leading-snug ${isDesktop ? 'text-sm xl:text-base' : 'text-xs'}`} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                              {item.description}
                            </p>
                          )}
                        </div>
                        <ChevronRight className={`absolute text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all ${isDesktop ? 'bottom-4 right-4 w-6 h-6' : 'bottom-2 right-2 w-5 h-5'}`} />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}




            {mainTab === 'emalta' && (
              <motion.div key="emalta" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <div className="space-y-2">
                  {rankingEmAlta.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.position}
                        onClick={() => handleNavigate(item.route)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 hover:bg-white/15 active:scale-[0.98] border ${getMedalBg(item.position)}`}
                      >
                        {/* Posição / Medal */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                          item.position <= 3 ? 'bg-white/10' : 'bg-white/5'
                        }`}>
                          <span className={getMedalColor(item.position)}>
                            {item.position}º
                          </span>
                        </div>

                        {/* Ícone */}
                        <div className="p-2 rounded-lg bg-white/10 shrink-0">
                          <Icon className="w-4 h-4 text-amber-100" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left min-w-0">
                          <h4 className="text-sm font-bold text-white truncate" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-white/60 truncate">
                            {item.description}
                          </p>
                        </div>

                        {/* Flame indicator for top 3 */}
                        {item.position <= 3 && (
                          <Flame className={`w-4 h-4 shrink-0 ${getMedalColor(item.position)}`} />
                        )}

                        <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <PersonalizarEstudosSheet
        open={personalizarOpen}
        onOpenChange={setPersonalizarOpen}
        onSave={reloadPrefs}
      />
      
    </>
  );
});

EmAltaSection.displayName = 'EmAltaSection';

export default EmAltaSection;
