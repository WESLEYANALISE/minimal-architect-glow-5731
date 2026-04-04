import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, ArrowRight, Trophy, Clock, BarChart3, Crown } from "lucide-react";
import { useDeviceType } from "@/hooks/use-device-type";
import { DotPattern } from "@/components/ui/dot-pattern";

const GOLD = "hsl(40, 80%, 55%)";

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
    },
    {
      id: "personalizado",
      titulo: "Simulado Personalizado",
      descricao: "Escolha áreas específicas e crie seu simulado",
      icon: Gavel,
      path: "/simulados/personalizado",
    },
  ];

  // ─── DESKTOP ───
  if (isDesktop) {
    return (
      <div className="flex" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center gap-3">
              <Crown className="w-7 h-7" style={{ color: GOLD }} />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Simulados OAB</h1>
                <p className="text-muted-foreground">Escolha o tipo de simulado que deseja realizar</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {opcoes.map((opcao) => {
                const Icon = opcao.icon;
                return (
                  <Card
                    key={opcao.id}
                    className="cursor-pointer hover:scale-[1.02] transition-all bg-card/50 backdrop-blur-sm overflow-hidden group"
                    style={{ borderColor: 'hsla(40, 60%, 50%, 0.12)' }}
                    onClick={() => navigate(opcao.path)}
                  >
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(345, 65%, 30%), hsl(350, 40%, 20%))' }}>
                        <Icon className="w-8 h-8" style={{ color: GOLD }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground mb-1">{opcao.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{opcao.descricao}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-all" style={{ color: GOLD }} />
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
              <div key={tip.label} className="flex items-start gap-3 p-3 rounded-xl bg-card/50" style={{ borderColor: 'hsla(40, 60%, 50%, 0.12)', borderWidth: 1 }}>
                <tip.icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GOLD }} />
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
    <div className="min-h-screen relative overflow-hidden pb-24" style={{ background: 'linear-gradient(to bottom, hsl(345, 65%, 28%), hsl(350, 40%, 12%))' }}>
      <DotPattern className="opacity-[0.15]" />

      <div className="relative z-10 px-4 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-6 h-6" style={{ color: GOLD }} />
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(40, 60%, 85%)' }}>
            Simulados OAB
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'hsl(40, 30%, 70%)' }}>
          Escolha o tipo de simulado que deseja realizar
        </p>
      </div>

      <div className="relative z-10 px-4">
        <div className="grid grid-cols-2 gap-4">
          {opcoes.map((opcao) => {
            const Icon = opcao.icon;
            return (
              <Card
                key={opcao.id}
                className="cursor-pointer hover:scale-[1.02] transition-all backdrop-blur-sm overflow-hidden group"
                style={{ background: 'hsla(345, 30%, 18%, 0.7)', borderColor: 'hsla(40, 60%, 50%, 0.15)' }}
                onClick={() => navigate(opcao.path)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-3 min-h-[140px]">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(345, 65%, 30%), hsl(350, 40%, 20%))' }}>
                    <Icon className="w-6 h-6" style={{ color: GOLD }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1" style={{ color: 'hsl(40, 60%, 90%)' }}>{opcao.titulo}</h3>
                    <p className="text-xs" style={{ color: 'hsl(40, 20%, 60%)' }}>{opcao.descricao}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-all" style={{ color: GOLD }} />
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
