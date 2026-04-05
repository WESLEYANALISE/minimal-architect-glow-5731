import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, ArrowLeft, Gamepad2, BarChart3, BookOpen, Scale, Landmark, Gavel, FileText, Users, HandCoins, Building2, Search, Briefcase, Globe, ChevronRight, Swords, CircleCheck, Rocket, HelpCircle, Brain, ArrowDownAZ, PenLine, BookOpenCheck } from "lucide-react";
import { useDeviceType } from "@/hooks/use-device-type";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { RankingList } from "@/components/gamificacao/RankingList";
import { GamificacaoEstatisticas } from "@/components/gamificacao/GamificacaoEstatisticas";
import gamSlide1 from "@/assets/gamificacao-slide-1.webp";
import gamSlide2 from "@/assets/gamificacao-slide-2.webp";
import gamSlide3 from "@/assets/gamificacao-slide-3.webp";
import gamSlide4 from "@/assets/gamificacao-slide-4.webp";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const MATERIAS = [
  { id: "direito-penal", nome: "Direito Penal", icon: Gavel, cor: "from-red-500 to-red-700" },
  { id: "direito-civil", nome: "Direito Civil", icon: Scale, cor: "from-blue-500 to-blue-700" },
  { id: "direito-constitucional", nome: "Direito Constitucional", icon: Landmark, cor: "from-purple-500 to-purple-700" },
  { id: "direito-processual-civil", nome: "Direito Processual Civil", icon: FileText, cor: "from-teal-500 to-teal-700" },
  { id: "direito-do-trabalho", nome: "Direito do Trabalho", icon: Users, cor: "from-orange-500 to-orange-700" },
  { id: "direito-tributario", nome: "Direito Tributário", icon: HandCoins, cor: "from-green-500 to-green-700" },
  { id: "direito-administrativo", nome: "Direito Administrativo", icon: Building2, cor: "from-indigo-500 to-indigo-700" },
  { id: "direito-processual-penal", nome: "Direito Processual Penal", icon: Search, cor: "from-pink-500 to-pink-700" },
  { id: "direito-empresarial", nome: "Direito Empresarial", icon: Briefcase, cor: "from-amber-500 to-amber-700" },
  { id: "direitos-humanos", nome: "Direitos Humanos", icon: Globe, cor: "from-cyan-500 to-cyan-700" },
];

const HERO_SLIDES = [
  {
    title: "Jogo da Forca Jurídico",
    subtitle: "Teste seus conhecimentos de forma divertida!",
    image: gamSlide1,
  },
  {
    title: "100 Níveis por Matéria",
    subtitle: "Desbloqueie níveis e conquiste estrelas em cada área do Direito",
    image: gamSlide2,
  },
  {
    title: "Ganhe XP e Suba no Ranking",
    subtitle: "Compete com outros jogadores e mostre quem domina o Direito",
    image: gamSlide3,
  },
  {
    title: "Palavras Inteligentes",
    subtitle: "Termos jurídicos reais gerados para cada nível",
    image: gamSlide4,
  },
];

const TABS = [
  { id: "areas", label: "Áreas", icon: BookOpen },
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "estatisticas", label: "Estatísticas", icon: BarChart3 },
] as const;

type TabId = typeof TABS[number]["id"];

type JogoSelecionado = "forca" | "batalha" | "sim_nao" | "invasores" | "quiz" | "memoria" | "ordenar_palavras" | "completar_lacunas" | "caso_pratico" | "jogo_pistas" | null;

const JOGOS = [
  {
    id: "forca" as const,
    nome: "Jogo da Forca",
    descricao: "100 níveis por matéria — descubra termos jurídicos",
    icone: "🎯",
    cor: "from-amber-500 to-orange-600",
    iconComponent: Gamepad2,
  },
  {
    id: "sim_nao" as const,
    nome: "Sim ou Não",
    descricao: "Afirmações jurídicas — verdadeiro ou falso?",
    icone: "✅",
    cor: "from-emerald-500 to-green-700",
    iconComponent: CircleCheck,
  },
  {
    id: "batalha" as const,
    nome: "Batalha Jurídica",
    descricao: "Debate entre advogados — escolha quem está certo",
    icone: "⚔️",
    cor: "from-red-500 to-red-700",
    iconComponent: Swords,
  },
  {
    id: "invasores" as const,
    nome: "Invasores Jurídicos",
    descricao: "Defenda-se dos artigos que caem do céu!",
    icone: "🚀",
    cor: "from-cyan-500 to-cyan-700",
    iconComponent: Rocket,
  },
  {
    id: "quiz" as const,
    nome: "Quiz Jurídico",
    descricao: "Perguntas de múltipla escolha e V ou F",
    icone: "❓",
    cor: "from-emerald-500 to-emerald-700",
    iconComponent: HelpCircle,
  },
  {
    id: "memoria" as const,
    nome: "Jogo da Memória",
    descricao: "Encontre pares de termos e definições",
    icone: "🧠",
    cor: "from-amber-500 to-amber-700",
    iconComponent: Brain,
  },
  {
    id: "ordenar_palavras" as const,
    nome: "Ordenar Palavras",
    descricao: "Reorganize as palavras na ordem correta",
    icone: "🔤",
    cor: "from-indigo-500 to-indigo-700",
    iconComponent: ArrowDownAZ,
  },
  {
    id: "completar_lacunas" as const,
    nome: "Completar Lacunas",
    descricao: "Preencha os espaços em textos de leis",
    icone: "📝",
    cor: "from-teal-500 to-teal-700",
    iconComponent: PenLine,
  },
  {
    id: "caso_pratico" as const,
    nome: "Caso Prático",
    descricao: "Resolva casos reais do Código Penal",
    icone: "📋",
    cor: "from-rose-500 to-red-700",
    iconComponent: BookOpenCheck,
  },
  {
    id: "jogo_pistas" as const,
    nome: "Detetive Jurídico",
    descricao: "Descubra o artigo pelas pistas — Código Penal",
    icone: "🔍",
    cor: "from-violet-500 to-purple-700",
    iconComponent: Search,
  },
];

const Gamificacao = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDesktop } = useDeviceType();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [activeTab, setActiveTab] = useState<TabId>("areas");
  const [slideIndex, setSlideIndex] = useState(0);
  const [jogoSelecionado, setJogoSelecionado] = useState<JogoSelecionado>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin]);

  const handleJogoClick = (jogoId: JogoSelecionado) => {
    if (jogoId === "batalha") navigate("/gamificacao/batalha-juridica/areas");
    else if (jogoId === "invasores") navigate("/gamificacao/invasores");
    else if (jogoId === "quiz") navigate("/jogos-juridicos/quiz/jogar");
    else if (jogoId === "memoria") navigate("/jogos-juridicos/memoria/jogar");
    else if (jogoId === "ordenar_palavras") navigate("/jogos-juridicos/ordenar_palavras/jogar");
    else if (jogoId === "completar_lacunas") navigate("/jogos-juridicos/completar_lacunas/jogar");
    else if (jogoId === "caso_pratico") navigate("/gamificacao/caso-pratico");
    else if (jogoId === "jogo_pistas") navigate("/gamificacao/jogo-pistas");
    else if (jogoId === "sim_nao") setJogoSelecionado("sim_nao");
    else setJogoSelecionado("forca");
  };

  if (isDesktop) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] bg-background">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Hero + Games */}
            <div className="col-span-9 space-y-6">
              {/* Compact Hero */}
              <div className="relative overflow-hidden rounded-2xl h-[180px]">
                <AnimatePresence mode="wait">
                  <motion.div key={slideIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                    <img src={HERO_SLIDES[slideIndex].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-4 left-6 z-10">
                      <h2 className="text-lg font-bold text-white">{HERO_SLIDES[slideIndex].title}</h2>
                      <p className="text-sm text-white/80">{HERO_SLIDES[slideIndex].subtitle}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="absolute bottom-2 right-4 flex gap-1.5 z-10">
                  {HERO_SLIDES.map((_, i) => (
                    <button key={i} onClick={() => setSlideIndex(i)} className={`rounded-full transition-all ${i === slideIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`} />
                  ))}
                </div>
              </div>

              {/* Games grid */}
              {!jogoSelecionado && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3 font-medium">Escolha um jogo:</p>
                  <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
                    {JOGOS.map((jogo) => {
                      const Icon = jogo.iconComponent;
                      return (
                        <motion.button key={jogo.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleJogoClick(jogo.id)}
                          className={`group relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-br ${jogo.cor} shadow-lg h-[120px]`}>
                          <div className="absolute -right-3 -bottom-3 opacity-20"><Icon className="w-20 h-20 text-white" /></div>
                          <div className="bg-white/20 rounded-xl p-2 w-fit mb-2"><Icon className="w-5 h-5 text-white" /></div>
                          <h3 className="font-bold text-white text-sm leading-tight">{jogo.nome}</h3>
                          <p className="text-white/70 text-[10px] mt-1 leading-tight">{jogo.descricao}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tabs + content for selected game */}
              {(jogoSelecionado === "forca" || jogoSelecionado === "sim_nao") && (
                <>
                  <div className="flex bg-muted/50 rounded-xl p-1 gap-1 max-w-md">
                    {TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                          <Icon className="w-3.5 h-3.5" />{tab.label}
                        </button>
                      );
                    })}
                  </div>
                  {activeTab === "areas" && (
                    <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
                      {MATERIAS.map((materia, idx) => {
                        const Icon = materia.icon;
                        const basePath = jogoSelecionado === "sim_nao" ? "/gamificacao/sim-nao" : "/gamificacao";
                        return (
                          <motion.button key={materia.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}
                            onClick={() => navigate(`${basePath}/${materia.id}`)}
                            className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${materia.cor} shadow-lg h-[100px]`}>
                            <div className="absolute -right-3 -bottom-3 opacity-20"><Icon className="w-20 h-20 text-white" /></div>
                            <div className="bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors"><Icon className="w-5 h-5 text-white" /></div>
                            <h3 className="font-semibold text-white text-sm leading-tight pr-6">{materia.nome}</h3>
                            <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white" />
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                  {activeTab === "ranking" && <RankingList />}
                  {activeTab === "estatisticas" && <GamificacaoEstatisticas />}
                </>
              )}
            </div>

            {/* Right sidebar: Ranking */}
            <div className="col-span-3 space-y-4">
              <div className="sticky top-20">
                <div className="rounded-2xl border border-border bg-card/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-sm">Ranking</h3>
                  </div>
                  <RankingList />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => jogoSelecionado ? setJogoSelecionado(null) : navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-amber-500" />
          <h1 className="text-lg font-bold text-foreground">Gamificação</h1>
        </div>
      </div>

      {/* Hero Carousel */}
      <div className="px-4 pb-4">
        <div className="relative overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.35 }}
              className="relative min-h-[140px] overflow-hidden rounded-2xl"
            >
              <img
                src={HERO_SLIDES[slideIndex].image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 p-5 flex flex-col justify-end h-full min-h-[140px]">
                <h2 className="text-base font-bold text-white leading-tight mb-1">
                  {HERO_SLIDES[slideIndex].title}
                </h2>
                <p className="text-xs text-white/80 leading-relaxed">
                  {HERO_SLIDES[slideIndex].subtitle}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`rounded-full transition-all ${
                  i === slideIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Game Selection - shown when no game is selected */}
      {!jogoSelecionado && (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground mb-3 font-medium">Escolha um jogo:</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {JOGOS.map((jogo) => {
              const Icon = jogo.iconComponent;
              return (
                <motion.button
                  key={jogo.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleJogoClick(jogo.id)}
                  className={`group relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-br ${jogo.cor} shadow-lg h-[120px]`}
                >
                  <div className="absolute -right-3 -bottom-3 opacity-20">
                    <Icon className="w-20 h-20 text-white" />
                  </div>
                  <div className="bg-white/20 rounded-xl p-2 w-fit mb-2">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-sm leading-tight">{jogo.nome}</h3>
                  <p className="text-white/70 text-[10px] mt-1 leading-tight">{jogo.descricao}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Show tabs + content when Jogo da Forca or Sim ou Não is selected */}
      {(jogoSelecionado === "forca" || jogoSelecionado === "sim_nao") && (
        <>
          {/* Tab Menu */}
          <div className="px-4 pb-4">
            <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "areas" && (
            <div className="px-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {MATERIAS.map((materia, idx) => {
                  const Icon = materia.icon;
                  const basePath = jogoSelecionado === "sim_nao" ? "/gamificacao/sim-nao" : "/gamificacao";
                  return (
                    <motion.button
                      key={materia.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => navigate(`${basePath}/${materia.id}`)}
                      className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${materia.cor} shadow-lg h-[100px]`}
                    >
                      <div className="absolute -right-3 -bottom-3 opacity-20">
                        <Icon className="w-20 h-20 text-white" />
                      </div>
                      <div className="bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-white text-sm leading-tight pr-6">
                        {materia.nome}
                      </h3>
                      <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "ranking" && <RankingList />}

          {activeTab === "estatisticas" && <GamificacaoEstatisticas />}
        </>
      )}
    </div>
  );
};

export default Gamificacao;
