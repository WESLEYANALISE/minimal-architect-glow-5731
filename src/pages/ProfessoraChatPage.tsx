import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  ArrowLeft, 
  GraduationCap,
  Sparkles,
  Trash2,
  Image,
  FileText,
  Paperclip,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamingChat, UploadedFile } from "@/hooks/useStreamingChat";
import { ChatMessageNew } from "@/components/chat/ChatMessageNew";

export default function ProfessoraChatPage() {
  const navigate = useNavigate();
  const [thinkingTime, setThinkingTime] = useState(0);
  const [input, setInput] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isStreaming,
    uploadedFiles,
    setUploadedFiles,
    sendMessage,
    clearChat,
    stopStreaming
  } = useStreamingChat({
    mode: 'study',
    responseLevel: 'complete',
    linguagemMode: 'descomplicado'
  });

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isStreaming) {
      setThinkingTime(0);
      interval = setInterval(() => {
        setThinkingTime(prev => prev + 100);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
      setThinkingTime(0);
    };
  }, [isStreaming]);

  const handleSend = () => {
    if (!input.trim() && !uploadedFiles.length) return;
    if (isStreaming) return;
    sendMessage(input.trim(), uploadedFiles);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (file: File, type: 'image' | 'pdf') => {
    setIsProcessingFile(true);
    setShowAttachMenu(false);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const uploaded: UploadedFile = { name: file.name, type: file.type, data: base64 };
      setUploadedFiles([...uploadedFiles, uploaded]);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const suggestedQuestions = [
    "O que é princípio da legalidade?",
    "Explique habeas corpus de forma simples",
    "Qual a diferença entre dolo e culpa?",
    "O que são direitos fundamentais?",
  ];

  return (
    <div className="h-screen flex items-center justify-center bg-background p-4 lg:p-8 overflow-hidden">
      <div className="w-full max-w-2xl h-full max-h-[calc(100vh-4rem)] lg:max-h-[85vh] flex flex-col bg-card rounded-none lg:rounded-2xl lg:border lg:border-border lg:shadow-2xl overflow-hidden">
      {/* Header compacto */}
      <header className="shrink-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-sm lg:rounded-t-2xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-full bg-amber-500/15 border border-amber-500/30">
              <GraduationCap className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-left">
              <h1 className="text-sm font-bold text-foreground">Professora</h1>
              <p className="text-[10px] text-muted-foreground leading-none">Assistente Jurídica</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Limpar</span>
          </Button>
        </div>
      </header>

      {/* Chat area - centralizada */}
      <div className="flex-1 flex flex-col min-h-0 max-w-3xl mx-auto w-full">
        <ScrollArea ref={scrollRef} className="flex-1">
          <div className="px-4 py-6 space-y-5">
            {/* Welcome */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 lg:py-24 text-center"
              >
                <div className="p-5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-5">
                  <GraduationCap className="w-10 h-10 text-amber-400" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
                  Olá! Sou a Professora.
                </h2>
                <p className="text-muted-foreground max-w-md mb-8 text-sm">
                  Sua assistente jurídica pessoal. Pergunte qualquer dúvida sobre Direito e te explico de forma clara e didática.
                </p>

                <div className="w-full max-w-lg">
                  <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider font-medium">
                    Sugestões para começar
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedQuestions.map((question, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        onClick={() => {
                          setInput(question);
                          textareaRef.current?.focus();
                        }}
                        className="text-left p-3 rounded-xl bg-card border border-border hover:border-amber-500/40 hover:bg-accent/50 transition-all text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Sparkles className="w-3 h-3 inline mr-2 text-amber-400" />
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    "rounded-2xl px-4 py-3",
                    msg.role === 'user' 
                      ? 'max-w-[75%] bg-primary/15 border border-primary/30 text-foreground' 
                      : 'max-w-[85%] bg-card border border-border'
                  )}>
                    {msg.role === 'assistant' && msg.isStreaming && !msg.content ? (
                      <div className="flex items-center gap-3 p-2">
                        <motion.span
                          className="text-xl"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          🧠
                        </motion.span>
                        <span className="text-primary font-medium text-sm">Analisando...</span>
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-primary"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <ChatMessageNew 
                        role={msg.role}
                        content={msg.content}
                        termos={msg.termos}
                        isStreaming={msg.isStreaming}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Input Area - fixo embaixo */}
        <div className="shrink-0 border-t border-border/50 bg-background px-4 py-3">
          {/* Uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full text-xs border border-border"
                >
                  {file.type.includes('image') ? (
                    <Image className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className="max-w-28 truncate text-muted-foreground">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="hover:text-destructive text-muted-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-card border border-border rounded-xl p-1.5 focus-within:border-primary/50 transition-colors">
            {/* Attach */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                disabled={isStreaming || isProcessingFile}
                className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
              >
                {isProcessingFile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </Button>

              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-12 left-0 bg-popover border border-border rounded-xl shadow-xl p-1.5 min-w-36 z-50"
                  >
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent rounded-lg text-sm text-foreground"
                    >
                      <Image className="w-4 h-4 text-blue-400" />
                      Imagem
                    </button>
                    <button
                      onClick={() => pdfInputRef.current?.click()}
                      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent rounded-lg text-sm text-foreground"
                    >
                      <FileText className="w-4 h-4 text-red-400" />
                      PDF
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const file = e.target.files?.[0]; if (file) handleFileSelect(file, 'image'); e.target.value = ''; }} />
              <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden"
                onChange={e => { const file = e.target.files?.[0]; if (file) handleFileSelect(file, 'pdf'); e.target.value = ''; }} />
            </div>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta..."
              className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-sm py-2.5"
              rows={1}
              disabled={isStreaming}
            />

            <Button
              onClick={isStreaming ? stopStreaming : handleSend}
              disabled={!input.trim() && !uploadedFiles.length && !isStreaming}
              size="icon"
              className={cn(
                "h-9 w-9 rounded-lg transition-all shrink-0",
                isStreaming ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
              )}
            >
              {isStreaming ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-2">
            A Professora pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
