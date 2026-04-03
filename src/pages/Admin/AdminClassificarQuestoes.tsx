import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, CheckCircle2, Loader2, Tag, MessageCircle, Eye, Globe, Sparkles, ExternalLink, FlaskConical, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const toTitleCase = (str: string) =>
  str.toLowerCase().replace(/(?:^|\s|[-/])\S/g, (c) => c.toUpperCase());

interface Candidato {
  id: string;
  label: string;
  mecanica: string;
  modelo_solicitado: string;
  modelo_usado: string;
  comentario: string;
  fontes: string[];
}

const AdminClassificarQuestoes = () => {
  const navigate = useNavigate();
  const [selectedSimulado, setSelectedSimulado] = useState<string>("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [previewQuestao, setPreviewQuestao] = useState<any | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [comparando, setComparando] = useState(false);
  const [aplicando, setAplicando] = useState<string | null>(null);

  const { data: simulados } = useQuery({
    queryKey: ["admin-simulados-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulados_concursos")
        .select("id, nome, cargo, ano, total_questoes")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: questoes, refetch: refetchQuestoes } = useQuery({
    queryKey: ["admin-simulado-questoes", selectedSimulado],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulados_questoes")
        .select("id, numero, enunciado, materia, gabarito, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, tema_qc, subtema_qc, comentario_ia, fonte_classificacao, fontes_comentario" as any)
        .eq("simulado_id", selectedSimulado)
        .order("numero", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!selectedSimulado,
  });

  const classificarQuestao = async (questaoId: string) => {
    setProcessing(questaoId);
    try {
      const { data, error } = await supabase.functions.invoke("classificar-questao-concurso", {
        body: { questaoId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const fonteLabel = data.fonte === 'qconcursos' ? 'QConcursos' : 'Gemini';
      toast.success(`Classificada via ${fonteLabel}: ${data.tema_qc}${data.subtema_qc ? ` › ${data.subtema_qc}` : ""}`);
      refetchQuestoes();
    } catch (err: any) {
      toast.error(err.message || "Erro ao classificar");
    } finally {
      setProcessing(null);
    }
  };

  const classificarTodas = async () => {
    if (!questoes) return;
    const pendentes = questoes.filter(q => !q.tema_qc || !q.comentario_ia);
    if (pendentes.length === 0) {
      toast.info("Todas as questões já foram classificadas!");
      return;
    }
    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: pendentes.length });
    for (let i = 0; i < pendentes.length; i++) {
      setBatchProgress({ current: i + 1, total: pendentes.length });
      try {
        await supabase.functions.invoke("classificar-questao-concurso", {
          body: { questaoId: pendentes[i].id },
        });
      } catch (err) {
        console.error(`Erro na questão ${pendentes[i].numero}:`, err);
      }
      if (i < pendentes.length - 1) await new Promise(r => setTimeout(r, 2000));
    }
    setBatchProcessing(false);
    setBatchProgress({ current: 0, total: 0 });
    refetchQuestoes();
    toast.success(`${pendentes.length} questões classificadas!`);
  };

  const gerarComparacao = async () => {
    if (!previewQuestao) return;
    setComparando(true);
    setCandidatos([]);
    try {
      const { data, error } = await supabase.functions.invoke("classificar-questao-concurso", {
        body: { questaoId: previewQuestao.id, action: 'preview_compare' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCandidatos(data.candidatos || []);
      toast.success("3 versões geradas!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar comparação");
    } finally {
      setComparando(false);
    }
  };

  const escolherCandidato = async (candidato: Candidato) => {
    if (!previewQuestao) return;
    setAplicando(candidato.id);
    try {
      const { data, error } = await supabase.functions.invoke("classificar-questao-concurso", {
        body: {
          questaoId: previewQuestao.id,
          action: 'preview_apply',
          comentario: candidato.comentario,
          fontes: candidato.fontes.length > 0 ? candidato.fontes : null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      // Update local state
      setPreviewQuestao((prev: any) => ({
        ...prev,
        comentario_ia: candidato.comentario,
        fontes_comentario: candidato.fontes.length > 0 ? candidato.fontes : null,
      }));
      setCandidatos([]);
      refetchQuestoes();
      toast.success(`Versão ${candidato.id} (${candidato.mecanica}) salva como oficial!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setAplicando(null);
    }
  };

  const totalClassificadas = questoes?.filter(q => q.tema_qc).length || 0;
  const totalComComentario = questoes?.filter(q => q.comentario_ia).length || 0;
  const totalQuestoes = questoes?.length || 0;

  const FonteBadge = ({ fonte }: { fonte: string | null }) => {
    if (!fonte) return null;
    if (fonte === 'qconcursos') {
      return (
        <Badge className="bg-purple-500/15 text-purple-500 text-[10px] border-0 gap-0.5">
          <Globe className="w-2.5 h-2.5" />
          QC
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/15 text-amber-500 text-[10px] border-0 gap-0.5">
        <Sparkles className="w-2.5 h-2.5" />
        IA
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Classificar Questões</h1>
            <p className="text-xs text-muted-foreground">Buscar tema/subtema + comentário IA</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Select value={selectedSimulado} onValueChange={setSelectedSimulado}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um simulado..." />
          </SelectTrigger>
          <SelectContent>
            {simulados?.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {toTitleCase(s.nome || "")} {s.cargo ? `– ${toTitleCase(s.cargo)}` : ""} {s.ano ? `(${s.ano})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {questoes && questoes.length > 0 && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  <Tag className="w-4 h-4 inline mr-1 text-emerald-500" />
                  Tema: {totalClassificadas}/{totalQuestoes}
                </p>
                <p className="text-sm font-medium">
                  <MessageCircle className="w-4 h-4 inline mr-1 text-blue-500" />
                  Comentário: {totalComComentario}/{totalQuestoes}
                </p>
              </div>
              <Button
                onClick={classificarTodas}
                disabled={batchProcessing || !!processing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {batchProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    {batchProgress.current}/{batchProgress.total}
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-1" />
                    Classificar Todas
                  </>
                )}
              </Button>
            </div>
            {batchProcessing && (
              <Progress
                value={(batchProgress.current / batchProgress.total) * 100}
                className="h-2 [&>div]:bg-emerald-500"
              />
            )}
          </Card>
        )}

        <div className="space-y-2">
          {questoes?.map(q => (
            <Card key={q.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-muted-foreground">Q{q.numero}</span>
                    {q.tema_qc ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px] border-0">
                        {q.tema_qc}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Pendente</Badge>
                    )}
                    {q.comentario_ia && (
                      <Badge className="bg-blue-500/15 text-blue-600 text-[10px] border-0">
                        <MessageCircle className="w-3 h-3 mr-0.5" />
                        Comentário
                      </Badge>
                    )}
                    <FonteBadge fonte={q.fonte_classificacao} />
                  </div>
                  {q.subtema_qc && (
                    <p className="text-[10px] text-muted-foreground mb-1">
                      ▸ {q.subtema_qc}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {q.enunciado?.substring(0, 120)}...
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setPreviewQuestao(q); setCandidatos([]); }}
                    className="text-blue-500 hover:text-blue-400 px-2"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={q.tema_qc ? "outline" : "default"}
                    onClick={() => classificarQuestao(q.id)}
                    disabled={!!processing || batchProcessing}
                  >
                    {processing === q.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : q.tema_qc ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selectedSimulado && questoes?.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma questão encontrada neste simulado.
          </p>
        )}
        {!selectedSimulado && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Selecione um simulado para ver as questões.
          </p>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewQuestao} onOpenChange={(open) => { if (!open) { setPreviewQuestao(null); setCandidatos([]); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2 border-b">
            <DialogTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              Preview — Q{previewQuestao?.numero}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh] px-4 pb-4">
            {previewQuestao && (
              <div className="space-y-4 pt-2">
                {/* Tema / Subtema + Fonte */}
                <div className="flex flex-wrap items-center gap-2">
                  {previewQuestao.tema_qc && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-xs">
                      {previewQuestao.tema_qc}
                    </Badge>
                  )}
                  {previewQuestao.subtema_qc && (
                    <span className="text-xs text-muted-foreground">▸ {previewQuestao.subtema_qc}</span>
                  )}
                  <FonteBadge fonte={previewQuestao.fonte_classificacao} />
                </div>

                {/* Enunciado */}
                <div className="text-sm leading-relaxed">
                  {previewQuestao.enunciado}
                </div>

                {/* Alternativas */}
                <div className="space-y-2">
                  {['a', 'b', 'c', 'd', 'e'].map(letra => {
                    const texto = previewQuestao[`alternativa_${letra}`];
                    if (!texto) return null;
                    const isCorreta = previewQuestao.gabarito?.toUpperCase() === letra.toUpperCase();
                    return (
                      <div
                        key={letra}
                        className={`p-2.5 rounded-lg border text-sm ${
                          isCorreta
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                            : 'border-border/50 bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        <span className="font-bold mr-2">{letra.toUpperCase()})</span>
                        {texto}
                      </div>
                    );
                  })}
                </div>

                {/* Comentário IA atual */}
                {previewQuestao.comentario_ia && candidatos.length === 0 && (
                  <Card className="p-3 border-blue-500/30 bg-blue-500/5">
                    <p className="text-xs font-semibold text-blue-500 mb-2 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      Comentário da IA (atual)
                    </p>
                    <div className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>p:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {previewQuestao.comentario_ia}
                      </ReactMarkdown>
                    </div>
                    {previewQuestao.fontes_comentario && previewQuestao.fontes_comentario.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-blue-500/20">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Fontes consultadas
                        </p>
                        <div className="space-y-1">
                          {previewQuestao.fontes_comentario.map((fonte: string, i: number) => (
                            <a key={i} href={fonte} target="_blank" rel="noopener noreferrer"
                              className="block text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2 truncate" title={fonte}>
                              {fonte.replace(/^https?:\/\/(www\.)?/, '').substring(0, 80)}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Botão Comparar */}
                <Button
                  onClick={gerarComparacao}
                  disabled={comparando}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {comparando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Gerando 3 versões...
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-4 h-4 mr-2" />
                      Gerar 3 Versões (Comparar)
                    </>
                  )}
                </Button>

                {/* Candidatos */}
                {candidatos.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Escolha a melhor versão:
                    </p>
                    {candidatos.map(c => (
                      <Card key={c.id} className="p-3 border-violet-500/30 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className="bg-violet-500/15 text-violet-500 text-[10px] border-0 font-bold">
                              {c.id}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {c.mecanica}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] text-muted-foreground">
                              {c.modelo_usado}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>p:last-child]:mb-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {c.comentario}
                          </ReactMarkdown>
                        </div>

                        {c.fontes.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> Fontes
                            </p>
                            {c.fontes.map((f, i) => (
                              <a key={i} href={f} target="_blank" rel="noopener noreferrer"
                                className="block text-[11px] text-blue-400 hover:text-blue-300 underline truncate">
                                {f.replace(/^https?:\/\/(www\.)?/, '').substring(0, 70)}
                              </a>
                            ))}
                          </div>
                        )}

                        <Button
                          size="sm"
                          onClick={() => escolherCandidato(c)}
                          disabled={!!aplicando}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {aplicando === c.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Escolher esta resposta
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClassificarQuestoes;