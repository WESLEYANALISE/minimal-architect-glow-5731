import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Clock, XCircle, DollarSign, Search, Eye, MousePointer, TrendingUp, RefreshCw, Sparkles } from 'lucide-react';
import { useAssinaturasAdmin } from '@/hooks/useAdminEngajamento';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AdminAssinaturasTab = () => {
  const { subscriptions, loadingSubscriptions, analytics, loadingAnalytics } = useAssinaturasAdmin();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroPlano, setFiltroPlano] = useState('todos');
  const [filtroMetodo, setFiltroMetodo] = useState('todos');

  // Conversões via modal de trial expirado
  const { data: conversoes } = useQuery({
    queryKey: ['admin-conversoes-trial-modal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan_type, amount, status, created_at, conversion_source')
        .eq('conversion_source', 'trial_expired_modal')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Emails com assinatura ativa (para excluir de pendentes/canceladas)
  const activeEmails = new Set(
    subscriptions.filter(s => s.status === 'authorized').map(s => s.email?.toLowerCase()).filter(Boolean)
  );

  const stats = {
    ativas: activeEmails.size,
    pendentes: new Set(
      subscriptions
        .filter(s => s.status === 'pending' && s.email && !activeEmails.has(s.email.toLowerCase()))
        .map(s => s.email!.toLowerCase())
    ).size,
    canceladas: new Set(
      subscriptions
        .filter(s => (s.status === 'cancelled' || s.status === 'rejected') && s.email && !activeEmails.has(s.email.toLowerCase()))
        .map(s => s.email!.toLowerCase())
    ).size,
    receita: subscriptions.filter(s => s.status === 'authorized').reduce((acc, s) => acc + (s.amount || 0), 0),
  };

  // Deduplicar tabela: para cada email, mostrar apenas a assinatura mais relevante
  const deduplicatedSubs = (() => {
    const emailMap = new Map<string, typeof subscriptions[0]>();
    subscriptions.forEach(sub => {
      const key = sub.email?.toLowerCase() || sub.id;
      const existing = emailMap.get(key);
      if (!existing) {
        emailMap.set(key, sub);
      } else {
        // Priorizar authorized, depois mais recente
        if (sub.status === 'authorized' && existing.status !== 'authorized') {
          emailMap.set(key, sub);
        } else if (sub.status === existing.status && new Date(sub.created_at) > new Date(existing.created_at)) {
          emailMap.set(key, sub);
        }
      }
    });
    return Array.from(emailMap.values());
  })();

  const filtered = deduplicatedSubs.filter(sub => {
    const matchBusca = !busca || sub.nome?.toLowerCase().includes(busca.toLowerCase()) || sub.email?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || sub.status === filtroStatus;
    const matchPlano = filtroPlano === 'todos' || sub.plan_type === filtroPlano;
    const matchMetodo = filtroMetodo === 'todos' || sub.payment_method === filtroMetodo;
    return matchBusca && matchStatus && matchPlano && matchMetodo;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      authorized: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Ativo' },
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pendente' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Cancelado' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejeitado' },
    };
    const { bg, text, label } = config[status] || { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{label}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-emerald-500/20">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-emerald-500" /> Ativas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold text-emerald-400">{stats.ativas}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold text-amber-400">{stats.pendentes}</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-500" /> Canceladas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold text-red-400">{stats.canceladas}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" /> Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold text-primary">R$ {stats.receita.toFixed(2).replace('.', ',')}</p>
          </CardContent>
        </Card>
        <Card className="border-violet-500/20">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" /> Via Modal Trial
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold text-violet-400">{conversoes?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Assinaturas após trial expirado</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Cliques */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-sky-500" /> Ver Mais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold text-sky-400">{analytics.verMais}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-violet-500" /> Abrir Modal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold text-violet-400">{analytics.abrirModal}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-500" /> Plano Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold text-cyan-400">{analytics.mensal}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" /> Plano Anual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold text-amber-400">{analytics.vitalicio}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-3">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou email..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full md:w-40 text-xs md:text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            <SelectItem value="authorized">Ativo</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroPlano} onValueChange={setFiltroPlano}>
          <SelectTrigger className="w-full md:w-40 text-xs md:text-sm"><SelectValue placeholder="Plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Planos</SelectItem>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="anual">Anual</SelectItem>
            <SelectItem value="essencial">Essencial (antigo)</SelectItem>
            <SelectItem value="pro">Pro (antigo)</SelectItem>
            <SelectItem value="vitalicio">Vitalício (antigo)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
          <SelectTrigger className="w-full md:w-40 text-xs md:text-sm"><SelectValue placeholder="Método" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="card">Cartão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loadingSubscriptions ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhuma assinatura encontrada</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="hidden md:table-cell">Método</TableHead>
                      <TableHead className="hidden sm:table-cell">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Data</TableHead>
                      <TableHead className="hidden lg:table-cell">Expira</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium text-xs sm:text-sm max-w-[100px] sm:max-w-none truncate">{sub.nome || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs truncate max-w-[160px]">{sub.email || '-'}</TableCell>
                        <TableCell className="capitalize text-xs sm:text-sm">{sub.plan_type}</TableCell>
                        <TableCell className="hidden md:table-cell uppercase text-xs">{sub.payment_method || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">R$ {(sub.amount || 0).toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {format(new Date(sub.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {sub.expiration_date ? format(new Date(sub.expiration_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAssinaturasTab;
