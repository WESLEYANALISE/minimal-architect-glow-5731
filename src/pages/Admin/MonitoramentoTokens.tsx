import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, DollarSign, Zap, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTokenUsageStats } from "@/hooks/useTokenUsageStats";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CORES_PIE = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const formatBRL = (v: number) => `R$ ${v.toFixed(4)}`;
const formatTokens = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v);

const MonitoramentoTokens = () => {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState("7d");
  const stats = useTokenUsageStats(periodo);

  const resumo = stats.resumo.data;
  const isLoading = stats.resumo.isLoading;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Monitoramento de Tokens
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Consumo de APIs de IA e custos estimados</p>
          </div>
        </div>

        {/* Filtro de período */}
        <Tabs value={periodo} onValueChange={setPeriodo}>
          <TabsList>
            <TabsTrigger value="hoje">Hoje</TabsTrigger>
            <TabsTrigger value="7d">7 dias</TabsTrigger>
            <TabsTrigger value="30d">30 dias</TabsTrigger>
            <TabsTrigger value="90d">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Cards Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3 w-3" /> Custo Estimado
              </div>
              <p className="text-lg font-bold text-foreground">
                {isLoading ? '...' : formatBRL(resumo?.custoTotal || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Zap className="h-3 w-3" /> Tokens
              </div>
              <p className="text-lg font-bold text-foreground">
                {isLoading ? '...' : formatTokens(resumo?.totalTokens || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3 w-3" /> Chamadas
              </div>
              <p className="text-lg font-bold text-foreground">
                {isLoading ? '...' : resumo?.totalChamadas || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <AlertTriangle className="h-3 w-3" /> Erros
              </div>
              <p className="text-lg font-bold text-foreground">
                {isLoading ? '...' : resumo?.erros || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Consumo Diário */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Consumo Diário (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.consumoDiario.data || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} labelFormatter={l => `Data: ${l}`} />
                  <Area type="monotone" dataKey="custo" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Top Functions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Edge Functions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Função</TableHead>
                    <TableHead className="text-xs text-right">Chamadas</TableHead>
                    <TableHead className="text-xs text-right">Tokens</TableHead>
                    <TableHead className="text-xs text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats.topFunctions.data || []).slice(0, 10).map((fn) => (
                    <TableRow key={fn.edge_function}>
                      <TableCell className="text-xs font-mono">{fn.edge_function}</TableCell>
                      <TableCell className="text-xs text-right">{fn.chamadas}</TableCell>
                      <TableCell className="text-xs text-right">{formatTokens(fn.tokens)}</TableCell>
                      <TableCell className="text-xs text-right">{formatBRL(fn.custo)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Usuários */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Usuário</TableHead>
                    <TableHead className="text-xs text-right">Chamadas</TableHead>
                    <TableHead className="text-xs text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats.topUsers.data || []).slice(0, 10).map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="text-xs truncate max-w-[150px]">{u.email}</TableCell>
                      <TableCell className="text-xs text-right">{u.chamadas}</TableCell>
                      <TableCell className="text-xs text-right">{formatBRL(u.custo)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Por Tipo de Conteúdo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Tipo de Conteúdo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.porTipo.data || []} dataKey="custo" nameKey="tipo" cx="50%" cy="50%" outerRadius={70} label={({ tipo, percent }) => `${tipo} ${(percent * 100).toFixed(0)}%`}>
                      {(stats.porTipo.data || []).map((_, i) => (
                        <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatBRL(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Por Modelo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Modelo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Modelo</TableHead>
                    <TableHead className="text-xs text-right">Chamadas</TableHead>
                    <TableHead className="text-xs text-right">Tokens</TableHead>
                    <TableHead className="text-xs text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats.porModelo.data || []).map((m) => (
                    <TableRow key={m.model}>
                      <TableCell className="text-xs font-mono">{m.model}</TableCell>
                      <TableCell className="text-xs text-right">{m.chamadas}</TableCell>
                      <TableCell className="text-xs text-right">{formatTokens(m.tokens)}</TableCell>
                      <TableCell className="text-xs text-right">{formatBRL(m.custo)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Por Chave API */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição por Chave API</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Chave</TableHead>
                  <TableHead className="text-xs text-right">Chamadas</TableHead>
                  <TableHead className="text-xs text-right">Tokens</TableHead>
                  <TableHead className="text-xs text-right">Custo</TableHead>
                  <TableHead className="text-xs text-right">Erros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats.porChave.data || []).map((c) => (
                  <TableRow key={c.chave}>
                    <TableCell className="text-xs font-mono">{c.chave}</TableCell>
                    <TableCell className="text-xs text-right">{c.chamadas}</TableCell>
                    <TableCell className="text-xs text-right">{formatTokens(c.tokens)}</TableCell>
                    <TableCell className="text-xs text-right">{formatBRL(c.custo)}</TableCell>
                    <TableCell className="text-xs text-right">{c.erros}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Log Detalhado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Log Detalhado (últimos 200)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Função</TableHead>
                  <TableHead className="text-xs">Modelo</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs text-right">In</TableHead>
                  <TableHead className="text-xs text-right">Out</TableHead>
                  <TableHead className="text-xs text-right">Custo</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats.logDetalhado.data || []).map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{log.edge_function}</TableCell>
                    <TableCell className="text-xs">{log.model || '-'}</TableCell>
                    <TableCell className="text-xs">{log.tipo_conteudo || '-'}</TableCell>
                    <TableCell className="text-xs text-right">{formatTokens(log.input_tokens || 0)}</TableCell>
                    <TableCell className="text-xs text-right">{formatTokens(log.output_tokens || 0)}</TableCell>
                    <TableCell className="text-xs text-right">{formatBRL(Number(log.custo_estimado_brl || 0))}</TableCell>
                    <TableCell className="text-xs">
                      {log.sucesso ? <span className="text-green-500">✓</span> : <span className="text-red-500">✗</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonitoramentoTokens;
