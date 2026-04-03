import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, MessageCircle, GraduationCap, Calendar, Plus, Trash2, Clock, ChevronRight, Bot } from "lucide-react";
import professoraCover from "@/assets/professora-cover.webp";
import ChatProfessora from "@/pages/ChatProfessora";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { PlanoEstudosWizard } from "@/components/PlanoEstudosWizard";
import { ProgressBar } from "@/components/ProgressBar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDeviceType } from "@/hooks/use-device-type";

interface ConversaHistorico {
  id: string;
  titulo: string;
  data: Date;
}

type ProfessoraTab = "chat" | "aula" | "plano";

const TABS = [
  { id: "chat" as const, label: "Chat", icon: Bot },
  { id: "aula" as const, label: "Aula", icon: GraduationCap },
  { id: "plano" as const, label: "Plano", icon: Calendar },
];

interface ProfessoraSheetProps {
  open: boolean;
  onClose: () => void;
}

const loadingMessages = [
  "Analisando conteúdo...",
  "Estruturando cronograma...",
  "Organizando tópicos por semana...",
  "Definindo estratégias de estudo...",
  "Quase lá, finalizando detalhes...",
  "Preparando materiais recomendados...",
  "Ajustando carga horária...",
  "Revisando estrutura final...",
];

export const ProfessoraSheet = ({ open, onClose }: ProfessoraSheetProps) => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const [activeTab, setActiveTab] = useState<ProfessoraTab>("chat");
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [chatKey, setChatKey] = useState(0); // forçar remount para nova conversa

  // Histórico local de conversas (apenas títulos, armazenado no localStorage)
  const [historico, setHistorico] = useState<ConversaHistorico[]>(() => {
    try {
      const saved = localStorage.getItem('professora_historico');
      if (saved) {
        return JSON.parse(saved).map((c: any) => ({ ...c, data: new Date(c.data) }));
      }
    } catch { /* */ }
    return [];
  });
  const [conversaAtualId, setConversaAtualId] = useState<string | null>(null);

  // Salvar histórico no localStorage
  useEffect(() => {
    localStorage.setItem('professora_historico', JSON.stringify(historico));
  }, [historico]);

  // Iniciar nova conversa
  const iniciarNovaConversa = useCallback(() => {
    const id = crypto.randomUUID();
    const novaConversa: ConversaHistorico = {
      id,
      titulo: `Conversa ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
      data: new Date(),
    };
    setHistorico(prev => [novaConversa, ...prev].slice(0, 20));
    setConversaAtualId(id);
    setChatKey(k => k + 1);
  }, []);

  // Selecionar conversa do histórico (por ora apenas muda visual, futuro: persistência)
  const selecionarConversa = useCallback((id: string) => {
    setConversaAtualId(id);
    setChatKey(k => k + 1);
  }, []);

  // Deletar conversa do histórico
  const deletarConversa = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistorico(prev => prev.filter(c => c.id !== id));
    if (conversaAtualId === id) {
      setConversaAtualId(null);
      setChatKey(k => k + 1);
    }
  }, [conversaAtualId]);

  // Plano de estudos states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  if (!open) return null;

  const simulateProgress = () => {
    let currentProgress = 0;
    let messageIndex = 0;
    const interval = setInterval(() => {
      if (currentProgress < 95) {
        currentProgress += Math.random() * 8 + 2;
        if (currentProgress > 95) currentProgress = 95;
        setProgress(Math.floor(currentProgress));
      }
      setStatusMessage(loadingMessages[messageIndex % loadingMessages.length]);
      messageIndex++;
    }, 1200);
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
    setProgress(0);
    const progressInterval = simulateProgress();

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

      clearInterval(progressInterval);

      if (error) throw error;

      if (result?.plano) {
        setProgress(100);
        setStatusMessage("✅ Plano pronto!");

        setTimeout(() => {
          onClose();
          navigate("/plano-estudos/resultado", {
            state: {
              plano: result.plano,
              materia: data.materia || "Plano de Estudos",
              totalHoras: result.totalHoras,
            },
          });
        }, 300);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Erro ao gerar plano:", error);
      toast({
        title: "Erro ao gerar plano",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleTabChange = (tab: ProfessoraTab) => {
    if (tab === "aula") {
      if (!isPremium && !loadingSubscription) {
        setShowPremiumGate(true);
        return;
      }
      onClose();
      navigate("/aula-interativa");
      return;
    }
    if (tab === "plano") {
      if (!isPremium && !loadingSubscription) {
        setShowPremiumGate(true);
        return;
      }
    }
    setActiveTab(tab);
  };

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ animation: "slideUpFull 300ms ease-out forwards" }}
    >
      <div className="absolute inset-0 bg-background flex overflow-hidden">

        {/* ===== DESKTOP: layout ChatGPT (sidebar + centro) ===== */}
        {isDesktop ? (
          <>
            {/* Sidebar esquerda com histórico */}
            <aside className="w-64 xl:w-72 flex-shrink-0 bg-[#1a0a0a] border-r border-white/10 flex flex-col overflow-hidden">
              {/* Header sidebar */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground text-sm">Professora</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Nova conversa */}
              <div className="px-3 py-3">
                <button
                  onClick={iniciarNovaConversa}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted border border-border hover:bg-muted/80 transition-colors text-foreground text-sm"
                >
                  <Plus className="w-4 h-4 text-primary" />
                  Nova conversa
                </button>
              </div>

              {/* Tabs (Chat / Plano) */}
              <div className="px-3 pb-2">
                <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                  {TABS.filter(t => t.id !== 'aula').map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => handleTabChange(id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all",
                        activeTab === id
                          ? "bg-destructive text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de histórico */}
              <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
                {historico.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-6">Nenhuma conversa ainda</p>
                ) : (
                  historico.map((conversa) => (
                    <button
                      key={conversa.id}
                      onClick={() => selecionarConversa(conversa.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all group flex items-start justify-between gap-2",
                        conversaAtualId === conversa.id
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white/80"
                      )}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <Clock className="w-3 h-3 mt-0.5 flex-shrink-0 text-white/30" />
                        <span className="truncate leading-tight">{conversa.titulo}</span>
                      </div>
                      <button
                        onClick={(e) => deletarConversa(conversa.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </button>
                  ))
                )}
              </div>

              {/* Footer sidebar */}
              <div className="px-4 py-3 border-t border-white/10">
                <p className="text-[10px] text-white/30 text-center">Professora Jurídica · IA</p>
              </div>
            </aside>

            {/* Centro: conteúdo principal centralizado */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Background Themis menor e contido */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                  src={professoraCover}
                  alt=""
                  className="absolute right-0 top-0 h-full w-auto max-w-[50%] object-cover object-top opacity-20"
                  style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a0a] via-[#1a0a0a]/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a0a]/60 via-transparent to-[#1a0a0a]/90" />
              </div>

              {/* Botão voltar chamativo no topo */}
              <div className="relative z-10 flex items-center px-6 py-4 border-b border-white/10 bg-[#1a0a0a]/70 backdrop-blur-sm">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all hover:border-white/40 group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Voltar</span>
                </button>
              </div>

              {activeTab === "plano" ? (
                <div className="relative z-10 flex-1 overflow-y-auto">
                  <div className="max-w-2xl mx-auto px-6 py-8">
                    {isProcessing ? (
                      <ProgressBar
                        progress={progress}
                        message={statusMessage}
                        subMessage="Criando seu cronograma personalizado..."
                      />
                    ) : (
                      <PlanoEstudosWizard onComplete={handleWizardComplete} />
                    )}
                  </div>
                </div>
              ) : (
                /* Chat centralizado estilo ChatGPT */
                <div className="relative z-10 flex-1 flex flex-col overflow-hidden max-w-3xl w-full mx-auto">
                  <ChatProfessora
                    key={`${activeTab}-${chatKey}`}
                    embedded
                    onBack={onClose}
                    initialChatMode="study"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          /* ===== MOBILE: layout scroll unificado (hero sobe junto) ===== */
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Hero */}
            <div className="relative h-48 flex-shrink-0 overflow-hidden">
              <img
                src={professoraCover}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80" />

              <button
                onClick={onClose}
                className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-black/70 transition-colors"
                style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Voltar</span>
              </button>

              <div
                className="absolute bottom-6 left-0 right-0 text-center"
                style={{ textShadow: "0 4px 16px rgba(0,0,0,0.7)" }}
              >
                <Bot className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="font-playfair text-2xl font-semibold text-foreground/90 leading-tight">
                  Professora
                </p>
                <p className="font-playfair text-3xl font-bold text-foreground leading-tight">
                  Jurídica
                </p>
              </div>
            </div>

            {/* Content with rounded top - grows to fill and scrolls with hero */}
            <div className="relative rounded-t-[32px] bg-secondary -mt-6 flex-1 flex flex-col min-h-0">
              {/* Toggle Menu */}
              <div className="px-4 pt-5 pb-2 flex-shrink-0">
                <div className="flex gap-2 bg-black/20 rounded-full p-1">
                  {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => handleTabChange(id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium rounded-full transition-all",
                        activeTab === id
                          ? "bg-destructive text-white shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content - no overflow hidden, flows naturally */}
              <div className="flex-1">
                {activeTab === "plano" ? (
                  <div className="px-4 py-4">
                    {isProcessing ? (
                      <ProgressBar
                        progress={progress}
                        message={statusMessage}
                        subMessage="Criando seu cronograma personalizado..."
                      />
                    ) : (
                      <PlanoEstudosWizard onComplete={handleWizardComplete} />
                    )}
                  </div>
                ) : (
                  <ChatProfessora
                    key={`${activeTab}-${chatKey}`}
                    embedded
                    onBack={onClose}
                    initialChatMode="study"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showPremiumGate && (
        <PremiumFloatingCard isOpen={showPremiumGate} onClose={() => setShowPremiumGate(false)} title="Conteúdo Premium" sourceFeature="Professora Sheet" />
      )}
    </div>
  );
};
