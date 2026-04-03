import { useLocation, useNavigate } from "react-router-dom";
import { ExternalLink, Loader2, FileText, Globe, Sparkles, BookOpen, ArrowLeft, Crown, Lock, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, Fragment } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const formatarDataHora = (dataStr: string | null | undefined): string => {
  if (!dataStr) return '';
  try {
    return format(parseISO(dataStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch { return dataStr; }
};

interface Noticia {
  id: string;
  titulo: string;
  portal: string;
  capa: string;
  link: string;
  dataHora: string;
  categoria?: string;
}

interface Termo { termo: string; significado: string; }
interface AnaliseNoticia {
  resumoExecutivo: string;
  resumoFacil: string;
  pontosPrincipais: string[];
  impactoJuridico?: string;
}

type VisualizacaoAtiva = 'noticia' | 'termos' | 'analise';
type SubMenuAnalise = 'executivo' | 'facil';

// Markdown components with proper styling
const markdownComponents = {
  h1: ({ children }: any) => <h1 className="text-xl font-bold text-foreground mb-3 mt-4">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold text-emerald-400 mb-2 mt-5">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-bold text-foreground mb-2 mt-4">{children}</h3>,
  p: ({ children }: any) => <p className="text-foreground text-sm leading-relaxed mb-3">{children}</p>,
  strong: ({ children }: any) => <strong className="font-bold text-foreground">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-muted-foreground">{children}</em>,
  ul: ({ children }: any) => <ul className="space-y-2 mb-4 ml-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="space-y-2 mb-4 ml-1 list-decimal list-inside">{children}</ol>,
  li: ({ children }: any) => (
    <li className="flex items-start gap-2 text-foreground text-sm leading-relaxed">
      <span className="text-emerald-400 mt-1 shrink-0">•</span>
      <span className="flex-1">{children}</span>
    </li>
  ),
  hr: () => <hr className="border-border my-4" />,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-emerald-500 bg-emerald-500/10 p-3 rounded-r-lg my-3 text-sm">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300">
      {children}
    </a>
  ),
};

const markdownExplicacao = {
  ...markdownComponents,
  p: ({ children }: any) => <p className="text-foreground text-base leading-relaxed mb-4">{children}</p>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold text-emerald-400 mb-3 mt-5">{children}</h2>,
  li: ({ children }: any) => (
    <li className="flex items-start gap-2 text-foreground text-base leading-relaxed">
      <span className="text-emerald-400 mt-1 shrink-0">•</span>
      <span className="flex-1">{children}</span>
    </li>
  ),
};

// Render text with highlighted terms that show popover on tap
const renderTextWithTerms = (text: string, termos: Termo[]): React.ReactNode => {
  if (!termos || termos.length === 0) return text;

  // Build regex from all terms (sorted by length desc to match longer terms first)
  const sortedTerms = [...termos].sort((a, b) => b.termo.length - a.termo.length);
  const escaped = sortedTerms.map(t => t.termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    const matchedTermo = sortedTerms.find(t => t.termo.toLowerCase() === part.toLowerCase());
    if (!matchedTermo) return <Fragment key={i}>{part}</Fragment>;

    return (
      <Popover key={i}>
        <PopoverTrigger asChild>
          <span className="bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/40 cursor-pointer hover:bg-emerald-500/30 transition-colors rounded-sm px-0.5">
            {part}
          </span>
        </PopoverTrigger>
        <PopoverContent side="top" className="max-w-xs text-xs p-3 bg-card border-border">
          <p className="font-semibold text-emerald-400 mb-1">{matchedTermo.termo}</p>
          <p className="text-muted-foreground leading-relaxed">{matchedTermo.significado}</p>
        </PopoverContent>
      </Popover>
    );
  });
};

const NoticiaLegislativaDetalhes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const noticia = location.state?.noticia as Noticia;

  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState<VisualizacaoAtiva>('noticia');
  const [subMenuAnalise, setSubMenuAnalise] = useState<SubMenuAnalise>('facil');
  const [conteudoFormatado, setConteudoFormatado] = useState('');
  const [conteudoOriginal, setConteudoOriginal] = useState('');
  const [analise, setAnalise] = useState<AnaliseNoticia | null>(null);
  const [termos, setTermos] = useState<Termo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!noticia) navigate('/noticias-legislativas');
  }, [noticia, navigate]);

  useEffect(() => {
    if (noticia?.link) carregarDados();
  }, [noticia?.link]);

  const carregarDados = async () => {
    if (!noticia?.link) return;
    setLoading(true);
    const timeoutId = setTimeout(() => { setLoading(false); toast.error('Processamento demorou muito.'); }, 45000);

    try {
      const { data: cacheData } = await supabase
        .from('noticias_legislativas_cache' as any)
        .select('conteudo_formatado, analise_ia, termos_json, conteudo_completo')
        .eq('link', noticia.link)
        .maybeSingle();

      if (cacheData) {
        const cd = cacheData as any;
        const conteudoCurto = cd.conteudo_completo && cd.conteudo_completo.length < 200;
        if (cd.conteudo_formatado && cd.analise_ia && cd.conteudo_completo && !conteudoCurto) {
          processarDadosCache(cd);
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }
        // If content is too short, force reprocess
        if (conteudoCurto) {
          console.log('⚠️ Conteúdo em cache muito curto, forçando reprocessamento...');
        }
      }

      toast.info('Processando notícia com IA...', { duration: 3000 });
      const { data: processedData, error: processError } = await supabase.functions.invoke(
        'processar-noticia-legislativa',
        { body: { url: noticia.link, titulo: noticia.titulo, forceReprocess: true } }
      );

      clearTimeout(timeoutId);

      if (processError) {
        if (cacheData) processarDadosCache(cacheData as any);
        else toast.error('Não foi possível processar.');
        return;
      }

      if (processedData?.success) {
        setConteudoFormatado(processedData.conteudo_formatado || '');
        setConteudoOriginal(processedData.conteudo_completo || '');
        let analiseObj = processedData.analise_ia;
        if (typeof analiseObj === 'string') { try { analiseObj = JSON.parse(analiseObj); } catch {} }
        if (analiseObj) {
          setAnalise({
            resumoExecutivo: analiseObj.resumoExecutivo || '',
            resumoFacil: analiseObj.resumoFacil || '',
            pontosPrincipais: analiseObj.pontosPrincipais || [],
            impactoJuridico: analiseObj.impactoJuridico || ''
          });
        }
        setTermos(processedData.termos_json || []);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      toast.error('Erro ao carregar notícia.');
    } finally {
      setLoading(false);
    }
  };

  const processarDadosCache = (cacheData: any) => {
    setConteudoFormatado(cacheData.conteudo_formatado || '');
    setConteudoOriginal(cacheData.conteudo_completo || '');
    let analiseObj = cacheData.analise_ia;
    if (typeof analiseObj === 'string') { try { analiseObj = JSON.parse(analiseObj); } catch {} }
    if (analiseObj && typeof analiseObj === 'object') {
      setAnalise({
        resumoExecutivo: analiseObj.resumoExecutivo || analiseObj.resumo_executivo || '',
        resumoFacil: analiseObj.resumoFacil || analiseObj.resumo_facil || '',
        pontosPrincipais: analiseObj.pontosPrincipais || analiseObj.pontos_principais || [],
        impactoJuridico: analiseObj.impactoJuridico || analiseObj.impacto_juridico || ''
      });
    }
    let termosArr = cacheData.termos_json || [];
    if (typeof termosArr === 'string') { try { termosArr = JSON.parse(termosArr); } catch { termosArr = []; } }
    setTermos(Array.isArray(termosArr) ? termosArr : []);
  };

  const abrirExterno = () => { if (noticia?.link) window.open(noticia.link, '_blank'); };

  if (!noticia) return null;

  const termosSorted = [...termos].sort((a, b) => a.termo.localeCompare(b.termo, 'pt-BR'));

  const renderTermos = (termosLista: Termo[]) => (
    <div className="space-y-2">
      {termosLista.length === 0 ? (
        <p className="text-muted-foreground text-xs sm:text-sm">Nenhum termo identificado.</p>
      ) : termosLista.map((t, idx) => (
        <div key={idx} className="p-2.5 sm:p-3 bg-muted/50 rounded-lg border border-border">
          <h4 className="font-semibold text-emerald-400 text-xs sm:text-sm">{t.termo}</h4>
          <p className="text-foreground text-[11px] sm:text-xs mt-1 leading-relaxed">{t.significado}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-background/95 backdrop-blur flex items-center gap-3">
        <button
          onClick={() => navigate('/noticias-legislativas')}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold line-clamp-2 text-foreground leading-snug">{noticia.titulo}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{noticia.portal}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={abrirExterno} className="flex-shrink-0">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-background overflow-hidden">
        {/* === TAB: Notícia === */}
        {visualizacaoAtiva === 'noticia' && (
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 pb-24">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Carregando notícia...</p>
                </div>
              ) : (
                <article className="space-y-3">
                  {noticia.capa && <img src={noticia.capa} alt={noticia.titulo} className="w-full rounded-lg object-cover max-h-48 sm:max-h-64" />}
                  <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">{noticia.titulo}</h1>
                  <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-xs text-muted-foreground border-b border-border pb-3">
                    <span className="bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded">{noticia.portal}</span>
                    {noticia.dataHora && <span className="bg-muted px-2 py-0.5 rounded">{formatarDataHora(noticia.dataHora)}</span>}
                  </div>
                  {conteudoOriginal ? (
                    <div className="space-y-4">
                      {conteudoOriginal.split('\n\n').filter(p => p.trim()).map((paragrafo, idx) => (
                        <p key={idx} className="text-foreground text-sm leading-relaxed">
                          {renderTextWithTerms(paragrafo.trim(), termos)}
                        </p>
                      ))}
                    </div>
                  ) : conteudoFormatado ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {conteudoFormatado}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs sm:text-sm">Conteúdo não disponível.</p>
                  )}
                  <div className="mt-4 pt-3 border-t border-border">
                    <Button onClick={abrirExterno} variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Ver no site original
                    </Button>
                  </div>
                </article>
              )}
            </div>
          </ScrollArea>
        )}

        {/* === TAB: Termos === */}
        {visualizacaoAtiva === 'termos' && (
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 pb-24">
              <h2 className="text-lg sm:text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" /> Termos Jurídicos
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                {termosSorted.length} termos encontrados • Ordem alfabética
              </p>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Identificando termos...</p>
                </div>
              ) : renderTermos(termosSorted)}
            </div>
          </ScrollArea>
        )}

        {/* === TAB: Explicação === */}
        {visualizacaoAtiva === 'analise' && (
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 pb-24">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Gerando explicação...</p>
                </div>
              ) : analise ? (
                <>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <button onClick={() => setSubMenuAnalise('facil')} className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${subMenuAnalise === 'facil' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>Para Leigos</button>
                    <button onClick={() => setSubMenuAnalise('executivo')} className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${subMenuAnalise === 'executivo' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>Resumo Executivo</button>
                  </div>

                  {!isPremium && !loadingSubscription ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-amber-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                          <Crown className="w-5 h-5 text-amber-500" /> Análise Premium
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs">A análise detalhada com IA é exclusiva para assinantes Premium.</p>
                      </div>
                      <Button onClick={() => navigate('/assinatura')} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white gap-2">
                        <Crown className="w-4 h-4" /> Seja Premium
                      </Button>
                    </div>
                  ) : (
                    <>
                      {subMenuAnalise === 'facil' && (
                        <div className="space-y-4">
                          <h2 className="text-lg sm:text-xl font-bold text-emerald-400 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" /> Entenda de Forma Simples
                          </h2>
                          <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownExplicacao}>
                              {analise.resumoFacil || 'Explicação não disponível.'}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {subMenuAnalise === 'executivo' && (
                        <div className="space-y-5">
                          <h2 className="text-lg sm:text-xl font-bold text-emerald-400 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" /> Resumo Executivo
                          </h2>
                          <div className="prose prose-sm prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownExplicacao}>
                              {analise.resumoExecutivo || 'Resumo não disponível.'}
                            </ReactMarkdown>
                          </div>
                          {analise.pontosPrincipais?.length > 0 && (
                            <div className="space-y-3">
                              <h3 className="text-base sm:text-lg font-bold text-emerald-400">Pontos Principais</h3>
                              <ul className="space-y-2">
                                {analise.pontosPrincipais.map((ponto, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-foreground text-sm sm:text-base">
                                    <span className="text-emerald-400 mt-0.5 shrink-0">•</span><span>{ponto}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analise.impactoJuridico && (
                            <div className="space-y-3">
                              <h3 className="text-base sm:text-lg font-bold text-emerald-400">Impacto Jurídico</h3>
                              <div className="bg-muted/50 p-4 rounded-lg">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownExplicacao}>
                                  {analise.impactoJuridico}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <p className="text-sm text-muted-foreground">Análise não disponível</p>
                  <Button variant="outline" size="sm" onClick={() => setVisualizacaoAtiva('noticia')}>Ver notícia</Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Bottom menu */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
        <div className="flex justify-around items-center py-2 px-4">
          <button onClick={() => setVisualizacaoAtiva('noticia')} className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${visualizacaoAtiva === 'noticia' ? 'text-emerald-400 bg-emerald-400/10' : 'text-muted-foreground hover:text-foreground'}`}>
            <Newspaper className="w-5 h-5" />
            <span className="text-[10px] font-medium">Notícia</span>
          </button>
          <button onClick={() => setVisualizacaoAtiva('analise')} className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${visualizacaoAtiva === 'analise' ? 'text-emerald-400 bg-emerald-400/10' : 'text-muted-foreground hover:text-foreground'}`}>
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Explicação</span>
          </button>
          <button onClick={() => setVisualizacaoAtiva('termos')} className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${visualizacaoAtiva === 'termos' ? 'text-emerald-400 bg-emerald-400/10' : 'text-muted-foreground hover:text-foreground'}`}>
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium">Termos</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticiaLegislativaDetalhes;
