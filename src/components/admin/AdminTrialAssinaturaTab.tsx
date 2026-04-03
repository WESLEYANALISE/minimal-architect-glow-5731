import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Users, RotateCcw, CreditCard, UserX, TrendingUp, Search, Clock } from 'lucide-react';
import { useAdminTrialAssinatura, type TrialAssinaturaFilter } from '@/hooks/useAdminTrialAssinatura';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FILTERS: { value: TrialAssinaturaFilter; label: string; icon: any }[] = [
  { value: 'todos', label: 'Todos', icon: Users },
  { value: 'voltaram', label: 'Voltaram', icon: RotateCcw },
  { value: 'assinaram', label: 'Assinaram', icon: CreditCard },
  { value: 'nunca_voltaram', label: 'Perdidos', icon: UserX },
];

const AdminTrialAssinaturaTab = () => {
  const { data, isLoading } = useAdminTrialAssinatura();
  const [filter, setFilter] = useState<TrialAssinaturaFilter>('todos');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.users;
    if (filter === 'voltaram') list = list.filter(u => u.voltou && !u.assinou);
    else if (filter === 'assinaram') list = list.filter(u => u.assinou);
    else if (filter === 'nunca_voltaram') list = list.filter(u => !u.voltou && !u.assinou);
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => 
        (u.nome?.toLowerCase().includes(q)) || 
        (u.email?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [data, filter, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const m = data?.metrics;

  return (
    <div className="space-y-4">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[11px] text-muted-foreground">Trial Expirado</p>
            <p className="text-2xl font-bold text-red-400">{m?.total_expirados ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[11px] text-muted-foreground">Voltaram</p>
            <p className="text-2xl font-bold text-amber-400">{m?.voltaram ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[11px] text-muted-foreground">Assinaram</p>
            <p className="text-2xl font-bold text-emerald-400">{m?.assinaram ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[11px] text-muted-foreground">Taxa Conversão</p>
            <p className="text-2xl font-bold text-primary">{m?.taxa_conversao ?? 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
            className="text-xs h-8"
          >
            <f.icon className="h-3 w-3 mr-1" />
            {f.label}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* User List */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{filtered.length} usuários</p>
        {filtered.slice(0, 50).map(user => (
          <Card key={user.user_id} className="border-border/50">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">{user.nome || user.email}</span>
                <div className="flex gap-1">
                  {user.assinou && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">
                      Assinou
                    </Badge>
                  )}
                  {user.voltou && !user.assinou && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px]">
                      Voltou
                    </Badge>
                  )}
                  {!user.voltou && !user.assinou && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px]">
                      Perdido
                    </Badge>
                  )}
                </div>
              </div>
              
              {user.nome && (
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              )}
              
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expirou {formatDistanceToNow(user.trial_end, { addSuffix: true, locale: ptBR })}
                </span>
                {user.ultima_visita && (
                  <span>
                    Última visita {formatDistanceToNow(new Date(user.ultima_visita), { addSuffix: true, locale: ptBR })}
                  </span>
                )}
              </div>

              {user.top_funcoes.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {user.top_funcoes.map(f => (
                    <Badge key={f} variant="outline" className="text-[10px] px-1.5 py-0">
                      {f}
                    </Badge>
                  ))}
                </div>
              )}

              {user.assinou && user.plano && (
                <p className="text-[11px] text-emerald-400">
                  Plano: {user.plano}
                  {user.data_assinatura && (
                    <span className="text-muted-foreground ml-1">
                      · {formatDistanceToNow(new Date(user.data_assinatura), { addSuffix: true, locale: ptBR })}
                    </span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length > 50 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Mostrando 50 de {filtered.length} usuários
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminTrialAssinaturaTab;
