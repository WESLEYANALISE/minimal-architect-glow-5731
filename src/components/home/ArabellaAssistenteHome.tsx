import { useState, useEffect, useCallback } from "react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { useArabellaMetrics, gerarMensagemArabella, gerarFeedbackCompletoArabella } from "@/hooks/useArabellaMetrics";
import { ChevronRight, ChevronDown, Flame, Clock, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import draArabellaAvatar from "@/assets/dra-jurisia-avatar.png";


const FEEDBACK_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours
const LS_KEY = 'arabella_last_feedback_ts';

function getTimeUntilNextFeedback(): { hours: number; minutes: number; isNew: boolean } {
  const lastTs = localStorage.getItem(LS_KEY);
  if (!lastTs) return { hours: 0, minutes: 0, isNew: true };
  
  const elapsed = Date.now() - parseInt(lastTs, 10);
  if (elapsed >= FEEDBACK_INTERVAL_MS) return { hours: 0, minutes: 0, isNew: true };
  
  const remaining = FEEDBACK_INTERVAL_MS - elapsed;
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  return { hours, minutes, isNew: false };
}

interface Props {
  userName?: string | null;
}

export function ArabellaAssistenteHome({ userName }: Props) {
  const navigate = useTransitionNavigate();
  const metrics = useArabellaMetrics();
  const mensagem = gerarMensagemArabella(metrics, userName);
  const feedbackCompleto = gerarFeedbackCompletoArabella(metrics, userName);

  // Always start fresh — no stale cached messages from old versions
  const [displayMsg, setDisplayMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [countdown, setCountdown] = useState(getTimeUntilNextFeedback);

  // Update countdown every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilNextFeedback());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Always update with fresh message, clear stale cache
  useEffect(() => {
    if (metrics.loading) return;
    setDisplayMsg(mensagem);
    setIsTyping(false);
    try { 
      localStorage.removeItem('arabella_msg_cache'); // Remove stale cache
    } catch {}

    // Mark feedback as seen for countdown
    const { isNew } = getTimeUntilNextFeedback();
    if (isNew) {
      localStorage.setItem(LS_KEY, Date.now().toString());
      setCountdown(getTimeUntilNextFeedback());
    }
  }, [metrics.loading, mensagem]);

  const countdownStr = countdown.isNew
    ? 'Novo feedback!'
    : countdown.hours > 0
      ? `${countdown.hours}h${countdown.minutes > 0 ? countdown.minutes + 'min' : ''}`
      : `${countdown.minutes}min`;

  return (
    <div className="h-full flex flex-col">
      <div 
        className="relative bg-gradient-to-b from-red-950 via-red-900/95 to-red-950 backdrop-blur-sm rounded-2xl border border-red-800/30 overflow-hidden h-full flex flex-col"
      >
        
        {/* Animated top line */}
        <div className="relative h-6 flex items-center justify-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-red-800/40 to-transparent" />
          <div className="absolute inset-x-0 top-1/2 h-px overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" style={{ animation: 'shimmerLineArabella 3s ease-in-out infinite' }} />
          </div>
          <div className="relative z-10 px-3 bg-red-950 rounded">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
              <span className="text-[8px] text-white uppercase tracking-widest font-bold">Acompanhamento Pessoal</span>
              <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
            </div>
          </div>
        </div>

        <div className="px-3.5 pb-3.5 space-y-2.5 flex-1 flex flex-col">
          {/* Avatar + name + next feedback countdown */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={draArabellaAvatar} alt="Dra. Arabella" className="w-8 h-8 rounded-full object-cover border-2 border-red-700/60" />
              <div>
                <span className="text-[11px] font-bold text-white leading-none drop-shadow-sm">Dra. Arabella</span>
                <p className="text-[9px] text-white leading-none mt-0.5">Assistente de progresso</p>
              </div>
            </div>
            {/* Next feedback countdown badge */}
            <div className="flex items-center gap-1 bg-white/[0.12] border border-white/[0.15] rounded-lg px-2 py-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-white">{countdownStr}</span>
            </div>
          </div>

          {/* Speech bubble — summary */}
          <div className="ml-4 relative">
            <div className="absolute -top-1 left-2.5 w-2.5 h-2.5 rotate-45 bg-white/[0.06]" />
            <div className="relative rounded-xl rounded-tl-sm px-3 py-2.5 bg-white/[0.06] border border-white/[0.08]">
              <span className="text-[12.5px] text-white/85 leading-relaxed" dangerouslySetInnerHTML={{ __html: displayMsg }} />
              {isTyping && <span className="inline-block w-0.5 h-3.5 bg-red-400 ml-0.5 animate-pulse" />}
            </div>
          </div>

          {/* Expanded detailed feedback */}
          <AnimatePresence>
            {expanded && feedbackCompleto && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="ml-4 overflow-hidden"
              >
                <div className="rounded-xl px-3 py-3 bg-white/[0.04] border border-white/[0.06] space-y-1">
                  <div className="text-[12px] text-white/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: feedbackCompleto }} />
                  <button
                    onClick={() => setExpanded(false)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.08] border border-white/[0.1] text-[12px] font-semibold text-white/90 hover:bg-white/[0.12] transition-colors active:scale-[0.97]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Entendi
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Button — expand/collapse */}
          {!expanded && (
            <motion.button
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              onClick={() => navigate('/aulas')}
              className="ml-4 w-[calc(100%-16px)] flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, hsl(8 65% 48%), hsl(8 55% 35%))' }}
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]" style={{ animation: 'btnShineArabella 3s ease-in-out infinite' }} />
              </div>
              <Flame className="w-4 h-4 relative z-[1]" />
              <span className="relative z-[1]">Ver Aulas</span>
              <ChevronRight className="w-4 h-4 relative z-[1]" />
            </motion.button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes shimmerLineArabella {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(300%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes btnShineArabella {
          0% { transform: translateX(-100%) skewX(-20deg); }
          50% { transform: translateX(250%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
}
