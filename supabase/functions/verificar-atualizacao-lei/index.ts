import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Normaliza texto para comparação — remove formatação, espaços extras,
 * caracteres unicode especiais, pontuação variável, etc.
 */
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\u200B/g, '')
    .replace(/\(Vide [^)]*\)/gi, '') // remove vide references (cosmetic)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Normaliza número de artigo para chave de comparação.
 * "1" "01" "1º" "1°" → "1"
 * "5-A" "5A" "5º-A" → "5-A"
 */
function normalizeNumero(num: string): string {
  let n = num.trim().toUpperCase();
  n = n.replace(/[°ºª]/g, '');
  n = n.replace(/\./g, '');
  n = n.replace(/\s+/g, '');
  // Ensure suffix has hyphen: "5A" → "5-A"
  const match = n.match(/^(\d+)-?([A-Z])$/);
  if (match) return `${parseInt(match[1])}-${match[2]}`;
  const numMatch = n.match(/^(\d+)$/);
  if (numMatch) return String(parseInt(numMatch[1]));
  return n;
}

function extractNumeroArtigo(texto: string): string | null {
  const match = texto.match(/Art\.?\s*(\d+[°ºA-Z-]*)/i);
  if (!match) return null;
  return normalizeNumero(match[1]);
}

/**
 * Extrai artigos do HTML do Planalto.
 * Deduplicação: apenas a primeira ocorrência de cada número é mantida.
 */
function extractArtigosFromHtml(html: string): Array<{ numero: string; texto: string }> {
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  const artigos: Array<{ numero: string; texto: string }> = [];
  const vistos = new Set<string>();

  // Split by "Art." pattern — each chunk is one article
  const parts = text.split(/(?=Art\.?\s*\d+)/i);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const numero = extractNumeroArtigo(trimmed);
    if (!numero) continue;

    // Deduplicate — keep only first occurrence
    if (vistos.has(numero)) continue;
    vistos.add(numero);

    // Clean up the text body
    const textoLimpo = trimmed
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n+/g, '\n')
      .trim();

    artigos.push({ numero, texto: textoLimpo });
  }

  return artigos;
}

function detectMarcadoresAlteracao(texto: string): string[] {
  const marcadores: string[] = [];
  const patterns = [
    /\(Redação dada pela [^)]+\)/gi,
    /\(Incluído pela [^)]+\)/gi,
    /\(Incluída pela [^)]+\)/gi,
    /\(Revogado pela [^)]+\)/gi,
    /\(Revogada pela [^)]+\)/gi,
    /\(Alterado pela [^)]+\)/gi,
    /\(Acrescido pela [^)]+\)/gi,
    /\(Acrescentado pela [^)]+\)/gi,
    /\(Renumerado pela [^)]+\)/gi,
    /\(Vigência\)/gi,
  ];

  for (const pattern of patterns) {
    const matches = texto.match(pattern);
    if (matches) marcadores.push(...matches);
  }
  return marcadores;
}

/**
 * Busca TODOS os artigos da tabela, paginando em lotes de 1000.
 */
async function fetchAllArtigosBanco(supabase: any, tableName: string) {
  const allRows: any[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, Artigo, "Número do Artigo"')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName, urlPlanalto } = await req.json();

    if (!tableName || !urlPlanalto) {
      return new Response(
        JSON.stringify({ success: false, error: "tableName e urlPlanalto são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Verificando atualização: ${tableName}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Raspar HTML do Planalto
    let html = '';
    try {
      const resp = await fetch(urlPlanalto, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        }
      });
      if (resp.ok) {
        html = await resp.text();
        console.log(`✅ Fetch OK: ${html.length} chars`);
      }
    } catch (e) {
      console.log(`⚠️ Fetch erro: ${e}`);
    }

    // Fallback: Firecrawl
    if (!html || html.length < 500) {
      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (firecrawlKey) {
        try {
          const fcResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: urlPlanalto, formats: ['html'], onlyMainContent: false }),
          });
          const fcData = await fcResp.json();
          if (fcResp.ok && fcData.success) {
            html = fcData.data?.html || fcData.html || '';
          }
        } catch (e) {
          console.log(`⚠️ Firecrawl erro: ${e}`);
        }
      }
    }

    if (!html || html.length < 500) {
      return new Response(
        JSON.stringify({ success: false, error: "Não foi possível raspar o conteúdo do Planalto" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Extrair artigos do HTML (já deduplicados)
    const artigosPlanalto = extractArtigosFromHtml(html);
    console.log(`📋 Artigos extraídos do Planalto: ${artigosPlanalto.length}`);

    if (artigosPlanalto.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum artigo extraído do HTML." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Buscar TODOS artigos do banco (paginado)
    const artigosBanco = await fetchAllArtigosBanco(supabase, tableName);
    console.log(`📋 Artigos no banco: ${artigosBanco.length}`);

    // 4. Mapear artigos do banco por número normalizado
    const bancoMap = new Map<string, { id: number; texto: string; numero: string }>();
    for (const art of artigosBanco) {
      const raw = art["Número do Artigo"]?.toString();
      if (!raw) continue;
      const num = normalizeNumero(raw);
      if (!num) continue;
      // Keep first occurrence per number
      if (!bancoMap.has(num)) {
        bancoMap.set(num, {
          id: art.id,
          texto: art.Artigo || '',
          numero: num,
        });
      }
    }

    // 5. Comparar — only truly different content
    const artigosAlterados: Array<{
      numero: string;
      id: number | null;
      textoAtual: string;
      textoNovo: string;
      marcadores: string[];
      tipo: 'alterado' | 'novo' | 'removido';
    }> = [];

    const numerosPlanalto = new Set<string>();

    for (const artPlanalto of artigosPlanalto) {
      numerosPlanalto.add(artPlanalto.numero);
      const artBanco = bancoMap.get(artPlanalto.numero);

      if (!artBanco) {
        const marcadores = detectMarcadoresAlteracao(artPlanalto.texto);
        artigosAlterados.push({
          numero: artPlanalto.numero,
          id: null,
          textoAtual: '',
          textoNovo: artPlanalto.texto,
          marcadores,
          tipo: 'novo',
        });
        continue;
      }

      // Deep normalize both texts for comparison
      const textoNorm1 = normalizeText(artBanco.texto);
      const textoNorm2 = normalizeText(artPlanalto.texto);

      // Skip if texts are identical after normalization
      if (textoNorm1 === textoNorm2) continue;

      // Additional check: if the only difference is whitespace/formatting, skip
      const stripped1 = textoNorm1.replace(/[^a-z0-9]/g, '');
      const stripped2 = textoNorm2.replace(/[^a-z0-9]/g, '');
      if (stripped1 === stripped2) continue;

      // Real difference found
      const marcadores = detectMarcadoresAlteracao(artPlanalto.texto);
      const marcadoresAntigo = detectMarcadoresAlteracao(artBanco.texto);
      const marcadoresNovos = marcadores.filter(m =>
        !marcadoresAntigo.some(ma => normalizeText(ma) === normalizeText(m))
      );

      artigosAlterados.push({
        numero: artPlanalto.numero,
        id: artBanco.id,
        textoAtual: artBanco.texto,
        textoNovo: artPlanalto.texto,
        marcadores: marcadoresNovos.length > 0 ? marcadoresNovos : marcadores,
        tipo: 'alterado',
      });
    }

    // Sort by number
    artigosAlterados.sort((a, b) => {
      const numA = parseInt(a.numero.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.numero.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    console.log(`✅ Alterados: ${artigosAlterados.filter(a => a.tipo === 'alterado').length}`);
    console.log(`✅ Novos: ${artigosAlterados.filter(a => a.tipo === 'novo').length}`);

    return new Response(
      JSON.stringify({
        success: true,
        tableName,
        totalPlanalto: artigosPlanalto.length,
        totalBanco: artigosBanco.length,
        totalDiferencas: artigosAlterados.length,
        artigosAlterados: artigosAlterados.filter(a => a.tipo === 'alterado'),
        artigosNovos: artigosAlterados.filter(a => a.tipo === 'novo'),
        artigosRemovidos: [], // Removidos não são úteis neste contexto
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro: ${msg}`);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
