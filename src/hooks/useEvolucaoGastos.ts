import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EvolucaoGastosData {
  mes: string;
  mesNumero: number;
  ano: number;
  valor: number;
}

interface UseEvolucaoGastosResult {
  dados: EvolucaoGastosData[];
  isLoading: boolean;
  totalPeriodo: number;
  mediaMensal: number;
}

export function useEvolucaoGastos(
  politicoId: number | string,
  tipo: 'deputado' | 'senador' = 'deputado'
): UseEvolucaoGastosResult {
  const [dados, setDados] = useState<EvolucaoGastosData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarEvolucao = async () => {
      setIsLoading(true);
      
      try {
        const tabela = tipo === 'deputado' ? 'ranking_despesas' : 'ranking_despesas_senado';
        const campoId = tipo === 'deputado' ? 'deputado_id' : 'senador_id';

        const { data, error } = await supabase
          .from(tabela as any)
          .select('mes, ano, total_gasto')
          .eq(campoId, politicoId)
          .order('ano', { ascending: true })
          .order('mes', { ascending: true });

        if (error) throw error;

        const mesesNome = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        const evolucao: EvolucaoGastosData[] = ((data as any[]) || []).map((item: any) => ({
          mes: `${mesesNome[item.mes - 1]}/${String(item.ano).slice(-2)}`,
          mesNumero: item.mes,
          ano: item.ano,
          valor: item.total_gasto || 0,
        }));

        setDados(evolucao.slice(-12));
      } catch (error) {
        console.error('Erro ao carregar evolução de gastos:', error);
        setDados([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (politicoId) {
      carregarEvolucao();
    }
  }, [politicoId, tipo]);

  const totalPeriodo = dados.reduce((sum, d) => sum + d.valor, 0);
  const mediaMensal = dados.length > 0 ? totalPeriodo / dados.length : 0;

  return { dados, isLoading, totalPeriodo, mediaMensal };
}
