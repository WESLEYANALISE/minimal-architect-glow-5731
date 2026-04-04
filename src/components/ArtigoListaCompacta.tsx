import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, CheckCircle, BookOpen, List, ChevronDown, History, AlertTriangle, Plus, Edit, Eye, Trash2, Sparkles, X, ArrowRight, Calendar, Music, Play, Pause, Trophy, Star, Lock, Crown, StickyNote, Radar } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { extractArticleNumber } from "@/lib/utils/premiumNarration";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumeroArtigo } from "@/lib/formatNumeroArtigo";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { ArtigosFavoritosList } from "@/components/ArtigosFavoritosList";
import { PlaylistNarracaoSheet } from "@/components/PlaylistNarracaoSheet";
import { BuscaCompacta } from "@/components/BuscaCompacta";
import { sortArticles } from "@/lib/articleSorter";
import { useRadarInline } from "@/hooks/useRadarInline";
import { RaioXTimeline } from "@/components/raio-x/RaioXTimeline";
import { RaioXTimelineChart } from "@/components/raio-x/RaioXTimelineChart";

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

interface Capitulo {
  id: string;
  titulo: string;
  tipo: 'titulo' | 'capitulo' | 'secao' | 'subsecao' | 'livro' | 'parte';
  artigos: Article[];
  artigoInicio?: string;
  artigoFim?: string;
}

interface AlteracaoHistorica {
  id: number;
  numero_artigo: string;
  elemento_tipo: string;
  elemento_numero: string | null;
  tipo_alteracao: string;
  lei_alteradora: string | null;
  ano_alteracao: number | null;
  mes_alteracao?: number | null;
  dia_alteracao?: number | null;
  texto_completo: string | null;
  texto_anterior?: string | null;
  url_lei_alteradora: string | null;
}

interface RankedArticle {
  id: number;
  "Número do Artigo": string;
  Artigo: string;
  visualizacoes: number;
  ultima_visualizacao: string | null;
}

interface ArtigoListaCompactaProps {
  articles: Article[];
  onArtigoClick?: (article: Article, highlightAlteracao?: { elementoTipo: string; elementoNumero: string | null; tipoAlteracao?: string; leiAlteradora?: string | null; anoAlteracao?: number | null; textoCompleto?: string | null; textoAnterior?: string | null; urlLeiAlteradora?: string | null }) => void;
  searchQuery?: string;
  onScrollPastArticle7?: (isPast: boolean) => void;
  scrollAreaRef?: React.RefObject<HTMLDivElement>;
  targetArticleNumber?: string | null;
  onScrollComplete?: () => void;
  artigosComNarracao?: Set<number>;
  tabelaLei?: string;
  codigoNome?: string;
  // Search bar props
  searchInput?: string;
  onSearchInputChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  onSearchClear?: () => void;
}

// Função para highlight de texto
const highlightText = (text: string, query?: string) => {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) => 
    regex.test(part) ? (
      <mark key={i} className="bg-accent/20 text-accent font-medium">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

// Função para preview de texto
const getPreviewText = (content: string) => {
  const cleanText = content.replace(/\n/g, ' ').trim();
  return cleanText.length > 120 ? cleanText.substring(0, 120) + '...' : cleanText;
};

// Detectar capítulos a partir dos artigos
// Os capítulos são registros separados com "Número do Artigo" = null OU contendo CAPÍTULO/TÍTULO etc.
const detectarCapitulos = (articles: Article[]): Capitulo[] => {
  const capitulos: Capitulo[] = [];
  let capituloAtual: Capitulo | null = null;
  
  // Padrões para detectar estruturas hierárquicas
  const padroes = [
    { regex: /^PARTE\s+(GERAL|ESPECIAL|[IVXLCDM]+|\d+)/i, tipo: 'parte' as const },
    { regex: /^LIVRO\s+[IVXLCDM]+/i, tipo: 'livro' as const },
    { regex: /^T[ÍI]TULO\s+[IVXLCDM]+/i, tipo: 'titulo' as const },
    { regex: /^CAP[ÍI]TULO\s+[IVXLCDM]+/i, tipo: 'capitulo' as const },
    { regex: /^SE[CÇ][AÃ]O\s+[IVXLCDM]+/i, tipo: 'secao' as const },
    { regex: /^SUBSE[CÇ][AÃ]O\s+[IVXLCDM]+/i, tipo: 'subsecao' as const },
  ];
  
  // Função para verificar se é um registro de cabeçalho
  const ehCabecalhoCapitulo = (article: Article): { titulo: string; tipo: Capitulo['tipo'] } | null => {
    const numArtigo = (article["Número do Artigo"] || "").trim();
    const conteudo = article["Artigo"] || "";
    
    // Verificar se "Número do Artigo" contém um padrão de cabeçalho (ex: "CAPÍTULO I", "TÍTULO II")
    for (const padrao of padroes) {
      if (numArtigo && padrao.regex.test(numArtigo)) {
        // O subtítulo está no "Artigo" (pode ter múltiplas linhas)
        const linhas = conteudo.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        // Pegar linhas que NÃO são o próprio cabeçalho repetido
        const subtituloLinhas = linhas.filter(l => {
          for (const p of padroes) {
            if (p.regex.test(l)) return false;
          }
          return l.length > 0 && !l.startsWith('Art.');
        });
        const subtitulo = subtituloLinhas.length > 0 ? subtituloLinhas[0] : '';
        const titulo = subtitulo ? `${numArtigo} › ${subtitulo}` : numArtigo;
        return { titulo, tipo: padrao.tipo };
      }
    }
    
    // Fallback: verificar registros sem número de artigo
    const temNumero = numArtigo !== "" && !/^(T[ÍI]TULO|CAP[ÍI]TULO|SE[CÇ]|SUBSE|LIVRO|PARTE|DISPOSI)/i.test(numArtigo);
    if (temNumero) return null;
    
    const linhas = conteudo.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    for (const linha of linhas) {
      for (const padrao of padroes) {
        if (padrao.regex.test(linha)) {
          const tituloLinhas = linhas.filter(l => 
            !l.startsWith('Art.') && 
            !l.startsWith('LEI ') &&
            !l.startsWith('O PRESIDENTE') &&
            !l.startsWith('Código Penal')
          );
          const titulo = tituloLinhas.slice(0, 3).join(' › ').replace(/\s+/g, ' ');
          return { titulo, tipo: padrao.tipo };
        }
      }
    }
    
    return null;
  };
  
  // Ordenar artigos por id para garantir ordem correta
  const artigosOrdenados = [...articles].sort((a, b) => a.id - b.id);
  
  artigosOrdenados.forEach((article) => {
    const temNumero = article["Número do Artigo"] && article["Número do Artigo"].trim() !== "";
    
    // Verificar se é um registro de cabeçalho de capítulo (sem número)
    const cabecalho = ehCabecalhoCapitulo(article);
    
    if (cabecalho) {
      // Salvar capítulo anterior se existir
      if (capituloAtual && capituloAtual.artigos.length > 0) {
        capitulos.push(capituloAtual);
      }
      
      // Criar novo capítulo
      capituloAtual = {
        id: `cap-${capitulos.length + 1}`,
        titulo: cabecalho.titulo,
        tipo: cabecalho.tipo,
        artigos: [],
      };
    } else if (temNumero) {
      // É um artigo numerado - adicionar ao capítulo atual
      if (!capituloAtual) {
        capituloAtual = {
          id: 'cap-inicial',
          titulo: 'Disposições Preliminares',
          tipo: 'capitulo',
          artigos: [],
        };
      }
      capituloAtual.artigos.push(article);
      
      // Atualizar range de artigos
      if (!capituloAtual.artigoInicio) {
        capituloAtual.artigoInicio = article["Número do Artigo"] || undefined;
      }
      capituloAtual.artigoFim = article["Número do Artigo"] || undefined;
    }
  });
  
  // Adicionar último capítulo
  if (capituloAtual && capituloAtual.artigos.length > 0) {
    capitulos.push(capituloAtual);
  }
  
  // Fallback: se só existe 1 capítulo genérico ("Disposições Preliminares"), tentar agrupar pela coluna hierarquia
  if (capitulos.length <= 1 && capitulos[0]?.titulo === 'Disposições Preliminares') {
    const artigosComHierarquia = artigosOrdenados.filter(a => 
      (a as any).hierarquia && (a as any).hierarquia.trim() !== '' && a["Número do Artigo"]?.trim()
    );
    
    if (artigosComHierarquia.length > 0) {
      const gruposHierarquia = new Map<string, Article[]>();
      
      artigosOrdenados.forEach(article => {
        if (!article["Número do Artigo"]?.trim()) return;
        const hierarquia = ((article as any).hierarquia || '').trim();
        // Usar hierarquia completa (incluindo seções) como chave
        const chave = hierarquia || 'Disposições Gerais';
        if (!gruposHierarquia.has(chave)) {
          gruposHierarquia.set(chave, []);
        }
        gruposHierarquia.get(chave)!.push(article);
      });
      
      if (gruposHierarquia.size > 1) {
        const capitulosHierarquia: Capitulo[] = [];
        let idx = 0;
        gruposHierarquia.forEach((arts, chave) => {
          const titulo = chave.replace(/\s*>\s*/g, ' › ');
          capitulosHierarquia.push({
            id: `cap-hier-${idx++}`,
            titulo,
            tipo: /^CAP[ÍI]TULO/i.test(chave) ? 'capitulo' : /^SE[CÇ][AÃ]O/i.test(chave) ? 'secao' : 'capitulo',
            artigos: arts,
            artigoInicio: arts[0]?.["Número do Artigo"] || undefined,
            artigoFim: arts[arts.length - 1]?.["Número do Artigo"] || undefined,
          });
        });
        return capitulosHierarquia;
      }
    }
  }
  
  return capitulos;
};

// Card de artigo individual
const ArtigoCard = ({ 
  article, 
  onArtigoClick, 
  isHighlighted, 
  searchQuery,
  hasNarracao,
  isLocked,
  onLockedClick,
}: { 
  article: Article;
  onArtigoClick?: (article: Article) => void;
  isHighlighted?: boolean;
  searchQuery?: string;
  hasNarracao?: boolean;
  isLocked?: boolean;
  onLockedClick?: () => void;
}) => {
  const numeroArtigo = formatNumeroArtigo(article["Número do Artigo"] || "S/N");
  const conteudo = article["Artigo"] || "Conteúdo não disponível";
  const preview = getPreviewText(conteudo);

  const handleClick = () => {
    if (isLocked) {
      onLockedClick?.();
    } else {
      onArtigoClick?.(article);
    }
  };

  return (
    <Card
      className={`cursor-pointer hover:bg-muted/50 transition-colors border-l-4 ${
        isHighlighted 
          ? 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] bg-accent/5' 
          : ''
      } ${isLocked ? 'opacity-60' : ''}`}
      style={{
        borderLeftColor: isLocked ? "hsl(0, 0%, 40%)" : "hsl(var(--accent))",
      }}
      onClick={handleClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex-shrink-0">
          {isLocked ? (
            <Lock className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Scale className={`w-5 h-5 ${isHighlighted ? 'text-accent' : 'text-accent'}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-sm ${isHighlighted ? 'text-accent' : ''}`}>
              {highlightText(`Art. ${numeroArtigo}`, searchQuery)}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {highlightText(preview, searchQuery)}
          </p>
        </div>
        {isLocked ? (
          <div className="flex-shrink-0 animate-pulse">
            <Crown className="w-5 h-5 text-accent drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
          </div>
        ) : hasNarracao ? (
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-accent" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

// Formatar data completa
const formatarDataCompleta = (dia?: number | null, mes?: number | null, ano?: number | null) => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  if (!ano) return 'S/D';
  if (!mes) return `${ano}`;
  if (!dia) return `${meses[mes - 1]}/${ano}`;
  
  return `${dia.toString().padStart(2, '0')}/${meses[mes - 1]}/${ano}`;
};

// Componente de lista de alterações redesenhado - agrupado por ano
const AlteracoesLista = ({
  alteracoesPorArtigo,
  getAlteracaoCor,
  getElementoIcon,
  articles,
  onArtigoClick,
}: {
  alteracoesPorArtigo: Record<string, AlteracaoHistorica[]>;
  getAlteracaoCor: (tipo: string) => { bg: string; text: string; border: string };
  getElementoIcon: (tipo: string) => string;
  articles: Article[];
  onArtigoClick?: (article: Article, highlightAlteracao?: { elementoTipo: string; elementoNumero: string | null; tipoAlteracao?: string; leiAlteradora?: string | null; anoAlteracao?: number | null; textoCompleto?: string | null; textoAnterior?: string | null; urlLeiAlteradora?: string | null }) => void;
}) => {
  const [explicacaoModal, setExplicacaoModal] = useState<{
    open: boolean;
    alteracao: AlteracaoHistorica | null;
    explicacao: string;
    loading: boolean;
  }>({ open: false, alteracao: null, explicacao: '', loading: false });

  const buscarExplicacao = async (alt: AlteracaoHistorica) => {
    setExplicacaoModal({ open: true, alteracao: alt, explicacao: '', loading: true });
    
    try {
      const { data, error } = await supabase.functions.invoke('explicar-com-gemini', {
        body: {
          contexto: 'alteracao_legislativa',
          dados: JSON.stringify({
            tipo: alt.tipo_alteracao,
            artigo: alt.numero_artigo,
            elemento: alt.elemento_tipo,
            texto_atual: alt.texto_completo,
            texto_anterior: alt.texto_anterior,
            lei_alteradora: alt.lei_alteradora,
            ano: alt.ano_alteracao,
          }),
          linguagemMode: 'simplificado'
        }
      });

      if (error) throw error;
      setExplicacaoModal(prev => ({ ...prev, explicacao: data?.explicacao || 'Explicação não disponível.', loading: false }));
    } catch (err) {
      console.error('Erro ao buscar explicação:', err);
      setExplicacaoModal(prev => ({ 
        ...prev, 
        explicacao: `**O que mudou:**\n\n${alt.tipo_alteracao === 'Revogação' ? 'Este dispositivo foi revogado.' : alt.tipo_alteracao === 'Inclusão' ? 'Este dispositivo foi incluído na lei.' : alt.tipo_alteracao === 'Redação' ? 'O texto deste dispositivo foi modificado.' : 'Esta alteração modificou o dispositivo legal.'}${alt.lei_alteradora ? `\n\n**Lei responsável:** ${alt.lei_alteradora}` : ''}`,
        loading: false 
      }));
    }
  };

  // Flatten all alterações and group by year
  const allAlteracoes = useMemo(() => {
    const flat: AlteracaoHistorica[] = [];
    Object.values(alteracoesPorArtigo).forEach(alts => flat.push(...alts));
    return flat;
  }, [alteracoesPorArtigo]);

  const porAno = useMemo(() => {
    const grouped: Record<number, AlteracaoHistorica[]> = {};
    allAlteracoes.forEach(alt => {
      const ano = alt.ano_alteracao || 0;
      if (!grouped[ano]) grouped[ano] = [];
      grouped[ano].push(alt);
    });
    return Object.entries(grouped)
      .map(([ano, alts]) => ({ ano: Number(ano), alts }))
      .sort((a, b) => b.ano - a.ano);
  }, [allAlteracoes]);

  const handleCardClick = (alt: AlteracaoHistorica) => {
    const normalizeNum = (n: string) => n.replace(/^art\.?\s*/i, '').replace(/[°º\s]/g, '').toLowerCase();
    const targetNum = normalizeNum(alt.numero_artigo);
    const foundArticle = articles.find(a => {
      const artNum = normalizeNum(a["Número do Artigo"] || '');
      return artNum === targetNum;
    });
    if (foundArticle && onArtigoClick) {
      onArtigoClick(foundArticle, {
        elementoTipo: alt.elemento_tipo || 'artigo',
        elementoNumero: alt.elemento_numero,
        tipoAlteracao: alt.tipo_alteracao,
        leiAlteradora: alt.lei_alteradora,
        anoAlteracao: alt.ano_alteracao,
        textoCompleto: alt.texto_completo,
        textoAnterior: alt.texto_anterior || null,
        urlLeiAlteradora: alt.url_lei_alteradora || null,
      });
    }
  };

  return (
    <>
      {/* Modal de Explicação */}
      <Dialog open={explicacaoModal.open} onOpenChange={(open) => !open && setExplicacaoModal(prev => ({ ...prev, open: false }))}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Explicação da Alteração
            </DialogTitle>
          </DialogHeader>
          
          {explicacaoModal.loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Gerando explicação...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {explicacaoModal.alteracao && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getAlteracaoCor(explicacaoModal.alteracao.tipo_alteracao).bg} ${getAlteracaoCor(explicacaoModal.alteracao.tipo_alteracao).text} border-0`}>
                      {explicacaoModal.alteracao.tipo_alteracao}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Art. {formatNumeroArtigo(explicacaoModal.alteracao.numero_artigo)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {explicacaoModal.explicacao.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('**') ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lista agrupada por ano */}
      <div className="space-y-4">
        {porAno.map(({ ano, alts }) => (
          <div key={ano}>
            {/* Year header */}
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-foreground">
                {ano === 0 ? 'Sem data' : ano}
              </span>
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[10px] text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-full">
                {alts.length} {alts.length === 1 ? 'alteração' : 'alterações'}
              </span>
            </div>

            {/* Cards for this year */}
            <div className="space-y-2">
              {alts
                .sort((a, b) => {
                  const dataA = (a.mes_alteracao || 0) * 100 + (a.dia_alteracao || 0);
                  const dataB = (b.mes_alteracao || 0) * 100 + (b.dia_alteracao || 0);
                  return dataB - dataA;
                })
                .map((alt) => {
                  const cor = getAlteracaoCor(alt.tipo_alteracao);
                  const IconComponent = 
                    alt.tipo_alteracao === 'Revogação' || alt.tipo_alteracao === 'Supressão' ? Trash2 :
                    alt.tipo_alteracao === 'Inclusão' || alt.tipo_alteracao === 'Acréscimo' ? Plus :
                    alt.tipo_alteracao === 'Redação' ? Edit :
                    alt.tipo_alteracao === 'Vide' ? Eye :
                    AlertTriangle;

                  return (
                    <div
                      key={alt.id}
                      className={`rounded-xl bg-card border border-border/40 overflow-hidden hover:border-accent/30 transition-all cursor-pointer border-l-[3px] ${cor.border}`}
                      onClick={() => handleCardClick(alt)}
                    >
                      <div className="p-3">
                        {/* Top: Art number + badges */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-sm text-foreground">
                            Art. {formatNumeroArtigo(alt.numero_artigo)}
                          </h3>
                          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <Badge className={`${cor.bg} ${cor.text} border-0 text-[10px] px-2 py-0.5`}>
                            <IconComponent className="w-3 h-3 mr-1" />
                            {alt.tipo_alteracao}
                          </Badge>
                          {alt.elemento_tipo && alt.elemento_tipo !== 'artigo' && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted/50">
                              {alt.elemento_numero 
                                ? `${getElementoIcon(alt.elemento_tipo)} ${alt.elemento_tipo} ${alt.elemento_numero.replace(/^§\s*/, '')}` 
                                : `${getElementoIcon(alt.elemento_tipo)} ${alt.elemento_tipo}`}
                            </Badge>
                          )}
                        </div>

                        {/* Lei alteradora */}
                        {alt.lei_alteradora && (
                          <p className="text-[11px] text-muted-foreground mb-2 line-clamp-1">
                            {alt.lei_alteradora}
                          </p>
                        )}

                        {/* Preview do texto */}
                        {alt.texto_completo && (
                          <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                            {alt.texto_completo}
                          </p>
                        )}

                        {/* Footer with date */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                          <span className="text-[10px] text-muted-foreground">
                            {formatarDataCompleta(alt.dia_alteracao, alt.mes_alteracao, alt.ano_alteracao)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export const ArtigoListaCompacta = ({ 
  articles, 
  onArtigoClick,
  searchQuery,
  onScrollPastArticle7,
  scrollAreaRef: externalScrollRef,
  targetArticleNumber,
  onScrollComplete,
  artigosComNarracao,
  tabelaLei,
  codigoNome = "Código",
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
}: ArtigoListaCompactaProps) => {
  const [highlightedArticleId, setHighlightedArticleId] = useState<number | null>(null);
  const [modoVisualizacao, setModoVisualizacao] = useState<'artigos' | 'capitulos' | 'alteracoes'>('artigos');
  const [subModoConteudo, setSubModoConteudo] = useState<'lista' | 'playlist' | 'favoritos' | 'alteracoes' | 'anotacoes' | 'radar'>('lista');
  const [capituloExpandido, setCapituloExpandido] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { items: radarItems, isLoading: radarLoading } = useRadarInline(codigoNome);
  const articleRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const { isPremium } = useSubscription();
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  const [playlistSheetOpen, setPlaylistSheetOpen] = useState(false);
  
  // Audio player context para playlist
  const { playAudio, setPlaylist, currentAudio, isPlaying, togglePlayPause } = useAudioPlayer();

  // Buscar alterações históricas (sempre ativo para pré-carregar)
  const { data: alteracoesHistoricas = [], isLoading: isLoadingAlteracoes } = useQuery({
    queryKey: ['alteracoes-historicas', tabelaLei],
    queryFn: async () => {
      if (!tabelaLei) return [];
      const { data, error } = await supabase
        .from('historico_alteracoes')
        .select('*')
        .eq('tabela_lei', tabelaLei)
        .order('numero_artigo', { ascending: true });
      
      if (error) throw error;
      return (data || []) as AlteracaoHistorica[];
    },
    enabled: !!tabelaLei,
    staleTime: 1000 * 60 * 30, // 30 minutos de cache
    refetchOnWindowFocus: false,
  });

  // Buscar ranking de artigos (Em Alta)
  const { data: rankedArticles = [], isLoading: isLoadingRanking } = useQuery({
    queryKey: ['ranking-artigos-inline', tabelaLei],
    queryFn: async () => {
      if (!tabelaLei) return [];
      try {
        const { data: visualizacoes, error: visError } = await supabase
          .from('artigos_visualizacoes')
          .select('numero_artigo, visualizado_em')
          .eq('tabela_codigo', tabelaLei);

        if (visError) throw visError;
        if (!visualizacoes || visualizacoes.length === 0) return [];

        const contagem = visualizacoes.reduce((acc, vis) => {
          const num = vis.numero_artigo;
          if (!acc[num]) {
            acc[num] = { count: 0, ultimaVis: vis.visualizado_em };
          }
          acc[num].count++;
          if (new Date(vis.visualizado_em) > new Date(acc[num].ultimaVis)) {
            acc[num].ultimaVis = vis.visualizado_em;
          }
          return acc;
        }, {} as Record<string, { count: number; ultimaVis: string }>);

        const artigosOrdenados = Object.entries(contagem)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 20)
          .map(([numero, data]) => ({ numero, ...data }));

        if (artigosOrdenados.length === 0) return [];

        const numerosArtigos = artigosOrdenados.map(a => a.numero);
        const { data: artigos, error: artError } = await supabase
          .from(tabelaLei as any)
          .select('id, "Número do Artigo", Artigo')
          .in('Número do Artigo', numerosArtigos);

        if (artError) throw artError;
        if (!artigos) return [];

        const artigosMap = new Map((artigos as any[]).map(a => [a["Número do Artigo"], a]));
        
        return artigosOrdenados
          .map(item => {
            const artigo = artigosMap.get(item.numero);
            if (!artigo) return null;
            return {
              id: artigo.id,
              "Número do Artigo": artigo["Número do Artigo"],
              Artigo: artigo.Artigo,
              visualizacoes: item.count,
              ultima_visualizacao: item.ultimaVis
            };
          })
          .filter((item): item is RankedArticle => item !== null);
      } catch (error) {
        console.error('Erro na query de ranking:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos de cache
    refetchOnWindowFocus: false,
    enabled: !!tabelaLei,
  });

  // Artigos com áudio para playlist
  const articlesWithAudio = useMemo(() => 
    articles.filter(article => 
      article["Narração"] && 
      article["Narração"].trim() !== "" &&
      article["Número do Artigo"] &&
      article["Número do Artigo"].trim() !== ""
    ), [articles]
  );

  // Playlist sheet handles its own audio logic now

  // Agrupar alterações por artigo
  const alteracoesPorArtigo = useMemo(() => {
    const grouped: Record<string, AlteracaoHistorica[]> = {};
    for (const alt of alteracoesHistoricas) {
      const key = alt.numero_artigo || 'sem-numero';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(alt);
    }
    return grouped;
  }, [alteracoesHistoricas]);

  // Filtrar artigos sem número para exibição na lista de artigos
  const articlesWithNumber = useMemo(() => {
    const filtered = articles.filter(article => 
      article["Número do Artigo"] && 
      article["Número do Artigo"].trim() !== "" &&
      // Excluir cabeçalhos de estrutura (TITULO, CAPITULO, SECAO, etc.)
      !['TITULO', 'CAPITULO', 'SECAO', 'SUBSECAO', 'PARTE', 'LIVRO'].includes(article["Número do Artigo"].trim().toUpperCase())
    );

    // Garantir ordem numérica estável (1º, 2º, 3º...)
    return sortArticles(filtered as any) as Article[];
  }, [articles]);

  // Extrair cabeçalhos (TITULO, CAPITULO, etc.) ordenados por id
  const headersStructure = useMemo(() => {
    const headers = articles
      .filter(article => 
        article["Número do Artigo"] && 
        ['TITULO', 'CAPITULO', 'SECAO', 'SUBSECAO', 'PARTE', 'LIVRO'].includes(article["Número do Artigo"].trim().toUpperCase())
      )
      .sort((a, b) => a.id - b.id);
    return headers;
  }, [articles]);

  // Criar lista intercalada de artigos com seus separadores de estrutura
  const articlesWithHeaders = useMemo(() => {
    const result: Array<{ type: 'article' | 'header'; data: Article }> = [];
    let headerIndex = 0;
    
    // Ordenar todos os artigos por id
    const sortedArticles = [...articlesWithNumber].sort((a, b) => a.id - b.id);
    
    for (const article of sortedArticles) {
      // Adicionar todos os headers que vêm antes deste artigo
      while (headerIndex < headersStructure.length && headersStructure[headerIndex].id < article.id) {
        result.push({ type: 'header', data: headersStructure[headerIndex] });
        headerIndex++;
      }
      result.push({ type: 'article', data: article });
    }
    
    return result;
  }, [articlesWithNumber, headersStructure]);

  // Detectar capítulos
  const capitulos = useMemo(() => detectarCapitulos(articles), [articles]);

  // Scroll para artigo específico com retry robusto
  useEffect(() => {
    if (!targetArticleNumber) return;

    const normalizeNumber = (num: string) => num.replace(/\D/g, '').replace(/^0+/, '');
    const targetNormalized = normalizeNumber(targetArticleNumber);
    
    const targetArticle = articlesWithNumber.find(article => {
      const articleNum = normalizeNumber(article["Número do Artigo"] || "");
      return articleNum === targetNormalized || 
             (article["Número do Artigo"] || "").toLowerCase().includes(targetArticleNumber.toLowerCase());
    });

    if (!targetArticle) {
      onScrollComplete?.();
      return;
    }

    // Destacar artigo imediatamente
    setHighlightedArticleId(targetArticle.id);
    
    // Forçar modo de visualização lista
    setModoVisualizacao('artigos');

    // Função de scroll com retry progressivo
    const scrollToArticle = (retries = 0) => {
      const element = articleRefs.current.get(targetArticle.id);
      
      if (element) {
        // Usar requestAnimationFrame para garantir que o DOM está pronto
        requestAnimationFrame(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          onScrollComplete?.();
        });
      } else if (retries < 15) {
        // Retry com delay progressivo (até ~3 segundos total)
        setTimeout(() => scrollToArticle(retries + 1), 200);
      } else {
        // Fallback: completar mesmo sem scroll
        console.warn('Não foi possível scrollar para artigo:', targetArticleNumber);
        onScrollComplete?.();
      }
    };

    // Iniciar após delay para garantir renderização inicial
    setTimeout(() => scrollToArticle(0), 300);

    // Limpar destaque após 4 segundos
    const highlightTimer = setTimeout(() => {
      setHighlightedArticleId(null);
    }, 4000);

    return () => clearTimeout(highlightTimer);
  }, [targetArticleNumber, articlesWithNumber, onScrollComplete]);

  // Detectar scroll past article 7
  useEffect(() => {
    const handleScroll = () => {
      if (onScrollPastArticle7 && containerRef.current) {
        const scrollTop = window.scrollY;
        const isPast = scrollTop > 500;
        onScrollPastArticle7(isPast);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onScrollPastArticle7]);

  // Scroll para capítulo
  const scrollToCapitulo = (capitulo: Capitulo) => {
    if (capitulo.artigos.length > 0) {
      const primeiroArtigo = capitulo.artigos[0];
      const element = articleRefs.current.get(primeiroArtigo.id);
      if (element) {
        setModoVisualizacao('artigos');
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setHighlightedArticleId(primeiroArtigo.id);
          setTimeout(() => setHighlightedArticleId(null), 3000);
        }, 100);
      }
    }
  };

  if (articlesWithNumber.length === 0) {
    return (
      <div ref={containerRef} className="px-4 py-2 pb-20 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum artigo encontrado</p>
        </div>
      </div>
    );
  }

  // Cores para tipos de alteração
  const getAlteracaoCor = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'revogação': return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500' };
      case 'inclusão': return { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500' };
      case 'redação': return { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500' };
      case 'acréscimo': return { bg: 'bg-emerald-500/20', text: 'text-emerald-500', border: 'border-emerald-500' };
      case 'vide': return { bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500' };
      case 'vetado': return { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500' };
      case 'vigência': return { bg: 'bg-cyan-500/20', text: 'text-cyan-500', border: 'border-cyan-500' };
      case 'supressão': return { bg: 'bg-pink-500/20', text: 'text-pink-500', border: 'border-pink-500' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' };
    }
  };

  // Ícone para tipo de elemento
  const getElementoIcon = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'inciso': return 'I';
      case 'parágrafo': return '§';
      case 'alínea': return 'a)';
      default: return '•';
    }
  };

  return (
    <div ref={containerRef} className="px-4 py-2 pb-20 max-w-4xl mx-auto">
      {/* 5 Circular Icon Buttons */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3 pt-1 -mx-4 px-4">
        <div className="flex justify-center gap-4 mb-3">
          {[
            { key: 'favoritos' as const, icon: Star, label: 'Favoritos', bg: 'bg-[hsl(220,6%,25%)]' },
            { key: 'playlist' as const, icon: Music, label: 'Playlist', bg: 'bg-[hsl(220,6%,32%)]' },
            { key: 'anotacoes' as const, icon: StickyNote, label: 'Anotações', bg: 'bg-[hsl(220,6%,38%)]' },
            { key: 'alteracoes' as const, icon: Sparkles, label: 'Novidades', bg: 'bg-[hsl(220,6%,28%)]' },
            { key: 'radar' as const, icon: Radar, label: 'Radar', bg: 'bg-[hsl(220,6%,35%)]' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = subModoConteudo === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  if (item.key === 'playlist') {
                    setPlaylistSheetOpen(true);
                    return;
                  }
                  setSubModoConteudo(subModoConteudo === item.key ? 'lista' : item.key);
                  if (subModoConteudo !== item.key) setModoVisualizacao('artigos');
                }}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 overflow-hidden relative ${item.bg} ${
                  isActive 
                    ? 'ring-2 ring-white/50 scale-110 shadow-lg shadow-accent/30' 
                    : 'opacity-80 hover:scale-105'
                }`}>
                  <Icon className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] relative z-10" />
                  <div className="absolute inset-0 animate-[shinePratique_3s_ease-in-out_infinite] opacity-60" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)', animationDelay: `${0.4 * (['favoritos','playlist','anotacoes','alteracoes','radar'].indexOf(item.key))}s` }} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-accent' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tabs: Artigos / Capítulos */}
        <Tabs value={modoVisualizacao} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-11 bg-muted/50 rounded-lg p-1">
            <TabsTrigger 
              value="artigos" 
              onClick={() => {
                setModoVisualizacao('artigos');
                setSubModoConteudo('lista');
              }}
              className={`rounded-md text-sm font-medium flex items-center gap-1.5 ${
                modoVisualizacao === 'artigos' && subModoConteudo === 'lista'
                  ? '!bg-accent !text-black shadow-sm'
                  : 'text-white hover:bg-muted/30'
              }`}
            >
              <Scale className="w-4 h-4" />
              Artigos
            </TabsTrigger>
            
            <TabsTrigger 
              value="capitulos" 
              onClick={() => {
                setModoVisualizacao('capitulos');
                setSubModoConteudo('lista');
              }}
              className={`rounded-md text-sm font-medium flex items-center gap-1.5 ${
                modoVisualizacao === 'capitulos' && subModoConteudo === 'lista'
                  ? '!bg-accent !text-black shadow-sm'
                  : 'text-white hover:bg-muted/30'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Capítulos
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Barra de pesquisa */}
        {searchInput !== undefined && onSearchInputChange && onSearchSubmit && onSearchClear && (
          <div className="mt-2">
            <BuscaCompacta
              value={searchInput}
              onChange={onSearchInputChange}
              onSearch={onSearchSubmit}
              onClear={onSearchClear}
              resultCount={articles.length}
            />
          </div>
        )}
      </div>

      {/* Conteúdo de Favoritos */}
      {modoVisualizacao === 'artigos' && subModoConteudo === 'favoritos' && (tabelaLei || codigoNome) && (
        <ArtigosFavoritosList 
          tabelaCodigo={tabelaLei || codigoNome || "Código"}
          onArtigoClick={(artigoId, numeroArtigo) => {
            const artigo = articles.find(a => a.id === artigoId);
            if (artigo) {
              onArtigoClick?.(artigo);
            }
          }}
        />
      )}

      {/* Modo Alterações (triggered from circular icon, within artigos mode) */}
      {modoVisualizacao === 'artigos' && subModoConteudo === 'alteracoes' && (
        <div className="space-y-3">
          {isLoadingAlteracoes ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p>Carregando alterações históricas...</p>
            </div>
          ) : alteracoesHistoricas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma alteração histórica encontrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AlteracoesLista 
                alteracoesPorArtigo={alteracoesPorArtigo}
                getAlteracaoCor={getAlteracaoCor}
                getElementoIcon={getElementoIcon}
                articles={articles}
                onArtigoClick={onArtigoClick}
              />
            </div>
          )}
        </div>
      )}

      {/* Modo Anotações placeholder */}
      {modoVisualizacao === 'artigos' && subModoConteudo === 'anotacoes' && (
        <div className="text-center py-8 text-muted-foreground">
          <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Suas anotações aparecerão aqui.</p>
          <p className="text-xs mt-1">Abra um artigo e faça anotações para vê-las listadas.</p>
        </div>
      )}

      {/* Modo Radar placeholder */}
      {modoVisualizacao === 'artigos' && subModoConteudo === 'radar' && (
        <div>
          {radarItems.length > 0 && !radarLoading && (
            <RaioXTimelineChart items={radarItems} />
          )}
          <RaioXTimeline items={radarItems} isLoading={radarLoading} />
        </div>
      )}
      {/* Modo Capítulos */}
      {modoVisualizacao === 'capitulos' && (
        <div className="space-y-2">
          {capitulos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Estrutura de capítulos não detectada para esta legislação.</p>
              <p className="text-sm mt-2">Use a visualização por artigos.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {capitulos.map((capitulo) => {
                const corCapitulo = 
                  capitulo.tipo === 'parte' ? '#ef4444' :
                  capitulo.tipo === 'livro' ? '#f97316' :
                  capitulo.tipo === 'titulo' ? '#eab308' :
                  capitulo.tipo === 'capitulo' ? '#22c55e' :
                  capitulo.tipo === 'secao' ? '#3b82f6' :
                  '#8b5cf6';
                
                return (
                  <Collapsible key={capitulo.id}>
                    <CollapsibleTrigger asChild>
                      <Card 
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4"
                        style={{ borderLeftColor: corCapitulo }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                {capitulo.tipo}
                              </p>
                              <h3 className="font-semibold text-sm line-clamp-2">
                                {capitulo.titulo}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {capitulo.artigos.length} artigos
                                {capitulo.artigoInicio && capitulo.artigoFim && 
                                  ` (Art. ${formatNumeroArtigo(capitulo.artigoInicio)} - ${formatNumeroArtigo(capitulo.artigoFim)})`
                                }
                              </p>
                            </div>
                            <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 space-y-1 pl-4 animate-fade-in">
                      {capitulo.artigos.map((article) => {
                        const hasNarracao = Boolean(article["Narração"]) || artigosComNarracao?.has(article.id);
                        return (
                          <Card 
                            key={article.id}
                            className="cursor-pointer hover:bg-muted/30 transition-colors border-l-2"
                            style={{ borderLeftColor: corCapitulo }}
                            onClick={() => onArtigoClick?.(article)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="text-xs font-bold px-2 py-0.5 rounded"
                                  style={{ backgroundColor: `${corCapitulo}20`, color: corCapitulo }}
                                >
                                  Art. {formatNumeroArtigo(article["Número do Artigo"] || '')}
                                </span>
                                {hasNarracao && (
                                  <span className="text-xs text-emerald-500">🎧</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {getPreviewText(article["Artigo"] || "")}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modo Artigos - Todas as listas pré-renderizadas, apenas visibilidade muda */}
      {modoVisualizacao === 'artigos' && (
        <div>
          {/* Inline playlist removed - now uses PlaylistNarracaoSheet */}

          {/* Sub-modo: Lista normal de artigos - sempre renderizado, visibilidade controlada por CSS */}
          <div className={subModoConteudo === 'lista' ? 'block space-y-2' : 'hidden'}>
            {articlesWithNumber.map((article) => {
              const isHighlighted = highlightedArticleId === article.id;
              const hasNarracao = Boolean(article["Narração"]) || artigosComNarracao?.has(article.id);
              const artNum = extractArticleNumber(article["Número do Artigo"] || "");
              const isLocked = !isPremium && artNum !== null && artNum > 10;
              
              return (
                <div 
                  key={article.id}
                  ref={(el) => {
                    if (el) articleRefs.current.set(article.id, el);
                  }}
                >
                  <ArtigoCard
                    article={article}
                    onArtigoClick={onArtigoClick}
                    isHighlighted={isHighlighted}
                    searchQuery={isHighlighted ? targetArticleNumber || undefined : undefined}
                    hasNarracao={hasNarracao}
                    isLocked={isLocked}
                    onLockedClick={() => setShowPremiumCard(true)}
                  />
                </div>
              );
            })}
            
            {/* Info de total */}
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                ✓ {articlesWithNumber.length} artigos carregados
              </p>
            </div>
          </div>
        </div>
      )}

      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
        feature="vademecum-completo"
      />

      <PlaylistNarracaoSheet
        open={playlistSheetOpen}
        onOpenChange={setPlaylistSheetOpen}
        articles={articles}
        codigoNome={codigoNome}
      />
    </div>
  );
};