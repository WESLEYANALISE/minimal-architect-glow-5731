import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlanoEstudosWizard } from "@/components/PlanoEstudosWizard";
import { JurisprudenciaLoadingAnimation } from "@/components/jurisprudencia/JurisprudenciaLoadingAnimation";

const ETAPAS_PLANO = [
  "Analisando conteúdo programático...",
  "Consultando materiais disponíveis no app...",
  "Estruturando cronograma semanal...",
  "Organizando tópicos por prioridade...",
  "Definindo estratégias de estudo...",
  "Preparando materiais recomendados...",
  "Ajustando carga horária por dia...",
  "Adicionando detalhes de aprofundamento...",
  "Selecionando livros recomendados...",
  "Revisando estrutura final...",
  "Finalizando plano detalhado...",
];

const PlanoEstudos = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [etapas, setEtapas] = useState<string[]>([]);

  const simulateEtapas = () => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < ETAPAS_PLANO.length) {
        setEtapas(prev => [...prev, ETAPAS_PLANO[index]]);
        index++;
      }
    }, 2500);
    return interval;
  };

  const handleWizardComplete = async (data: {
    metodo: "tema" | "arquivo";
    materia?: string;
    arquivo?: File;
    diasSelecionados: string[];
    horasPorDia: number;
    duracaoSemanas: number;
  }) => {
    setIsProcessing(true);
    setEtapas([]);
    const etapasInterval = simulateEtapas();

    try {
      let arquivoBase64: string | undefined;
      let tipoArquivo: "pdf" | "imagem" | undefined;

      if (data.arquivo) {
        const reader = new FileReader();
        arquivoBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.arquivo!);
        });
        tipoArquivo = data.arquivo.type.includes("pdf") ? "pdf" : "imagem";
      }

      const { data: result, error } = await supabase.functions.invoke("gerar-plano-estudos", {
        body: {
          materia: data.materia || "Plano de Estudos Personalizado",
          horasPorDia: data.horasPorDia,
          diasSemana: data.diasSelecionados,
          duracaoSemanas: data.duracaoSemanas,
          arquivo: arquivoBase64,
          tipoArquivo,
        },
      });

      clearInterval(etapasInterval);

      if (error) throw error;

      if (result?.plano) {
        setEtapas(prev => [...prev, "✅ Plano pronto!"]);

        setTimeout(() => {
          navigate("/plano-estudos/resultado", {
            state: {
              plano: result.plano,
              materia: data.materia || "Plano de Estudos",
              totalHoras: result.totalHoras,
            },
          });
        }, 800);
      }
    } catch (error: any) {
      clearInterval(etapasInterval);
      console.error("Erro ao gerar plano:", error);
      toast({
        title: "Erro ao gerar plano",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <JurisprudenciaLoadingAnimation etapas={etapas} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Plano de Estudos</h1>
            <p className="text-sm text-muted-foreground">
              Crie um cronograma personalizado passo a passo
            </p>
          </div>
        </div>
      </div>

      <PlanoEstudosWizard onComplete={handleWizardComplete} />
    </div>
  );
};

export default PlanoEstudos;
