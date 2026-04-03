import { useState, useEffect } from "react";
import { ExternalLink, ArrowRightLeft, Plus, Trash2, Sparkles, Loader2, AlertTriangle, Calendar, Scale, FileText, BookOpen, X, RefreshCw, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import brasaoRepublica from "@/assets/brasao-republica.png?format=webp&quality=80";

interface RaioXDetalheProps {
  item: any;
  open: boolean;
  onClose: () => void;
}

const TIPO_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; icon: React.ElementType }> = {
  alteracao: { label: "Alteração", bgColor: "bg-amber-500/25", textColor: "text-amber-300", icon: ArrowRightLeft },
  nova: { label: "Nova Lei", bgColor: "bg-emerald-500/25", textColor: "text-emerald-300", icon: Plus },
  inclusao: { label: "Inclusão", bgColor: "bg-cyan-500/25", textColor: "text-cyan-300", icon: Plus },
  revogacao: { label: "Revogação", bgColor: "bg-red-500/25", textColor: "text-red-300", icon: Trash2 },
  vide: { label: "Referência", bgColor: "bg-blue-500/25", textColor: "text-blue-300", icon: BookOpen },
};

export const RaioXDetalhe = ({ item, open, onClose }: RaioXDetalheProps) => {
  const [explicacaoLei, setExplicacaoLei] = useState<string | null>(null);
  const [loadingExplicacao, setLoadingExplicacao] = useState(false);
  const [artigos, setArtigos] = useState<Array<{ numero: string; texto: string; capitulo?: string; secao?: string }>>([]);
  const [extracting, setExtracting] = useState(false);
  const [explicacoesArtigos, setExplicacoesArtigos] = useState<Record<number, string>>({});
  const [loadingExplicacaoArtigo, setLoadingExplicacaoArtigo] = useState<number | null>(null);

  const resenha = item?.resenha_diaria;

  // Reset state when item changes
  useEffect(() => {
    if (!item || !open) return;
    setExplicacaoLei(resenha?.explicacao_lei || null);
    setExplicacoesArtigos({});
    
    // Parse existing artigos
    const parsed = parseArtigos(resenha?.artigos);
    setArtigos(parsed);

    // Auto-extract if no artigos
    if (parsed.length === 0 && resenha?.url_planalto) {
      extrairArtigos();
    }
  }, [item?.id, open]);

  if (!item) return null;

  const tipoConfig = TIPO_CONFIG[item.tipo_alteracao] || TIPO_CONFIG.nova;
  const TipoIcon = tipoConfig.icon;

  const dataPub = resenha?.data_publicacao
    ? format(new Date(resenha.data_publicacao + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  function parseArtigos(raw: any): Array<{ numero: string; texto: string; capitulo?: string; secao?: string }> {
    try {
      if (!raw) return [];
      const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(arr) && arr.length > 0) return arr;
      return [];
    } catch { return []; }
  }

  const extrairArtigos = async () => {
    if (!resenha?.url_planalto || !resenha?.id) return;
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extrair-lei-planalto", {
        body: { resenha_id: resenha.id, url_planalto: resenha.url_planalto }
      });
      if (error) throw error;
      if (data?.success && data.artigos && data.total_artigos > 0) {
        setArtigos(data.artigos);
        toast.success(`${data.total_artigos} artigos extraídos!`);
      } else if (data?.success && data.total_artigos === 0) {
        toast.error("Página não encontrada no Planalto. A URL pode estar desatualizada.");
      } else {
        toast.error(data?.error || "Não foi possível extrair os artigos");
      }
    } catch (err) {
      console.error("Erro ao extrair:", err);
      toast.error("Erro ao extrair artigos do Planalto");
    } finally {
      setExtracting(false);
    }
  };

  const handleExplicarLei = async () => {
    if (explicacaoLei || loadingExplicacao) return;
    setLoadingExplicacao(true);
    try {
      const { data, error } = await supabase.functions.invoke("explicar-raio-x", {
        body: {
          numero_lei: resenha?.numero_lei || "",
          ementa: resenha?.ementa || "",
          lei_afetada: item.lei_afetada || "",
          artigos_afetados: item.artigos_afetados || [],
          tipo_alteracao: item.tipo_alteracao,
        },
      });
      if (error) throw error;
      setExplicacaoLei(data?.explicacao || "Não foi possível gerar a explicação.");
    } catch {
      setExplicacaoLei("Erro ao gerar explicação. Tente novamente.");
    } finally {
      setLoadingExplicacao(false);
    }
  };

  const gerarExplicacaoArtigo = async (index: number, artigo: { numero: string; texto: string }) => {
    if (explicacoesArtigos[index]) return;
    setLoadingExplicacaoArtigo(index);
    try {
      const prompt = `Explique de forma clara e didática o seguinte artigo de lei:

**${artigo.numero}**
${artigo.texto}

Lei: ${resenha?.numero_lei}
${resenha?.ementa || ''}

Explique em português brasileiro:
- O que este artigo determina
- Como afeta na prática
- Termos técnicos usados

Seja objetivo e use linguagem acessível.`;

      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: { message: prompt }
      });
      if (error) throw error;
      setExplicacoesArtigos(prev => ({ ...prev, [index]: data?.response || "Não foi possível gerar." }));
    } catch {
      setExplicacoesArtigos(prev => ({ ...prev, [index]: "Erro ao gerar explicação." }));
    } finally {
      setLoadingExplicacaoArtigo(null);
    }
  };

  const formatarNumeroArtigo = (numero: string | number | null | undefined) => {
    if (!numero) return "Art.";
    const str = String(numero).trim();
    if (/^Art\./i.test(str)) return str;
    const num = str.replace(/\D/g, "");
    if (!num) return str;
    return `Art. ${num}°`;
  };

  const decodeHtmlEntities = (text: string) => {
    if (!text) return "";
    return text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  };

  const formatarTextoComParagrafos = (texto: string) => {
    if (!texto) return [];
    let t = decodeHtmlEntities(texto);
    t = t
      .replace(/(§\s*\d+[º°]?\.?)\s*\n+\s*/g, "$1 ")
      .replace(/([.!?;:])\s*(§\s*\d)/g, "$1\n\n$2")
      .replace(/([.!?;:])\s*([IVXLCDM]+\s*[-–])/g, "$1\n\n$2")
      .replace(/([.!?;:])\s*(Parágrafo)/g, "$1\n\n$2");
    return t.split(/\n\n+/).filter(p => p.trim()).map(p => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim());
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl bg-background border-border/30 overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-lg border-b border-border/30 px-4 py-3">
          <SheetTitle className="text-base font-bold text-foreground line-clamp-1 text-left">
            {resenha?.numero_lei || "Detalhes da Lei"}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 py-5 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${tipoConfig.bgColor} ${tipoConfig.textColor}`}>
              <TipoIcon className="w-4 h-4" />
              {tipoConfig.label}
            </span>
            {item.relevancia === "alta" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                Alta relevância
              </span>
            )}
            {dataPub && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/60 text-foreground ml-auto">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {dataPub}
              </span>
            )}
          </div>

          {/* Brasão + Cabeçalho estilo Lei do Dia */}
          <div className="flex flex-col items-center">
            <img src={brasaoRepublica} alt="Brasão da República" className="h-14 w-auto" />
            <div className="text-center mt-2 text-[#8B7355] text-[10px] font-medium">
              <p>Presidência da República</p>
              <p>Casa Civil</p>
            </div>
            <h2 className="text-sm font-bold text-primary uppercase tracking-wide mt-3 text-center">
              {resenha?.numero_lei}
            </h2>
          </div>

          {/* Ementa em vermelho itálico */}
          {resenha?.ementa && (
            <p className="text-xs text-red-500 italic text-center max-w-lg mx-auto leading-relaxed">
              {decodeHtmlEntities(resenha.ementa)}
            </p>
          )}

          {/* Lei afetada */}
          {item.lei_afetada && (
            <div className="bg-amber-500/10 rounded-xl border border-amber-500/25 p-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Lei Afetada</span>
              </div>
              <p className="text-sm text-foreground font-semibold mt-1">{item.lei_afetada}</p>
            </div>
          )}

          {/* Artigos afetados (chips do raio-x) */}
          {item.artigos_afetados?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                Artigos Afetados ({item.artigos_afetados.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.artigos_afetados.map((art: string, i: number) => (
                  <span key={i} className="text-xs px-3 py-1.5 bg-amber-500/15 text-amber-300 rounded-lg font-mono border border-amber-500/20 font-semibold">
                    {art}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resumo da alteração */}
          {item.resumo_alteracao && (
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
              <h3 className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Resumo da Alteração</h3>
              <p className="text-sm text-foreground/90 leading-relaxed">{item.resumo_alteracao}</p>
            </div>
          )}

          {/* Extracting state */}
          {extracting && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="p-4 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                <p className="text-sm font-semibold text-amber-300">Extraindo artigos do Planalto...</p>
                <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
              </CardContent>
            </Card>
          )}

          {/* No articles + can retry */}
          {!extracting && artigos.length === 0 && resenha?.url_planalto && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-amber-500">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold text-sm">Artigos não extraídos</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique para buscar o texto completo desta lei no Planalto.
                </p>
                <Button onClick={extrairArtigos} size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Extrair artigos agora
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lista de Artigos — estilo Lei do Dia com Drawer */}
          {artigos.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                Artigos ({artigos.length})
              </h3>

              {artigos.map((artigo, index) => {
                const artigoFormatado = formatarNumeroArtigo(artigo.numero);
                return (
                  <Drawer key={index} onOpenChange={(isOpen) => {
                    if (isOpen) gerarExplicacaoArtigo(index, artigo);
                  }}>
                    <DrawerTrigger asChild>
                      <Card className="cursor-pointer hover:bg-muted transition-colors border-l-4 border-l-amber-500 bg-card">
                        <CardContent className="p-3 flex items-center gap-3">
                          <Scale className="w-5 h-5 text-amber-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground text-sm mb-0.5">
                              {artigoFormatado}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {decodeHtmlEntities(artigo.texto).substring(0, 120)}...
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </DrawerTrigger>

                    <DrawerContent className="max-h-[85vh]">
                      <DrawerHeader className="border-b border-border/30 pb-3">
                        <div className="flex items-center justify-between">
                          <DrawerTitle className="text-amber-500 font-bold">
                            {artigoFormatado}
                          </DrawerTitle>
                          <DrawerClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <X className="w-4 h-4" />
                            </Button>
                          </DrawerClose>
                        </div>
                      </DrawerHeader>

                      <Tabs defaultValue="texto" className="flex-1">
                        <TabsList className="grid w-full grid-cols-2 mx-4 mt-3" style={{ width: 'calc(100% - 2rem)' }}>
                          <TabsTrigger value="texto" className="gap-1.5 text-xs">
                            <FileText className="w-3.5 h-3.5" />
                            Texto
                          </TabsTrigger>
                          <TabsTrigger value="explicacao" className="gap-1.5 text-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                            Explicação IA
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="texto" className="px-4 py-3 overflow-y-auto max-h-[55vh]">
                          <div className="space-y-3">
                            {artigo.capitulo && (
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {artigo.capitulo}
                              </p>
                            )}
                            {artigo.secao && (
                              <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                                {artigo.secao}
                              </p>
                            )}
                            {formatarTextoComParagrafos(artigo.texto).map((paragrafo, pi) => (
                              <p key={pi} className="text-sm text-foreground/90 leading-relaxed font-serif">
                                {paragrafo}
                              </p>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="explicacao" className="px-4 py-3 overflow-y-auto max-h-[55vh]">
                          {loadingExplicacaoArtigo === index ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                              <p className="text-xs text-muted-foreground">Gerando explicação...</p>
                            </div>
                          ) : explicacoesArtigos[index] ? (
                            <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {explicacoesArtigos[index]}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                              <Sparkles className="w-8 h-8 text-violet-400/40" />
                              <p className="text-xs text-muted-foreground">A explicação será gerada automaticamente</p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </DrawerContent>
                  </Drawer>
                );
              })}
            </div>
          )}

          {/* Texto formatado fallback */}
          {artigos.length === 0 && !extracting && resenha?.texto_formatado && (
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Texto da Lei</h3>
              </div>
              <div className="text-sm text-foreground/90 leading-relaxed font-serif whitespace-pre-line">
                {resenha.texto_formatado}
              </div>
            </div>
          )}

          {/* Explicação IA da lei completa */}
          <div className="bg-violet-500/5 rounded-xl border border-violet-500/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Explicação Simplificada</h3>
              </div>
              {!explicacaoLei && (
                <button
                  onClick={handleExplicarLei}
                  disabled={loadingExplicacao}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                >
                  {loadingExplicacao ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {loadingExplicacao ? "Gerando..." : "Gerar explicação"}
                </button>
              )}
            </div>
            {explicacaoLei ? (
              <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{explicacaoLei}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">
                Clique para gerar uma explicação simples e didática desta alteração.
              </p>
            )}
          </div>

          {/* Botão Planalto */}
          {resenha?.url_planalto && (
            <a
              href={resenha.url_planalto}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              Ver texto completo no Planalto
            </a>
          )}

          <div className="h-8" />
        </div>
      </SheetContent>
    </Sheet>
  );
};
