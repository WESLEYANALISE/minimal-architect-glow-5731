import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FilmeDoDia {
  id: number;
  data: string;
  tmdb_id: number | null;
  titulo: string;
  titulo_original: string | null;
  sinopse: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  trailer_url: string | null;
  imagens_cenas: string[] | null;
  elenco: { nome: string; personagem: string; foto: string | null }[] | null;
  diretor: string | null;
  generos: string[] | null;
  duracao: number | null;
  ano: number | null;
  nota_tmdb: number | null;
  porque_assistir: string | null;
  beneficios_juridicos: string | null;
  frase_dia: string | null;
  audio_url: string | null;
  audio_duracao_segundos: number | null;
  onde_assistir: {
    flatrate?: { provider_id: number; provider_name: string; logo_path: string | null }[];
    rent?: { provider_id: number; provider_name: string; logo_path: string | null }[];
    buy?: { provider_id: number; provider_name: string; logo_path: string | null }[];
    link?: string | null;
  } | null;
  status: string;
  liberado_em: string | null;
  created_at: string;
}

export function useFilmeHoje() {
  return useQuery({
    queryKey: ['filme-do-dia-hoje'],
    queryFn: async (): Promise<FilmeDoDia | null> => {
      const now = new Date();
      const brasiliaOffset = -3 * 60;
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const brasiliaDate = new Date(utcMs + brasiliaOffset * 60000);
      const dataHoje = brasiliaDate.toISOString().split('T')[0];

      const { data, error } = await (supabase as any)
        .from('filmes_do_dia')
        .select('*')
        .eq('data', dataHoje)
        .eq('status', 'pronto')
        .maybeSingle();

      if (error) throw error;
      if (data?.liberado_em && new Date(data.liberado_em) > now) return null;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useFilmesMes(ano: number, mes: number) {
  return useQuery({
    queryKey: ['filmes-do-dia-mes', ano, mes],
    queryFn: async (): Promise<FilmeDoDia[]> => {
      const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const fimMes = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

      const { data, error } = await (supabase as any)
        .from('filmes_do_dia')
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

export function useFilmePorData(data: string | null) {
  return useQuery({
    queryKey: ['filme-do-dia', data],
    queryFn: async (): Promise<FilmeDoDia | null> => {
      if (!data) return null;
      const { data: filme, error } = await (supabase as any)
        .from('filmes_do_dia')
        .select('*')
        .eq('data', data)
        .eq('status', 'pronto')
        .maybeSingle();

      if (error) throw error;
      return filme;
    },
    enabled: !!data,
    staleTime: 1000 * 60 * 30,
  });
}
