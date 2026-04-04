import { useNavigate } from "react-router-dom";
import { Library, Video, Target, BookOpen, Gavel, Info, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DotPattern } from "@/components/ui/dot-pattern";

const GOLD = "hsl(40, 80%, 55%)";

const OABFuncoes = () => {
  const navigate = useNavigate();
  const funcoes = [
    { id: "o-que-estudar-oab", title: "O que estudar para OAB", description: "Guia completo de conteúdos", icon: BookOpen, route: "/oab/o-que-estudar" },
    { id: "biblioteca-oab", title: "Biblioteca OAB", description: "Acesse materiais de estudo para OAB", icon: Library, route: "/biblioteca-oab" },
    { id: "questoes-oab", title: "Questões OAB", description: "Resolva questões de provas anteriores", icon: Gavel, route: "/simulados/personalizado" },
    { id: "simulados-oab", title: "Simulados OAB", description: "Pratique com simulados completos", icon: Target, route: "/simulados/exames" },
    { id: "videoaulas-oab", title: "Videoaulas Segunda Fase da OAB", description: "Assista aulas preparatórias para 2ª fase", icon: Video, route: "/videoaulas-oab" },
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, hsl(345, 65%, 28%), hsl(350, 40%, 12%))' }}>
      <DotPattern className="opacity-[0.15]" />

      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6 pb-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(40, 60%, 85%)' }}>
              Estudos para a OAB
            </h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(40, 30%, 70%)' }}>
              Todas as ferramentas para sua aprovação
            </p>
          </div>
        </div>

        {/* Lista de Funções */}
        <div className="flex flex-col gap-3">
          {funcoes.map(funcao => {
            const Icon = funcao.icon;
            return (
              <button
                key={funcao.id}
                onClick={() => navigate(funcao.route)}
                className="rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-2xl flex items-center gap-4 relative overflow-hidden shadow-xl min-h-[88px] backdrop-blur-sm"
                style={{ background: 'linear-gradient(135deg, hsl(345, 65%, 30%), hsl(350, 40%, 18%))', border: '1px solid hsla(40, 60%, 50%, 0.15)' }}
              >
                <div className="rounded-lg p-3 relative z-10 shadow-lg flex-shrink-0" style={{ background: 'hsla(40, 80%, 55%, 0.15)' }}>
                  <Icon className="w-6 h-6" style={{ color: GOLD }} />
                </div>
                <div className="flex-1 relative z-10 min-w-0">
                  <h3 className="text-base font-bold mb-1 line-clamp-1" style={{ color: 'hsl(40, 60%, 90%)' }}>
                    {funcao.title}
                  </h3>
                  <p className="text-sm line-clamp-1" style={{ color: 'hsl(40, 20%, 60%)' }}>
                    {funcao.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Seção Sobre */}
        <Card className="p-6 backdrop-blur-sm" style={{ background: 'hsla(345, 30%, 18%, 0.7)', borderColor: 'hsla(40, 60%, 50%, 0.12)' }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: 'hsla(40, 80%, 55%, 0.12)' }}>
              <Info className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'hsl(40, 60%, 90%)' }}>Sobre esta área</h2>
          </div>
          
          <div className="space-y-3 text-sm" style={{ color: 'hsl(40, 20%, 65%)' }}>
            <p>
              Esta seção reúne <strong style={{ color: 'hsl(40, 60%, 85%)' }}>todas as ferramentas necessárias</strong> para você se preparar para o Exame da Ordem dos Advogados do Brasil (OAB).
            </p>
            <p>
              A aprovação na OAB é fundamental para exercer a advocacia no Brasil. Aqui você encontra materiais de estudo, videoaulas específicas, simulados completos, guias de conteúdo e banco de questões de provas anteriores.
            </p>
            <p>
              Utilize todas as ferramentas disponíveis para <strong style={{ color: 'hsl(40, 60%, 85%)' }}>maximizar suas chances de aprovação</strong> e conquistar sua carteira da OAB!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OABFuncoes;
