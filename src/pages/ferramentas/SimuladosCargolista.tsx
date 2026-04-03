import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import logoOab from "@/assets/logo-oab.webp";
import bandeiraPiaui from "@/assets/bandeira-piaui.png";
import bandeiraSaoPaulo from "@/assets/bandeira-sao-paulo.png";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CargoCarousel from "@/components/simulados/CargoCarousel";
import CargoRaioX from "@/components/simulados/CargoRaioX";
import CargoNoticias from "@/components/simulados/CargoNoticias";
import CargoEstudar from "@/components/simulados/CargoEstudar";
import CargoSobre from "@/components/simulados/CargoSobre";
import SimuladoDrawer from "@/components/simulados/SimuladoDrawer";

const BANDEIRAS_ESTADO: Record<string, string> = {
  "piauí": bandeiraPiaui,
  "são paulo": bandeiraSaoPaulo,
};

function getFlagUrl(estado: string | null): string | null {
  if (!estado) return null;
  const key = estado.toLowerCase().trim();
  return BANDEIRAS_ESTADO[key] || null;
}

interface SimuladoItem {
  id: string;
  tipo: "escrevente-fixo" | "dinamico" | "oab-fixo";
  nome: string;
  ano: number | null;
  banca: string | null;
  totalQuestoes: number;
  path: string;
  estado: string | null;
}

const SimuladosCargoLista = () => {
  const navigate = useNavigate();
  const { cargo } = useParams<{ cargo: string }>();
  const cargoDecoded = decodeURIComponent(cargo || "");
  const isEscrevente = cargoDecoded.toLowerCase().includes("escrevente");
  const isOAB = cargoDecoded.toLowerCase().includes("oab");
  const [selectedSimulado, setSelectedSimulado] = useState<SimuladoItem | null>(null);

  const { data: simulados, isLoading } = useQuery({
    queryKey: ["simulados-por-cargo", cargoDecoded],
    queryFn: async () => {
      const items: SimuladoItem[] = [];

      // OAB from fixed table
      if (isOAB) {
        const { data: oabData } = await supabase
          .from("SIMULADO-OAB" as any)
          .select("Exame, Ano, Banca");

        if (oabData) {
          const porExame: Record<string, { exame: string; ano: number; banca: string; total: number }> = {};
          (oabData as any[]).forEach((q: any) => {
            const key = `${q.Exame}-${q.Ano}`;
            if (!porExame[key]) {
              porExame[key] = { exame: q.Exame, ano: q.Ano, banca: q.Banca || "FGV", total: 0 };
            }
            porExame[key].total++;
          });

          for (const info of Object.values(porExame).sort((a, b) => b.ano - a.ano)) {
            items.push({
              id: `oab-${info.exame}-${info.ano}`,
              tipo: "oab-fixo",
              nome: `${info.exame} Exame`,
              ano: info.ano,
              banca: info.banca,
              totalQuestoes: info.total,
              path: `/simulados/realizar?exame=${encodeURIComponent(info.exame)}&ano=${info.ano}`,
              estado: "Nacional",
            });
          }
        }
        return items;
      }

      if (isEscrevente) {
        const { data: escreventeData } = await supabase
          .from("SIMULADO-ESCREVENTE" as any)
          .select("Ano, Banca, Questao");

        if (escreventeData) {
          const porAno: Record<number, { ano: number; banca: string; total: number }> = {};
          (escreventeData as any[]).forEach((q: any) => {
            if (!porAno[q.Ano]) {
              porAno[q.Ano] = { ano: q.Ano, banca: q.Banca || "VUNESP", total: 0 };
            }
            porAno[q.Ano].total++;
          });

          for (const info of Object.values(porAno).sort((a, b) => b.ano - a.ano)) {
            items.push({
              id: `escrevente-${info.ano}`,
              tipo: "escrevente-fixo",
              nome: `Prova ${info.ano}`,
              ano: info.ano,
              banca: info.banca,
              totalQuestoes: info.total,
              path: `/ferramentas/simulados/escrevente/${info.ano}/resolver`,
              estado: "São Paulo",
            });
          }
        }
      }

      const { data: dinamicos, error } = await supabase
        .from("simulados_concursos")
        .select("*")
        .eq("status", "pronto")
        .order("ano", { ascending: false });

      if (error) throw error;

      for (const s of dinamicos || []) {
        const sCargo = (s.cargo || "").toLowerCase();
        const targetCargo = cargoDecoded.toLowerCase();

        if (
          sCargo === targetCargo ||
          sCargo.includes(targetCargo) ||
          targetCargo.includes(sCargo)
        ) {
          if (isEscrevente && items.some((it) => it.ano === s.ano && it.tipo === "escrevente-fixo")) {
            continue;
          }

          items.push({
            id: s.id,
            tipo: "dinamico",
            nome: `Prova ${s.ano || ""}`,
            ano: s.ano,
            banca: s.banca,
            totalQuestoes: s.total_questoes || 0,
            path: `/ferramentas/simulados/concurso/${s.id}/resolver`,
            estado: (s as any).estado || null,
          });
        }
      }

      return items;
    },
    staleTime: 1000 * 60 * 30,
  });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-background to-background pointer-events-none" />

      <div className="flex-1 px-4 md:px-6 py-5 md:py-8 space-y-4 relative">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-lg font-bold text-foreground leading-tight">{cargoDecoded}</h1>
        </div>

        {/* Carousel */}
        <CargoCarousel cargo={cargoDecoded} />

        {/* Tabs */}
        <Tabs defaultValue="simulados" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="simulados" className="text-xs">Simulados</TabsTrigger>
            <TabsTrigger value="estudar" className="text-xs">Estudar</TabsTrigger>
            <TabsTrigger value="raio-x" className="text-xs">Raio-X</TabsTrigger>
            <TabsTrigger value="sobre" className="text-xs">Sobre</TabsTrigger>
          </TabsList>

          <TabsContent value="simulados" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : !simulados?.length ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Nenhum simulado encontrado para este cargo.
              </p>
            ) : (
              <div className="space-y-2.5 animate-fade-in">
                {simulados.map((s) => (
                  <Card
                    key={s.id}
                    className="cursor-pointer hover:scale-[1.01] hover:shadow-md transition-all border-l-4 border-l-amber-500/60 border-border/40 overflow-hidden"
                    onClick={() => setSelectedSimulado(s)}
                  >
                    <CardContent className="p-0 flex items-stretch">
                      {/* State flag */}
                      {(() => {
                        const isOabItem = s.tipo === "oab-fixo";
                        const flagUrl = isOabItem ? null : getFlagUrl(s.estado);
                        return (flagUrl || isOabItem) ? (
                          <div className="w-16 flex-shrink-0 flex items-center justify-center bg-muted/30 p-2">
                            <img src={isOabItem ? logoOab : flagUrl!} alt={s.estado || ""} className="w-10 h-10 object-contain rounded" />
                          </div>
                        ) : (
                          <div className="w-2 flex-shrink-0 bg-amber-500/60" />
                        );
                      })()}
                      <div className="flex-1 p-3 flex items-center gap-3 min-w-0">
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-bold text-amber-400">{s.ano || "—"}</span>
                            <span className="text-sm text-foreground truncate">{s.tipo === "oab-fixo" ? s.nome : cargoDecoded}</span>
                          </div>
                          {s.banca && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Building2 className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{s.banca}</span>
                            </div>
                          )}
                          {s.estado && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <MapPin className="w-3 h-3 flex-shrink-0 text-amber-400/70" />
                              <span className="text-amber-400/70 font-medium">{s.estado}</span>
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="estudar" className="mt-4">
            <CargoEstudar cargo={cargoDecoded} />
          </TabsContent>

          <TabsContent value="raio-x" className="mt-4">
            <CargoRaioX cargo={cargoDecoded} isEscrevente={isEscrevente} isOAB={isOAB} />
          </TabsContent>

          <TabsContent value="sobre" className="mt-4">
            <CargoSobre cargo={cargoDecoded} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Drawer de detalhes */}
      {selectedSimulado && (
        <SimuladoDrawer
          isOpen={!!selectedSimulado}
          onClose={() => setSelectedSimulado(null)}
          simuladoId={selectedSimulado.id}
          tipo={selectedSimulado.tipo}
          cargo={cargoDecoded}
          ano={selectedSimulado.ano}
          banca={selectedSimulado.banca}
          totalQuestoes={selectedSimulado.totalQuestoes}
          path={selectedSimulado.path}
          estado={selectedSimulado.estado}
        />
      )}
    </div>
  );
};

export default SimuladosCargoLista;
