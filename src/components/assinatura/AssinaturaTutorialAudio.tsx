import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { PlanType } from "@/hooks/use-mercadopago-pix";

const TUTORIAL_SCRIPT = `Olá! Que bom te ver aqui! 😊 Deixa eu te apresentar nossos planos.

Pra quem quer começar com calma, o Plano Mensal por R$ 21,90 renova todo mês e você pode cancelar quando quiser. Simples assim.

O preferido da galera é o Plano Anual por apenas R$ 149,90 — são 12 meses de acesso completo, o melhor custo-benefício! 🎯

E pra quem quer acesso pra sempre, o Plano Vitalício por R$ 249,90 — pagamento único e você nunca mais precisa se preocupar. 🚀`;

const PLAN_SWITCH_CHARS = [
  { char: 0, plan: 'mensal' as PlanType },
  { char: 150, plan: 'anual' as PlanType },
  { char: 350, plan: 'vitalicio' as PlanType },
];

interface Props {
  onPlanSwitch?: (plan: PlanType) => void;
}

const AssinaturaTutorialAudio = ({ onPlanSwitch }: Props) => {
  const [displayedText, setDisplayedText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const onPlanSwitchRef = useRef(onPlanSwitch);
  const lastPlanRef = useRef<PlanType>('anual');
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { onPlanSwitchRef.current = onPlanSwitch; }, [onPlanSwitch]);

  useEffect(() => {
    if (!isTyping) return;

    setDisplayedText('');
    setTypingDone(false);
    let index = 0;

    typingIntervalRef.current = setInterval(() => {
      if (index < TUTORIAL_SCRIPT.length) {
        setDisplayedText(TUTORIAL_SCRIPT.substring(0, index + 1));

        let targetPlan: PlanType = 'anual';
        for (let i = PLAN_SWITCH_CHARS.length - 1; i >= 0; i--) {
          if (index >= PLAN_SWITCH_CHARS[i].char) {
            targetPlan = PLAN_SWITCH_CHARS[i].plan;
            break;
          }
        }
        if (targetPlan !== lastPlanRef.current) {
          lastPlanRef.current = targetPlan;
          onPlanSwitchRef.current?.(targetPlan);
        }

        index++;
      } else {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setTypingDone(true);
        setIsTyping(false);
      }
    }, 40);

    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, [isTyping]);

  const handleReplay = () => {
    if (isTyping) return;
    setIsTyping(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-sm mx-auto mb-6"
    >
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={handleReplay}
          disabled={isTyping}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 transition-all hover:bg-amber-500/30 disabled:opacity-50"
        >
          <Play className="w-4 h-4 text-amber-400 ml-0.5" />
        </button>
        <div className="flex-1">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">
            📖 Conheça os planos
          </p>
          {!isTyping && typingDone && (
            <p className="text-zinc-500 text-[10px] mt-0.5">Toque ▶ para ver a apresentação</p>
          )}
        </div>
      </div>

      {displayedText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-line mt-3 bg-zinc-900/80 border border-zinc-700/50 text-zinc-300"
        >
          {displayedText}
          {isTyping && !typingDone && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-0.5 h-4 bg-amber-400 ml-0.5 align-middle"
            />
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AssinaturaTutorialAudio;
