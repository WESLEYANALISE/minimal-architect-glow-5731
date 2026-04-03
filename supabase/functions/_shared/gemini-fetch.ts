/**
 * Módulo utilitário para chamadas à API Gemini com rotação automática de chaves.
 * 
 * Centraliza a lógica de:
 * - Rotação round-robin entre chaves
 * - Retry automático em caso de 429/403/503
 * - Logging de qual chave foi usada
 * - Registro de uso de tokens (fire-and-forget)
 */

import { getRotatedGeminiKeys, type GeminiKeyInfo } from "./gemini-keys.ts";

export interface GeminiConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  responseMimeType?: string;
}

export interface GeminiResult {
  text: string;
  keyIndex: number;
  keyName: string;
  usageMetadata: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

/**
 * Fire-and-forget: registrar uso de tokens no banco.
 */
export function registrarTokenUsage(params: Record<string, unknown>): void {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) return;

  fetch(`${supabaseUrl}/functions/v1/registrar-token-usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify(params),
  }).catch(err => console.error('[token-tracker] Erro:', err.message));
}

/**
 * Chama a API Gemini com rotação automática de chaves.
 * 
 * @param prompt - Texto do prompt
 * @param functionName - Nome da edge function (para logging)
 * @param model - Modelo Gemini (default: gemini-2.5-flash-lite)
 * @param config - Configuração de geração
 * @param includePremium - Incluir DIREITO_PREMIUM_API_KEY na rotação
 */
export async function chamarGeminiComRotacao(
  prompt: string,
  functionName: string,
  model = 'gemini-2.5-flash-lite',
  config: GeminiConfig = {},
  includePremium = false,
): Promise<GeminiResult> {
  const keys = getRotatedGeminiKeys(includePremium);
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave GEMINI_KEY configurada');
  }

  const generationConfig: Record<string, unknown> = {
    temperature: config.temperature ?? 0.7,
    maxOutputTokens: config.maxOutputTokens ?? 4000,
  };
  if (config.topP !== undefined) generationConfig.topP = config.topP;
  if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;

  let lastError: Error | null = null;
  const startKeyName = keys[0].name;
  console.log(`[${functionName}] Rotação iniciando com ${startKeyName} (${keys.length} chaves)`);

  for (const keyInfo of keys) {
    try {
      console.log(`[${functionName}] Tentando ${keyInfo.name}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyInfo.key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig,
          }),
        }
      );

      // Erros recuperáveis: tentar próxima chave
      if (response.status === 429 || response.status === 503) {
        console.log(`[${functionName}] ${keyInfo.name} rate limited (${response.status}), próxima...`);
        lastError = new Error(`${keyInfo.name}: rate limit ${response.status}`);
        continue;
      }

      if (response.status === 400 || response.status === 401 || response.status === 403) {
        const errorText = await response.text();
        if (/API_KEY_INVALID|API key expired|INVALID_ARGUMENT|PERMISSION_DENIED|RESOURCE_EXHAUSTED/i.test(errorText)) {
          console.log(`[${functionName}] ${keyInfo.name} inválida/expirada, próxima...`);
          lastError = new Error(`${keyInfo.name}: ${errorText.substring(0, 100)}`);
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const usageMetadata = data.usageMetadata || {};

      if (!text) {
        console.log(`[${functionName}] ${keyInfo.name} resposta vazia, próxima...`);
        lastError = new Error(`${keyInfo.name}: resposta vazia`);
        continue;
      }

      console.log(`[${functionName}] ✅ Sucesso com ${keyInfo.name}`);

      // Registrar uso (fire-and-forget)
      const inputTokens = usageMetadata.promptTokenCount || Math.ceil(prompt.length / 4);
      const outputTokens = usageMetadata.candidatesTokenCount || Math.ceil(text.length / 4);
      registrarTokenUsage({
        edge_function: functionName,
        model,
        provider: 'gemini',
        tipo_conteudo: 'texto',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        custo_estimado_brl: ((inputTokens * 0.0004 + outputTokens * 0.0024) / 1000),
        api_key_index: keyInfo.index,
        sucesso: true,
      });

      return {
        text,
        keyIndex: keyInfo.index,
        keyName: keyInfo.name,
        usageMetadata,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('rate limit') || msg.includes('429') || msg.includes('503') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('inválida') || msg.includes('expirada')) {
        lastError = error instanceof Error ? error : new Error(msg);
        continue;
      }
      throw error;
    }
  }

  // Registrar falha
  registrarTokenUsage({
    edge_function: functionName,
    model,
    provider: 'gemini',
    sucesso: false,
    erro: lastError?.message || 'Todas as chaves falharam',
  });

  throw lastError || new Error('Todas as chaves Gemini falharam');
}

/**
 * Chama Gemini com conteúdo multipart (ex: texto + imagem/vídeo).
 */
export async function chamarGeminiMultipart(
  contents: unknown[],
  functionName: string,
  model = 'gemini-2.5-flash-lite',
  config: GeminiConfig = {},
  includePremium = false,
): Promise<GeminiResult> {
  const keys = getRotatedGeminiKeys(includePremium);
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave GEMINI_KEY configurada');
  }

  const generationConfig: Record<string, unknown> = {
    temperature: config.temperature ?? 0.7,
    maxOutputTokens: config.maxOutputTokens ?? 4000,
  };
  if (config.topP !== undefined) generationConfig.topP = config.topP;
  if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;

  let lastError: Error | null = null;

  for (const keyInfo of keys) {
    try {
      console.log(`[${functionName}] Tentando ${keyInfo.name}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyInfo.key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, generationConfig }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        lastError = new Error(`${keyInfo.name}: rate limit`);
        continue;
      }
      if ((response.status === 400 || response.status === 401 || response.status === 403)) {
        const errText = await response.text();
        if (/API_KEY_INVALID|API key expired|PERMISSION_DENIED|RESOURCE_EXHAUSTED/i.test(errText)) {
          lastError = new Error(`${keyInfo.name}: ${errText.substring(0, 100)}`);
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) { lastError = new Error('Resposta vazia'); continue; }

      console.log(`[${functionName}] ✅ Sucesso com ${keyInfo.name}`);
      return {
        text,
        keyIndex: keyInfo.index,
        keyName: keyInfo.name,
        usageMetadata: data.usageMetadata || {},
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('rate limit') || msg.includes('429') || msg.includes('inválida')) {
        lastError = error instanceof Error ? error : new Error(msg);
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Todas as chaves Gemini falharam');
}
