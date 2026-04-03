/**
 * Módulo compartilhado para distribuição harmônica de chaves Gemini API.
 * 
 * Usa round-robin baseado em timestamp para distribuir chamadas uniformemente
 * entre as 3 chaves disponíveis, evitando sobrecarga na KEY_1.
 * 
 * Padrão de rotação:
 *   Segundo 0 → KEY_1, KEY_2, KEY_3
 *   Segundo 1 → KEY_2, KEY_3, KEY_1
 *   Segundo 2 → KEY_3, KEY_1, KEY_2
 */

export interface GeminiKeyInfo {
  name: string;
  key: string;
  index: number;
}

/**
 * Coleta todas as chaves Gemini configuradas no ambiente.
 * Inclui GEMINI_KEY_1, 2, 3 e opcionalmente DIREITO_PREMIUM_API_KEY.
 */
/**
 * Coleta chaves Gemini do ambiente.
 * Por padrão exclui KEY_3 (reservada exclusivamente para a Evelyn).
 * Passe includeKey3=true apenas na função processar-mensagem-evelyn.
 */
export function getAllGeminiKeys(includePremium = false, includeKey3 = false): GeminiKeyInfo[] {
  const keys: GeminiKeyInfo[] = [];

  const maxKey = includeKey3 ? 3 : 2;
  for (let i = 1; i <= maxKey; i++) {
    const key = Deno.env.get(`GEMINI_KEY_${i}`);
    if (key) {
      keys.push({ name: `GEMINI_KEY_${i}`, key, index: i });
    }
  }

  if (includePremium) {
    const premiumKey = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (premiumKey) {
      keys.push({ name: 'DIREITO_PREMIUM_API_KEY', key: premiumKey, index: 4 });
    }
  }

  return keys;
}

/**
 * Retorna as chaves Gemini em ordem rotacionada (round-robin).
 * Cada chamada começa com uma chave diferente baseada no timestamp atual.
 * 
 * Usa Math.floor(Date.now() / 1000) para rotacionar a cada segundo,
 * garantindo distribuição uniforme mesmo com chamadas paralelas.
 */
export function getRotatedGeminiKeys(includePremium = false): GeminiKeyInfo[] {
  const allKeys = getAllGeminiKeys(includePremium);
  
  if (allKeys.length <= 1) return allKeys;
  
  // Round-robin baseado no segundo atual
  const offset = Math.floor(Date.now() / 1000) % allKeys.length;
  
  // Rotacionar o array: [offset, offset+1, ..., 0, 1, ..., offset-1]
  const rotated = [
    ...allKeys.slice(offset),
    ...allKeys.slice(0, offset),
  ];
  
  return rotated;
}

/**
 * Retorna apenas as chaves como strings em ordem rotacionada.
 * Drop-in replacement para o padrão antigo:
 *   const API_KEYS = [Deno.env.get('GEMINI_KEY_1'), ...].filter(Boolean)
 */
export function getRotatedKeyStrings(includePremium = false): string[] {
  return getRotatedGeminiKeys(includePremium).map(k => k.key);
}
