import { useNavigate } from "react-router-dom";
import { Mail, Clock, Bug, HelpCircle, CreditCard, ExternalLink, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const EMAIL_TEMPLATES = [
  {
    id: 'bug',
    label: 'Reportar um bug',
    description: 'Encontrou algo errado? Nos avise!',
    icon: <Bug className="h-5 w-5" />,
    iconBg: 'bg-red-500/15 text-red-500',
    subject: '[Bug] Problema encontrado no app',
    body: 'Olá, encontrei um problema no aplicativo.\n\nDescreva o problema aqui:\n\n',
  },
  {
    id: 'duvida',
    label: 'Tirar uma dúvida',
    description: 'Precisa de ajuda com algo?',
    icon: <HelpCircle className="h-5 w-5" />,
    iconBg: 'bg-amber-500/15 text-amber-500',
    subject: '[Dúvida] Preciso de ajuda',
    body: 'Olá, tenho uma dúvida.\n\nEscreva sua dúvida aqui:\n\n',
  },
  {
    id: 'financeiro',
    label: 'Questão financeira',
    description: 'Pagamento, assinatura ou reembolso',
    icon: <CreditCard className="h-5 w-5" />,
    iconBg: 'bg-emerald-500/15 text-emerald-500',
    subject: '[Financeiro] Questão sobre pagamento/assinatura',
    body: 'Olá, tenho uma questão financeira.\n\nDescreva sua questão aqui:\n\n',
  },
];

export default function Suporte() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleEmailTemplate = (template: typeof EMAIL_TEMPLATES[0]) => {
    const subject = encodeURIComponent(template.subject);
    const body = encodeURIComponent(`${template.body}---\nEmail da conta: ${user?.email || 'Não identificado'}`);
    window.open(`mailto:wn7corporation@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
          <p className="text-sm text-muted-foreground">
            Como podemos te ajudar?
          </p>
        </div>

        {/* Respondemos no mesmo dia */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
        >
          <div className="p-2 rounded-full bg-emerald-500/15">
            <Clock className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-emerald-400 text-sm">Respondemos no mesmo dia!</p>
            <p className="text-xs text-muted-foreground">Envie seu e-mail e retornamos o mais rápido possível.</p>
          </div>
        </motion.div>

        {/* Email options */}
        <div className="space-y-3">
          {EMAIL_TEMPLATES.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => handleEmailTemplate(template)}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all active:scale-[0.98] text-left w-full"
            >
              <div className={`p-2.5 rounded-xl ${template.iconBg}`}>
                {template.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{template.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
            </motion.button>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center space-y-1 pt-4">
          <p className="text-xs text-muted-foreground">
            Horário de atendimento: Segunda a Sexta, 9h às 18h
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            wn7corporation@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
