import { useState, useEffect, useMemo } from "react";
import { GraduationCap, Loader2, TrendingUp, TrendingDown, Calendar, Trophy, Target, BookOpen, ArrowRight, BarChart3, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFlashcardStats } from "@/hooks/useFlashcardStudyProgress";
import { getAreaHex } from "@/lib/flashcardsAreaColors";
import { Progress } from "@/components/ui/progress";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import draArabellaAvatar from "@/assets/dra-jurisia-avatar.webp";
import {
  RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip,
} from "recharts";

interface Props {
  onBack: () => void;
}

const getBarColor = (pct: number) => {
  if (pct >= 70) return "hsl(152 60% 42%)";
  if (pct >= 40) return "hsl(38 92% 50%)";
  return "hsl(0 65% 50%)";
};

type TabKey = "resumo" | "graficos" | "recomendacoes";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "resumo", label: "Resumo", icon: BookOpen },
  { key: "graficos", label: "Gráficos", icon: BarChart3 },
  { key: "recomendacoes", label: "Recomendações", icon: Lightbulb },
];

const tabVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

export const FlashcardsDiagnosticoPage = ({ onBack }: Props) => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useFlashcardStats();
  const [userName, setUserName] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("resumo");

  const areaStats = stats?.areaStats || [];
  const compreendi = stats?.compreendi || 0;
  const revisar = stats?.revisar || 0;
  const total = stats?.total || 0;
  const streak = stats?.streak || 0;
  const taxaGlobal = total > 0 ? Math.round((compreendi / total) * 100) : 0;

  const melhorArea = useMemo(() => {
    const filtered = areaStats.filter(a => a.total >= 3);
    return filtered.length > 0 ? filtered.reduce((best, a) => a.percentDominio > best.percentDominio ? a : best, filtered[0]) : null;
  }, [areaStats]);

  const piorArea = useMemo(() => {
    const filtered = areaStats.filter(a => a.total >= 3);
    return filtered.length > 0 ? filtered.reduce((worst, a) => a.percentDominio < worst.percentDominio ? a : worst, filtered[0]) : null;
  }, [areaStats]);

  const areasParaFocar = useMemo(() => {
    return areaStats
      .filter(a => a.total >= 3)
      .sort((a, b) => a.percentDominio - b.percentDominio)
      .slice(0, 3);
  }, [areaStats]);

  // Texto contextual da Dra. Arabella
  const arabellaIntro = useMemo(() => {
    if (total === 0) return "Comece a estudar flashcards para que eu possa analisar seu desempenho e dar recomendações personalizadas!";
    
    const parts: string[] = [];
    
    if (userName) {
      parts.push(`Olá, <b>${userName}</b>! Aqui está minha análise do seu progresso.`);
    } else {
      parts.push("Aqui está minha análise do seu progresso nos flashcards.");
    }

    if (melhorArea) {
      parts.push(`Você está mandando muito bem em <b>${melhorArea.area}</b> com <b>${melhorArea.percentDominio}%</b> de compreensão!`);
    }

    if (piorArea && piorArea.percentDominio < 50) {
      parts.push(`Recomendo focar em <b>${piorArea.area}</b>, onde sua taxa está em <b>${piorArea.percentDominio}%</b>. Com mais prática, você vai dominar essa área!`);
    }

    if (streak >= 3) {
      parts.push(`Parabéns pela sequência de <b>${streak} dias</b> consecutivos! Consistência é a chave do sucesso.`);
    } else if (streak === 0) {
      parts.push("Tente manter uma rotina diária de estudo para criar momentum!");
    }

    parts.push(`Sua taxa global de compreensão é de <b>${taxaGlobal}%</b> em <b>${total}</b> flashcards estudados.`);
    
    return parts.join(" ");
  }, [total, userName, melhorArea, piorArea, streak, taxaGlobal]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("nome").eq("id", user.id).single().then(({ data }) => {
      if (data?.nome) setUserName(data.nome.split(" ")[0]);
    });
  }, [user]);

  // Generate AI analysis when recomendacoes tab is first opened
  useEffect(() => {
    if (activeTab !== "recomendacoes" || !user || total === 0 || aiAnalysis || aiLoading) return;
    setAiLoading(true);

    const statsText = areaStats.map(a => `${a.area}: ${a.compreendi}/${a.total} (${a.percentDominio}%)`).join(", ");
    const prompt = `Analise o desempenho do aluno ${userName || "Aluno(a)"} nos flashcards jurídicos. Dados: ${total} flashcards estudados, ${compreendi} compreendidos (${taxaGlobal}%), ${revisar} para revisar, ${streak} dias consecutivos. Por área: ${statsText}. Dê feedback detalhado (~400 palavras) com pontos fortes, fracos e recomendações práticas de estudo. Use Markdown com **negrito** para termos-chave. Não use travessões (—).`;

    supabase.functions.invoke("gemini-chat", {
      body: { message: prompt },
    }).then(({ data, error }) => {
      const text = data?.resposta || data?.response;
      if (!error && text) {
        setAiAnalysis(text);
      } else {
        setAiAnalysis("Não foi possível gerar o diagnóstico no momento. Tente novamente.");
      }
      setAiLoading(false);
    });
  }, [activeTab, user, total, userName]);

  const radialData = [{ name: "Taxa", value: taxaGlobal, fill: "hsl(265 65% 55%)" }];
  const barData = areaStats.slice(0, 8).map(a => ({
    name: a.area.replace("Direito ", "D. ").replace("Direitos ", "D. "),
    pct: a.percentDominio,
    total: a.total,
  }));

  const stackedData = areaStats.slice(0, 6).map(a => ({
    name: a.area.replace("Direito ", "").replace("Direitos ", ""),
    compreendi: a.compreendi,
    revisar: a.revisar,
  }));

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 space-y-5">
      {/* Header with Arabella avatar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <img
          src={draArabellaAvatar}
          alt="Dra. Arabella"
          className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2"
          style={{ borderColor: "hsl(265 50% 45%)", boxShadow: "0 4px 16px hsla(265, 65%, 55%, 0.35)" }}
        />
        <div>
          <h1 className="text-lg font-bold text-foreground">{userName ? `Olá, ${userName}!` : "Seu Diagnóstico"}</h1>
          <p className="text-xs text-muted-foreground">Análise completa dos flashcards</p>
        </div>
      </motion.div>

      {/* Elegant Tab Toggle */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2.5" style={{ background: "hsl(0 0% 7% / 0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center bg-muted/20 rounded-xl p-1 border border-border/20">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="flashcard-diag-tab"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "linear-gradient(135deg, hsl(265 65% 50%), hsl(280 55% 40%))", boxShadow: "0 2px 8px hsla(265, 65%, 50%, 0.3)" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className={`relative z-10 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${isActive ? "text-white" : "text-muted-foreground"}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "resumo" && (
          <motion.div key="resumo" variants={tabVariants} initial="enter" animate="center" exit="exit" className="space-y-4">
            {/* Dra. Arabella intro with photo */}
            <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: "hsl(265 30% 18%)", border: "1px solid hsl(265 40% 30% / 0.5)" }}>
              <div className="flex gap-3">
                <img
                  src={draArabellaAvatar}
                  alt="Dra. Arabella"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2"
                  style={{ borderColor: "hsl(265 50% 50%)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-violet-300 mb-1">Dra. Arabella</p>
                  <p className="text-sm text-foreground/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: arabellaIntro }} />
                </div>
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Trophy, label: "Melhor Área", value: melhorArea ? melhorArea.area.replace("Direito ", "") : "—", sub: melhorArea ? `${melhorArea.percentDominio}%` : "", color: "text-emerald-400", bg: "hsla(152, 60%, 42%, 0.1)" },
                { icon: TrendingDown, label: "Precisa Melhorar", value: piorArea ? piorArea.area.replace("Direito ", "") : "—", sub: piorArea ? `${piorArea.percentDominio}%` : "", color: "text-red-400", bg: "hsla(0, 65%, 50%, 0.1)" },
                { icon: Calendar, label: "Dias Seguidos", value: String(streak), sub: "de estudo", color: "text-blue-400", bg: "hsla(220, 70%, 55%, 0.1)" },
                { icon: TrendingUp, label: "Total", value: total.toLocaleString("pt-BR"), sub: "flashcards", color: "text-amber-400", bg: "hsla(38, 92%, 50%, 0.1)" },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl p-3.5 relative overflow-hidden" style={{ background: "hsl(0 0% 15%)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at bottom right, ${card.bg}, transparent 70%)` }} />
                  <div className="relative">
                    <card.icon className={`w-4 h-4 ${card.color} mb-1.5`} />
                    <p className="text-[10px] text-muted-foreground">{card.label}</p>
                    <p className={`text-sm font-bold ${card.color} truncate`}>{card.value}</p>
                    {card.sub && <p className="text-[10px] text-muted-foreground">{card.sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick overview */}
            <div className="rounded-2xl p-4" style={{ background: "hsl(0 0% 15%)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
              <p className="text-sm font-semibold text-foreground mb-3">Visão Geral</p>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Compreendidos</span>
                  <span className="text-xs font-bold text-emerald-400">{compreendi}</span>
                </div>
                <Progress value={total > 0 ? (compreendi / total) * 100 : 0} className="h-2" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Para Revisar</span>
                  <span className="text-xs font-bold text-amber-400">{revisar}</span>
                </div>
                <Progress value={total > 0 ? (revisar / total) * 100 : 0} className="h-2" />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "graficos" && (
          <motion.div key="graficos" variants={tabVariants} initial="enter" animate="center" exit="exit" className="space-y-4">
            {/* Radial chart */}
            <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "hsl(0 0% 15%)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
              <p className="text-sm font-semibold text-foreground mb-3">📊 Taxa de Compreensão Global</p>
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="80%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                      <RadialBar background={{ fill: "hsl(0 0% 20%)" }} dataKey="value" cornerRadius={10} animationDuration={1200} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">{taxaGlobal}%</span>
                    <span className="text-[10px] text-muted-foreground">compreensão</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-3 text-xs text-muted-foreground">
                <span>✅ {compreendi} compreendi</span>
                <span>🔄 {revisar} revisar</span>
              </div>
            </div>

            {/* Bar chart */}
            {barData.length > 0 && (
              <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "hsl(0 0% 15%)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                <p className="text-sm font-semibold text-foreground mb-4">📈 Desempenho por Área</p>
                <ResponsiveContainer width="100%" height={barData.length * 40 + 20}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(0 0% 18%)", border: "1px solid hsl(0 0% 25%)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "hsl(0 0% 80%)" }} formatter={(value: number) => [`${value}%`, "Compreensão"]} />
                    <Bar dataKey="pct" radius={[0, 6, 6, 0]} animationDuration={1200} barSize={18}>
                      {barData.map((entry, index) => (
                        <Cell key={index} fill={getBarColor(entry.pct)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(152 60% 42%)" }} /> ≥70%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(38 92% 50%)" }} /> 40-69%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 65% 50%)" }} /> &lt;40%</span>
                </div>
              </div>
            )}

            {/* Stacked distribution */}
            {stackedData.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "hsl(0 0% 15%)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                <p className="text-sm font-semibold text-foreground mb-4">📋 Distribuição por Área</p>
                <div className="space-y-3">
                  {stackedData.map((item) => {
                    const itemTotal = item.compreendi + item.revisar;
                    const pctComp = itemTotal > 0 ? (item.compreendi / itemTotal) * 100 : 0;
                    return (
                      <div key={item.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-foreground truncate max-w-[60%]">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground">{item.compreendi}/{itemTotal}</span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: "hsl(0 0% 20%)" }}>
                          <div className="h-full rounded-l-full" style={{ width: `${pctComp}%`, background: "hsl(152 60% 42%)", transition: "width 0.6s ease-out" }} />
                          <div className="h-full rounded-r-full" style={{ width: `${100 - pctComp}%`, background: "hsl(38 80% 50% / 0.6)", transition: "width 0.6s ease-out" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(152 60% 42%)" }} /> Compreendi</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(38 80% 50% / 0.6)" }} /> Revisar</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "recomendacoes" && (
          <motion.div key="recomendacoes" variants={tabVariants} initial="enter" animate="center" exit="exit" className="space-y-4">
            {/* Áreas para focar */}
            {areasParaFocar.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <p className="text-sm font-semibold text-foreground">Áreas para Focar</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Suas áreas com menor taxa de compreensão. Foque nelas para melhorar!
                </p>
                {areasParaFocar.map((area, i) => {
                  const hex = getAreaHex(area.area);
                  return (
                    <div
                      key={area.area}
                      className="rounded-2xl p-4 relative overflow-hidden"
                      style={{
                        background: area.percentDominio < 30 ? "hsl(0 20% 16%)" : "hsl(38 20% 16%)",
                        border: `1px solid ${area.percentDominio < 30 ? "hsl(0 50% 42% / 0.3)" : "hsl(38 50% 42% / 0.3)"}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: hex }} />
                          <span className="text-sm font-semibold text-foreground">{area.area}</span>
                        </div>
                        <span className={`text-sm font-bold ${area.percentDominio < 30 ? "text-red-400" : "text-amber-400"}`}>
                          {area.percentDominio}%
                        </span>
                      </div>
                      <Progress value={area.percentDominio} className="h-2 mb-2" />
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        <span>✅ {area.compreendi} compreendi</span>
                        <span>🔄 {area.revisar} para revisar</span>
                        <span>📊 {area.total} total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Analysis with Arabella photo */}
            <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "hsl(265 30% 18%)", border: "1px solid hsl(265 40% 30% / 0.5)" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <img
                  src={draArabellaAvatar}
                  alt="Dra. Arabella"
                  className="w-8 h-8 rounded-full object-cover border-2"
                  style={{ borderColor: "hsl(265 50% 50%)" }}
                />
                <p className="text-sm font-semibold text-foreground">Análise da Dra. Arabella</p>
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Gerando diagnóstico personalizado...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground prose-strong:text-amber-400 prose-strong:font-bold prose-li:text-foreground prose-headings:text-foreground prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAnalysis}</ReactMarkdown>
                </div>
              ) : total === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Estude flashcards para receber seu diagnóstico personalizado 🎯
                </p>
              ) : (
                <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Preparando análise...</span>
                </div>
              )}
            </div>

            {/* Dicas rápidas */}
            <div className="rounded-2xl p-4" style={{ background: "hsl(0 0% 15%)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <p className="text-sm font-semibold text-foreground">Dicas de Estudo</p>
              </div>
              <div className="space-y-2.5">
                {[
                  "Revise os flashcards marcados como 'revisar' antes de estudar novos",
                  "Mantenha uma rotina diária, mesmo que seja apenas 10 minutos",
                  "Foque nas áreas com menor taxa de compreensão primeiro",
                ].map((dica, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{dica}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
