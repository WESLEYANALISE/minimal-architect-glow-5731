import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AtualizacaoBiblioteca {
  id: number;
  biblioteca: string;
  nome_livro: string;
  autor: string;
  capa_url: string | null;
  vezes: number;
  ativo: boolean;
  created_at: string;
}

const getSessionId = (): string => {
  let sessionId = localStorage.getItem("app-session-id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("app-session-id", sessionId);
  }
  return sessionId;
};

export const AtualizacaoBibliotecaNotification = () => {
  const [atualizacao, setAtualizacao] = useState<AtualizacaoBiblioteca | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    checkAtualizacoes();
  }, []);

  const checkAtualizacoes = async () => {
    try {
      const sessionId = getSessionId();

      // Buscar atualizações ativas
      const { data: atualizacoes, error } = await (supabase as any)
        .from("atualizacao_biblioteca")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (error || !atualizacoes?.length) return;

      // Buscar vistas dessa sessão
      const { data: vistas } = await (supabase as any)
        .from("atualizacao_biblioteca_vistas")
        .select("atualizacao_id, vezes_vista")
        .eq("session_id", sessionId);

      const vistasMap = new Map(
        (vistas || []).map((v: any) => [v.atualizacao_id, v.vezes_vista])
      );

      // Encontrar primeira que ainda precisa ser mostrada E foi criada hoje
      const hoje = new Date().toISOString().slice(0, 10);
      const pendente = atualizacoes.find((a: AtualizacaoBiblioteca) => {
        const vezesVista = (vistasMap.get(a.id) as number) || 0;
        const dataCriacao = a.created_at?.slice(0, 10);
        return vezesVista < a.vezes && dataCriacao === hoje;
      });

      if (pendente) {
        setAtualizacao(pendente);
        setShowNotification(true);
      }
    } catch (err) {
      console.error("Erro ao verificar atualizações de biblioteca:", err);
    }
  };

  const handleClose = async () => {
    setIsClosing(true);
    
    if (atualizacao) {
      try {
        const sessionId = getSessionId();
        const { data: { user } } = await supabase.auth.getUser();

        // Upsert: inserir ou incrementar vezes_vista
        const { data: existing } = await (supabase as any)
          .from("atualizacao_biblioteca_vistas")
          .select("id, vezes_vista")
          .eq("atualizacao_id", atualizacao.id)
          .eq("session_id", sessionId)
          .maybeSingle();

        if (existing) {
          await (supabase as any)
            .from("atualizacao_biblioteca_vistas")
            .update({ vezes_vista: existing.vezes_vista + 1 })
            .eq("id", existing.id);
        } else {
          await (supabase as any)
            .from("atualizacao_biblioteca_vistas")
            .insert({
              atualizacao_id: atualizacao.id,
              session_id: sessionId,
              user_id: user?.id || null,
              vezes_vista: 1,
            });
        }
      } catch (err) {
        console.error("Erro ao registrar vista:", err);
      }
    }

    setTimeout(() => {
      setShowNotification(false);
      setIsClosing(false);
    }, 300);
  };

  if (!showNotification || !atualizacao) return null;

  const formattedDate = new Date(atualizacao.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 ${
        isClosing ? "animate-fade-out" : "animate-fade-in"
      }`}
      onClick={handleClose}
    >
      <Card
        className={`max-w-sm w-full shadow-2xl relative pt-12 ${
          isClosing ? "animate-scale-out" : "animate-scale-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone no topo */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg animate-pulse">
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        <CardHeader className="text-center pb-3">
          <CardTitle className="text-xl">📚 Novo Livro Disponível!</CardTitle>
          <Badge variant="outline" className="mx-auto mt-2 bg-accent/10 text-accent-foreground border-accent/30">
            Biblioteca {atualizacao.biblioteca}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-4 items-start p-3 rounded-lg bg-secondary/50">
            {atualizacao.capa_url && (
              <img
                src={atualizacao.capa_url}
                alt={atualizacao.nome_livro}
                className="w-16 h-24 object-cover rounded-md shadow-md flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight">
                {atualizacao.nome_livro}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {atualizacao.autor}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Adicionado em {formattedDate}
              </p>
            </div>
          </div>

          <Button onClick={handleClose} className="w-full" size="lg">
            Entendi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
