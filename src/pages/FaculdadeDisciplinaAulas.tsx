import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, BookOpen, GraduationCap } from "lucide-react";
import { SerpentineNiveis } from "@/components/shared/SerpentineNiveis";
import { useFaculdadeAutoGeneration } from "@/hooks/useFaculdadeAutoGeneration";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion } from "framer-motion";
import themisBackground from "@/assets/themis-estudos-background.webp";
import { InstantBackground } from "@/components/ui/instant-background";

const FaculdadeDisciplinaAulas = () => {
  const { universidadeId, numero, disciplinaId } = useParams<{
    universidadeId: string;
    numero: string;
    disciplinaId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const discId = parseInt(disciplinaId || "0");
  const uniId = parseInt(universidadeId || "1");
  const semestreNum = parseInt(numero || "1");

  const { data: disciplina } = useQuery({
    queryKey: ["faculdade-disc-aulas", discId],
    queryFn: async () => {
      const { data } = await supabase
        .from("faculdade_disciplinas")
        .select("*")
        .eq("id", discId)
        .single();
      return data;
    },
  });

  const { data: topicos, isLoading } = useQuery({
    queryKey: ["faculdade-topicos-aulas", discId],
    queryFn: async () => {
      const { data } = await supabase
        .from("faculdade_topicos")
        .select("*")
        .eq("disciplina_id", discId)
        .order("ordem");
      return data || [];
    },
    refetchInterval: 5000, // Poll every 5s for generation progress
  });

  const {
    isGenerating,
    totalTopicos,
    concluidos,
    pendentes,
    percentualGeral,
    getTopicoStatus,
  } = useFaculdadeAutoGeneration({
    disciplinaId: discId,
    topicos: topicos as any,
    enabled: true,
  });

  const handleGenerateCapa = async (item: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-capa-faculdade-topico', {
        body: { topico_id: item.id, titulo: item.titulo }
      });
      if (error) throw error;
      if (data?.capa_url) {
        toast.success("Capa gerada!");
        queryClient.invalidateQueries({ queryKey: ["faculdade-topicos-aulas", discId] });
      }
    } catch (err) {
      console.error("Erro ao gerar capa:", err);
      toast.error("Erro ao gerar capa");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <InstantBackground
        src={themisBackground}
        alt="Faculdade"
        blurCategory="estudos"
        gradientClassName="bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]"
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate(`/faculdade/universidade/${uniId}/semestre/${semestreNum}/disciplina/${discId}`)}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">{disciplina?.nome || "Aulas"}</h1>
                <p className="text-sm text-white/60">{concluidos}/{totalTopicos} aulas · {percentualGeral}% concluído</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Progress bar when generating */}
        {isGenerating && (
          <div className="px-4 pb-2 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span className="text-xs text-amber-500 font-medium">Gerando aulas...</span>
            </div>
            <Progress
              value={percentualGeral}
              className="h-1.5 mt-1.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500"
            />
          </div>
        )}

        {/* Serpentine Trail */}
        <div className="pt-4">
          {topicos && topicos.length > 0 ? (
            <SerpentineNiveis
              items={topicos.map((t, idx) => ({
                ...t,
                id: t.id,
                _ordem: idx + 1,
                _status: getTopicoStatus(t.id),
              }))}
              getItemCapa={(item) => item.capa_url}
              getItemTitulo={(item) => item.titulo}
              getItemOrdem={(item) => item._ordem}
              getItemAulas={(item) => 1}
              getItemProgresso={(item) => item._status.progresso}
              onItemClick={(item) => {
                const status = getTopicoStatus(item.id as number);
                if (status.status === "gerando" || status.status === "na_fila") {
                  return;
                }
                navigate(`/faculdade/topico/${item.id}`);
              }}
              isItemLocked={(item) => {
                const status = getTopicoStatus(item.id as number);
                return status.status === "gerando" || status.status === "na_fila";
              }}
              onGenerateCapa={handleGenerateCapa}
            />
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-white/30" />
              <p className="text-white/50">Nenhum tópico encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaculdadeDisciplinaAulas;
