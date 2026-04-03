import { useNavigate } from "react-router-dom";
import { useArabellaMetrics, gerarMensagemArabella } from "@/hooks/useArabellaMetrics";
import { useUserInterests } from "@/hooks/useUserInterests";
import { useJornadaPessoal } from "@/hooks/useJornadaPessoal";
import { useAcompanhamentoData } from "@/hooks/useAcompanhamentoData";
import { useAreaStudyStats } from "@/hooks/useFlashcardStudyProgress";
import { CATEGORIAS_ANOTACOES } from "@/lib/anotacoesCategorias";
import { Clock, Calendar, Flame, BarChart3, BookOpen, HelpCircle, FileText, Scale, Brain, Target, TrendingUp, Sparkles, Rocket, CheckCircle, XCircle, Zap, Award } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Tooltip, CartesianGrid, Legend } from "recharts";
import { motion } from "framer-motion";
import draArabellaAvatar from "@/assets/dra-jurisia-avatar.png";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

import { JornadaContinuarEstudando } from "@/components/jornada/JornadaContinuarEstudando";
import { JornadaFlashcardsRecentes } from "@/components/jornada/JornadaFlashcardsRecentes";
import { JornadaResumosRecentes } from "@/components/jornada/JornadaResumosRecentes";
import { JornadaLeituras } from "@/components/jornada/JornadaLeituras";
import { JornadaJuriflixRecomendacoes } from "@/components/jornada/JornadaJuriflixRecomendacoes";

const AREA_ROUTES = (area: string) => [
  { label: 'Flashcards', icon: BookOpen, path: `/flashcards?area=${encodeURIComponent(area)}` },
  { label: 'Questões', icon: HelpCircle, path: `/ferramentas/questoes?area=${encodeURIComponent(area)}` },
  { label: 'Resumos', icon: FileText, path: `/resumos-juridicos?area=${encodeURIComponent(area)}` },
  { label: 'Leis', icon: Scale, path: `/vade-mecum` },
];

const CORES = ["#ea384c", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];
const DIAS_SEMANA_CURTO = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Acompanhamento() {
  const navigate = useNavigate();
  const metrics = useArabellaMetrics();
  const { topAreas } = useUserInterests();
  const jornada = useJornadaPessoal();
  const acomp = useAcompanhamentoData();
  const mensagem = gerarMensagemArabella(metrics);
  const [focoArea, setFocoArea] = useState(() => localStorage.getItem('arabella_foco_area') || '');
  const [mainTab, setMainTab] = useState<'estudos' | 'livros'>('estudos');

  const handleFocoChange = (v: string) => {
    setFocoArea(v);
    localStorage.setItem('arabella_foco_area', v);
  };

  const horas = Math.floor(metrics.tempoTelaMinutos / 60);
  const min = metrics.tempoTelaMinutos % 60;
  const tempoStr = horas > 0 ? `${horas}h${min > 0 ? min + 'min' : ''}` : `${min}min`;

  const isFirstAccess = !jornada.isLoading &&
    jornada.aulasProgresso.length === 0 &&
    jornada.flashcardsData.length === 0 &&
    jornada.resumos.length === 0 &&
    jornada.leituras.length === 0;

  const fcDominioGeral = jornada.flashcardsData.length > 0
    ? Math.round(jornada.flashcardsData.reduce((s, f) => s + f.compreendi, 0) / Math.max(jornada.flashcardsData.reduce((s, f) => s + f.total, 0), 1) * 100)
    : 0;
  const areaMaisRevisar = jornada.flashcardsData.length > 0
    ? [...jornada.flashcardsData].sort((a, b) => b.revisar - a.revisar)[0]?.area
    : null;

  const areasChartData = topAreas.slice(0, 5).map((a, i) => ({
    nome: a.area.length > 15 ? a.area.slice(0, 15) + '…' : a.area,
    quantidade: a.count,
    cor: CORES[i % CORES.length],
  }));

  const performanceData = [
    { nome: 'Aulas acessadas', valor: metrics.aulasAcessadas, cor: '#3b82f6' },
    { nome: 'Concluídas', valor: metrics.aulasConcluidasCount, cor: '#22c55e' },
    { nome: 'Em andamento', valor: metrics.aulasEmAndamento, cor: '#f59e0b' },
    { nome: 'Nota média', valor: metrics.notaMedia, cor: '#8b5cf6' },
    { nome: 'Progresso', valor: metrics.progressoMedio, cor: '#ea384c' },
  ].filter(d => d.valor > 0);

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div className="min-h-screen pb-24" style={{ background: 'hsl(0 0% 7%)' }}>
      {/* Header */}
      <div className="bg-gradient-to-b from-red-950/90 to-transparent px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <img src={draArabellaAvatar} alt="Dra. Arabella" className="w-9 h-9 rounded-full object-cover border-2 border-red-800/60" />
          <div className="flex-1">
            <h1 className="text-sm font-bold text-white">Acompanhamento</h1>
            <p className="text-[10px] text-white/40">Dra. Arabella • Seu progresso</p>
          </div>
          <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2.5 py-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-white">{metrics.streak}</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-xl px-3.5 py-3 backdrop-blur-sm">
          <span className="text-[12px] text-white/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: mensagem }} />
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="px-4 -mt-1 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <QuickStat icon={HelpCircle} value={`${acomp.totalQuestoes30}`} label="questões" color="text-red-400" />
          <QuickStat icon={Target} value={`${acomp.totalQuestoes30 > 0 ? Math.round((acomp.totalAcertos30 / acomp.totalQuestoes30) * 100) : 0}%`} label="acerto" color="text-emerald-400" />
          <QuickStat icon={Brain} value={`${acomp.totalFlashcards30}`} label="flashcards" color="text-violet-400" />
          <QuickStat icon={Calendar} value={`${acomp.totalDiasAtivos30}`} label="dias" color="text-amber-400" />
          <QuickStat icon={Clock} value={tempoStr} label="tempo" color="text-sky-400" />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'hsl(0 0% 11%)', border: '1px solid hsl(0 0% 16%)' }}>
          <button
            onClick={() => setMainTab('estudos')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              mainTab === 'estudos' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Estudos
          </button>
          <button
            onClick={() => setMainTab('livros')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              mainTab === 'livros' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Livros
          </button>
        </div>
      </div>

      {/* ── ESTUDOS ── */}
      {mainTab === 'estudos' && (
        <div className="px-4 space-y-4">
          {jornada.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
            </div>
          ) : isFirstAccess ? (
            <PrimeirosPassos navigate={navigate} />
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
              {/* Resumo / Jornada */}
              {jornada.aulasProgresso.length > 0 && (
                <motion.div variants={fadeUp}>
                  <SectionFeedback text={`${jornada.aulasProgresso.filter(a => a.progresso >= 100).length} aulas concluídas de ${jornada.aulasProgresso.length} em andamento`} />
                  <JornadaContinuarEstudando aulas={jornada.aulasProgresso} />
                </motion.div>
              )}
              {jornada.flashcardsData.length > 0 && (
                <motion.div variants={fadeUp}>
                  <SectionFeedback text={`Domínio geral: ${fcDominioGeral}%${areaMaisRevisar ? ` · Revise "${areaMaisRevisar}"` : ''}`} />
                  <JornadaFlashcardsRecentes flashcards={jornada.flashcardsData} />
                </motion.div>
              )}
              {acomp.questoesPorArea.length > 0 && (
                <motion.div variants={fadeUp}>
                  <SectionFeedback text={`${acomp.totalQuestoes30} questões nos últimos 30 dias em ${acomp.questoesPorArea.length} áreas`} />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <HelpCircle className="w-4 h-4 text-red-400" />
                      <span>Questões por Área</span>
                    </div>
                    <ScrollArea className="w-full">
                      <div className="flex gap-3 pb-2">
                        {acomp.questoesPorArea.slice(0, 10).map((qa) => (
                          <div key={qa.area} className="flex-shrink-0 w-[150px] rounded-2xl p-3 space-y-2" style={{ background: 'hsl(0 0% 13%)', border: '1px solid hsl(0 0% 18%)' }}>
                            <p className="text-xs font-semibold text-white line-clamp-2">{qa.area}</p>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-emerald-400 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />{qa.acertos}</span>
                              <span className="text-red-400 flex items-center gap-0.5"><XCircle className="w-3 h-3" />{qa.erros}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${qa.taxaAcerto}%` }} />
                            </div>
                            <p className="text-[10px] text-emerald-400 font-medium">{qa.taxaAcerto}% acerto</p>
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </motion.div>
              )}
              {jornada.resumos.length > 0 && (
                <motion.div variants={fadeUp}>
                  <SectionFeedback text={`${jornada.resumos.length} resumos acessados recentemente`} />
                  <JornadaResumosRecentes resumos={jornada.resumos} />
                </motion.div>
              )}
              {jornada.leituras.length > 0 && (
                <motion.div variants={fadeUp}>
                  <SectionFeedback text={`${jornada.leituras.filter(l => l.status === 'lendo').length} livros em leitura`} />
                  <JornadaLeituras leituras={jornada.leituras} />
                </motion.div>
              )}
              <motion.div variants={fadeUp}>
                <JornadaJuriflixRecomendacoes juriflix={jornada.juriflix} />
              </motion.div>

              {/* Gráficos inline */}
              <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
                <StatCard label="Questões (30d)" value={acomp.totalQuestoes30} icon={HelpCircle} color="text-red-400" gradient="from-red-500/10 to-transparent" />
                <StatCard label="Taxa de acerto" value={`${acomp.totalQuestoes30 > 0 ? Math.round((acomp.totalAcertos30 / acomp.totalQuestoes30) * 100) : 0}%`} icon={Target} color="text-emerald-400" gradient="from-emerald-500/10 to-transparent" />
                <StatCard label="Flashcards (30d)" value={acomp.totalFlashcards30} icon={Brain} color="text-violet-400" gradient="from-violet-500/10 to-transparent" />
                <StatCard label="Dias ativos" value={acomp.totalDiasAtivos30} icon={Calendar} color="text-amber-400" gradient="from-amber-500/10 to-transparent" />
              </motion.div>

              <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
                <MiniStat icon={Clock} label="Tempo" value={tempoStr} />
                <MiniStat icon={Flame} label="Streak" value={`${metrics.streak}`} />
                <MiniStat icon={Award} label="Concluídas" value={`${metrics.aulasConcluidasCount}`} />
              </motion.div>

              {/* Calendário */}
              <motion.div variants={fadeUp}>
                <Card>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="capitalize">{monthName}</span>
                    <span className="text-[10px] text-white/30 ml-auto">{acomp.totalDiasAtivos30} dias ativos</span>
                  </h3>
                  <div className="grid grid-cols-7 gap-1">
                    {DIAS_SEMANA_CURTO.map((d, i) => (
                      <span key={i} className="text-[9px] text-white/30 text-center font-medium">{d}</span>
                    ))}
                    {acomp.monthDays.map((day, i) => (
                      <div
                        key={i}
                        className={`w-full aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-all ${
                          !day.isCurrentMonth ? 'text-white/10'
                            : day.isActive ? 'bg-emerald-500/80 text-white shadow-sm shadow-emerald-500/20'
                            : day.isToday ? 'border border-red-500/50 text-white/60'
                            : 'text-white/25'
                        }`}
                      >
                        {day.dayNum}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Evolução Semanal */}
              {acomp.weekEvolution.some(w => w.questoes > 0 || w.flashcards > 0) && (
                <motion.div variants={fadeUp}>
                  <Card>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-blue-400" /> Evolução Semanal
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={acomp.weekEvolution} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
                        <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#666' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                        <Tooltip contentStyle={{ background: 'hsl(0 0% 13%)', border: '1px solid hsl(0 0% 20%)', borderRadius: 8, fontSize: 11, color: '#fff' }} />
                        <Line type="monotone" dataKey="questoes" stroke="#ea384c" strokeWidth={2} dot={{ r: 3 }} name="Questões" />
                        <Line type="monotone" dataKey="acertos" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Acertos" />
                        <Line type="monotone" dataKey="flashcards" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Flashcards" />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </motion.div>
              )}

              {/* Ranking por Área */}
              {acomp.areaRanking.length > 0 && (
                <motion.div variants={fadeUp}>
                  <Card>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-amber-400" /> Ranking por Área
                    </h3>
                    <div className="space-y-3">
                      {acomp.areaRanking.map((a, i) => (
                        <div key={a.area} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/30 w-4 text-right font-bold">{i + 1}</span>
                            <span className="text-[11px] text-white/80 font-medium flex-1 truncate">{a.area}</span>
                            <span className="text-[10px] text-white/30">{a.totalAtividades} atividades</span>
                          </div>
                          <div className="flex gap-1.5 ml-6">
                            <div className="flex-1">
                              <div className="w-full bg-white/5 rounded-full h-1.5">
                                <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${a.fcPct}%` }} />
                              </div>
                              <span className="text-[9px] text-violet-400">FC {a.fcPct}%</span>
                            </div>
                            <div className="flex-1">
                              <div className="w-full bg-white/5 rounded-full h-1.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${a.qPct}%` }} />
                              </div>
                              <span className="text-[9px] text-emerald-400">Q {a.qPct}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Áreas de Interesse */}
              {areasChartData.length > 0 && (
                <motion.div variants={fadeUp}>
                  <Card>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-blue-400" /> Áreas de Interesse
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={areasChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="quantidade" nameKey="nome">
                          {areasChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.cor} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'hsl(0 0% 13%)', border: '1px solid hsl(0 0% 20%)', borderRadius: 8, fontSize: 11, color: '#fff' }} formatter={(value: number, name: string) => [`${value}`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {areasChartData.map((a, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.cor }} />
                          <span className="text-[10px] text-white/40">{a.nome}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Funções mais usadas */}
              {metrics.topFuncoes.length > 0 && (
                <motion.div variants={fadeUp}>
                  <Card>
                    <span className="text-xs text-white/50 font-medium">Funções mais usadas</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {metrics.topFuncoes.map((f, i) => (
                        <span key={i} className="text-[11px] bg-red-950/50 text-red-400 px-3 py-1.5 rounded-full font-medium border border-red-900/30">
                          {f}
                        </span>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Performance */}
              {performanceData.length > 0 && (
                <motion.div variants={fadeUp}>
                  <Card>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-red-400" /> Performance
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={performanceData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis dataKey="nome" tick={{ fontSize: 9, fill: '#666' }} />
                        <YAxis tick={{ fontSize: 9, fill: '#666' }} />
                        <Tooltip contentStyle={{ background: 'hsl(0 0% 13%)', border: '1px solid hsl(0 0% 20%)', borderRadius: 8, fontSize: 11, color: '#fff' }} />
                        <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                          {performanceData.map((entry, index) => (
                            <Cell key={index} fill={entry.cor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </motion.div>
              )}

              {/* Área de Foco */}
              <motion.div variants={fadeUp}>
                <Card>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-red-400" /> Área de Foco
                  </h3>
                  <p className="text-xs text-white/35 mt-1">Escolha uma área para ver seu progresso detalhado.</p>
                  <Select value={focoArea} onValueChange={handleFocoChange}>
                    <SelectTrigger className="h-10 text-xs mt-3" style={{ background: 'hsl(0 0% 10%)', borderColor: 'hsl(0 0% 18%)' }}>
                      <SelectValue placeholder="Escolha sua área de foco..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_ANOTACOES.map(area => (
                        <SelectItem key={area} value={area} className="text-xs">{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>
              </motion.div>
              {focoArea && (
                <motion.div variants={fadeUp}>
                  <FocoAreaDetail area={focoArea} navigate={navigate} />
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ── LIVROS ── */}
      {mainTab === 'livros' && (
        <div className="px-4">
          <AbaLivros topAreas={topAreas} areaRanking={acomp.areaRanking} navigate={navigate} />
        </div>
      )}
    </div>
  );
}

/* ── Aba Livros ── */
interface AbaLivrosProps {
  topAreas: { area: string; count: number }[];
  areaRanking: { area: string; fcPct: number; qPct: number; totalAtividades: number }[];
  navigate: ReturnType<typeof useNavigate>;
}

// Map user interest areas to biblioteca area names
const AREA_MAPPING: Record<string, string[]> = {
  'Direito Penal': ['Direito Penal', 'Penal'],
  'Direito Civil': ['Direito Civil', 'Civil'],
  'Direito Constitucional': ['Direito Constitucional', 'Constitucional'],
  'Direito Trabalhista': ['Direito do Trabalho', 'Trabalhista', 'Direito Trabalhista'],
  'Direito Tributário': ['Direito Tributário', 'Tributário'],
  'Direito Administrativo': ['Direito Administrativo', 'Administrativo'],
  'OAB': ['OAB', 'Exame de Ordem'],
  'Legislação': ['Legislação', 'Vade Mecum'],
  'Questões e Revisão': ['Questões', 'Revisão'],
  'Estudos': ['Estudos', 'Geral'],
};

function AbaLivros({ topAreas, areaRanking, navigate }: AbaLivrosProps) {
  const { user } = useAuth();

  // Get user's studied areas
  const userAreas = [
    ...topAreas.map(a => a.area),
    ...areaRanking.map(a => a.area),
  ];
  const uniqueUserAreas = [...new Set(userAreas)].slice(0, 5);

  // Build area keywords for matching
  const areaKeywords = uniqueUserAreas.flatMap(a => AREA_MAPPING[a] || [a]);

  // Fetch books from BIBLIOTECA-ESTUDOS
  const { data: estudosBooks, isLoading: loadingEstudos } = useQuery({
    queryKey: ['livros-rec-estudos'],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data } = await supabase
        .from('BIBLIOTECA-ESTUDOS' as any)
        .select('id, Tema, "Capa-livro", Área, Sobre')
        .limit(100);
      return (data || []) as any[];
    },
  });

  // Fetch books from BIBLIOTECA-CLASSICOS
  const { data: classicosBooks, isLoading: loadingClassicos } = useQuery({
    queryKey: ['livros-rec-classicos'],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data } = await supabase
        .from('BIBLIOTECA-CLASSICOS')
        .select('id, livro, imagem, area, sobre, autor')
        .limit(100);
      return (data || []) as any[];
    },
  });

  // Fetch beginner books
  const { data: inicianteBooks, isLoading: loadingIniciante } = useQuery({
    queryKey: ['livros-rec-iniciante'],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data } = await supabase
        .from('biblioteca_iniciante')
        .select('id, titulo, capa, area, biblioteca_origem, livro_id, justificativa, autor')
        .order('ordem', { ascending: true })
        .limit(20);
      return (data || []) as any[];
    },
  });

  const isLoading = loadingEstudos || loadingClassicos || loadingIniciante;

  // Normalize all books
  const allBooks = [
    ...(estudosBooks || []).map((b: any) => ({
      id: b.id,
      title: b.Tema || 'Sem título',
      cover: b['Capa-livro'],
      area: b['Área'] || '',
      about: b.Sobre || '',
      source: 'estudos' as const,
      route: `/biblioteca-de-estudos/${b.id}`,
    })),
    ...(classicosBooks || []).map((b: any) => ({
      id: b.id,
      title: b.livro || 'Sem título',
      cover: b.imagem,
      area: b.area || '',
      about: b.sobre || '',
      source: 'classicos' as const,
      route: `/biblioteca-classicos/${b.id}`,
    })),
  ];

  // "Para Você" — matches user interests
  const paraVoce = allBooks.filter(b => {
    const bArea = b.area.toLowerCase();
    return areaKeywords.some(k => bArea.includes(k.toLowerCase()));
  }).slice(0, 12);

  // "Iniciante" — from biblioteca_iniciante
  const iniciante = (inicianteBooks || []).map((b: any) => ({
    id: b.livro_id,
    title: b.titulo,
    cover: b.capa,
    area: b.area || '',
    about: b.justificativa || '',
    source: b.biblioteca_origem === 'BIBLIOTECA-CLASSICOS' ? 'classicos' as const : 'estudos' as const,
    route: b.biblioteca_origem === 'BIBLIOTECA-CLASSICOS' ? `/biblioteca-classicos/${b.livro_id}` : `/biblioteca-de-estudos/${b.livro_id}`,
  }));

  // "Explore" — areas user hasn't studied
  const explorar = allBooks.filter(b => {
    const bArea = b.area.toLowerCase();
    return !areaKeywords.some(k => bArea.includes(k.toLowerCase())) && b.cover;
  }).slice(0, 12);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Para Você */}
      {paraVoce.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Para Você</h2>
            <span className="text-[10px] text-white/30 ml-auto">baseado nos seus estudos</span>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {paraVoce.map((book) => (
                <BookCard key={`${book.source}-${book.id}`} book={book} onClick={() => navigate(book.route)} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </motion.div>
      )}

      {/* Iniciante */}
      {iniciante.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Se Você é Iniciante</h2>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {iniciante.map((book, i) => (
                <BookCard key={`ini-${book.id}-${i}`} book={book} onClick={() => navigate(book.route)} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </motion.div>
      )}

      {/* Explore */}
      {explorar.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white">Explore Outras Áreas</h2>
            <span className="text-[10px] text-white/30 ml-auto">diversifique seus estudos</span>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {explorar.map((book) => (
                <BookCard key={`exp-${book.source}-${book.id}`} book={book} onClick={() => navigate(book.route)} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </motion.div>
      )}

      {paraVoce.length === 0 && iniciante.length === 0 && explorar.length === 0 && (
        <Card className="text-center py-8">
          <BookOpen className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/40">Nenhum livro disponível no momento.</p>
          <p className="text-xs text-white/20 mt-1">Continue estudando para receber recomendações personalizadas.</p>
        </Card>
      )}
    </motion.div>
  );
}

/* ── BookCard ── */
function BookCard({ book, onClick }: { book: { title: string; cover?: string; area: string; about?: string }; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[130px] text-left group active:scale-[0.97] transition-transform"
    >
      <div className="w-[130px] h-[185px] rounded-xl overflow-hidden mb-2 shadow-lg" style={{ background: 'hsl(0 0% 15%)' }}>
        {book.cover ? (
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-violet-500/20">
            <BookOpen className="w-8 h-8 text-white/20" />
          </div>
        )}
      </div>
      <p className="text-[11px] font-semibold text-white line-clamp-2 leading-tight">{book.title}</p>
      {book.area && <p className="text-[9px] text-white/30 mt-0.5 line-clamp-1">{book.area}</p>}
    </button>
  );
}

/* ── Foco Area Detail ── */
function FocoAreaDetail({ area, navigate }: { area: string; navigate: ReturnType<typeof useNavigate> }) {
  const areaStats = useAreaStudyStats(area);

  return (
    <div className="space-y-3">
      <Card>
        <h4 className="text-xs font-semibold text-white flex items-center gap-2 mb-3">
          <Brain className="w-3.5 h-3.5 text-violet-400" /> Flashcards — {area}
        </h4>
        {areaStats.isLoading ? (
          <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-violet-400" /></div>
        ) : areaStats.data && areaStats.data.total > 0 ? (
          <div className="space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-white/50">{areaStats.data.compreendi} compreendidos de {areaStats.data.total}</span>
              <span className="text-violet-400 font-bold">{Math.round((areaStats.data.compreendi / areaStats.data.total) * 100)}%</span>
            </div>
            <Progress value={(areaStats.data.compreendi / areaStats.data.total) * 100} className="h-2.5" />
            <div className="flex gap-3 text-[10px] mt-1">
              <span className="text-emerald-400">✓ {areaStats.data.compreendi} compreendidos</span>
              <span className="text-amber-400">↻ {areaStats.data.revisar} para revisar</span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-white/30 text-center py-2">Nenhum flashcard estudado nesta área ainda.</p>
        )}
      </Card>
      <div className="grid grid-cols-2 gap-2.5">
        {AREA_ROUTES(area).map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-2.5 p-3.5 rounded-xl transition-colors active:scale-[0.97]"
            style={{ background: 'hsl(0 0% 13%)', border: '1px solid hsl(0 0% 18%)' }}
          >
            <item.icon className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-white/70">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Primeiros Passos ── */
function PrimeirosPassos({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const items = [
    { label: 'Flashcards', desc: 'Cartões inteligentes', icon: Brain, path: '/flashcards', color: 'text-violet-400', bg: 'from-violet-500/15' },
    { label: 'Questões', desc: 'Pratique para provas', icon: HelpCircle, path: '/ferramentas/questoes', color: 'text-red-400', bg: 'from-red-500/15' },
    { label: 'Resumos', desc: 'Resumos jurídicos', icon: FileText, path: '/resumos-juridicos', color: 'text-sky-400', bg: 'from-sky-500/15' },
    { label: 'Conceitos', desc: 'Aulas passo a passo', icon: BookOpen, path: '/conceitos', color: 'text-emerald-400', bg: 'from-emerald-500/15' },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Comece sua jornada!</h3>
          </div>
          <p className="text-xs text-white/40 leading-relaxed">
            Explore as funcionalidades abaixo e seu progresso aparecerá aqui automaticamente.
          </p>
        </Card>
      </motion.div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <motion.button
            key={i}
            variants={fadeUp}
            onClick={() => navigate(item.path)}
            className={`rounded-xl p-4 text-left space-y-2 active:scale-[0.97] transition-transform bg-gradient-to-br ${item.bg} to-transparent`}
            style={{ border: '1px solid hsl(0 0% 18%)' }}
          >
            <div className="p-2 bg-white/5 rounded-lg w-fit">
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <p className="text-xs font-semibold text-white">{item.label}</p>
            <p className="text-[10px] text-white/35 leading-relaxed">{item.desc}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Components ── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-4 ${className}`} style={{ background: 'hsl(0 0% 13%)', border: '1px solid hsl(0 0% 18%)' }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, gradient }: { label: string; value: string | number; icon: any; color: string; gradient: string }) {
  return (
    <div className={`rounded-xl p-4 space-y-1.5 bg-gradient-to-br ${gradient}`} style={{ border: '1px solid hsl(0 0% 18%)' }}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[10px] text-white/40">{label}</span>
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl p-3" style={{ background: 'hsl(0 0% 13%)', border: '1px solid hsl(0 0% 18%)' }}>
      <Icon className="w-3.5 h-3.5 text-red-400" />
      <span className="text-sm font-bold text-white">{value}</span>
      <span className="text-[9px] text-white/30">{label}</span>
    </div>
  );
}

function QuickStat({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg flex-shrink-0" style={{ background: 'hsl(0 0% 13%)', border: '1px solid hsl(0 0% 16%)' }}>
      <Icon className={`w-3 h-3 ${color}`} />
      <span className="text-xs font-bold text-white">{value}</span>
      <span className="text-[9px] text-white/30">{label}</span>
    </div>
  );
}

function SectionFeedback({ text }: { text: string }) {
  return (
    <div className="mb-1">
      <p className="text-[10px] text-white/35 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-amber-400/60" />
        {text}
      </p>
    </div>
  );
}
