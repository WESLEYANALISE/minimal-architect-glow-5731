import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  GraduationCap, ArrowLeft, Loader2, ChevronRight, BookOpen, 
  Scale, Gavel, ScrollText, BarChart3, Info, TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import capaSem1 from "@/assets/capa-semestre-1.webp";
import capaSem2 from "@/assets/capa-semestre-2.webp";
import capaSem3 from "@/assets/capa-semestre-3.webp";
import capaSem4 from "@/assets/capa-semestre-4.webp";
import capaSem5 from "@/assets/capa-semestre-5.webp";
import capaSem6 from "@/assets/capa-semestre-6.webp";
import capaSem7 from "@/assets/capa-semestre-7.webp";
import capaSem8 from "@/assets/capa-semestre-8.webp";
import capaSem9 from "@/assets/capa-semestre-9.webp";
import capaSem10 from "@/assets/capa-semestre-10.webp";

import logoUsp from "@/assets/logo-usp.webp";
import logoUnip from "@/assets/logo-unip.webp";
import logoAnhanguera from "@/assets/logo-anhanguera.webp";
import logoEstacio from "@/assets/logo-estacio.webp";
import logoUninove from "@/assets/logo-uninove.webp";
import logoUnopar from "@/assets/logo-unopar.webp";
import logoPucsp from "@/assets/logo-pucsp.webp";
import logoMackenzie from "@/assets/logo-mackenzie.webp";
import logoUfmg from "@/assets/logo-ufmg.webp";
import logoUerj from "@/assets/logo-uerj.webp";

const CAPAS_SEMESTRE = [capaSem1, capaSem2, capaSem3, capaSem4, capaSem5, capaSem6, capaSem7, capaSem8, capaSem9, capaSem10];

const LOGOS: Record<string, string> = {
  "usp": logoUsp, "unip": logoUnip, "anhanguera": logoAnhanguera,
  "estácio": logoEstacio, "estacio": logoEstacio, "uninove": logoUninove,
  "unopar": logoUnopar, "puc-sp": logoPucsp, "mackenzie": logoMackenzie,
  "ufmg": logoUfmg, "uerj": logoUerj,
};

import capaDiscPrivado from "@/assets/capa-disc-teoria-geral-direito-privado.webp";
import capaDiscRomano from "@/assets/capa-disc-direito-romano.webp";
import capaDiscEconomia from "@/assets/capa-disc-economia-politica.webp";
import capaDiscEstado from "@/assets/capa-disc-teoria-geral-estado.webp";
import capaDiscIntro from "@/assets/capa-disc-intro-estudo-direito.webp";
import capaDiscMetodologia from "@/assets/capa-disc-metodologia-direito.webp";

const DISC_CAPAS: Record<string, string> = {
  "teoria geral do direito privado": capaDiscPrivado,
  "direito romano": capaDiscRomano,
  "economia": capaDiscEconomia,
  "teoria geral do estado": capaDiscEstado,
  "introdução ao estudo": capaDiscIntro,
  "metodologia": capaDiscMetodologia,
};

const getDiscCapa = (nome: string): string | null => {
  const lower = nome.toLowerCase();
  for (const [key, val] of Object.entries(DISC_CAPAS)) {
    if (lower.includes(key)) return val;
  }
  return null;
};

const DISC_ICONS = [Gavel, Scale, ScrollText, BookOpen, GraduationCap, BarChart3];

const DISC_GRADIENTS = [
  "from-amber-700/50 to-amber-900/70",
  "from-emerald-700/50 to-emerald-900/70",
  "from-rose-700/50 to-rose-900/70",
  "from-blue-700/50 to-blue-900/70",
  "from-purple-700/50 to-purple-900/70",
  "from-orange-700/50 to-orange-900/70",
  "from-cyan-700/50 to-cyan-900/70",
  "from-indigo-700/50 to-indigo-900/70",
];

const FaculdadeSemestre = () => {
  const { numero, universidadeId } = useParams<{ numero: string; universidadeId: string }>();
  const navigate = useNavigate();
  const semestreNum = parseInt(numero || "1");
  const uniId = parseInt(universidadeId || "1");
  const [activeTab, setActiveTab] = useState("disciplinas");

  const { data: universidade } = useQuery({
    queryKey: ["faculdade-uni-detail", uniId],
    queryFn: async () => {
      const { data } = await supabase.from("faculdade_universidades").select("*").eq("id", uniId).single();
      return data;
    },
  });

  const { data: disciplinas, isLoading } = useQuery({
    queryKey: ["faculdade-disciplinas", semestreNum, uniId],
    queryFn: async () => {
      const { data } = await supabase
        .from("faculdade_disciplinas")
        .select("*")
        .eq("semestre", semestreNum)
        .eq("universidade_id", uniId)
        .eq("ativo", true)
        .order("codigo");
      return data || [];
    },
  });

  const discIds = disciplinas?.map(d => d.id) || [];

  const { data: topicosCount } = useQuery({
    queryKey: ["faculdade-topicos-count", discIds],
    queryFn: async () => {
      if (discIds.length === 0) return {};
      const result: Record<number, number> = {};
      for (const id of discIds) {
        const { count } = await supabase.from("faculdade_topicos").select("*", { count: "exact", head: true }).eq("disciplina_id", id);
        result[id] = count || 0;
      }
      return result;
    },
    enabled: discIds.length > 0,
  });

  const capa = CAPAS_SEMESTRE[(semestreNum - 1) % 10];
  const sigla = universidade?.sigla?.toLowerCase() || "";
  const logo = LOGOS[sigla] || LOGOS["usp"];
  const totalTopicos = Object.values(topicosCount || {}).reduce((acc, v) => acc + v, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Cover */}
      <div className="relative h-52 overflow-hidden">
        <img src={capa} alt={`${semestreNum}º Semestre`} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-background" />
        
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => navigate(`/faculdade/universidade/${uniId}/trilhas`)}
            className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm p-1.5 border border-white/20 flex-shrink-0">
            <img src={logo} alt={universidade?.sigla || ""} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white drop-shadow-lg">{semestreNum}º Semestre</h1>
            <p className="text-xs text-white/70">
              {disciplinas?.length || 0} disciplinas · {totalTopicos} tópicos
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/30">
          <TabsList className="w-full h-auto p-1 bg-transparent gap-0 rounded-none grid grid-cols-4">
            {[
              { value: "disciplinas", label: "Disciplinas" },
              { value: "progresso", label: "Progresso" },
              { value: "raiox", label: "Raio-X" },
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

        {/* Disciplinas Tab */}
        <TabsContent value="disciplinas" className="mt-0 px-3 pt-3">
          {!disciplinas || disciplinas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma disciplina encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disciplinas.map((disc, index) => {
                const IconComp = DISC_ICONS[index % DISC_ICONS.length];
                const gradient = DISC_GRADIENTS[index % DISC_GRADIENTS.length];
                const count = topicosCount?.[disc.id] || 0;
                const coverImg = getDiscCapa(disc.nome);

                return (
                  <button
                    key={disc.id}
                    onClick={() => navigate(`/faculdade/universidade/${uniId}/semestre/${semestreNum}/disciplina/${disc.id}`)}
                    className="w-full h-[120px] flex items-stretch bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/40 transition-all active:scale-[0.98] text-left group animate-fade-in"
                    style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'backwards' }}
                  >
                    {/* Thumbnail with cover image */}
                    <div className="relative w-[110px] flex-shrink-0 overflow-hidden">
                      {coverImg ? (
                        <img src={coverImg} alt={disc.nome} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <IconComp className="w-10 h-10 text-white/40" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-40`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <IconComp className="w-8 h-8 text-white/60 drop-shadow-lg" strokeWidth={1.5} />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/10" />
                      {/* Shine effect */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div
                          className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.12] to-transparent skew-x-[-20deg]"
                          style={{ animation: `shinePratique 4s ease-in-out infinite ${index * 0.7 + 1}s` }}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 py-3 px-3 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-2">
                          {disc.nome}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <BookOpen className="w-3 h-3" />
                            {count} tópicos
                          </span>
                          <span>{disc.carga_horaria || 60}h</span>
                        </div>
                      </div>

                      {/* Area badge */}
                      {disc.area_conteudo && (
                        <div className="flex flex-col mt-auto bg-amber-500/10 rounded-lg px-2 py-1 w-fit">
                          <span className="text-[10px] font-semibold text-amber-400/70 uppercase tracking-wide">Área</span>
                          <span className="text-xs font-bold text-amber-400 leading-tight">
                            {disc.area_conteudo}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center pr-3">
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Progresso Tab */}
        <TabsContent value="progresso" className="mt-0 px-3 pt-4">
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-amber-500/40" />
            <h3 className="text-base font-bold text-foreground mb-2">Seu Progresso</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Acompanhe seu avanço em cada disciplina do {semestreNum}º semestre
            </p>
            
            {disciplinas && disciplinas.length > 0 && (
              <div className="space-y-3 text-left">
                {disciplinas.map((disc, idx) => (
                  <motion.div
                    key={disc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-card border border-border/40 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-foreground truncate pr-2">{disc.nome}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">0%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500/50 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Raio-X Tab */}
        <TabsContent value="raiox" className="mt-0 px-3 pt-4">
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-amber-500/40" />
            <h3 className="text-base font-bold text-foreground mb-2">Raio-X do Semestre</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Distribuição de conteúdo por disciplina
            </p>

            {disciplinas && disciplinas.length > 0 && (
              <div className="space-y-3 text-left">
                {disciplinas.map((disc, idx) => {
                  const count = topicosCount?.[disc.id] || 0;
                  const pct = totalTopicos > 0 ? Math.round((count / totalTopicos) * 100) : 0;
                  const colors = [
                    "bg-amber-500", "bg-emerald-500", "bg-rose-500", 
                    "bg-blue-500", "bg-purple-500", "bg-orange-500",
                    "bg-cyan-500", "bg-indigo-500"
                  ];
                  return (
                    <motion.div
                      key={disc.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-card border border-border/40 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground truncate pr-2">{disc.nome}</p>
                        <span className="text-xs font-bold text-amber-400">{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5">{count} tópicos · {disc.carga_horaria || 60}h</p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Sobre Tab */}
        <TabsContent value="sobre" className="mt-0 px-3 pt-4">
          <div className="space-y-4">
            <div className="bg-card border border-border/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-foreground">Sobre o {semestreNum}º Semestre</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O {semestreNum}º semestre do curso de Direito da {universidade?.nome || "universidade"} abrange {disciplinas?.length || 0} disciplinas 
                fundamentais com um total de {totalTopicos} tópicos de estudo.
              </p>
            </div>

            <div className="bg-card border border-border/40 rounded-xl p-5">
              <h4 className="text-sm font-bold text-foreground mb-3">Informações</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Universidade</span>
                  <span className="text-sm font-semibold text-foreground">{universidade?.sigla || "—"}</span>
                </div>
                <div className="h-px bg-border/30" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Semestre</span>
                  <span className="text-sm font-semibold text-foreground">{semestreNum}º</span>
                </div>
                <div className="h-px bg-border/30" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Disciplinas</span>
                  <span className="text-sm font-semibold text-foreground">{disciplinas?.length || 0}</span>
                </div>
                <div className="h-px bg-border/30" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total de tópicos</span>
                  <span className="text-sm font-semibold text-foreground">{totalTopicos}</span>
                </div>
                <div className="h-px bg-border/30" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Carga horária estimada</span>
                  <span className="text-sm font-semibold text-foreground">
                    {disciplinas?.reduce((acc, d) => acc + (d.carga_horaria || 60), 0) || 0}h
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FaculdadeSemestre;
