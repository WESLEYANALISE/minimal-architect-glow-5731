import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Mapeamento de áreas para categorias - nomes conforme salvos na tabela
const AREA_TO_CATEGORY: Record<string, string> = {
  // Constituição
  "CF - Constituição Federal": "constituicao",
  
  // Códigos e Leis
  "CC - Código Civil": "codigos",
  "CP - Código Penal": "codigos",
  "CPC – Código de Processo Civil": "codigos",
  "CPP – Código de Processo Penal": "codigos",
  "CLT - Consolidação das Leis do Trabalho": "codigos",
  "CDC – Código de Defesa do Consumidor": "codigos",
  "CTN – Código Tributário Nacional": "codigos",
  "CE – Código Eleitoral": "codigos",
  "CTB Código de Trânsito Brasileiro": "codigos",
  "CPM – Código Penal Militar": "codigos",
  "CPPM – Código de Processo Penal Militar": "codigos",
  "CCOM – Código Comercial": "codigos",
  "CDM – Código de Minas": "codigos",
  "CA - Código de Águas": "codigos",
  "CBA Código Brasileiro de Aeronáutica": "codigos",
  "CBT Código Brasileiro de Telecomunicações": "codigos",
  
  // Legislação Penal Especial - nomes conforme salvos na tabela QUESTOES_ARTIGOS_LEI
  "Lei 7.210 de 1984 - Lei de Execução Penal": "legislacao-penal",
  "Lei 11.340 de 2006 - Maria da Penha": "legislacao-penal",
  "Lei 11.343 de 2006 - Lei de Drogas": "legislacao-penal",
  "Lei 8.072 de 1990 - Crimes Hediondos": "legislacao-penal",
  "Lei 9.455 de 1997 - Tortura": "legislacao-penal",
  "Lei 13.869 de 2019 - Abuso de Autoridade": "legislacao-penal",
  "Lei 9.099 de 1995 - Juizados Especiais": "legislacao-penal",
  // Manter compatibilidade com nomes antigos
  "LEP – Lei de Execução Penal": "legislacao-penal",
  "LMP – Lei Maria da Penha": "legislacao-penal",
  "LTN - Lei dos Juizados Especiais Criminais": "legislacao-penal",
  "Lei de Drogas": "legislacao-penal",
  "Lei de Crimes Hediondos": "legislacao-penal",
  "Lei de Tortura": "legislacao-penal",
  "Lei de Abuso de Autoridade": "legislacao-penal",
  
  // Estatutos (formato ESTATUTO - NOME)
  "ESTATUTO - OAB": "estatutos",
  "ESTATUTO - ECA": "estatutos",
  "ESTATUTO - IDOSO": "estatutos",
  "ESTATUTO - CIDADE": "estatutos",
  "ESTATUTO - DESARMAMENTO": "estatutos",
  "ESTATUTO - PESSOA COM DEFICIÊNCIA": "estatutos",
  "ESTATUTO - TORCEDOR": "estatutos",
  "ESTATUTO - IGUALDADE RACIAL": "estatutos",
  
  // Estatutos (formato EST - Estatuto...)
  "EST - Estatuto dos Militares": "estatutos",
  "EST - Estatuto da Terra": "estatutos",
  "EST - Estatuto da Migração": "estatutos",
  "EST - Estatuto da Juventude": "estatutos",
  "EST - Estatuto do Índio": "estatutos",
  "EST - Estatuto do Refugiado": "estatutos",
  "EST - Estatuto da Metrópole": "estatutos",
  "EST - Estatuto do Desporto": "estatutos",
  "EST - Estatuto da MPE": "estatutos",
  "EST - Estatuto Segurança Privada": "estatutos",
  "EST - Estatuto Magistério Superior": "estatutos",
  "EST - Estatuto Pessoa com Câncer": "estatutos",
  
  // Compatibilidade com nomes antigos
  "ESTATUTO - CRIANCA E ADOLESCENTE": "estatutos",
  "ESTATUTO - ESTRANGEIRO": "estatutos",
  "ESTATUTO - MILITARES": "estatutos",
  "ESTATUTO - JUVENTUDE": "estatutos",
  
  // Legislação Penal - adições faltantes
  "LLD - Lei de Lavagem de Dinheiro": "legislacao-penal",
  "Lei 12.850 de 2013 - Organizações Criminosas": "legislacao-penal",
  "Lei 9.296 de 1996 - Interceptação Telefônica": "legislacao-penal",
  "Lei 13.964 de 2019 - Pacote Anticrime": "legislacao-penal",
  "Lei 14.197 de 2021 - Crimes Contra o Estado Democrático": "legislacao-penal",

  // Previdenciário (nomes corretos das tabelas)
  "LEI 8212 - Custeio": "previdenciario",
  "LEI 8213 - Benefícios": "previdenciario",
  
  // Súmulas (nomes corretos sem acento)
  "SUMULAS STF": "sumulas",
  "SUMULAS STJ": "sumulas",
  "SUMULAS TST": "sumulas",
  "SUMULAS TSE": "sumulas",
  "SUMULAS VINCULANTES": "sumulas",
};

export interface QuestoesCountByCategory {
  constituicao: number;
  codigos: number;
  "legislacao-penal": number;
  estatutos: number;
  previdenciario: number;
  sumulas: number;
}

const CACHE_KEY = 'questoes-artigos-count-cache-v4';
const REVALIDATE_INTERVAL = 1000 * 60 * 60 * 24; // 24 horas

export const useQuestoesArtigosCount = () => {
  const [counts, setCounts] = useState<QuestoesCountByCategory | null>(() => {
    // Carregar do localStorage instantaneamente
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        return data;
      }
    } catch (e) {
      console.error('Erro ao ler cache:', e);
    }
    return null;
  });
  // Nunca mostrar loading se já tem cache - sempre mostra o valor cacheado primeiro
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        return timestamp;
      }
    } catch (e) {
      return null;
    }
    return null;
  });

  const fetchFromSupabase = useCallback(async (): Promise<QuestoesCountByCategory> => {
    // Buscar contagem por área usando paginação para evitar limite de 1000
    const allData: { area: string }[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("QUESTOES_ARTIGOS_LEI")
        .select("area")
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData.push(...data);
        page++;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    // Contar por área
    const countByArea: Record<string, number> = {};
    allData.forEach((item) => {
      const area = item.area;
      if (area) {
        countByArea[area] = (countByArea[area] || 0) + 1;
      }
    });

    // Agrupar por categoria
    const result: QuestoesCountByCategory = {
      constituicao: 0,
      codigos: 0,
      "legislacao-penal": 0,
      estatutos: 0,
      previdenciario: 0,
      sumulas: 0,
    };

    Object.entries(countByArea).forEach(([area, count]) => {
      const category = AREA_TO_CATEGORY[area];
      if (category && category in result) {
        result[category as keyof QuestoesCountByCategory] += count;
      }
    });

    return result;
  }, []);

  // Busca dados do Supabase (em background se já tem cache)
  useEffect(() => {
    const loadData = async () => {
      const shouldRevalidate = !lastFetchTime || (Date.now() - lastFetchTime > REVALIDATE_INTERVAL);
      
      if (!counts) {
        // Sem cache - carrega normalmente
        setIsLoading(true);
        try {
          const data = await fetchFromSupabase();
          setCounts(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
          setLastFetchTime(Date.now());
        } catch (error) {
          console.error('Erro ao carregar contagem de questões:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (shouldRevalidate) {
        // Com cache - revalida em background sem mostrar loading
        try {
          const data = await fetchFromSupabase();
          setCounts(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
          setLastFetchTime(Date.now());
        } catch (error) {
          console.error('Erro na revalidação em background:', error);
        }
      }
    };

    loadData();
  }, [counts, fetchFromSupabase, lastFetchTime]);

  const totalQuestoes = counts 
    ? Object.values(counts).reduce((acc, val) => acc + val, 0) 
    : 0;

  return {
    data: counts,
    isLoading: isLoading && !counts, // Só mostra loading se não tem cache
    totalQuestoes,
  };
};

export const invalidateQuestoesArtigosCache = () => {
  localStorage.removeItem(CACHE_KEY);
};
