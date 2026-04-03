import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Bug, 
  HelpCircle, 
  CreditCard, 
  MessageSquare, 
  Lightbulb,
  Send,
  ArrowLeft,
  CheckCircle2,
  Headphones,
  Camera,
  Paperclip,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORIAS = [
  { id: 'bug', label: 'Reportar um bug', icon: Bug, color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 'duvida', label: 'Tirar uma dúvida', icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'financeiro', label: 'Questão financeira', icon: CreditCard, color: 'text-green-400', bg: 'bg-green-500/10' },
  { id: 'sugestao', label: 'Sugestão de melhoria', icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'outro', label: 'Outro assunto', icon: MessageSquare, color: 'text-violet-400', bg: 'bg-violet-500/10' },
];

const SUPPORT_EMAIL = 'wn7corporation@gmail.com';

interface SupportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportSheet({ open, onOpenChange }: SupportSheetProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'categoria' | 'mensagem' | 'enviado'>('categoria');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [semAnexo, setSemAnexo] = useState(false);

  const handleSelectCategoria = (id: string) => {
    setCategoriaSelecionada(id);
    setStep('mensagem');
  };

  const handleEnviar = () => {
    if (!mensagem.trim() || !categoriaSelecionada) return;

    const cat = CATEGORIAS.find(c => c.id === categoriaSelecionada);
    const subject = `[Suporte - ${cat?.label}] Ticket de ${user?.email || 'usuário'}`;
    
    let body = `Categoria: ${cat?.label}\n\n`;
    body += `Mensagem:\n${mensagem.trim()}\n\n`;
    if (semAnexo) {
      body += `📎 Sem anexos neste ticket.\n\n`;
    } else {
      body += `📎 Por favor, anexe prints ou arquivos relevantes ao e-mail.\n\n`;
    }
    body += `---\nEmail: ${user?.email || 'Não identificado'}\nUser ID: ${user?.id || 'N/A'}`;

    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailto;
    setStep('enviado');
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('categoria');
      setCategoriaSelecionada('');
      setMensagem('');
      setSemAnexo(false);
    }, 300);
  };

  const categoriaAtual = CATEGORIAS.find(c => c.id === categoriaSelecionada);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-background border-t border-border/50 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Suporte</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-border/20">
            {step === 'mensagem' && (
              <button onClick={() => setStep('categoria')} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Falar com o suporte</h2>
                <p className="text-xs text-muted-foreground">Respondemos no mesmo dia!</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <AnimatePresence mode="wait">
              {step === 'categoria' && (
                <motion.div
                  key="categoria"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione a categoria do seu atendimento:
                  </p>
                  {CATEGORIAS.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategoria(cat.id)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border/30 bg-card hover:bg-muted/40 transition-all active:scale-[0.98] text-left"
                      >
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", cat.bg)}>
                          <Icon className={cn("w-5 h-5", cat.color)} />
                        </div>
                        <span className="text-sm font-medium text-foreground">{cat.label}</span>
                      </button>
                    );
                  })}

                  {/* Destaque "respondido no mesmo dia" */}
                  <div className="mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Clock className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-[13px] font-semibold text-emerald-300">
                      Você será respondido no mesmo dia! ⚡
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 'mensagem' && (
                <motion.div
                  key="mensagem"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {categoriaAtual && (
                    <div className={cn("flex items-center gap-3 p-3 rounded-xl", categoriaAtual.bg)}>
                      <categoriaAtual.icon className={cn("w-4 h-4", categoriaAtual.color)} />
                      <span className={cn("text-sm font-medium", categoriaAtual.color)}>{categoriaAtual.label}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Descreva sua mensagem
                    </label>
                    <Textarea
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      placeholder="Como podemos te ajudar? Descreva com detalhes..."
                      className="min-h-[140px] resize-none bg-card border-border/40 rounded-xl text-sm focus:ring-primary/30"
                      maxLength={2000}
                    />
                    <p className="text-[10px] text-muted-foreground/50 mt-1 text-right">
                      {mensagem.length}/2000
                    </p>
                  </div>

                  {/* Recomendação de print */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/15">
                    <Camera className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300 leading-relaxed">
                      <span className="font-semibold">Dica:</span> Se possível, envie um print da tela que está com o problema. Isso nos ajuda a resolver mais rápido!
                    </p>
                  </div>

                  {/* Checkbox sem anexo */}
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20 cursor-pointer select-none active:scale-[0.98] transition-transform">
                    <input
                      type="checkbox"
                      checked={semAnexo}
                      onChange={(e) => setSemAnexo(e.target.checked)}
                      className="w-4 h-4 rounded border-border/40 text-primary focus:ring-primary/30 accent-primary"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Paperclip className="w-4 h-4 text-muted-foreground/60" />
                      <span className="text-sm text-muted-foreground">Não tenho nenhum anexo</span>
                    </div>
                  </label>

                  {/* Botão enviar */}
                  <Button
                    onClick={handleEnviar}
                    disabled={!mensagem.trim()}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar mensagem
                  </Button>

                  {/* Destaque "respondido no mesmo dia" */}
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <p className="text-[13px] font-bold text-emerald-400">
                      Você será respondido no mesmo dia!
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 'enviado' && (
                <motion.div
                  key="enviado"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Mensagem pronta!</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    Seu app de e-mail foi aberto com a mensagem preenchida.
                    {!semAnexo && ' Anexe prints ou arquivos antes de enviar.'}
                  </p>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <p className="text-[13px] font-bold text-emerald-400">
                      Você será respondido no mesmo dia! ⚡
                    </p>
                  </div>
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="mt-4 rounded-xl"
                  >
                    Fechar
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
