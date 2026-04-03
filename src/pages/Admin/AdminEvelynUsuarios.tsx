import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Search, Loader2, Crown, Star, Users, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const QUERY_KEY = "admin-evelyn-usuarios-v3";

const normalizarTelefone = (telefone?: string | null): string => {
  if (!telefone) return "";
  let numeros = telefone.replace(/\D/g, "");
  if (numeros.length > 13 && numeros.startsWith("55")) {
    const sem55 = numeros.slice(2);
    if ((sem55.startsWith("55") && sem55.length >= 12 && sem55.length <= 13) || (sem55.length >= 10 && sem55.length <= 11)) {
      numeros = sem55;
    }
  }
  if (numeros.startsWith("55") && numeros.length >= 12 && numeros.length <= 13) return numeros;
  if (numeros.length >= 10 && numeros.length <= 11) return `55${numeros}`;
  return numeros;
};

const formatarTelefone = (telefone: string) => {
  const num = telefone.startsWith("55") ? telefone : `55${telefone}`;
  const semPais = num.slice(2);
  if (semPais.length === 11) return `+55 (${semPais.slice(0, 2)}) ${semPais.slice(2, 7)}-${semPais.slice(7)}`;
  if (semPais.length === 10) return `+55 (${semPais.slice(0, 2)}) ${semPais.slice(2, 6)}-${semPais.slice(6)}`;
  return `+${num}`;
};

async function fetchAllPaginated<T>(
  table: string,
  select: string,
  filters?: (q: any) => any
): Promise<T[]> {
  const PAGE = 1000;
  let all: T[] = [];
  let from = 0;
  while (true) {
    let q = (supabase.from as any)(table).select(select).range(from, from + PAGE - 1);
    if (filters) q = filters(q);
    const { data, error } = await q;
    if (error) throw error;
    all = all.concat((data || []) as T[]);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

interface Assinante {
  id: string;
  nome: string | null;
  telefone: string;
  telefone_formatado: string;
  sem_telefone: boolean;
  ativo_evelyn: boolean;
  ultima_mensagem: string | null;
  total_mensagens: number;
  plano: string | null;
  expiration_date: string | null;
}

interface NaoPremium {
  telefone: string;
  telefone_formatado: string;
  nome_whatsapp: string | null;
  total_mensagens: number;
  ultima_mensagem: string | null;
  mensagens_recentes: { remetente: string; conteudo: string; created_at: string }[];
  expanded?: boolean;
}

const AdminEvelynUsuarios = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [tab, setTab] = useState("assinantes");
  const queryClient = useQueryClient();

  useEffect(() => {
    const channels = [
      supabase.channel('admin-evelyn-v3-profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        }).subscribe(),
      supabase.channel('admin-evelyn-v3-subs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        }).subscribe(),
    ];
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [queryClient]);

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY],
    refetchInterval: 30000,
    queryFn: async () => {
      // 1) Active subscribers
      const subs = await fetchAllPaginated<{
        user_id: string; status: string; plan_id: string | null; expiration_date: string | null;
      }>('subscriptions', 'user_id, status, plan_id, expiration_date',
        (q: any) => q.in('status', ['authorized', 'active', 'approved'])
      );

      const activeSubMap = new Map<string, typeof subs[0]>();
      subs.forEach(s => {
        if (!s.expiration_date || new Date(s.expiration_date) > new Date()) {
          activeSubMap.set(s.user_id, s);
        }
      });

      // 2) Profiles of subscribers
      const subUserIds = Array.from(activeSubMap.keys());
      const profiles = await fetchAllPaginated<{
        id: string; nome: string | null; telefone: string | null;
      }>('profiles', 'id, nome, telefone');

      const profileMap = new Map(profiles.map(p => [p.id, p]));

      // 3) Evelyn data
      const evelynUsuarios = await fetchAllPaginated<{
        telefone: string; nome: string | null; total_mensagens: number; ultimo_contato: string | null;
      }>('evelyn_usuarios', 'telefone, nome, total_mensagens, ultimo_contato');
      const evelynMap = new Map<string, typeof evelynUsuarios[0]>();
      evelynUsuarios.forEach(e => {
        const tel = normalizarTelefone(e.telefone);
        if (tel) evelynMap.set(tel, e);
      });

      // Build subscriber list
      const assinantes: Assinante[] = [];
      const subscriberPhones = new Set<string>();

      subUserIds.forEach(uid => {
        const profile = profileMap.get(uid);
        const sub = activeSubMap.get(uid)!;
        const tel = normalizarTelefone(profile?.telefone);
        if (tel) subscriberPhones.add(tel);

        const evelyn = tel ? evelynMap.get(tel) : undefined;

        assinantes.push({
          id: uid,
          nome: profile?.nome || null,
          telefone: tel || '',
          telefone_formatado: tel ? formatarTelefone(tel) : 'Sem telefone',
          sem_telefone: !tel,
          ativo_evelyn: !!evelyn && !!evelyn.ultimo_contato,
          ultima_mensagem: evelyn?.ultimo_contato || null,
          total_mensagens: evelyn?.total_mensagens || 0,
          plano: sub.plan_id,
          expiration_date: sub.expiration_date,
        });
      });

      // 4) Non-premium: evelyn users whose phone doesn't match any active subscriber
      const naoPremiumList: NaoPremium[] = [];
      for (const [tel, evelyn] of evelynMap.entries()) {
        if (subscriberPhones.has(tel)) continue;
        if (evelyn.total_mensagens === 0) continue;

        // Fetch last messages for this conversation
        const { data: conversas } = await supabase
          .from('evelyn_conversas')
          .select('id')
          .eq('telefone', evelyn.telefone || tel)
          .order('created_at', { ascending: false })
          .limit(1);

        let mensagens: { remetente: string; conteudo: string; created_at: string }[] = [];
        if (conversas && conversas.length > 0) {
          const { data: msgs } = await supabase
            .from('evelyn_mensagens')
            .select('remetente, conteudo, created_at')
            .eq('conversa_id', conversas[0].id)
            .order('created_at', { ascending: false })
            .limit(6);
          mensagens = (msgs || []).reverse();
        }

        naoPremiumList.push({
          telefone: tel,
          telefone_formatado: formatarTelefone(tel),
          nome_whatsapp: evelyn.nome,
          total_mensagens: evelyn.total_mensagens,
          ultima_mensagem: evelyn.ultimo_contato,
          mensagens_recentes: mensagens,
        });
      }

      return { assinantes, naoPremium: naoPremiumList };
    },
  });

  const [expandedNaoPremium, setExpandedNaoPremium] = useState<Set<string>>(new Set());

  const toggleExpand = (tel: string) => {
    setExpandedNaoPremium(prev => {
      const next = new Set(prev);
      if (next.has(tel)) next.delete(tel); else next.add(tel);
      return next;
    });
  };

  const assinantesFiltrados = useMemo(() => {
    if (!data?.assinantes) return [];
    if (!busca.trim()) return data.assinantes;
    const termo = busca.toLowerCase();
    return data.assinantes.filter(a =>
      a.nome?.toLowerCase().includes(termo) || a.telefone.includes(termo)
    );
  }, [data?.assinantes, busca]);

  const naoPremiumFiltrados = useMemo(() => {
    if (!data?.naoPremium) return [];
    if (!busca.trim()) return data.naoPremium;
    const termo = busca.toLowerCase();
    return data.naoPremium.filter(n =>
      n.nome_whatsapp?.toLowerCase().includes(termo) || n.telefone.includes(termo)
    );
  }, [data?.naoPremium, busca]);

  const semTelefone = assinantesFiltrados.filter(a => a.sem_telefone).length;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-green-500" />
              Evelyn Usuários
            </h1>
            <p className="text-sm text-muted-foreground">
              {data?.assinantes.length || 0} assinantes • {data?.naoPremium.length || 0} não premium
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-10" />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="assinantes" className="flex-1 gap-1">
              <Crown className="h-4 w-4" />
              Assinantes ({data?.assinantes.length || 0})
            </TabsTrigger>
            <TabsTrigger value="nao-premium" className="flex-1 gap-1">
              <Users className="h-4 w-4" />
              Não Premium ({data?.naoPremium.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assinantes">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-2">
                {semTelefone > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-400 font-medium">{semTelefone} assinante{semTelefone > 1 ? 's' : ''} sem telefone cadastrado</span>
                  </div>
                )}

                {assinantesFiltrados.map(a => (
                  <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                    <div className="bg-emerald-500/20 rounded-full p-2 mt-0.5">
                      <Star className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{a.nome || "Sem nome"}</p>
                        <Badge variant="outline" className={a.ativo_evelyn
                          ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                          : "text-muted-foreground border-border"
                        }>
                          {a.ativo_evelyn ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        📱 {a.telefone_formatado}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        {a.total_mensagens > 0 && <span>💬 {a.total_mensagens} msgs</span>}
                        {a.ultima_mensagem && (
                          <span>⏱️ Última: {new Date(a.ultima_mensagem).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        {a.expiration_date && (
                          <span>📅 Expira: {new Date(a.expiration_date).toLocaleDateString("pt-BR")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {assinantesFiltrados.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum assinante encontrado</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="nao-premium">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-2">
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-sm text-orange-400">
                  Usuários que enviaram mensagens mas não possuem assinatura ativa
                </div>

                {naoPremiumFiltrados.map(n => (
                  <div key={n.telefone} className="bg-card border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleExpand(n.telefone)}
                      className="w-full p-4 flex items-start gap-3 text-left"
                    >
                      <div className="bg-orange-500/20 rounded-full p-2 mt-0.5">
                        <MessageCircle className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground truncate">
                            {n.nome_whatsapp || "Sem nome"}
                          </p>
                          <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 text-xs">
                            Não Premium
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">📱 {n.telefone_formatado}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>💬 {n.total_mensagens} msgs</span>
                          {n.ultima_mensagem && (
                            <span>⏱️ {new Date(n.ultima_mensagem).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      </div>
                      {expandedNaoPremium.has(n.telefone) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground mt-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground mt-2" />
                      )}
                    </button>

                    {expandedNaoPremium.has(n.telefone) && n.mensagens_recentes.length > 0 && (
                      <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Últimas mensagens:</p>
                        {n.mensagens_recentes.map((m, i) => (
                          <div key={i} className={`text-xs rounded-lg px-3 py-2 max-w-[85%] ${
                            m.remetente === 'usuario'
                              ? 'bg-green-500/10 text-foreground ml-auto'
                              : 'bg-primary/10 text-foreground'
                          }`}>
                            <p className="text-[10px] text-muted-foreground mb-0.5">
                              {m.remetente === 'usuario' ? '👤 Usuário' : '🤖 Evelyn'} • {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="line-clamp-3">{m.conteudo}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {naoPremiumFiltrados.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum usuário não premium encontrado</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminEvelynUsuarios;
