import { Mail, ExternalLink, Bug, HelpCircle, CreditCard, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EmailTemplate {
  id: string;
  label: string;
  icon: React.ReactNode;
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'bug',
    label: 'Reportar um bug',
    icon: <Bug className="h-4 w-4" />,
    subject: '[Bug] Problema encontrado no app',
    body: 'Olá, encontrei um problema no aplicativo.\n\nDescreva o problema aqui:\n\n',
  },
  {
    id: 'duvida',
    label: 'Tirar uma dúvida',
    icon: <HelpCircle className="h-4 w-4" />,
    subject: '[Dúvida] Preciso de ajuda',
    body: 'Olá, tenho uma dúvida.\n\nEscreva sua dúvida aqui:\n\n',
  },
  {
    id: 'financeiro',
    label: 'Questão financeira',
    icon: <CreditCard className="h-4 w-4" />,
    subject: '[Financeiro] Questão sobre pagamento/assinatura',
    body: 'Olá, tenho uma questão financeira.\n\nDescreva sua questão aqui:\n\n',
  },
];

export function PerfilSuporteTab() {
  const { user } = useAuth();

  const handleEmailTemplate = (template: EmailTemplate) => {
    const subject = encodeURIComponent(template.subject);
    const body = encodeURIComponent(`${template.body}---\nEmail da conta: ${user?.email || 'Não identificado'}`);
    window.open(`mailto:wn7corporation@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Suporte Header */}
      <div className="text-center py-4">
        <h3 className="font-bold text-lg mb-2">Precisa de ajuda?</h3>
        <p className="text-sm text-muted-foreground">
          Estamos aqui para te ajudar! Escolha a melhor forma de contato.
        </p>
      </div>

      {/* Destaque - Respondemos no mesmo dia */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
        <div className="p-2 rounded-full bg-green-500/20">
          <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="font-semibold text-green-700 dark:text-green-300 text-sm">Respondemos no mesmo dia!</p>
          <p className="text-xs text-muted-foreground">Envie seu e-mail e retornamos o mais rápido possível.</p>
        </div>
      </div>

      {/* Email Templates */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>Enviar e-mail</span>
        </div>
        
        <div className="grid gap-2">
          {EMAIL_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleEmailTemplate(template)}
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-left w-full"
            >
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                {template.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{template.label}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Info Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>Horário de atendimento: Segunda a Sexta, 9h às 18h</p>
      </div>
    </div>
  );
}
