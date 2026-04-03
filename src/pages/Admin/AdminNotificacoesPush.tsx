import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Send, CheckCircle, XCircle, Loader2, Image, Link as LinkIcon, RefreshCw, Palette, Smartphone, Clock, Save, Trash2, FileText, Calendar, Ban, Monitor, TabletSmartphone, Globe, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CORES_PREDEFINIDAS = [
  { nome: "Verde", hex: "#22C55E", uso: "Novidades, sucesso" },
  { nome: "Azul", hex: "#3B82F6", uso: "Informativo" },
  { nome: "Roxo", hex: "#7C3AED", uso: "Premium, destaque" },
  { nome: "Vermelho", hex: "#EF4444", uso: "Urgente, alerta" },
  { nome: "Laranja", hex: "#F97316", uso: "Atenção" },
  { nome: "Amarelo", hex: "#EAB308", uso: "Aviso" },
];

interface NotificacaoEnviada {
  id: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  imagem_url: string | null;
  total_enviados: number;
  total_sucesso: number;
  total_falha: number;
  total_abertos: number;
  created_at: string;
}

interface PushTemplate {
  id: string;
  titulo: string;
  mensagem: string;
  cor: string | null;
  icone_url: string | null;
  imagem_url: string | null;
  link: string | null;
  created_at: string;
}

interface PushAgendado {
  id: string;
  titulo: string;
  mensagem: string;
  cor: string | null;
  icone_url: string | null;
  imagem_url: string | null;
  link: string | null;
  agendar_para: string;
  status: string;
  resultado: any;
  created_at: string;
}

interface DeviceStats {
  dispositivos: {
    total: number;
    ativos: number;
    inativos: number;
    plataformas: { web: number; android: number; ios: number; outro: number };
  };
  ultimosEnvios: any[];
}

const AdminNotificacoesPush = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [link, setLink] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [corDestaque, setCorDestaque] = useState("#7C3AED");
  const [iconeUrl, setIconeUrl] = useState("");
  const [enviando, setEnviando] = useState(false);
  
  const [modoEnvio, setModoEnvio] = useState<'agora' | 'agendar'>('agora');
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [horaAgendamento, setHoraAgendamento] = useState("");
  
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [historico, setHistorico] = useState<NotificacaoEnviada[]>([]);
  const [templates, setTemplates] = useState<PushTemplate[]>([]);
  const [agendados, setAgendados] = useState<PushAgendado[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    
    try {
      const [
        { data: historicoData },
        { data: templatesData },
        { data: agendadosData },
        statsResponse,
      ] = await Promise.all([
        supabase.from('notificacoes_push_enviadas').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('push_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('push_agendados').select('*').order('agendar_para', { ascending: false }).limit(30),
        supabase.functions.invoke('fcm-device-stats', { body: null }),
      ]);
      
      setHistorico((historicoData as NotificacaoEnviada[]) || []);
      setTemplates((templatesData as PushTemplate[]) || []);
      setAgendados((agendadosData as PushAgendado[]) || []);
      
      if (statsResponse.data && !statsResponse.error) {
        setDeviceStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  const enviarOuAgendar = async () => {
    if (!titulo.trim() || !mensagem.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha o título e a mensagem", variant: "destructive" });
      return;
    }

    if (modoEnvio === 'agendar') {
      if (!dataAgendamento || !horaAgendamento) {
        toast({ title: "Data/hora obrigatórios", description: "Preencha a data e hora do agendamento", variant: "destructive" });
        return;
      }
      await agendarNotificacao();
    } else {
      await enviarNotificacao();
    }
  };

  const enviarNotificacao = async () => {
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('enviar-push-fcm', {
        body: {
          titulo: titulo.trim(),
          mensagem: mensagem.trim(),
          link: link.trim() || undefined,
          imagem_url: imagemUrl.trim() || undefined,
          cor: corDestaque,
          icone_url: iconeUrl.trim() || undefined
        }
      });
      
      if (error) throw error;
      
      const desc = data.topicSuccess 
        ? `Broadcast ✅ | Tokens: ${data.tokensSucesso}/${data.tokensTotal}`
        : `Broadcast ❌ | Tokens: ${data.tokensSucesso}/${data.tokensTotal}`;
      
      toast({ title: "Notificação enviada!", description: desc });
      limparFormulario();
      carregarDados();
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message || "Tente novamente", variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  const agendarNotificacao = async () => {
    setEnviando(true);
    try {
      const agendarPara = new Date(`${dataAgendamento}T${horaAgendamento}:00`).toISOString();
      
      const { error } = await supabase.from('push_agendados').insert({
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        link: link.trim() || null,
        imagem_url: imagemUrl.trim() || null,
        cor: corDestaque,
        icone_url: iconeUrl.trim() || null,
        agendar_para: agendarPara,
        status: 'pendente',
      });
      
      if (error) throw error;
      
      toast({ title: "Push agendado!", description: `Será enviado em ${formatarData(agendarPara)}` });
      limparFormulario();
      carregarDados();
    } catch (error: any) {
      toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  const cancelarAgendado = async (id: string) => {
    const { error } = await supabase.from('push_agendados').update({ status: 'cancelado' }).eq('id', id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Agendamento cancelado" });
      carregarDados();
    }
  };

  const salvarTemplate = async () => {
    if (!titulo.trim() || !mensagem.trim()) {
      toast({ title: "Preencha título e mensagem", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase.from('push_templates').insert({
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      cor: corDestaque,
      icone_url: iconeUrl.trim() || null,
      imagem_url: imagemUrl.trim() || null,
      link: link.trim() || null,
    });
    
    if (error) {
      toast({ title: "Erro ao salvar template", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template salvo!" });
      carregarDados();
    }
  };

  const usarTemplate = (template: PushTemplate) => {
    setTitulo(template.titulo);
    setMensagem(template.mensagem);
    setCorDestaque(template.cor || "#7C3AED");
    setIconeUrl(template.icone_url || "");
    setImagemUrl(template.imagem_url || "");
    setLink(template.link || "");
    toast({ title: "Template aplicado!" });
  };

  const excluirTemplate = async (id: string) => {
    const { error } = await supabase.from('push_templates').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template excluído" });
      carregarDados();
    }
  };

  const limparFormulario = () => {
    setTitulo("");
    setMensagem("");
    setLink("");
    setImagemUrl("");
    setIconeUrl("");
    setDataAgendamento("");
    setHoraAgendamento("");
    setModoEnvio('agora');
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'text-yellow-600 bg-yellow-100';
      case 'enviando': return 'text-blue-600 bg-blue-100';
      case 'enviado': return 'text-green-600 bg-green-100';
      case 'cancelado': return 'text-muted-foreground bg-muted';
      case 'erro': return 'text-red-600 bg-red-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const stats = deviceStats?.dispositivos;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Notificações Push
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Envie ou agende notificações push
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={carregarDados} disabled={carregando}>
            <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <TabletSmartphone className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.ativos ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">Dispositivos ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.plataformas.android ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">Android</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.plataformas.ios ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">iOS</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.plataformas.web ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">Web</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Envio duplo:</strong> broadcast via tópico "all" + tokens individuais do banco. 
                O total do Firebase Console (~9.000) inclui dispositivos que ainda não abriram o app após a atualização.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Templates rápidos */}
        {templates.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates Salvos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {templates.map((t) => (
                  <div key={t.id} className="flex-shrink-0 border rounded-lg p-3 min-w-[180px] max-w-[220px] space-y-2">
                    <p className="font-medium text-sm truncate">{t.titulo}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.mensagem}</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => usarTemplate(t)}>
                        Usar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs text-destructive px-2" onClick={() => excluirTemplate(t.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nova Notificação</CardTitle>
            <CardDescription>
              Envie agora ou agende para um horário específico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" placeholder="Ex: Nova funcionalidade disponível!" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={50} />
              <p className="text-xs text-muted-foreground text-right">{titulo.length}/50</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem *</Label>
              <Textarea id="mensagem" placeholder="Escreva a mensagem que será exibida..." value={mensagem} onChange={(e) => setMensagem(e.target.value)} maxLength={200} rows={3} />
              <p className="text-xs text-muted-foreground text-right">{mensagem.length}/200</p>
            </div>

            {/* Cor de destaque */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Palette className="h-4 w-4" />Cor de destaque</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {CORES_PREDEFINIDAS.map((cor) => (
                  <button key={cor.hex} onClick={() => setCorDestaque(cor.hex)}
                    className={cn("w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center border-2 shadow-sm",
                      corDestaque === cor.hex ? "border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: cor.hex }}
                    title={`${cor.nome} - ${cor.uso}`}
                  >
                    {corDestaque === cor.hex && <CheckCircle className="w-5 h-5 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icone" className="flex items-center gap-2"><Smartphone className="h-4 w-4" />URL do Ícone (opcional)</Label>
              <Input id="icone" placeholder="https://exemplo.com/icone.png" value={iconeUrl} onChange={(e) => setIconeUrl(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link" className="flex items-center gap-2"><LinkIcon className="h-4 w-4" />Link (opcional)</Label>
              <Input id="link" placeholder="Ex: /novidades ou https://..." value={link} onChange={(e) => setLink(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagem" className="flex items-center gap-2"><Image className="h-4 w-4" />Imagem (opcional)</Label>
              <Input id="imagem" placeholder="https://exemplo.com/imagem.jpg" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} />
            </div>

            {/* Preview */}
            {(titulo.trim() || mensagem.trim()) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Smartphone className="h-4 w-4" />Preview</Label>
                <div className="rounded-xl p-3 border shadow-sm flex items-start gap-3" style={{ borderLeftWidth: 4, borderLeftColor: corDestaque }}>
                  <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: corDestaque + '20' }}>
                    {iconeUrl ? (
                      <img src={iconeUrl} alt="Ícone" className="w-8 h-8 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.webp'; }} />
                    ) : (
                      <img src="/logo.webp" alt="App" className="w-8 h-8 rounded object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: corDestaque }}>{titulo || "Título"}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{mensagem || "Mensagem..."}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">agora</p>
                  </div>
                  {imagemUrl && <img src={imagemUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                </div>
              </div>
            )}

            {/* Modo de envio */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex gap-2">
                <Button variant={modoEnvio === 'agora' ? 'default' : 'outline'} size="sm" onClick={() => setModoEnvio('agora')} className="flex-1">
                  <Send className="h-4 w-4 mr-1" /> Enviar agora
                </Button>
                <Button variant={modoEnvio === 'agendar' ? 'default' : 'outline'} size="sm" onClick={() => setModoEnvio('agendar')} className="flex-1">
                  <Clock className="h-4 w-4 mr-1" /> Agendar
                </Button>
              </div>

              {modoEnvio === 'agendar' && (
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Data</Label>
                    <Input type="date" value={dataAgendamento} onChange={(e) => setDataAgendamento(e.target.value)} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Hora</Label>
                    <Input type="time" value={horaAgendamento} onChange={(e) => setHoraAgendamento(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button onClick={enviarOuAgendar} disabled={enviando || !titulo.trim() || !mensagem.trim()} className="flex-1" size="lg">
                {enviando ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</>
                ) : modoEnvio === 'agendar' ? (
                  <><Calendar className="h-4 w-4 mr-2" />Agendar envio</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Enviar broadcast</>
                )}
              </Button>
              <Button variant="outline" size="lg" onClick={salvarTemplate} title="Salvar como template">
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Agendados + Histórico */}
        <Tabs defaultValue="agendados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agendados" className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> Agendados ({agendados.filter(a => a.status === 'pendente').length})
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-1">
              <Bell className="h-4 w-4" /> Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agendados">
            <Card>
              <CardContent className="pt-4">
                {agendados.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum push agendado</p>
                ) : (
                  <div className="space-y-3">
                    {agendados.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{item.titulo}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{item.mensagem}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColor(item.status))}>
                              {item.status}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatarData(item.agendar_para)}
                            </span>
                          </div>
                        </div>
                        {item.status === 'pendente' && (
                          <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => cancelarAgendado(item.id)}>
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        {item.status === 'enviado' && item.resultado && (
                          <div className="flex items-center gap-1 text-sm shrink-0">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              {item.resultado.sucesso || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card>
              <CardContent className="pt-4">
                {carregando ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : historico.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma notificação enviada ainda</p>
                ) : (
                  <div className="space-y-3">
                    {historico.map((notif) => (
                      <div key={notif.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{notif.titulo}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{notif.mensagem}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatarData(notif.created_at)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-sm shrink-0">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">{notif.total_sucesso} enviados</span>
                          </span>
                          <span className="flex items-center gap-1 text-blue-600">
                            <Eye className="h-4 w-4" />
                            <span className="text-xs">{notif.total_abertos || 0} abertos</span>
                          </span>
                          {notif.total_falha > 0 && (
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs">{notif.total_falha} falhas</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminNotificacoesPush;
