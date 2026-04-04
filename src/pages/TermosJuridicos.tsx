import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, BookOpen, Check, Loader2, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import termosThumb from "@/assets/thumbnails/termos-thumb.webp";

const CAPA_PADRAO = "https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/termos-juridicos/jurisprudncia_1771658774532.png";

const TermosJuridicos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const queryClient = useQueryClient();
  
  const [gerando, setGerando] = useState(false);
  const [gerandoId, setGerandoId] = useState<number | null>(null);
  const abortRef = useRef(false);

  const { data: termos, isLoading } = useQuery({
    queryKey: ["termos-juridicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("termos_juridicos_aulas")
        .select("id, ordem, termo, descricao_curta, origem, categoria, capa_url, gerado_em, capa_gerada_em")
        .order("termo", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const geradasCount = termos?.filter(t => t.gerado_em).length || 0;
  const totalCount = termos?.length || 50;

  // Geração sequencial: gera um, espera, gera o próximo
  const gerarProximo = useCallback(async () => {
    if (abortRef.current) {
      setGerando(false);
      setGerandoId(null);
      return;
    }

    // Refetch para pegar estado atualizado
    const { data: termosAtuais } = await supabase
      .from("termos_juridicos_aulas")
      .select("id, termo, significado:descricao_curta, gerado_em")
      .order("ordem", { ascending: true });

    const pendente = termosAtuais?.find(t => !t.gerado_em);
    if (!pendente) {
      toast.success("Todas as aulas foram geradas! 🎉");
      setGerando(false);
      setGerandoId(null);
      queryClient.invalidateQueries({ queryKey: ["termos-juridicos"] });
      return;
    }

    setGerandoId(pendente.id);
    
    try {
      const { error: aulaError } = await supabase.functions.invoke("gerar-aula-termo-juridico", {
        body: { termoId: pendente.id }
      });
      if (aulaError) throw aulaError;

      // Atualizar capa padrão
      await supabase
        .from("termos_juridicos_aulas")
        .update({ capa_url: CAPA_PADRAO, capa_gerada_em: new Date().toISOString() })
        .eq("id", pendente.id);

      queryClient.invalidateQueries({ queryKey: ["termos-juridicos"] });
      toast.success(`✅ ${pendente.termo} gerado!`);

      // Próximo após 2s
      if (!abortRef.current) {
        setTimeout(() => gerarProximo(), 2000);
      }
    } catch (err: any) {
      toast.error(`Erro em ${pendente.termo}: ${err.message}`);
      // Continuar mesmo com erro
      if (!abortRef.current) {
        setTimeout(() => gerarProximo(), 5000);
      }
    }
  }, [queryClient]);

  const iniciarGeracao = () => {
    abortRef.current = false;
    setGerando(true);
    gerarProximo();
  };

  const pararGeracao = () => {
    abortRef.current = true;
    setGerando(false);
    setGerandoId(null);
    toast.info("Geração pausada");
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background">
      {/* Header - idêntico ao Cursos */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/aulas")}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Termos Jurídicos</h1>
            <p className="text-[11px] text-muted-foreground -mt-0.5">
              {geradasCount} de {totalCount} aulas prontas
            </p>
          </div>
        </div>
        {gerando && (
          <div className="px-4 pb-2 max-w-4xl mx-auto">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                style={{ width: `${(geradasCount / totalCount) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{geradasCount}/{totalCount} geradas</p>
          </div>
        )}
      </div>

      {/* Lista - estilo catálogo como Cursos */}
      <div className="px-4 max-w-4xl mx-auto py-5">

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {termos?.map((termo, index) => {
              const isGerado = !!termo.gerado_em;
              const isGerandoEste = gerandoId === termo.id;

              return (
                <button
                  key={termo.id}
                  onClick={() => isGerado ? navigate(`/termos-juridicos/${termo.id}`) : null}
                  disabled={!isGerado && !isGerandoEste}
                  className={`w-full flex items-stretch bg-card border border-border/50 rounded-2xl overflow-hidden transition-all text-left group animate-fade-in ${
                    isGerado 
                      ? "hover:border-primary/40 active:scale-[0.98] cursor-pointer" 
                      : "opacity-50 cursor-default"
                  }`}
                  style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'backwards' }}
                >
                  {/* Thumbnail */}
                  <div className="relative w-[100px] min-h-[90px] flex-shrink-0 overflow-hidden">
                    <img
                      src={termosThumb}
                      alt={termo.termo}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
                    {/* Número */}
                    <div className="absolute top-1.5 left-1.5">
                      <span className="text-[9px] font-bold text-white/60 bg-black/40 px-1.5 py-0.5 rounded">#{termo.ordem}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isGerandoEste ? (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
                      ) : isGerado ? (
                        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : null}
                      {termo.origem && (
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{termo.origem}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-[15px] text-foreground leading-tight line-clamp-1">{termo.termo}</h3>
                    {termo.categoria && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{termo.categoria}</p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center pr-3">
                    {isGerado && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TermosJuridicos;
