import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, CreditCard, HelpCircle, Bug, X, Clock } from 'lucide-react';

interface FloatingSupportButtonProps {
  userEmail?: string;
}

const TEMPLATES = [
  {
    id: 'financeiro',
    label: 'Dúvida sobre pagamento',
    icon: CreditCard,
    subject: '[Financeiro] Questão sobre pagamento/assinatura',
    body: 'Olá, tenho uma questão financeira.\n\nDescreva sua questão aqui:\n\n',
  },
  {
    id: 'duvida',
    label: 'Dúvida sobre o app',
    icon: HelpCircle,
    subject: '[Dúvida] Preciso de ajuda',
    body: 'Olá, tenho uma dúvida sobre o aplicativo.\n\nEscreva sua dúvida aqui:\n\n',
  },
  {
    id: 'bug',
    label: 'Reportar um problema',
    icon: Bug,
    subject: '[Bug] Problema encontrado no app',
    body: 'Olá, encontrei um problema no aplicativo.\n\nDescreva o problema aqui:\n\n',
  },
];

const FloatingSupportButton: React.FC<FloatingSupportButtonProps> = ({ userEmail }) => {
  const [expanded, setExpanded] = useState(false);

  const handleTemplate = (template: typeof TEMPLATES[0]) => {
    const subject = encodeURIComponent(template.subject);
    const body = encodeURIComponent(`${template.body}---\nEmail da conta: ${userEmail || 'Não identificado'}`);
    window.open(`mailto:wn7corporation@gmail.com?subject=${subject}&body=${body}`, '_blank');
    setExpanded(false);
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl p-3 w-64 space-y-2"
            style={{
              background: 'hsl(25 20% 12%)',
              border: '1px solid hsl(0 0% 100% / 0.1)',
            }}
          >
            {/* Badge */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'hsl(142 60% 30% / 0.2)' }}>
              <Clock className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[11px] font-semibold text-green-400">Respondemos no mesmo dia!</span>
            </div>

            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTemplate(t)}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition-colors hover:bg-white/5"
              >
                <div className="p-1.5 rounded-full" style={{ background: 'hsl(43 80% 50% / 0.15)' }}>
                  <t.icon className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-sm text-white/80">{t.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setExpanded(!expanded)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors"
        style={{
          background: expanded ? 'hsl(0 0% 30%)' : 'linear-gradient(135deg, hsl(43 80% 45%), hsl(35 90% 50%))',
          color: expanded ? 'white' : 'hsl(25 30% 10%)',
        }}
      >
        {expanded ? <X className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
      </motion.button>
    </div>
  );
};

export default FloatingSupportButton;
