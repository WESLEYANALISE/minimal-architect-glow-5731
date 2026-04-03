import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Send, 
  X, 
  BookOpen, 
  Image,
  FileText,
  Brain,
  MessageCircle,
  Paperclip,
  Bot,
  Plus,
  Trash2,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { HighlightedBox } from "@/components/chat/HighlightedBox";
import { ComparisonCarousel } from "@/components/chat/ComparisonCarousel";
import { PracticalCasesCarousel } from "@/components/chat/PracticalCasesCarousel";
import { InfographicTimeline } from "@/components/chat/InfographicTimeline";
import { LegalStatistics } from "@/components/chat/LegalStatistics";
import { ProcessFlow } from "@/components/chat/ProcessFlow";
import { MarkdownTabs } from "@/components/chat/MarkdownTabs";
import { MarkdownAccordion } from "@/components/chat/MarkdownAccordion";
import { MarkdownSlides } from "@/components/chat/MarkdownSlides";
import { useProfessoraConversations } from "@/hooks/useProfessoraConversations";

interface Message {
  role: "user" | "assistant";
  content: string;
  descomplicadoContent?: string;
  isStreaming?: boolean;
}

interface UploadedFile {
  name: string;
  type: string;
  data: string;
}

interface ProfessoraChatDesktopProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfessoraChatDesktop = ({ isOpen, onClose }: ProfessoraChatDesktopProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const {
    activeConversationId,
    setActiveConversationId,
    createConversation,
    loadConversationMessages,
    deleteConversation,
    groupedConversations,
    startNewConversation,
  } = useProfessoraConversations();

  // Notificar parent quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('professora-modal-open'));
    }
    return () => {
      if (isOpen) {
        window.dispatchEvent(new CustomEvent('professora-modal-close'));
      }
    };
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Carregar mensagens quando selecionar uma conversa
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    loadConversationMessages(activeConversationId).then((msgs) => {
      setMessages(msgs.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
    });
  }, [activeConversationId, loadConversationMessages]);

  const limparConversa = () => {
    setMessages([]);
    setUploadedFiles([]);
    setInput("");
    startNewConversation();
  };

  const handleFileSelect = async (file: File, expectedType: "image" | "pdf") => {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setUploadedFiles((prev) => [...prev, { name: file.name, type: file.type, data: base64 }]);
      sonnerToast.info(`${expectedType === "image" ? "Imagem" : "PDF"} anexada`);
    } catch {
      sonnerToast.error("Erro ao processar arquivo");
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Criar conversa se for a primeira mensagem
    let convId = activeConversationId;
    if (!convId && userMessage) {
      convId = await createConversation(userMessage);
    }

    try {
      const { data, error } = await supabase.functions.invoke("chat-professora", {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          files: uploadedFiles,
          mode: "study",
          conversationId: convId,
        },
      });

      if (error) throw error;
      if (!data || !data.data) throw new Error('Resposta inválida do servidor');

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.data || data.content || data.tecnico, descomplicadoContent: data.descomplicado },
      ]);
      setUploadedFiles([]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      sonnerToast.error("Erro ao enviar mensagem. Tente novamente.");
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const commonQuestions = [
    "Qual a diferença entre dolo e culpa?",
    "O que é presunção de inocência?",
    "Explique o princípio da legalidade",
    "O que são direitos fundamentais?",
  ];

  // parseSpecialContent mantido igual ao original
  const parseSpecialContent = (content: string) => {
    let processedContent = content.replace(/\\n\\n\\n\\n/g, '\n\n\n\n').replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    const comparisonRegex = /\[(COMPARAÇÃO|CARROSSEL|ETAPAS|TIPOS):\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/(COMPARAÇÃO|CARROSSEL|ETAPAS|TIPOS)\]/gi;
    const practicalCasesRegex = /\[CASOS_PRATICOS\]\s*(\{[\s\S]*?\})\s*\[\/CASOS_PRATICOS\]/gi;
    const clickableQuestionsRegex = /\[QUESTOES_CLICAVEIS\]([\s\S]*?)\[\/QUESTOES_CLICAVEIS\]/gi;
    const infographicRegex = /\[INFOGRÁFICO:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/INFOGRÁFICO\]/gi;
    const statsRegex = /\[ESTATÍSTICAS(?::\s*([^\]]+))?\]\s*(\{[\s\S]*?\})\s*\[\/ESTATÍSTICAS\]/gi;
    const processRegex = /\[PROCESSO:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/PROCESSO\]/gi;
    const tabsRegex = /\[TABS:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/TABS\]/gi;
    const accordionRegex = /\[ACCORDION\]\s*(\{[\s\S]*?\})\s*\[\/ACCORDION\]/gi;
    const slidesRegex = /\[SLIDES:\s*([^\]]+)\]\s*(\{[\s\S]*?\})\s*\[\/SLIDES\]/gi;

    const allMatches: Array<{ index: number; length: number; type: string; match: RegExpMatchArray }> = [];

    for (const m of processedContent.matchAll(comparisonRegex)) if (m.index !== undefined) allMatches.push({ index: m.index, length: m[0].length, type: 'comparison', match: m as RegExpMatchArray });
    for (const m of processedContent.matchAll(practicalCasesRegex)) if (m.index !== undefined) allMatches.push({ index: m.index, length: m[0].length, type: 'practical_cases', match: m as RegExpMatchArray });
    for (const m of processedContent.matchAll(clickableQuestionsRegex)) if (m.index !== undefined) allMatches.push({ index: m.index, length: m[0].length, type: 'clickable_questions', match: m as RegExpMatchArray });
    for (const m of processedContent.matchAll(infographicRegex)) if (m.index !== undefined) allMatches.push({ index: m.index, length: m[0].length, type: 'infographic', match: m as RegExpMatchArray });
    for (const m of processedContent.matchAll(statsRegex)) if (m.index !== undefined) allMatches.push({ index: m.index, length: m[0].length, type: 'stats', match: m as RegExpMatchArray });
    for (const m of processedContent.matchAll(processRegex)) if (m.index !== undefined) allMatches.push({ index: m.index, length: m[0].length, type: 'process', match: m as RegExpMatchArray });
    for (const m of processedContent.matchAll(tabsRegex)) if (m.index !== undefined) allMatches.push({ index: m.index, length: m[0].length, type: 'tabs', match: m as RegExpMatchArray });
    for (const m of processedContent.matchAll(accordionRegex)) if (m.index !== undefined) allMatches.push({ index: m.index, length: m[0].length, type: 'accordion', match: m as RegExpMatchArray });
    for (const m of processedContent.matchAll(slidesRegex)) if (m.index !== undefined) allMatches.push({ index: m.index, length: m[0].length, type: 'slides', match: m as RegExpMatchArray });

    allMatches.sort((a, b) => a.index - b.index);

    const mdComponents = {
      h1: ({ children }: any) => <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 mt-8 leading-tight">{children}</h1>,
      h2: ({ children }: any) => <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 mt-6 leading-tight">{children}</h2>,
      h3: ({ children }: any) => <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 mt-5 leading-snug">{children}</h3>,
      p: ({ children, node }: any) => {
        const text = node?.children?.map((child: any) => child.value || '').join('') || '';
        if (text.includes('[DICA DE OURO')) { const m = text.match(/\[DICA DE OURO\s*💎?\s*\]([\s\S]*?)\[\/DICA DE OURO\]/i); if (m) return <div className="my-4 p-4 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">💎</span><div><strong className="text-yellow-400 block mb-2">DICA DE OURO</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{m[1].trim()}</div></div></div></div>; }
        if (text.includes('[SACOU?')) { const m = text.match(/\[SACOU\??\s*💡?\s*\]([\s\S]*?)\[\/SACOU\??\]/i); if (m) return <div className="my-4 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">💡</span><div><strong className="text-blue-400 block mb-2">SACOU?</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{m[1].trim()}</div></div></div></div>; }
        if (text.match(/\[FICA LIGADO/i)) { const m = text.match(/\[FICA LIGADO!?\s*⚠️?\s*\]([\s\S]*?)\[\/FICA LIGADO!?\]/i); if (m) return <div className="my-4 p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">⚠️</span><div><strong className="text-orange-400 block mb-2">FICA LIGADO!</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{m[1].trim()}</div></div></div></div>; }
        if (text.match(/\[IMPORTANTE\]/i)) { const m = text.match(/\[IMPORTANTE\]([\s\S]*?)\[\/IMPORTANTE\]/i); if (m) return <div className="my-4 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">🚨</span><div><strong className="text-red-400 block mb-2">IMPORTANTE</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{m[1].trim()}</div></div></div></div>; }
        if (text.match(/\[ATEN(Ç|C)ÃO\]/i)) { const m = text.match(/\[ATEN(Ç|C)ÃO\]([\s\S]*?)\[\/ATEN(Ç|C)ÃO\]/i); if (m) return <div className="my-4 p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">⚠️</span><div><strong className="text-orange-400 block mb-2">ATENÇÃO</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{m[2].trim()}</div></div></div></div>; }
        if (text.match(/\[NOTA\]/i)) { const m = text.match(/\[NOTA\]([\s\S]*?)\[\/NOTA\]/i); if (m) return <div className="my-4 p-4 bg-purple-500/10 border-l-4 border-purple-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">📝</span><div><strong className="text-purple-400 block mb-2">NOTA</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{m[1].trim()}</div></div></div></div>; }
        if (text.match(/^\[DICA\]/i)) { const m = text.match(/\[DICA\]([\s\S]*?)\[\/DICA\]/i); if (m) return <div className="my-4 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg"><div className="flex items-start gap-3"><span className="text-2xl flex-shrink-0">💡</span><div><strong className="text-blue-400 block mb-2">DICA</strong><div className="text-foreground text-[15px] md:text-base leading-relaxed">{m[1].trim()}</div></div></div></div>; }
        const highlightMatch = text.match(/\[(ATENÇÃO|IMPORTANTE|DICA|NOTA|EXEMPLO)\]([\s\S]*?)\[\/\1\]/i);
        if (highlightMatch) return <HighlightedBox type={highlightMatch[1].toLowerCase() as any}>{highlightMatch[2].trim()}</HighlightedBox>;
        return <p className="text-foreground text-[15px] md:text-base mb-4 leading-relaxed">{children}</p>;
      },
      ul: ({ children }: any) => <ul className="list-disc list-inside space-y-2 mb-4 ml-4 text-foreground">{children}</ul>,
      ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-2 mb-4 ml-4 text-foreground">{children}</ol>,
      li: ({ children }: any) => <li className="text-foreground text-[15px] md:text-base leading-relaxed">{children}</li>,
      strong: ({ children }: any) => <strong className="font-bold text-primary">{children}</strong>,
      blockquote: ({ children }: any) => <blockquote className="border-l-4 border-primary/50 pl-6 pr-4 py-4 my-6 bg-primary/5 rounded-r-lg text-foreground/95 text-[15px] leading-relaxed shadow-sm italic">{children}</blockquote>,
    };

    const renderMd = (text: string) => (
      <div key={key++} className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{text}</ReactMarkdown>
      </div>
    );

    let lastIndex = 0;
    allMatches.forEach(({ index: startIdx, length, type, match }) => {
      const endIdx = startIdx + length;
      if (startIdx > lastIndex) {
        const textBefore = processedContent.substring(lastIndex, startIdx);
        if (textBefore.trim()) elements.push(renderMd(textBefore));
      }

      try {
        if (type === 'comparison') { const d = JSON.parse(match[3]?.trim()); if (d.cards) elements.push(<ComparisonCarousel key={key++} title={match[2]?.trim()} cards={d.cards} />); }
        else if (type === 'practical_cases') { const d = JSON.parse(match[1]?.trim()); if (d.cases) elements.push(<PracticalCasesCarousel key={key++} cases={d.cases} title="📝 Casos Práticos" />); }
        else if (type === 'clickable_questions') { try { let q; try { q = JSON.parse(match[1]?.trim()); } catch { q = JSON.parse(match[1]?.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ')); } if (Array.isArray(q)) elements.push(<div key={key++} className="my-6"><h3 className="text-lg font-bold flex items-center gap-2 mb-4"><MessageCircle className="w-5 h-5 text-primary" />💭 Questões</h3><div className="grid grid-cols-1 gap-3">{q.map((question: string, idx: number) => <Button key={idx} variant="outline" className="w-full text-left justify-start h-auto py-3 px-4 whitespace-normal break-words hover:bg-primary/10" onClick={() => { setInput(question); setTimeout(() => sendMessage(), 100); }}><MessageCircle className="w-4 h-4 mr-2 flex-shrink-0 text-primary" /><span className="text-sm">{question}</span></Button>)}</div></div>); } catch {} }
        else if (type === 'infographic') { const d = JSON.parse(match[2]?.trim()); if (d.steps) elements.push(<InfographicTimeline key={key++} title={match[1]?.trim()} steps={d.steps} />); }
        else if (type === 'stats') { const d = JSON.parse(match[2]?.trim()); if (d.stats) elements.push(<LegalStatistics key={key++} title={match[1]?.trim()} stats={d.stats} />); }
        else if (type === 'process') { const d = JSON.parse(match[2]?.trim()); if (d.steps) elements.push(<ProcessFlow key={key++} title={match[1]?.trim()} steps={d.steps} />); }
        else if (type === 'tabs') { const d = JSON.parse(match[2]?.trim()); if (d.tabs) elements.push(<MarkdownTabs key={key++} tabs={d.tabs} />); }
        else if (type === 'accordion') { const d = JSON.parse(match[1]?.trim()); if (d.items) elements.push(<MarkdownAccordion key={key++} items={d.items} />); }
        else if (type === 'slides') { const d = JSON.parse(match[2]?.trim()); if (d.slides) elements.push(<MarkdownSlides key={key++} title={match[1]?.trim()} slides={d.slides} />); }
      } catch (e) {
        elements.push(renderMd(match[0]));
      }
      lastIndex = endIdx;
    });

    if (lastIndex < processedContent.length) {
      const remaining = processedContent.substring(lastIndex);
      if (remaining.trim()) elements.push(renderMd(remaining));
    }

    return elements.length > 0 ? <>{elements}</> : null;
  };

  const renderWelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-6 px-6">
      <div className="text-center space-y-4 max-w-2xl">
        <div className="bg-primary/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Professora Jurídica</h2>
        <p className="text-muted-foreground">Tire suas dúvidas, peça explicações e estude com a IA</p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          {commonQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => { setInput(q); setTimeout(() => sendMessage(), 50); }}
              className="text-left text-sm p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50 hover:border-border"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  const groups = groupedConversations();

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Container centralizado */}
      <div className="relative z-50 flex w-full max-w-5xl mx-auto my-4 lg:my-8">
        <div className="flex w-full bg-background rounded-lg shadow-2xl overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
          
          {/* Sidebar de Histórico */}
          <div className="w-[240px] bg-card border-r border-border flex flex-col flex-shrink-0">
            {/* Header da sidebar */}
            <div className="p-3 border-b border-border">
              <Button
                onClick={limparConversa}
                className="w-full justify-start gap-2"
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Nova conversa
              </Button>
            </div>

            {/* Lista de conversas */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-3">
                {groups.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8 px-2">
                    Nenhuma conversa ainda. Comece perguntando algo!
                  </p>
                )}
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                      {group.label}
                    </p>
                    {group.items.map((conv) => (
                      <div
                        key={conv.id}
                        className={cn(
                          "group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm transition-colors",
                          activeConversationId === conv.id
                            ? "bg-primary/10 text-foreground"
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setActiveConversationId(conv.id)}
                      >
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate flex-1 text-xs">{conv.title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Área de Chat Principal */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-muted-foreground" />
                <h1 className="text-lg font-semibold">Professora</h1>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea ref={scrollRef} className="h-full py-4">
                {messages.length === 0 ? (
                  renderWelcomeScreen()
                ) : (
                  <div className="space-y-4 px-6 max-w-3xl mx-auto">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3",
                            message.role === "user"
                              ? "bg-primary/60 text-primary-foreground max-w-[80%]"
                              : "bg-muted max-w-[90%]"
                          )}
                        >
                          {message.role === "assistant" ? (
                            <div className="text-sm leading-relaxed">{parseSpecialContent(message.content)}</div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                          <Bot className="w-4 h-4 animate-bounce" />
                          <span className="text-sm">Professora está pensando...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Input - sempre visível */}
            <div className="flex-shrink-0 px-6 py-4 bg-background border-t border-border">
              {uploadedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm">
                      {file.type.includes("image") ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button onClick={() => removeFile(index)}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-muted/30 rounded-2xl border border-border/50 shadow-sm">
                <input ref={imageInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], "image")} className="hidden" />
                <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], "pdf")} className="hidden" />

                <div className="px-4 py-3 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const opts = document.createElement('div');
                      opts.className = 'absolute bottom-16 left-4 bg-card border border-border rounded-lg shadow-lg p-2 space-y-1 z-[60]';
                      opts.innerHTML = `<button class="upload-option flex items-center gap-2 px-3 py-2 rounded hover:bg-muted w-full text-left text-sm" data-type="image"><span>📷</span><span>Imagem</span></button><button class="upload-option flex items-center gap-2 px-3 py-2 rounded hover:bg-muted w-full text-left text-sm" data-type="pdf"><span>📄</span><span>PDF</span></button>`;
                      document.body.appendChild(opts);
                      const close = () => { opts.remove(); document.removeEventListener('click', close); };
                      opts.querySelectorAll('.upload-option').forEach(btn => btn.addEventListener('click', (e) => { const t = (e.currentTarget as HTMLElement).dataset.type; if (t === 'image') imageInputRef.current?.click(); if (t === 'pdf') pdfInputRef.current?.click(); close(); }));
                      setTimeout(() => document.addEventListener('click', close), 100);
                    }}
                    disabled={isLoading}
                    className="shrink-0"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Digite sua pergunta..."
                    disabled={isLoading}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                    size="icon"
                    className="rounded-full shrink-0"
                  >
                    {isLoading ? <Brain className="w-5 h-5 animate-pulse" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
