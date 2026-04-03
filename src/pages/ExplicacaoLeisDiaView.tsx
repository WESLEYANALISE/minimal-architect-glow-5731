import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, BookOpen, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import ImagensCarousel from "@/components/ui/ImagensCarousel";

type ModoView = "explicacao" | "original";

export default function ExplicacaoLeisDiaView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [modo, setModo] = useState<ModoView>("explicacao");

  const { data: explicacao, isLoading } = useQuery({
    queryKey: ["explicacao-leis-dia-view", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("explicacao_leis_dia")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Buscar leis originais vinculadas
  const leis_ids = (explicacao as any)?.leis_ids || [];
  const { data: leisOriginais } = useQuery({
    queryKey: ["leis-originais-explicacao", leis_ids],
    queryFn: async () => {
      if (!leis_ids.length) return [];
      const { data, error } = await supabase
        .from("resenha_diaria")
        .select("id, numero_lei, ementa, texto_formatado, data_publicacao")
        .in("id", leis_ids);
      if (error) return [];
      return data || [];
    },
    enabled: leis_ids.length > 0,
  });

  const customComponents: Components = {
    p: ({ children }) => (
      <p className="text-[15px] leading-relaxed text-foreground/90 mb-4">{children}</p>
    ),
    h1: ({ children }) => (
      <h1 className="text-xl font-bold text-accent mb-4 mt-2">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-semibold text-accent mb-3 mt-6">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-medium text-foreground mb-2 mt-4">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-accent pl-4 pr-3 py-3 my-4 bg-secondary/40 rounded-r-lg text-foreground/95 text-[15px] leading-relaxed">
        {children}
      </blockquote>
    ),
    strong: ({ children }) => (
      <strong className="text-foreground font-bold">{children}</strong>
    ),
    ul: ({ children }) => (
      <ul className="space-y-2 my-4 list-disc list-inside">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="space-y-2 my-4 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-[15px] text-foreground/90 leading-relaxed ml-2">{children}</li>
    ),
    hr: () => <hr className="border-border/40 my-6" />,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!explicacao) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Explicação não encontrada</p>
        <Button onClick={() => navigate("/explicacao-leis-dia")}>Voltar</Button>
      </div>
    );
  }

  const capaUrl = (explicacao as any).capa_url;
  const capas = capaUrl ? [capaUrl] : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/explicacao-leis-dia")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate">{(explicacao as any).titulo}</h1>
            <p className="text-[10px] text-muted-foreground">
              {format(new Date((explicacao as any).data + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Capa em carrossel */}
        {capas.length > 0 && (
          <div className="px-4 pt-4">
            <ImagensCarousel imagens={capas} titulo={(explicacao as any).titulo} />
          </div>
        )}

        {/* Toggle Explicação / Lei Original */}
        <div className="flex items-center justify-center px-4 pt-4">
          <div className="inline-flex items-center bg-muted/50 rounded-full p-1 gap-0.5">
            <button
              onClick={() => setModo("explicacao")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                modo === "explicacao"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Explicação
            </button>
            <button
              onClick={() => setModo("original")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                modo === "original"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Lei Original
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-4 pt-4 pb-8">
          {modo === "explicacao" ? (
            <div className="animate-fade-in">
              {(explicacao as any).explicacao_texto ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
                  {(explicacao as any).explicacao_texto}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Explicação ainda não disponível
                </p>
              )}
            </div>
          ) : (
            <div className="animate-fade-in space-y-4">
              {(explicacao as any).lei_original_resumo ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
                  {(explicacao as any).lei_original_resumo}
                </ReactMarkdown>
              ) : leisOriginais && leisOriginais.length > 0 ? (
                leisOriginais.map((lei: any) => (
                  <div key={lei.id} className="bg-card border border-border/30 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-sm text-foreground">{lei.numero_lei}</h3>
                    {lei.ementa && (
                      <p className="text-xs text-muted-foreground italic">{lei.ementa}</p>
                    )}
                    {lei.texto_formatado && (
                      <div className="text-xs text-foreground/80 whitespace-pre-wrap mt-2 max-h-[400px] overflow-y-auto">
                        {lei.texto_formatado}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/vade-mecum/resenha/${lei.id}`)}
                      className="text-xs mt-2"
                    >
                      Ver completa
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Lei original não disponível
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
