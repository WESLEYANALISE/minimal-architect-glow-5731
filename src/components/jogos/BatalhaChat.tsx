import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Swords, MessageCirclePlus, Scale, Gavel, FileText, List, Hand, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import advogado1Img from "@/assets/advogado1-avatar.jpg?format=webp&quality=75";
import advogada2Img from "@/assets/advogada2-avatar.jpg?format=webp&quality=75";
import tribunalBg from "@/assets/tribunal-background.webp";
import type { ProvaData } from "./BatalhaProvas";
import { highlightCasoText } from "./batalhaHighlight";

interface Mensagem {
  advogado: 1 | 2;
  texto: string;
  tipo?: "argumento" | "pedido_fala" | "pedido_prova" | "sistema";
}

interface ParteInfo {
  nome: string;
  tese: string;
  papel: string;
  argumentos: string[];
}

interface BatalhaChatProps {
  mensagens: Mensagem[];
  parte1: ParteInfo;
  parte2: ParteInfo;
  loading: boolean;
  onDebaterMais: () => void;
  onEncerrarInstrucao: () => void;
  podeEscolher: boolean;
  nivelBadge?: string;
  caso?: string;
  pontos_chave?: string[];
  provas?: ProvaData[];
  onDeferirProva?: (prova: ProvaData) => void;
  onIndeferirProva?: (prova: ProvaData) => void;
  waitingForPermission: boolean;
  onAllowSpeak: () => void;
  currentProvaRequest?: ProvaData | null;
}

const TypingDots = () => (
  <div className="flex gap-1.5 items-center px-3 py-2">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
      />
    ))}
  </div>
);

// Letter-by-letter typewriter component
const TypewriterText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const speed = Math.max(12, Math.min(30, 1500 / text.length)); // adaptive speed
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && (
        <motion.span
          className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}
    </span>
  );
};

const splitIntoParagraphs = (text: string): string[] => {
  const clean = text.replace(/\n+/g, ' ').trim();
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  if (sentences.length <= 3) return sentences.map(s => s.trim());
  const total = sentences.length;
  const third = Math.ceil(total / 3);
  return [
    sentences.slice(0, third).join(' ').trim(),
    sentences.slice(third, third * 2).join(' ').trim(),
    sentences.slice(third * 2).join(' ').trim(),
  ].filter(Boolean);
};

const ParteAvatar = ({ parte }: { parte: 1 | 2 }) => {
  const isBlue = parte === 1;
  return (
    <Avatar className={`w-9 h-9 border-2 flex-shrink-0 ${isBlue ? "border-blue-500/50" : "border-red-500/50"}`}>
      <AvatarImage
        src={isBlue ? advogado1Img : advogada2Img}
        alt={isBlue ? "Parte 1" : "Parte 2"}
        className="object-cover"
      />
      <AvatarFallback
        className={isBlue ? "bg-gradient-to-br from-blue-700 to-blue-900" : "bg-gradient-to-br from-red-700 to-red-900"}
      >
        {isBlue ? <Scale className="w-4 h-4 text-blue-200" /> : <Gavel className="w-4 h-4 text-red-200" />}
      </AvatarFallback>
    </Avatar>
  );
};

const BatalhaChat = ({
  mensagens,
  parte1,
  parte2,
  loading,
  onDebaterMais,
  onEncerrarInstrucao,
  podeEscolher,
  nivelBadge,
  caso,
  pontos_chave,
  waitingForPermission,
  onAllowSpeak,
  currentProvaRequest,
  onDeferirProva,
  onIndeferirProva,
}: BatalhaChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingComplete, setTypingComplete] = useState<Set<number>>(new Set());
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (mensagens.length === 0) {
      setVisibleCount(0);
      prevLengthRef.current = 0;
      setTypingComplete(new Set());
      return;
    }

    if (mensagens.length > prevLengthRef.current) {
      const startFrom = prevLengthRef.current;
      prevLengthRef.current = mensagens.length;

      const revealNext = (index: number) => {
        if (index >= mensagens.length) {
          setIsTyping(false);
          return;
        }
        setIsTyping(true);
        setTimeout(() => {
          setVisibleCount(index + 1);
          setIsTyping(false);
          // Don't auto-reveal next - wait for typewriter to finish
        }, 2500);
      };

      if (startFrom === 0) {
        setTimeout(() => revealNext(0), 800);
      } else {
        revealNext(startFrom);
      }
    }
  }, [mensagens.length]);

  const handleTypewriterComplete = useCallback((index: number) => {
    setTypingComplete(prev => new Set(prev).add(index));
    // Auto-reveal next message after a pause
    if (index + 1 < mensagens.length && visibleCount <= index + 1) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setVisibleCount(index + 2);
          setIsTyping(false);
        }, 2000);
      }, 800);
    }
  }, [mensagens.length, visibleCount]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount, isTyping, waitingForPermission, typingComplete.size]);

  const allRevealed = visibleCount >= mensagens.length && !isTyping;
  const allTypingDone = allRevealed && typingComplete.size >= mensagens.length;
  const hasTabs = !!(caso || pontos_chave);

  const messagesContent = (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 relative"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(13,13,20,0.85), rgba(13,13,20,0.92)), url(${tribunalBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <AnimatePresence>
        {mensagens.slice(0, visibleCount).map((msg, i) => {
          const isLeft = msg.advogado === 1;
          const info = isLeft ? parte1 : parte2;
          const isLastRevealed = i === visibleCount - 1;
          const shouldAnimate = isLastRevealed && !typingComplete.has(i);

          if (msg.tipo === "sistema") {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl px-4 py-2 text-center">
                  <p className="text-amber-300 text-xs font-medium">{msg.texto}</p>
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`flex gap-2 ${isLeft ? "justify-start" : "justify-end"}`}
            >
              {isLeft && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}>
                  <ParteAvatar parte={1} />
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, x: isLeft ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                  isLeft
                    ? "bg-blue-900/30 border border-blue-500/20 rounded-tl-sm backdrop-blur-sm"
                    : "bg-red-900/30 border border-red-500/20 rounded-tr-sm backdrop-blur-sm"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-xs font-semibold ${isLeft ? "text-blue-300" : "text-red-300"}`}>
                    {info.nome}
                  </p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isLeft ? "bg-blue-500/15 text-blue-400" : "bg-red-500/15 text-red-400"}`}>
                    {info.papel}
                  </span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {shouldAnimate ? (
                    <TypewriterText text={msg.texto} onComplete={() => handleTypewriterComplete(i)} />
                  ) : (
                    msg.texto
                  )}
                </p>
              </motion.div>
              {!isLeft && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}>
                  <ParteAvatar parte={2} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Typing indicator */}
      {(isTyping || loading) && !waitingForPermission && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start gap-2">
          <ParteAvatar
            parte={visibleCount < mensagens.length ? mensagens[visibleCount]?.advogado || 1 : 1}
          />
          <div className="rounded-2xl px-4 py-2 bg-neutral-800/70 border border-white/10 rounded-tl-sm backdrop-blur-sm">
            <TypingDots />
          </div>
        </motion.div>
      )}

      {/* "Posso falar?" request - shows avatar of the next speaker */}
      {waitingForPermission && allTypingDone && (() => {
        // Determine which lawyer will speak next
        const lastMsg = mensagens[mensagens.length - 1];
        const nextAdvogado: 1 | 2 = lastMsg ? (lastMsg.advogado === 1 ? 2 : 1) : 1;
        const nextInfo = nextAdvogado === 1 ? parte1 : parte2;
        return (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex justify-center"
          >
            <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-500/30 rounded-2xl px-5 py-4 text-center space-y-3 max-w-sm backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <ParteAvatar parte={nextAdvogado} />
                <p className="text-amber-200 font-semibold text-sm">Excelência, posso me manifestar?</p>
                <p className="text-amber-400/60 text-xs">{nextInfo.nome} — {nextInfo.papel}</p>
              </div>
              <Button
                onClick={onAllowSpeak}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold gap-2 h-10"
              >
                <Gavel className="w-4 h-4" />
                Prosseguir
              </Button>
            </div>
          </motion.div>
        );
      })()}

      {/* Prova request */}
      {currentProvaRequest && onDeferirProva && onIndeferirProva && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-2xl px-5 py-4 space-y-3 max-w-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <p className="text-purple-200 font-semibold text-sm">Solicitação de Prova</p>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">
              Solicito a juntada de: <span className="text-purple-300 font-semibold">{currentProvaRequest.nome}</span>
            </p>
            <p className="text-gray-400 text-xs">{currentProvaRequest.descricao}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => onDeferirProva(currentProvaRequest)}
                className="flex-1 h-9 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Defiro
              </Button>
              <Button
                onClick={() => onIndeferirProva(currentProvaRequest)}
                variant="outline"
                className="flex-1 h-9 border-red-500/50 text-red-300 hover:bg-red-500/10 text-xs gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                Indefiro
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100dvh - 60px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-neutral-900/80 rounded-t-xl flex-shrink-0">
        <div className="flex items-center gap-2">
          <ParteAvatar parte={1} />
          <div className="max-w-[90px]">
            <span className="text-xs text-blue-300 font-medium truncate block">{parte1.nome}</span>
            <span className="text-[10px] text-blue-400/50 truncate block">{parte1.papel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nivelBadge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-400 font-medium">
              {nivelBadge}
            </span>
          )}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Swords className="w-5 h-5 text-red-400" />
          </motion.div>
        </div>
        <div className="flex items-center gap-2">
          <div className="max-w-[90px] text-right">
            <span className="text-xs text-red-300 font-medium truncate block">{parte2.nome}</span>
            <span className="text-[10px] text-red-400/50 truncate block">{parte2.papel}</span>
          </div>
          <ParteAvatar parte={2} />
        </div>
      </div>

      {/* Tabs or direct messages */}
      {hasTabs ? (
        <Tabs defaultValue="debate" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="px-3 pt-2 bg-neutral-900/60 flex-shrink-0">
            <TabsList className="w-full bg-neutral-800/80 border border-white/5 h-9">
              <TabsTrigger value="debate" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-neutral-700">
                <Swords className="w-3 h-3" />
                Debate
              </TabsTrigger>
              <TabsTrigger value="caso" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-neutral-700">
                <FileText className="w-3 h-3" />
                Caso
              </TabsTrigger>
              <TabsTrigger value="resumo" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-neutral-700">
                <List className="w-3 h-3" />
                Resumo
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="debate" className="mt-0 flex-1 flex flex-col overflow-hidden min-h-0">
            {messagesContent}
          </TabsContent>

          <TabsContent value="caso" className="mt-0 flex-1 overflow-y-auto p-4 bg-neutral-950/50 space-y-4">
            {caso ? splitIntoParagraphs(caso).map((par, i) => (
              <p key={i} className="text-gray-300 text-sm leading-relaxed">{highlightCasoText(par)}</p>
            )) : null}
          </TabsContent>

          <TabsContent value="resumo" className="mt-0 flex-1 overflow-y-auto p-4 bg-neutral-950/50 space-y-3">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-2">Pontos-Chave</p>
            {pontos_chave?.map((ponto, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/50 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-300 text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{ponto}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      ) : (
        messagesContent
      )}

      {/* Judge actions menu - fixed at bottom for mobile */}
      {!loading && allTypingDone && podeEscolher && !waitingForPermission && !currentProvaRequest && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 border-t border-white/10 bg-neutral-900/95 backdrop-blur-sm rounded-b-xl space-y-2 flex-shrink-0 safe-bottom"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <p className="text-[10px] text-gray-500 uppercase tracking-wider text-center font-semibold">Ações do Juiz</p>
          <div className="flex gap-2">
            <Button
              onClick={onDebaterMais}
              variant="outline"
              className="flex-1 h-11 border-amber-500/50 text-amber-300 hover:bg-amber-500/10 gap-1.5 text-xs"
            >
              <MessageCirclePlus className="w-3.5 h-3.5" />
              Debater Mais
            </Button>
            <Button
              onClick={onEncerrarInstrucao}
              className="flex-1 h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white gap-1.5 text-xs"
            >
              <Gavel className="w-3.5 h-3.5" />
              Encerrar e Sentenciar
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BatalhaChat;
