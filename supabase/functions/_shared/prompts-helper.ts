/**
 * Helper para buscar prompts versionados do Supabase.
 * 
 * Uso nas Edge Functions:
 *   import { getPrompt } from "../_shared/prompts-helper.ts";
 *   const systemPrompt = await getPrompt('chat-professora', 'system');
 * 
 * Fallback: se não encontrar no banco, usa o prompt default fornecido.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Cache em memória (por instância da Edge Function)
const promptCache = new Map<string, { text: string; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

/**
 * Busca um prompt do banco de dados.
 * @param categoria - Ex: 'chat-professora', 'gerar-flashcards', 'explicacao-artigo'
 * @param nome - Ex: 'system', 'user', 'aula-system'
 * @param fallback - Prompt padrão caso não encontre no banco
 */
export async function getPrompt(
  categoria: string,
  nome: string,
  fallback: string = ''
): Promise<string> {
  const cacheKey = `${categoria}:${nome}`;
  
  // Check memory cache
  const cached = promptCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
    return cached.text;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const { data, error } = await supabase
      .from('prompts_templates')
      .select('prompt_text')
      .eq('categoria', categoria)
      .eq('nome', nome)
      .eq('ativo', true)
      .order('versao', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log(`⚠️ Prompt não encontrado: ${cacheKey}, usando fallback`);
      return fallback;
    }

    // Cache it
    promptCache.set(cacheKey, { text: data.prompt_text, ts: Date.now() });
    return data.prompt_text;
  } catch (err) {
    console.error(`Erro ao buscar prompt ${cacheKey}:`, err);
    return fallback;
  }
}

/**
 * Limpa o cache de prompts (útil em testes ou quando admin edita).
 */
export function clearPromptCache() {
  promptCache.clear();
}
