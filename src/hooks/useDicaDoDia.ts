import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DicaDoDia {
  id: number;
  data: string;
  livro_id: number;
  biblioteca: string;
  livro_titulo: string;
  livro_autor: string | null;
  livro_capa: string | null;
  livro_sobre: string | null;
  porque_ler: string;
  frase_dia: string | null;
  dica_estudo: string | null;
  area_livro: string | null;
  audio_url: string | null;
  audio_duracao_segundos: number | null;
  status: string;
  liberado_em: string | null;
  created_at: string;
}

export function useDicaHoje() {
  return useQuery({
    queryKey: ['dica-do-dia-hoje'],
    queryFn: async (): Promise<DicaDoDia | null> => {
      const now = new Date();
      const brasiliaOffset = -3 * 60;
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const brasiliaDate = new Date(utcMs + brasiliaOffset * 60000);
      const dataHoje = brasiliaDate.toISOString().split('T')[0];

      const { data, error } = await (supabase as any)
        .from('dicas_do_dia')
        .select('*')
        .eq('data', dataHoje)
        .eq('status', 'pronto')
        .maybeSingle();

      if (error) throw error;
      
      // Verificar se já foi liberada
      if (data?.liberado_em && new Date(data.liberado_em) > now) {
        return null; // Ainda não liberada
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useDicasMes(ano: number, mes: number) {
  return useQuery({
    queryKey: ['dicas-do-dia-mes', ano, mes],
    queryFn: async (): Promise<DicaDoDia[]> => {
      const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
      // Calcular último dia real do mês
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const fimMes = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

      const { data, error } = await (supabase as any)
        .from('dicas_do_dia')
        .select('*')
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .eq('status', 'pronto')
        .order('data', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnMount: 'always' as const,
  });
}

export function useDicaPorData(data: string | null) {
  return useQuery({
    queryKey: ['dica-do-dia', data],
    queryFn: async (): Promise<DicaDoDia | null> => {
      if (!data) return null;
      const { data: dica, error } = await (supabase as any)
        .from('dicas_do_dia')
        .select('*')
        .eq('data', data)
        .eq('status', 'pronto')
        .maybeSingle();

      if (error) throw error;
      return dica;
    },
    enabled: !!data,
    staleTime: 1000 * 60 * 30,
  });
}
