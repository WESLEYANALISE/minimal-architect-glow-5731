import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═══════════════════════════════════════════════════════════════════════════
// EXTRAÇÃO VIA REGEX (PRIMEIRO MÉTODO - SEM IA)
// ═══════════════════════════════════════════════════════════════════════════

function extrairEmentaViaRegex(textoBruto: string): {
  ementa: string | null;
  fonte: string;
} {
  if (!textoBruto) {
    return { ementa: null, fonte: 'texto vazio' };
  }

  console.log('🔎 Iniciando extração via regex...');

  // MÉTODO 0 (PRIORITÁRIO): Extrair tudo entre título da lei e "O PRESIDENTE"
  // Busca o texto vermelho que está antes de "O PRESIDENTE DA REPÚBLICA"
  const regexTituloAtePresidente = /(?:DE\s+\d{1,2}\s+DE\s+\w+\s+DE\s+\d{4}[.\s]*)([\s\S]*?)(?=O\s+PRESIDENTE\s+DA\s+REP[ÚU]BLICA)/i;
  const matchPosicional = textoBruto.match(regexTituloAtePresidente);
  
  if (matchPosicional?.[1]) {
    // Limpar o HTML e extrair só o texto
    const textoEntre = matchPosicional[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Verificar se começa com verbo típico de ementa
    if (textoEntre && textoEntre.length > 30 && 
        textoEntre.match(/^(Abre|Altera|Dispõe|Institui|Estabelece|Autoriza|Cria|Modifica|Regulamenta|Aprova|Dá|Denomina|Acrescenta|Revoga|Inclui|Fixa|Estima|Inscreve|Confere|Concede|Reabre|Torna|Extingue|Converte|Declara|Transforma|Ratifica|Promulga|Reconhece)/i)) {
      console.log('✅ Ementa encontrada via regex (posicional: título até PRESIDENTE)');
      console.log(`📝 Ementa: ${textoEntre.substring(0, 100)}...`);
      return { ementa: textoEntre, fonte: 'regex:posicional-presidente' };
    }
  }

  // MÉTODO 1: Buscar td que contém múltiplos spans com color:#800000
  // Este é o padrão mais comum no Planalto para ementas longas
  const regexTdEmenta = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const tdsMatches = textoBruto.matchAll(regexTdEmenta);
  
  for (const tdMatch of tdsMatches) {
    const tdContent = tdMatch[1];
    // Verificar se este td contém elementos com cor vermelha
    if (tdContent && tdContent.includes('#800000')) {
      // Extrair todo o texto do td, removendo tags
      let texto = tdContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Remover tudo a partir de "O PRESIDENTE" se existir
      const idxPresidente = texto.search(/O\s+PRESIDENTE/i);
      if (idxPresidente > 0) {
        texto = texto.substring(0, idxPresidente).trim();
      }
      
      // Verificar se começa com verbo típico de ementa
      if (texto && texto.length > 30 && 
          texto.match(/^(Abre|Altera|Dispõe|Institui|Estabelece|Autoriza|Cria|Modifica|Regulamenta|Aprova|Dá|Denomina|Acrescenta|Revoga|Inclui|Fixa|Estima|Inscreve|Confere|Concede|Reabre|Torna|Extingue|Converte|Declara|Transforma|Ratifica|Promulga|Reconhece)/i)) {
        console.log('✅ Ementa encontrada via regex (td com cor vermelha)');
        return { ementa: texto, fonte: 'regex:td-color:#800000' };
      }
    }
  }

  // MÉTODO 2: Concatenar todos os spans/fonts com cor vermelha consecutivos
  const partesVermelhas: string[] = [];
  const regexVermelho = /<(?:span|font)[^>]*(?:color[=:]["']?#800000|style="[^"]*color:\s*#?800000)[^>]*>([\s\S]*?)<\/(?:span|font)>/gi;
  let matches = textoBruto.matchAll(regexVermelho);
  
  for (const match of matches) {
    const texto = match[1]
      ?.replace(/<[^>]+>/g, '')
      ?.replace(/&nbsp;/g, ' ')
      ?.replace(/&quot;/g, '"')
      ?.trim();
    
    if (texto && texto.length > 0) {
      partesVermelhas.push(texto);
    }
  }
  
  if (partesVermelhas.length > 0) {
    const textoCompleto = partesVermelhas.join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (textoCompleto.length > 30 && !textoCompleto.match(/^(Lei|O\s+PRESIDENTE|Vigência|Mensagem)/i)) {
      console.log('✅ Ementa encontrada via regex (spans vermelhos concatenados)');
      return { ementa: textoCompleto, fonte: 'regex:spans-concatenados' };
    }
  }

  // MÉTODO 3: Font color="#800000" (formato antigo)
  const regexFontColor = /<font\s+color=["']?#800000["']?[^>]*>([\s\S]*?)<\/font>/gi;
  matches = textoBruto.matchAll(regexFontColor);
  
  for (const match of matches) {
    const texto = match[1]
      ?.replace(/<[^>]+>/g, '')
      ?.replace(/&nbsp;/g, ' ')
      ?.replace(/\s+/g, ' ')
      ?.trim();
    
    if (texto && texto.length > 30 && !texto.match(/^(Lei|O\s+PRESIDENTE|Vigência|Mensagem)/i)) {
      console.log('✅ Ementa encontrada via regex (font color)');
      return { ementa: texto, fonte: 'regex:font-color' };
    }
  }

  // MÉTODO 4: Classe específica de ementa
  const regexEmenta = /<(?:p|div|span)[^>]*class="[^"]*ementa[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div|span)>/gi;
  matches = textoBruto.matchAll(regexEmenta);
  
  for (const match of matches) {
    const texto = match[1]
      ?.replace(/<[^>]+>/g, '')
      ?.replace(/&nbsp;/g, ' ')
      ?.replace(/\s+/g, ' ')
      ?.trim();
    
    if (texto && texto.length > 20) {
      console.log('✅ Ementa encontrada via regex (class ementa)');
      return { ementa: texto, fonte: 'regex:class-ementa' };
    }
  }

  // MÉTODO 5: Texto entre o título da lei e "O PRESIDENTE"
  const regexEntreTituloPresidente = /(?:DE\s+\d{4}\s*\.?\s*<\/[^>]+>)([\s\S]*?)(?:<[^>]*>?\s*O\s+PRESIDENTE)/i;
  const matchTitulo = textoBruto.match(regexEntreTituloPresidente);
  
  if (matchTitulo?.[1]) {
    const texto = matchTitulo[1]
      ?.replace(/<[^>]+>/g, '')
      ?.replace(/&nbsp;/g, ' ')
      ?.replace(/\s+/g, ' ')
      ?.trim();
    
    if (texto && texto.length > 20 && texto.length < 1000) {
      console.log('✅ Ementa encontrada via regex (entre título e presidente)');
      return { ementa: texto, fonte: 'regex:posicional' };
    }
  }

  return { ementa: null, fonte: 'regex:não encontrado' };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTRAÇÃO VIA IA (FALLBACK)
// ═══════════════════════════════════════════════════════════════════════════

const PROMPT_EXTRAIR_EMENTA = (textoBruto: string, ementaAtual: string, numeroLei: string) => `Você é um especialista em legislação brasileira.

TAREFA: Verificar e extrair a EMENTA correta da lei ${numeroLei}.

EMENTA ATUAL NO SISTEMA: "${ementaAtual}"

TEXTO BRUTO DA LEI (HTML do Planalto):
${textoBruto.substring(0, 20000)}

---

INSTRUÇÕES:
1. A ementa é o texto que descreve o objetivo/conteúdo da lei
2. NO HTML DO PLANALTO, a ementa geralmente está:
   - Em texto vermelho (color="#800000" ou <font color="#800000">)
   - Logo após o título da lei (LEI Nº X.XXX, DE XX DE XXX DE XXXX)
   - ANTES de "O PRESIDENTE DA REPÚBLICA"
3. A ementa geralmente COMEÇA com verbos como:
   - Abre, Altera, Dispõe, Institui, Estabelece, Autoriza, Cria, Modifica
   - Regulamenta, Aprova, Dá, Denomina, Acrescenta, Revoga, Inclui
   - Fixa, Estima, Inscreve, Confere, Concede, Reabre, Torna, Extingue
4. A ementa NÃO é:
   - O número/título da lei (ex: "Lei nº 15.312, de 22.12.2025")
   - O texto "O PRESIDENTE DA REPÚBLICA..."
   - Textos como "Vigência", "Conversão de Medida Provisória"

RESPONDA EM JSON:
{
  "ementa_correta": "texto completo da ementa extraída do HTML",
  "ementa_atual_correta": true ou false,
  "confianca": "alta", "media" ou "baixa",
  "fonte": "onde encontrou a ementa no HTML (ex: font color=#800000)"
}

SE NÃO ENCONTRAR UMA EMENTA VÁLIDA:
{
  "ementa_correta": null,
  "ementa_atual_correta": false,
  "confianca": "baixa",
  "fonte": "não encontrada"
}`;

async function extrairEmentaComGemini(
  textoBruto: string, 
  ementaAtual: string, 
  numeroLei: string
): Promise<{
  ementa_correta: string | null;
  ementa_atual_correta: boolean;
  confianca: string;
  fonte: string;
} | null> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    console.error('LOVABLE_API_KEY não configurada');
    return null;
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'user', content: PROMPT_EXTRAIR_EMENTA(textoBruto, ementaAtual, numeroLei) }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Gemini:', response.status, errorText);
      
      // Retornar erro específico para falta de créditos
      if (response.status === 402) {
        return {
          ementa_correta: null,
          ementa_atual_correta: false,
          confianca: 'baixa',
          fonte: 'erro:402-sem-creditos'
        };
      }
      if (response.status === 429) {
        return {
          ementa_correta: null,
          ementa_atual_correta: false,
          confianca: 'baixa',
          fonte: 'erro:429-rate-limit'
        };
      }
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.log('Resposta vazia da IA');
      return null;
    }

    // Parsear JSON da resposta
    try {
      // Remover markdown se houver
      const jsonStr = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
      const resultado = JSON.parse(jsonStr);
      return resultado;
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', parseError, content);
      return null;
    }
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error);
    return null;
  }
}

// Validar se ementa parece correta (não é título da lei ou está truncada)
function ementaPareceInvalida(ementa: string | null): boolean {
  if (!ementa) return true;
  if (ementa.length < 20) return true;
  if (/^Lei\s+(nº|Ordinária|Complementar)/i.test(ementa)) return true;
  if (/^Vigência/i.test(ementa)) return true;
  if (/^O\s*PRESIDENTE/i.test(ementa)) return true;
  if (/^Ementa pendente/i.test(ementa)) return true;
  
  // Verificar se ementa parece truncada (termina com vírgula, preposição, artigo, etc.)
  const ementaTrimmed = ementa.trim();
  const terminacoesTruncadas = [
    /,\s*$/,           // termina com vírgula
    /\s+da?$/i,        // termina com "da" ou "d"
    /\s+de$/i,         // termina com "de"
    /\s+do$/i,         // termina com "do"
    /\s+das?$/i,       // termina com "das" ou "da"
    /\s+dos?$/i,       // termina com "dos" ou "do"
    /\s+e$/i,          // termina com "e"
    /\s+ou$/i,         // termina com "ou"
    /\s+a$/i,          // termina com "a"
    /\s+o$/i,          // termina com "o"
    /\s+as$/i,         // termina com "as"
    /\s+os$/i,         // termina com "os"
    /\s+para$/i,       // termina com "para"
    /\s+com$/i,        // termina com "com"
    /\s+em$/i,         // termina com "em"
    /\s+no$/i,         // termina com "no"
    /\s+na$/i,         // termina com "na"
    /\s+ao$/i,         // termina com "ao"
    /\s+à$/i,          // termina com "à"
  ];
  
  for (const regex of terminacoesTruncadas) {
    if (regex.test(ementaTrimmed)) {
      console.log(`⚠️ Ementa parece truncada (termina com padrão suspeito): "${ementaTrimmed.slice(-20)}"`);
      return true;
    }
  }
  
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const leiId = body.leiId; // ID específico da lei
    const limite = body.limite || 10; // Limite para processamento em lote
    const forcarRevisao = body.forcarRevisao || false; // Revisar mesmo ementas aparentemente válidas

    // Query para buscar leis
    let query = supabase
      .from('leis_push_2025')
      .select('id, numero_lei, ementa, texto_bruto, url_planalto');

    if (leiId) {
      // Processar lei específica
      query = query.eq('id', leiId);
    } else if (!forcarRevisao) {
      // Buscar apenas leis com ementas problemáticas
      query = query.or(
        'ementa.ilike.Lei nº%,' +
        'ementa.ilike.Lei Ordinária%,' +
        'ementa.ilike.Lei Complementar%,' +
        'ementa.eq.Ementa pendente de extração,' +
        'ementa.eq.Ementa pendente,' +
        'ementa.is.null'
      );
    }

    const { data: leis, error } = await query.limit(limite);

    if (error) {
      throw error;
    }

    if (!leis || leis.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma lei encontrada para revisão',
          revisadas: 0,
          corrigidas: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Revisando ${leis.length} lei(s)...`);

    const resultados: {
      numero_lei: string;
      ementa_antiga: string;
      ementa_nova: string | null;
      corrigida: boolean;
      confianca: string;
      fonte: string;
    }[] = [];

    for (const lei of leis) {
      console.log(`\n🔍 Revisando: ${lei.numero_lei}`);
      
      // Verificar se tem texto_bruto
      if (!lei.texto_bruto) {
        console.log(`⚠️ Sem texto_bruto, pulando ${lei.numero_lei}`);
        resultados.push({
          numero_lei: lei.numero_lei,
          ementa_antiga: lei.ementa || '',
          ementa_nova: null,
          corrigida: false,
          confianca: 'baixa',
          fonte: 'sem texto_bruto'
        });
        continue;
      }

      // Verificar se ementa atual parece inválida (ou forçar revisão)
      const precisaRevisao = forcarRevisao || ementaPareceInvalida(lei.ementa);
      
      if (!precisaRevisao) {
        console.log(`✅ Ementa parece válida: ${lei.ementa?.substring(0, 50)}...`);
        resultados.push({
          numero_lei: lei.numero_lei,
          ementa_antiga: lei.ementa || '',
          ementa_nova: lei.ementa,
          corrigida: false,
          confianca: 'alta',
          fonte: 'ementa válida'
        });
        continue;
      }

      // PRIMEIRO: Tentar extrair via REGEX (rápido, sem custo)
      console.log(`🔎 Tentando extrair ementa via regex para ${lei.numero_lei}...`);
      const regexResult = extrairEmentaViaRegex(lei.texto_bruto);
      
      let resultado: {
        ementa_correta: string | null;
        ementa_atual_correta: boolean;
        confianca: string;
        fonte: string;
      } | null = null;

      if (regexResult.ementa && !ementaPareceInvalida(regexResult.ementa)) {
        // Regex encontrou uma ementa válida!
        console.log(`✅ Regex encontrou ementa: ${regexResult.ementa.substring(0, 60)}...`);
        resultado = {
          ementa_correta: regexResult.ementa,
          ementa_atual_correta: false,
          confianca: 'alta',
          fonte: regexResult.fonte
        };
      } else {
        // FALLBACK: Tentar com IA (Gemini)
        console.log(`🤖 Regex não encontrou, tentando Gemini para ${lei.numero_lei}...`);
        resultado = await extrairEmentaComGemini(
          lei.texto_bruto,
          lei.ementa || '',
          lei.numero_lei
        );
      }

      if (!resultado || !resultado.ementa_correta) {
        console.log(`❌ Não conseguiu extrair ementa para ${lei.numero_lei}`);
        resultados.push({
          numero_lei: lei.numero_lei,
          ementa_antiga: lei.ementa || '',
          ementa_nova: null,
          corrigida: false,
          confianca: resultado?.confianca || 'baixa',
          fonte: resultado?.fonte || 'erro'
        });
        continue;
      }

      // Validar ementa extraída
      if (ementaPareceInvalida(resultado.ementa_correta)) {
        console.log(`⚠️ Ementa extraída parece inválida: ${resultado.ementa_correta?.substring(0, 50)}`);
        resultados.push({
          numero_lei: lei.numero_lei,
          ementa_antiga: lei.ementa || '',
          ementa_nova: null,
          corrigida: false,
          confianca: 'baixa',
          fonte: 'ementa extraída inválida'
        });
        continue;
      }

      // Limpar ementa
      const ementaLimpa = resultado.ementa_correta
        .replace(/\s+/g, ' ')
        .replace(/^\s*\.\s*/, '')
        .trim();

      // Verificar se é diferente da atual
      const ementaAtualNormalizada = (lei.ementa || '').replace(/\s+/g, ' ').trim();
      if (ementaLimpa === ementaAtualNormalizada) {
        console.log(`✅ Ementa já está correta: ${ementaLimpa.substring(0, 50)}...`);
        resultados.push({
          numero_lei: lei.numero_lei,
          ementa_antiga: lei.ementa || '',
          ementa_nova: ementaLimpa,
          corrigida: false,
          confianca: resultado.confianca,
          fonte: resultado.fonte
        });
        continue;
      }

      // Atualizar no banco
      console.log(`📝 Atualizando ementa: ${ementaLimpa.substring(0, 60)}...`);
      
      const { error: updateError } = await supabase
        .from('leis_push_2025')
        .update({ ementa: ementaLimpa })
        .eq('id', lei.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar ${lei.numero_lei}:`, updateError);
        resultados.push({
          numero_lei: lei.numero_lei,
          ementa_antiga: lei.ementa || '',
          ementa_nova: ementaLimpa,
          corrigida: false,
          confianca: resultado.confianca,
          fonte: 'erro ao salvar'
        });
      } else {
        console.log(`✅ Corrigida: ${lei.numero_lei}`);
        resultados.push({
          numero_lei: lei.numero_lei,
          ementa_antiga: lei.ementa || '',
          ementa_nova: ementaLimpa,
          corrigida: true,
          confianca: resultado.confianca,
          fonte: resultado.fonte
        });
      }

      // Delay entre requisições para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const revisadas = resultados.length;
    const corrigidas = resultados.filter(r => r.corrigida).length;

    console.log(`\n📊 Resumo: ${corrigidas}/${revisadas} ementas corrigidas`);

    // Se processou uma lei específica, retornar a ementa corrigida diretamente
    if (leiId && resultados.length === 1) {
      const resultado = resultados[0];
      return new Response(
        JSON.stringify({
          success: true,
          message: resultado.corrigida ? 'Ementa corrigida' : 'Ementa já está correta',
          ementaCorrigida: resultado.ementa_nova,
          ementaAntiga: resultado.ementa_antiga,
          corrigida: resultado.corrigida,
          confianca: resultado.confianca,
          fonte: resultado.fonte
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${corrigidas} de ${revisadas} ementas corrigidas`,
        revisadas,
        corrigidas,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao revisar ementas:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
