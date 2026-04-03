import { useNavigate, useSearchParams } from "react-router-dom";
import { Target, Play, ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";

const QuestoesEscolhaModo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const { areas } = useQuestoesAreasCache();

  const areaData = areas?.find((a) => a.area === area);
  const totalQuestoes = areaData?.totalQuestoes || 0;

  const modos = [
    {
      id: "todas",
      titulo: "Responder Todas",
      descricao: "Responda todas as questões desta área de uma vez",
      icone: Play,
      cor: "from-emerald-500 to-emerald-700",
      bordaCor: "border-emerald-500/30",
      glowColor: "rgb(16, 185, 129)",
      detalhes: [
        `${totalQuestoes} questões disponíveis`,
        "Ordem aleatória para variar a prática",
        "Ideal para revisão completa",
        "Acompanhe seu desempenho geral",
      ],
      onClick: () =>
        navigate(
          `/ferramentas/questoes/resolver?area=${encodeURIComponent(area)}&modo=todas`
        ),
    },
    {
      id: "personalizar",
      titulo: "Personalizar",
      descricao: "Escolha temas específicos para praticar",
      icone: ListChecks,
      cor: "from-blue-500 to-blue-700",
      bordaCor: "border-blue-500/30",
      glowColor: "rgb(59, 130, 246)",
      detalhes: [
        `${areaData?.totalTemas || 0} temas disponíveis`,
        "Selecione um ou mais temas",
        "Foque nas suas dificuldades",
        "Estudo direcionado e eficiente",
      ],
      onClick: () =>
        navigate(
          `/ferramentas/questoes/temas?area=${encodeURIComponent(area)}`
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <StandardPageHeader
        title={area}
        subtitle={`${totalQuestoes} questões`}
        backPath="/ferramentas/questoes"
        icon={
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
        }
      />

      <div className="px-4 pt-6">
        <h2 className="text-lg font-bold text-foreground mb-1">
          Como deseja praticar?
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Escolha o modo que melhor se encaixa no seu estudo
        </p>

        <div className="grid gap-5">
          {modos.map((modo) => (
            <Card
              key={modo.id}
              className={`cursor-pointer hover:scale-[1.02] transition-all duration-300 bg-card ${modo.bordaCor} border-2 group relative overflow-hidden`}
              onClick={modo.onClick}
            >
              {/* Brilho no topo */}
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${modo.glowColor}, transparent)`,
                  boxShadow: `0 0 20px ${modo.glowColor}`,
                }}
              />

              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${modo.cor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <modo.icone className="w-7 h-7 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {modo.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {modo.descricao}
                    </p>

                    <div className="space-y-1.5">
                      {modo.detalhes.map((detalhe, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-emerald-500 text-xs">✓</span>
                          <span className="text-xs text-muted-foreground">
                            {detalhe}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestoesEscolhaModo;
