import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NoticiaSheet {
  categoria: string;
  portal: string;
  titulo: string;
  capa: string;
  link: string;
  dataHora: string;
  tipoCategoria: 'direito' | 'concurso';
}

// Função para extrair JSON da resposta do Gemini
function extractJsonFromText(text: string): any {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                    text.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      let jsonStr = jsonMatch[1] || jsonMatch[0];
      jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      jsonStr = jsonStr.replace(/(?<=":[ ]*"[^"]*)\n(?=[^"]*")/g, '\\n');
      return JSON.parse(jsonStr);
    } catch (e) {
      try {
        let jsonStr = jsonMatch[1] || jsonMatch[0];
        jsonStr = jsonStr.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
        return JSON.parse(jsonStr);
      } catch (e2) {
        console.log('Fallback de parsing falhou:', e2);
      }
    }
  }
  return null;
}

// Converter data brasileira (DD/MM/YYYY HH:MM:SS) para ISO
function parseDataBR(dataStr: string): string {
  if (!dataStr) return new Date().toISOString();
  
  try {
    const match = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
    if (!match) return new Date().toISOString();
    
    const [, dia, mes, ano, hora = '12', min = '00', seg = '00'] = match;
    const date = new Date(`${ano}-${mes}-${dia}T${hora}:${min}:${seg}-03:00`);
    
    if (isNaN(date.getTime())) return new Date().toISOString();
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Buscar notícias do Google Sheets (limitado às mais recentes)
async function buscarNoticiasDoSheets(): Promise<NoticiaSheet[]> {
  const SHEET_ID = '1tqCcr-HgmY5BMHBkLdSFaW2RoldSdFlM44Qx9xYWMLg';
  const GID = '1764139697';
  // Use tq query to limit to last 50 rows (most recent) to avoid parsing 10k+ rows
  const tq = encodeURIComponent('order by F desc limit 50');
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}&tq=${tq}`;
  
  console.log('📊 Buscando notícias do Google Sheets (top 50)...');
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Erro ao buscar planilha: ${response.status}`);
      return [];
    }
    
    const text = await response.text();
    const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '');
    const data = JSON.parse(jsonStr);
    
    const rows = data.table?.rows || [];
    const noticias: NoticiaSheet[] = [];
    
    console.log(`📋 Recebidas ${rows.length} linhas da planilha`);
    
    for (const row of rows) {
      const cells = row.c;
      if (!cells || !cells[0]?.v) continue;
      
      const categoria = cells[0]?.v?.toString()?.trim() || '';
      const portal = cells[1]?.v?.toString()?.trim() || '';
      const titulo = cells[2]?.v?.toString()?.trim() || '';
      const capa = cells[3]?.v?.toString()?.trim() || '';
      const link = cells[4]?.v?.toString()?.trim() || '';
      const dataHoraRaw = cells[5]?.v?.toString()?.trim() || '';
      
      if (!titulo || !link) continue;
      
      const categLower = categoria.toLowerCase();
      let tipoCategoria: 'direito' | 'concurso' = 'direito';
      
      if (categLower.includes('concurso')) {
        tipoCategoria = 'concurso';
      }
      
      noticias.push({
        categoria,
        portal,
        titulo,
        capa,
        link,
        dataHora: parseDataBR(dataHoraRaw),
        tipoCategoria
      });
    }
    
    console.log(`✓ ${noticias.length} notícias válidas extraídas`);
    return noticias;
  } catch (error) {
    console.error('Erro ao processar Google Sheets:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const MAX_DURATION_MS = 50000; // 50s safety margin (limit is ~60s)

  function isTimingOut() {
    return Date.now() - startTime > MAX_DURATION_MS;
  }

  try {
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body ok */ }
    
    const batchSize = body.batchSize || 5;
    const offset = body.offset || 0;

    const { getRotatedKeyStrings } = await import("../_shared/gemini-keys.ts");
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const GEMINI_KEYS = getRotatedKeyStrings(true);
    
    if (GEMINI_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`🔍 Batch offset=${offset}, size=${batchSize}`);

    // Limpeza apenas no primeiro batch
    if (offset === 0) {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      
      const { data: dj } = await supabase
        .from('noticias_juridicas_cache')
        .delete()
        .lt('data_publicacao', seteDiasAtras.toISOString())
        .select('id');
      
      const { data: dc } = await supabase
        .from('noticias_concursos_cache')
        .delete()
        .lt('data_publicacao', seteDiasAtras.toISOString())
        .select('id');
      
      console.log(`🧹 Limpeza: ${dj?.length || 0} jurídicas + ${dc?.length || 0} concursos removidos`);
    }

    // Buscar notícias
    const todasNoticias = await buscarNoticiasDoSheets();
    
    if (todasNoticias.length === 0) {
      return new Response(
        JSON.stringify({ success: true, noticiasProcessadas: 0, message: 'Nenhuma notícia' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ordenar e pegar batch
    const noticiasOrdenadas = todasNoticias.sort((a, b) => 
      new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
    );
    
    const top20 = noticiasOrdenadas.slice(0, 20);
    const batch = top20.slice(offset, offset + batchSize);
    const hasMore = offset + batchSize < top20.length;
    
    console.log(`📰 Processando ${batch.length} notícias (${offset}-${offset + batch.length} de ${top20.length})`);

    let processadas = 0;

    for (const noticia of batch) {
      if (isTimingOut()) {
        console.log('⏱️ Timeout próximo, parando batch');
        break;
      }

      try {
        const isDireito = noticia.tipoCategoria === 'direito';
        const tabela = isDireito ? 'noticias_juridicas_cache' : 'noticias_concursos_cache';
        
        console.log(`📝 [${isDireito ? 'Direito' : 'Concurso'}] ${noticia.titulo.substring(0, 50)}...`);

        // Gerar análise com IA
        let analiseIA: any = null;
        let conteudoFormatado = '';
        let termosJson: any[] = [];

        const prompt = isDireito
          ? `Analise esta notícia jurídica e retorne JSON:
TÍTULO: ${noticia.titulo}
PORTAL: ${noticia.portal}

Retorne APENAS JSON válido:
{
  "conteudo_formatado": "Resumo jornalístico completo em 4-6 parágrafos. Separe com \\n\\n.",
  "analise_ia": {
    "resumoExecutivo": "Resumo DETALHADO em 4-5 parágrafos. Separe com \\n\\n.",
    "resumoFacil": "Explicação simples em 3-4 parágrafos. Separe com \\n\\n.",
    "pontosPrincipais": ["Ponto 1", "Ponto 2", "Ponto 3", "Ponto 4"],
    "impactoJuridico": "Impacto na prática jurídica em 2-3 parágrafos."
  },
  "termos_json": [{"termo": "Termo", "significado": "Definição"}]
}`
          : `Analise esta notícia de concurso público e retorne JSON:
TÍTULO: ${noticia.titulo}
PORTAL: ${noticia.portal}

Retorne APENAS JSON válido:
{
  "conteudo_formatado": "RESUMO em 3-5 parágrafos. Separe com \\n\\n.",
  "analise_ia": {
    "resumoExecutivo": "Análise técnica em 3-4 frases.",
    "resumoFacil": "Explicação em 2-3 frases simples.",
    "pontosPrincipais": ["Órgão", "Vagas", "Salário", "Requisitos", "Prazo"],
    "impactoJuridico": "Relevância para concurseiros."
  },
  "termos_json": [{"termo": "Termo", "significado": "Definição"}]
}`;

        for (let keyIndex = 0; keyIndex < GEMINI_KEYS.length; keyIndex++) {
          if (isTimingOut()) break;
          try {
            const geminiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEYS[keyIndex]}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { temperature: 0.4, maxOutputTokens: 3000 },
                }),
              }
            );

            if (geminiResponse.ok) {
              const geminiData = await geminiResponse.json();
              const resposta = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (resposta) {
                const resultado = extractJsonFromText(resposta);
                if (resultado) {
                  conteudoFormatado = resultado.conteudo_formatado || '';
                  analiseIA = resultado.analise_ia || null;
                  termosJson = Array.isArray(resultado.termos_json) ? resultado.termos_json : [];
                  break;
                }
              }
            } else if (geminiResponse.status === 429) {
              continue;
            }
          } catch (keyError) {
            console.error(`Erro chave ${keyIndex + 1}:`, keyError);
          }
        }

        // Converter imagem para WebP (skip if timing out)
        let imagemFinal = noticia.capa || null;
        if (!isTimingOut() && imagemFinal && !imagemFinal.includes('.webp') && !imagemFinal.includes('supabase')) {
          try {
            const webpResponse = await fetch(`${SUPABASE_URL}/functions/v1/converter-imagem-webp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              },
              body: JSON.stringify({ imageUrl: imagemFinal })
            });
            if (webpResponse.ok) {
              const webpData = await webpResponse.json();
              if (webpData.success && webpData.url) imagemFinal = webpData.url;
            }
          } catch { /* skip */ }
        }

        const { error: upsertError } = await supabase
          .from(tabela)
          .upsert({
            titulo: noticia.titulo,
            descricao: `${noticia.portal} - ${noticia.categoria}`,
            link: noticia.link,
            imagem: noticia.capa || null,
            imagem_webp: imagemFinal,
            fonte: noticia.portal,
            categoria: isDireito ? 'Direito' : 'Concurso',
            data_publicacao: noticia.dataHora,
            conteudo_formatado: conteudoFormatado || null,
            analise_ia: analiseIA ? JSON.stringify(analiseIA) : null,
            termos_json: termosJson.length > 0 ? termosJson : null,
            analise_gerada_em: analiseIA ? new Date().toISOString() : null,
          }, { onConflict: 'link' });

        if (!upsertError) {
          processadas++;
          console.log(`✅ Processada: ${noticia.titulo.substring(0, 40)}...`);
        } else {
          console.error(`❌ Erro: ${upsertError.message}`);
        }

        // Small delay between items
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (noticiaError) {
        console.error('Erro ao processar notícia:', noticiaError);
      }
    }

    console.log(`✨ Batch concluído: ${processadas} processadas`);

    return new Response(
      JSON.stringify({
        success: true,
        processadas,
        offset,
        nextOffset: hasMore ? offset + batchSize : null,
        hasMore,
        total: top20.length,
        message: `${processadas} notícias processadas (batch ${offset}-${offset + batch.length})`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
