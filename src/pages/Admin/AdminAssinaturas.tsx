import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Crown, Clock, XCircle, DollarSign, Search, MousePointer, TrendingUp, Eye, Smartphone, Monitor, MapPin, RefreshCw, UserX, CalendarClock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  payment_method: string;
  amount: number;
  status: string;
  created_at: string;
  expiration_date: string | null;
  profiles?: {
    nome: string | null;
    email: string | null;
  } | null;
}

interface PlanAnalytics {
  id: string;
  plan_type: string;
  action: string;
  device: string | null;
  created_at: string;
}

interface ModalView {
  id: string;
  user_id: string | null;
  modal_type: string;
  source_page: string;
  source_feature: string | null;
  device: string | null;
  created_at: string;
  profiles?: {
    nome: string | null;
    email: string | null;
    intencao: string | null;
    created_at: string | null;
  } | null;
}

type TabView = "recentes" | "expirando" | "renovados" | "nao_renovaram";

const TAB_CONFIG: { value: TabView; label: string; icon: any; color: string }[] = [
  { value: "recentes", label: "Recentes", icon: Users, color: "text-emerald-400" },
  { value: "expirando", label: "Expirando", icon: CalendarClock, color: "text-amber-400" },
  { value: "renovados", label: "Renovados", icon: RefreshCw, color: "text-cyan-400" },
  { value: "nao_renovaram", label: "Não Renovaram", icon: UserX, color: "text-red-400" },
];

const AdminAssinaturas = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabView>("recentes");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPlano, setFiltroPlano] = useState<string>("todos");
  const [filtroMetodo, setFiltroMetodo] = useState<string>("todos");
  const [filtroModalPeriodo, setFiltroModalPeriodo] = useState<string>("7");
  const [buscaModal, setBuscaModal] = useState("");

  // Buscar assinaturas com dados do usuário
  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data: subs, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (subsError) throw subsError;

      const userIds = [...new Set((subs || []).map(s => s.user_id).filter(Boolean))];
      let profilesMap: Record<string, { nome: string | null; email: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .in("id", userIds);
        
        (profiles || []).forEach((p) => {
          profilesMap[p.id] = { nome: p.nome, email: p.email };
        });
      }

      return (subs || []).map(sub => ({
        ...sub,
        profiles: profilesMap[sub.user_id] || null,
      })) as Subscription[];
    },
  });

  // Buscar aberturas de modal Premium
  const { data: modalViews = [], isLoading: loadingModalViews } = useQuery({
    queryKey: ["admin-modal-views"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("premium_modal_views")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      const userIds = [...new Set((data || []).map(d => d.user_id).filter(Boolean))] as string[];
      let profilesMap: Record<string, { nome: string | null; email: string | null; intencao: string | null; created_at: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome, email, intencao, created_at")
          .in("id", userIds);

        (profiles || []).forEach((p) => {
          profilesMap[p.id] = { nome: p.nome, email: p.email, intencao: p.intencao, created_at: p.created_at };
        });
      }

      return (data || []).map(mv => ({
        ...mv,
        profiles: mv.user_id ? profilesMap[mv.user_id] || null : null,
      })) as ModalView[];
    },
  });

  // Buscar analytics de cliques
  const { data: analytics = [], isLoading: loadingAnalytics } = useQuery({
    queryKey: ["admin-plan-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_click_analytics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      return (data || []) as PlanAnalytics[];
    },
  });

  // Helpers
  const isActiveAndValid = (s: Subscription) => {
    const activeStatuses = ["authorized", "active", "approved"];
    if (!activeStatuses.includes(s.status)) return false;
    if (s.expiration_date && new Date(s.expiration_date) < new Date()) return false;
    return true;
  };

  const isExpiredSubscriber = (s: Subscription) => {
    const activeStatuses = ["authorized", "active", "approved"];
    if (!activeStatuses.includes(s.status)) return false;
    if (s.expiration_date && new Date(s.expiration_date) < new Date()) return true;
    return false;
  };

  // Tab filtered lists
  const now = new Date();
  const tabLists = useMemo(() => {
    // Recentes: assinaturas ativas, mais recentes primeiro (já ordenado por created_at desc)
    const recentes = subscriptions
      .filter(s => isActiveAndValid(s))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Expirando: ativas que expiram nos próximos 7 dias
    const seteDiasMs = 7 * 86400000;
    const expirando = subscriptions
      .filter(s => {
        if (!isActiveAndValid(s) || !s.expiration_date) return false;
        const exp = new Date(s.expiration_date);
        return exp.getTime() - now.getTime() <= seteDiasMs && exp.getTime() > now.getTime();
      })
      .sort((a, b) => new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime());

    // Renovados: usuários que têm mais de 1 assinatura (recobrança mensal)
    const userSubCount: Record<string, Subscription[]> = {};
    subscriptions.forEach(s => {
      if (!userSubCount[s.user_id]) userSubCount[s.user_id] = [];
      userSubCount[s.user_id].push(s);
    });
    const renovados = subscriptions
      .filter(s => {
        const activeStatuses = ["authorized", "active", "approved"];
        return activeStatuses.includes(s.status) && (userSubCount[s.user_id]?.length || 0) > 1;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Não renovaram: expirados ou cancelled que NÃO têm uma assinatura ativa posterior
    const usersWithActiveSub = new Set(
      subscriptions.filter(isActiveAndValid).map(s => s.user_id)
    );
    const naoRenovaram = subscriptions
      .filter(s => {
        const isExpired = s.status === 'expired' || s.status === 'cancelled' || s.status === 'rejected' || isExpiredSubscriber(s);
        return isExpired && !usersWithActiveSub.has(s.user_id);
      })
      // Deduplicar por user_id (mostrar só a mais recente)
      .filter((s, i, arr) => arr.findIndex(x => x.user_id === s.user_id) === i)
      .sort((a, b) => new Date(b.expiration_date || b.created_at).getTime() - new Date(a.expiration_date || a.created_at).getTime());

    return { recentes, expirando, renovados, naoRenovaram };
  }, [subscriptions]);

  const currentTabList = (() => {
    switch (activeTab) {
      case "recentes": return tabLists.recentes;
      case "expirando": return tabLists.expirando;
      case "renovados": return tabLists.renovados;
      case "nao_renovaram": return tabLists.naoRenovaram;
    }
  })();

  // Apply search filter
  const filteredTabList = currentTabList.filter(sub => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return sub.profiles?.nome?.toLowerCase().includes(q) || sub.profiles?.email?.toLowerCase().includes(q);
  });

  const stats = {
    ativas: new Set(subscriptions.filter(isActiveAndValid).map(s => s.profiles?.email?.toLowerCase()).filter(Boolean)).size,
    expiradas: subscriptions.filter(isExpiredSubscriber).length,
    pendentes: subscriptions.filter((s) => s.status === "pending").length,
    canceladas: subscriptions.filter((s) => s.status === "cancelled" || s.status === "rejected").length,
    receita: subscriptions
      .filter((s) => s.status === "authorized")
      .reduce((acc, s) => acc + (s.amount || 0), 0),
  };

  const analyticsStats = {
    verMais: analytics.filter((a) => a.action === "view_more").length,
    abrirModal: analytics.filter((a) => a.action === "open_modal").length,
    mensal: analytics.filter((a) => a.plan_type === "mensal").length,
    vitalicio: analytics.filter((a) => a.plan_type === "vitalicio").length,
  };

  // Modal stats
  const diasFiltro = parseInt(filtroModalPeriodo);
  const filteredModalViews = modalViews.filter(mv => {
    const created = new Date(mv.created_at);
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= diasFiltro;
  });

  const modalStats = {
    total: filteredModalViews.length,
    floating: filteredModalViews.filter(mv => mv.modal_type === 'floating_card').length,
    upgrade: filteredModalViews.filter(mv => mv.modal_type === 'upgrade_modal').length,
    chatGate: filteredModalViews.filter(mv => mv.modal_type === 'chat_gate').length,
  };

  const topOrigens = Object.entries(
    filteredModalViews.reduce((acc, mv) => {
      const key = mv.source_feature || mv.source_page;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const displayModalViews = filteredModalViews.filter(mv => {
    if (!buscaModal) return true;
    const q = buscaModal.toLowerCase();
    return (
      mv.profiles?.nome?.toLowerCase().includes(q) ||
      mv.profiles?.email?.toLowerCase().includes(q) ||
      mv.source_feature?.toLowerCase().includes(q) ||
      mv.source_page.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string, expirationDate?: string | null) => {
    const activeStatuses = ["authorized", "active", "approved"];
    if (activeStatuses.includes(status) && expirationDate && new Date(expirationDate) < new Date()) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">Expirado</span>;
    }
    const config: Record<string, { bg: string; text: string; label: string }> = {
      authorized: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Ativo" },
      active: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Ativo" },
      approved: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Ativo" },
      pending: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Pendente" },
      cancelled: { bg: "bg-red-500/20", text: "text-red-400", label: "Cancelado" },
      rejected: { bg: "bg-red-500/20", text: "text-red-400", label: "Rejeitado" },
      expired: { bg: "bg-orange-500/20", text: "text-orange-400", label: "Expirado" },
    };
    const { bg, text, label } = config[status] || { bg: "bg-zinc-500/20", text: "text-zinc-400", label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{label}</span>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Assinaturas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Métricas e gestão de assinaturas premium</p>
          </div>
        </div>

        {/* ====== TABS DE ASSINANTES ====== */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {TAB_CONFIG.map(tab => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveTab(tab.value); setBusca(""); }}
              className="text-xs h-8 whitespace-nowrap shrink-0"
            >
              <tab.icon className="h-3 w-3 mr-1" />
              {tab.label}
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                {tab.value === "recentes" ? tabLists.recentes.length :
                 tab.value === "expirando" ? tabLists.expirando.length :
                 tab.value === "renovados" ? tabLists.renovados.length :
                 tabLists.naoRenovaram.length}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Tab Content - Subscriber List */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {filteredTabList.length} {activeTab === "recentes" ? "assinantes ativos" : 
             activeTab === "expirando" ? "expirando em 7 dias" :
             activeTab === "renovados" ? "renovações" : "não renovaram"}
          </p>

          {loadingSubscriptions ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : filteredTabList.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {activeTab === "expirando" ? "Nenhuma assinatura expirando nos próximos 7 dias 🎉" :
               activeTab === "nao_renovaram" ? "Nenhum ex-assinante encontrado" :
               "Nenhum resultado"}
            </div>
          ) : (
            filteredTabList.slice(0, 50).map(sub => (
              <Card key={sub.id} className="border-border/50">
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{sub.profiles?.nome || sub.profiles?.email || "-"}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">{sub.plan_type}</span>
                      {getStatusBadge(sub.status, sub.expiration_date)}
                    </div>
                  </div>

                  {sub.profiles?.nome && (
                    <p className="text-xs text-muted-foreground truncate">{sub.profiles.email}</p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    <span>R$ {(sub.amount || 0).toFixed(2).replace(".", ",")}</span>
                    <span className="uppercase">{sub.payment_method}</span>
                    <span>Criado {formatDate(sub.created_at)}</span>
                    {sub.expiration_date && (
                      <span className={
                        activeTab === "expirando" ? "text-amber-400 font-medium" :
                        activeTab === "nao_renovaram" ? "text-red-400" : ""
                      }>
                        {activeTab === "expirando" 
                          ? `Expira ${formatDistanceToNow(new Date(sub.expiration_date), { addSuffix: true, locale: ptBR })}`
                          : `Exp: ${formatDate(sub.expiration_date)}`
                        }
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {filteredTabList.length > 50 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Mostrando 50 de {filteredTabList.length}
            </p>
          )}
        </div>

        {/* ====== MÉTRICAS RESUMO ====== */}
        <div className="border-t border-border pt-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Resumo Geral</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border-emerald-500/20">
              <CardContent className="pt-3 pb-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Crown className="w-3 h-3 text-emerald-500" /> Ativas</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.ativas}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-orange-500/20">
              <CardContent className="pt-3 pb-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3 text-orange-500" /> Expiradas</p>
                <p className="text-2xl font-bold text-orange-400">{stats.expiradas}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-amber-500/20">
              <CardContent className="pt-3 pb-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> Pendentes</p>
                <p className="text-2xl font-bold text-amber-400">{stats.pendentes}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-red-500/20">
              <CardContent className="pt-3 pb-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> Canceladas</p>
                <p className="text-2xl font-bold text-red-400">{stats.canceladas}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-primary/20 col-span-2">
              <CardContent className="pt-3 pb-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3 text-primary" /> Receita Total</p>
                <p className="text-2xl font-bold text-primary">R$ {stats.receita.toFixed(2).replace(".", ",")}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Métricas de Cliques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card">
            <CardContent className="pt-3 pb-3">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3 text-blue-500" /> Ver Mais</p>
              <p className="text-xl font-bold text-blue-400">{analyticsStats.verMais}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="pt-3 pb-3">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1"><MousePointer className="w-3 h-3 text-violet-500" /> Abrir Modal</p>
              <p className="text-xl font-bold text-violet-400">{analyticsStats.abrirModal}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="pt-3 pb-3">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3 text-cyan-500" /> Plano Mensal</p>
              <p className="text-xl font-bold text-cyan-400">{analyticsStats.mensal}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="pt-3 pb-3">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Crown className="w-3 h-3 text-amber-500" /> Plano Anual</p>
              <p className="text-xl font-bold text-amber-400">{analyticsStats.vitalicio}</p>
            </CardContent>
          </Card>
        </div>

        {/* ====== SEÇÃO: Aberturas de Modal Premium ====== */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Aberturas de Modal Premium
            </h2>
            <Select value={filtroModalPeriodo} onValueChange={setFiltroModalPeriodo}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Hoje</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Card className="bg-card border-amber-500/20">
              <CardContent className="pt-3 pb-3">
                <p className="text-[11px] text-muted-foreground">Total Aberturas</p>
                <p className="text-2xl font-bold text-amber-400">{modalStats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="pt-3 pb-3">
                <p className="text-[11px] text-muted-foreground">Floating Card</p>
                <p className="text-xl font-bold text-orange-400">{modalStats.floating}</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="pt-3 pb-3">
                <p className="text-[11px] text-muted-foreground">Upgrade Modal</p>
                <p className="text-xl font-bold text-violet-400">{modalStats.upgrade}</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="pt-3 pb-3">
                <p className="text-[11px] text-muted-foreground">Chat Gate</p>
                <p className="text-xl font-bold text-cyan-400">{modalStats.chatGate}</p>
              </CardContent>
            </Card>
          </div>

          {topOrigens.length > 0 && (
            <Card className="mb-3">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm text-muted-foreground">Top 5 Origens</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {topOrigens.map(([origem, count], i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate mr-2">{origem}</span>
                    <span className="text-amber-400 font-semibold whitespace-nowrap">{count}x</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou recurso..."
              value={buscaModal}
              onChange={(e) => setBuscaModal(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingModalViews ? (
                <div className="p-8 text-center text-muted-foreground">Carregando...</div>
              ) : displayModalViews.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhuma abertura registrada</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Recurso</TableHead>
                        <TableHead>Página</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Disp.</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayModalViews.slice(0, 100).map((mv) => {
                        const tempoCadastro = mv.profiles?.created_at 
                          ? (() => {
                              const diff = new Date(mv.created_at).getTime() - new Date(mv.profiles.created_at).getTime();
                              const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
                              if (dias < 1) return "< 1 dia";
                              if (dias === 1) return "1 dia";
                              if (dias < 30) return `${dias} dias`;
                              const meses = Math.floor(dias / 30);
                              if (meses === 1) return "1 mês";
                              return `${meses} meses`;
                            })()
                          : "-";

                        const intencaoLabel: Record<string, string> = {
                          'universitario': '🎓 Universitário',
                          'concurseiro': '📝 Concurseiro',
                          'oab': '⚖️ OAB',
                          'advogado': '👔 Advogado',
                          'estudante': '📚 Estudante',
                        };

                        return (
                          <TableRow key={mv.id}>
                            <TableCell className="font-medium">{mv.profiles?.nome || "Anônimo"}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{mv.profiles?.email || "-"}</TableCell>
                            <TableCell className="text-xs">
                              {mv.profiles?.intencao 
                                ? (intencaoLabel[mv.profiles.intencao] || mv.profiles.intencao)
                                : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{tempoCadastro}</TableCell>
                            <TableCell className="text-xs">{mv.source_feature || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{mv.source_page}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                mv.modal_type === 'floating_card' ? 'bg-orange-500/20 text-orange-400' :
                                mv.modal_type === 'upgrade_modal' ? 'bg-violet-500/20 text-violet-400' :
                                'bg-cyan-500/20 text-cyan-400'
                              }`}>
                                {mv.modal_type === 'floating_card' ? 'Card' : mv.modal_type === 'upgrade_modal' ? 'Modal' : 'Chat'}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs">
                              {mv.device === 'mobile' ? <Smartphone className="w-4 h-4 text-muted-foreground" /> : <Monitor className="w-4 h-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(mv.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAssinaturas;
