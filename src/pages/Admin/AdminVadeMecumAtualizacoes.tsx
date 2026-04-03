import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, X, Clock, AlertTriangle, Plus, Minus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

interface AtualizacaoPendente {
  id: string;
  tabela: string;
  numero_lei_nova: string | null;
  ementa: string | null;
  artigos_afetados: {
    alterados: Array<{ numero: string; texto_antigo: string; texto_novo: string; id_atual: number }>;
    novos: Array<{ numero: string; texto_novo: string; ordem: number }>;
    removidos: Array<{ numero: string; texto_antigo: string; id_atual: number }>;
  };
  status: string;
  total_alterados: number;
  total_novos: number;
  total_removidos: number;
  created_at: string;
  aprovada_em: string | null;
}

const AdminVadeMecumAtualizacoes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<AtualizacaoPendente | null>(null);

  const { data: atualizacoes, isLoading } = useQuery({
    queryKey: ["vademecum-atualizacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vademecum_atualizacoes_pendentes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as AtualizacaoPendente[];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ id, acao }: { id: string; acao: "aprovar" | "rejeitar" }) => {
      const { data, error } = await supabase.functions.invoke("aplicar-atualizacao-vademecum", {
        body: { atualizacao_id: id, acao },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(variables.acao === "aprovar" ? "Atualização aprovada e aplicada!" : "Atualização rejeitada");
      queryClient.invalidateQueries({ queryKey: ["vademecum-atualizacoes"] });
      setSelectedItem(null);
    },
    onError: (err) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const pendentes = atualizacoes?.filter((a) => a.status === "pendente") || [];
  const processadas = atualizacoes?.filter((a) => a.status !== "pendente") || [];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Vade Mecum — Atualizações</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Revise e aprove mudanças legislativas antes de aplicar ao banco
            </p>
          </div>
        </div>

        {/* Pendentes */}
        {pendentes.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pendentes de Aprovação
              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">{pendentes.length}</Badge>
            </h2>
            {pendentes.map((item) => (
              <AtualizacaoCard
                key={item.id}
                item={item}
                onView={() => setSelectedItem(item)}
                onAprovar={() => mutation.mutate({ id: item.id, acao: "aprovar" })}
                onRejeitar={() => mutation.mutate({ id: item.id, acao: "rejeitar" })}
                loading={mutation.isPending}
              />
            ))}
          </div>
        )}

        {pendentes.length === 0 && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              <Check className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
              <p className="font-medium">Nenhuma atualização pendente</p>
              <p className="text-sm mt-1">Quando novas leis alterarem o Vade Mecum, as mudanças aparecerão aqui.</p>
            </CardContent>
          </Card>
        )}

        {/* Histórico */}
        {processadas.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-muted-foreground">Histórico</h2>
            {processadas.map((item) => (
              <AtualizacaoCard
                key={item.id}
                item={item}
                onView={() => setSelectedItem(item)}
                readonly
              />
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-10">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Dialog de detalhes/diff */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedItem?.tabela}</DialogTitle>
            <DialogDescription>
              {selectedItem?.ementa ? selectedItem.ementa.substring(0, 200) + "..." : "Detalhes da atualização"}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Alterados */}
              {selectedItem.artigos_afetados.alterados?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2 text-amber-600">
                    <RefreshCw className="h-4 w-4" />
                    Artigos Alterados ({selectedItem.artigos_afetados.alterados.length})
                  </h3>
                  {selectedItem.artigos_afetados.alterados.map((art, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <Badge variant="outline" className="font-mono">Art. {art.numero}</Badge>
                      <div className="bg-destructive/10 rounded p-2 text-sm">
                        <span className="text-destructive font-medium text-xs">ANTES:</span>
                        <p className="mt-1 text-foreground/80 line-through">{art.texto_antigo?.substring(0, 300)}</p>
                      </div>
                      <div className="bg-emerald-500/10 rounded p-2 text-sm">
                        <span className="text-emerald-600 font-medium text-xs">DEPOIS:</span>
                        <p className="mt-1 text-foreground/80">{art.texto_novo?.substring(0, 300)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Novos */}
              {selectedItem.artigos_afetados.novos?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2 text-emerald-600">
                    <Plus className="h-4 w-4" />
                    Artigos Novos ({selectedItem.artigos_afetados.novos.length})
                  </h3>
                  {selectedItem.artigos_afetados.novos.map((art, i) => (
                    <div key={i} className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-3">
                      <Badge variant="outline" className="font-mono text-emerald-600">Art. {art.numero}</Badge>
                      <p className="mt-2 text-sm text-foreground/80">{art.texto_novo?.substring(0, 300)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Removidos */}
              {selectedItem.artigos_afetados.removidos?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2 text-destructive">
                    <Minus className="h-4 w-4" />
                    Artigos Removidos ({selectedItem.artigos_afetados.removidos.length})
                  </h3>
                  {selectedItem.artigos_afetados.removidos.map((art, i) => (
                    <div key={i} className="border border-destructive/30 bg-destructive/5 rounded-lg p-3">
                      <Badge variant="outline" className="font-mono text-destructive">Art. {art.numero}</Badge>
                      <p className="mt-2 text-sm text-foreground/80 line-through">{art.texto_antigo?.substring(0, 300)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Ações */}
              {selectedItem.status === "pendente" && (
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => mutation.mutate({ id: selectedItem.id, acao: "aprovar" })}
                    disabled={mutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprovar e Aplicar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => mutation.mutate({ id: selectedItem.id, acao: "rejeitar" })}
                    disabled={mutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function AtualizacaoCard({
  item,
  onView,
  onAprovar,
  onRejeitar,
  loading,
  readonly,
}: {
  item: AtualizacaoPendente;
  onView: () => void;
  onAprovar?: () => void;
  onRejeitar?: () => void;
  loading?: boolean;
  readonly?: boolean;
}) {
  const statusBadge = {
    pendente: <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Pendente</Badge>,
    aprovada: <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Aprovada</Badge>,
    rejeitada: <Badge variant="destructive">Rejeitada</Badge>,
  };

  return (
    <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={onView}>
      <CardContent className="py-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{item.tabela}</h3>
              {statusBadge[item.status as keyof typeof statusBadge]}
            </div>
            {item.numero_lei_nova && (
              <p className="text-xs text-muted-foreground mt-1">Lei nº {item.numero_lei_nova}</p>
            )}
            <div className="flex gap-3 mt-2 text-xs">
              {item.total_alterados > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <RefreshCw className="h-3 w-3" /> {item.total_alterados} alterados
                </span>
              )}
              {item.total_novos > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Plus className="h-3 w-3" /> {item.total_novos} novos
                </span>
              )}
              {item.total_removidos > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <Minus className="h-3 w-3" /> {item.total_removidos} removidos
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {!readonly && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 h-8"
                onClick={onAprovar}
                disabled={loading}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={onRejeitar}
                disabled={loading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminVadeMecumAtualizacoes;
