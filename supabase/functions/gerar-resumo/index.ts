import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REVISION = "v3.0.0";
const MODEL = "gemini-2.5-flash-lite";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

// 🔑 Pool de chaves com rotação round-robin
const API_KEYS = getRotatedKeyStrings();

// 📊 Configuração de tokens por nível
const TOKEN_CONFIG = {
  super_resumido: { maxTokens: 1000, chunkSize: 10000, maxChunks: 1 },
  resumido: { maxTokens: 3000, chunkSize: 12000, maxChunks: 1 },
  detalhado: { maxTokens: 8000, chunkSize: 15000, maxChunks: 3 },
};

async function chamarGemini(messages: any[], config: any): Promise<any> {
  if (API_KEYS.length === 0) {
    throw new Error('Nenhuma chave GEMINI_KEY_1/2/3 configurada');
  }

  let lastError: Error | null = null;
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    console.log(`📝 Tentando chave GEMINI_KEY_${i + 1}...`);
    
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages,
          generationConfig: config
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro ${response.status} com GEMINI_KEY_${i + 1}:`, errorText.substring(0, 200));
        lastError = new Error(`Erro na API Gemini: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ Resposta recebida com GEMINI_KEY_${i + 1}`);
      return data;
    } catch (error) {
      console.error(`❌ Falha com GEMINI_KEY_${i + 1}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  throw lastError || new Error('Todas as chaves API falharam');
}

// 🧹 Limpar string base64 removendo prefixo data URI e caracteres inválidos
function cleanBase64(base64String: string): string {
  if (!base64String) return "";
  let cleaned = base64String.trim();

  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  if (cleaned.includes(",") && cleaned.startsWith("data:")) {
    cleaned = cleaned.split(",")[1];
  }

  // Remove whitespace/newlines
  cleaned = cleaned.replace(/\s/g, "");

  // Validate base64 format
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    console.error("❌ [BASE64] String inválida após limpeza");
    throw new Error("Invalid base64 string after cleaning");
  }

  return cleaned;
}

// 📄 Extrair texto do PDF usando unpdf
async function extrairTextoPDF(base64Data: string): Promise<string> {
  console.log("📄 [UNPDF] Iniciando extração com unpdf...");
  
  try {
    const { extractText } = await import('https://esm.sh/unpdf@0.11.0');
    
    // Limpar base64 antes de processar
    const cleanedBase64 = cleanBase64(base64Data);
    
    const binaryString = atob(cleanedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const result = await extractText(bytes, { mergePages: true });
    
    console.log(`✅ [UNPDF] Extração completa: ${result.text.length} caracteres de ${result.totalPages} páginas`);
    
    return result.text;
  } catch (error) {
    console.error("❌ [UNPDF] Erro na extração:", error);
    throw new Error(`Falha ao extrair texto do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// 📦 Dividir texto em chunks para processamento
function dividirEmChunks(texto: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let inicio = 0;
  
  while (inicio < texto.length) {
    let fim = inicio + chunkSize;
    
    // Tentar quebrar em um ponto natural (parágrafo ou sentença)
    if (fim < texto.length) {
      const proximoParrafo = texto.indexOf('\n\n', fim - 500);
      if (proximoParrafo !== -1 && proximoParrafo < fim + 500) {
        fim = proximoParrafo;
      } else {
        const proximoPonto = texto.indexOf('. ', fim - 200);
        if (proximoPonto !== -1 && proximoPonto < fim + 200) {
          fim = proximoPonto + 1;
        }
      }
    }
    
    chunks.push(texto.substring(inicio, fim).trim());
    inicio = fim;
  }
  
  return chunks;
}

serve(async (req) => {
  console.log(`📍 Function: gerar-resumo@${REVISION} | Model: ${MODEL}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, conteudo, arquivo, nomeArquivo, acao, nivel } = await req.json();
    
    console.log("📝 [GERAR-RESUMO] Iniciando - Tipo:", tipo, "Nome arquivo:", nomeArquivo, "Ação:", acao, "Nível:", nivel);

    let textoParaResumir = "";
    let base64Data: string | undefined;
    let mimeType: string | undefined;

    // Processar conforme o tipo de input
    if (tipo === "texto") {
      textoParaResumir = conteudo;
    } else if (tipo === "pdf") {
      if (!arquivo) {
        throw new Error("Arquivo PDF não fornecido");
      }

      base64Data = arquivo.split(",")[1];
      if (!base64Data) {
        throw new Error("Dados base64 do PDF não encontrados");
      }
      console.log("📄 [PDF] Tamanho base64:", base64Data.length);

      textoParaResumir = await extrairTextoPDF(base64Data);
      
      if (!textoParaResumir || textoParaResumir.trim().length < 50) {
        throw new Error("Não foi possível extrair texto suficiente do PDF");
      }
      
    } else if (tipo === "imagem") {
      if (!arquivo) {
        throw new Error("Arquivo de imagem não fornecido");
      }

      // Extrair e limpar base64 da imagem
      const rawBase64 = arquivo.includes(",") ? arquivo.split(",")[1] : arquivo;
      base64Data = cleanBase64(rawBase64);
      
      // Extrair mimeType de forma segura
      if (arquivo.startsWith("data:")) {
        mimeType = arquivo.split(";")[0].split(":")[1] || 'image/jpeg';
      } else {
        mimeType = 'image/jpeg';
      }

      console.log("🖼️ [IMAGEM] Processando imagem. MimeType:", mimeType, "Tamanho base64 limpo:", base64Data?.length || 0);

      if (!base64Data || base64Data.length < 100) {
        throw new Error("Dados da imagem estão vazios ou inválidos");
      }

      const extractionMessages = [{
        role: "user" as const,
        parts: [
          { text: "Extraia TODO o texto visível nesta imagem. Seja preciso e detalhado. Retorne apenas o texto extraído. Se não houver texto, descreva o conteúdo da imagem de forma detalhada." },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      }];

      let extractionAttempts = 0;
      const maxAttempts = 3;
      
      while (extractionAttempts < maxAttempts) {
        try {
          extractionAttempts++;
          console.log(`🔄 [EXTRAÇÃO] Tentativa ${extractionAttempts}/${maxAttempts}`);
          
          const visionData = await chamarGemini(extractionMessages, {
            temperature: 0.1,
            maxOutputTokens: 3000,
          });

          textoParaResumir = visionData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          if (!textoParaResumir || textoParaResumir.trim().length < 10) {
            throw new Error("A API não retornou conteúdo extraído suficiente");
          }
          
          console.log(`✅ [SUCESSO] Texto extraído - ${textoParaResumir.length} caracteres`);
          break;
          
        } catch (error) {
          console.error(`Tentativa ${extractionAttempts} falhou:`, error);
          if (extractionAttempts >= maxAttempts) {
            throw new Error(`Falha na extração após ${maxAttempts} tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (acao === "extrair") {
      return new Response(
        JSON.stringify({
          extraido: textoParaResumir,
          chars: textoParaResumir?.length || 0,
          tipo,
          nomeArquivo,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((!textoParaResumir || textoParaResumir.trim().length === 0) && !(tipo === "imagem" && arquivo)) {
      throw new Error("Não foi possível extrair conteúdo suficiente do arquivo");
    }

    const nivelEscolhido = (nivel === "resumido" || nivel === "super_resumido") ? nivel : "detalhado";
    const config = TOKEN_CONFIG[nivelEscolhido as keyof typeof TOKEN_CONFIG];

    console.log(`📊 Configuração: ${nivelEscolhido} | maxTokens: ${config.maxTokens} | chunkSize: ${config.chunkSize}`);

    // 🔄 GERAÇÃO EM PARTES para conteúdo grande
    let resumoFinal = "";
    
    if (textoParaResumir.length > config.chunkSize && nivelEscolhido === "detalhado") {
      console.log(`📦 Conteúdo grande (${textoParaResumir.length} chars) - dividindo em chunks...`);
      
      const chunks = dividirEmChunks(textoParaResumir, config.chunkSize);
      const chunksToProcess = chunks.slice(0, config.maxChunks);
      
      console.log(`📦 ${chunksToProcess.length} chunks para processar (de ${chunks.length} total)`);
      
      const resumosParciais: string[] = [];
      
      for (let i = 0; i < chunksToProcess.length; i++) {
        const chunk = chunksToProcess[i];
        console.log(`🔄 Processando chunk ${i + 1}/${chunksToProcess.length} (${chunk.length} chars)`);
        
        const promptChunk = `Você é um especialista em criar resumos jurídicos SUPER DETALHADOS.

NÍVEL: DETALHADO MÁXIMO - ANÁLISE COMPLETA (Parte ${i + 1} de ${chunksToProcess.length})

CONTEÚDO A RESUMIR:
${chunk}

INSTRUÇÕES OBRIGATÓRIAS:
- Crie 4-6 parágrafos COMPLETOS para esta seção
- Cada parágrafo deve ter 5-8 linhas (100-150 palavras)
- Desenvolva CADA conceito com exemplos práticos
- Cite TODOS os artigos/leis relevantes com explicação detalhada
- Explique TODOS os termos técnicos de forma didática
- Use analogias para facilitar a compreensão
- Inclua jurisprudência quando aplicável
- Use negrito (**texto**) para termos importantes
- NÃO inclua introdução ou conclusão genérica
- NÃO gere imagens, ilustrações ou placeholders de imagem
- Foque APENAS no conteúdo técnico e jurídico

ESTRUTURA:
## 📋 Análise Detalhada (Parte ${i + 1})

[Parágrafos completos e detalhados...]`;

        const messages = [{ role: "user", parts: [{ text: promptChunk }] }];
        
        const aiData = await chamarGemini(messages, {
          temperature: 0.2,
          maxOutputTokens: config.maxTokens,
        });

        const resumoChunk = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (resumoChunk) {
          resumosParciais.push(resumoChunk);
        }
      }
      
      // Concatenar partes
      resumoFinal = `# 📄 Resumo Jurídico Detalhado\n\n${resumosParciais.join('\n\n---\n\n')}`;
      
    } else {
      // Processamento normal (texto pequeno ou níveis resumido/super_resumido)
      let promptTexto = "";
      
      if (nivelEscolhido === "super_resumido") {
        promptTexto = `Você é um especialista em criar resumos jurídicos SUPER RESUMIDOS.

NÍVEL: SUPER RESUMIDO - MÁXIMA CONCISÃO

CONTEÚDO A RESUMIR:
${textoParaResumir}

INSTRUÇÕES OBRIGATÓRIAS:
- Crie APENAS 4-6 bullets com os pontos MAIS IMPORTANTES
- Cada bullet deve ter NO MÁXIMO 10-15 palavras
- Use linguagem direta e objetiva
- Inclua emojis relevantes em cada bullet
- NÃO crie parágrafos, APENAS bullets
- Cite artigos/leis APENAS quando essencial
- NÃO gere imagens ou ilustrações

FORMATO EXATO:
# 📄 Resumo Jurídico

• [Emoji] [Ponto principal 1 em 10-15 palavras]
• [Emoji] [Ponto principal 2 em 10-15 palavras]
• [Emoji] [Ponto principal 3 em 10-15 palavras]
• [Emoji] [Ponto principal 4 em 10-15 palavras]`;

      } else if (nivelEscolhido === "resumido") {
        promptTexto = `Você é um especialista em criar resumos jurídicos RESUMIDOS.

NÍVEL: RESUMIDO - EQUILÍBRIO ENTRE CONCISÃO E INFORMAÇÃO

CONTEÚDO A RESUMIR:
${textoParaResumir}

INSTRUÇÕES OBRIGATÓRIAS:
- Crie 1 parágrafo por tópico principal (máximo 4-5 tópicos)
- Cada parágrafo deve ter 2-3 linhas (40-60 palavras)
- Use negrito (**texto**) para destacar termos-chave
- Inclua emojis profissionais nos cabeçalhos
- Cite artigos/leis quando relevante
- Seja objetivo e direto
- NÃO gere imagens ou ilustrações

ESTRUTURA OBRIGATÓRIA:
# 📄 Resumo Jurídico

## 🎯 Visão Geral
[1 parágrafo de 2-3 linhas]

## 📋 Pontos Principais
[1 parágrafo de 2-3 linhas]

## ⚖️ Fundamentos Legais
[1 parágrafo de 2-3 linhas]

## 📌 Conclusão
[1 parágrafo de 2-3 linhas]`;

      } else {
        promptTexto = `Você é um especialista em criar resumos jurídicos SUPER DETALHADOS e COMPLETOS.

NÍVEL: DETALHADO MÁXIMO - ANÁLISE APROFUNDADA

CONTEÚDO A RESUMIR:
${textoParaResumir}

INSTRUÇÕES OBRIGATÓRIAS:
- Crie 4-6 parágrafos COMPLETOS por tópico principal
- Cada parágrafo deve ter 5-8 linhas (100-150 palavras)
- Desenvolva CADA conceito com exemplos práticos brasileiros
- Cite TODOS os artigos/leis relevantes COM explicação detalhada
- Explique TODOS os termos técnicos de forma didática
- Use analogias do dia a dia para facilitar compreensão
- Inclua jurisprudência relevante quando aplicável
- Use negrito (**texto**), listas e citações quando apropriado
- Inclua emojis profissionais nos cabeçalhos
- Seja EXTREMAMENTE detalhado e didático
- NÃO gere imagens, ilustrações ou placeholders de imagem

ESTRUTURA OBRIGATÓRIA:
# 📄 Resumo Jurídico Detalhado

## 🎯 Visão Geral e Contexto
[4-6 parágrafos de 5-8 linhas cada, apresentando o contexto histórico, social e jurídico]

## 📋 Pontos Principais e Conceitos
[4-6 parágrafos de 5-8 linhas cada, desenvolvendo cada ponto com profundidade]

## ⚖️ Fundamentos Legais e Normativos
[4-6 parágrafos de 5-8 linhas cada, explicando a base legal com citações]

## 🔍 Análise Detalhada dos Conceitos-Chave
[4-6 parágrafos de 5-8 linhas cada, aprofundando em cada conceito]

## 💡 Aplicações Práticas e Exemplos
[4-6 parágrafos de 5-8 linhas cada, com casos práticos e exemplos]

## 📌 Síntese e Conclusões
[4-6 parágrafos de 5-8 linhas cada, sintetizando e concluindo]`;
      }

      let messages: any[] = [];
      if (tipo === "imagem" && ((textoParaResumir?.trim().length || 0) < 50) && arquivo && base64Data && mimeType) {
        messages = [{
          role: "user",
          parts: [
            { text: `Analise a imagem e gere um resumo jurídico no nível: ${nivelEscolhido}. NÃO gere imagens ou ilustrações.` },
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
          ]
        }];
      } else {
        messages = [{ role: "user", parts: [{ text: promptTexto }] }];
      }

      console.log("🤖 [GEMINI] Gerando resumo | Nível:", nivelEscolhido, "| Caracteres:", textoParaResumir.length);

      const aiData = await chamarGemini(messages, {
        temperature: 0.2,
        maxOutputTokens: config.maxTokens,
      });

      resumoFinal = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    console.log("✨ [SUCESSO] Resumo gerado! Tamanho:", resumoFinal.length);

    return new Response(
      JSON.stringify({
        resumo: resumoFinal,
        chars_fonte: textoParaResumir.length,
        chars_resumo: resumoFinal.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função gerar-resumo:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido ao gerar resumo",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
