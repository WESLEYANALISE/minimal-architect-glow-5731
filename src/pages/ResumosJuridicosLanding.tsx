import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, NotebookPen, Lightbulb, ChevronRight, ChevronDown, BarChart3, Grid3X3, Info, Scale } from "lucide-react";
import StandardPageHeader from "@/components/StandardPageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useResumosCount } from "@/hooks/useResumosCount";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ImagensCarousel from "@/components/ui/ImagensCarousel";

import capaResumosJuridicos from "@/assets/capa-resumos-juridicos.jpg";
import capaConceitos from "@/assets/capa-resumo-conceitos.jpg";
import capaCornell from "@/assets/capa-resumo-cornell.jpg";
import capaFeynman from "@/assets/capa-resumo-feynman.jpg";

const METODOS = [
  {
    id: 1,
    title: "Resumo de Conceitos",
    description: "Por área e tema do Direito",
    icon: BookOpen,
    route: "/resumos-juridicos/prontos",
    bgClass: "bg-gradient-to-br from-red-500 to-red-700",
    capa: capaConceitos,
    metodoKey: "conceitos" as const,
  },
  {
    id: 2,
    title: "Resumo Cornell",
    description: "Anotações, Palavras-Chave e Resumo",
    icon: NotebookPen,
    route: "/metodologias/cornell",
    bgClass: "bg-gradient-to-br from-blue-600 to-indigo-700",
    capa: capaCornell,
    metodoKey: "cornell" as const,
  },
  {
    id: 3,
    title: "Resumo Feynman",
    description: "Aprenda explicando de forma simples",
    icon: Lightbulb,
    route: "/metodologias/feynman",
    bgClass: "bg-gradient-to-br from-amber-500 to-orange-600",
    capa: capaFeynman,
    metodoKey: "feynman" as const,
  },
];

const SOBRE_METODOS = [
  {
    titulo: "Resumo de Conceitos",
    icon: BookOpen,
    bgClass: "bg-gradient-to-br from-red-500 to-red-700",
    descricao: "Resumos organizados por área e tema do Direito, trazendo os principais conceitos, definições e fundamentos de cada matéria jurídica.",
    como: "Cada resumo aborda um tema específico dentro de uma área do Direito, apresentando definições, características, classificações e aplicações práticas.",
    ideal: "Para quem está começando a estudar um tema ou precisa revisar conceitos fundamentais de forma rápida e objetiva.",
  },
  {
    titulo: "Método Cornell",
    icon: NotebookPen,
    bgClass: "bg-gradient-to-br from-blue-600 to-indigo-700",
    descricao: "Divide a página em três seções: Anotações principais, Palavras-chave e um Resumo final. Criado na Universidade de Cornell nos anos 1950.",
    como: "Na coluna da direita ficam as anotações detalhadas. Na coluna da esquerda, palavras-chave e perguntas que servem como gatilhos de memória. Na parte inferior, um resumo em suas próprias palavras.",
    ideal: "Para revisão ativa — ao cobrir as anotações e tentar responder usando apenas as palavras-chave, você exercita a memória de longa duração.",
  },
  {
    titulo: "Técnica Feynman",
    icon: Lightbulb,
    bgClass: "bg-gradient-to-br from-amber-500 to-orange-600",
    descricao: "Inspirada no físico Richard Feynman, consiste em explicar um conceito de forma tão simples que até uma criança entenderia.",
    como: "O resumo apresenta o conceito complexo, seguido de uma explicação simplificada, analogias do dia a dia e exemplos práticos para fixação.",
    ideal: "Para identificar lacunas no conhecimento — se você não consegue explicar algo de forma simples, é sinal de que precisa estudar mais.",
  },
];

async function fetchResumoAreas() {
  let allData: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase.from("RESUMO").select("area").not("area", "is", null).range(offset, offset + batchSize - 1);
    if (error) throw error;
    if (data && data.length > 0) { allData = [...allData, ...data]; offset += batchSize; hasMore = data.length === batchSize; } else { hasMore = false; }
  }
  return allData;
}

async function fetchMetodologiaAreas(metodo: string) {
  let allData: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase.from("METODOLOGIAS_GERADAS").select("area").eq("metodo", metodo).not("area", "is", null).range(offset, offset + batchSize - 1);
    if (error) throw error;
    if (data && data.length > 0) { allData = [...allData, ...data]; offset += batchSize; hasMore = data.length === batchSize; } else { hasMore = false; }
  }
  return allData;
}

async function fetchResumoAreaTemas() {
  let allData: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase.from("RESUMO").select("area, tema").not("area", "is", null).not("tema", "is", null).range(offset, offset + batchSize - 1);
    if (error) throw error;
    if (data && data.length > 0) { allData = [...allData, ...data]; offset += batchSize; hasMore = data.length === batchSize; } else { hasMore = false; }
  }
  return allData;
}

async function fetchMetodologiaAreaTemas(metodo: string) {
  let allData: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase.from("METODOLOGIAS_GERADAS").select("area, tema").eq("metodo", metodo).not("area", "is", null).not("tema", "is", null).range(offset, offset + batchSize - 1);
    if (error) throw error;
    if (data && data.length > 0) { allData = [...allData, ...data]; offset += batchSize; hasMore = data.length === batchSize; } else { hasMore = false; }
  }
  return allData;
}

export default function ResumosJuridicosLanding() {
  const navigate = useNavigate();
  const { totalResumos, resumosMateria, resumosCornell, resumosFeynman } = useResumosCount();

  const counts: Record<number, number> = {
    1: resumosMateria,
    2: resumosCornell,
    3: resumosFeynman,
  };

  // Raio-X data for all methods combined
  const { data: raioXData } = useQuery({
    queryKey: ["resumos-raio-x-all"],
    queryFn: async () => {
      const [conceitos, cornell, feynman] = await Promise.all([
        fetchResumoAreas(),
        fetchMetodologiaAreas("cornell"),
        fetchMetodologiaAreas("feynman"),
      ]);

      const counts: Record<string, number> = {};
      [...conceitos, ...cornell, ...feynman].forEach((r: any) => {
        counts[r.area] = (counts[r.area] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 1000 * 60 * 10,
  });

  // Grade data - areas with tema counts per method
  const { data: gradeData, isLoading: gradeLoading } = useQuery({
    queryKey: ["resumos-grade-all"],
    queryFn: async () => {
      const [conceitos, cornell, feynman] = await Promise.all([
        fetchResumoAreaTemas(),
        fetchMetodologiaAreaTemas("cornell"),
        fetchMetodologiaAreaTemas("feynman"),
      ]);

      const areasMap: Record<string, Set<string>> = {};
      [...conceitos, ...cornell, ...feynman].forEach((r: any) => {
        if (!areasMap[r.area]) areasMap[r.area] = new Set();
        areasMap[r.area].add(r.tema);
      });

      return Object.entries(areasMap)
        .map(([area, temas]) => ({ area, temas: Array.from(temas).sort(), count: temas.size }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 1000 * 60 * 10,
  });

  const totalRaioX = raioXData?.reduce((s, r) => s + r.count, 0) || 0;
  const maxRaioX = raioXData?.[0]?.count || 1;

  const BAR_COLORS = [
    "bg-red-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500",
    "bg-violet-500", "bg-pink-500", "bg-teal-500", "bg-orange-500",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-background to-background pointer-events-none" />

      <StandardPageHeader
        title="Resumos Jurídicos"
        subtitle={`${totalResumos.toLocaleString("pt-BR")} resumos disponíveis`}
        backPath="/"
      />

      <div className="flex-1 px-4 md:px-6 py-2 md:py-4 space-y-4 relative max-w-2xl mx-auto w-full">

        {/* Cover Carousel */}
        <ImagensCarousel
          slides={[
            { image: capaResumosJuridicos, title: "Resumos Jurídicos 2026", subtitle: "Conteúdo atualizado e revisado. Resumos completos de todas as áreas do Direito para você estudar com eficiência." },
            { image: capaConceitos, title: "Resumo de Conceitos", subtitle: "Definições, fundamentos e classificações organizados por área. Atualizados conforme a legislação vigente." },
            { image: capaCornell, title: "Método Cornell", subtitle: "Anotações estruturadas com palavras-chave e síntese. A técnica científica mais eficaz para revisão ativa." },
            { image: capaFeynman, title: "Técnica Feynman", subtitle: "Aprenda explicando de forma simples. Identifique lacunas no conhecimento e fixe o conteúdo definitivamente." },
          ]}
          titulo="Resumos Jurídicos"
          intervalo={5000}
        />

        {/* Tabs */}
        <Tabs defaultValue="metodos" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="metodos" className="text-xs">Métodos</TabsTrigger>
            <TabsTrigger value="grade" className="text-xs gap-1">
              <Grid3X3 className="w-3 h-3" /> Grade
            </TabsTrigger>
            <TabsTrigger value="raio-x" className="text-xs gap-1">
              <BarChart3 className="w-3 h-3" /> Raio-X
            </TabsTrigger>
            <TabsTrigger value="sobre" className="text-xs gap-1">
              <Info className="w-3 h-3" /> Sobre
            </TabsTrigger>
          </TabsList>

          {/* Métodos - list of 3 methods */}
          <TabsContent value="metodos" className="mt-4">
            <div className="space-y-2.5 animate-fade-in">
              {METODOS.map((card, index) => {
                const Icon = card.icon;
                const count = counts[card.id] || 0;
                return (
                  <button
                    key={card.id}
                    onClick={() => navigate(card.route)}
                    className="w-full flex items-stretch bg-card border border-border/50 rounded-2xl overflow-hidden text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg opacity-0"
                    style={{
                      animation: "fade-in 0.4s ease-out forwards",
                      animationDelay: `${index * 80}ms`,
                    }}
                  >
                    {/* Cover image */}
                    <div className="w-[110px] shrink-0 relative overflow-hidden">
                      <img
                        src={card.capa}
                        alt={card.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className={`absolute inset-0 ${card.bgClass} opacity-40`} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                        <Icon className="w-8 h-8 text-white drop-shadow-lg relative z-10" />
                        <span className="text-[10px] font-bold text-white/90 bg-black/40 px-1.5 py-0.5 rounded-full relative z-10">2026</span>
                      </div>
                      {/* Shine */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div
                          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-20"
                          style={{
                            background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
                            animation: "shinePratique 3s ease-in-out infinite",
                            animationDelay: `${index * 400}ms`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex items-center justify-between gap-2 min-h-[110px]">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-foreground mb-1">{card.title}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{card.description}</p>
                        {count > 0 && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-amber-400" />
                            <span className="text-xs text-amber-400 font-medium">
                              {count.toLocaleString("pt-BR")} resumos
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* Grade */}
          <TabsContent value="grade" className="mt-4 animate-fade-in">
            {gradeLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !gradeData?.length ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum dado encontrado.</p>
            ) : (
              <div className="space-y-3">
                {gradeData.map((item, idx) => (
                  <details
                    key={item.area}
                    className="group bg-card/60 border border-border/30 rounded-xl overflow-hidden"
                  >
                    <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/20 transition-colors list-none">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
                          <Scale className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{item.area}</p>
                          <p className="text-[11px] text-muted-foreground">{item.count} {item.count === 1 ? "tema" : "temas"}</p>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-3 pb-3 pt-1 border-t border-border/20">
                      <div className="flex flex-wrap gap-1.5">
                        {item.temas.map((tema) => (
                          <span
                            key={tema}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-muted/40 text-foreground/80 border border-border/20"
                          >
                            {tema}
                          </span>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Raio-X */}
          <TabsContent value="raio-x" className="mt-4 animate-fade-in">
            <div className="bg-card/60 border border-border/30 rounded-2xl p-4 space-y-1 mb-4">
              <p className="text-2xl font-bold text-foreground">{totalRaioX.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">resumos disponíveis no total</p>
              <span className="inline-block mt-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">Atualizado 2026</span>
            </div>

            {raioXData && raioXData.length > 0 && (
              <div className="space-y-3">
                {raioXData.map((r, i) => {
                  const pct = Math.round((r.count / maxRaioX) * 100);
                  return (
                    <div key={r.area} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-foreground font-medium truncate max-w-[70%]">{r.area}</span>
                        <span className="text-muted-foreground">{r.count.toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${BAR_COLORS[i % BAR_COLORS.length]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Sobre */}
          <TabsContent value="sobre" className="mt-4 animate-fade-in space-y-4">
            {SOBRE_METODOS.map((info) => {
              const SIcon = info.icon;
              return (
                <div key={info.titulo} className="bg-card/60 border border-border/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${info.bgClass} flex items-center justify-center`}>
                      <SIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{info.titulo}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{info.descricao}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[11px] font-semibold text-foreground mb-0.5">Como funciona</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{info.como}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground mb-0.5">Para quem é ideal</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{info.ideal}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
