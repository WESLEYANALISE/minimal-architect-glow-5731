import { useLocation, useNavigate } from "react-router-dom";
import { ExternalLink, FileText, Globe, Sparkles, BookOpen, ArrowLeft, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSubscription } from "@/contexts/SubscriptionContext";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from "@/integrations/supabase/client";

const formatarDataHora = (dataStr: string | null | undefined): string => {
  if (!dataStr) return '';
  try {
    const data = parseISO(dataStr);
    return format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dataStr;
  }
};

interface Noticia {
  id: string;
  categoria: string;
  portal: string;
  titulo: string;
  capa: string;
  link: string;
  dataHora: string;
  conteudo_formatado?: string;
  conteudo_completo?: string;
  descricao?: string;
  analise_ia?: string;
}

interface Termo {
  termo: string;
  significado: string;
}

interface AnaliseNoticia {
  resumoExecutivo: string;
  resumoFacil: string;
  pontosPrincipais: string[];
  impactoJuridico?: string;
}

type VisualizacaoAtiva = 'formatada' | 'original' | 'analise';
type SubMenuFormatada = 'noticia' | 'termos';
type SubMenuAnalise = 'executivo' | 'facil' | 'termos';

const NoticiaDetalhes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const noticia = location.state?.noticia as Noticia;
  
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState<VisualizacaoAtiva>('formatada');
  const [subMenuFormatada, setSubMenuFormatada] = useState<SubMenuFormatada>('noticia');
  const [subMenuAnalise, setSubMenuAnalise] = useState<SubMenuAnalise>('executivo');
  
  const [conteudoFormatado, setConteudoFormatado] = useState<string>('');
  const [analise, setAnalise] = useState<AnaliseNoticia | null>(null);
  const [termos, setTermos] = useState<Termo[]>([]);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (!noticia) {
      navigate('/noticias-juridicas');
    }
  }, [noticia, navigate]);

  // Carregar dados do cache — sem chamar Edge Function
  useEffect(() => {
    if (!noticia?.link) return;

    // Se já veio conteúdo no state, usar direto
    if (noticia.conteudo_formatado || noticia.conteudo_completo) {
      setConteudoFormatado(noticia.conteudo_formatado || noticia.conteudo_completo || '');
    }

    // Buscar cache completo (análise, termos, e conteúdo se não veio no state)
    const buscarCache = async () => {
      const isConcurso = noticia.id?.startsWith('concurso-');
      const tabela = isConcurso ? 'noticias_concursos_cache' : 'noticias_juridicas_cache';
      
      const { data: cacheData } = await supabase
        .from(tabela)
        .select('conteudo_formatado, conteudo_completo, analise_ia, termos_json')
        .eq('link', noticia.link)
        .maybeSingle();

      if (!cacheData) return;

      // Conteúdo (só atualiza se não veio no state)
      if (!noticia.conteudo_formatado && !noticia.conteudo_completo) {
        setConteudoFormatado(cacheData.conteudo_formatado || cacheData.conteudo_completo || '');
      }

      // Análise IA
      let analiseObj: any = cacheData.analise_ia;
      if (typeof analiseObj === 'string') {
        try { analiseObj = JSON.parse(analiseObj); } catch { /* ignore */ }
      }
      if (analiseObj && typeof analiseObj === 'object') {
        setAnalise({
          resumoExecutivo: analiseObj.resumoExecutivo || analiseObj.resumo_executivo || '',
          resumoFacil: analiseObj.resumoFacil || analiseObj.resumo_facil || '',
          pontosPrincipais: analiseObj.pontosPrincipais || analiseObj.pontos_principais || [],
          impactoJuridico: analiseObj.impactoJuridico || analiseObj.impacto_juridico || ''
        });
      }

      // Termos
      let termosArr: any = cacheData.termos_json || [];
      if (typeof termosArr === 'string') {
        try { termosArr = JSON.parse(termosArr); } catch { termosArr = []; }
      }
      setTermos(Array.isArray(termosArr) ? termosArr as Termo[] : []);
    };

    buscarCache();
  }, [noticia?.link]);

  const handleIframeError = () => setIframeError(true);

  const abrirExterno = () => {
    if (noticia?.link) window.open(noticia.link, '_blank');
  };

  if (!noticia) return null;

  // Determinar o conteúdo a exibir (fallback chain)
  const conteudoExibir = conteudoFormatado || noticia.descricao || '';

  const renderTermos = (termosLista: Termo[]) => (
    <div className="space-y-2">
      {termosLista.length === 0 ? (
        <p className="text-muted-foreground text-xs sm:text-sm">Nenhum termo identificado.</p>
      ) : (
        termosLista.map((t, idx) => (
          <div key={idx} className="p-2.5 sm:p-3 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-primary text-xs sm:text-sm">{t.termo}</h4>
            <p className="text-foreground text-[11px] sm:text-xs mt-1 leading-relaxed">{t.significado}</p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-background/95 backdrop-blur flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/noticias-juridicas')}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center text-destructive-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold line-clamp-2 text-foreground leading-snug">
            {noticia.titulo}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{noticia.portal}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={abrirExterno} className="flex-shrink-0">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 relative bg-background overflow-hidden">
        {visualizacaoAtiva === 'formatada' && (
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 pb-24">
              {/* Sub-menu */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSubMenuFormatada('noticia')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                    subMenuFormatada === 'noticia'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Notícia
                </button>
                <button
                  onClick={() => setSubMenuFormatada('termos')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                    subMenuFormatada === 'termos'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Termos ({termos.length})
                </button>
              </div>

              {subMenuFormatada === 'noticia' ? (
                <article className="space-y-3">
                  {noticia.capa && (
                    <img 
                      src={noticia.capa} 
                      alt={noticia.titulo}
                      className="w-full rounded-lg object-cover max-h-48 sm:max-h-64"
                    />
                  )}
                  
                  <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                    {noticia.titulo}
                  </h1>
                  
                  <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-xs text-muted-foreground border-b border-border pb-3">
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded">{noticia.portal}</span>
                    {noticia.dataHora && (
                      <span className="bg-muted px-2 py-0.5 rounded">{formatarDataHora(noticia.dataHora)}</span>
                    )}
                  </div>
                  
                  {conteudoExibir ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {conteudoExibir}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-xs sm:text-sm mb-3">
                        Conteúdo não disponível no app.
                      </p>
                      <Button onClick={abrirExterno} size="sm" variant="outline" className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Abrir no navegador
                      </Button>
                    </div>
                  )}
                </article>
              ) : (
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-primary mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                    Termos Jurídicos
                  </h2>
                  {renderTermos(termos)}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {visualizacaoAtiva === 'original' && (
          <>
            {!iframeError ? (
              <iframe
                src={noticia.link}
                className="w-full h-full border-0"
                title={noticia.titulo}
                onError={handleIframeError}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
                  Não foi possível carregar a página.
                </p>
                <Button onClick={abrirExterno} size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir no navegador
                </Button>
              </div>
            )}
          </>
        )}

        {visualizacaoAtiva === 'analise' && (
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 pb-24">
              {analise ? (
                <>
                  {/* Sub-menu Análise */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <button
                      onClick={() => setSubMenuAnalise('executivo')}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                        subMenuAnalise === 'executivo'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Resumo Executivo
                    </button>
                    <button
                      onClick={() => setSubMenuAnalise('facil')}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                        subMenuAnalise === 'facil'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Para Leigos
                    </button>
                    <button
                      onClick={() => setSubMenuAnalise('termos')}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                        subMenuAnalise === 'termos'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Termos ({termos.length})
                    </button>
                  </div>

                  {/* Gate Premium */}
                  {!isPremium && !loadingSubscription ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-amber-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                          <Crown className="w-5 h-5 text-amber-500" />
                          Análise Premium
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                          A análise jurídica detalhada com IA é exclusiva para assinantes Premium.
                        </p>
                      </div>
                      <Button 
                        onClick={() => navigate('/assinatura')}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white gap-2"
                      >
                        <Crown className="w-4 h-4" />
                        Seja Premium
                      </Button>
                    </div>
                  ) : (
                    <>
                      {subMenuAnalise === 'executivo' && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <h2 className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Resumo Executivo
                          </h2>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {analise.resumoExecutivo || 'Resumo não disponível.'}
                          </ReactMarkdown>

                          {analise.pontosPrincipais?.length > 0 && (
                            <>
                              <h3>Pontos Principais</h3>
                              <ul>
                                {analise.pontosPrincipais.map((ponto, idx) => (
                                  <li key={idx}>{ponto}</li>
                                ))}
                              </ul>
                            </>
                          )}

                          {analise.impactoJuridico && (
                            <>
                              <h3>Impacto Jurídico</h3>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {analise.impactoJuridico}
                              </ReactMarkdown>
                            </>
                          )}
                        </div>
                      )}

                      {subMenuAnalise === 'facil' && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <h2 className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Entenda de Forma Simples
                          </h2>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {analise.resumoFacil || 'Explicação simplificada não disponível.'}
                          </ReactMarkdown>
                        </div>
                      )}

                      {subMenuAnalise === 'termos' && (
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                            Termos Jurídicos
                          </h2>
                          {renderTermos(termos)}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <p className="text-sm text-muted-foreground">Análise não disponível</p>
                  <Button variant="outline" size="sm" onClick={() => setVisualizacaoAtiva('original')}>
                    Ver original
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Menu de Rodapé Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
        <div className="flex justify-around items-center py-2 px-4">
          <button
            onClick={() => setVisualizacaoAtiva('formatada')}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
              visualizacaoAtiva === 'formatada'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-medium">Resumo</span>
          </button>
          
          <button
            onClick={() => setVisualizacaoAtiva('original')}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
              visualizacaoAtiva === 'original'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-medium truncate max-w-[60px]">{noticia.portal}</span>
          </button>
          
          <button
            onClick={() => setVisualizacaoAtiva('analise')}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
              visualizacaoAtiva === 'analise'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-medium">Análise</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticiaDetalhes;
