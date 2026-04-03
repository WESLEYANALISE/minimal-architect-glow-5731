import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, BookOpen, Loader2, CheckCircle, 
  AlertCircle, Search, Eye, ChevronRight, Play, RefreshCw, ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LivroClassico {
  id: number;
  livro: string;
  autor: string;
  imagem: string;
  download: string;
  paginasExtraidas?: number;
  paginasFormatadas?: number;
  totalCapitulos?: number;
  status: "sem_ocr" | "ocr_feito" | "formatado";
}

interface CapituloIdentificado {
  numero: number;
  titulo: string;
  selecionado: boolean;
}

type StepType = "idle" | "analisando" | "confirmando" | "formatando" | "concluido" | "erro";

const AdminLeituraDinamica = () => {
  const navigate = useNavigate();
  const [livros, setLivros] = useState<LivroClassico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [livroSelecionado, setLivroSelecionado] = useState<LivroClassico | null>(null);
  const [step, setStep] = useState<StepType>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [capitulos, setCapitulos] = useState<CapituloIdentificado[]>([]);
  const [paginasOCR, setPaginasOCR] = useState(0);

  useEffect(() => { carregarLivros(); }, []);

  const carregarLivros = async () => {
    try {
      const { data: livrosData, error: livrosError } = await supabase
        .from("BIBLIOTECA-CLASSICOS")
        .select("id, livro, autor, imagem, download")
        .order("livro");
      if (livrosError) throw livrosError;

      const { data: paginasData } = await supabase
        .from("BIBLIOTECA-LEITURA-DINAMICA")
        .select("\"Titulo da Obra\"");

      const paginasMap = new Map<string, number>();
      paginasData?.forEach((row: any) => {
        const titulo = row["Titulo da Obra"];
        if (titulo) paginasMap.set(titulo, (paginasMap.get(titulo) || 0) + 1);
      });

      const { data: formatData } = await supabase
        .from("leitura_paginas_formatadas")
        .select("livro_titulo");

      const formatMap = new Map<string, number>();
      formatData?.forEach((row: any) => {
        if (row.livro_titulo) formatMap.set(row.livro_titulo, (formatMap.get(row.livro_titulo) || 0) + 1);
      });

      const livrosComStatus = (livrosData || []).map(livro => {
        const paginasExtraidas = paginasMap.get(livro.livro) || 0;
        const paginasFormatadas = formatMap.get(livro.livro) || 0;
        let status: LivroClassico["status"] = "sem_ocr";
        if (paginasFormatadas > 0) status = "formatado";
        else if (paginasExtraidas > 0) status = "ocr_feito";
        return { ...livro, paginasExtraidas, paginasFormatadas, status };
      });

      setLivros(livrosComStatus);
    } catch (error) {
      console.error("Erro ao carregar livros:", error);
      toast.error("Erro ao carregar livros");
    } finally {
      setCarregando(false);
    }
  };

  const livrosFiltrados = livros.filter(livro =>
    livro.livro?.toLowerCase().includes(busca.toLowerCase()) ||
    livro.autor?.toLowerCase().includes(busca.toLowerCase())
  );

  const addLog = (mensagem: string) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR");
    setLogs(prev => [...prev, `[${timestamp}] ${mensagem}`]);
  };

  // ===== ETAPA 1: Analisar (OCR + identificar capítulos) =====
  const analisarLivro = async () => {
    if (!livroSelecionado?.download) {
      toast.error("Este livro não tem link de download configurado");
      return;
    }

    setStep("analisando");
    setLogs([]);
    setErro(null);
    setCapitulos([]);

    try {
      addLog("🚀 Iniciando análise do livro...");
      addLog(`📥 Link: ${livroSelecionado.download.substring(0, 60)}...`);
      addLog("📄 Baixando PDF do Google Drive...");
      addLog("🔍 Extraindo texto com Mistral OCR...");
      addLog("🤖 Identificando capítulos pelo sumário...");

      const { data, error } = await supabase.functions.invoke("processar-livro-completo", {
        body: {
          mode: "analisar",
          livroId: livroSelecionado.id,
          tituloLivro: livroSelecionado.livro,
          driveUrl: livroSelecionado.download
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro na análise");

      setPaginasOCR(data.paginasOCR || 0);
      addLog(`✅ OCR concluído: ${data.paginasOCR} páginas extraídas`);
      addLog(`📚 ${data.capitulos?.length || 0} capítulos identificados no sumário`);

      const caps = (data.capitulos || []).map((c: any) => ({
        ...c,
        selecionado: true
      }));
      setCapitulos(caps);
      setStep("confirmando");
      toast.success("Análise concluída! Confirme os capítulos.");
    } catch (error: any) {
      console.error("Erro:", error);
      addLog(`❌ Erro: ${error.message}`);
      setErro(error.message);
      setStep("erro");
      toast.error(error.message);
    }
  };

  // ===== ETAPA 2: Formatar (com capítulos confirmados) =====
  const formatarLivro = async () => {
    if (!livroSelecionado) return;

    const capsSelecionados = capitulos
      .filter(c => c.selecionado)
      .map((c, idx) => ({ numero: idx + 1, titulo: c.titulo }));

    if (capsSelecionados.length === 0) {
      toast.error("Selecione pelo menos 1 capítulo");
      return;
    }

    setStep("formatando");
    addLog(`✨ Formatando ${capsSelecionados.length} capítulos com Gemini...`);

    try {
      const { data, error } = await supabase.functions.invoke("processar-livro-completo", {
        body: {
          mode: "formatar",
          livroId: livroSelecionado.id,
          tituloLivro: livroSelecionado.livro,
          capitulosConfirmados: capsSelecionados
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro na formatação");

      addLog(`✅ Formatação concluída!`);
      addLog(`📊 ${data.paginasFormatadas} páginas formatadas, ${data.capitulosEncontrados} capítulos`);
      setStep("concluido");
      toast.success(`${livroSelecionado.livro} formatado com sucesso!`);
      carregarLivros();
    } catch (error: any) {
      console.error("Erro:", error);
      addLog(`❌ Erro: ${error.message}`);
      setErro(error.message);
      setStep("erro");
      toast.error(error.message);
    }
  };

  const toggleCapitulo = (index: number) => {
    setCapitulos(prev => prev.map((c, i) => i === index ? { ...c, selecionado: !c.selecionado } : c));
  };

  const selecionarTodos = (value: boolean) => {
    setCapitulos(prev => prev.map(c => ({ ...c, selecionado: value })));
  };

  const getStatusBadge = (livro: LivroClassico) => {
    switch (livro.status) {
      case "formatado":
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            {livro.paginasFormatadas} pág. formatadas
          </Badge>
        );
      case "ocr_feito":
        return (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            OCR: {livro.paginasExtraidas} pág.
          </Badge>
        );
      default:
        return livro.download ? (
          <Badge variant="outline" className="text-muted-foreground">
            Aguardando processamento
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-400 border-red-500/30">
            Sem link de download
          </Badge>
        );
    }
  };

  const voltarParaLista = () => {
    setLivroSelecionado(null);
    setStep("idle");
    setLogs([]);
    setErro(null);
    setCapitulos([]);
  };

  const capsSelecionados = capitulos.filter(c => c.selecionado).length;

  // VIEW: Detalhes do livro selecionado
  if (livroSelecionado) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-6">
        <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={voltarParaLista}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                {livroSelecionado.livro}
              </h1>
              <p className="text-sm text-muted-foreground">{livroSelecionado.autor}</p>
            </div>
          </div>

          {/* Card do livro */}
          <div className="flex gap-4 bg-card border border-border rounded-xl p-4">
            <img src={livroSelecionado.imagem} alt={livroSelecionado.livro} className="w-20 h-28 object-cover rounded-lg" />
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">{livroSelecionado.livro}</h2>
              <p className="text-sm text-muted-foreground mb-2">{livroSelecionado.autor}</p>
              {getStatusBadge(livroSelecionado)}
              {livroSelecionado.download && (
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  🔗 {livroSelecionado.download.substring(0, 50)}...
                </p>
              )}
            </div>
          </div>

          {/* Botões de ação por step */}
          {step === "idle" && (
            <div className="flex gap-2">
              <Button onClick={analisarLivro} disabled={!livroSelecionado.download} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Analisar Livro
              </Button>
              {livroSelecionado.status === "formatado" && (
                <Button variant="secondary" onClick={() => navigate(`/bibliotecas/classicos/${livroSelecionado.id}`)}>
                  <Eye className="w-4 h-4 mr-2" />Visualizar
                </Button>
              )}
            </div>
          )}

          {step === "analisando" && (
            <Button disabled className="w-full">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando (OCR + Capítulos)...
            </Button>
          )}

          {/* Tela de confirmação de capítulos */}
          {step === "confirmando" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-amber-500" />
                  Capítulos Identificados ({capitulos.length})
                </h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => selecionarTodos(true)}>
                    Todos
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => selecionarTodos(false)}>
                    Nenhum
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Desmarque capítulos que NÃO fazem parte do livro (textos editoriais, prefácios de coleção, etc.)
              </p>

              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {capitulos.map((cap, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => toggleCapitulo(idx)}
                  >
                    <Checkbox
                      checked={cap.selecionado}
                      onCheckedChange={() => toggleCapitulo(idx)}
                    />
                    <span className="text-xs text-muted-foreground font-mono w-6">
                      {cap.numero}
                    </span>
                    <span className={`text-sm flex-1 ${cap.selecionado ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      {cap.titulo}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setStep("idle"); setCapitulos([]); }} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={formatarLivro} disabled={capsSelecionados === 0} className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar {capsSelecionados} Capítulos
                </Button>
              </div>
            </div>
          )}

          {step === "formatando" && (
            <Button disabled className="w-full">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Formatando {capsSelecionados} capítulos...
            </Button>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-2 text-sm">Pipeline</h3>
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {logs.map((log, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground font-mono">{log}</p>
                  ))}
                  {(step === "analisando" || step === "formatando") && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                      <span className="text-xs text-amber-500">Processando (pode levar alguns minutos)...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {step === "concluido" && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center space-y-3">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
              <p className="text-green-400 font-medium">Processamento concluído!</p>
              <p className="text-xs text-muted-foreground">O livro está pronto para leitura dinâmica</p>
              <Button variant="secondary" onClick={() => navigate(`/bibliotecas/classicos/${livroSelecionado.id}`)}>
                <Eye className="w-4 h-4 mr-2" />Visualizar Livro
              </Button>
            </div>
          )}

          {step === "erro" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-red-400 font-medium">Erro no processamento</p>
              <p className="text-xs text-muted-foreground">{erro}</p>
              <Button variant="outline" onClick={() => setStep("idle")}>
                <RefreshCw className="w-4 h-4 mr-2" />Tentar Novamente
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // VIEW: Lista de livros
  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-500" />
              Leitura Dinâmica
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analisar → Confirmar Capítulos → Formatar
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar livro ou autor..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>

        <div className="flex gap-2 text-xs">
          <Badge variant="secondary" className="bg-green-500/10 text-green-400">
            {livros.filter(l => l.status === "formatado").length} formatados
          </Badge>
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-400">
            {livros.filter(l => l.status === "ocr_feito").length} OCR
          </Badge>
          <Badge variant="outline">
            {livros.filter(l => l.status === "sem_ocr").length} pendentes
          </Badge>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2 pr-2">
              {livrosFiltrados.map(livro => (
                <div
                  key={livro.id}
                  onClick={() => setLivroSelecionado(livro)}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <img src={livro.imagem} alt={livro.livro} className="w-12 h-16 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate">{livro.livro}</h3>
                    <p className="text-xs text-muted-foreground truncate mb-1">{livro.autor}</p>
                    {getStatusBadge(livro)}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default AdminLeituraDinamica;
