import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Flame, Clock, TrendingUp, Crown, Users, Zap } from 'lucide-react';
import {
  useCadastrosPorDiaSemana,
  useEngajamentoGratuitos,
  useAreasPremium,
  useHorariosPico,
  useRetencao,
} from '@/hooks/useAdminEngajamento';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const AdminEngajamentoTab = () => {
  const { data: cadastrosSemana, isLoading: loadingCadastros } = useCadastrosPorDiaSemana();
  const { data: gratuitosEngajados, isLoading: loadingGratuitos } = useEngajamentoGratuitos(30);
  const { data: areasPremium, isLoading: loadingAreas } = useAreasPremium(30);
  const { data: horarios, isLoading: loadingHorarios } = useHorariosPico(7);
  const { data: retencao, isLoading: loadingRetencao } = useRetencao();

  return (
    <div className="space-y-6">
      {/* Cards de resumo rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-sky-500/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-[11px] text-muted-foreground">Retenção D1</p>
            <p className="text-2xl font-bold text-sky-500">
              {loadingRetencao ? '...' : `${retencao?.d1 || 0}%`}
            </p>
            <p className="text-[10px] text-muted-foreground">voltam após 1 dia</p>
          </CardContent>
        </Card>
        <Card className="border-violet-500/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-[11px] text-muted-foreground">Retenção D7</p>
            <p className="text-2xl font-bold text-violet-500">
              {loadingRetencao ? '...' : `${retencao?.d7 || 0}%`}
            </p>
            <p className="text-[10px] text-muted-foreground">voltam após 7 dias</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-[11px] text-muted-foreground">Gratuitos Engajados</p>
            <p className="text-2xl font-bold text-emerald-500">
              {loadingGratuitos ? '...' : gratuitosEngajados?.length || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">top 20 ativos</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-[11px] text-muted-foreground">Áreas Premium</p>
            <p className="text-2xl font-bold text-amber-500">
              {loadingAreas ? '...' : areasPremium?.length || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">áreas rastreadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Cadastros por dia da semana */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Cadastros por Dia da Semana
            <Badge variant="outline" className="text-[10px]">Semana atual vs anterior</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCadastros ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cadastrosSemana} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="dia" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Legend />
                <Bar dataKey="atual" name="Esta semana" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="anterior" name="Semana anterior" fill="hsl(var(--muted-foreground))" opacity={0.4} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Horários de pico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horários de Pico (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHorarios ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={horarios} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="hora"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  interval={2}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="views" name="Acessos" fill="hsl(142 76% 36%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gratuitos mais engajados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Gratuitos Mais Engajados
              </div>
              <Badge variant="secondary">{gratuitosEngajados?.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingGratuitos ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : gratuitosEngajados && gratuitosEngajados.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {gratuitosEngajados.map((u, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                    return (
                      <div key={u.user_id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-8 text-right shrink-0">{medal || `#${i + 1}`}</span>
                            <div className="min-w-0">
                              <span className="font-medium text-sm block truncate">{u.nome || 'Sem nome'}</span>
                              <span className="text-[10px] text-muted-foreground truncate block">{u.email}</span>
                            </div>
                          </div>
                          <Badge className="text-xs shrink-0 ml-2">{u.total_views} views</Badge>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <Badge variant="outline">{u.dias_ativos}d ativos</Badge>
                          {u.streak_atual > 0 && (
                            <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                              🔥 {u.streak_atual}d seguidos
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
            )}
          </CardContent>
        </Card>

        {/* Áreas mais acessadas por premium */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Áreas Premium
              </div>
              <Badge variant="secondary">{areasPremium?.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAreas ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : areasPremium && areasPremium.length > 0 ? (
              <div className="space-y-3">
                {areasPremium.map((item, i) => {
                  const maxViews = areasPremium[0]?.views || 1;
                  const pct = (item.views / maxViews) * 100;
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                  return (
                    <div key={item.area} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-right">{medal || `#${i + 1}`}</span>
                          <span className="font-medium">{item.area}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{item.percentual.toFixed(1)}%</span>
                          <Badge variant="secondary">{item.views}</Badge>
                        </div>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminEngajamentoTab;
