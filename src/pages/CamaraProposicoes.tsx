import { FileText, Scale, Gavel, BookOpen, FileCheck, FileSignature, ArrowLeft, ChevronRight, Landmark } from "lucide-react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { useNavigate } from "react-router-dom";

const CamaraProposicoes = () => {
  const transitionNavigate = useTransitionNavigate();
  const navigate = useNavigate();

  const tiposProposicao = [
    { 
      sigla: "PL", 
      nome: "Projeto de Lei",
      descricao: "Propostas de novas leis ordinárias",
      icon: FileText,
      accent: "from-blue-500/20 to-blue-600/10",
      iconColor: "text-blue-400",
    },
    { 
      sigla: "PEC", 
      nome: "Emenda à Constituição",
      descricao: "Propostas de mudança na Constituição",
      icon: Scale,
      accent: "from-purple-500/20 to-purple-600/10",
      iconColor: "text-purple-400",
    },
    { 
      sigla: "MPV", 
      nome: "Medida Provisória",
      descricao: "Atos do Executivo com força de lei",
      icon: Gavel,
      accent: "from-red-500/20 to-red-600/10",
      iconColor: "text-red-400",
    },
    { 
      sigla: "PLP", 
      nome: "Lei Complementar",
      descricao: "Propostas de leis complementares",
      icon: BookOpen,
      accent: "from-green-500/20 to-green-600/10",
      iconColor: "text-green-400",
    },
    { 
      sigla: "PDC", 
      nome: "Decreto Legislativo",
      descricao: "Decretos do Poder Legislativo",
      icon: FileCheck,
      accent: "from-orange-500/20 to-orange-600/10",
      iconColor: "text-orange-400",
    },
    { 
      sigla: "PRC", 
      nome: "Resolução da Câmara",
      descricao: "Resoluções internas da Câmara",
      icon: FileSignature,
      accent: "from-cyan-500/20 to-cyan-600/10",
      iconColor: "text-cyan-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Voltar</p>
            <h1 className="text-lg font-bold text-foreground -mt-0.5">Projetos de Lei</h1>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-4xl mx-auto py-5 space-y-5">
        <div>
          <h2 className="text-base font-bold text-foreground mb-1">Proposições Legislativas</h2>
          <p className="text-xs text-muted-foreground">
            Escolha o tipo de proposição para visualizar
          </p>
        </div>

        <div className="space-y-3">
          {tiposProposicao.map((tipo, index) => {
            const Icon = tipo.icon;
            return (
              <button
                key={tipo.sigla}
                onClick={() => transitionNavigate(`/camara-deputados/proposicoes/lista?tipo=${tipo.sigla}`)}
                className="w-full flex items-center bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/40 transition-all active:scale-[0.98] text-left group animate-fade-in"
                style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'backwards' }}
              >
                {/* Icon area */}
                <div className="relative w-[72px] min-h-[72px] flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted/40">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tipo.accent}`}>
                    <Icon className={`w-6 h-6 ${tipo.iconColor}`} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-3.5 flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{tipo.sigla}</span>
                  </div>
                  <h3 className="font-bold text-[15px] text-foreground leading-tight">{tipo.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tipo.descricao}</p>
                </div>

                <div className="flex items-center pr-3">
                  <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CamaraProposicoes;
