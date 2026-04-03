import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ===== Tipos =====
export interface MensagemHistorico {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  role: string;
  content: string;
  mode: string | null;
  created_at: string;
}

export interface TopUsuario {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  total: number;
}

export interface EstatisticasProfessora {
  totalMensagens: number;
  usuariosUnicos: number;
  mediaDiaria: number;
}

// ===== Hook: Histórico de mensagens =====
export const useHistoricoProfessora = (page = 0, pageSize = 50, filtroUsuario?: string) => {
  return useQuery({
    queryKey: ['admin-professora-historico', page, pageSize, filtroUsuario],
    queryFn: async (): Promise<{ data: MensagemHistorico[]; count: number }> => {
      let query = supabase
        .from('chat_professora_historico' as any)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filtroUsuario) {
        query = query.or(`user_name.ilike.%${filtroUsuario}%,user_email.ilike.%${filtroUsuario}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data || []) as unknown as MensagemHistorico[], count: count || 0 };
    },
  });
};

// ===== Hook: Top usuários =====
export const useTopUsuariosProfessora = (limite = 20) => {
  return useQuery({
    queryKey: ['admin-professora-top-usuarios', limite],
    queryFn: async (): Promise<TopUsuario[]> => {
      const { data, error } = await supabase
        .from('chat_professora_historico' as any)
        .select('user_id, user_name, user_email')
        .eq('role', 'user');

      if (error) throw error;
      
      // Agrupar por user_id no frontend
      const map = new Map<string, TopUsuario>();
      for (const row of (data || []) as any[]) {
        const existing = map.get(row.user_id);
        if (existing) {
          existing.total++;
        } else {
          map.set(row.user_id, {
            user_id: row.user_id,
            user_name: row.user_name,
            user_email: row.user_email,
            total: 1,
          });
        }
      }
      
      return Array.from(map.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, limite);
    },
  });
};

// ===== Hook: Estatísticas gerais =====
export const useEstatisticasProfessora = () => {
  return useQuery({
    queryKey: ['admin-professora-stats'],
    queryFn: async (): Promise<EstatisticasProfessora> => {
      const { count: totalMensagens } = await supabase
        .from('chat_professora_historico' as any)
        .select('*', { count: 'exact', head: true });

      const { data: usuarios } = await supabase
        .from('chat_professora_historico' as any)
        .select('user_id')
        .eq('role', 'user');

      const uniqueUsers = new Set((usuarios || []).map((u: any) => u.user_id));

      // Calcular média diária
      const { data: firstMsg } = await supabase
        .from('chat_professora_historico' as any)
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1);

      let mediaDiaria = 0;
      if (firstMsg && firstMsg.length > 0 && totalMensagens) {
        const firstDate = new Date((firstMsg[0] as any).created_at);
        const dias = Math.max(1, Math.ceil((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
        mediaDiaria = Math.round(totalMensagens / dias);
      }

      return {
        totalMensagens: totalMensagens || 0,
        usuariosUnicos: uniqueUsers.size,
        mediaDiaria,
      };
    },
  });
};

// ===== Hook: Perguntas frequentes =====
export const usePerguntasFrequentes = (limite = 15) => {
  return useQuery({
    queryKey: ['admin-professora-perguntas', limite],
    queryFn: async (): Promise<{ pergunta: string; count: number }[]> => {
      const { data, error } = await supabase
        .from('chat_professora_historico' as any)
        .select('content')
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Agrupar por palavras-chave simples
      const keywords = new Map<string, number>();
      for (const row of (data || []) as any[]) {
        const content = (row.content || '').toLowerCase().trim();
        if (content.length < 10) continue;
        // Usar primeiras 80 chars como chave simplificada
        const key = content.substring(0, 80);
        keywords.set(key, (keywords.get(key) || 0) + 1);
      }

      return Array.from(keywords.entries())
        .map(([pergunta, count]) => ({ pergunta, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limite);
    },
  });
};
