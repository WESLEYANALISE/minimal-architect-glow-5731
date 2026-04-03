import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================
// FUNÇÕES DE NORMALIZAÇÃO E AGRUPAMENTO DE SUBTEMAS
// =============================================

/**
 * Normaliza o título do subtema removendo sufixos "Parte I", "Parte II", etc.
 * Aceita variações como:
 * - " - PARTE I", " – Parte II", " — parte 2"
 * - " PARTE I" (sem hífen)
 * - "- PARTE 1", "– PARTE 2"
 * - Algarismos romanos (I, II, III, IV, V, VI, VII, VIII, IX, X, etc.)
 * - Algarismos arábicos (1, 2, 3, etc.)
 */
function normalizarTituloSubtema(titulo: string): string {
  if (!titulo) return '';
  
  let result = titulo.trim();
  
  // Padrão 1: " - PARTE I", " – PARTE II", " — PARTE 1", etc. (com separador)
  // Aceita -, –, — como separadores
  result = result.replace(
    /\s*[-–—]\s*PARTE\s+(I{1,4}|IV|V?I{0,3}|IX|X{1,3}|XI{1,3}|XIV|XV|XVI{1,3}|\d+)\s*:?\s*$/gi,
    ''
  );
  
  // Padrão 2: " PARTE I" (sem hífen, mas com espaço antes)
  result = result.replace(
    /\s+PARTE\s+(I{1,4}|IV|V?I{0,3}|IX|X{1,3}|XI{1,3}|XIV|XV|XVI{1,3}|\d+)\s*:?\s*$/gi,
    ''
  );
  
  // Padrão 3: "(PARTE I)" ou "( PARTE II )" - entre parênteses
  result = result.replace(
    /\s*\(\s*PARTE\s+(I{1,4}|IV|V?I{0,3}|IX|X{1,3}|XI{1,3}|XIV|XV|XVI{1,3}|\d+)\s*\)\s*$/gi,
    ''
  );
  
  // Limpar espaços múltiplos e trim
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

/**
 * Agrupa subtemas que compartilham o mesmo título normalizado (Parte I + Parte II → único)
 * Preserva a ordem do primeiro aparecimento de cada grupo.
 * Expande o range de páginas para cobrir todas as partes.
 */
function agruparSubtemasPorParte(
  subtemas: Array<{ ordem: number; titulo: string; pagina_inicial: number; pagina_final: number }>
): Array<{ ordem: number; titulo: string; pagina_inicial: number; pagina_final: number }> {
  if (!subtemas || subtemas.length === 0) return [];
  
  // Mapa para agrupar por título normalizado
  const grupos = new Map<string, Array<{ ordem: number; titulo: string; pagina_inicial: number; pagina_final: number }>>();
  const ordemGrupos: string[] = []; // Para preservar a ordem do primeiro aparecimento
  
  // Log: títulos antes do merge
  console.log(`\n🔄 [MERGE] Subtemas ANTES do agrupamento (${subtemas.length} total):`);
  
  for (const subtema of subtemas) {
    const tituloOriginal = subtema.titulo;
    const tituloNormalizado = normalizarTituloSubtema(tituloOriginal).toUpperCase();
    
    // Log se detectar "PARTE" no título original
    if (/PARTE\s+(I{1,4}|IV|V?I{0,3}|IX|X{1,3}|\d+)/i.test(tituloOriginal)) {
      console.log(`   🔍 Detectado "Parte": "${tituloOriginal}" → normalizado: "${tituloNormalizado}"`);
    }
    
    if (!grupos.has(tituloNormalizado)) {
      grupos.set(tituloNormalizado, []);
      ordemGrupos.push(tituloNormalizado);
    }
    grupos.get(tituloNormalizado)!.push(subtema);
  }
  
  // Construir subtemas agrupados
  const subtemasAgrupados: Array<{ ordem: number; titulo: string; pagina_inicial: number; pagina_final: number }> = [];
  let novaOrdem = 1;
  
  for (const chave of ordemGrupos) {
    const grupo = grupos.get(chave)!;
    
    // Ordenar partes por pagina_inicial
    grupo.sort((a, b) => a.pagina_inicial - b.pagina_inicial);
    
    // Título limpo (sem "Parte I/II")
    const tituloLimpo = normalizarTituloSubtema(grupo[0].titulo);
    
    // Página inicial = menor pagina_inicial do grupo
    const paginaInicial = Math.min(...grupo.map(g => g.pagina_inicial));
    
    // Página final = maior pagina_final do grupo
    const paginaFinal = Math.max(...grupo.map(g => g.pagina_final));
    
    // Log de merge se grupo tem mais de 1 item
    if (grupo.length > 1) {
      const partesOriginais = grupo.map(g => `"${g.titulo}" (${g.pagina_inicial}-${g.pagina_final})`).join(' + ');
      console.log(`   ✅ MERGE: ${partesOriginais} → "${tituloLimpo}" (${paginaInicial}-${paginaFinal})`);
    }
    
    subtemasAgrupados.push({
      ordem: novaOrdem++,
      titulo: tituloLimpo,
      pagina_inicial: paginaInicial,
      pagina_final: paginaFinal,
    });
  }
  
  // Log: resultado do merge
  console.log(`🔄 [MERGE] Subtemas DEPOIS do agrupamento: ${subtemas.length} → ${subtemasAgrupados.length}`);
  if (subtemas.length !== subtemasAgrupados.length) {
    console.log(`   📊 Redução: ${subtemas.length - subtemasAgrupados.length} subtemas mesclados`);
  }
  
  return subtemasAgrupados;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicoId, areaNome, temaNome } = await req.json();

    if (!topicoId) {
      throw new Error("topicoId é obrigatório");
    }

    console.log(`[OAB] Identificando subtemas para tópico ${topicoId} - Área: ${areaNome}, Tema: ${temaNome}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar páginas do tópico
    const { data: paginas, error: paginasError } = await supabase
      .from('oab_trilhas_topico_paginas')
      .select('pagina, conteudo')
      .eq('topico_id', topicoId)
      .order('pagina');

    if (paginasError || !paginas?.length) {
      throw new Error("Nenhum conteúdo encontrado para análise. Por favor, extraia o PDF primeiro.");
    }

    const totalPaginas = paginas.length;
    console.log(`📚 Analisando ${totalPaginas} páginas do tópico`);

    // Extrair títulos do índice (nível 1) de forma determinística para evitar "subtemas extras"
    // Observação: OCR às vezes remove o ponto após o número ("16 " ao invés de "16."),
    // e às vezes troca os pontilhados por caracteres similares. Por isso o regex é permissivo.
    const extrairTitulosIndiceNivel1 = (paginasIndice: Array<{ pagina: number; conteudo: string | null }>) => {
      // Log diagnóstico: páginas consideradas como índice
      console.log(`📑 Páginas de índice analisadas: [${paginasIndice.map(p => p.pagina).join(', ')}]`);
      
      const texto = paginasIndice
        .map(p => p.conteudo || '')
        .join('\n')
        .replace(/\r/g, '');

      const seen = new Set<string>();
      const items: Array<{ ordem: number; titulo: string; pagina_indice?: number }> = [];

      // Contador de matches por padrão para diagnóstico
      const matchCounts: Record<string, number> = {};

      // Múltiplos padrões para capturar diferentes formatos de índice:
      const patterns: Array<{ name: string; regex: RegExp }> = [
        // Padrão 1: "6. TITULO .... 17" ou "6. TITULO      17" (com pontilhados ou espaços)
        { 
          name: 'padrao1_ponto_pontilhado',
          regex: /(^|\n)\s*(\d{1,2})\s*[\.)\-]\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ(][^\n]{3,}?)(?:[\.\u00B7•‧…·\-_]{3,}|\s{3,})\s*(\d{1,4})\s*(?=\n|$)/g
        },
        // Padrão 2: "6 TITULO ...17" (sem ponto após número)
        { 
          name: 'padrao2_sem_ponto',
          regex: /(^|\n)\s*(\d{1,2})\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ(][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ(\s]{3,}?)(?:[\.\u00B7•‧…·\-_]{3,}|\s{3,})\s*(\d{1,4})\s*(?=\n|$)/g
        },
        // Padrão 3: Linha que termina com número de página após espaços (mais permissivo)
        { 
          name: 'padrao3_linha_final',
          regex: /(^|\n)\s*(\d{1,2})\s*[\.)\-]?\s*([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ(][^\n]{5,}?)\s+(\d{1,3})\s*$/gm
        },
        // Padrão 4: Headers markdown "## 6. TITULO...17" ou "# 6) TITULO ... 17" (índice em formato de título)
        { 
          name: 'padrao4_header_markdown',
          regex: /(^|\n)\s*#{1,6}\s*(\d{1,2})\s*[\.)\-]?\s*([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ(][^\n]{3,}?)(?:[\.\u00B7•‧…·\-_]{2,}|\s{2,})\s*(\d{1,4})\s*(?=\n|$)/g
        },
        // Padrão 5: Variação de header com título e número no final após ... (ex: "## 6. MEDIDA DE SEGURANÇA...17")
        { 
          name: 'padrao5_header_titulo_num',
          regex: /(^|\n)\s*#{1,6}\s*(\d{1,2})\s*[\.)\-]\s+([^\n]+?)\.{2,}\s*(\d{1,4})\s*(?=\n|$)/g
        },
      ];

      for (const { name, regex: re } of patterns) {
        matchCounts[name] = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(texto)) !== null) {
          matchCounts[name]++;
          
          const ordem = Number(m[2]);
          const rawTitulo = (m[3] || '').trim();
          const paginaIndice = Number(m[4]);

          // Ignorar números de página muito altos (provavelmente não é índice)
          if (paginaIndice > 500) continue;

          // Normalizações mínimas
          let titulo = rawTitulo
            .replace(/\s+/g, ' ')
            .replace(/[\.\u00B7•‧…·\-_]{2,}$/g, '')
            .trim();

          // Remover números finais que podem ser da página
          titulo = titulo.replace(/\s+\d{1,3}$/g, '').trim();

          // Evitar títulos muito curtos ou só números
          if (!titulo || titulo.length < 3 || /^\d+$/.test(titulo)) continue;

          // Evitar duplicados (por ordem)
          const key = `${ordem}`;
          if (seen.has(key)) continue;
          seen.add(key);

          items.push({ ordem, titulo, pagina_indice: Number.isFinite(paginaIndice) ? paginaIndice : undefined });
        }
      }

      // Log diagnóstico: matches por padrão
      console.log(`🔍 Matches por padrão regex:`);
      for (const [name, count] of Object.entries(matchCounts)) {
        console.log(`   - ${name}: ${count} matches`);
      }

      // Ordenar por ordem numérica
      items.sort((a, b) => a.ordem - b.ordem);

      // Se houver repetição do mesmo "ordem", manter o primeiro (índice às vezes repete a linha no OCR)
      const byOrdem = new Map<number, { ordem: number; titulo: string; pagina_indice?: number }>();
      for (const it of items) {
        if (!byOrdem.has(it.ordem)) byOrdem.set(it.ordem, it);
      }

      const uniq = Array.from(byOrdem.values()).sort((a, b) => a.ordem - b.ordem);

      // Log diagnóstico: itens finais extraídos
      console.log(`📋 Itens de índice extraídos (${uniq.length} total):`);
      uniq.forEach(i => console.log(`   ${i.ordem}. "${i.titulo}" => pág ${i.pagina_indice ?? '?'}`));

      // Limite defensivo aumentado para suportar índices maiores
      return uniq.slice(0, 50);
    };

    // Criar mapa de páginas para acesso rápido
    const paginasMap = new Map<number, string>();
    paginas.forEach(p => {
      if (p.conteudo) {
        paginasMap.set(p.pagina, p.conteudo);
      }
    });

    // Detectar páginas do índice
    // Estratégia:
    // 1) Sempre considera as primeiras 15 páginas (índice costuma estar no começo, mas pode ter 3-4 páginas)
    // 2) Adiciona páginas que contenham "ÍNDICE"/"SUMÁRIO" em qualquer posição
    // 3) Filtra por densidade de matches do padrão de linha de índice para evitar falsos positivos
    // Observação: alguns PDFs vêm com o índice "formatado" como títulos markdown (ex.: "## 6. MEDIDA...17")
    // então aceitamos também esse padrão.
    const indiceLineRe = /(^|\n)\s*(\d{1,2})\s*(?:[\.)\-])?\s+([^\n]+?)(?:[\.\u00B7•‧…]{3,}|\s{2,}|\t)+\s*(\d{1,4})\s*(?=\n|$)/g;
    const indiceHeaderRe = /(^|\n)\s*#{1,6}\s*(\d{1,2})\s*[\.)]\s+([^\n]+?)(?:\.\.\.|[\.\u00B7•‧…]{3,}|\s{2,}|\t)+\s*(\d{1,4})\s*(?=\n|$)/g;

    const candidatosIndice = paginas.filter((p) => {
      // Aumentado para 15 páginas para cobrir índices longos (3-4 páginas)
      if (p.pagina <= 15) return true;
      const texto = (p.conteudo || '').toUpperCase();
      return texto.includes('ÍNDICE') || texto.includes('SUMÁRIO');
    });

    const paginasIndice = candidatosIndice.filter((p) => {
      const t = (p.conteudo || '').replace(/\r/g, '');
      const matchesLinhas = t.match(indiceLineRe);
      const matchesHeaders = t.match(indiceHeaderRe);

      // índice geralmente tem várias linhas; exigir pelo menos 2 (para índices parciais em páginas)
      return (matchesLinhas?.length || 0) >= 2 || (matchesHeaders?.length || 0) >= 2;
    });

    const titulosIndiceNivel1 = extrairTitulosIndiceNivel1(paginasIndice);
    if (titulosIndiceNivel1.length) {
      console.log(`📑 Índice detectado: ${titulosIndiceNivel1.length} itens nível 1`);
      titulosIndiceNivel1.forEach(i => console.log(`  - ${i.ordem}. ${i.titulo}${i.pagina_indice ? ` (índice pág ${i.pagina_indice})` : ''}`));
    } else {
      console.log("ℹ️ Nenhum item de índice (nível 1) detectado via regex; usando identificação sem guia do índice.");
    }

    // ✅ Se o índice tem página inicial confiável, gerar subtemas DIRETAMENTE do índice.
    // Isso evita que o Gemini troque títulos (ex.: item 16 virar "CULPABILIDADE") ou misture faixas de páginas.
    const indiceComPaginas = titulosIndiceNivel1.filter(i => Number.isFinite(i.pagina_indice));
    const indiceEhConfiavel =
      titulosIndiceNivel1.length >= 3 &&
      indiceComPaginas.length / titulosIndiceNivel1.length >= 0.7;

    if (titulosIndiceNivel1.length && indiceEhConfiavel) {
      const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

      // Ordenar por ordem
      const itens = [...titulosIndiceNivel1].sort((a, b) => a.ordem - b.ordem);

      // Construir ranges a partir das páginas do índice
      let subtemasValidados = itens.map((it, idx) => {
        const prox = itens[idx + 1];

        const startRaw = Number(it.pagina_indice ?? 1);
        const endRaw = prox?.pagina_indice ? Number(prox.pagina_indice) - 1 : totalPaginas;

        // Garantir monotonicidade e limites
        const pagina_inicial = clamp(startRaw, 1, totalPaginas);
        const pagina_final = clamp(Math.max(endRaw, pagina_inicial), 1, totalPaginas);

        return {
          ordem: idx + 1,
          titulo: (it.titulo || '').toString().trim(),
          pagina_inicial,
          pagina_final,
        };
      });

      console.log(`✅ Subtemas (via índice) ANTES do merge: ${subtemasValidados.length}`);
      subtemasValidados.forEach((s: any) => {
        console.log(`  ${s.ordem}. ${s.titulo} (págs ${s.pagina_inicial}-${s.pagina_final})`);
      });

      // =============================================
      // APLICAR AGRUPAMENTO POR "PARTE I/II"
      // =============================================
      subtemasValidados = agruparSubtemasPorParte(subtemasValidados);

      console.log(`✅ Subtemas (via índice) APÓS merge: ${subtemasValidados.length}`);
      subtemasValidados.forEach((s: any) => {
        console.log(`  ${s.ordem}. ${s.titulo} (págs ${s.pagina_inicial}-${s.pagina_final})`);
      });

      // =========================================
      // Salvar conteúdo na tabela conteudo_oab_revisao
      // =========================================
      console.log("📝 Salvando conteúdo extraído por subtema na tabela conteudo_oab_revisao...");

      // Deletar registros antigos para este tema
      await supabase
        .from('conteudo_oab_revisao')
        .delete()
        .eq('tema', temaNome);

      // Inserir conteúdo de cada subtema
      for (const subtema of subtemasValidados) {
        let conteudoDoSubtema = '';

        for (let pag = subtema.pagina_inicial; pag <= subtema.pagina_final; pag++) {
          const conteudoPagina = paginasMap.get(pag);
          if (conteudoPagina) {
            conteudoDoSubtema += `\n\n--- PÁGINA ${pag} ---\n\n${conteudoPagina}`;
          }
        }

        conteudoDoSubtema = conteudoDoSubtema.trim();

        if (conteudoDoSubtema.length > 0) {
          const { error: upsertError } = await supabase
            .from('conteudo_oab_revisao')
            .upsert({
              tema: temaNome,
              subtema: subtema.titulo,
              pagina_inicial: subtema.pagina_inicial,
              pagina_final: subtema.pagina_final,
              conteudo_original: conteudoDoSubtema,
              area: areaNome,
              topico_id: topicoId
            }, { onConflict: 'tema,subtema' });

          if (upsertError) {
            console.error(`Erro ao salvar subtema "${subtema.titulo}":`, upsertError);
          }
        } else {
          console.warn(`⚠️ Subtema "${subtema.titulo}" sem conteúdo!`);
        }
      }

      // Atualizar tópico com subtemas identificados
      await supabase
        .from('oab_trilhas_topicos')
        .update({
          status: 'aguardando_confirmacao',
          subtemas_identificados: subtemasValidados
        })
        .eq('id', topicoId);

      return new Response(
        JSON.stringify({
          success: true,
          subtemas: subtemasValidados,
          message: `${subtemasValidados.length} subtemas identificados via índice e conteúdo salvo`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limite dinâmico
    const limitePorPagina = totalPaginas > 100 ? 300 
                          : totalPaginas > 50 ? 500 
                          : totalPaginas > 30 ? 800 
                          : 2000;

    const conteudoAnalise = paginas
      .map(p => {
        const ehPaginaIndice = paginasIndice.some(pi => pi.pagina === p.pagina);
        const limite = ehPaginaIndice ? 8000 : limitePorPagina;
        return `--- PÁGINA ${p.pagina} ${ehPaginaIndice ? '(ÍNDICE)' : ''} ---\n${p.conteudo?.substring(0, limite) || ''}`;
      })
      .join('\n\n');

    const indiceObrigatorio = titulosIndiceNivel1.length
      ? `\n## 📑 ÍNDICE DETECTADO (ITENS NÍVEL 1 - OBRIGATÓRIOS)\n${titulosIndiceNivel1
          .map(i => `${i.ordem}. ${i.titulo}`)
          .join('\n')}\n`
      : '';

    const prompt = `Você é um especialista em análise de materiais de estudo para OAB.

CONTEXTO:
- Área: ${areaNome}
- Tema: ${temaNome}

${indiceObrigatorio}

CONTEÚDO (${paginas.length} páginas):
${conteudoAnalise}

## 🎯 SUA TAREFA: EXTRAIR OS SUBTEMAS (SEÇÕES) DESTE MATERIAL

Analise o material e extraia os SUBTEMAS principais que serão salvos como tópicos de estudo.
Cada subtema será um item de estudo separado na tabela RESUMO.

## FORMATO DE RESPOSTA:

{
  "subtemas": [
    {
      "ordem": 1,
      "titulo": "Nome do Subtema",
      "pagina_inicial": 1,
      "pagina_final": 5
    }
  ]
}

## REGRAS:

1. Se o ÍNDICE DETECTADO (itens nível 1) estiver presente acima, você DEVE retornar EXATAMENTE esses itens como subtemas (sem criar outros)
2. NUNCA inclua subtópicos/linhas secundárias do índice como subtema (somente os itens numerados nível 1: "1.", "2.", ...)
3. Caso não haja índice detectado, extraia entre 3 a 10 subtemas dependendo do tamanho do material
2. Cada subtema deve ser uma seção lógica do conteúdo
3. Use títulos claros e descritivos
4. Mantenha a ordem sequencial das páginas
5. O último subtema deve terminar na página ${totalPaginas}
6. Se o material for curto (< 10 páginas), pode ter menos subtemas
7. Não invente subtemas que não existem no índice

RESPONDA APENAS COM JSON válido, sem texto adicional:`;

    // Obter chaves Gemini
    const geminiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
    ].filter(Boolean) as string[];

    if (!geminiKeys.length) {
      throw new Error("Nenhuma chave Gemini configurada");
    }

    let geminiResponse: Response | null = null;
    let lastError = "";

    for (const geminiKey of geminiKeys) {
      console.log("Tentando chave Gemini...");

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096
              }
            })
          }
        );

        if (response.ok) {
          geminiResponse = response;
          console.log("✅ Gemini respondeu com sucesso");
          break;
        } else {
          lastError = await response.text();
          console.error(`Erro com chave (${response.status}):`, lastError.substring(0, 200));
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.error("Erro de conexão:", lastError);
      }
    }

    if (!geminiResponse) {
      throw new Error(`Todas as chaves Gemini falharam: ${lastError.substring(0, 100)}`);
    }

    const geminiData = await geminiResponse.json();
    let textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Limpar JSON
    textResponse = textResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log("Resposta Gemini:", textResponse.substring(0, 500));

    let parsed: any;
    let subtemas: any[] = [];

    if (textResponse.startsWith('{')) {
      try {
        parsed = JSON.parse(textResponse);
        subtemas = parsed.subtemas || [];
      } catch (parseError) {
        console.error("Erro ao parsear JSON:", parseError);
      }
    }

    if (!subtemas.length) {
      const jsonMatch = textResponse.match(/\{[\s\S]*"subtemas"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          subtemas = parsed.subtemas || [];
          console.log("JSON extraído de texto misto");
        } catch (e) {
          console.error("Falha ao extrair JSON embutido");
        }
      }
    }

    // Fallback se não conseguiu extrair
    if (!subtemas.length) {
      console.log("⚠️ Gemini não retornou JSON válido. Criando estrutura básica.");
      const subtemasEstimados = Math.min(5, Math.max(2, Math.ceil(totalPaginas / 5)));
      const paginasPorSubtema = Math.ceil(totalPaginas / subtemasEstimados);
      
      for (let i = 0; i < subtemasEstimados; i++) {
        subtemas.push({
          ordem: i + 1,
          titulo: `Seção ${i + 1}`,
          pagina_inicial: i * paginasPorSubtema + 1,
          pagina_final: Math.min((i + 1) * paginasPorSubtema, totalPaginas)
        });
      }
    }

    // Validar e normalizar subtemas
    let subtemasValidados = subtemas.map((s: any, idx: number) => ({
      ordem: idx + 1,
      titulo: (s.titulo || '').toString().trim(),
      pagina_inicial: Math.max(1, Number(s.pagina_inicial || 1)),
      pagina_final: Math.min(totalPaginas, Number(s.pagina_final || totalPaginas))
    }));

    // Se temos itens nível 1 do índice, forçar correspondência e remover "extras"
    if (titulosIndiceNivel1.length) {
      const norm = (t: string) =>
        t
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

      const indiceNorm = titulosIndiceNivel1.map(i => ({ ...i, n: norm(i.titulo) }));

      // Mapear por "match aproximado" (contains) e cair para ordem do índice
      const escolhidos: Array<{ ordem: number; titulo: string; pagina_inicial: number; pagina_final: number }> = [];
      for (const item of indiceNorm) {
        const match = subtemasValidados.find(s => {
          const ns = norm(s.titulo);
          return ns === item.n || ns.includes(item.n) || item.n.includes(ns);
        });

        escolhidos.push({
          ordem: item.ordem,
          titulo: match?.titulo || item.titulo,
          pagina_inicial: match?.pagina_inicial || 1,
          pagina_final: match?.pagina_final || totalPaginas,
        });
      }

      // Ajustar páginas para ficarem contínuas e sem sobreposição
      escolhidos.sort((a, b) => a.ordem - b.ordem);
      for (let i = 0; i < escolhidos.length; i++) {
        const atual = escolhidos[i];
        const prox = escolhidos[i + 1];
        const start = Math.max(1, atual.pagina_inicial);
        const end = prox ? Math.max(start, Math.min(totalPaginas, (prox.pagina_inicial || start) - 1)) : totalPaginas;
        atual.pagina_inicial = start;
        atual.pagina_final = end;
      }

      // Reindexar ordem sequencial (1..N) para a UI, mantendo títulos do índice
      subtemasValidados = escolhidos.map((s, idx) => ({
        ordem: idx + 1,
        titulo: s.titulo,
        pagina_inicial: s.pagina_inicial,
        pagina_final: s.pagina_final,
      }));
    }

    console.log(`✅ Subtemas (via Gemini) ANTES do merge: ${subtemasValidados.length}`);

    // =============================================
    // APLICAR AGRUPAMENTO POR "PARTE I/II"
    // =============================================
    subtemasValidados = agruparSubtemasPorParte(subtemasValidados);

    console.log(`✅ Subtemas (via Gemini) APÓS merge: ${subtemasValidados.length}`);

    // =========================================
    // NOVA LÓGICA: Salvar conteúdo na tabela conteudo_oab_revisao
    // =========================================
    console.log("📝 Salvando conteúdo extraído por subtema na tabela conteudo_oab_revisao...");

    // Deletar registros antigos para este tema
    await supabase
      .from('conteudo_oab_revisao')
      .delete()
      .eq('tema', temaNome);

    // Inserir conteúdo de cada subtema
    for (const subtema of subtemasValidados) {
      let conteudoDoSubtema = '';
      
      for (let pag = subtema.pagina_inicial; pag <= subtema.pagina_final; pag++) {
        const conteudoPagina = paginasMap.get(pag);
        if (conteudoPagina) {
          conteudoDoSubtema += `\n\n--- PÁGINA ${pag} ---\n\n${conteudoPagina}`;
        }
      }
      
      conteudoDoSubtema = conteudoDoSubtema.trim();
      
      if (conteudoDoSubtema.length > 0) {
        const { error: upsertError } = await supabase
          .from('conteudo_oab_revisao')
          .upsert({
            tema: temaNome,
            subtema: subtema.titulo,
            pagina_inicial: subtema.pagina_inicial,
            pagina_final: subtema.pagina_final,
            conteudo_original: conteudoDoSubtema,
            area: areaNome,
            topico_id: topicoId
          }, { onConflict: 'tema,subtema' });

        if (upsertError) {
          console.error(`Erro ao salvar subtema "${subtema.titulo}":`, upsertError);
        } else {
          console.log(`  ✓ Subtema "${subtema.titulo}": ${conteudoDoSubtema.length} chars (págs ${subtema.pagina_inicial}-${subtema.pagina_final})`);
        }
      } else {
        console.warn(`  ⚠️ Subtema "${subtema.titulo}" sem conteúdo!`);
      }
    }

    console.log("✅ Conteúdo salvo na tabela conteudo_oab_revisao");

    // Log dos subtemas identificados
    subtemasValidados.forEach((s: any) => {
      console.log(`  ${s.ordem}. ${s.titulo} (págs ${s.pagina_inicial}-${s.pagina_final})`);
    });

    // Atualizar tópico com subtemas identificados
    await supabase
      .from('oab_trilhas_topicos')
      .update({ 
        status: 'aguardando_confirmacao',
        subtemas_identificados: subtemasValidados
      })
      .eq('id', topicoId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        subtemas: subtemasValidados,
        message: `${subtemasValidados.length} subtemas identificados e conteúdo salvo`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro na identificação:", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
