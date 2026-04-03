import { supabase } from "@/integrations/supabase/client";

interface FetchOptions {
  limit?: number;
  offset?: number;
  columns?: string; // Projeção de colunas (ex: "id, titulo, imagem_url")
}

/**
 * Retry com backoff exponencial para queries do Supabase
 */
async function fetchWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Tentativa ${attempt + 1}/${maxRetries} falhou:`, error);
      
      if (attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

// Verifica se uma tabela é de legislação (possui coluna ordem_artigo)
function isLawTable(tableName: string): boolean {
  const prefixes = [
    'CC ', 'CPC ', 'CP ', 'CPP ', 'CF ', 'CLT ', 'CDC ', 'CE ', 'CA ', 'CBA ',
    'CCOM ', 'CDM ', 'CDUS ', 'CPI ', 'CPM ', 'CPPM ', 'CTB ', 'CTN ', 'CBT ',
    'ESTATUTO ', 'EST ', 'Lei ', 'LEI ', 'LLD ', 'LC ', 'DL ', 'DECRETO '
  ];
  return prefixes.some(p => tableName.startsWith(p));
}

/**
 * Retorna a coluna de ordenação correta para uma tabela
 */
function getOrderColumn(tableName: string, requestedOrder: string): string {
  if (isLawTable(tableName) && requestedOrder === 'id') {
    return 'ordem_artigo';
  }
  return requestedOrder;
}

/**
 * Busca todos os registros com estratégia otimizada (ZERO roundtrips extras)
 * 
 * Estratégia: busca paginada direta com range().
 * - Se a 1ª página retorna < pageSize → tabela pequena, pronto.
 * - Se retorna pageSize → continua paginando.
 * - SEM query COUNT prévia (elimina 1 roundtrip por chamada).
 */
export async function fetchAllRows<T>(
  tableName: string, 
  orderBy: string = "id",
  options?: FetchOptions
): Promise<T[]> {
  const orderColumn = getOrderColumn(tableName, orderBy);
  const selectColumns = options?.columns || "*";
  
  // Se tem limite específico, busca apenas o necessário
  if (options?.limit) {
    const from = options.offset || 0;
    const to = from + options.limit - 1;

    const { data, error } = await supabase
      .from(tableName as any)
      .select(selectColumns)
      .order(orderColumn as any, { ascending: true })
      .range(from, to);

    if (error) {
      console.error(`Erro ao buscar tabela ${tableName}:`, error);
      throw error;
    }

    return (data || []) as T[];
  }

  // Busca paginada direta — sem estimateTableSize
  const pageSize = 1000;
  const maxPages = 50;
  let from = 0;
  let all: T[] = [];

  for (let i = 0; i < maxPages; i++) {
    const batch = await fetchWithRetry(async () => {
      const { data, error } = await supabase
        .from(tableName as any)
        .select(selectColumns)
        .order(orderColumn as any, { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error(`Erro ao buscar tabela ${tableName}:`, error);
        throw error;
      }

      return (data || []) as T[];
    });

    all = all.concat(batch);

    // Se retornou menos que pageSize, não há mais dados
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

// Função para carregamento inicial rápido
export async function fetchInitialRows<T>(
  tableName: string,
  limit: number = 50,
  orderBy: string = "id"
): Promise<T[]> {
  return fetchAllRows<T>(tableName, orderBy, { limit, offset: 0 });
}
