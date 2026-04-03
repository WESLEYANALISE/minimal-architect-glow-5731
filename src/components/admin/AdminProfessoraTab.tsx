import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Users, TrendingUp, Search, ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import AdminProfessoraChat from './AdminProfessoraChat';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useHistoricoProfessora,
  useTopUsuariosProfessora,
  useEstatisticasProfessora,
  usePerguntasFrequentes,
} from '@/hooks/useAdminProfessoraStats';

const AdminProfessoraTab = () => {
  const [page, setPage] = useState(0);
  const [filtro, setFiltro] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('');
  const [showChat, setShowChat] = useState(false);

  const { data: stats, isLoading: loadingStats } = useEstatisticasProfessora();
  const { data: topUsuarios, isLoading: loadingTop } = useTopUsuariosProfessora();
  const { data: historico, isLoading: loadingHistorico } = useHistoricoProfessora(page, 30, filtroAtivo);
  const { data: perguntas, isLoading: loadingPerguntas } = usePerguntasFrequentes();

  const handleFiltrar = () => {
    setFiltroAtivo(filtro);
    setPage(0);
  };

  const totalPages = historico ? Math.ceil(historico.count / 30) : 0;

  return (
    <div className="space-y-6">
      {/* Botão Chat Estratégico */}
      <Button onClick={() => setShowChat(true)} className="w-full gap-2" size="lg">
        <Bot className="w-5 h-5" />
        Chat Estratégico com a Professora
      </Button>

      <AdminProfessoraChat open={showChat} onClose={() => setShowChat(false)} />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">Total de Mensagens</p>
                <p className="text-2xl font-bold text-primary">
                  {loadingStats ? '...' : stats?.totalMensagens?.toLocaleString('pt-BR') || 0}
                </p>
              </div>
              <MessageSquare className="h-5 w-5 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">Usuários Únicos</p>
                <p className="text-2xl font-bold text-violet-500">
                  {loadingStats ? '...' : stats?.usuariosUnicos || 0}
                </p>
              </div>
              <Users className="h-5 w-5 text-violet-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">Média Diária</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {loadingStats ? '...' : stats?.mediaDiaria || 0}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking + Perguntas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Usuários */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">🏆 Top Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {loadingTop ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <div className="space-y-2">
                  {topUsuarios?.map((u, i) => (
                    <div key={u.user_id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold w-5 text-center">{i + 1}º</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.user_name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.user_email || '—'}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0 ml-2">
                        {u.total} msgs
                      </Badge>
                    </div>
                  ))}
                  {(!topUsuarios || topUsuarios.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado ainda</p>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Perguntas Frequentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">❓ Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {loadingPerguntas ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <div className="space-y-2">
                  {perguntas?.map((p, i) => (
                    <div key={i} className="p-2 rounded-lg bg-secondary/30 border border-border">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs leading-relaxed line-clamp-2">{p.pergunta}</p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {p.count}x
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!perguntas || perguntas.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado ainda</p>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Conversas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">💬 Conversas Recentes</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filtrar por nome ou email..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFiltrar()}
                className="h-7 text-xs w-48"
              />
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleFiltrar}>
                <Search className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistorico ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-[100px]">Usuário</TableHead>
                      <TableHead className="text-xs w-[60px]">Tipo</TableHead>
                      <TableHead className="text-xs">Mensagem</TableHead>
                      <TableHead className="text-xs w-[60px]">Modo</TableHead>
                      <TableHead className="text-xs w-[90px]">Quando</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historico?.data.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell className="text-xs truncate max-w-[100px]">
                          {msg.user_name || 'Anônimo'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={msg.role === 'user' ? 'default' : 'secondary'} className="text-[10px]">
                            {msg.role === 'user' ? '👤' : '🤖'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <p className="line-clamp-2 max-w-[300px]">{msg.content}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {msg.mode || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!historico?.data || historico.data.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                          Nenhuma conversa registrada ainda
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfessoraTab;
