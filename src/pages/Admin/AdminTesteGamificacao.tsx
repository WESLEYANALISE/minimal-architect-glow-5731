import { useState } from "react";
import { ArrowLeft, Loader2, Sparkles, Search, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
// compromise loaded via CDN to avoid OOM during build
const getNlp = async () => {
  if ((window as any).__compromise) return (window as any).__compromise;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/compromise@14.14.3/builds/compromise.min.js';
    script.onload = () => {
      (window as any).__compromise = (window as any).nlp;
      resolve((window as any).nlp);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// ── LangChain Tab ──
const LangChainTab = () => {
  const [tema, setTema] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const gerar = async () => {
    if (!tema.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("teste-langchain", { body: { tema } });
      if (error) throw error;
      setResult(data);
      toast({ title: "Cadeia gerada com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cadeia sequencial de prompts: tema → resumo → flashcards → questão. Tudo encadeado em uma única chamada.
      </p>
      <div className="flex gap-2">
        <Input placeholder="Ex: Princípio da Legalidade" value={tema} onChange={e => setTema(e.target.value)} onKeyDown={e => e.key === "Enter" && gerar()} />
        <Button onClick={gerar} disabled={loading || !tema.trim()}>
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          Gerar
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">📝 Resumo</CardTitle></CardHeader>
            <CardContent><p className="text-sm whitespace-pre-wrap">{result.resumo}</p></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">🃏 Flashcards ({result.flashcards?.length || 0})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {result.flashcards?.map((f: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm font-medium">Frente: {f.frente}</p>
                  <p className="text-sm text-muted-foreground mt-1">Verso: {f.verso}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {result.questao?.enunciado && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">❓ Questão</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">{result.questao.enunciado}</p>
                {result.questao.alternativas && Object.entries(result.questao.alternativas).map(([letra, texto]) => (
                  <p key={letra} className={`text-sm pl-2 ${letra === result.questao.resposta_correta ? "text-green-600 font-semibold" : ""}`}>
                    {letra}) {texto as string}
                  </p>
                ))}
                {result.questao.explicacao && (
                  <p className="text-xs text-muted-foreground mt-2 border-t pt-2">{result.questao.explicacao}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// ── RAG Tab ──
const RagTab = () => {
  const [texto, setTexto] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const buscar = async () => {
    if (!texto.trim() || !pergunta.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("teste-llamaindex", { body: { texto, pergunta } });
      if (error) throw error;
      setResult(data);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cole um texto longo e faça perguntas. A IA divide em chunks, calcula embeddings e busca os trechos mais relevantes.
      </p>
      <Textarea placeholder="Cole aqui um artigo de lei, doutrina ou texto jurídico longo..." value={texto} onChange={e => setTexto(e.target.value)} className="min-h-[120px]" />
      <div className="flex gap-2">
        <Input placeholder="Faça uma pergunta sobre o texto..." value={pergunta} onChange={e => setPergunta(e.target.value)} onKeyDown={e => e.key === "Enter" && buscar()} />
        <Button onClick={buscar} disabled={loading || !texto.trim() || !pergunta.trim()}>
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
          Buscar
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">💡 Resposta</CardTitle></CardHeader>
            <CardContent><p className="text-sm whitespace-pre-wrap">{result.resposta}</p></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">📄 Chunks Relevantes ({result.chunks_relevantes?.length || 0} de {result.total_chunks})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.chunks_relevantes?.map((c: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{c.similaridade}% similar</Badge>
                  </div>
                  <p className="text-xs">{c.texto}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// ── Compromise Tab ──
const CompromiseTab = () => {
  const [texto, setTexto] = useState("");
  const [result, setResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  const analisar = async () => {
    if (!texto.trim()) return;
    setLoading(true);
    try {
      const nlp = await getNlp();
      const doc = nlp(texto);
      setResult({
        pessoas: doc.people().out("array"),
        lugares: doc.places().out("array"),
        organizacoes: doc.organizations().out("array"),
        verbos: doc.verbs().out("array").slice(0, 20),
        substantivos: doc.nouns().out("array").slice(0, 20),
        numeros: (doc as any).values?.()?.out?.("array") || [],
        frases: doc.sentences().out("array").length,
        palavras: doc.wordCount(),
      });
    } finally {
      setLoading(false);
    }
  };

  const badgeColor: Record<string, string> = {
    pessoas: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    lugares: "bg-green-500/20 text-green-400 border-green-500/30",
    organizacoes: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    verbos: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    substantivos: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    numeros: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Análise NLP client-side (sem API). Cole um texto jurídico e extraia entidades, verbos e substantivos instantaneamente.
      </p>
      <Textarea placeholder="Cole aqui um texto jurídico para análise..." value={texto} onChange={e => setTexto(e.target.value)} className="min-h-[120px]" />
      <Button onClick={analisar} disabled={!texto.trim() || loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Analisar Texto
      </Button>

      {result && (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">{result.palavras} palavras</span>
            <span className="text-muted-foreground">{result.frases} frases</span>
          </div>

          {(["pessoas", "lugares", "organizacoes", "verbos", "substantivos", "numeros"] as const).map(key => (
            result[key]?.length > 0 && (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm capitalize">{key} ({result[key].length})</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  {result[key].map((item: string, i: number) => (
                    <span key={i} className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeColor[key]}`}>
                      {item}
                    </span>
                  ))}
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Page ──
const AdminTesteGamificacao = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Teste Gamificação</h1>
          <p className="text-xs text-muted-foreground">Laboratório de bibliotecas IA e NLP</p>
        </div>
      </div>

      <Tabs defaultValue="langchain" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="langchain" className="text-xs">LangChain</TabsTrigger>
          <TabsTrigger value="rag" className="text-xs">RAG</TabsTrigger>
          <TabsTrigger value="compromise" className="text-xs">NLP Local</TabsTrigger>
        </TabsList>

        <TabsContent value="langchain"><LangChainTab /></TabsContent>
        <TabsContent value="rag"><RagTab /></TabsContent>
        <TabsContent value="compromise"><CompromiseTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTesteGamificacao;
