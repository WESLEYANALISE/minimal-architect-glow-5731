import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, User, Loader2, Clock, Users, Calendar, Trophy, ChevronLeft, ChevronRight, Landmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ========= CACHE E FALLBACK DE FOTOS ========= */
const INSTITUTIONAL_REGEX = /^(Senado Federal|Câmara dos Deputados|Poder Executivo|Mesa Diretora|Congresso Nacional|Presidência da República)/i;
const photoCache = new Map<string, string | null>();

function isInstitutional(nome: string) {
  return INSTITUTIONAL_REGEX.test(nome);
}

async function buscarFotoAutor(nome: string): Promise<string | null> {
  if (photoCache.has(nome)) return photoCache.get(nome) || null;
  try {
    const { data, error } = await supabase.functions.invoke('buscar-deputados', {
      body: { nome }
    });
    if (!error) {
      const url = (data as any)?.deputados?.[0]?.urlFoto as string | undefined;
      const result = url || null;
      photoCache.set(nome, result);
      return result;
    }
  } catch (_) { /* silencioso */ }
  photoCache.set(nome, null);
  return null;
}

/* Componente de foto do autor com fallback dinâmico */
function AutorFoto({ foto, nome, className = "w-full h-full" }: { foto: string | null; nome: string; className?: string }) {
  const [currentFoto, setCurrentFoto] = useState<string | null>(foto);
  const [error, setError] = useState(false);

  useEffect(() => {
    setCurrentFoto(foto);
    setError(false);
  }, [foto, nome]);

  useEffect(() => {
    if (!currentFoto && nome && !isInstitutional(nome)) {
      buscarFotoAutor(nome).then(url => {
        if (url) setCurrentFoto(url);
      });
    }
  }, [currentFoto, nome]);

  if (isInstitutional(nome)) {
    return (
      <div className={`${className} flex items-center justify-center bg-amber-900/30`}>
        <Landmark className="w-5 h-5 text-amber-400/60" />
      </div>
    );
  }

  if (currentFoto && !error) {
    return <img src={currentFoto} alt={nome} className={`${className} object-cover`} loading="lazy" onError={() => setError(true)} />;
  }

  return (
    <div className={`${className} flex items-center justify-center`}>
      <User className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function formatarDataDestaque(iso: string) {
  try {
    const d = new Date(iso);
    return {
      dia: format(d, "dd", { locale: ptBR }),
      mes: format(d, "MMM", { locale: ptBR }),
      hora: format(d, "HH:mm", { locale: ptBR }),
    };
  } catch {
    return null;
  }
}

const SIGLA_LABELS: Record<string, string> = {
  PL: "Projetos de Lei",
  PEC: "Emendas à Constituição",
  MPV: "Medidas Provisórias",
  PLP: "Leis Complementares",
  PDC: "Decretos Legislativos",
  PRC: "Resoluções da Câmara",
};

const SIGLA_INFO: Record<string, { slides: { title: string; desc: string }[] }> = {
  PL: {
    slides: [
      { title: "O que é um PL?", desc: "Projeto de Lei é uma proposta de criação de nova lei ordinária, apresentada por deputados, senadores ou pelo Executivo." },
      { title: "Como tramita?", desc: "O PL passa por comissões temáticas, recebe pareceres e relatórios antes de ir à votação no Plenário da Câmara." },
      { title: "Quem pode propor?", desc: "Deputados, senadores, o Presidente, o STF, tribunais superiores, o PGR e cidadãos (iniciativa popular)." },
      { title: "Aprovação", desc: "Necessita maioria simples (mais da metade dos presentes) para ser aprovado em ambas as casas legislativas." },
    ],
  },
  PEC: {
    slides: [
      { title: "O que é uma PEC?", desc: "Proposta de Emenda à Constituição busca alterar o texto constitucional, exigindo quórum qualificado." },
      { title: "Quórum especial", desc: "Exige aprovação de 3/5 dos membros (308 deputados e 49 senadores) em dois turnos de votação." },
      { title: "Limitações", desc: "Não pode abolir cláusulas pétreas: forma federativa, voto secreto, separação de poderes e direitos fundamentais." },
      { title: "Quem propõe?", desc: "1/3 dos deputados ou senadores, o Presidente da República, ou mais da metade das Assembleias Legislativas." },
    ],
  },
  MPV: {
    slides: [
      { title: "Medida Provisória", desc: "Ato do Presidente com força de lei imediata, usado em casos de relevância e urgência." },
      { title: "Prazo de validade", desc: "Tem validade de 60 dias, prorrogáveis por mais 60. Se não votada, perde a eficácia." },
      { title: "Trancamento de pauta", desc: "Após 45 dias sem votação, a MPV tranca a pauta do Plenário até ser apreciada." },
      { title: "Conversão em lei", desc: "O Congresso pode aprovar, rejeitar ou modificar a MPV, convertendo-a em lei ordinária." },
    ],
  },
  PLP: {
    slides: [
      { title: "Lei Complementar", desc: "Regulamenta dispositivos constitucionais que exigem norma específica para sua aplicação." },
      { title: "Maioria absoluta", desc: "Diferente do PL, exige maioria absoluta (257 deputados e 41 senadores) para aprovação." },
      { title: "Quando é usada?", desc: "Para temas como código tributário, organização do MP, normas de finanças públicas e outros previstos na CF." },
      { title: "Hierarquia", desc: "Está entre a Constituição e as leis ordinárias na hierarquia normativa brasileira." },
    ],
  },
  PDC: {
    slides: [
      { title: "Decreto Legislativo", desc: "Instrumento exclusivo do Congresso para matérias de sua competência privativa." },
      { title: "Sem sanção", desc: "Não depende de sanção do Presidente da República, sendo promulgado pelo Congresso." },
      { title: "Usos comuns", desc: "Ratificar tratados internacionais, sustar atos do Executivo e autorizar referendos." },
    ],
  },
  PRC: {
    slides: [
      { title: "Resolução da Câmara", desc: "Ato normativo interno que regula o funcionamento e organização da Câmara dos Deputados." },
      { title: "Abrangência", desc: "Tem efeito apenas no âmbito da Câmara, sem necessidade de aprovação do Senado." },
      { title: "Exemplos", desc: "Alteração do Regimento Interno, criação de comissões especiais e normas administrativas." },
    ],
  },
};

type TabMode = "recentes" | "por-deputado" | "por-mes" | "ranking";

const MESES_NOMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const CamaraProposicoesLista = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get("tipo") || "PL";
  const [tab, setTab] = useState<TabMode>("recentes");
  const [slideIndex, setSlideIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const { data: proposicoes, isLoading } = useQuery({
    queryKey: ["proposicoes-cache", tipo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cache_proposicoes_recentes")
        .select("*")
        .eq("sigla_tipo", tipo)
        .order("data_apresentacao", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data || [];
    },
  });

  const slides = SIGLA_INFO[tipo]?.slides || SIGLA_INFO.PL.slides;

  // Agrupar por deputado
  const porDeputado = useMemo(() => {
    if (!proposicoes) return [];
    const map = new Map<string, { nome: string; foto: string | null; partido: string | null; uf: string | null; count: number; proposicoes: typeof proposicoes }>();
    for (const p of proposicoes) {
      const nome = p.autor_principal_nome || "Autor não identificado";
      const existing = map.get(nome);
      if (existing) {
        existing.count++;
        existing.proposicoes.push(p);
      } else {
        map.set(nome, { nome, foto: p.autor_principal_foto, partido: p.autor_principal_partido, uf: p.autor_principal_uf, count: 1, proposicoes: [p] });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [proposicoes]);

  // Agrupar por mês/ano
  const porMes = useMemo(() => {
    if (!proposicoes) return [];
    const map = new Map<string, { label: string; mes: number; ano: number; count: number; proposicoes: typeof proposicoes }>();
    for (const p of proposicoes) {
      if (!p.data_apresentacao) continue;
      const d = new Date(p.data_apresentacao);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.proposicoes.push(p);
      } else {
        map.set(key, {
          label: `${MESES_NOMES[d.getMonth()]} ${d.getFullYear()}`,
          mes: d.getMonth(),
          ano: d.getFullYear(),
          count: 1,
          proposicoes: [p],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.ano - a.ano || b.mes - a.mes);
  }, [proposicoes]);

  const label = SIGLA_LABELS[tipo] || tipo;

  const tabs: { id: TabMode; label: string; icon: any }[] = [
    { id: "recentes", label: "Recentes", icon: Clock },
    { id: "por-deputado", label: "Por Deputado", icon: Users },
    { id: "por-mes", label: "Por Mês", icon: Calendar },
    { id: "ranking", label: "Ranking Geral", icon: Trophy },
  ];

  const handleSlide = (dir: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, slideIndex + dir));
    setSlideIndex(next);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <button onClick={() => navigate("/camara-deputados/proposicoes")} className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{label}</h1>
            <p className="text-[11px] text-muted-foreground -mt-0.5">{tipo} • {proposicoes?.length || 0} proposições</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Carrossel educativo */}
        <div className="relative px-4 pt-4 pb-2">
          <div className="relative bg-gradient-to-br from-amber-900/40 via-amber-950/60 to-background rounded-2xl overflow-hidden border border-amber-800/30">
            <div className="p-5 min-h-[120px] flex flex-col justify-center">
              <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-1">
                {slideIndex + 1}/{slides.length} • Saiba mais
              </p>
              <h3 className="text-base font-bold text-foreground mb-1.5">{slides[slideIndex].title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{slides[slideIndex].desc}</p>
            </div>

            {/* Navigation dots */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${i === slideIndex ? "w-5 bg-amber-400" : "w-1.5 bg-amber-400/30"}`}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleSlide(-1)} disabled={slideIndex === 0} className="p-1.5 rounded-lg bg-amber-500/20 disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5 text-amber-300" />
                </button>
                <button onClick={() => handleSlide(1)} disabled={slideIndex === slides.length - 1} className="p-1.5 rounded-lg bg-amber-500/20 disabled:opacity-30">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    tab === t.id
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10"
                      : "bg-card/60 text-muted-foreground border border-border/30 hover:bg-card"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-3" />
              <p className="text-sm">Carregando proposições...</p>
            </div>
          ) : !proposicoes || proposicoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FileText className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">Nenhuma proposição encontrada</p>
            </div>
          ) : tab === "recentes" ? (
            <RecentesTab proposicoes={proposicoes} tipo={tipo} navigate={navigate} />
          ) : tab === "por-deputado" ? (
            <DeputadoTab deputados={porDeputado} tipo={tipo} navigate={navigate} />
          ) : tab === "por-mes" ? (
            <PorMesTab meses={porMes} tipo={tipo} navigate={navigate} />
          ) : (
            <RankingTab deputados={porDeputado} tipo={tipo} navigate={navigate} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ========= ABA RECENTES ========= */
function RecentesTab({ proposicoes, tipo, navigate }: { proposicoes: any[]; tipo: string; navigate: any }) {
  return (
    <div className="space-y-2">
      {proposicoes.map((p, i) => (
        <ProposicaoItem key={p.id} p={p} i={i} navigate={navigate} />
      ))}
    </div>
  );
}

/* ========= ABA POR DEPUTADO ========= */
function DeputadoTab({ deputados, tipo, navigate }: { deputados: any[]; tipo: string; navigate: any }) {
  return (
    <div className="space-y-3">
      {deputados.map((dep, i) => (
        <DeputadoCard key={dep.nome} dep={dep} tipo={tipo} i={i} navigate={navigate} />
      ))}
    </div>
  );
}

/* ========= ABA POR MÊS ========= */
function PorMesTab({ meses, tipo, navigate }: { meses: any[]; tipo: string; navigate: any }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {meses.map((m) => {
        const key = `${m.ano}-${m.mes}`;
        const isOpen = expanded === key;
        return (
          <div key={key} className="rounded-xl bg-card/50 overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : key)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-card transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 flex flex-col items-center justify-center rounded-lg bg-amber-600/20 border border-amber-500/30 py-1.5 px-2">
                  <span className="text-sm font-bold text-amber-400 leading-none">{MESES_NOMES[m.mes]}</span>
                  <span className="text-[10px] text-amber-300">{m.ano}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{m.label}</p>
                  <p className="text-[11px] text-muted-foreground">{m.count} proposições</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>
            {isOpen && (
              <div className="border-t border-border/20 divide-y divide-border/20">
                {m.proposicoes.slice(0, 20).map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/camara-deputados/proposicao/${p.id_proposicao}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-card transition-colors"
                  >
                    <div className="shrink-0 w-10 h-11 rounded-lg overflow-hidden bg-muted">
                      <AutorFoto foto={p.autor_principal_foto} nome={p.autor_principal_nome || ""} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground line-clamp-1">{p.titulo_gerado_ia || `${p.sigla_tipo} ${p.numero}/${p.ano}`}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{p.autor_principal_nome}</p>
                    </div>
                    <span className="text-[9px] font-semibold text-white px-1.5 py-0.5 rounded bg-amber-600 shrink-0">
                      {p.sigla_tipo} {p.numero}
                    </span>
                  </button>
                ))}
                {m.proposicoes.length > 20 && (
                  <p className="text-[10px] text-muted-foreground text-center py-2">+{m.proposicoes.length - 20} mais</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ========= ABA RANKING GERAL ========= */
function RankingTab({ deputados, tipo, navigate }: { deputados: any[]; tipo: string; navigate: any }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground pb-1">Ranking de {tipo}s apresentados desde o início do mandato (2023)</p>
      {deputados.map((dep, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
        return (
          <div
            key={dep.nome}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors animate-fade-in ${
              i < 3 ? "bg-amber-500/10 border border-amber-500/20" : "bg-card/50"
            }`}
            style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s`, animationFillMode: 'backwards' }}
          >
            {/* Position */}
            <div className="w-8 shrink-0 flex items-center justify-center">
              {medal ? (
                <span className="text-xl">{medal}</span>
              ) : (
                <span className="text-sm font-bold text-muted-foreground">{i + 1}º</span>
              )}
            </div>

            {/* Photo */}
            <div className="shrink-0 w-11 h-13 rounded-lg overflow-hidden bg-muted">
              <AutorFoto foto={dep.foto} nome={dep.nome} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{dep.nome}</p>
              {dep.partido && dep.uf && (
                <p className="text-[11px] text-muted-foreground">{dep.partido}/{dep.uf}</p>
              )}
            </div>

            {/* Count */}
            <div className="shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/30">
              <span className="text-lg font-bold text-amber-400 leading-none">{dep.count}</span>
              <span className="text-[9px] text-amber-300">{tipo}s</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========= ITEM DE PROPOSIÇÃO (reutilizável) ========= */
function ProposicaoItem({ p, i, navigate }: { p: any; i: number; navigate: any }) {
  const dataInfo = p.data_apresentacao ? formatarDataDestaque(p.data_apresentacao) : null;

  return (
    <button
      onClick={() => navigate(`/camara-deputados/proposicao/${p.id_proposicao}`)}
      className="w-full flex gap-3 p-3 rounded-xl bg-card/50 hover:bg-card transition-colors text-left group animate-fade-in"
      style={{ animationDelay: `${Math.min(i * 0.03, 0.4)}s`, animationFillMode: 'backwards' }}
    >
      {dataInfo && (
        <div className="shrink-0 w-14 flex flex-col items-center justify-center rounded-lg bg-amber-600/20 border border-amber-500/30 px-1 py-1.5">
          <span className="text-lg font-bold text-amber-400 leading-none">{dataInfo.dia}</span>
          <span className="text-[9px] font-semibold text-amber-300 uppercase">{dataInfo.mes}</span>
          <span className="text-[10px] font-bold text-foreground mt-0.5">{dataInfo.hora}</span>
        </div>
      )}

      <div className="shrink-0 w-14 h-[60px] rounded-lg overflow-hidden bg-muted">
        <AutorFoto foto={p.autor_principal_foto} nome={p.autor_principal_nome || ""} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
            {p.titulo_gerado_ia || `${p.sigla_tipo} ${p.numero}/${p.ano}`}
          </p>
          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{p.ementa}</p>
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[9px] font-semibold text-white px-1.5 py-0.5 rounded bg-amber-600">
            {p.sigla_tipo} {p.numero}/{p.ano}
          </span>
          {p.autor_principal_nome && (
            <span className="text-[10px] text-muted-foreground truncate">
              {p.autor_principal_nome}
              {p.autor_principal_partido && p.autor_principal_uf ? ` · ${p.autor_principal_partido}/${p.autor_principal_uf}` : ""}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ========= CARD DE DEPUTADO (reutilizável) ========= */
function DeputadoCard({ dep, tipo, i, navigate }: { dep: any; tipo: string; i: number; navigate: any }) {
  return (
    <div
      className="rounded-xl bg-card/50 overflow-hidden animate-fade-in"
      style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-center gap-3 p-3 border-b border-border/30">
        <div className="shrink-0 w-12 h-14 rounded-lg overflow-hidden bg-muted">
          <AutorFoto foto={dep.foto} nome={dep.nome} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{dep.nome}</p>
          {dep.partido && dep.uf && <p className="text-[11px] text-muted-foreground">{dep.partido}/{dep.uf}</p>}
        </div>
        <div className="shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/30">
          <span className="text-lg font-bold text-amber-400 leading-none">{dep.count}</span>
          <span className="text-[9px] text-amber-300">{tipo}{dep.count > 1 ? "s" : ""}</span>
        </div>
      </div>
      <div className="divide-y divide-border/20">
        {dep.proposicoes.slice(0, 3).map((p: any) => (
          <button
            key={p.id}
            onClick={() => navigate(`/camara-deputados/proposicao/${p.id_proposicao}`)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-card transition-colors"
          >
            <span className="text-[9px] font-semibold text-white px-1.5 py-0.5 rounded bg-amber-600 shrink-0">
              {p.sigla_tipo} {p.numero}/{p.ano}
            </span>
            <p className="text-xs text-foreground line-clamp-1 flex-1 min-w-0">{p.titulo_gerado_ia || p.ementa}</p>
          </button>
        ))}
        {dep.proposicoes.length > 3 && (
          <p className="text-[10px] text-muted-foreground text-center py-2">+{dep.proposicoes.length - 3} mais</p>
        )}
      </div>
    </div>
  );
}

export default CamaraProposicoesLista;
