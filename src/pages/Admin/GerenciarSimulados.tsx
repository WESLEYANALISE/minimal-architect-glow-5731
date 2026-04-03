import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, FileText, CheckCircle2, AlertCircle, Clock, Scale } from "lucide-react";
import { toast } from "sonner";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: Clock },
  processando: { label: "Processando", color: "bg-yellow-500/20 text-yellow-400", icon: Loader2 },
  pronto: { label: "Pronto", color: "bg-green-500/20 text-green-400", icon: CheckCircle2 },
  erro: { label: "Erro", color: "bg-red-500/20 text-red-400", icon: AlertCircle },
};

const GerenciarSimulados = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "", cargo: "", banca: "", ano: new Date().getFullYear(), orgao: "", cor: "#3b82f6", icone: "Scale",
  });
  const [urlProva, setUrlProva] = useState("");
  const [urlGabarito, setUrlGabarito] = useState("");
  const [selectedSimulado, setSelectedSimulado] = useState<string | null>(null);
  const [extraindoProva, setExtraindoProva] = useState(false);
  const [extraindoGabarito, setExtraindoGabarito] = useState(false);

  // Verificar admin
  const { data: user } = useQuery({
    queryKey: ["admin-check-simulados"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Buscar simulados
  const { data: simulados, isLoading } = useQuery({
    queryKey: ["admin-simulados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulados_concursos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Criar simulado
  const criarMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("simulados_concursos")
        .insert({ ...form })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Simulado criado!");
      setSelectedSimulado(data.id);
      setDialogOpen(false);
      setForm({ nome: "", cargo: "", banca: "", ano: new Date().getFullYear(), orgao: "", cor: "#3b82f6", icone: "Scale" });
      queryClient.invalidateQueries({ queryKey: ["admin-simulados"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Deletar simulado
  const deletarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("simulados_concursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Simulado deletado");
      setSelectedSimulado(null);
      queryClient.invalidateQueries({ queryKey: ["admin-simulados"] });
    },
  });

  // Extrair prova
  const extrairProva = async () => {
    if (!urlProva || !selectedSimulado) return;
    setExtraindoProva(true);
    try {
      const { data, error } = await supabase.functions.invoke("extrair-simulado-prova", {
        body: { url_prova: urlProva, simulado_id: selectedSimulado },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`${data.total_questoes} questões extraídas!`);
        queryClient.invalidateQueries({ queryKey: ["admin-simulados"] });
        queryClient.invalidateQueries({ queryKey: ["simulado-questoes-preview", selectedSimulado] });
      } else {
        toast.error(data?.error || "Erro na extração");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao extrair prova");
    } finally {
      setExtraindoProva(false);
    }
  };

  // Extrair gabarito
  const extrairGabarito = async () => {
    if (!urlGabarito || !selectedSimulado) return;
    setExtraindoGabarito(true);
    try {
      const { data, error } = await supabase.functions.invoke("extrair-simulado-gabarito", {
        body: { url_gabarito: urlGabarito, simulado_id: selectedSimulado },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`${data.atualizadas} questões atualizadas com gabarito!`);
        queryClient.invalidateQueries({ queryKey: ["simulado-questoes-preview", selectedSimulado] });
      } else {
        toast.error(data?.error || "Erro na extração do gabarito");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao extrair gabarito");
    } finally {
      setExtraindoGabarito(false);
    }
  };

  // Preview questões
  const { data: questoesPreview } = useQuery({
    queryKey: ["simulado-questoes-preview", selectedSimulado],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulados_questoes")
        .select("*")
        .eq("simulado_id", selectedSimulado!)
        .order("numero", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSimulado,
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Acesso restrito ao administrador.</p>
      </div>
    );
  }

  const simuladoSelecionado = simulados?.find((s) => s.id === selectedSimulado);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Gerenciar Simulados</h1>
            <p className="text-sm text-muted-foreground">{simulados?.length || 0} simulados cadastrados</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />Novo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Novo Simulado</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome do Concurso</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: TJ-SP 2024" /></div>
                <div><Label>Cargo</Label><Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Juiz Substituto" /></div>
                <div><Label>Banca</Label><Input value={form.banca} onChange={(e) => setForm({ ...form, banca: e.target.value })} placeholder="Ex: VUNESP" /></div>
                <div><Label>Ano</Label><Input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: parseInt(e.target.value) })} /></div>
                <div><Label>Órgão</Label><Input value={form.orgao} onChange={(e) => setForm({ ...form, orgao: e.target.value })} placeholder="Ex: Tribunal de Justiça de SP" /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><Label>Cor</Label><Input type="color" value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} /></div>
                  <div className="flex-1"><Label>Ícone</Label><Input value={form.icone} onChange={(e) => setForm({ ...form, icone: e.target.value })} placeholder="Scale" /></div>
                </div>
                <Button onClick={() => criarMutation.mutate()} disabled={!form.nome || criarMutation.isPending} className="w-full">
                  {criarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Criar Simulado
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de simulados */}
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {simulados?.map((s) => {
              const cfg = statusConfig[s.status] || statusConfig.rascunho;
              const StatusIcon = cfg.icon;
              const isSelected = selectedSimulado === s.id;
              return (
                <Card
                  key={s.id}
                  className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : "hover:bg-muted/30"}`}
                  onClick={() => setSelectedSimulado(isSelected ? null : s.id)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.cor}20` }}>
                      <Scale className="w-5 h-5" style={{ color: s.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.nome}</p>
                      <p className="text-xs text-muted-foreground">{s.cargo} • {s.banca} • {s.ano}</p>
                    </div>
                    <Badge className={cfg.color}><StatusIcon className={`w-3 h-3 mr-1 ${s.status === 'processando' ? 'animate-spin' : ''}`} />{cfg.label}</Badge>
                    <span className="text-xs text-muted-foreground">{s.total_questoes || 0}q</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Painel do simulado selecionado */}
        {simuladoSelecionado && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                {simuladoSelecionado.nome}
                <Button variant="destructive" size="sm" onClick={() => { if (confirm("Deletar simulado?")) deletarMutation.mutate(simuladoSelecionado.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Extrair Prova */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">URL da Prova</Label>
                <div className="flex gap-2">
                  <Input value={urlProva} onChange={(e) => setUrlProva(e.target.value)} placeholder="Cole o link da prova aqui..." className="flex-1" />
                  <Button onClick={extrairProva} disabled={!urlProva || extraindoProva} size="sm">
                    {extraindoProva ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileText className="w-4 h-4 mr-1" />}
                    Extrair
                  </Button>
                </div>
              </div>

              {/* Extrair Gabarito */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">URL do Gabarito</Label>
                <div className="flex gap-2">
                  <Input value={urlGabarito} onChange={(e) => setUrlGabarito(e.target.value)} placeholder="Cole o link do gabarito aqui..." className="flex-1" />
                  <Button onClick={extrairGabarito} disabled={!urlGabarito || extraindoGabarito} size="sm" variant="secondary">
                    {extraindoGabarito ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                    Gabarito
                  </Button>
                </div>
              </div>

              {/* Preview das questões */}
              {questoesPreview && questoesPreview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview ({questoesPreview.length} questões)</p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {questoesPreview.map((q) => (
                      <div key={q.id} className="p-2 rounded bg-muted/30 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">Q{q.numero}</Badge>
                          <span className="text-muted-foreground">{q.materia}</span>
                          {q.gabarito && <Badge className="bg-green-500/20 text-green-400 text-[10px]">{q.gabarito}</Badge>}
                        </div>
                        <p className="line-clamp-2">{q.enunciado}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GerenciarSimulados;
