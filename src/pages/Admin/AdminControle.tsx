import { useState } from 'react';
import {
  Activity,
  Users,
  Clock,
  TrendingUp,
  Smartphone,
  Target,
  Search,
  FileText,
  RefreshCw,
  ArrowLeft,
  Crown,
  Percent,
  CalendarClock,
  Eye,
  BarChart3,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Monitor,
  X,
  UserPlus,
  Trophy,
  Timer,
  Flame,
  Heart,
  Zap,
  Brain,
  Clock3,
  Sparkles,
  ArrowUp,
  ArrowDown,
  GraduationCap,
  MessageSquare } from
'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import {
  useNovosUsuarios,
  usePaginasPopulares,
  useTermosPesquisados,
  useEstatisticasGerais,
  useDistribuicaoDispositivos,
  useDistribuicaoIntencoes,
  useMetricasPremium,
  useOnlineAgoraRealtime,
  useOnline30MinRealtime,
  useOnlineHojeRealtime,
  useListaAssinantesPremium,
  useCadastrosPorDia,
  useOnlineDetails,
  useOnline30MinDetails,
  useOnlineHojeDetails,
  useAtivosDetalhes,
  useNovosDetalhes,
  useOnlinePorPeriodo,
  type UsuarioDetalhe,
  useCadastrosHoje,
  useCadastrosMes,
  useQuizRespostas } from
'@/hooks/useAdminControleStats';
import {
  useRankingTempoTela,
  useRankingAreasAcessadas,
  useRankingFuncoesUtilizadas,
  useRankingFidelidade,
  useRankingAulas,
  useRankingUsuarioAulas,
  useRankingTodosUsuarios } from
'@/hooks/useAdminRankings';
import AdminEngajamentoTab from '@/components/admin/AdminEngajamentoTab';
import AdminAssinaturasTab from '@/components/admin/AdminAssinaturasTab';
import AdminProfessoraTab from '@/components/admin/AdminProfessoraTab';
import AdminConversaoTab from '@/components/admin/AdminConversaoTab';
import AdminTrialTab from '@/components/admin/AdminTrialTab';
import AdminTrialAssinaturaTab from '@/components/admin/AdminTrialAssinaturaTab';
import AdminFlashcardsPendentesTab from '@/components/admin/AdminFlashcardsPendentesTab';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';

type PeriodoFiltro = 'hoje' | 'ontem' | '7dias' | '30dias';
type RankingPeriodo = 'hoje' | 'ontem' | '7dias' | '30dias' | 'aotodo';
type DialogType = 'online' | 'online30' | 'onlineHoje' | 'novos' | 'ativos' | 'total' | 'receita' | 'pageviews' | null;
type DashboardView = 'estatisticas' | 'historico' | 'premio' | 'assinaturas' | 'conversao' | 'professora' | 'trial' | 'trial-assinatura' | 'flashcards-pendentes';

const PERIODOS: {value: PeriodoFiltro;label: string;dias: number;}[] = [
{ value: 'hoje', label: 'Hoje', dias: 0 },
{ value: 'ontem', label: 'Ontem', dias: 1 },
{ value: '7dias', label: '7 dias', dias: 7 },
{ value: '30dias', label: '30 dias', dias: 30 }];

const RANKING_PERIODOS: {value: RankingPeriodo;label: string;dias: number;}[] = [
{ value: 'hoje', label: 'Hoje', dias: 1 },
{ value: 'ontem', label: 'Ontem', dias: 2 },
{ value: '7dias', label: '7 dias', dias: 7 },
{ value: '30dias', label: '30 dias', dias: 30 },
{ value: 'aotodo', label: 'Ao todo', dias: 9999 }];


const getDiasFromPeriodo = (periodo: PeriodoFiltro): number => {
  return PERIODOS.find((p) => p.value === periodo)?.dias ?? 7;
};

// Componente de comparação percentual
const ComparisonBadge = ({ current, previous }: {current: number;previous: number;}) => {
  if (previous === 0) return null;
  const diff = (current - previous) / previous * 100;
  const isUp = diff >= 0;
  const absVal = Math.abs(Math.round(diff));
  if (absVal === 0) return null;

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isUp ? 'text-emerald-500' : 'text-red-400'}`}>
      {isUp ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {absVal}%
    </span>);

};

// Helper para formatar tempo de cadastro
const formatRegistrationTime = (createdAt: string) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'há poucos minutos';
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return 'há 1 dia';
  if (diffDays < 30) return `há ${diffDays} dias`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
  return `há ${Math.floor(diffDays / 365)} anos`;
};

const isNewUser = (createdAt: string) => {
  const now = new Date();
  const created = new Date(createdAt);
  const nowSP = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const createdSP = new Date(created.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  return nowSP.toDateString() === createdSP.toDateString();
};

// Componente para lista de usuários no dialog
// Helper: calcula horas restantes de trial
const TRIAL_DAYS = 3;
const LAUNCH_DATE_ADMIN = new Date('2026-02-20T00:00:00Z');

const getTrialRemainingLabel = (createdAt: string | undefined, isPremium: boolean | undefined) => {
  if (!createdAt || isPremium) return null;
  const created = new Date(createdAt);
  const effectiveStart = new Date(Math.max(created.getTime(), LAUNCH_DATE_ADMIN.getTime()));
  const trialEnd = new Date(effectiveStart.getTime() + TRIAL_DAYS * 86400000);
  const now = new Date();
  const diffMs = trialEnd.getTime() - now.getTime();
  if (diffMs <= 0) return 'Trial expirado';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return `${days}d ${remainHours}h restantes`;
  }
  return `${hours}h ${mins}min restantes`;
};

type TrialCategory = 'ativos' | 'urgentes' | 'expirados';

const getTrialCategory = (createdAt: string | undefined, isPremium: boolean | undefined): TrialCategory => {
  if (isPremium) return 'ativos'; // premium users are always "active"
  if (!createdAt) return 'expirados';
  const created = new Date(createdAt);
  const effectiveStart = new Date(Math.max(created.getTime(), LAUNCH_DATE_ADMIN.getTime()));
  const trialEnd = new Date(effectiveStart.getTime() + TRIAL_DAYS * 86400000);
  const now = new Date();
  const diffMs = trialEnd.getTime() - now.getTime();
  if (diffMs <= 0) return 'expirados';
  // "urgentes" = less than 12 hours remaining
  if (diffMs < 12 * 60 * 60 * 1000) return 'urgentes';
  return 'ativos';
};

// Convert country code to flag emoji
const countryFlag = (code?: string | null) => {
  if (!code || code.length !== 2) return null;
  const upper = code.toUpperCase();
  return String.fromCodePoint(...[...upper].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
};

const getLocationLabel = (user: UsuarioDetalhe) => {
  const country = user.country || user.pais_cadastro;
  const region = user.region || user.estado_cadastro;
  if (!country && !region) return null;
  const flag = countryFlag(country);
  const parts: string[] = [];
  if (flag) parts.push(flag);
  if (region) parts.push(region);
  else if (country) parts.push(country);
  return parts.join(' ');
};

const UsuarioItem = ({ user, showPagePath, showViews, showCreatedAt }: {user: UsuarioDetalhe;showPagePath?: boolean;showViews?: boolean;showCreatedAt?: boolean;}) => {
  const isNew = user.created_at ? isNewUser(user.created_at) : false;
  const trialLabel = getTrialRemainingLabel(user.created_at, user.isPremium ?? undefined);
  const locationLabel = getLocationLabel(user);

  return (
    <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="font-medium text-sm truncate">{user.nome || 'Sem nome'}</span>
          {locationLabel &&
          <span className="text-[10px] text-muted-foreground shrink-0">{locationLabel}</span>
          }
          {user.isPremium != null &&
          <Badge
            variant="outline"
            className={`text-[9px] px-1.5 py-0 shrink-0 ${
            user.isPremium ?
            'bg-amber-500/20 text-amber-400 border-amber-500/40' :
            'bg-zinc-500/20 text-zinc-400 border-zinc-500/40'}`}>
              {user.isPremium ? '⭐ Premium' : 'Gratuito'}
            </Badge>
          }
          {user.created_at &&
          <Badge
            variant="outline"
            className={`text-[9px] px-1.5 py-0 shrink-0 ${
            isNew ?
            'bg-green-500/20 text-green-400 border-green-500/40' :
            'bg-blue-500/20 text-blue-400 border-blue-500/40'}`}>
              {isNew ? '🆕 Novo' : '👤 Antigo'}
            </Badge>
          }
        </div>
        {user.dispositivo &&
        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
            {user.dispositivo}
          </Badge>
        }
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Mail className="h-3 w-3 shrink-0" />
        <span className="truncate">{user.email || '—'}</span>
      </div>
      {user.telefone &&
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="h-3 w-3 shrink-0" />
          <span>{user.telefone}</span>
        </div>
      }
      {user.created_at &&
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="h-3 w-3 shrink-0" />
          <span>Cadastrado {formatRegistrationTime(user.created_at)}</span>
        </div>
      }
      {/* Trial remaining for free users */}
      {!user.isPremium && trialLabel &&
      <div className={`flex items-center gap-1.5 text-xs ${trialLabel === 'Trial expirado' ? 'text-red-400' : 'text-amber-400'}`}>
          <Timer className="h-3 w-3 shrink-0" />
          <span>{trialLabel}</span>
        </div>
      }
      {showPagePath && user.page_path &&
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3 w-3 shrink-0" />
          <span className="truncate">{user.page_path}</span>
        </div>
      }
      {showViews && user.total_views != null &&
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="h-3 w-3 shrink-0" />
          <span>{user.total_views} page views</span>
        </div>
      }
      {showCreatedAt && user.created_at &&
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ptBR })}</span>
        </div>
      }
      {user.last_seen &&
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Visto {formatDistanceToNow(new Date(user.last_seen), { addSuffix: true, locale: ptBR })}</span>
        </div>
      }
    </div>);
};

const AdminControle = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as DashboardView) || 'estatisticas';
  const [activeTab, setActiveTab] = useState('usuarios');
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('hoje');
  const [rankingPeriodo, setRankingPeriodo] = useState<RankingPeriodo>('7dias');
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [dashboardView, setDashboardView] = useState<DashboardView>(initialView);

  const diasFiltro = getDiasFromPeriodo(periodo);
  const diasParaQuery = diasFiltro === 0 ? 1 : diasFiltro;
  const rankingDias = RANKING_PERIODOS.find(p => p.value === rankingPeriodo)?.dias ?? 7;

  const { data: novosUsuarios, isLoading: loadingUsuarios } = useNovosUsuarios(diasParaQuery);
  const { data: paginasPopulares, isLoading: loadingPaginas } = usePaginasPopulares(diasParaQuery);
  const { data: termosPesquisados, isLoading: loadingTermos } = useTermosPesquisados();
  const { data: estatisticas, isLoading: loadingStats } = useEstatisticasGerais(diasFiltro);
  const { data: dispositivos } = useDistribuicaoDispositivos();
  const { data: intencoes } = useDistribuicaoIntencoes();
  const { data: metricasPremium } = useMetricasPremium(diasFiltro);
  const { onlineAgora, isLoading: loadingOnline } = useOnlineAgoraRealtime();
  const { online30Min, isLoading: loadingOnline30 } = useOnline30MinRealtime();
  const { onlineHoje, isLoading: loadingOnlineHoje } = useOnlineHojeRealtime();
  const { data: listaAssinantes, isLoading: loadingAssinantes } = useListaAssinantesPremium();
  const { data: cadastrosDia } = useCadastrosPorDia(diasParaQuery);

  // Hook para períodos históricos (ontem=1, 7dias=7) — desabilitado quando "hoje"
  const isHistorico = periodo !== 'hoje';
  const { data: onlinePeriodo, isLoading: loadingOnlinePeriodo } = useOnlinePorPeriodo(
    diasFiltro === 0 ? 1 : diasFiltro,
    isHistorico
  );

  // Cadastros separados
  const { data: cadastrosHoje } = useCadastrosHoje();
  const { data: cadastrosMes } = useCadastrosMes();

  // Detail hooks for dialogs - only load when dialog is open
  const { data: onlineDetails } = useOnlineDetails(openDialog === 'online');
  const { data: online30MinDetails } = useOnline30MinDetails(openDialog === 'online30');
  const { data: onlineHojeDetails } = useOnlineHojeDetails(openDialog === 'onlineHoje');
  const { data: ativosDetails } = useAtivosDetalhes(diasParaQuery, openDialog === 'ativos' || openDialog === 'total');
  const { data: novosDetails } = useNovosDetalhes(diasFiltro, openDialog === 'novos');

  // Quiz respostas do onboarding - only load on estatisticas tab
  const { data: quizRespostas } = useQuizRespostas(50, activeTab === 'usuarios');

  // Rankings hooks - only load when rankings tab is active
  const isRankingsActive = activeTab === 'rankings';
  const { data: rankingTempo, isLoading: loadingTempo } = useRankingTempoTela(rankingDias, isRankingsActive);
  const { data: rankingAreas, isLoading: loadingAreas } = useRankingAreasAcessadas(rankingDias, isRankingsActive);
  const { data: rankingFuncoes, isLoading: loadingFuncoes } = useRankingFuncoesUtilizadas(rankingDias, isRankingsActive);
  const { data: rankingFidelidade, isLoading: loadingFidelidade } = useRankingFidelidade(rankingDias, isRankingsActive);
  const { data: rankingAulas, isLoading: loadingAulas } = useRankingAulas(rankingDias, isRankingsActive);
  const { data: rankingUsuarioAulas, isLoading: loadingUsuarioAulas } = useRankingUsuarioAulas(rankingDias, isRankingsActive);
  const { data: todosUsuarios, isLoading: loadingTodos } = useRankingTodosUsuarios(rankingDias, isRankingsActive);

  const totalDispositivos = dispositivos ?
  dispositivos.iOS + dispositivos.Android + dispositivos.Desktop + dispositivos.Outro :
  0;

  const totalIntencoes = intencoes ?
  intencoes.Universitario + intencoes.Concurseiro + intencoes.OAB + intencoes.Advogado + intencoes.Outro :
  0;

  const getDeviceIcon = (dispositivo: string | null) => {
    if (!dispositivo) return '📱';
    const d = dispositivo.toLowerCase();
    if (d.includes('ios') || d.includes('iphone')) return '🍎';
    if (d.includes('android')) return '🤖';
    if (d.includes('desktop') || d.includes('windows')) return '💻';
    return '📱';
  };

  const parseDeviceInfo = (deviceInfo: any): string => {
    if (!deviceInfo) return '';
    if (typeof deviceInfo === 'string') {
      try {
        deviceInfo = JSON.parse(deviceInfo);
      } catch {
        return deviceInfo;
      }
    }
    const parts = [];
    if (deviceInfo.os) parts.push(deviceInfo.os);
    if (deviceInfo.osVersion) parts.push(deviceInfo.osVersion);
    if (deviceInfo.model) parts.push(`- ${deviceInfo.model}`);
    return parts.join(' ');
  };

  const periodoLabel = PERIODOS.find((p) => p.value === periodo)?.label || '';

  const chartData = (cadastrosDia || []).map((item) => ({
    dia: format(new Date(item.dia + 'T12:00:00'), 'dd/MM'),
    total: item.total
  }));

  const getDialogTitle = () => {
    switch (openDialog) {
      case 'online':return 'Usuários Online Agora (5 min)';
      case 'online30':return 'Usuários Online (30 min)';
      case 'onlineHoje':return 'Usuários Online Hoje';
      case 'novos':return `Novos Usuários (${periodoLabel})`;
      case 'ativos':return `Usuários Ativos (${periodoLabel})`;
      case 'total':return 'Todos os Usuários';
      case 'receita':return 'Detalhamento de Receita';
      case 'pageviews':return `Page Views (${periodoLabel})`;
      default:return '';
    }
  };

  const getDialogUsers = (): UsuarioDetalhe[] => {
    switch (openDialog) {
      case 'online':return onlineDetails || [];
      case 'online30':return online30MinDetails || [];
      case 'onlineHoje':return onlineHojeDetails || [];
      case 'novos':return novosDetails || [];
      case 'ativos':return ativosDetails || [];
      case 'total':return ativosDetails || [];
      default:return [];
    }
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return '—';
    const m = method.toLowerCase();
    if (m.includes('pix')) return 'PIX';
    if (m.includes('credit') || m.includes('cartao') || m.includes('card')) return 'Cartão';
    if (m.includes('debit')) return 'Débito';
    if (m.includes('boleto')) return 'Boleto';
    return method;
  };

    return (
    <div className="min-h-screen bg-background">
      {/* Header compacto */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Monitoramento
            </h1>
            <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
              {PERIODOS.map((p) =>
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  periodo === p.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                  {p.label}
              </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Navigation pills - horizontal scroll */}
        <div className="overflow-x-auto -mx-4 px-4 pb-1 scrollbar-hide">
          <div className="flex gap-1.5 w-max">
            {([
              { key: 'estatisticas', label: 'Visão Geral', icon: BarChart3 },
              { key: 'conversao', label: 'Conversão', icon: TrendingUp },
              { key: 'historico', label: 'Cadastros', icon: UserPlus },
              { key: 'premio', label: 'Prêmio', icon: Crown },
              { key: 'assinaturas', label: 'Assinaturas', icon: DollarSign },
              { key: 'trial', label: 'Trial', icon: Timer },
              { key: 'trial-assinatura', label: 'Pós-Trial', icon: TrendingUp },
              { key: 'professora', label: 'Professora', icon: GraduationCap },
              { key: 'flashcards-pendentes', label: 'Flashcards', icon: Brain },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setDashboardView(key as DashboardView)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  dashboardView === key
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {dashboardView === 'estatisticas' ?
        <div className="space-y-4">
            {/* Real-time hero section */}
            {periodo === 'hoje' ? (
              <div className="grid grid-cols-3 gap-3">
                {/* Online Agora - destaque principal */}
                <Card
                  className="relative overflow-hidden cursor-pointer border-emerald-500/40 hover:border-emerald-500/70 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
                  onClick={() => setOpenDialog('online')}>
                  <div className="absolute top-3 right-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                  </div>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500/80">Ao vivo</p>
                    <p className="text-3xl font-black text-emerald-500 mt-1">
                      {loadingOnline ? '...' : onlineAgora}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">agora (5 min)</p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer border-teal-500/30 hover:border-teal-500/60 transition-all hover:shadow-md"
                  onClick={() => setOpenDialog('online30')}>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-teal-500/80">30 min</p>
                    <p className="text-3xl font-black text-teal-500 mt-1">
                      {loadingOnline30 ? '...' : online30Min}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">últimos 30 min</p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer border-cyan-500/30 hover:border-cyan-500/60 transition-all hover:shadow-md"
                  onClick={() => setOpenDialog('onlineHoje')}>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-cyan-500/80">Hoje</p>
                    <p className="text-3xl font-black text-cyan-500 mt-1">
                      {loadingOnlineHoje ? '...' : onlineHoje}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">únicos hoje</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-cyan-500/30 hover:shadow-md transition-all">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-cyan-500/80">
                      Únicos ({periodoLabel})
                    </p>
                    <p className="text-3xl font-black text-cyan-500 mt-1">
                      {loadingOnlinePeriodo ? '...' : (onlinePeriodo?.unicos ?? '—')}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">acessaram o app</p>
                  </CardContent>
                </Card>
                <Card className="border-teal-500/30 hover:shadow-md transition-all">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-teal-500/80">Page Views</p>
                    <p className="text-3xl font-black text-teal-500 mt-1">
                      {loadingOnlinePeriodo ? '...' : (onlinePeriodo?.pageviews ?? '—')}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{periodoLabel}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Row 2: Cadastros + Prêmios + Prêmios Ativos */}
            <div className="grid grid-cols-3 gap-3">

              <Card className="cursor-pointer hover:border-sky-500/50 transition-all hover:shadow-md"
            onClick={() => setOpenDialog('novos')}>

                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Cadastros Hoje</p>
                      <p className="text-2xl font-bold text-sky-500">
                        {cadastrosHoje ?? '...'}
                      </p>
                    </div>
                    <UserPlus className="h-5 w-5 text-sky-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:shadow-md transition-all"
            onClick={() => setOpenDialog('receita')}>

                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Prêmios Hoje</p>
                      <p className="text-2xl font-bold text-amber-500">{metricasPremium?.assinaturasHoje || 0}</p>
                      <p className="text-[10px] text-muted-foreground">novas assinaturas</p>
                    </div>
                    <Crown className="h-5 w-5 text-amber-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:shadow-md transition-all"
            onClick={() => setOpenDialog('receita')}>

                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Prêmios Ativos</p>
                      <p className="text-2xl font-bold text-amber-400">{metricasPremium?.totalPremium || 0}</p>
                      <p className="text-[10px] text-muted-foreground">assinaturas ativas</p>
                    </div>
                    <Trophy className="h-5 w-5 text-amber-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Receita Hoje + Receita Ontem */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent cursor-pointer hover:shadow-md transition-all"
            onClick={() => setOpenDialog('receita')}>

                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Receita Hoje</p>
                      <p className="text-xl font-bold text-emerald-500">
                        R$ {(metricasPremium?.receitaHoje || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="h-5 w-5 text-emerald-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent cursor-pointer hover:shadow-md transition-all"
            onClick={() => setOpenDialog('receita')}>

                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Receita Ontem</p>
                      <p className="text-xl font-bold text-emerald-500">
                        R$ {(metricasPremium?.receitaOntem || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="h-5 w-5 text-emerald-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 4: Tempo de Conversão por perfil */}
            <div className="grid grid-cols-3 gap-3">
              {(() => {
              const perfis = ['oab', 'universitario', 'advogado'];
              const labels: Record<string, string> = { oab: 'OAB', universitario: 'Universitário', advogado: 'Advogado' };
              const colors: Record<string, string> = { oab: 'text-orange-400', universitario: 'text-blue-400', advogado: 'text-rose-400' };
              return perfis.map((perfil) => {
                const data = metricasPremium?.conversaoPorPerfil?.find((c) => c.perfil === perfil);
                const horas = data?.horas;
                return (
                  <Card key={perfil} className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-md transition-all min-w-0">
                      <CardContent className="pt-3 pb-3 px-3">
                        <p className="text-[10px] text-muted-foreground mb-0.5 truncate">Conversão {labels[perfil]}</p>
                        <p className={`text-xl font-bold ${colors[perfil]}`}>
                          {horas != null ?
                        horas >= 24 ?
                        `${Math.round(horas / 24)}d` :
                        `${Math.round(horas)}h` :
                        '—'}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] text-muted-foreground">média</p>
                          {data?.count != null && data.count > 0 &&
                        <span className={`text-[9px] ${colors[perfil]} opacity-70`}>
                              {data.count}
                            </span>
                        }
                        </div>
                      </CardContent>
                    </Card>);

              });
            })()}
            </div>

            {/* Row 5: Sessões por perfil */}
            <div className="grid grid-cols-3 gap-3">
              {(() => {
              const perfis = ['oab', 'universitario', 'advogado'];
              const labels: Record<string, string> = { oab: 'OAB', universitario: 'Universitário', advogado: 'Advogado' };
              const colors: Record<string, string> = { oab: 'text-orange-400', universitario: 'text-blue-400', advogado: 'text-rose-400' };
              const borderColors: Record<string, string> = { oab: 'border-orange-500/20', universitario: 'border-blue-500/20', advogado: 'border-rose-500/20' };
              const bgColors: Record<string, string> = { oab: 'from-orange-500/5', universitario: 'from-blue-500/5', advogado: 'from-rose-500/5' };
              return perfis.map((perfil) => {
                const data = metricasPremium?.conversaoPorPerfil?.find((c) => c.perfil === perfil);
                return (
                  <Card key={`sessions-${perfil}`} className={`${borderColors[perfil]} bg-gradient-to-br ${bgColors[perfil]} to-transparent hover:shadow-md transition-all min-w-0`}>
                      <CardContent className="pt-3 pb-3 px-3">
                        <p className="text-[10px] text-muted-foreground mb-0.5 truncate">Sessões {labels[perfil]}</p>
                        <div className="flex items-center gap-1.5">
                          <RefreshCw className={`h-3.5 w-3.5 ${colors[perfil]} opacity-60`} />
                          <p className={`text-xl font-bold ${colors[perfil]}`}>
                            {data?.avgSessions != null ? data.avgSessions : '—'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] text-muted-foreground">média até Premium</p>
                          {data?.count != null && data.count > 0 &&
                        <span className={`text-[9px] ${colors[perfil]} opacity-70`}>
                              {data.count}
                            </span>
                        }
                        </div>
                      </CardContent>
                    </Card>);

              });
            })()}
            </div>
          </div> :
        dashboardView === 'historico' ? (
        /* Histórico - Últimos Usuários Cadastrados */
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Últimos Cadastros ({periodoLabel})
                </div>
                <Badge variant="secondary">{novosUsuarios?.length || 0} usuários</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsuarios ?
            <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div> :
            novosUsuarios && novosUsuarios.length > 0 ?
            <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2 pr-4">
                    {novosUsuarios.map((usuario) => {
                      // Find quiz answers for this user
                      const quiz = quizRespostas?.find(q => q.user_id === usuario.id);
                      return (
                        <div key={usuario.id} className="rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors overflow-hidden">
                          <Link
                            to={`/admin/usuario/${usuario.id}`}
                            className="block p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                                <span className="font-medium text-sm truncate">{usuario.nome || 'Sem nome'}</span>
                                {usuario.intencao &&
                                  <Badge variant="outline" className="text-[10px] shrink-0">{usuario.intencao}</Badge>
                                }
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                {formatDistanceToNow(new Date(usuario.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{usuario.email}</p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span>{getDeviceIcon(usuario.dispositivo)} {parseDeviceInfo(usuario.device_info) || usuario.dispositivo || '—'}</span>
                              {usuario.primeiro_acesso_minutos != null &&
                                <span className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {usuario.primeiro_acesso_minutos < 1 ? '< 1 min' : `${usuario.primeiro_acesso_minutos} min`} na 1ª sessão
                                </span>
                              }
                            </div>
                          </Link>
                          {/* Quiz answers badges */}
                          {quiz && (
                            <div className="px-3 pb-3 border-t border-border/40 pt-2">
                              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Quiz de onboarding
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {quiz.faixa_etaria && (
                                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                                    🎂 {quiz.faixa_etaria}
                                  </Badge>
                                )}
                                {quiz.forma_estudo && (
                                  <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/30">
                                    📖 {quiz.forma_estudo}
                                  </Badge>
                                )}
                                {quiz.necessidade_app && (
                                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                    🔍 {quiz.necessidade_app}
                                  </Badge>
                                )}
                                {quiz.frequencia_estudo && (
                                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                                    ⏰ {quiz.frequencia_estudo}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea> :
            <p className="text-center text-muted-foreground py-8">Nenhum cadastro no período</p>
            }
            </CardContent>
          </Card>

          {/* Distribuição estatística do quiz */}
          {quizRespostas && quizRespostas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Distribuição do Quiz de Onboarding
                  <Badge variant="secondary" className="text-[10px]">{quizRespostas.length} respostas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Faixa etária */}
                {(() => {
                  const counts: Record<string, number> = {};
                  quizRespostas.forEach(q => { if (q.faixa_etaria) counts[q.faixa_etaria] = (counts[q.faixa_etaria] || 0) + 1; });
                  const total = Object.values(counts).reduce((a, b) => a + b, 0);
                  return total > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">🎂 Faixa etária</p>
                      <div className="space-y-1.5">
                        {Object.entries(counts).map(([k, v]) => (
                          <div key={k}>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-foreground">{k}</span>
                              <span className="text-muted-foreground">{v} ({Math.round(v/total*100)}%)</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.round(v/total*100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Necessidade do app */}
                {(() => {
                  const counts: Record<string, number> = {};
                  quizRespostas.forEach(q => { if (q.necessidade_app) counts[q.necessidade_app] = (counts[q.necessidade_app] || 0) + 1; });
                  const total = Object.values(counts).reduce((a, b) => a + b, 0);
                  return total > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">🔍 O que mais buscam</p>
                      <div className="space-y-1.5">
                        {Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k, v]) => (
                          <div key={k}>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-foreground capitalize">{k}</span>
                              <span className="text-muted-foreground">{v} ({Math.round(v/total*100)}%)</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.round(v/total*100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Frequência */}
                {(() => {
                  const counts: Record<string, number> = {};
                  quizRespostas.forEach(q => { if (q.frequencia_estudo) counts[q.frequencia_estudo] = (counts[q.frequencia_estudo] || 0) + 1; });
                  const total = Object.values(counts).reduce((a, b) => a + b, 0);
                  return total > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">⏰ Frequência de estudo</p>
                      <div className="space-y-1.5">
                        {Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k, v]) => (
                          <div key={k}>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="text-foreground capitalize">{k}</span>
                              <span className="text-muted-foreground">{v} ({Math.round(v/total*100)}%)</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.round(v/total*100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          )}
        </div>) :
        dashboardView === 'premio' ? (
        /* Prêmio - Assinaturas em tempo real */
        <div className="space-y-4">
            {/* Resumo rápido */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
                <CardContent className="pt-4 pb-4">
                  <p className="text-[11px] text-muted-foreground">Total Premium</p>
                  <p className="text-2xl font-bold text-amber-500">{metricasPremium?.totalPremium || 0}</p>
                  <p className="text-[10px] text-muted-foreground">assinantes únicos</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
                <CardContent className="pt-4 pb-4">
                  <p className="text-[11px] text-muted-foreground">E-mails Únicos</p>
                  <p className="text-2xl font-bold text-emerald-500">{listaAssinantes?.length || 0}</p>
                  <p className="text-[10px] text-muted-foreground">com assinatura ativa</p>
                </CardContent>
              </Card>
              <Card className="border-sky-500/30 bg-gradient-to-br from-sky-500/5 to-transparent">
                <CardContent className="pt-4 pb-4">
                  <p className="text-[11px] text-muted-foreground">Assinaturas Hoje</p>
                  <p className="text-2xl font-bold text-sky-500">{metricasPremium?.assinaturasHoje || 0}</p>
                  <p className="text-[10px] text-muted-foreground">novas hoje</p>
                </CardContent>
              </Card>
              <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent">
                <CardContent className="pt-4 pb-4">
                  <p className="text-[11px] text-muted-foreground">Taxa Conversão</p>
                  <p className="text-2xl font-bold text-violet-500">{metricasPremium?.taxaConversao?.toFixed(2) || 0}%</p>
                  <p className="text-[10px] text-muted-foreground">do total de usuários</p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de assinantes */}
            <Card className="border-amber-500/30" id="assinantes-premio-section">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    Assinantes
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Tempo real" />
                  </div>
                  <Badge className="bg-amber-500 text-white">
                    {listaAssinantes?.length || 0} únicos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAssinantes ?
              <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div> :
              listaAssinantes && listaAssinantes.length > 0 ?
              <>
                    {/* Mobile: Cards */}
                    <div className="space-y-3 md:hidden max-h-[500px] overflow-y-auto">
                      {listaAssinantes.map((assinante, index) =>
                  <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">{assinante.nome || assinante.email}</span>
                            <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">Ativo</Badge>
                          </div>
                          {assinante.nome &&
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{assinante.email}</span>
                            </div>
                    }
                          {assinante.telefone &&
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{assinante.telefone}</span>
                            </div>
                    }
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{assinante.plano}</Badge>
                              <span className="font-medium">R$ {assinante.valor?.toFixed(2)}</span>
                            </div>
                            <span className="text-muted-foreground">{format(new Date(assinante.data), 'dd/MM/yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {assinante.intencao &&
                      <Badge variant="outline" className="text-[10px] capitalize">{assinante.intencao}</Badge>
                      }
                            <span className="text-muted-foreground">{formatPaymentMethod(assinante.payment_method)}</span>
                          </div>
                        </div>
                  )}
                    </div>

                    {/* Desktop: Table */}
                    <div className="hidden md:block max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {listaAssinantes.map((assinante, index) =>
                      <TableRow key={index}>
                              <TableCell className="font-medium text-sm">{assinante.nome || '—'}</TableCell>
                              <TableCell className="text-sm">{assinante.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{assinante.plano}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">R$ {assinante.valor?.toFixed(2) || '0.00'}</TableCell>
                              <TableCell className="text-sm">{formatPaymentMethod(assinante.payment_method)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(assinante.data), 'dd/MM/yyyy')}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-emerald-500/20 text-emerald-500 text-xs">Ativo</Badge>
                              </TableCell>
                            </TableRow>
                      )}
                        </TableBody>
                      </Table>
                    </div>
                  </> :

              <p className="text-center text-muted-foreground py-8">Nenhum assinante encontrado</p>
              }
              </CardContent>
            </Card>
          </div>) :
        dashboardView === 'assinaturas' ?
        <AdminAssinaturasTab /> :
        dashboardView === 'conversao' ?
        <AdminConversaoTab dias={diasParaQuery} periodo={periodo} /> :
        dashboardView === 'professora' ?
        <AdminProfessoraTab /> :
        dashboardView === 'trial' ?
        <AdminTrialTab /> :
        dashboardView === 'trial-assinatura' ?
        <AdminTrialAssinaturaTab /> :
        dashboardView === 'flashcards-pendentes' ?
        <AdminFlashcardsPendentesTab /> :
        null}

        {/* Dialog de detalhes de usuários */}
        <Dialog open={openDialog !== null && openDialog !== 'receita' && openDialog !== 'pageviews'} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{getDialogTitle()}</DialogTitle>
              <DialogDescription>
                {openDialog === 'online' && 'Sessões ativas nos últimos 5 minutos'}
                {openDialog === 'online30' && 'Usuários únicos nos últimos 30 minutos'}
                {openDialog === 'novos' && `Cadastros no período: ${periodoLabel}`}
                {openDialog === 'ativos' && `Usuários com atividade no período: ${periodoLabel}`}
                {openDialog === 'total' && 'Usuários mais recentes com atividade'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2 pr-4">
                {getDialogUsers().length === 0 ?
                <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p> :
                getDialogUsers().map((user) =>
                <UsuarioItem
                  key={user.user_id}
                  user={user}
                  showPagePath={openDialog === 'online' || openDialog === 'online30'}
                  showViews={openDialog === 'ativos' || openDialog === 'total'}
                  showCreatedAt={openDialog === 'novos'} />
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Dialog de receita */}
        <Dialog open={openDialog === 'receita'} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-md max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Prêmios & Receita</DialogTitle>
              <DialogDescription>Detalhes de assinaturas e receita</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                {/* Receita resumo */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-sky-500/10 border border-sky-500/30">
                  <span className="text-sm font-bold">Receita Hoje</span>
                  <span className="text-lg font-bold text-sky-500">
                    R$ {(metricasPremium?.receitaHoje || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <span className="text-sm font-bold">Receita Ontem</span>
                  <span className="text-lg font-bold text-orange-500">
                    R$ {(metricasPremium?.receitaOntem || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-sm font-bold">Receita do Mês</span>
                  <span className="text-lg font-bold text-emerald-500">
                    R$ {(metricasPremium?.receitaMesAtual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Prêmios Hoje - Lista detalhada */}
                {(metricasPremium?.assinantesHojeDetalhes?.length || 0) > 0 && (
                  <div className="border-t border-border pt-3 space-y-3">
                    <p className="text-xs text-muted-foreground font-medium">
                      Prêmios Hoje ({metricasPremium?.assinantesHojeDetalhes?.length || 0} nova{(metricasPremium?.assinantesHojeDetalhes?.length || 0) > 1 ? 's' : ''})
                    </p>
                    {metricasPremium?.assinantesHojeDetalhes?.map((assinante, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">
                            {assinante.nome || 'Sem nome'}
                          </span>
                          <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-[10px]">
                            {assinante.plano}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{assinante.email}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            {assinante.payment_method === 'pix' ? '💠 PIX' : '💳 Cartão'}
                          </span>
                          <span className="text-sm font-bold text-emerald-500">
                            R$ {assinante.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(assinante.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {(metricasPremium?.assinantesHojeDetalhes?.length || 0) === 0 && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground text-center py-3">Nenhuma assinatura hoje</p>
                  </div>
                )}

                {/* Por tipo de plano */}
                <div className="border-t border-border pt-3 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">Por tipo de plano (total acumulado)</p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-sm font-medium">Mensal</span>
                    <span className="text-sm font-bold text-emerald-500">
                      R$ {(metricasPremium?.receitaMensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-sm font-medium">Anual</span>
                    <span className="text-sm font-bold text-emerald-500">
                      R$ {(metricasPremium?.receitaAnual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-sm font-medium">Vitalício</span>
                    <span className="text-sm font-bold text-emerald-500">
                      R$ {(metricasPremium?.receitaVitalicio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <span className="text-sm font-bold">Total Geral</span>
                  <span className="text-lg font-bold text-amber-500">
                    R$ {(metricasPremium?.receitaTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Média até Premium: {metricasPremium?.mediaDiasAtePremium != null ? `${metricasPremium.mediaDiasAtePremium} dias` : '—'}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Dialog de page views */}
        <Dialog open={openDialog === 'pageviews'} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Páginas Mais Acessadas ({periodoLabel})</DialogTitle>
              <DialogDescription>
                Total: {estatisticas?.totalPageViews?.toLocaleString('pt-BR') || 0} views ·
                Média: {diasFiltro > 0 ? Math.round((estatisticas?.totalPageViews || 0) / diasFiltro) : estatisticas?.totalPageViews || 0}/dia
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-3 pr-4">
                {paginasPopulares?.map((pagina, index) => {
                  const maxCount = paginasPopulares[0]?.count || 1;
                  const percentage = pagina.count / maxCount * 100;
                  return (
                    <div key={pagina.page_path} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-6">#{index + 1}</span>
                          <span className="font-medium">{pagina.page_title || pagina.page_path}</span>
                        </div>
                        <Badge variant="secondary">{pagina.count.toLocaleString('pt-BR')}</Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>);

                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Média cadastros/dia */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média cadastros/dia ({periodoLabel})</p>
                <p className="text-3xl font-bold">
                  {loadingStats ? '...' :
                  diasFiltro > 0 && estatisticas?.novosNoPeriodo ?
                  Math.round(estatisticas.novosNoPeriodo / Math.max(diasFiltro, 1)) :
                  estatisticas?.novosNoPeriodo || 0
                  }
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de cadastros por dia */}
        {chartData.length > 1 &&
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                Cadastros por Dia ({periodoLabel})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCadastros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="dia" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }} />

                  <Area
                  type="monotone"
                  dataKey="total"
                  name="Cadastros"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCadastros)" />

                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        }

        {/* Cards de Premium + Receita - todos clicáveis */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card
            className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/60 hover:shadow-md transition-all"
            onClick={() => {
              const el = document.getElementById('assinantes-premium-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}>

            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Total Premium</p>
              <p className="text-2xl font-bold text-amber-500">{metricasPremium?.totalPremium || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/60 hover:shadow-md transition-all"
          onClick={() => {
            const el = document.getElementById('assinantes-premium-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}>

            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Taxa Conversão</p>
              <p className="text-2xl font-bold text-amber-500">{metricasPremium?.taxaConversao?.toFixed(2) || 0}%</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/60 hover:shadow-md transition-all"
          onClick={() => {
            const el = document.getElementById('assinantes-premium-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}>

            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Novos Premium ({periodoLabel})</p>
              <p className="text-2xl font-bold text-amber-500">{metricasPremium?.novosPremiumPeriodo || 0}</p>
            </CardContent>
          </Card>

          <Card
            className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent cursor-pointer hover:border-emerald-500/60 hover:shadow-md transition-all"
            onClick={() => setOpenDialog('receita')}>

            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Receita Hoje</p>
              <p className="text-xl font-bold text-emerald-500">
                R$ {(metricasPremium?.receitaHoje || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent cursor-pointer hover:border-orange-500/60 hover:shadow-md transition-all"
          onClick={() => setOpenDialog('receita')}>

            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Receita Ontem</p>
              <p className="text-xl font-bold text-orange-500">
                R$ {(metricasPremium?.receitaOntem || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent cursor-pointer hover:border-emerald-500/60 hover:shadow-md transition-all"
          onClick={() => setOpenDialog('receita')}>

            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Receita Mensal</p>
              <p className="text-lg font-bold text-emerald-500">
                R$ {(metricasPremium?.receitaMesAtual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Assinantes Premium - Responsiva com Realtime */}
        <Card className="border-amber-500/30" id="assinantes-premium-section">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Assinantes Premium
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Tempo real" />
              </div>
              <Badge className="bg-amber-500 text-white">
                {listaAssinantes?.length || 0} únicos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAssinantes ?
            <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div> :
            listaAssinantes && listaAssinantes.length > 0 ?
            <>
                {/* Mobile: Cards */}
                <div className="space-y-3 md:hidden max-h-[500px] overflow-y-auto">
                  {listaAssinantes.map((assinante, index) =>
                <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{assinante.nome || assinante.email}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">Ativo</Badge>
                      </div>
                      {assinante.nome &&
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{assinante.email}</span>
                        </div>
                  }
                      {assinante.telefone &&
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{assinante.telefone}</span>
                        </div>
                  }
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{assinante.plano}</Badge>
                          <span className="font-medium">R$ {assinante.valor?.toFixed(2)}</span>
                        </div>
                        <span className="text-muted-foreground">{format(new Date(assinante.data), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {assinante.intencao &&
                    <Badge variant="outline" className="text-[10px] capitalize">{assinante.intencao}</Badge>
                    }
                        <span className="text-muted-foreground">{formatPaymentMethod(assinante.payment_method)}</span>
                      </div>
                    </div>
                )}
                </div>

                {/* Desktop: Table */}
                <div className="hidden md:block max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listaAssinantes.map((assinante, index) =>
                    <TableRow key={index}>
                          <TableCell className="font-medium text-sm">{assinante.nome || '—'}</TableCell>
                          <TableCell className="text-sm">{assinante.email}</TableCell>
                          <TableCell className="text-sm">{assinante.telefone || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{assinante.intencao || '—'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{assinante.plano}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">R$ {assinante.valor?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell className="text-sm">{formatPaymentMethod(assinante.payment_method)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(assinante.data), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-500/20 text-emerald-500 text-xs">Ativo</Badge>
                          </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                  </Table>
                </div>
              </> :

            <p className="text-center text-muted-foreground py-8">Nenhum assinante encontrado</p>
            }
          </CardContent>
        </Card>

        {/* Feedback removido - agora enviado via WhatsApp pela Evelyn às 00:01 */}

        {/* Tabs de Análise */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="paginas" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Páginas</span>
            </TabsTrigger>
            <TabsTrigger value="buscas" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Buscas</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Rankings</span>
            </TabsTrigger>
            <TabsTrigger value="engajamento" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Engajamento</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Usuários */}
          <TabsContent value="usuarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Novos Cadastros ({periodoLabel})
                  </div>
                  <Badge variant="secondary">{novosUsuarios?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsuarios ?
                <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div> :

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {novosUsuarios?.map((usuario) =>
                  <Link
                    key={usuario.id}
                    to={`/admin/usuario/${usuario.id}`}
                    className="block p-4 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 hover:border-primary/30 transition-colors cursor-pointer">

                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                              <span className="font-medium hover:text-primary transition-colors">
                                {usuario.nome || 'Sem nome'}
                              </span>
                              {usuario.intencao &&
                          <Badge variant="outline" className="text-xs">
                                  {usuario.intencao}
                                </Badge>
                          }
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {usuario.email}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                {getDeviceIcon(usuario.dispositivo)}
                                {parseDeviceInfo(usuario.device_info) || usuario.dispositivo || 'Dispositivo não identificado'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(usuario.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                  )}
                  </div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Páginas */}
          <TabsContent value="paginas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Páginas Mais Acessadas ({periodoLabel})
                  </div>
                  <Badge variant="secondary">
                    {estatisticas?.totalPageViews?.toLocaleString('pt-BR') || 0} views
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPaginas ?
                <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div> :

                <div className="space-y-3">
                    {paginasPopulares?.map((pagina, index) => {
                    const maxCount = paginasPopulares[0]?.count || 1;
                    const percentage = pagina.count / maxCount * 100;

                    return (
                      <div key={pagina.page_path} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-6">#{index + 1}</span>
                              <span className="font-medium">{pagina.page_title || pagina.page_path}</span>
                            </div>
                            <Badge variant="secondary">{pagina.count.toLocaleString('pt-BR')}</Badge>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground">{pagina.page_path}</p>
                        </div>);

                  })}
                    {(!paginasPopulares || paginasPopulares.length === 0) &&
                  <p className="text-center text-muted-foreground py-8">Nenhum dado de navegação ainda</p>
                  }
                  </div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Buscas */}
          <TabsContent value="buscas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Termos Mais Pesquisados
                  </div>
                  <Badge variant="secondary">{termosPesquisados?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTermos ?
                <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div> :

                <div className="space-y-3">
                    {termosPesquisados?.map((termo, index) => {
                    const maxCount = termosPesquisados[0]?.count || 1;
                    const percentage = termo.count / maxCount * 100;

                    return (
                      <div key={termo.termo} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-6">#{index + 1}</span>
                              <span className="font-medium">{termo.termo}</span>
                            </div>
                            <Badge variant="secondary">{termo.count}</Badge>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>);

                  })}
                    {(!termosPesquisados || termosPesquisados.length === 0) &&
                  <p className="text-center text-muted-foreground py-8">Nenhuma pesquisa registrada ainda</p>
                  }
                  </div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dispositivos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Dispositivos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {totalDispositivos > 0 ?
                  <>
                      {[
                    { label: '🍎 iOS', value: dispositivos?.iOS || 0 },
                    { label: '🤖 Android', value: dispositivos?.Android || 0 },
                    { label: '💻 Desktop', value: dispositivos?.Desktop || 0 },
                    { label: '📱 Outro', value: dispositivos?.Outro || 0 }].
                    map((d) =>
                    <div key={d.label} className="mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>{d.label}</span>
                            <span>{d.value} ({(d.value / totalDispositivos * 100).toFixed(1)}%)</span>
                          </div>
                          <Progress value={d.value / totalDispositivos * 100} className="h-2" />
                        </div>
                    )}
                    </> :

                  <p className="text-center text-muted-foreground py-4">Carregando dados...</p>
                  }
                </CardContent>
              </Card>

              {/* Intenções */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Perfil dos Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {totalIntencoes > 0 ?
                  <>
                      {[
                    { label: '🎓 Universitário', value: intencoes?.Universitario || 0 },
                    { label: '📝 Concurseiro', value: intencoes?.Concurseiro || 0 },
                    { label: '⚖️ OAB', value: intencoes?.OAB || 0 },
                    { label: '👔 Advogado', value: intencoes?.Advogado || 0 },
                    { label: '🔄 Outro', value: intencoes?.Outro || 0 }].
                    map((d) =>
                    <div key={d.label} className="mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>{d.label}</span>
                            <span>{d.value} ({(d.value / totalIntencoes * 100).toFixed(1)}%)</span>
                          </div>
                          <Progress value={d.value / totalIntencoes * 100} className="h-2" />
                        </div>
                    )}
                    </> :

                  <p className="text-center text-muted-foreground py-4">Carregando dados...</p>
                  }
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Rankings */}
          <TabsContent value="rankings" className="space-y-6">
            
            {/* Filtro de período para Rankings */}
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Período:</span>
              <div className="flex gap-1 flex-wrap">
                {RANKING_PERIODOS.map((p) =>
                <Button
                  key={p.value}
                  variant={rankingPeriodo === p.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRankingPeriodo(p.value)}
                  className="text-xs h-7 px-3">
                    {p.label}
                  </Button>
                )}
              </div>
            </div>

            {/* Resumo geral */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Usuários com Atividade</p>
                  <p className="text-2xl font-bold">{rankingTempo?.filter(u => u.tempo_total_min > 0).length || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Todos Cadastrados</p>
                  <p className="text-2xl font-bold">{todosUsuarios?.length || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Aulas Acessadas</p>
                  <p className="text-2xl font-bold">{rankingAulas?.length || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Alunos em Aulas</p>
                  <p className="text-2xl font-bold">{rankingUsuarioAulas?.length || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Ranking Tempo de Tela */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    Ranking de Tempo de Tela
                  </div>
                  <Badge variant="secondary">{rankingTempo?.length || 0} usuários</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTempo ?
                <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div> :
                rankingTempo && rankingTempo.length > 0 ?
                <ScrollArea className="h-[70vh]">
                    <div className="space-y-4 pr-4">
                      {rankingTempo.filter(u => u.tempo_total_min > 0).map((item, index) => {
                      const maxTime = rankingTempo[0]?.tempo_total_min || 1;
                      const pct = item.tempo_total_min / maxTime * 100;
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                      return (
                        <div key={item.user_id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg w-8 text-right shrink-0">
                                  {medal || `#${index + 1}`}
                                </span>
                                <div className="min-w-0">
                                  <span className="font-medium block truncate">{item.nome}</span>
                                  <span className="text-xs text-muted-foreground truncate block">{item.email}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {item.tempo_hoje_min > 0 && <Badge variant="outline" className="text-xs">Hoje: {item.tempo_hoje_formatado}</Badge>}
                                <Badge className="text-sm">{item.tempo_formatado}</Badge>
                              </div>
                            </div>
                            <Progress value={pct} className="h-2" />
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">{item.sessoes} sessões</Badge>
                              <Badge variant="outline">{item.page_views} views</Badge>
                              {item.intencao && <Badge variant="outline" className="capitalize">{item.intencao}</Badge>}
                              {item.telefone &&
                            <span className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />{item.telefone}
                                </span>
                            }
                            </div>
                            {item.paginas_mais_vistas && item.paginas_mais_vistas.length > 0 &&
                          <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Top páginas:</span>{' '}
                                {item.paginas_mais_vistas.join(', ')}
                              </div>
                          }
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Último acesso: {formatDistanceToNow(new Date(item.ultima_atividade), { addSuffix: true, locale: ptBR })}</span>
                              {item.cadastro &&
                            <span>Cadastro: {format(new Date(item.cadastro), 'dd/MM/yyyy')}</span>
                            }
                            </div>
                          </div>);

                    })}
                    </div>
                  </ScrollArea> :

                <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
                }
              </CardContent>
            </Card>

            {/* Ranking Aulas Mais Acessadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Aulas Mais Acessadas
                  </div>
                  <Badge variant="secondary">{rankingAulas?.length || 0} aulas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAulas ?
                <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div> :
                rankingAulas && rankingAulas.length > 0 ?
                <ScrollArea className="max-h-[500px]">
                    <div className="space-y-3 pr-4">
                      {rankingAulas.map((item, index) => {
                      const maxViews = rankingAulas[0]?.total_views || 1;
                      const pct = item.total_views / maxViews * 100;
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                      return (
                        <div key={item.page_path} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-8 text-right shrink-0">{medal || `#${index + 1}`}</span>
                                <div className="min-w-0">
                                  <span className="font-medium text-sm block truncate">{item.titulo}</span>
                                  <span className="text-xs text-muted-foreground">{item.tipo}</span>
                                </div>
                              </div>
                              <Badge className="text-xs shrink-0 ml-2">{item.total_views} views</Badge>
                            </div>
                            <Progress value={pct} className="h-2" />
                            <div className="flex gap-2 text-xs">
                              <Badge variant="outline">{item.usuarios_unicos} usuários</Badge>
                              <Badge variant="outline">⏱ {item.tempo_formatado}</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{item.page_path}</p>
                          </div>);

                    })}
                    </div>
                  </ScrollArea> :

                <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                }
              </CardContent>
            </Card>

            {/* Ranking Usuários que mais acessam aulas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Usuários Mais Engajados em Aulas
                  </div>
                  <Badge variant="secondary">{rankingUsuarioAulas?.length || 0} alunos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsuarioAulas ?
                <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div> :
                rankingUsuarioAulas && rankingUsuarioAulas.length > 0 ?
                <ScrollArea className="max-h-[500px]">
                    <div className="space-y-3 pr-4">
                      {rankingUsuarioAulas.map((item, index) => {
                      const maxViews = rankingUsuarioAulas[0]?.total_views_aulas || 1;
                      const pct = item.total_views_aulas / maxViews * 100;
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                      return (
                        <div key={item.user_id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg w-8 text-right shrink-0">{medal || `#${index + 1}`}</span>
                                <div className="min-w-0">
                                  <span className="font-medium block truncate">{item.nome}</span>
                                  <span className="text-xs text-muted-foreground truncate block">{item.email}</span>
                                </div>
                              </div>
                              <Badge className="text-xs shrink-0 ml-2">{item.total_views_aulas} views</Badge>
                            </div>
                            <Progress value={pct} className="h-2" />
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">{item.total_aulas_acessadas} aulas distintas</Badge>
                              <Badge variant="outline">⏱ {item.tempo_formatado}</Badge>
                            </div>
                            {item.aulas_distintas && item.aulas_distintas.length > 0 &&
                          <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Aulas:</span>{' '}
                                {item.aulas_distintas.map((a) => decodeURIComponent(a)).join(', ')}
                              </div>
                          }
                          </div>);

                    })}
                    </div>
                  </ScrollArea> :

                <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                }
              </CardContent>
            </Card>

            {/* Grid: Áreas + Funções */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Áreas Mais Acessadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Áreas Mais Acessadas
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAreas ?
                  <div className="flex justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div> :
                  rankingAreas && rankingAreas.length > 0 ?
                  <div className="space-y-3">
                      {rankingAreas.map((item, index) => {
                      const maxCount = rankingAreas[0]?.count || 1;
                      const pct = item.count / maxCount * 100;
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                      return (
                        <div key={item.area} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-6 text-right">{medal || `#${index + 1}`}</span>
                                <span className="font-medium">{item.area}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{item.usuarios_unicos} usuários</span>
                                <span className="text-xs text-muted-foreground">{item.percentual.toFixed(1)}%</span>
                                <Badge variant="secondary">{item.count.toLocaleString('pt-BR')}</Badge>
                              </div>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </div>);

                    })}
                    </div> :

                  <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                  }
                </CardContent>
              </Card>

              {/* Funções Mais Utilizadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-primary" />
                      Funções Mais Utilizadas
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingFuncoes ?
                  <div className="flex justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div> :
                  rankingFuncoes && rankingFuncoes.length > 0 ?
                  <div className="space-y-3">
                      {rankingFuncoes.map((item, index) => {
                      const maxCount = rankingFuncoes[0]?.count || 1;
                      const pct = item.count / maxCount * 100;
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                      return (
                        <div key={item.funcao} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-6 text-right">{medal || `#${index + 1}`}</span>
                                <span className="font-medium">{item.funcao}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{item.usuarios_unicos} usuários</span>
                                <span className="text-xs text-muted-foreground">{item.percentual.toFixed(1)}%</span>
                                <Badge variant="secondary">{item.count.toLocaleString('pt-BR')}</Badge>
                              </div>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </div>);

                    })}
                    </div> :

                  <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                  }
                </CardContent>
              </Card>
            </div>

            {/* Ranking Fidelidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Ranking de Fidelidade
                  </div>
                  <Badge variant="secondary">{rankingFidelidade?.length || 0} usuários</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingFidelidade ?
                <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div> :
                rankingFidelidade && rankingFidelidade.length > 0 ?
                <ScrollArea className="max-h-[500px]">
                    <div className="space-y-3 pr-4">
                      {rankingFidelidade.map((item, index) => {
                      const maxDias = rankingFidelidade[0]?.dias_ativos || 1;
                      const pct = item.dias_ativos / maxDias * 100;
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                      return (
                        <div key={item.user_id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg w-8 text-right shrink-0">{medal || `#${index + 1}`}</span>
                                <div className="min-w-0">
                                  <span className="font-medium block truncate">{item.nome}</span>
                                  <span className="text-xs text-muted-foreground truncate block">{item.email}</span>
                                </div>
                              </div>
                              <Badge className="text-sm shrink-0 ml-2">{item.dias_ativos}d</Badge>
                            </div>
                            <Progress value={pct} className="h-2" />
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">{item.total_page_views} views</Badge>
                              <Badge variant="outline">{item.dias_ativos}d ativos</Badge>
                              {item.intencao && <Badge variant="outline" className="capitalize">{item.intencao}</Badge>}
                            </div>
                          </div>);

                    })}
                    </div>
                  </ScrollArea> :

                <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                }
              </CardContent>
            </Card>

            {/* Lista completa de todos usuários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Todos os Usuários Cadastrados
                  </div>
                  <Badge variant="secondary">{todosUsuarios?.length || 0} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTodos ?
                <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div> :
                todosUsuarios && todosUsuarios.length > 0 ?
                <ScrollArea className="max-h-[500px]">
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Perfil</TableHead>
                            <TableHead>Dispositivo</TableHead>
                            <TableHead>Cadastro</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {todosUsuarios.map((u, i) =>
                        <TableRow key={u.user_id}>
                              <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="font-medium text-sm">{u.nome || '—'}</TableCell>
                              <TableCell className="text-sm">{u.email || '—'}</TableCell>
                              <TableCell className="text-sm">{u.telefone || '—'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">{u.intencao || '—'}</Badge>
                              </TableCell>
                              <TableCell className="text-xs">{u.dispositivo || '—'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {u.cadastro ? format(new Date(u.cadastro), 'dd/MM/yyyy') : '—'}
                              </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="md:hidden space-y-3 pr-4">
                      {todosUsuarios.map((u, i) =>
                    <div key={u.user_id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">{u.nome || 'Sem nome'}</span>
                            <span className="text-xs text-muted-foreground">#{i + 1}</span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          <div className="flex gap-2">
                            {u.intencao && <Badge variant="outline" className="text-[10px] capitalize">{u.intencao}</Badge>}
                            {u.dispositivo && <Badge variant="outline" className="text-[10px]">{u.dispositivo}</Badge>}
                          </div>
                        </div>
                    )}
                    </div>
                  </ScrollArea> :

                <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                }
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Engajamento */}
          <TabsContent value="engajamento" className="space-y-6">
            <AdminEngajamentoTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>);

};

export default AdminControle;