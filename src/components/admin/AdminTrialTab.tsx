import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Monitor, Calendar, Flame, Search, AlertTriangle } from 'lucide-react';
import { useAdminTrialUsers, type TrialSortBy, type TrialUserItem } from '@/hooks/useAdminTrialUsers';
import AdminTrialManageDrawer from './AdminTrialManageDrawer';

const SORT_OPTIONS: { value: TrialSortBy; label: string }[] = [
  { value: 'tempo_restante', label: 'Tempo restante' },
  { value: 'tempo_tela', label: 'Tempo de tela' },
  { value: 'dias_ativos', label: 'Dias ativos' },
  { value: 'mais_recente', label: 'Mais recente' },
];

type StatusFilter = 'todos' | 'ativo' | 'urgente' | 'expirado';

const AdminTrialTab = () => {
  const [sortBy, setSortBy] = useState<TrialSortBy>('tempo_restante');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [selectedUser, setSelectedUser] = useState<TrialUserItem | null>(null);
  const { data: users, isLoading } = useAdminTrialUsers(sortBy);

  const filteredUsers = useMemo(() => {
    if (!users) return users;
    let list = users;
    if (statusFilter !== 'todos') {
      list = list.filter(u => u.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, search, statusFilter]);

  const statusBadge = (status: 'ativo' | 'urgente' | 'expirado', desativado?: boolean) => {
    if (desativado) return <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px]">Desativado</Badge>;
    switch (status) {
      case 'expirado':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px]">Expirado</Badge>;
      case 'urgente':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 text-[10px]">Urgente</Badge>;
      case 'ativo':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">Ativo</Badge>;
    }
  };

  const totalAtivos = users?.filter(u => u.status === 'ativo').length ?? 0;
  const totalUrgentes = users?.filter(u => u.status === 'urgente').length ?? 0;
  const totalExpirados = users?.filter(u => u.status === 'expirado').length ?? 0;
  const displayUsers = filteredUsers;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'ativo' ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'hover:border-emerald-500/40'}`}
          onClick={() => setStatusFilter(statusFilter === 'ativo' ? 'todos' : 'ativo')}
        >
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-[11px] text-muted-foreground">Ativos</p>
            <p className="text-xl font-bold text-emerald-500">{isLoading ? '...' : totalAtivos}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'urgente' ? 'border-orange-500 ring-1 ring-orange-500/30' : 'hover:border-orange-500/40'}`}
          onClick={() => setStatusFilter(statusFilter === 'urgente' ? 'todos' : 'urgente')}
        >
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-[11px] text-muted-foreground">Urgentes</p>
            <p className="text-xl font-bold text-orange-500">{isLoading ? '...' : totalUrgentes}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'expirado' ? 'border-red-500 ring-1 ring-red-500/30' : 'hover:border-red-500/40'}`}
          onClick={() => setStatusFilter(statusFilter === 'expirado' ? 'todos' : 'expirado')}
        >
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-[11px] text-muted-foreground">Expirados</p>
            <p className="text-xl font-bold text-red-500">{isLoading ? '...' : totalExpirados}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Sort buttons */}
      <div className="flex gap-1 flex-wrap">
        {SORT_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            variant={sortBy === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy(opt.value)}
            className="text-xs h-7 px-3"
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Carregando...</div>
      ) : !displayUsers?.length ? (
        <div className="text-center text-muted-foreground py-8">
          {search ? 'Nenhum resultado encontrado' : 'Nenhum usuário em trial'}
        </div>
      ) : (
        <div className="space-y-2">
          {displayUsers.map(user => (
            <Card
              key={user.user_id}
              className="border-border cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setSelectedUser(user)}
            >
              <CardContent className="p-3 space-y-2">
                {/* Row 1: Name + status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-medium text-sm truncate block">
                      {user.nome || user.email}
                    </span>
                    {user.nome && (
                      <span className="text-xs text-muted-foreground truncate block">{user.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {user.ip_duplicado && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-[10px] gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        IPdup
                      </Badge>
                    )}
                    {statusBadge(user.status, user.desativado)}
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {user.tempo_restante_label}
                    </span>
                  </div>
                </div>

                {/* Row 2: IP + Metrics */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {user.ip_cadastro && (
                    <span className="font-mono text-[10px] opacity-70">{user.ip_cadastro}</span>
                  )}
                  <div className="flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    <span>{user.tempo_tela_label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{user.dias_ativos} {user.dias_ativos === 1 ? 'dia' : 'dias'}</span>
                  </div>
                </div>

                {/* Row 3: Top functions */}
                {user.top_funcoes.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Flame className="h-3 w-3 text-muted-foreground shrink-0" />
                    {user.top_funcoes.map(f => (
                      <Badge key={f} variant="outline" className="text-[10px] px-1.5 py-0">
                        {f}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Management drawer */}
      <AdminTrialManageDrawer
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

export default AdminTrialTab;
