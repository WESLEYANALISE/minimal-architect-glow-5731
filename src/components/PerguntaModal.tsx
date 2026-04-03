import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabaseConfig";
import { AssistantMessage } from "./AssistantMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PerguntaModalProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
}

const PerguntaModal = ({ isOpen, onClose, artigo, numeroArtigo }: PerguntaModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const perguntasSugeridas = [
    "O que este artigo significa na prática?",
    "Quais as exceções deste artigo?",
    `Como o Art. ${numeroArtigo} cai em provas e concursos?`,
    "Qual a relação com outros artigos?",
  ];

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInput("");
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const enviarPergunta = async (pergunta: string) => {
    if (!pergunta.trim() || loading) return;

    const userMessage: Message = { role: "user", content: pergunta };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const contextualPrompt = `Você é uma professora de Direito didática e acessível.

O estudante está analisando o seguinte artigo:
Art. ${numeroArtigo}
${artigo}

Responda de forma clara, didática e precisa. Use exemplos práticos quando relevante. Seja concisa mas completa.

Pergunta do estudante: ${pergunta}`;

      const allMessages = [
        ...messages,
        { role: "user" as const, content: contextualPrompt },
      ];

      const session = await supabase.auth.getSession();

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/chat-professora`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.data.session?.access_token || SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
            files: [],
            mode: "study",
            responseLevel: "complete",
            linguagemMode: "descomplicado",
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) throw new Error("Limite atingido. Aguarde alguns minutos.");
        throw new Error(`Erro ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;

            let payloadStr = trimmed;
            if (trimmed.startsWith("data:")) {
              payloadStr = trimmed.slice(5).trim();
              if (payloadStr === "[DONE]") continue;
            }

            try {
              const parsed = JSON.parse(payloadStr);
              const content = parsed?.choices?.[0]?.delta?.content || parsed?.content || "";

              if (content) {
                accumulatedText += content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: accumulatedText };
                  return updated;
                });
              }

              if (parsed?.choices?.[0]?.finish_reason === "stop" || parsed?.done) break;
            } catch {
              // ignore
            }
          }
        }

        if (!accumulatedText) throw new Error("Sem resposta");
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Tente novamente.", variant: "destructive" });
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === "assistant" && !prev[prev.length - 1]?.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const artigoTruncado = artigo.length > 120 ? artigo.substring(0, 120) + "..." : artigo;
  const showSugestoes = messages.length === 0 || (!loading && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto" onClick={(e) => e.stopPropagation()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal bottom-sheet */}
      <div className="absolute bottom-0 left-0 right-0 md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] h-[80vh] md:h-[600px] bg-card border rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-background rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MessageCircleQuestion className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm">Art. {numeroArtigo}</h3>
              <p className="text-xs text-muted-foreground truncate">{artigoTruncado}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {/* Welcome estático */}
            {messages.length === 0 && (
              <div className="bg-muted rounded-2xl px-4 py-3">
                <p className="text-sm">
                  Olá! 👋 Estou aqui para tirar suas dúvidas sobre o <strong>Art. {numeroArtigo}</strong>. Escolha uma pergunta abaixo ou digite a sua!
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <AssistantMessage content={msg.content} onAskSuggestion={(s) => enviarPergunta(s)} />
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}

            {/* Sugestões */}
            {showSugestoes && !loading && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground font-medium px-1">💡 Perguntas sugeridas:</p>
                <div className="flex flex-col gap-1.5">
                  {perguntasSugeridas.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => enviarPergunta(p)}
                      className="text-left text-sm px-3 py-2.5 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-background/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviarPergunta(input);
                }
              }}
              placeholder="Digite sua pergunta..."
              disabled={loading}
              className="flex-1 bg-input text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border border-border/50 text-sm"
            />
            <Button onClick={() => enviarPergunta(input)} disabled={!input.trim() || loading} size="icon" className="h-[46px] w-[46px] rounded-xl">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerguntaModal;
