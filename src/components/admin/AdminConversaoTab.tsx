import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, TrendingUp, Eye, MousePointer, CreditCard, QrCode, ArrowDown, Globe, Zap, Crown, Clock, Route, Users, ChevronDown, ChevronUp, Timer, MapPin, Activity, AlertCircle, CheckCircle, XCircle, FileText, Send, Sparkles, ShoppingCart, DollarSign } from 'lucide-react';
import { useFunilConversao, useGatesPremium, useJornadaPremium, useRetencaoPorFuncao, useFunilDetalhado, useFunnelRealtime, EVENT_LABELS, type FunilEmailEntry } from '@/hooks/useAdminConversao';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Preços atuais dos planos — normaliza valores históricos
const CURRENT_PRICES: Record<string, number> = {
  mensal: 21.90,
  anual: 149.90,
  vitalicio: 249.90,
};

/** Retorna o preço atual do plano, ignorando valores históricos */
const normalizeAmount = (amount: number | null | undefined, planType: string | null | undefined): number | null => {
  if (planType && CURRENT_PRICES[planType]) return CURRENT_PRICES[planType];
  return amount ?? null;
};

interface AdminConversaoTabProps {
  dias: number;
  periodo?: string;
}

const MODAL_TYPE_LABELS: Record<string, string> = {
  floating_card: 'Card Flutuante',
  upgrade_modal: 'Modal Upgrade',
  chat_gate: 'Gate do Chat',
};

// Funnel step config
const FUNNEL_STEP_CONFIG: Record<string, { icon: any; color: string; bg: string; borderColor: string }> = {
  visited_assinatura: { icon: Eye, color: 'text-sky-400', bg: 'bg-sky-500/10', borderColor: 'border-sky-500/30' },
  selected_plan: { icon: MousePointer, color: 'text-violet-400', bg: 'bg-violet-500/10', borderColor: 'border-violet-500/30' },
  abriu_checkout: { icon: ShoppingCart, color: 'text-orange-400', bg: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  form_filled: { icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  payment_sent: { icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  subscribed: { icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
};

const EVENT_ICONS: Record<string, typeof Eye> = {
  page_enter: MapPin,
  page_leave: Clock,
  plan_tab_switch: MousePointer,
  plan_modal_open: Sparkles,
  payment_method_select: MousePointer,
  pix_generated: QrCode,
  card_initiated: CreditCard,
  card_form_filled: FileText,
  card_form_progress: FileText,
  card_payment_success: CheckCircle,
  card_payment_error: AlertCircle,
  payment_completed: Crown,
};

const EVENT_COLORS: Record<string, string> = {
  page_enter: 'text-sky-400',
  page_leave: 'text-zinc-400',
  plan_tab_switch: 'text-violet-400',
  plan_modal_open: 'text-amber-400',
  payment_method_select: 'text-orange-400',
  pix_generated: 'text-emerald-400',
  card_initiated: 'text-blue-400',
  card_form_filled: 'text-orange-400',
  card_form_progress: 'text-yellow-400',
  card_payment_success: 'text-emerald-500',
  card_payment_error: 'text-red-400',
  payment_completed: 'text-emerald-500',
};

const AdminConversaoTab = ({ dias, periodo }: AdminConversaoTabProps) => {
  const { data: funil, isLoading: loadingFunil } = useFunilConversao(dias, periodo);
  const { data: gates, isLoading: loadingGates } = useGatesPremium(dias, periodo);
  const { data: jornada, isLoading: loadingJornada } = useJornadaPremium();
  const { data: retencao, isLoading: loadingRetencao } = useRetencaoPorFuncao(dias, periodo);
  const { data: detalhado, isLoading: loadingDetalhado } = useFunilDetalhado(dias, periodo);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Ativar realtime
  useFunnelRealtime(dias, periodo);

  return (
    <div className="space-y-4">

      {/* ===== FUNIL DE CONVERSÃO PREMIUM ===== */}
      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            Funil de Conversão Premium
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Badge variant="secondary" className="text-[10px]">Tempo real</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-3">
          {loadingFunil ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : funil && funil.length > 0 ? (
            <div className="space-y-0.5">
              {funil.map((item, i) => {
                const config = FUNNEL_STEP_CONFIG[item.action] || { icon: Eye, color: 'text-zinc-400', bg: 'bg-zinc-500/10', borderColor: 'border-zinc-500/30' };
                const Icon = config.icon;
                const isExp = expandedStep === item.action;
                const hasEm = item.emails && item.emails.length > 0;

                return (
                  <div key={item.action}>
                    {i > 0 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div 
                      className={`rounded-lg p-2.5 sm:p-3 ${config.bg} border ${config.borderColor} cursor-pointer transition-all hover:brightness-110`}
                      onClick={() => hasEm && setExpandedStep(isExp ? null : item.action)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-background/50 shrink-0">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs sm:text-sm font-medium leading-tight">{item.label}</span>
                              {hasEm && (isExp ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />)}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              <span className={`text-xl sm:text-2xl font-bold ${config.color}`}>{item.count}</span>
                              {item.totalEvents > item.count && <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1">{item.totalEvents} vezes</Badge>}
                              {hasEm && <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1"><Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />{item.emails!.length}</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Progress value={item.percentual} className="h-1 sm:h-1.5 flex-1" />
                            {item.conversionRate && (
                              <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-400 whitespace-nowrap">
                                {item.conversionRate} conversão
                              </span>
                            )}
                          </div>

                          {/* Total amount for subscribed step */}
                          {item.action === 'subscribed' && item.totalAmount != null && item.totalAmount > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <DollarSign className="h-3 w-3 text-emerald-400" />
                              <span className="text-[11px] text-emerald-400 font-semibold">
                                Total: R$ {item.totalAmount.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          )}

                          {/* Checkout breakdown: PIX vs Cartão summary */}
                          {item.action === 'abriu_checkout' && item.checkoutBreakdown && (
                            <div className="flex items-center gap-2.5 mt-1.5">
                              <div className="flex items-center gap-1">
                                <QrCode className="h-3 w-3 text-emerald-400" />
                                <span className="text-[11px] text-emerald-400 font-medium">PIX: {item.checkoutBreakdown.pix.count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3 text-blue-400" />
                                <span className="text-[11px] text-blue-400 font-medium">Cartão: {item.checkoutBreakdown.cartao.count}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded: Checkout breakdown details */}
                      {isExp && item.action === 'abriu_checkout' && item.checkoutBreakdown && (
                        <div className="mt-2.5 space-y-2.5 border-t border-border/30 pt-2.5">
                          {item.checkoutBreakdown.pix.count > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <QrCode className="h-3 w-3 text-emerald-400" />
                                <span className="text-[11px] font-semibold text-emerald-400">PIX — {item.checkoutBreakdown.pix.count} usuários ({item.checkoutBreakdown.pix.totalEvents} vezes)</span>
                              </div>
                              {renderDetailedEmailList(item.checkoutBreakdown.pix.emails)}
                            </div>
                          )}
                          {item.checkoutBreakdown.cartao.count > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <CreditCard className="h-3 w-3 text-blue-400" />
                                <span className="text-[11px] font-semibold text-blue-400">Cartão de Crédito — {item.checkoutBreakdown.cartao.count} usuários ({item.checkoutBreakdown.cartao.totalEvents} vezes)</span>
                              </div>
                              {renderDetailedEmailList(item.checkoutBreakdown.cartao.emails)}
                            </div>
                          )}
                          {item.cardSubSteps && renderCardSubSteps(item.cardSubSteps)}
                        </div>
                      )}

                      {/* Expanded: regular email list for other steps */}
                      {isExp && item.action !== 'abriu_checkout' && hasEm && renderDetailedEmailList(item.emails!)}
                      {isExp && item.action !== 'abriu_checkout' && item.cardSubSteps && renderCardSubSteps(item.cardSubSteps)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum dado de funil no período</p>
          )}
        </CardContent>
      </Card>

      {/* ===== TIMELINE EM TEMPO REAL ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            Atividade em Tempo Real
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDetalhado ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detalhado?.timeline && detalhado.timeline.length > 0 ? (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-1.5 pr-2">
                {detalhado.timeline.map((event, index) => {
                  const Icon = EVENT_ICONS[event.event_type] || Eye;
                  const color = EVENT_COLORS[event.event_type] || 'text-zinc-400';
                  const isRecent = index < 3 && new Date(event.created_at).getTime() > Date.now() - 5 * 60 * 1000;
                  return (
                    <div key={event.id} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${isRecent ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/20 hover:bg-secondary/40'}`}>
                      <div className={`mt-0.5 ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{event.user_nome || event.user_email || 'Anônimo'}</span>
                          <span className="text-xs text-muted-foreground">{EVENT_LABELS[event.event_type] || event.event_type}</span>
                          {isRecent && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {event.plan_type && <Badge variant="outline" className="text-[9px] capitalize">{event.plan_type}</Badge>}
                          {event.payment_method && (
                            <Badge variant="outline" className="text-[9px] uppercase">
                              {event.payment_method === 'pix' ? '🟢 PIX' : event.payment_method === 'cartao' ? '💳 Cartão' : event.payment_method}
                            </Badge>
                          )}
                          {event.amount && (() => { const norm = normalizeAmount(event.amount, event.plan_type); return norm ? <span className="text-[10px] text-emerald-400 font-medium">R$ {norm.toFixed(2).replace('.', ',')}</span> : null; })()}
                          {event.duration_seconds && <span className="text-[10px] text-sky-400">{event.duration_seconds}s na tela</span>}
                          {event.referrer_page && event.event_type === 'page_enter' && <span className="text-[10px] text-muted-foreground">veio de {event.referrer_page}</span>}
                          {event.device && <span className="text-[10px] text-muted-foreground">{event.device}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum evento registrado no período</p>
          )}
        </CardContent>
      </Card>

      {/* ===== JORNADA POR USUÁRIO ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="h-5 w-5 text-primary" />
            Jornada Detalhada por Usuário
            {detalhado?.journeys && <Badge variant="secondary" className="text-[10px]">{detalhado.journeys.length} usuários</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDetalhado ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detalhado?.journeys && detalhado.journeys.length > 0 ? (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-2 pr-2">
                {detalhado.journeys.map((journey) => {
                  const isExpanded = expandedUser === journey.user_id;
                  return (
                    <div key={journey.user_id} className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedUser(isExpanded ? null : journey.user_id)}
                        className="w-full p-3 text-left bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <span className="font-medium text-sm block truncate">{journey.nome || journey.email || 'Sem nome'}</span>
                            {journey.email && journey.nome && (
                              <span className="text-xs text-muted-foreground truncate block">{journey.email}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <Badge variant="outline" className="text-[10px]">{journey.final_status}</Badge>
                            {journey.total_duration && (
                              <Badge variant="outline" className="text-[10px]">
                                <Timer className="h-3 w-3 mr-1" />
                                {journey.total_duration}s
                              </Badge>
                            )}
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </div>
                        </div>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {journey.plans_viewed.map(p => (
                            <Badge key={p} variant="secondary" className="text-[9px] capitalize">{p}</Badge>
                          ))}
                          {journey.payment_methods.map(m => (
                            <Badge key={m} variant="secondary" className="text-[9px] uppercase">
                              {m === 'pix' ? '🟢 PIX' : m === 'cartao' ? '💳 Cartão' : m}
                            </Badge>
                          ))}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-3 border-t border-border bg-background/50">
                          <div className="space-y-1">
                            {journey.events.map((ev) => {
                              const Icon = EVENT_ICONS[ev.event_type] || Eye;
                              const color = EVENT_COLORS[ev.event_type] || 'text-zinc-400';
                              return (
                                <div key={ev.id} className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                                  <span className="text-muted-foreground w-14 shrink-0 text-right">
                                    {format(new Date(ev.created_at), 'HH:mm:ss')}
                                  </span>
                                  <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
                                  <span className="break-all">{EVENT_LABELS[ev.event_type] || ev.event_type}</span>
                                  {ev.plan_type && <Badge variant="outline" className="text-[8px] capitalize">{ev.plan_type}</Badge>}
                                  {ev.payment_method && <Badge variant="outline" className="text-[8px] uppercase">{ev.payment_method}</Badge>}
                                  {ev.amount && (() => { const norm = normalizeAmount(ev.amount, ev.plan_type); return norm ? <span className="text-emerald-400">R$ {norm.toFixed(2).replace('.', ',')}</span> : null; })()}
                                  {ev.duration_seconds && <span className="text-sky-400">{ev.duration_seconds}s</span>}
                                  {ev.referrer_page && ev.event_type === 'page_enter' && <span className="text-muted-foreground break-all">de {ev.referrer_page}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum dado de jornada no período</p>
          )}
        </CardContent>
      </Card>

      {/* ===== TOP REFERRERS ===== */}
      {detalhado?.metrics?.top_referrers && detalhado.metrics.top_referrers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              Top 5 Páginas de Origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {detalhado.metrics.top_referrers.map((ref, i) => (
                <div key={ref.page} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                    <span className="text-xs truncate">{ref.page}</span>
                  </div>
                  <Badge variant="outline" className="shrink-0 ml-2">{ref.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gates Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-primary" />
              Gates por Tipo
              {gates && <Badge variant="secondary" className="text-[10px]">{gates.total} total</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingGates ? (
              <div className="flex justify-center py-4"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : gates?.porTipo && gates.porTipo.length > 0 ? (
              <div className="space-y-2">
                {gates.porTipo.map(item => (
                  <div key={item.modal_type} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <span className="text-sm">{MODAL_TYPE_LABELS[item.modal_type] || item.modal_type}</span>
                    <Badge>{item.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4 text-sm">Sem dados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-primary" />
              Top Páginas que Geram Modal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingGates ? (
              <div className="flex justify-center py-4"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : gates?.porPagina && gates.porPagina.length > 0 ? (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2 pr-2">
                  {gates.porPagina.map((item, i) => (
                    <div key={item.source_page} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                        <span className="text-xs truncate">{item.source_page}</span>
                      </div>
                      <Badge variant="outline" className="shrink-0 ml-2">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-4 text-sm">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features que ativam gate */}
      {gates?.porFeature && gates.porFeature.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              Recursos que Ativam Gate Premium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {gates.porFeature.map((item) => (
                <div key={item.source_feature} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                  <span className="text-xs truncate">{item.source_feature}</span>
                  <Badge variant="outline" className="shrink-0 ml-2">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jornada do Premium */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="h-5 w-5 text-primary" />
            Jornada até o Premium
            {jornada && <Badge variant="secondary" className="text-[10px]">{jornada.length} assinantes</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingJornada ? (
            <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : jornada && jornada.length > 0 ? (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3 pr-2">
                {jornada.map((item) => (
                  <div key={item.user_id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-medium text-sm block truncate">{item.nome || item.email || 'Sem nome'}</span>
                        {item.email && item.nome && <span className="text-xs text-muted-foreground truncate block">{item.email}</span>}
                      </div>
                      <Badge variant="outline" className="shrink-0 ml-2 text-[10px]"><Crown className="h-3 w-3 mr-1" />{item.plano}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />{item.dias_ate_assinar} dias até assinar</Badge>
                      {item.ultimo_gate && <Badge variant="outline" className="text-[10px]">Último gate: {MODAL_TYPE_LABELS[item.ultimo_gate] || item.ultimo_gate}</Badge>}
                      <span className="text-muted-foreground">Assinou: {format(new Date(item.data_assinatura), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    {item.paginas_mais_visitadas.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Top páginas:</span> {item.paginas_mais_visitadas.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum assinante encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* Ranking de Retenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-primary" />
            Ranking de Retenção por Função
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRetencao ? (
            <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : retencao && retencao.length > 0 ? (
            <div className="space-y-3">
              {retencao.map((item, index) => {
                const maxUsers = retencao[0]?.usuarios_unicos || 1;
                const pct = (item.usuarios_unicos / maxUsers) * 100;
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                return (
                  <div key={item.funcao} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-right">{medal || `#${index + 1}`}</span>
                        <span className="font-medium">{item.funcao}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.percentual_retorno}% dos usuários</span>
                        <Badge variant="secondary">{item.usuarios_unicos}</Badge>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Sem dados de retenção</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const PLAN_LABELS: Record<string, string> = {
  mensal: 'Plano Mensal',
  anual: 'Plano Anual',
  anual_oferta: 'Plano Anual (Oferta)',
  essencial: 'Plano Essencial',
  pro: 'Plano Pro',
  vitalicio: 'Plano Vitalício',
  trimestral: 'Plano Trimestral',
  semestral: 'Plano Semestral',
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: '🟢 PIX',
  cartao: '💳 Cartão de Crédito',
  credit_card: '💳 Cartão de Crédito',
  card: '💳 Cartão de Crédito',
};

function renderDetailedEmailList(emails: FunilEmailEntry[]) {
  return (
    <div className="mt-3 pl-2 sm:pl-10 space-y-1.5 max-h-64 overflow-y-auto overflow-x-auto">
      {emails.map((entry, ei) => (
        <div key={ei} className="text-xs text-muted-foreground space-y-0.5">
          <div className="flex items-start gap-1.5">
            {entry.lastTime && (
              <span className="text-[10px] text-amber-400 font-semibold shrink-0 w-12 font-mono">{entry.lastTime}</span>
            )}
            <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 mt-1" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-foreground/80">{entry.email}</span>
                {entry.count > 1 && (
                  <Badge variant="outline" className="text-[9px] shrink-0">{entry.count} vezes</Badge>
                )}
              </div>
              {(entry.planType || entry.amount || entry.paymentMethod) && (
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  {entry.planType && (
                    <Badge variant="secondary" className="text-[9px]">
                      {PLAN_LABELS[entry.planType] || entry.planType}
                    </Badge>
                  )}
                  {entry.paymentMethod && (
                    <Badge variant="outline" className="text-[9px]">
                      {PAYMENT_LABELS[entry.paymentMethod] || entry.paymentMethod}
                    </Badge>
                  )}
                  {entry.amount && entry.amount > 0 && (
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      R$ {entry.amount.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper: render card sub-steps
function renderCardSubSteps(cardSubSteps: { formFilled: any[]; success: any[]; error: any[] }) {
  if (!cardSubSteps.formFilled.length && !cardSubSteps.success.length && !cardSubSteps.error.length) return null;
  return (
    <div className="mt-3 pl-2 sm:pl-10 space-y-2">
      {cardSubSteps.formFilled.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="h-3 w-3 text-orange-400" />
            <span className="text-[10px] font-semibold text-orange-400">Enviou dados ({cardSubSteps.formFilled.length})</span>
          </div>
          {cardSubSteps.formFilled.map((entry: any, i: number) => (
            <div key={`ff-${i}`} className="text-xs text-muted-foreground flex items-center gap-1 ml-4">
              {entry.lastTime && <span className="text-[10px] text-amber-400 font-semibold shrink-0 w-10 font-mono">{entry.lastTime}</span>}
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
              <span className="truncate">{entry.email}</span>
            </div>
          ))}
        </div>
      )}
      {cardSubSteps.success.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400">Aprovado ({cardSubSteps.success.length})</span>
          </div>
          {cardSubSteps.success.map((entry: any, i: number) => (
            <div key={`cs-${i}`} className="text-xs text-muted-foreground flex items-center gap-1 ml-4">
              {entry.lastTime && <span className="text-[10px] text-amber-400 font-semibold shrink-0 w-10 font-mono">{entry.lastTime}</span>}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="truncate">{entry.email}</span>
              {entry.metadata?.status && (
                <Badge className="text-[8px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{entry.metadata.status}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
      {cardSubSteps.error.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <XCircle className="h-3 w-3 text-red-400" />
            <span className="text-[10px] font-semibold text-red-400">Recusado ({cardSubSteps.error.length})</span>
          </div>
          {cardSubSteps.error.map((entry: any, i: number) => (
            <div key={`ce-${i}`} className="text-xs text-muted-foreground flex items-center gap-1 ml-4">
              {entry.lastTime && <span className="text-[10px] text-amber-400 font-semibold shrink-0 w-10 font-mono">{entry.lastTime}</span>}
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span className="truncate">{entry.email}</span>
              {entry.metadata?.error_message && (
                <Badge className="text-[8px] bg-red-500/20 text-red-400 border-red-500/30 max-w-[200px] truncate">{entry.metadata.error_message}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminConversaoTab;
