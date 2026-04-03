import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REVISION = "v2.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Chamar formatação local
async function chamarFormatacaoLocal(textoBruto: string) {
  const response = await fetch(`${supabaseUrl}/functions/v1/formatar-lei-local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ textoBruto })
  });
  if (!response.ok) throw new Error(`Erro formatação local: ${await response.text()}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  console.log(`✅ Formatação local: ${data.estatisticas.totalElementos} elementos em ${data.estatisticas.tempoMs}ms`);
  return data;
}

// Chamar validação
async function chamarValidacao(textoFormatado: string) {
  const response = await fetch(`${supabaseUrl}/functions/v1/validar-formatacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ textoFormatado })
  });
  if (!response.ok) throw new Error(`Erro validação: ${await response.text()}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  console.log(`✅ Validação: ${data.problemas.length} problemas, válido: ${data.valido}`);
  return data;
}

// Dividir texto em chunks
function dividirTextoEmChunks(texto: string, maxChars = 35000): string[] {
  if (texto.length <= maxChars) return [texto];
  const chunks: string[] = [];
  let inicio = 0;
  while (inicio < texto.length) {
    let fim = Math.min(inicio + maxChars, texto.length);
    if (fim < texto.length) {
      const textoAte = texto.substring(inicio, fim);
      const ultimoArtigo = textoAte.lastIndexOf('\nArt.');
      if (ultimoArtigo > maxChars * 0.5) fim = inicio + ultimoArtigo;
    }
    chunks.push(texto.substring(inicio, fim));
    inicio = fim;
  }
  console.log(`📦 Dividido em ${chunks.length} chunks`);
  return chunks;
}

// Stream Gemini genérico
async function streamGemini(prompt: string): Promise<ReadableStream> {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse&key=${GEMINI_KEYS[i]}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 65536 }
          }),
        }
      );
      if (response.status === 429) continue;
      if (!response.ok) continue;
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Reader não disponível");

      return new ReadableStream({
        async start(controller) {
          const decoder = new TextDecoder();
          let buffer = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim();
                  if (!jsonStr || jsonStr === '[DONE]') continue;
                  try {
                    const text = JSON.parse(jsonStr)?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
                  } catch {}
                }
              }
            }
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          } catch (err) { controller.error(err); }
        }
      });
    } catch { continue; }
  }
  throw new Error("Todas as chaves falharam");
}

// Corrigir com Gemini
async function corrigirComGemini(textoFormatado: string, problemas: any[]): Promise<ReadableStream> {
  const desc = problemas.map(p => `- ${p.local}: ${p.descricao}`).join('\n');
  const prompt = `Você é um REVISOR JURÍDICO. Corrija APENAS estes problemas no texto formatado:

PROBLEMAS:
${desc}

REGRAS:
1. Corrija APENAS os problemas listados
2. Mantenha o formato ([ARTIGO]:, [INCISO]:, etc.)
3. Se há duplicatas, REMOVA a segunda
4. Se há "...", COMPLETE o texto
5. Retorne o texto COMPLETO com correções

TEXTO:
${textoFormatado}`;
  return streamGemini(prompt);
}

// Formatar com Gemini (fallback)
async function formatarComGemini(textoBruto: string, chunkIndex?: number, totalChunks?: number): Promise<ReadableStream> {
  const isFirst = chunkIndex === undefined || chunkIndex === 0;
  const isLast = chunkIndex === undefined || (totalChunks && chunkIndex === totalChunks - 1);
  
  let instrucoes = 'Transcreva TODOS os artigos, parágrafos, incisos e alíneas.';
  if (isFirst && !isLast) instrucoes = 'PRIMEIRA PARTE - inclua instituições.';
  else if (!isFirst && isLast) instrucoes = 'ÚLTIMA PARTE - inclua assinaturas.';
  else if (!isFirst && !isLast) instrucoes = 'PARTE INTERMEDIÁRIA - só artigos.';

  const prompt = `Você é um COPISTA JURÍDICO. ${instrucoes}

FORMATO:
[CABECALHO]: LEI Nº X.XXX, DE XX DE XXXX DE XXXX
[EMENTA]: texto
[TITULO]: TÍTULO I
[CAPITULO]: CAPÍTULO I
[ARTIGO]: Art. 1º texto
[PARAGRAFO]: § 1º texto
[INCISO]: I - texto
[ALINEA]: a) texto

⚠️ NUNCA abrevie com "...", se houver duplicatas mantenha apenas o PRIMEIRO.

TEXTO:
${textoBruto}`;
  return streamGemini(prompt);
}

serve(async (req) => {
  console.log(`🚀 [formatar-lei-streaming ${REVISION}]`);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { textoBruto, tableName, chunkIndex, totalChunks } = await req.json();
    if (!textoBruto) return new Response(JSON.stringify({ success: false, error: "Texto obrigatório" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!GEMINI_KEYS.length) return new Response(JSON.stringify({ success: false, error: "Sem chaves Gemini" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    console.log(`📋 ${tableName || '-'} | ${textoBruto.length} chars`);
    
    // Chunk específico = modo legado
    if (chunkIndex !== undefined) {
      console.log(`📦 Chunk ${chunkIndex + 1}/${totalChunks}`);
      return new Response(await formatarComGemini(textoBruto, chunkIndex, totalChunks), {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
      });
    }

    // Precisa chunking?
    if (textoBruto.length > 35000) {
      const chunks = dividirTextoEmChunks(textoBruto);
      if (chunks.length > 1) {
        return new Response(JSON.stringify({ success: true, needsChunking: true, chunks, totalChunks: chunks.length }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Fluxo: Local → Validação → IA (se necessário)
    console.log('🔄 Local → Validação → IA');
    
    let formatado: string;
    try {
      formatado = (await chamarFormatacaoLocal(textoBruto)).formatado;
    } catch (e) {
      console.error('❌ Local falhou, usando Gemini:', e);
      return new Response(await formatarComGemini(textoBruto), {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
      });
    }

    let validacao;
    try {
      validacao = await chamarValidacao(formatado);
    } catch (e) {
      console.warn('⚠️ Validação falhou:', e);
      validacao = { valido: true, problemas: [] };
    }

    // Se válido, retorna direto
    if (validacao.valido || validacao.problemas.length === 0) {
      console.log('✅ Texto válido, retornando sem IA');
      return new Response(JSON.stringify({ success: true, formatado, usouIA: false }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Muitos problemas = reformatar tudo
    const graves = validacao.problemas.filter((p: any) => p.severidade === 'grave').length;
    if (graves > 10 || validacao.problemas.length > 20) {
      console.log(`⚠️ ${graves} graves, reformatando tudo com Gemini`);
      return new Response(await formatarComGemini(textoBruto), {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
      });
    }

    // Poucos problemas = corrigir
    console.log(`🤖 Corrigindo ${validacao.problemas.length} problemas`);
    return new Response(await corrigirComGemini(formatado, validacao.problemas), {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
    });

  } catch (error) {
    console.error('❌', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
