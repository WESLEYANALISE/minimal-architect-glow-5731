import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Loader2, Brain, Target, FileText, 
  ChevronRight, Zap, Scale, BookMarked, Clapperboard, 
  MessageCircle, PlayCircle, Library, ScrollText, GraduationCap,
  TrendingUp, Info, BookOpen
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import logoUsp from "@/assets/logo-usp.png";
import logoUnip from "@/assets/logo-unip.png";
import logoAnhanguera from "@/assets/logo-anhanguera.png";
import logoEstacio from "@/assets/logo-estacio.png";
import logoUninove from "@/assets/logo-uninove.png";
import logoUnopar from "@/assets/logo-unopar.png";
import logoPucsp from "@/assets/logo-pucsp.png";
import logoMackenzie from "@/assets/logo-mackenzie.png";
import logoUfmg from "@/assets/logo-ufmg.png";
import logoUerj from "@/assets/logo-uerj.png";

import capaDiscPrivado from "@/assets/capa-disc-teoria-geral-direito-privado.jpg";
import capaDiscRomano from "@/assets/capa-disc-direito-romano.jpg";
import capaDiscEconomia from "@/assets/capa-disc-economia-politica.jpg";
import capaDiscEstado from "@/assets/capa-disc-teoria-geral-estado.jpg";
import capaDiscIntro from "@/assets/capa-disc-intro-estudo-direito.jpg";
import capaDiscMetodologia from "@/assets/capa-disc-metodologia-direito.jpg";

import capaSem1 from "@/assets/capa-semestre-1.jpg";

const LOGOS: Record<string, string> = {
  "usp": logoUsp, "unip": logoUnip, "anhanguera": logoAnhanguera,
  "estácio": logoEstacio, "estacio": logoEstacio, "uninove": logoUninove,
  "unopar": logoUnopar, "puc-sp": logoPucsp, "mackenzie": logoMackenzie,
  "ufmg": logoUfmg, "uerj": logoUerj,
};

const DISC_CAPAS: Record<string, string> = {
  "teoria geral do direito privado": capaDiscPrivado,
  "direito romano": capaDiscRomano,
  "economia": capaDiscEconomia,
  "teoria geral do estado": capaDiscEstado,
  "introdução ao estudo": capaDiscIntro,
  "metodologia": capaDiscMetodologia,
};

const getDiscCapa = (nome: string): string => {
  const lower = nome.toLowerCase();
  for (const [key, val] of Object.entries(DISC_CAPAS)) {
    if (lower.includes(key)) return val;
  }
  return capaSem1;
};

const FUNCOES_ESTUDO = [
  { id: "aulas", label: "Aulas", subtitle: "Interativas", icon: PlayCircle, bg: "from-[#b8334a] to-[#6e1a2c]", accent: "#f9a8d4" },
  { id: "flashcards", label: "Flashcards", subtitle: "Cards", icon: Brain, bg: "from-[#1d4ed8] to-[#1e3a5f]", accent: "#93c5fd" },
  { id: "questoes", label: "Questões", subtitle: "Prática", icon: Target, bg: "from-[#c2410c] to-[#7c2d12]", accent: "#fdba74" },
  { id: "resumos", label: "Resumos", subtitle: "Jurídicos", icon: FileText, bg: "from-[#0f766e] to-[#064e3b]", accent: "#5eead4" },
  { id: "biblioteca", label: "Biblioteca", subtitle: "Livros", icon: Library, bg: "from-[#92400e] to-[#572508]", accent: "#fcd34d" },
  { id: "simulado", label: "Simulado", subtitle: "Provas", icon: ScrollText, bg: "from-[#7b2d8e] to-[#3d1547]", accent: "#c084fc" },
];

const ACESSO_RAPIDO = [
  { label: "Vade Mecum", icon: Scale, route: "/vade-mecum", bg: "from-[#0f766e] to-[#064e3b]" },
  { label: "Dicionário", icon: BookMarked, route: "/dicionario-juridico", bg: "from-[#1d4ed8] to-[#1e3a5f]" },
  { label: "Professora", icon: MessageCircle, route: "/assistente", bg: "from-[#7b2d8e] to-[#3d1547]" },
  { label: "Docs", icon: Clapperboard, route: "/documentarios", bg: "from-[#c2410c] to-[#7c2d12]" },
];

const FaculdadeDisciplinaDetalhe = () => {
  const { universidadeId, numero, disciplinaId } = useParams<{ universidadeId: string; numero: string; disciplinaId: string }>();
  const navigate = useNavigate();
  const semestreNum = parseInt(numero || "1");
  const uniId = parseInt(universidadeId || "1");
  const discId = parseInt(disciplinaId || "0");
  const [activeTab, setActiveTab] = useState("estudos");

  const { data: universidade } = useQuery({
    queryKey: ["faculdade-uni-detail", uniId],
    queryFn: async () => {
      const { data } = await supabase.from("faculdade_universidades").select("*").eq("id", uniId).single();
      return data;
    },
  });

  const { data: disciplina, isLoading } = useQuery({
    queryKey: ["faculdade-disciplina-detalhe", discId],
    queryFn: async () => {
      const { data } = await supabase.from("faculdade_disciplinas").select("*").eq("id", discId).single();
      return data;
    },
  });

  const { data: topicos } = useQuery({
    queryKey: ["faculdade-topicos-disc", discId],
    queryFn: async () => {
      const { data } = await supabase.from("faculdade_topicos").select("*").eq("disciplina_id", discId).order("ordem");
      return data || [];
    },
  });

  const sigla = universidade?.sigla?.toLowerCase() || "";
  const logo = LOGOS[sigla] || LOGOS["usp"];
  const discCapa = disciplina ? getDiscCapa(disciplina.nome) : capaSem1;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Cover - uses discipline-specific cover */}
      <div className="relative h-52 overflow-hidden">
        <img src={discCapa} alt={disciplina?.nome || ""} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-background" />
        
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => navigate(`/faculdade/universidade/${uniId}/semestre/${semestreNum}`)}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm p-1.5 border border-white/20 flex-shrink-0">
            <img src={logo} alt={universidade?.sigla || ""} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white drop-shadow-lg leading-tight">{disciplina?.nome}</h1>
            <p className="text-xs text-white/70">
              {semestreNum}º Semestre · {topicos?.length || 0} tópicos
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/30">
          <TabsList className="w-full h-auto p-1 bg-transparent gap-0 rounded-none grid grid-cols-4">
            {[
              { value: "estudos", label: "Estudos" },
              { value: "grade", label: "Grade" },
              { value: "progresso", label: "Progresso" },
              { value: "sobre", label: "Sobre" },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs px-2 py-2.5 data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none font-semibold"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Estudos Tab */}
        <TabsContent value="estudos" className="mt-0">
          {/* Study Functions - 3x2 Grid */}
          <div className="px-2 pt-3">
            <div className="grid grid-cols-3 gap-2">
              {FUNCOES_ESTUDO.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "aulas") {
                        navigate(`/faculdade/universidade/${uniId}/semestre/${semestreNum}/disciplina/${discId}/aulas`);
                      } else if (item.id === "questoes") {
                        navigate("/ferramentas/questoes");
                      } else if (item.id === "flashcards") {
                        navigate("/flashcards/areas");
                      } else {
                        navigate(`/faculdade/universidade/${uniId}/semestre/${semestreNum}/conteudo/${item.id}`);
                      }
                    }}
                    className={`group relative bg-gradient-to-br ${item.bg} rounded-xl p-2.5 sm:p-3 flex flex-col items-start justify-center gap-1.5 overflow-hidden border border-white/[0.06] animate-fade-in active:scale-95 transition-transform min-h-[140px]`}
                    style={{
                      animationDelay: `${index * 0.08}s`,
                      animationFillMode: 'backwards',
                      boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                  >
                    <Icon
                      className="absolute -bottom-2 -right-2 w-[60px] h-[60px] pointer-events-none rotate-[-12deg] blur-[0.3px]"
                      strokeWidth={1.2}
                      style={{ animation: `ghostGlow 6s ease-in-out infinite ${index * 0.9}s`, opacity: 0.3, color: 'rgba(255,255,255,0.35)' }}
                    />
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                      <div
                        className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                        style={{ animation: `shinePratique 4s ease-in-out infinite ${index * 0.15 + 1}s` }}
                      />
                    </div>
                    <div className="bg-white/15 p-2.5 rounded-xl relative z-[1]">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left relative z-[1] w-full flex items-end justify-between">
                      <div>
                        <span className="text-[15px] sm:text-base font-bold text-white block leading-tight">{item.label}</span>
                        <span className="text-[11px] sm:text-xs text-white/60 block">{item.subtitle}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[3px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${item.accent}80, transparent)` }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ferramentas */}
          <div className="px-3 pt-6">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3 px-1">
              <Zap className="w-4 h-4 text-amber-500" />
              Ferramentas
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {ACESSO_RAPIDO.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                    onClick={() => navigate(item.route)}
                    className={`bg-gradient-to-br ${item.bg} rounded-xl p-3 flex flex-col items-center gap-2 border border-white/[0.06] active:scale-95 transition-transform`}
                    style={{ boxShadow: '0 4px 12px -2px rgba(0,0,0,0.4)' }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                    <span className="text-[9px] font-medium text-white/80">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Grade Tab */}
        <TabsContent value="grade" className="mt-0 px-3 pt-3">
          {topicos && topicos.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground mb-3 px-1">
                {topicos.length} tópicos · {disciplina?.carga_horaria || 60}h de carga horária
              </p>
              {topicos.map((topico, idx) => (
                <motion.div
                  key={topico.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card/60 border border-border/40"
                >
                  <span className="text-xs font-bold text-amber-500 mt-0.5 min-w-[20px]">{idx + 1}.</span>
                  <div>
                    <p className="text-sm text-foreground font-medium">{topico.titulo}</p>
                    {topico.complemento && (
                      <p className="text-xs text-muted-foreground mt-0.5">{topico.complemento}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Conteúdo programático em breve</p>
            </div>
          )}
        </TabsContent>

        {/* Progresso Tab */}
        <TabsContent value="progresso" className="mt-0 px-3 pt-4">
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-amber-500/40" />
            <h3 className="text-base font-bold text-foreground mb-2">Seu Progresso</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Acompanhe seu avanço em {disciplina?.nome}
            </p>

            <div className="space-y-4 text-left">
              {[
                { label: "Aulas Interativas", pct: 0 },
                { label: "Resumos Lidos", pct: 0 },
                { label: "Flashcards Revisados", pct: 0 },
                { label: "Questões Respondidas", pct: 0 },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card border border-border/40 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <span className="text-xs text-muted-foreground">{item.pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500/50 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Sobre Tab */}
        <TabsContent value="sobre" className="mt-0 px-3 pt-4">
          <div className="space-y-4">
            <div className="bg-card border border-border/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-foreground">Sobre a disciplina</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {disciplina?.nome} é uma disciplina do {semestreNum}º semestre do curso de Direito 
                da {universidade?.nome || "universidade"}, com {topicos?.length || 0} tópicos 
                e carga horária de {disciplina?.carga_horaria || 60} horas.
              </p>
            </div>

            <div className="bg-card border border-border/40 rounded-xl p-5">
              <h4 className="text-sm font-bold text-foreground mb-3">Informações</h4>
              <div className="space-y-3">
                {[
                  { label: "Universidade", value: universidade?.sigla || "—" },
                  { label: "Semestre", value: `${semestreNum}º` },
                  { label: "Área de conteúdo", value: disciplina?.area_conteudo || "—" },
                  { label: "Tópicos", value: `${topicos?.length || 0}` },
                  { label: "Carga horária", value: `${disciplina?.carga_horaria || 60}h` },
                ].map((info, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{info.label}</span>
                      <span className="text-sm font-semibold text-foreground">{info.value}</span>
                    </div>
                    {idx < 4 && <div className="h-px bg-border/30 mt-3" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FaculdadeDisciplinaDetalhe;
