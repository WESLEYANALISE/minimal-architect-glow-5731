import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Preços estimados por 1K tokens (em BRL)
const PRECOS = {
  'gemini-2.5-flash-lite': { input: 0.0004, output: 0.0024 },
  'default': { input: 0.001, output: 0.003 },
};

export function useTokenUsageStats(periodo: string = '7d') {
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    switch (periodo) {
      case 'hoje': start.setHours(0, 0, 0, 0); break;
      case '7d': start.setDate(now.getDate() - 7); break;
      case '30d': start.setDate(now.getDate() - 30); break;
      case '90d': start.setDate(now.getDate() - 90); break;
      default: start.setDate(now.getDate() - 7);
    }
    return { start: start.toISOString(), end: now.toISOString() };
  };

  const { start, end } = getDateRange();

  const resumoQuery = useQuery({
    queryKey: ['token-usage-resumo', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_token_usage')
        .select('input_tokens, output_tokens, total_tokens, custo_estimado_brl, sucesso')
        .gte('created_at', start)
        .lte('created_at', end);

      if (error) throw error;

      const totalChamadas = data?.length || 0;
      const totalTokens = data?.reduce((s, r) => s + (r.total_tokens || 0), 0) || 0;
      const custoTotal = data?.reduce((s, r) => s + Number(r.custo_estimado_brl || 0), 0) || 0;
      const erros = data?.filter(r => !r.sucesso).length || 0;

      return { totalChamadas, totalTokens, custoTotal, erros };
    },
    staleTime: 5 * 60 * 1000,
  });

  const topFunctionsQuery = useQuery({
    queryKey: ['token-usage-top-functions', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_token_usage')
        .select('edge_function, total_tokens, custo_estimado_brl')
        .gte('created_at', start)
        .lte('created_at', end);

      if (error) throw error;

      const grouped: Record<string, { chamadas: number; tokens: number; custo: number }> = {};
      data?.forEach(r => {
        if (!grouped[r.edge_function]) grouped[r.edge_function] = { chamadas: 0, tokens: 0, custo: 0 };
        grouped[r.edge_function].chamadas++;
        grouped[r.edge_function].tokens += r.total_tokens || 0;
        grouped[r.edge_function].custo += Number(r.custo_estimado_brl || 0);
      });

      return Object.entries(grouped)
        .map(([fn, stats]) => ({ edge_function: fn, ...stats }))
        .sort((a, b) => b.custo - a.custo);
    },
    staleTime: 5 * 60 * 1000,
  });

  const topUsersQuery = useQuery({
    queryKey: ['token-usage-top-users', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_token_usage')
        .select('user_id, total_tokens, custo_estimado_brl')
        .gte('created_at', start)
        .lte('created_at', end)
        .not('user_id', 'is', null);

      if (error) throw error;

      const grouped: Record<string, { chamadas: number; tokens: number; custo: number }> = {};
      data?.forEach(r => {
        const uid = r.user_id || 'unknown';
        if (!grouped[uid]) grouped[uid] = { chamadas: 0, tokens: 0, custo: 0 };
        grouped[uid].chamadas++;
        grouped[uid].tokens += r.total_tokens || 0;
        grouped[uid].custo += Number(r.custo_estimado_brl || 0);
      });

      // Buscar emails dos usuários
      const userIds = Object.keys(grouped);
      let profiles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, nome')
          .in('id', userIds);
        profilesData?.forEach(p => {
          profiles[p.id] = p.email || p.nome || p.id;
        });
      }

      return Object.entries(grouped)
        .map(([uid, stats]) => ({ user_id: uid, email: profiles[uid] || uid, ...stats }))
        .sort((a, b) => b.custo - a.custo);
    },
    staleTime: 5 * 60 * 1000,
  });

  const porTipoQuery = useQuery({
    queryKey: ['token-usage-por-tipo', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_token_usage')
        .select('tipo_conteudo, total_tokens, custo_estimado_brl')
        .gte('created_at', start)
        .lte('created_at', end);

      if (error) throw error;

      const grouped: Record<string, { chamadas: number; tokens: number; custo: number }> = {};
      data?.forEach(r => {
        const tipo = r.tipo_conteudo || 'texto';
        if (!grouped[tipo]) grouped[tipo] = { chamadas: 0, tokens: 0, custo: 0 };
        grouped[tipo].chamadas++;
        grouped[tipo].tokens += r.total_tokens || 0;
        grouped[tipo].custo += Number(r.custo_estimado_brl || 0);
      });

      return Object.entries(grouped)
        .map(([tipo, stats]) => ({ tipo, ...stats }))
        .sort((a, b) => b.custo - a.custo);
    },
    staleTime: 5 * 60 * 1000,
  });

  const porModeloQuery = useQuery({
    queryKey: ['token-usage-por-modelo', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_token_usage')
        .select('model, total_tokens, custo_estimado_brl')
        .gte('created_at', start)
        .lte('created_at', end);

      if (error) throw error;

      const grouped: Record<string, { chamadas: number; tokens: number; custo: number }> = {};
      data?.forEach(r => {
        const model = r.model || 'desconhecido';
        if (!grouped[model]) grouped[model] = { chamadas: 0, tokens: 0, custo: 0 };
        grouped[model].chamadas++;
        grouped[model].tokens += r.total_tokens || 0;
        grouped[model].custo += Number(r.custo_estimado_brl || 0);
      });

      return Object.entries(grouped)
        .map(([model, stats]) => ({ model, ...stats }))
        .sort((a, b) => b.custo - a.custo);
    },
    staleTime: 5 * 60 * 1000,
  });

  const porChaveQuery = useQuery({
    queryKey: ['token-usage-por-chave', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_token_usage')
        .select('api_key_index, total_tokens, custo_estimado_brl, sucesso')
        .gte('created_at', start)
        .lte('created_at', end)
        .not('api_key_index', 'is', null);

      if (error) throw error;

      const grouped: Record<number, { chamadas: number; tokens: number; custo: number; erros: number }> = {};
      data?.forEach(r => {
        const key = r.api_key_index!;
        if (!grouped[key]) grouped[key] = { chamadas: 0, tokens: 0, custo: 0, erros: 0 };
        grouped[key].chamadas++;
        grouped[key].tokens += r.total_tokens || 0;
        grouped[key].custo += Number(r.custo_estimado_brl || 0);
        if (!r.sucesso) grouped[key].erros++;
      });

      return Object.entries(grouped)
        .map(([key, stats]) => ({ chave: `GEMINI_KEY_${key}`, ...stats }))
        .sort((a, b) => b.chamadas - a.chamadas);
    },
    staleTime: 5 * 60 * 1000,
  });

  const consumoDiarioQuery = useQuery({
    queryKey: ['token-usage-diario', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_token_usage')
        .select('created_at, custo_estimado_brl, total_tokens')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const porDia: Record<string, { custo: number; tokens: number; chamadas: number }> = {};
      data?.forEach(r => {
        const dia = new Date(r.created_at).toISOString().split('T')[0];
        if (!porDia[dia]) porDia[dia] = { custo: 0, tokens: 0, chamadas: 0 };
        porDia[dia].custo += Number(r.custo_estimado_brl || 0);
        porDia[dia].tokens += r.total_tokens || 0;
        porDia[dia].chamadas++;
      });

      return Object.entries(porDia)
        .map(([dia, stats]) => ({ dia, ...stats }))
        .sort((a, b) => a.dia.localeCompare(b.dia));
    },
    staleTime: 5 * 60 * 1000,
  });

  const logDetalhadoQuery = useQuery({
    queryKey: ['token-usage-log', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_token_usage')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    resumo: resumoQuery,
    topFunctions: topFunctionsQuery,
    topUsers: topUsersQuery,
    porTipo: porTipoQuery,
    porModelo: porModeloQuery,
    porChave: porChaveQuery,
    consumoDiario: consumoDiarioQuery,
    logDetalhado: logDetalhadoQuery,
  };
}
