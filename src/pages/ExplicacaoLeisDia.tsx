import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";

interface ExplicacaoDia {
  id: string;
  data: string;
  titulo: string;
  capa_url: string | null;
  total_leis: number;
  status: string;
  created_at: string;
}

export default function ExplicacaoLeisDia() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const { data: explicacoes, isLoading } = useQuery({
    queryKey: ["explicacao-leis-dia-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("explicacao_leis_dia")
        .select("id, data, titulo, capa_url, total_leis, status, created_at")
        .eq("status", "concluido")
        .order("data", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as ExplicacaoDia[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleGerar = async () => {
    const hoje = new Date().toISOString().split("T")[0];
    const { error } = await supabase.functions.invoke("gerar-explicacao-leis-dia", {
      body: { data: hoje },
    });
    if (error) {
      console.error("Erro ao gerar:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Explicação Leis do Dia</h1>
            <p className="text-xs text-muted-foreground">Leis explicadas de forma simples</p>
          </div>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={handleGerar} className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Gerar Hoje
            </Button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 py-4 max-w-2xl mx-auto space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : explicacoes && explicacoes.length > 0 ? (
          explicacoes.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/explicacao-leis-dia/${item.id}`)}
              className="w-full flex items-center gap-3 bg-card border border-border/30 rounded-2xl p-2 pr-3 text-left hover:border-primary/30 transition-all group"
            >
              {/* Capa */}
              <div className="w-[100px] h-[70px] rounded-xl overflow-hidden shrink-0 bg-muted">
                {item.capa_url ? (
                  <img
                    src={item.capa_url}
                    alt={item.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-800">
                    <Sparkles className="w-6 h-6 text-white/60" />
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {format(new Date(item.data + "T12:00:00"), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                  {item.total_leis > 0 && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-medium">
                      {item.total_leis} {item.total_leis === 1 ? "lei" : "leis"}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {item.titulo}
                </h3>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary shrink-0 transition-colors" />
            </button>
          ))
        ) : (
          <div className="text-center py-16 space-y-3">
            <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm">Nenhuma explicação gerada ainda</p>
            <p className="text-muted-foreground/60 text-xs">As explicações são geradas automaticamente</p>
          </div>
        )}
      </div>
    </div>
  );
}
