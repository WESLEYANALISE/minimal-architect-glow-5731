import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trophy, Plus, Calendar, Users, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AdminDesafiosSemanais = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", tema: "", pontos: 100 });

  useEffect(() => { if (user && !isAdmin) navigate("/", { replace: true }); }, [user, isAdmin]);

  const { data: desafios, isLoading } = useQuery({
    queryKey: ["admin-desafios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("desafios_semanais" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("desafios_semanais" as any).insert({
        titulo: form.titulo,
        descricao: form.descricao,
        tema: form.tema,
        pontos: form.pontos,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-desafios"] });
      setShowCreate(false);
      setForm({ titulo: "", descricao: "", tema: "", pontos: 100 });
      toast.success("Desafio criado!");
    },
    onError: () => toast.error("Erro ao criar desafio"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("desafios_semanais" as any).update({ ativo } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-desafios"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("desafios_semanais" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-desafios"] });
      toast.success("Desafio removido!");
    },
  });

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h1 className="text-lg font-bold">Desafios Semanais</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="ml-auto"><Plus className="w-4 h-4 mr-1" /> Novo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Desafio</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Título" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
              <Textarea placeholder="Descrição" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              <Input placeholder="Tema (ex: Direito Penal)" value={form.tema} onChange={e => setForm(f => ({ ...f, tema: e.target.value }))} />
              <Input type="number" placeholder="Pontos" value={form.pontos} onChange={e => setForm(f => ({ ...f, pontos: Number(e.target.value) }))} />
              <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.titulo || createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar Desafio"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> : desafios?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum desafio criado ainda</p>
        ) : desafios?.map((d: any) => (
          <Card key={d.id} className={`bg-card border-border ${!d.ativo ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{d.titulo}</h3>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{d.pontos} pts</span>
                  </div>
                  {d.descricao && <p className="text-xs text-muted-foreground mb-1">{d.descricao}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {d.tema && <span className="flex items-center gap-1">📚 {d.tema}</span>}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(d.data_inicio).toLocaleDateString("pt-BR")} — {new Date(d.data_fim).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Switch checked={d.ativo} onCheckedChange={(ativo) => toggleMutation.mutate({ id: d.id, ativo })} />
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(d.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDesafiosSemanais;
