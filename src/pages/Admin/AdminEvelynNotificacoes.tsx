import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Bell, BookOpen, Film, Scale, Lightbulb, Sparkles, Newspaper, RefreshCw, CheckCircle, XCircle, Mail, MessageCircle, Smartphone, Clock, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TipoNotificacao {
  id: string;
  label: string;
  descricao: string;
  icon: any;
  color: string;
  colunaEvelyn: string;
  colunaPrefs: string;
}

const TIPOS: TipoNotificacao[] = [
  { id: 'boletim_diario', label: 'Boletim Diário', descricao: 'Resumo de notícias jurídicas do dia', icon: Newspaper, color: 'text-blue-500', colunaEvelyn: 'receber_boletim_diario', colunaPrefs: 'receber_boletim_diario' },
  { id: 'leis_dia', label: 'Leis do Dia', descricao: 'Novas leis com número e resumo', icon: Scale, color: 'text-emerald-500', colunaEvelyn: 'receber_leis_dia', colunaPrefs: 'receber_leis_dia' },
  { id: 'livro_dia', label: 'Livro do Dia', descricao: 'Recomendação diária de livro jurídico', icon: BookOpen, color: 'text-purple-500', colunaEvelyn: 'receber_livro_dia', colunaPrefs: 'receber_livro_dia' },
  { id: 'filme_dia', label: 'Filme do Dia', descricao: 'Recomendação jurídica do JuriFlix', icon: Film, color: 'text-red-500', colunaEvelyn: 'receber_filme_dia', colunaPrefs: 'receber_filme_dia' },
  { id: 'dica_estudo', label: 'Dica de Estudo', descricao: 'Dica de estudo diária', icon: Lightbulb, color: 'text-yellow-500', colunaEvelyn: 'receber_dica_estudo', colunaPrefs: 'receber_dica_estudo' },
  { id: 'novidades', label: 'Novidades', descricao: 'Atualizações da plataforma', icon: Sparkles, color: 'text-pink-500', colunaEvelyn: 'receber_novidades', colunaPrefs: 'receber_novidades' },
];

const HORARIOS = [
  { label: '08:00', value: '08:00', utc: '11:00' },
  { label: '14:00', value: '14:00', utc: '17:00' },
  { label: '20:00', value: '20:00', utc: '23:00' },
];

const AdminEvelynNotificacoes = () => {
  const navigate = useNavigate();
  const [inscritosWhatsapp, setInscritosWhatsapp] = useState<Record<string, number>>({});
  const [inscritosEmail, setInscritosEmail] = useState<Record<string, number>>({});
  const [inscritosPush, setInscritosPush] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [horarioSelecionado, setHorarioSelecionado] = useState('08:00');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Buscar contagem WhatsApp (evelyn_preferencias_notificacao)
      const { data: evelynPrefs } = await supabase
        .from('evelyn_preferencias_notificacao')
        .select('*')
        .eq('ativo', true);

      if (evelynPrefs) {
        const contagemWpp: Record<string, number> = {};
        TIPOS.forEach(tipo => {
          contagemWpp[tipo.id] = evelynPrefs.filter((p: any) => p[tipo.colunaEvelyn] === true).length;
        });
        setInscritosWhatsapp(contagemWpp);
      }

      // Buscar contagem E-mail e Push (notificacoes_preferencias_usuario)
      const { data: userPrefs } = await supabase
        .from('notificacoes_preferencias_usuario' as any)
        .select('*');

      if (userPrefs) {
        const contagemEmail: Record<string, number> = {};
        const contagemPush: Record<string, number> = {};
        TIPOS.forEach(tipo => {
          contagemEmail[tipo.id] = (userPrefs as any[]).filter((p: any) => p[tipo.colunaPrefs] === true && p.canal_email === true).length;
          contagemPush[tipo.id] = (userPrefs as any[]).filter((p: any) => p[tipo.colunaPrefs] === true && p.canal_push === true).length;
        });
        setInscritosEmail(contagemEmail);
        setInscritosPush(contagemPush);
      }

      // Buscar logs recentes
      const { data: logsData } = await supabase
        .from('evelyn_notificacoes_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsData) setLogs(logsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
    setLoading(false);
  };

  const dispararNotificacao = async (tipo: string, apenasAdmin = false) => {
    setEnviando(tipo);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
        setEnviando(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, telefone')
        .eq('id', user.id)
        .maybeSingle();

      const payload: any = {
        tipo,
        horario: horarioSelecionado,
        apenasAdmin,
        emailAdmin: profile?.email ?? null,
        telefoneAdmin: profile?.telefone ?? null,
      };

      if (apenasAdmin) {
        if (!profile?.telefone) {
          toast({
            title: "Telefone não encontrado",
            description: "Configure seu telefone no perfil para testar",
            variant: "destructive",
          });
          setEnviando(null);
          return;
        }
        payload.telefones = [profile.telefone];
      }

      const { data, error } = await supabase.functions.invoke('evelyn-disparar-notificacoes', {
        body: payload,
      });

      if (error) throw error;

      toast({
        title: "✅ Notificação disparada",
        description: `${data?.enviados || 0} enviados, ${data?.erros || 0} erros`,
      });

      carregarDados();
    } catch (err: any) {
      toast({
        title: "Erro ao disparar",
        description: err.message,
        variant: "destructive",
      });
    }
    setEnviando(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Central de Notificações
            </h1>
            <p className="text-sm text-muted-foreground">WhatsApp • E-mail • Push</p>
          </div>
        </div>

        {/* Seletor de horário */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Horário:</span>
          <div className="flex gap-2">
            {HORARIOS.map(h => (
              <Button
                key={h.value}
                size="sm"
                variant={horarioSelecionado === h.value ? "default" : "outline"}
                className="text-xs"
                onClick={() => setHorarioSelecionado(h.value)}
              >
                {h.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Cards de tipos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TIPOS.map(tipo => {
            const Icon = tipo.icon;
            const wppCount = inscritosWhatsapp[tipo.id] || 0;
            const emailCount = inscritosEmail[tipo.id] || 0;
            const pushCount = inscritosPush[tipo.id] || 0;
            const isEnviando = enviando === tipo.id;

            return (
              <Card key={tipo.id} className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${tipo.color}`} />
                    {tipo.label}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{tipo.descricao}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="gap-1">
                      <MessageCircle className="h-3 w-3 text-green-500" />
                      {wppCount} WhatsApp
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Mail className="h-3 w-3 text-blue-500" />
                      {emailCount} E-mail
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Smartphone className="h-3 w-3 text-purple-500" />
                      {pushCount} Push
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      disabled={isEnviando}
                      onClick={() => dispararNotificacao(tipo.id, true)}
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      {isEnviando ? '...' : 'Testar'}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={isEnviando || (wppCount + emailCount + pushCount === 0)}
                      onClick={() => dispararNotificacao(tipo.id, false)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {isEnviando ? '...' : 'Disparar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Logs recentes */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">📋 Logs de Envio</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum envio registrado</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border text-sm">
                  {log.status === 'enviado' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {TIPOS.find(t => t.id === log.tipo)?.label || log.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.telefone?.substring(0, 8)}**** • {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {log.erro && <span className="text-xs text-red-400">{log.erro}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEvelynNotificacoes;
