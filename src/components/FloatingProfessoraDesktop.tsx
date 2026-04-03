import { useState, useRef, useEffect } from "react";
import { GraduationCap, X, Send, Loader2, BookOpen, Scale, Lightbulb, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type ChatMode = "study" | "realcase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MarkdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-base font-bold text-primary mb-2 mt-3">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-sm font-semibold text-foreground mb-1.5 mt-2">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-sm font-semibold text-foreground mb-1 mt-1.5">{children}</h3>
  ),
  p: ({ children }: any) => (
    <p className="mb-1.5 leading-relaxed text-[13px]">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc ml-4 space-y-0.5 mb-1.5 text-[13px]">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal ml-4 space-y-0.5 mb-1.5 text-[13px]">{children}</ol>
  ),
  li: ({ children }: any) => <li className="text-[13px]">{children}</li>,
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="bg-secondary/80 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
    ) : (
      <code className="block bg-secondary/80 p-2 rounded text-xs font-mono my-1.5 overflow-x-auto">{children}</code>
    ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-3 border-primary/50 pl-2 py-0.5 my-1.5 bg-primary/5 rounded-r text-[13px] italic">{children}</blockquote>
  ),
  strong: ({ children }: any) => <strong className="font-bold text-foreground">{children}</strong>,
  a: ({ href, children }: any) => (
    <a href={href} className="text-primary hover:underline text-[13px]" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
};

const suggestions = [
  "Tire uma dúvida sobre direito",
  "Me ajude a estudar melhor",
  "Explique um conceito jurídico",
  "Crie um plano de estudos",
];

export const FloatingProfessoraDesktop = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("study");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Reset on route change
  useEffect(() => {
    setMessages([]);
    setMode("study");
  }, [location.pathname]);

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    setMessages([]);
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const { data, error } = await supabase.functions.invoke("chat-professora", {
        body: {
          messages: [...messages, userMessage],
          files: [],
          mode,
          context: { page: location.pathname },
        },
      });

      if (error) throw error;

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.data || data.message || "Desculpe, não consegui processar.",
        },
      ]);
    } catch (error) {
      console.error("Erro:", error);
      toast({ title: "Erro", description: "Não foi possível enviar a mensagem.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  };

  // Botão flutuante removido — acesso via sidebar ou atalhos
  return null;
};
