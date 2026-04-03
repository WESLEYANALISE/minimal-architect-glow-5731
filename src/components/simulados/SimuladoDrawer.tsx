import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Building2,
  MapPin,
  DollarSign,
  BookOpen,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileDown,
  X,
  RotateCcw,
} from "lucide-react";

import slideEscrevente1 from "@/assets/slide-escrevente-1.webp";
import slideJuiz1 from "@/assets/slide-juiz-1.webp";
import capaAgentePF from "@/assets/capa-agente-pf.webp";
import capaDelegado from "@/assets/capa-delegado-policia.webp";
import capaOabDrawer from "@/assets/capa-oab-drawer.webp";
import bandeiraPiaui from "@/assets/bandeira-piaui.png";
import bandeiraSaoPaulo from "@/assets/bandeira-sao-paulo.png";
const CAPAS: Record<string, { img: string; salario: string }> = {
  "escrevente técnico judiciário": { img: slideEscrevente1, salario: "R$ 6.043" },
  "juiz(a) substituto(a)": { img: slideJuiz1, salario: "R$ 33.689" },
  "juiz substituto": { img: slideJuiz1, salario: "R$ 33.689" },
  "agente de polícia federal": { img: capaAgentePF, salario: "R$ 14.710" },
  "delegado de polícia": { img: capaDelegado, salario: "R$ 26.838" },
  "oab": { img: capaOabDrawer, salario: "" },
};

function matchCapa(cargo: string) {
  const key = cargo.toLowerCase().trim();
  for (const [k, v] of Object.entries(CAPAS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

const BANDEIRAS_ESTADO: Record<string, string> = {
  "piauí": bandeiraPiaui,
  "são paulo": bandeiraSaoPaulo,
};

function getFlagUrl(estado: string | null): string | null {
  if (!estado) return null;
  return BANDEIRAS_ESTADO[estado.toLowerCase().trim()] || null;
}

const BAR_COLORS = [
  "hsl(45 93% 47%)", "hsl(199 89% 48%)", "hsl(142 76% 36%)",
  "hsl(346 77% 50%)", "hsl(262 83% 58%)", "hsl(25 95% 53%)",
  "hsl(173 80% 40%)", "hsl(328 73% 56%)", "hsl(210 70% 50%)", "hsl(0 70% 55%)",
];

interface SimuladoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  simuladoId: string;
  tipo: "escrevente-fixo" | "dinamico" | "oab-fixo";
  cargo: string;
  ano: number | null;
  banca: string | null;
  totalQuestoes: number;
  path: string;
  estado: string | null;
}

export default function SimuladoDrawer({
  isOpen, onClose, simuladoId, tipo, cargo, ano, banca, totalQuestoes, path, estado,
}: SimuladoDrawerProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("simulado");
  const [countdown, setCountdown] = useState<number | null>(null);
  const capaInfo = matchCapa(cargo);
  const flagUrl = getFlagUrl(estado);

  const resolveStartPath = useCallback((rawPath: string) => {
    if (!rawPath) return rawPath;
    if (rawPath.includes("/resolver") || rawPath.startsWith("/simulados/realizar")) return rawPath;

    if (
      /^\/ferramentas\/simulados\/escrevente\/\d+$/.test(rawPath) ||
      /^\/ferramentas\/simulados\/concurso\/[^/]+$/.test(rawPath) ||
      /^\/ferramentas\/simulados\/[^/]+$/.test(rawPath)
    ) {
      return `${rawPath}/resolver`;
    }

    return rawPath;
  }, []);

  // Check if user has saved progress for this simulado
  const savedProgressKey = `simulado-progress-${simuladoId}`;
  const hasSavedProgress = !!localStorage.getItem(savedProgressKey);

  const playCountdownBeep = useCallback((num: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(num === 0 ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => ctx.close(), 200);
    } catch {}
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(3);
  }, []);

  const startFromSaved = useCallback(() => {
    onClose();
    navigate(resolveStartPath(path));
  }, [onClose, navigate, path, resolveStartPath]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      playCountdownBeep(0);
      // Clear any saved progress when starting fresh
      localStorage.removeItem(savedProgressKey);
      onClose();
      navigate(resolveStartPath(path));
      return;
    }
    playCountdownBeep(countdown);
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate, onClose, path, playCountdownBeep, resolveStartPath, savedProgressKey]);

  // Fetch matérias for this specific simulado
  const { data: materias, isLoading: loadingMaterias } = useQuery({
    queryKey: ["simulado-materias", simuladoId, tipo],
    queryFn: async () => {
      const counts: Record<string, number> = {};

      if (tipo === "oab-fixo") {
        const parts = simuladoId.replace("oab-", "").split("-");
        const anoStr = parts[parts.length - 1];
        const exameStr = parts.slice(0, -1).join("-");
        const { data: questoes } = await supabase
          .from("SIMULADO-OAB" as any)
          .select("area")
          .eq("Exame", exameStr)
          .eq("Ano", parseInt(anoStr));
        if (questoes) {
          (questoes as any[]).forEach((q: any) => {
            const mat = (q.area || "Outros").trim();
            counts[mat] = (counts[mat] || 0) + 1;
          });
        }
      } else if (tipo === "escrevente-fixo") {
        const anoNum = ano;
        const { data: questoes } = await supabase
          .from("SIMULADO-ESCREVENTE" as any)
          .select("Materia")
          .eq("Ano", anoNum);
        if (questoes) {
          (questoes as any[]).forEach((q: any) => {
            const mat = (q.Materia || "Outros").trim();
            counts[mat] = (counts[mat] || 0) + 1;
          });
        }
      } else {
        const { data: questoes } = await supabase
          .from("simulados_questoes" as any)
          .select("materia")
          .eq("simulado_id", simuladoId);
        if (questoes) {
          (questoes as any[]).forEach((q: any) => {
            const mat = (q.materia || "Outros").trim();
            counts[mat] = (counts[mat] || 0) + 1;
          });
        }
      }

      return Object.entries(counts)
        .map(([materia, total]) => ({ materia, total }))
        .sort((a, b) => b.total - a.total);
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 30,
  });

  const totalFromMaterias = materias?.reduce((acc, m) => acc + m.total, 0) || totalQuestoes;
  const maxMateriaCount = materias?.[0]?.total || 1;

  return (
    <>
      {/* Countdown overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div
              key={countdown}
              className="w-32 h-32 rounded-full border-4 border-amber-500 flex items-center justify-center animate-scale-in"
            >
              <span className="text-6xl font-black text-amber-400">{countdown}</span>
            </div>
            <p className="text-sm text-muted-foreground animate-fade-in">Preparando simulado...</p>
          </div>
        </div>
      )}

    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[95vh] focus:outline-none">
        <div className="overflow-y-auto max-h-[92vh] min-h-[80vh] pb-6">
          {/* Banner compacto */}
          <div className="relative w-full h-36 overflow-hidden rounded-t-[10px]">
            {capaInfo ? (
              <img
                src={capaInfo.img}
                alt={cargo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-900/40 to-background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center border border-border/30 hover:bg-background/90 transition-colors"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            {/* Flag badge */}
            {flagUrl && (
              <div className="absolute top-3 right-3 w-9 h-9 rounded-lg overflow-hidden shadow-lg border border-border/30 bg-background/50 backdrop-blur-sm">
                <img src={flagUrl} alt={estado || ""} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Info overlay */}
            <div className="absolute bottom-3 left-4 right-4 space-y-1">
              <h3 className="text-sm font-bold text-foreground leading-tight drop-shadow-sm">
                {cargo}
              </h3>
              <div className="flex items-center gap-3 text-[11px]">
                {ano && (
                  <span className="font-bold text-amber-400">Prova {ano}</span>
                )}
                {banca && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Building2 className="w-3 h-3" /> {banca}
                  </span>
                )}
                {estado && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {estado}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Salary chip */}
          {capaInfo && capaInfo.salario && (
            <div className="flex items-center justify-center gap-1.5 py-2 animate-fade-in">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Salário inicial</span>
              <span className="text-sm font-bold text-emerald-400">{capaInfo.salario}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-10">
                <TabsTrigger value="simulado" className="text-xs gap-1 px-1">
                  <Play className="w-3 h-3" /> Simulado
                </TabsTrigger>
                <TabsTrigger value="prova-gabarito" className="text-xs gap-1 px-1">
                  <FileDown className="w-3 h-3" /> Prova
                </TabsTrigger>
                <TabsTrigger value="raio-x" className="text-xs gap-1 px-1">
                  <Target className="w-3 h-3" /> Raio-X
                </TabsTrigger>
                <TabsTrigger value="desempenho" className="text-xs gap-1 px-1">
                  <BarChart3 className="w-3 h-3" /> Stats
                </TabsTrigger>
              </TabsList>

              {/* Tab: Simulado */}
              <TabsContent value="simulado" className="mt-4 animate-fade-in space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-muted/40 border border-border/30 p-3 text-center space-y-1">
                    <BookOpen className="w-4 h-4 mx-auto text-amber-400" />
                    <p className="text-lg font-bold text-foreground">{totalQuestoes}</p>
                    <p className="text-[10px] text-muted-foreground">Questões</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 border border-border/30 p-3 text-center space-y-1">
                    <Building2 className="w-4 h-4 mx-auto text-blue-400" />
                    <p className="text-sm font-bold text-foreground truncate">{banca || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Banca</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 border border-border/30 p-3 text-center space-y-1">
                    <Clock className="w-4 h-4 mx-auto text-purple-400" />
                    <p className="text-lg font-bold text-foreground">{ano || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Ano</p>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-base font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-background rounded-xl shadow-lg"
                  onClick={startCountdown}
                  disabled={countdown !== null}
                >
                  <Play className="w-5 h-5" />
                  Iniciar Simulado
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-10 text-sm gap-2 rounded-xl border-border/50"
                  onClick={startFromSaved}
                  disabled={!hasSavedProgress}
                >
                  <RotateCcw className="w-4 h-4" />
                  Continuar de onde parei
                </Button>

                {/* Texto motivacional */}
                <div className="rounded-xl bg-muted/30 border border-border/20 p-4 space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    📝 Responda todas as <span className="font-semibold text-foreground">{totalQuestoes} questões</span> no seu ritmo. Ao finalizar, você receberá um relatório completo com seu aproveitamento por matéria, tempo de prova e comparativo com outros candidatos.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Dica: simule condições reais de prova para um resultado mais fiel.
                  </p>
                </div>
              </TabsContent>

              {/* Tab: Prova/Gabarito */}
              <TabsContent value="prova-gabarito" className="mt-4 animate-fade-in">
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Baixe a prova original e o gabarito oficial em PDF.
                  </p>

                  <div className="space-y-3">
                    <div className="rounded-xl bg-muted/40 border border-border/30 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <FileDown className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Prova</p>
                          <p className="text-[10px] text-muted-foreground">PDF da prova original</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground italic">Em breve</span>
                    </div>

                    <div className="rounded-xl bg-muted/40 border border-border/30 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <FileDown className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Gabarito</p>
                          <p className="text-[10px] text-muted-foreground">Gabarito oficial</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground italic">Em breve</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Raio-X */}
              <TabsContent value="raio-x" className="mt-4 animate-fade-in">
                {loadingMaterias ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-7 w-full rounded-lg" />
                    ))}
                  </div>
                ) : !materias?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Sem dados para Raio-X desta prova.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-foreground leading-relaxed">
                        <span className="font-semibold text-amber-400">{materias[0].materia}</span> é a matéria
                        mais cobrada, com{" "}
                        <span className="font-semibold text-amber-400">
                          {Math.round((materias[0].total / totalFromMaterias) * 100)}%
                        </span>{" "}
                        das questões.
                      </p>
                    </div>

                    {materias.map((m, i) => {
                      const pct = Math.round((m.total / totalFromMaterias) * 100);
                      return (
                        <div key={m.materia} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-7 text-right flex-shrink-0">
                            {pct}%
                          </span>
                          <div className="flex-1 h-5 rounded-md bg-muted/30 overflow-hidden relative">
                            <div
                              className="h-full rounded-md transition-all duration-700"
                              style={{
                                width: `${(m.total / maxMateriaCount) * 100}%`,
                                backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                                opacity: 0.85,
                              }}
                            />
                            <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-medium text-foreground drop-shadow-sm">
                              {m.materia}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground w-6 flex-shrink-0">
                            {m.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Meu Desempenho */}
              <TabsContent value="desempenho" className="mt-4 animate-fade-in">
                <DesempenhoTab simuladoId={simuladoId} tipo={tipo} ano={ano} totalQuestoes={totalQuestoes} path={path} onNavigate={() => { onClose(); navigate(path); }} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
    </>
  );
}

/* Subcomponent for Desempenho tab */
function DesempenhoTab({
  simuladoId, tipo, ano, totalQuestoes, path, onNavigate,
}: {
  simuladoId: string; tipo: string; ano: number | null; totalQuestoes: number; path: string; onNavigate: () => void;
}) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["simulado-desempenho", simuladoId],
    queryFn: async () => {
      // Check user auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (tipo === "escrevente-fixo") {
        const { data } = await supabase
          .from("simulado_resultados" as any)
          .select("*")
          .eq("user_id", user.id)
          .eq("ano", ano)
          .eq("tipo", "escrevente")
          .order("created_at", { ascending: false })
          .limit(1);
        return (data as any[])?.[0] || null;
      } else {
        const { data } = await supabase
          .from("simulado_resultados" as any)
          .select("*")
          .eq("user_id", user.id)
          .eq("simulado_id", simuladoId)
          .order("created_at", { ascending: false })
          .limit(1);
        return (data as any[])?.[0] || null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
          <BarChart3 className="w-8 h-8 text-muted-foreground/60" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Nenhuma tentativa ainda</p>
          <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
            Faça o simulado para ver suas estatísticas de desempenho aqui.
          </p>
        </div>
        <Button
          className="gap-2 bg-amber-500 hover:bg-amber-600 text-background rounded-xl"
          onClick={onNavigate}
        >
          <Play className="w-4 h-4" />
          Começar agora
        </Button>
      </div>
    );
  }

  const acertos = stats.acertos || 0;
  const erros = stats.erros || 0;
  const total = acertos + erros || totalQuestoes;
  const pct = total > 0 ? Math.round((acertos / total) * 100) : 0;
  const tempo = stats.tempo_minutos || stats.tempo_total_minutos;

  return (
    <div className="space-y-4">
      {/* Circular progress */}
      <div className="flex items-center justify-center py-2">
        <div className="relative w-24 h-24">
          <svg className="transform -rotate-90 w-24 h-24">
            <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted/40" />
            <circle
              cx="48" cy="48" r="38"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={2 * Math.PI * 38}
              strokeDashoffset={2 * Math.PI * 38 - (pct / 100) * 2 * Math.PI * 38}
              className={pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}>
              {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
          <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
          <p className="text-lg font-bold text-emerald-400">{acertos}</p>
          <p className="text-[10px] text-muted-foreground">Acertos</p>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
          <XCircle className="w-4 h-4 mx-auto text-red-400 mb-1" />
          <p className="text-lg font-bold text-red-400">{erros}</p>
          <p className="text-[10px] text-muted-foreground">Erros</p>
        </div>
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
          <Clock className="w-4 h-4 mx-auto text-blue-400 mb-1" />
          <p className="text-lg font-bold text-blue-400">{tempo ? `${tempo}m` : "—"}</p>
          <p className="text-[10px] text-muted-foreground">Tempo</p>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full gap-2 rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
        onClick={onNavigate}
      >
        <Play className="w-4 h-4" />
        Refazer simulado
      </Button>
    </div>
  );
}
