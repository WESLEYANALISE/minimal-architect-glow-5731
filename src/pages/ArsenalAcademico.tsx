import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Calendar, Layers, HelpCircle, BookOpen, Trophy, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const ferramentas = [
  {
    id: "resumo",
    titulo: "Resumo Inteligente",
    descricao: "Gera resumos em 4 modos: simples, aprofundado, revisão rápida e mapa de conceitos",
    emoji: "📝",
    icon: FileText,
    rota: "/arsenal/resumo",
    borda: "border-blue-500/60",
    bg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    bgIcon: "bg-blue-500/20",
    tag: "Resumos",
  },
  {
    id: "plano",
    titulo: "Plano de Estudos",
    descricao: "Cronograma semanal automático com data da prova, horas/dia e dificuldade",
    emoji: "📅",
    icon: Calendar,
    rota: "/arsenal/plano",
    borda: "border-green-500/60",
    bg: "bg-green-500/10",
    iconColor: "text-green-400",
    bgIcon: "bg-green-500/20",
    tag: "Organização",
  },
  {
    id: "flashcards",
    titulo: "Flashcards",
    descricao: "Cria cards estilo Anki: conceitual, comparativo e exemplos práticos",
    emoji: "🃏",
    icon: Layers,
    rota: "/arsenal/flashcards",
    borda: "border-purple-500/60",
    bg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    bgIcon: "bg-purple-500/20",
    tag: "Memorização",
  },
  {
    id: "questoes",
    titulo: "Gerador de Questões",
    descricao: "Múltipla escolha, V/F, estilo OAB e concurso com dificuldade configurável",
    emoji: "❓",
    icon: HelpCircle,
    rota: "/arsenal/questoes",
    borda: "border-orange-500/60",
    bg: "bg-orange-500/10",
    iconColor: "text-orange-400",
    bgIcon: "bg-orange-500/20",
    tag: "Prática",
  },
  {
    id: "explicacao",
    titulo: "Explicação Simples",
    descricao: "Explica como iniciante, pré-prova, com analogias ou sem jargões jurídicos",
    emoji: "💡",
    icon: BookOpen,
    rota: "/arsenal/explicacao",
    borda: "border-cyan-500/60",
    bg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    bgIcon: "bg-cyan-500/20",
    tag: "Compreensão",
  },
  {
    id: "simulador",
    titulo: "Simulador de Prova",
    descricao: "Simulado completo com correção automática e análise de desempenho",
    emoji: "🏆",
    icon: Trophy,
    rota: "/arsenal/simulador",
    borda: "border-red-500/60",
    bg: "bg-red-500/10",
    iconColor: "text-red-400",
    bgIcon: "bg-red-500/20",
    tag: "Simulado",
  },
];

const ArsenalAcademico = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (user !== undefined && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [user, isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 rounded-lg">
              <GraduationCap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-none">Arsenal Acadêmico</h1>
              <p className="text-xs text-muted-foreground">Ferramentas de estudo potencializadas por IA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 max-w-2xl mx-auto w-full">
        {/* Banner de boas-vindas */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Potencialize seus estudos com IA</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Cole um texto, suba um arquivo (PDF/imagem/áudio) ou selecione uma matéria do sistema para gerar conteúdo personalizado.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Grid de ferramentas — 2 colunas */}
        <div className="grid grid-cols-2 gap-2">
          {ferramentas.map((f, index) => (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => navigate(f.rota)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${f.borda} ${f.bg}`}
            >
              <span className="text-2xl mb-2">{f.emoji}</span>
              <span className="text-xs font-semibold text-foreground leading-snug">{f.titulo}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 mb-1.5 ${f.bgIcon} ${f.iconColor}`}>
                {f.tag}
              </span>
              <span className="text-[10px] text-muted-foreground leading-snug">{f.descricao}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArsenalAcademico;
