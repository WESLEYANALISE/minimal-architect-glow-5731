import { useNavigate } from "react-router-dom";
import { ClipboardList, ChevronRight, FileQuestion, Gavel, Trophy, Clock, BarChart3, BookOpen, Target, TrendingUp, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimuladoFreeLimit } from "@/hooks/useSimuladoFreeLimit";
import { SimuladoFreeConfirmDialog } from "@/components/simulados/SimuladoFreeConfirmDialog";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useDeviceType } from "@/hooks/use-device-type";
import capaEscrevente from "@/assets/capa-escrevente.webp";
import capaJuizSubstituto from "@/assets/capa-juiz-substituto.webp";
import capaAgentePF from "@/assets/capa-agente-pf.webp";
import capaDelegado from "@/assets/capa-delegado-policia.webp";
import capaOab from "@/assets/capa-oab-simulado.webp";

const CAPAS_CARGO: Record<string, string> = {
  "escrevente técnico judiciário": capaEscrevente,
  "juiz(a) substituto(a)": capaJuizSubstituto,
  "juiz substituto": capaJuizSubstituto,
  "agente de polícia federal": capaAgentePF,
  "delegado de polícia": capaDelegado,
};

const SALARIOS_CARGO: Record<string, string> = {
  "escrevente técnico judiciário": "R$ 6.043",
  "juiz(a) substituto(a)": "R$ 32.350",
  "juiz substituto": "R$ 32.350",
  "agente de polícia federal": "R$ 14.710",
  "delegado de polícia": "R$ 26.838",
};

function matchCargo<T>(cargo: string, map: Record<string, T>): T | null {
  const key = cargo.toLowerCase().trim();
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k) || k.includes(key)) return v as T;
  }
  return null;
}

interface CargoGroup {
  cargo: string;
  totalSimulados: number;
  totalQuestoes: number;
  capa: string | null;
  salario: string | null;
  route?: string;
}

const SimuladosHub = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const { isLocked, handleSimuladoClick, showConfirmation, confirmAndStart, cancelConfirmation } = useSimuladoFreeLimit();

  const { data: cargos, isLoading } = useQuery({
    queryKey: ["simulados-cargos-hub"],
    queryFn: async () => {
      const { data: dinamicos, error } = await supabase
        .from("simulados_concursos")
        .select("id, cargo, banca, total_questoes, status, salario_inicial")
        .eq("status", "pronto")
        .order("cargo");
      if (error) throw error;

      const { data: oabData, error: oabError } = await supabase
        .from("SIMULADO-OAB" as any)
        .select("Exame, Ano");

      const { data: escreventeData } = await supabase
        .from("SIMULADO-ESCREVENTE" as any)
        .select("Ano, Questao");

      const groups: CargoGroup[] = [];

      if (oabData && (oabData as any[]).length > 0) {
        const exames = new Set<string>();
        (oabData as any[]).forEach((q: any) => { if (q.Exame) exames.add(q.Exame); });
        groups.push({
          cargo: "OAB - Exame da Ordem dos Advogados",
          totalSimulados: exames.size,
          totalQuestoes: (oabData as any[]).length,
          capa: capaOab,
          salario: "xxx.xxx,xx",
          route: `/ferramentas/simulados/cargo/${encodeURIComponent("OAB - Exame da Ordem dos Advogados")}`,
        });
      }

      if (escreventeData && (escreventeData as any[]).length > 0) {
        const anos = new Set<number>();
        (escreventeData as any[]).forEach((q: any) => anos.add(q.Ano));
        const key = "Escrevente Técnico Judiciário";
        groups.push({
          cargo: key,
          totalSimulados: anos.size,
          totalQuestoes: (escreventeData as any[]).length,
          capa: matchCargo(key, CAPAS_CARGO),
          salario: matchCargo(key, SALARIOS_CARGO),
        });
      }

      const dynamicGroups = new Map<string, CargoGroup>();
      for (const s of dinamicos || []) {
        const cargo = s.cargo || "Outros";
        if (cargo.toLowerCase().includes("escrevente")) {
          const escGrp = groups.find(g => g.cargo.toLowerCase().includes("escrevente"));
          if (escGrp) {
            escGrp.totalSimulados++;
            escGrp.totalQuestoes += s.total_questoes || 0;
          }
          continue;
        }
        const existing = dynamicGroups.get(cargo);
        if (existing) {
          existing.totalSimulados++;
          existing.totalQuestoes += s.total_questoes || 0;
        } else {
          const salarioDB = s.salario_inicial
            ? `R$ ${Number(s.salario_inicial).toLocaleString("pt-BR")}`
            : matchCargo(cargo, SALARIOS_CARGO);
          dynamicGroups.set(cargo, {
            cargo,
            totalSimulados: 1,
            totalQuestoes: s.total_questoes || 0,
            capa: matchCargo(cargo, CAPAS_CARGO),
            salario: salarioDB,
          });
        }
      }

      groups.push(...Array.from(dynamicGroups.values()));

      const ORDEM_CARGO: string[] = ["oab", "juiz", "delegado", "agente", "escrevente"];
      groups.sort((a, b) => {
        const aKey = a.cargo.toLowerCase();
        const bKey = b.cargo.toLowerCase();
        const aIdx = ORDEM_CARGO.findIndex(k => aKey.includes(k));
        const bIdx = ORDEM_CARGO.findIndex(k => bKey.includes(k));
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });

      return groups;
    },
    staleTime: 1000 * 60 * 30,
  });

  const totalProvas = cargos?.reduce((s, g) => s + g.totalSimulados, 0) ?? 0;
  const totalQuestoes = cargos?.reduce((s, g) => s + g.totalQuestoes, 0) ?? 0;
  const totalCargos = cargos?.length ?? 0;

  const handleCargoClick = (group: CargoGroup) => {
    const route = group.route || `/ferramentas/simulados/cargo/${encodeURIComponent(group.cargo)}`;
    const navFn = () => navigate(route);
    const result = handleSimuladoClick(navFn);
    if (result === 'blocked') {
      navigate('/assinatura');
    }
  };

  const renderCargoCard = (group: CargoGroup, index: number) => (
    <button
      key={group.cargo}
      onClick={() => handleCargoClick(group)}
      className={`w-full flex items-stretch bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/40 transition-all active:scale-[0.98] text-left group animate-fade-in relative ${isDesktop ? 'h-[130px]' : 'h-[120px]'}`}
      style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'backwards' }}
    >
      {isLocked && <PremiumBadge size="sm" position="top-right" />}
      <div className={`relative flex-shrink-0 overflow-hidden ${isDesktop ? 'w-[140px]' : 'w-[110px]'}`}>
        {group.capa ? (
          <img
            src={group.capa}
            alt={group.cargo}
            className="absolute inset-0 w-full h-full object-cover brightness-110 saturate-[1.1] group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-700/40 to-amber-900/60 flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-amber-400/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/10" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.12] to-transparent skew-x-[-20deg]"
            style={{ animation: `shinePratique 4s ease-in-out infinite ${index * 0.7 + 1}s` }}
          />
        </div>
      </div>
      <div className="flex-1 py-3 px-3 flex flex-col justify-between min-w-0">
        <div>
          <h3 className={`font-bold text-foreground leading-tight line-clamp-2 ${isDesktop ? 'text-base' : 'text-sm'}`}>
            {group.cargo}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
            <span>{group.totalSimulados} {group.totalSimulados === 1 ? "prova" : "provas"}</span>
            <span className="flex items-center gap-0.5">
              <FileQuestion className="w-3 h-3" />
              {group.totalQuestoes} questões
            </span>
          </div>
        </div>
        {group.salario && (
          <div className="flex items-center gap-1.5 mt-auto bg-emerald-500/10 rounded-lg px-2 py-1 w-fit">
            <span className="text-[10px] font-semibold text-emerald-400/70 uppercase tracking-wide">Salário</span>
            <span className="text-xs font-bold text-emerald-400">{group.salario}</span>
          </div>
        )}
      </div>
      <div className="flex items-center pr-3">
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </div>
    </button>
  );

  const cargosList = isLoading ? (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[120px] w-full rounded-2xl" />
      ))}
    </div>
  ) : !cargos?.length ? (
    <p className="text-sm text-muted-foreground text-center py-10">
      Nenhum simulado disponível ainda.
    </p>
  ) : (
    <div className="space-y-3 animate-fade-in">
      {cargos.map((group, index) => renderCargoCard(group, index))}
    </div>
  );

  // ─── DESKTOP ───
  if (isDesktop) {
    return (
      <div className="h-[calc(100vh-4.5rem)] grid grid-cols-[260px_1fr_260px]">
        {/* Sidebar Esquerda - Estatísticas */}
        <aside className="border-r border-border/30 bg-card/20 overflow-y-auto p-5 space-y-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Estatísticas</h3>
          
          <div className="space-y-3">
            {[
              { icon: Gavel, label: "Cargos disponíveis", value: totalCargos },
              { icon: BookOpen, label: "Total de provas", value: totalProvas },
              { icon: FileQuestion, label: "Questões no banco", value: totalQuestoes },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border/30">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{stat.value.toLocaleString('pt-BR')}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/30 pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Meta de aprovação</h3>
            <div className="space-y-2">
              {[
                { icon: Target, label: "OAB", desc: "40/80 questões (50%)" },
                { icon: Target, label: "Escrevente TJ-SP", desc: "50/80 questões (62,5%)" },
                { icon: Target, label: "Polícia Federal", desc: "Varia por edital" },
              ].map((meta) => (
                <div key={meta.label} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <meta.icon className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{meta.label}</p>
                    <p className="text-[10px] text-muted-foreground">{meta.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Centro - Lista de Cargos */}
        <main className="overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6 animate-fade-in">
              <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-2.5 ring-1 ring-amber-500/30">
                <ClipboardList className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground leading-tight">Simulados</h1>
                <p className="text-muted-foreground text-sm">Provas de concursos públicos</p>
              </div>
            </div>
            {cargosList}
          </div>
        </main>

        {/* Sidebar Direita - Dicas & Info */}
        <aside className="border-l border-border/30 bg-card/20 overflow-y-auto p-5 space-y-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Como funciona</h3>
          
          <div className="space-y-3">
            {[
              { icon: ClipboardList, step: "1", label: "Escolha o cargo", desc: "Selecione o concurso desejado" },
              { icon: BookOpen, step: "2", label: "Selecione a prova", desc: "Escolha edição e ano" },
              { icon: Clock, step: "3", label: "Resolva no tempo", desc: "Simule as condições reais" },
              { icon: BarChart3, step: "4", label: "Veja o resultado", desc: "Analise seu desempenho" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-card/60 border border-border/30">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{item.step}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/30 pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dicas de Estudo</h3>
            <div className="space-y-2">
              {[
                { icon: Clock, label: "Cronometre seu tempo", desc: "Treine dentro do tempo real da prova" },
                { icon: TrendingUp, label: "Refaça provas erradas", desc: "Foque nas questões que errou" },
                { icon: Trophy, label: "Consistência", desc: "Faça pelo menos 1 simulado por semana" },
                { icon: Info, label: "Revise gabaritos", desc: "Leia os comentários das questões" },
              ].map((tip) => (
                <div key={tip.label} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <tip.icon className="w-3.5 h-3.5 mt-0.5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{tip.label}</p>
                    <p className="text-[10px] text-muted-foreground">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <SimuladoFreeConfirmDialog
          open={showConfirmation}
          onConfirm={confirmAndStart}
          onCancel={cancelConfirmation}
        />
      </div>
    );
  }

  // ─── MOBILE ───
  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-background to-background pointer-events-none" />
      <div className="flex-1 px-4 py-5 space-y-5 relative">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-2 ring-1 ring-amber-500/30">
            <ClipboardList className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Simulados</h1>
            <p className="text-muted-foreground text-xs">Provas de concursos públicos</p>
          </div>
        </div>
        {cargosList}
      </div>
      <SimuladoFreeConfirmDialog
        open={showConfirmation}
        onConfirm={confirmAndStart}
        onCancel={cancelConfirmation}
      />
    </div>
  );
};

export default SimuladosHub;
