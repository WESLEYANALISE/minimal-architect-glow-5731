import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, ArrowRight, Trophy, Clock, BarChart3 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { useDeviceType } from "@/hooks/use-device-type";

const Simulados = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();

  const opcoes = [
    {
      id: "exames",
      titulo: "Exames Completos da OAB",
      descricao: "Pratique com exames reais organizados por edição",
      icon: Gavel,
      path: "/simulados/exames",
      gradient: "from-[hsl(260,80%,60%)] to-[hsl(240,90%,55%)]",
    },
    {
      id: "personalizado",
      titulo: "Simulado Personalizado",
      descricao: "Escolha áreas específicas e crie seu simulado",
      icon: Gavel,
      path: "/simulados/personalizado",
      gradient: "from-[hsl(320,75%,55%)] to-[hsl(280,80%,60%)]",
    },
  ];

  // ─── DESKTOP ───
  if (isDesktop) {
    return (
      <div className="flex" style={{ height: 'calc(100vh - 3.5rem)' }}>
        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-1">Simulados OAB</h1>
              <p className="text-muted-foreground">Escolha o tipo de simulado que deseja realizar</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {opcoes.map((opcao) => {
                const Icon = opcao.icon;
                return (
                  <Card
                    key={opcao.id}
                    className="cursor-pointer hover:scale-[1.02] transition-all bg-card/50 backdrop-blur-sm border-border/30 hover:border-primary/30 overflow-hidden group"
                    onClick={() => navigate(opcao.path)}
                  >
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                      <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${opcao.gradient}`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground mb-1">{opcao.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{opcao.descricao}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar direita: Dicas */}
        <div className="w-[280px] xl:w-[320px] flex-shrink-0 border-l border-border/30 bg-card/20 overflow-y-auto p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Dicas de Estudo</h3>
          <div className="space-y-3">
            {[
              { icon: Clock, label: "Cronometre seu tempo", desc: "80 questões em 5 horas" },
              { icon: BarChart3, label: "Analise seus erros", desc: "Foque nas áreas fracas" },
              { icon: Trophy, label: "Meta: 60%", desc: "40 de 80 questões para aprovação" },
            ].map((tip) => (
              <div key={tip.label} className="flex items-start gap-3 p-3 rounded-xl bg-card/50 border border-border/30">
                <tip.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{tip.label}</p>
                  <p className="text-xs text-muted-foreground">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── MOBILE ───
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-blue-950/20 to-neutral-950 pb-24">
      <PageHero
        title="Simulados OAB"
        subtitle="Escolha o tipo de simulado que deseja realizar"
        icon={Gavel}
        iconGradient="from-blue-500/20 to-blue-600/10"
        iconColor="text-blue-400"
        lineColor="via-blue-500"
        pageKey="simulados"
        showGenerateButton={true}
      />

      <div className="px-3 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {opcoes.map((opcao) => {
            const Icon = opcao.icon;
            return (
              <Card
                key={opcao.id}
                className="cursor-pointer hover:scale-[1.02] transition-all bg-card/50 backdrop-blur-sm border-white/10 hover:border-white/20 overflow-hidden group"
                onClick={() => navigate(opcao.path)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-3 min-h-[140px]">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${opcao.gradient}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-white mb-1">{opcao.titulo}</h3>
                    <p className="text-xs text-neutral-400">{opcao.descricao}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Simulados;
