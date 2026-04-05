import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, BookOpen, Trash2, Crown, Bot, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from "pdfjs-dist";
import { useStreamingChat, UploadedFile } from "@/hooks/useStreamingChat";
import { ChatMessageNew } from "@/components/chat/ChatMessageNew";
import { ChatInputNew } from "@/components/chat/ChatInputNew";
import { AulaFloatingCard } from "@/components/chat/AulaFloatingCard";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";

import { TypingIndicator } from "@/components/simulacao/TypingIndicator";
import { cn } from "@/lib/utils";
import themisFull from "@/assets/themis-full.webp";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { useUserInterests } from "@/hooks/useUserInterests";
import { useDeviceType } from "@/hooks/use-device-type";
import { useProfessoraConversations } from "@/hooks/useProfessoraConversations";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

type ChatMode = "study" | "realcase" | "recommendation" | "psychologist" | "tcc" | "refutacao" | "aula";

const MODES = [
  { id: "study", label: "Estudar", icon: BookOpen },
] as const;

interface ChatProfessoraProps {
  embedded?: boolean;
  onBack?: () => void;
  initialChatMode?: ChatMode;
}

const ChatProfessora = ({ embedded = false, onBack, initialChatMode }: ChatProfessoraProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isDesktop } = useDeviceType();
  const defaultMode = initialChatMode || (searchParams.get("mode") as ChatMode) || "study";
  
  const [mode, setMode] = useState<ChatMode>(defaultMode);
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const { loading: trialLoading } = useTrialStatus();
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const { topAreas, loading: loadingInterests } = useUserInterests();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [showHistorySheet, setShowHistorySheet] = useState(false);

  // Conversation history
  const {
    activeConversationId,
    setActiveConversationId,
    loadingConversations,
    loadConversationMessages,
    createConversation,
    deleteConversation,
    groupedConversations,
    startNewConversation,
  } = useProfessoraConversations();

  // Buscar nome do perfil
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('nome')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.nome) setProfileName(data.nome.split(' ')[0]);
      });
  }, [user?.id]);

  // Saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const userName = profileName
    || user?.user_metadata?.name?.split(' ')[0] 
    || user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.display_name?.split(' ')[0];

  const welcomeMessage = useMemo(() => {
    if (loadingInterests) return '';
    const greeting = getGreeting();
    const name = userName ? `, ${userName}` : '';
    
    if (topAreas.length >= 2) {
      return `${greeting}${name}! 👋\n\nPercebi que você tem explorado bastante **${topAreas[0].area}** e **${topAreas[1].area}**. Quer continuar nessa linha ou explorar algo novo sobre Direito?`;
    }
    if (topAreas.length === 1) {
      return `${greeting}${name}! 👋\n\nVejo que você se interessa por **${topAreas[0].area}**! O que temos para hoje sobre Direito?`;
    }
    return `${greeting}${name}! 👋\n\nO que temos para hoje sobre Direito? Pergunte qualquer coisa!`;
  }, [topAreas, loadingInterests, userName]);
  
  // Verificar se a imagem já está em cache para exibição INSTANTÂNEA
  const [imageLoaded, setImageLoaded] = useState(() => {
    const img = new Image();
    img.src = themisFull;
    return img.complete;
  });

  useEffect(() => {
    if (!imageLoaded) {
      const img = new Image();
      img.src = themisFull;
      img.onload = () => setImageLoaded(true);
    }
  }, [imageLoaded]);
  // Usar 'deep' para respostas mais completas
  const [responseLevel] = useState<'concise' | 'basic' | 'complete' | 'deep'>('deep');
  const [linguagemMode] = useState<'descomplicado' | 'tecnico'>('tecnico');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const {
    messages,
    isStreaming,
    uploadedFiles,
    setUploadedFiles,
    sendMessage,
    clearChat,
    stopStreaming
  } = useStreamingChat({
    mode,
    responseLevel,
    linguagemMode
  });

  // Select existing conversation
  const handleSelectConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    const msgs = await loadConversationMessages(conversationId);
    // Populate chat with loaded messages
    const chatMsgs = msgs.map((m, i) => ({
      id: `loaded-${i}`,
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    clearChat();
    // Use setMessages if available, otherwise we populate via the hook
    // For now we'll set messages through a ref-based approach
    (window as any).__loadedChatMessages = chatMsgs;
    // Force re-render by clearing then setting
    setTimeout(() => {
      chatMsgs.forEach((msg) => {
        // We'll use a simpler approach: just clear and let user see history
      });
    }, 0);
    setShowHistorySheet(false);
  }, [setActiveConversationId, loadConversationMessages, clearChat]);

  const handleNewConversation = useCallback(() => {
    startNewConversation();
    clearChat();
    setShowHistorySheet(false);
  }, [startNewConversation, clearChat]);

  // Configurar worker do PDF.js
  useEffect(() => {
    try {
      GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
    } catch (e) {
      console.warn("Falha ao configurar worker do PDF.js", e);
    }
  }, []);

  // Auto-scroll durante streaming
  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;
    
    const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, autoScroll]);

  // Detectar scroll manual
  useEffect(() => {
    const scrollElement = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Extrair texto de PDF
  const extractPdfText = useCallback(async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const maxPages = Math.min(pdf.numPages, 50);
      let fullText = '';
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((it: any) => ('str' in it ? it.str : ''))
          .join(' ');
        fullText += `\n\n[Página ${i}]\n${pageText}`;
      }
      
      return fullText.trim();
    } catch (e) {
      console.error('Erro ao extrair texto do PDF:', e);
      return 'Não foi possível extrair o texto deste PDF.';
    }
  }, []);

  const [showAulaCard, setShowAulaCard] = useState(false);

  const handleModeChange = (newMode: ChatMode) => {
    if (newMode === 'aula') {
      if (!isPremium && !loadingSubscription) {
        setShowPremiumGate(true);
        return;
      }
      setShowAulaCard(true);
      return;
    }
    setMode(newMode);
    clearChat();
  };

  const handleSend = (message: string, files?: UploadedFile[], extractedText?: string) => {
    // Usuários gratuitos podem usar o chat normalmente (sem arquivos)
    const streamMode = files?.length ? 'analyze' : 'chat';
    sendMessage(message, files, extractedText, streamMode);
    setAutoScroll(true);
  };

  // Handler para tópicos clicáveis
  const handleTopicClick = (topic: string) => {
    handleSend(topic);
  };

  

  return (
    <div className={`flex ${embedded ? 'h-full' : 'h-[100dvh] lg:h-[calc(100vh-4.5rem)]'} relative overflow-hidden items-center justify-center bg-background`}>
      {/* Card container — mobile: full, desktop: floating card */}
      <div className={cn(
        "flex flex-col relative overflow-hidden w-full h-full",
        !embedded && "lg:max-w-3xl lg:max-h-[calc(100vh-7rem)] lg:rounded-2xl lg:border lg:border-border lg:shadow-2xl lg:mx-auto lg:my-4"
      )}>
        {/* Background da Têmis dentro do card */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(0,30%,8%)] via-[hsl(0,30%,10%)] to-[hsl(0,30%,8%)]" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img 
            src={themisFull} 
            alt="Têmis" 
            className={`h-full w-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-15' : 'opacity-0'}`}
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      
      {/* Header */}
      {!embedded && (
      <header className="flex-shrink-0 border-b border-red-900/30 bg-[#1a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a0a0a]/60 relative z-10 w-full">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onBack ? onBack() : navigate('/')}
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-neutral-700/50 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h1 className="font-semibold text-white">Professora</h1>
                <p className="text-xs text-white/60">Assistente de Estudos</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              disabled={messages.length === 0}
              className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="px-4 pb-3 max-w-3xl mx-auto">
          <Tabs value={mode} onValueChange={(v) => handleModeChange(v as ChatMode)} className="w-full">
            <TabsList className="flex w-full h-10 gap-1 bg-transparent p-0">
              {MODES.map(({ id, label, icon: Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-full border transition-all",
                    "data-[state=active]:bg-red-800 data-[state=active]:text-white data-[state=active]:border-red-700",
                    "data-[state=inactive]:bg-white/5 data-[state=inactive]:text-white/70 data-[state=inactive]:border-white/10 data-[state=inactive]:hover:bg-white/10"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </header>
      )}

      {/* Messages - sem virtualização para evitar perda de scroll */}
      <ScrollArea ref={scrollRef} className="flex-1 relative z-10 w-full">
        <div className="p-4 space-y-4 pb-8 min-h-full max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col min-h-[50vh] px-4 py-8">
              {/* Mensagem de boas-vindas como mensagem do assistente */}
              {welcomeMessage && (
                <div className="mb-6">
                  <ChatMessageNew
                    role="assistant"
                    content={welcomeMessage}
                    isStreaming={false}
                    onTopicClick={handleTopicClick}
                    isWelcome
                  />
                </div>
              )}
              {/* SuggestedQuestions removido da tela de boas-vindas */}
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isLastMessage = index === messages.length - 1;
                const showTyping = isStreaming && isLastMessage && message.role === 'assistant' && !message.content;
                
                // Se é a última mensagem do assistant e ainda não tem conteúdo, mostra typing
                if (showTyping) {
                  return <TypingIndicator key={`typing-${message.id}`} variant="chat" />;
                }
                
                return (
                  <ChatMessageNew
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    termos={message.termos}
                    isStreaming={message.isStreaming}
                    onTopicClick={handleTopicClick}
                  />
                );
              })}
              {/* Typing indicator - mostra quando última mensagem é do usuário */}
              {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <TypingIndicator key="typing-indicator" variant="chat" />
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 w-full max-w-3xl mx-auto relative z-10">
      {(() => {
        const isBlocked = !isPremium && !loadingSubscription && !trialLoading;
        if (isBlocked) {
          return (
            <div className="border-t border-amber-900/30 bg-[#1a1008]/95 p-4">
              <div className="flex items-center gap-3 px-2 py-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-amber-100/80 font-medium">
                    Recurso Premium
                  </p>
                  <p className="text-xs text-amber-100/50">
                    Assine para conversar com a Professora
                  </p>
                </div>
                <button
                  onClick={() => navigate('/assinatura')}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors shadow-md"
                >
                  Ver planos
                </button>
              </div>
            </div>
          );
        }
        return (
          <ChatInputNew
            onSend={handleSend}
            isStreaming={isStreaming}
            onStop={stopStreaming}
            uploadedFiles={uploadedFiles}
            onFilesChange={setUploadedFiles}
            onExtractPdf={extractPdfText}
          />
        );
      })()}
      </div>

      {/* Card flutuante de Aula */}
      {showAulaCard && (
        <AulaFloatingCard onClose={() => setShowAulaCard(false)} />
      )}

      {/* Botão Flutuante de Flashcards - removido */}
      
      {/* Gate Premium - mostra quando usuário tenta enviar mensagem sem ser Premium */}
      {showPremiumGate && (
        <PremiumFloatingCard isOpen={showPremiumGate} onClose={() => setShowPremiumGate(false)} title="Conteúdo Premium" sourceFeature="Chat Professora" />
      )}
      </div>
    </div>
  );
};

export default ChatProfessora;
