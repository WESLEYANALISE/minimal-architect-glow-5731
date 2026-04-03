import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Lock, BookOpen, Clock, MapPin, Star, Trophy, Building2, Calendar, ChevronDown, ChevronRight, GraduationCap, Users, Scale, Award, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

import capaUsp from "@/assets/capa-usp.jpg";
import capaUnip from "@/assets/capa-unip.jpg";
import capaAnhanguera from "@/assets/capa-anhanguera.jpg";
import capaEstacio from "@/assets/capa-estacio.jpg";
import capaUninove from "@/assets/capa-uninove.jpg";
import capaUnopar from "@/assets/capa-unopar.jpg";
import capaPucsp from "@/assets/capa-pucsp.jpg";
import capaMackenzie from "@/assets/capa-mackenzie.jpg";
import capaUfmg from "@/assets/capa-ufmg.jpg";
import capaUerj from "@/assets/capa-uerj.jpg";

import capaSem1 from "@/assets/capa-semestre-1.jpg";
import capaSem2 from "@/assets/capa-semestre-2.jpg";
import capaSem3 from "@/assets/capa-semestre-3.jpg";
import capaSem4 from "@/assets/capa-semestre-4.jpg";
import capaSem5 from "@/assets/capa-semestre-5.jpg";
import capaSem6 from "@/assets/capa-semestre-6.jpg";
import capaSem7 from "@/assets/capa-semestre-7.jpg";
import capaSem8 from "@/assets/capa-semestre-8.jpg";
import capaSem9 from "@/assets/capa-semestre-9.jpg";
import capaSem10 from "@/assets/capa-semestre-10.jpg";

const CAPAS_SEMESTRE = [capaSem1, capaSem2, capaSem3, capaSem4, capaSem5, capaSem6, capaSem7, capaSem8, capaSem9, capaSem10];

const LOGOS: Record<string, string> = {
  "usp": logoUsp, "unip": logoUnip, "anhanguera": logoAnhanguera,
  "estácio": logoEstacio, "estacio": logoEstacio, "uninove": logoUninove,
  "unopar": logoUnopar, "puc-sp": logoPucsp, "mackenzie": logoMackenzie,
  "ufmg": logoUfmg, "uerj": logoUerj,
};

const CAPAS_UNI: Record<string, string> = {
  "usp": capaUsp, "unip": capaUnip, "anhanguera": capaAnhanguera,
  "estácio": capaEstacio, "estacio": capaEstacio, "uninove": capaUninove,
  "unopar": capaUnopar, "puc-sp": capaPucsp, "mackenzie": capaMackenzie,
  "ufmg": capaUfmg, "uerj": capaUerj,
};

const SOBRE_DETALHADO: Record<string, { historia: string; diferenciais: string[]; areasDestaque: string[]; exAlunos?: string[] }> = {
  "usp": {
    historia: "Fundada em 11 de agosto de 1827 por Dom Pedro I, a Faculdade de Direito do Largo de São Francisco é uma das duas primeiras escolas de Direito do Brasil. Localizada no coração de São Paulo, é berço do movimento estudantil e da cultura jurídica nacional. Seu prédio histórico no Largo de São Francisco é tombado pelo patrimônio e considerado o 'Território Livre' da democracia brasileira.",
    diferenciais: [
      "Mais antiga faculdade de Direito do Brasil (1827)",
      "Nota máxima no MEC e no Guia da Faculdade",
      "Biblioteca com mais de 300 mil volumes jurídicos",
      "Programa de mestrado e doutorado referência nacional",
      "Centro de Direitos Humanos reconhecido internacionalmente",
      "Aprovação de 90%+ dos alunos no Exame da OAB",
    ],
    areasDestaque: ["Direito Constitucional", "Direito Penal", "Direito Internacional", "Filosofia do Direito", "Direitos Humanos"],
    exAlunos: ["Rui Barbosa", "Castro Alves", "Álvares de Azevedo", "José Sarney", "Michel Temer", "Ibrahim Abi-Ackel"],
  },
  "unip": {
    historia: "A Universidade Paulista foi fundada em 1988, resultado da fusão de três instituições: o Instituto Unificado Paulista (IUP), o Instituto de Ensino de Engenharia Paulista (IEEP) e o Instituto de Odontologia de São Paulo. Hoje é uma das maiores universidades privadas do Brasil, com mais de 40 campi espalhados pelo país. O curso de Direito é um dos mais procurados da instituição.",
    diferenciais: [
      "Ampla rede com mais de 40 campi no Brasil",
      "Curso de Direito presencial e semipresencial",
      "Convênios com escritórios e tribunais para estágio",
      "Núcleo de Prática Jurídica completo",
      "Programa de monitoria e iniciação científica",
      "Mensalidades acessíveis com programas de bolsa",
    ],
    areasDestaque: ["Direito Civil", "Direito do Trabalho", "Direito Penal", "Prática Jurídica", "Direito Empresarial"],
  },
  "anhanguera": {
    historia: "A Anhanguera Educacional foi fundada em 1994 em Leme, São Paulo, e cresceu para se tornar uma das maiores redes de ensino superior do Brasil. Hoje faz parte do grupo Cogna Educação. Com centenas de polos em todo o país, democratizou o acesso ao ensino jurídico com modalidades presencial e EAD.",
    diferenciais: [
      "Presente em centenas de cidades brasileiras",
      "Metodologia prática com foco no mercado de trabalho",
      "Parcerias com escritórios de advocacia locais",
      "Plataforma digital de estudos 24h",
      "Valor de mensalidade acessível",
      "Programas PROUNI e FIES disponíveis",
    ],
    areasDestaque: ["Direito Civil", "Direito do Consumidor", "Direito Trabalhista", "Prática Forense"],
  },
  "puc-sp": {
    historia: "A Pontifícia Universidade Católica de São Paulo foi fundada em 1946 pela fusão da Faculdade de Filosofia, Ciências e Letras de São Bento e da Faculdade Paulista de Direito. É uma instituição de tradição centenária ligada à Igreja Católica. O curso de Direito é reconhecido como um dos melhores do país, especialmente em Direito Constitucional, Tributário e Processual.",
    diferenciais: [
      "Nota 5 no MEC — conceito máximo",
      "Tradição de mais de 75 anos em ensino jurídico",
      "Corpo docente com doutores renomados",
      "Programa de pós-graduação stricto sensu de excelência",
      "Clínica de Direitos Humanos internacionalmente reconhecida",
      "Alta taxa de aprovação na OAB (acima de 85%)",
    ],
    areasDestaque: ["Direito Constitucional", "Direito Tributário", "Direito Processual Civil", "Direito do Trabalho", "Direitos Humanos"],
    exAlunos: ["Celso de Mello", "Eros Grau", "Flávio Tartuce"],
  },
  "mackenzie": {
    historia: "A Faculdade de Direito da Universidade Presbiteriana Mackenzie foi criada em 1952, mas a universidade tem raízes que remontam a 1870, quando missionários presbiterianos norte-americanos fundaram a Escola Americana. O curso de Direito rapidamente se consolidou como referência em São Paulo, rivalizando com as melhores faculdades públicas do país.",
    diferenciais: [
      "Nota 5 no MEC — conceito máximo",
      "Infraestrutura de primeiro mundo no campus Higienópolis",
      "Escritório Modelo para prática jurídica real",
      "Intercâmbio com universidades nos EUA e Europa",
      "Programa de mestrado e doutorado reconhecido pela CAPES",
      "Aprovação de 80%+ dos alunos no Exame da OAB",
    ],
    areasDestaque: ["Direito Empresarial", "Direito Digital", "Direito Constitucional", "Propriedade Intelectual"],
  },
  "ufmg": {
    historia: "A Faculdade de Direito da UFMG foi fundada em 1892, sendo uma das mais antigas de Minas Gerais. Integra a Universidade Federal de Minas Gerais desde 1927. Reconhecida pela excelência em pesquisa e extensão, formou importantes nomes do Direito e da política brasileira. Seu corpo docente inclui pesquisadores de renome internacional.",
    diferenciais: [
      "Universidade pública e gratuita de excelência",
      "Nota 5 no MEC e conceito CAPES 7 na pós-graduação",
      "Mais de 130 anos de tradição jurídica",
      "Centro de Estudos de Direito Internacional reconhecido",
      "Biblioteca jurídica com acervo raro e histórico",
      "Forte atuação em pesquisa e extensão comunitária",
    ],
    areasDestaque: ["Direito Internacional", "Direito Constitucional", "Teoria do Direito", "Direito Ambiental"],
  },
  "uerj": {
    historia: "A Faculdade de Direito da UERJ foi estabelecida em 1950, como parte da então Universidade do Distrito Federal. Com a transferência da capital para Brasília, a universidade permaneceu no Rio de Janeiro e se consolidou como referência. O campus Maracanã é um dos mais icônicos do Brasil, com seu prédio modernista de 12 andares.",
    diferenciais: [
      "Universidade pública estadual de excelência",
      "Nota 5 no MEC — conceito máximo",
      "Programa de cotas pioneiro no Brasil (2003)",
      "Mestrado e doutorado com conceito CAPES 6",
      "Clínica de Direitos Fundamentais (CLÍNICA UERJ Direitos)",
      "Forte tradição em Direito Público e formação de magistrados",
    ],
    areasDestaque: ["Direito Administrativo", "Direito Constitucional", "Direito Público", "Direito Civil"],
  },
};

function getAssetForUni(nome: string, map: Record<string, string>): string | null {
  const key = nome.toLowerCase().trim();
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

const FaculdadeInicio = () => {
  const navigate = useNavigate();
  const { universidadeId } = useParams<{ universidadeId: string }>();
  const uniId = parseInt(universidadeId || "1");

  const { data: universidade } = useQuery({
    queryKey: ["faculdade-universidade", uniId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculdade_universidades")
        .select("*")
        .eq("id", uniId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: disciplinas } = useQuery({
    queryKey: ["faculdade-disciplinas-all", uniId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculdade_disciplinas")
        .select("id, nome, semestre, ativo")
        .eq("universidade_id", uniId)
        .order("semestre")
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: topicosCount } = useQuery({
    queryKey: ["faculdade-topicos-count-semestre", uniId],
    queryFn: async () => {
      const counts: Record<number, number> = {};
      const { data: discs } = await supabase
        .from("faculdade_disciplinas")
        .select("id, semestre")
        .eq("universidade_id", uniId)
        .eq("ativo", true);
      if (!discs || discs.length === 0) return counts;
      const { data: topicos } = await supabase
        .from("faculdade_topicos")
        .select("disciplina_id")
        .in("disciplina_id", discs.map(d => d.id));
      if (!topicos) return counts;
      const map = new Map(discs.map(d => [d.id, d.semestre]));
      for (const t of topicos) {
        const sem = map.get(t.disciplina_id);
        if (sem) counts[sem] = (counts[sem] || 0) + 1;
      }
      return counts;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const disciplinasPorSemestre: Record<number, typeof disciplinas> = {};
  const semCount: Record<number, number> = {};
  for (const d of (disciplinas || [])) {
    if (!disciplinasPorSemestre[d.semestre]) disciplinasPorSemestre[d.semestre] = [];
    disciplinasPorSemestre[d.semestre]!.push(d);
    semCount[d.semestre] = (semCount[d.semestre] || 0) + 1;
  }

  const disciplinaFrequency: Record<string, number> = {};
  for (const d of (disciplinas || [])) {
    const nome = d.nome.trim();
    disciplinaFrequency[nome] = (disciplinaFrequency[nome] || 0) + 1;
  }
  const raioXSorted = Object.entries(disciplinaFrequency).sort((a, b) => b[1] - a[1]).slice(0, 20);

  const totalSemestres = universidade?.total_semestres || 10;
  const semestres = Array.from({ length: totalSemestres }, (_, i) => i + 1);
  const logo = universidade ? getAssetForUni(universidade.nome, LOGOS) : null;
  const capaUni = universidade ? getAssetForUni(universidade.nome, CAPAS_UNI) : null;
  const uni = universidade as any;
  const sobreKey = universidade ? universidade.nome.toLowerCase().replace('-', '').replace(' ', '') : '';
  const sobre = Object.entries(SOBRE_DETALHADO).find(([k]) => sobreKey.includes(k) || k.includes(sobreKey))?.[1];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-background to-background pointer-events-none" />

      <div className="flex-1 px-4 md:px-6 py-5 md:py-8 space-y-4 relative">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-lg font-bold text-foreground leading-tight">{universidade?.nome || 'Faculdade'}</h1>
        </div>

        {/* Cover Banner */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl animate-fade-in" style={{ minHeight: 180 }}>
          {capaUni ? (
            <img src={capaUni} alt={universidade?.nome_completo || ''} className="w-full h-[180px] object-cover" />
          ) : (
            <div className="w-full h-[180px] bg-gradient-to-br from-red-900 to-red-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {logo && (
            <div className="absolute top-3 right-3 w-14 h-14 rounded-xl bg-white/90 p-1.5 shadow-lg">
              <img src={logo} alt={universidade?.nome || ''} className="w-full h-full object-contain" />
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>Grade Curricular</span>
            </div>
            <p className="text-white font-bold text-base">{universidade?.nome_completo || ''}</p>
            <div className="flex items-center gap-3 mt-1 text-white/60 text-xs">
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{totalSemestres} semestres</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{universidade?.duracao_anos || 5} anos</span>
              {uni?.cidade && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{uni.cidade}/{uni.estado}</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="semestres" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="semestres" className="text-xs">Semestres</TabsTrigger>
            <TabsTrigger value="grade" className="text-xs">Grade</TabsTrigger>
            <TabsTrigger value="raio-x" className="text-xs">Raio-X</TabsTrigger>
            <TabsTrigger value="sobre" className="text-xs">Sobre</TabsTrigger>
          </TabsList>

          {/* === SEMESTRES TAB === */}
          <TabsContent value="semestres" className="mt-4">
            <div className="space-y-2.5 animate-fade-in">
              {semestres.map((semestreNum) => {
                const totalTopicos = topicosCount?.[semestreNum] || 0;
                const totalDisciplinas = semCount[semestreNum] || 0;
                const ativo = totalDisciplinas > 0;
                const capa = CAPAS_SEMESTRE[(semestreNum - 1) % CAPAS_SEMESTRE.length];

                return (
                  <Card
                    key={semestreNum}
                    className={`overflow-hidden transition-all border-l-4 ${
                      ativo
                        ? "cursor-pointer hover:scale-[1.01] hover:shadow-md border-l-amber-500/60 border-border/40"
                        : "opacity-50 border-l-muted border-border/20"
                    }`}
                    onClick={() => ativo && navigate(`/faculdade/universidade/${uniId}/semestre/${semestreNum}`)}
                  >
                    <CardContent className="p-0 flex items-stretch">
                      {/* Semester cover */}
                      <div className="w-16 flex-shrink-0 relative overflow-hidden">
                        <img src={capa} alt={`${semestreNum}º Semestre`} className="absolute inset-0 w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 p-3 flex items-center gap-3 min-w-0">
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <span className="text-base font-bold text-amber-400">{semestreNum}º Semestre</span>
                          <p className="text-xs text-muted-foreground">{totalDisciplinas} disciplinas</p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {totalTopicos} tópicos
                            </span>
                          </div>
                        </div>
                        {ativo ? (
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">Em breve</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* === GRADE CURRICULAR TAB === */}
          <TabsContent value="grade" className="mt-4">
            <div className="space-y-2">
              {semestres.map((sem) => {
                const discs = disciplinasPorSemestre[sem] || [];
                if (discs.length === 0) return null;
                return <GradeSemestreCollapsible key={sem} semestre={sem} disciplinas={discs} />;
              })}
            </div>
          </TabsContent>

          {/* === RAIO-X TAB === */}
          <TabsContent value="raio-x" className="mt-4">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Disciplinas que mais aparecem na grade curricular:</p>
              {raioXSorted.map(([nome, count], i) => {
                const maxCount = raioXSorted[0]?.[1] || 1;
                const pct = (count / maxCount) * 100;
                return (
                  <div key={nome} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate pr-2">{nome}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{count}x</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.05, duration: 0.5 }} className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" />
                    </div>
                  </div>
                );
              })}
              {raioXSorted.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">Nenhuma disciplina cadastrada ainda.</p>}
            </div>
          </TabsContent>

          {/* === SOBRE TAB === */}
          <TabsContent value="sobre" className="mt-4">
            <div className="space-y-5">
              {/* História */}
              {sobre?.historia && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-foreground">História</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{sobre.historia}</p>
                </div>
              )}

              {/* Info Cards Grid */}
              <div className="grid grid-cols-2 gap-3">
                {uni?.fundacao && <InfoCard icon={<Calendar className="w-4 h-4 text-amber-400" />} label="Fundação" value={String(uni.fundacao)} />}
                {uni?.tipo && <InfoCard icon={<Building2 className="w-4 h-4 text-amber-400" />} label="Tipo" value={uni.tipo === 'pública' ? 'Pública' : 'Privada'} />}
                {uni?.nota_mec && <InfoCard icon={<Star className="w-4 h-4 text-amber-400" />} label="Nota MEC" value={String(uni.nota_mec)} />}
                {uni?.ranking_nacional && <InfoCard icon={<Trophy className="w-4 h-4 text-amber-400" />} label="Ranking" value={`#${uni.ranking_nacional} Nacional`} />}
                {uni?.cidade && <InfoCard icon={<MapPin className="w-4 h-4 text-amber-400" />} label="Localização" value={`${uni.cidade}/${uni.estado}`} />}
                <InfoCard icon={<BookOpen className="w-4 h-4 text-amber-400" />} label="Duração" value={`${universidade?.duracao_anos || 5} anos (${totalSemestres} sem.)`} />
              </div>

              {/* Diferenciais */}
              {sobre?.diferenciais && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-foreground">Diferenciais</h3>
                  </div>
                  <div className="space-y-1.5">
                    {sobre.diferenciais.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Áreas de Destaque */}
              {sobre?.areasDestaque && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-foreground">Áreas de Destaque</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sobre.areasDestaque.map((area, i) => (
                      <span key={i} className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">{area}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ex-alunos ilustres */}
              {sobre?.exAlunos && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-foreground">Ex-alunos Ilustres</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sobre.exAlunos.map((nome, i) => (
                      <span key={i} className="text-xs bg-card border border-border/40 text-foreground px-2.5 py-1 rounded-full">{nome}</span>
                    ))}
                  </div>
                </div>
              )}

              {!sobre && !uni?.descricao && (
                <div className="text-center py-10 space-y-2">
                  <Info className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Informações detalhadas em breve.</p>
                </div>
              )}

              {/* Fallback: just description from DB if no local sobre */}
              {!sobre && uni?.descricao && (
                <p className="text-sm text-muted-foreground leading-relaxed">{uni.descricao}</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border/40 rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function GradeSemestreCollapsible({ semestre, disciplinas }: { semestre: number; disciplinas: { id: number; nome: string }[] }) {
  const [open, setOpen] = useState(false);

  // Fetch topics for all disciplines in this semester
  const discIds = disciplinas.map(d => d.id);
  const { data: topicos } = useQuery({
    queryKey: ["faculdade-topicos-grade", semestre, discIds],
    queryFn: async () => {
      if (discIds.length === 0) return [];
      const { data, error } = await supabase
        .from("faculdade_topicos")
        .select("id, disciplina_id, titulo, complemento, ordem")
        .in("disciplina_id", discIds)
        .order("ordem");
      if (error) throw error;
      return data || [];
    },
    enabled: open, // Only fetch when semester is expanded
  });

  // Group topics by discipline
  const topicosPorDisc: Record<number, typeof topicos> = {};
  for (const t of (topicos || [])) {
    if (!topicosPorDisc[t.disciplina_id]) topicosPorDisc[t.disciplina_id] = [];
    topicosPorDisc[t.disciplina_id]!.push(t);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-card border border-border/40 rounded-xl hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-amber-400">{semestre}º</span>
          <span className="text-sm font-medium text-foreground">Semestre</span>
          <span className="text-xs text-muted-foreground">({disciplinas.length} disciplinas)</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 ml-2 space-y-1">
        {disciplinas.map((d) => {
          const discTopicos = topicosPorDisc[d.id] || [];
          return (
            <DisciplinaCollapsible key={d.id} disciplina={d} topicos={discTopicos} />
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

function DisciplinaCollapsible({ disciplina, topicos }: { disciplina: { id: number; nome: string }; topicos: { id: number; titulo: string; complemento: string | null; ordem: number }[] }) {
  const [open, setOpen] = useState(false);
  const hasTopicos = topicos.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between py-2.5 px-3 text-sm border-l-2 border-amber-500/30 hover:bg-accent/30 transition-colors rounded-r-lg">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-foreground text-left truncate">{disciplina.nome}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {hasTopicos && (
            <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
              {topicos.length} tópicos
            </span>
          )}
          {hasTopicos && (open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />)}
        </div>
      </CollapsibleTrigger>
      {hasTopicos && (
        <CollapsibleContent className="ml-5 border-l border-amber-500/20 pl-3 py-1">
          {topicos.map((t, i) => (
            <div key={t.id} className="flex gap-2 py-1.5 text-xs">
              <span className="text-amber-400/70 font-medium flex-shrink-0 w-5 text-right">{i + 1}.</span>
              <div className="min-w-0">
                <span className="text-foreground/80">{t.titulo}</span>
                {t.complemento && <span className="text-muted-foreground ml-1">— {t.complemento}</span>}
              </div>
            </div>
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export default FaculdadeInicio;
