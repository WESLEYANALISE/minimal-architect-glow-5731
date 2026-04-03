import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BookOpen, Film, Scale, Lightbulb, Sparkles, Newspaper, Mail, MessageCircle, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const TIPOS_CONTEUDO = [
  { id: 'receber_boletim_diario', label: 'Boletim Diário', descricao: 'Resumo das notícias jurídicas', icon: Newspaper, color: 'text-blue-500' },
  { id: 'receber_leis_dia', label: 'Leis do Dia', descricao: 'Novas leis publicadas', icon: Scale, color: 'text-emerald-500' },
  { id: 'receber_livro_dia', label: 'Livro do Dia', descricao: 'Recomendação de livro jurídico', icon: BookOpen, color: 'text-purple-500' },
  { id: 'receber_filme_dia', label: 'Filme do Dia', descricao: 'Recomendação do JuriFlix', icon: Film, color: 'text-red-500' },
  { id: 'receber_dica_estudo', label: 'Dica de Estudo', descricao: 'Dicas para otimizar seus estudos', icon: Lightbulb, color: 'text-yellow-500' },
  { id: 'receber_novidades', label: 'Novidades', descricao: 'Atualizações da plataforma', icon: Sparkles, color: 'text-pink-500' },
];

type CanalOpcao = 'whatsapp' | 'email' | 'ambos';

interface Preferencias {
  canal: CanalOpcao;
  [key: string]: boolean | string;
}

const NotificacoesPreferencias = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [preferencias, setPreferencias] = useState<Preferencias>({
    canal: 'ambos',
    receber_boletim_diario: true,
    receber_leis_dia: true,
    receber_filme_dia: false,
    receber_livro_dia: false,
    receber_dica_estudo: false,
    receber_novidades: true,
  });

  useEffect(() => {
    if (user) carregarPreferencias();
  }, [user]);

  const carregarPreferencias = async () => {
    try {
      const { data } = await supabase
        .from('notificacoes_preferencias_usuario' as any)
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (data) {
        const d = data as any;
        let canal: CanalOpcao = 'ambos';
        if (d.canal_whatsapp && !d.canal_email) canal = 'whatsapp';
        else if (!d.canal_whatsapp && d.canal_email) canal = 'email';

        setPreferencias({
          canal,
          receber_boletim_diario: d.receber_boletim_diario ?? true,
          receber_leis_dia: d.receber_leis_dia ?? true,
          receber_filme_dia: d.receber_filme_dia ?? false,
          receber_livro_dia: d.receber_livro_dia ?? false,
          receber_dica_estudo: d.receber_dica_estudo ?? false,
          receber_novidades: d.receber_novidades ?? true,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
    }
    setLoading(false);
  };

  const salvar = async () => {
    if (!user) return;
    setSalvando(true);
    try {
      const canal_whatsapp = preferencias.canal === 'whatsapp' || preferencias.canal === 'ambos';
      const canal_email = preferencias.canal === 'email' || preferencias.canal === 'ambos';

      const payload = {
        user_id: user.id,
        canal_whatsapp,
        canal_email,
        canal_push: true,
        receber_boletim_diario: !!preferencias.receber_boletim_diario,
        receber_leis_dia: !!preferencias.receber_leis_dia,
        receber_filme_dia: !!preferencias.receber_filme_dia,
        receber_livro_dia: !!preferencias.receber_livro_dia,
        receber_dica_estudo: !!preferencias.receber_dica_estudo,
        receber_novidades: !!preferencias.receber_novidades,
      };

      const { error } = await supabase
        .from('notificacoes_preferencias_usuario' as any)
        .upsert(payload as any, { onConflict: 'user_id' });

      if (error) throw error;

      toast({ title: "✅ Preferências salvas!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
    setSalvando(false);
  };

  const toggleConteudo = (id: string) => {
    setPreferencias(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-4 md:px-6 py-4 space-y-6 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações
            </h1>
            <p className="text-sm text-muted-foreground">Escolha o que deseja receber</p>
          </div>
        </div>

        {/* O que deseja receber */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">O que deseja receber?</h2>
          <div className="space-y-2">
            {TIPOS_CONTEUDO.map(tipo => {
              const Icon = tipo.icon;
              return (
                <Card
                  key={tipo.id}
                  className="cursor-pointer border-border hover:border-primary/30 transition-colors"
                  onClick={() => toggleConteudo(tipo.id)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <Checkbox
                      checked={!!preferencias[tipo.id]}
                      onCheckedChange={() => toggleConteudo(tipo.id)}
                    />
                    <Icon className={`h-4 w-4 ${tipo.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{tipo.label}</p>
                      <p className="text-xs text-muted-foreground">{tipo.descricao}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Como deseja receber */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Como deseja receber?</h2>
          <RadioGroup
            value={preferencias.canal}
            onValueChange={(v) => setPreferencias(prev => ({ ...prev, canal: v as CanalOpcao }))}
            className="space-y-2"
          >
            <Card className="border-border">
              <CardContent className="flex items-center gap-3 p-3">
                <RadioGroupItem value="whatsapp" id="canal-whatsapp" />
                <Label htmlFor="canal-whatsapp" className="flex items-center gap-2 cursor-pointer flex-1">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">WhatsApp</span>
                </Label>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="flex items-center gap-3 p-3">
                <RadioGroupItem value="email" id="canal-email" />
                <Label htmlFor="canal-email" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">E-mail</span>
                </Label>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="flex items-center gap-3 p-3">
                <RadioGroupItem value="ambos" id="canal-ambos" />
                <Label htmlFor="canal-ambos" className="flex items-center gap-2 cursor-pointer flex-1">
                  <div className="flex gap-1">
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm">Ambos</span>
                </Label>
              </CardContent>
            </Card>
          </RadioGroup>
        </div>

        {/* Salvar */}
        <Button className="w-full" onClick={salvar} disabled={salvando}>
          {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Salvar preferências
        </Button>
      </div>
    </div>
  );
};

export default NotificacoesPreferencias;
