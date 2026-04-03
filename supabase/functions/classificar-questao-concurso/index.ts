import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de área/tema → tabela do Vade Mecum para buscar artigos de apoio
const AREA_TO_VADEMECUM_TABLE: Record<string, string> = {
  'direito penal': 'CP - Código Penal',
  'direito processual penal': 'CPP – Código de Processo Penal',
  'direito civil': 'CC - Código Civil',
  'direito processual civil': 'CPC – Código de Processo Civil',
  'direito constitucional': 'CF - Constituição Federal',
  'direito do consumidor': 'CDC – Código de Defesa do Consumidor',
  'direito do trabalho': 'CLT - Consolidação das Leis do Trabalho',
  'direito tributário': 'CTN – Código Tributário Nacional',
  'direito de trânsito': 'CTB Código de Trânsito Brasileiro',
  'direito eleitoral': 'CE – Código Eleitoral',
  'direito administrativo': 'CF - Constituição Federal',
  'direito ambiental': 'LEI 9605 - CRIMES AMBIENTAIS',
  'legislação penal especial': 'CP - Código Penal',
  'estatuto da criança e do adolescente': 'ESTATUTO - ECA',
  'estatuto do idoso': 'ESTATUTO - IDOSO',
  'estatuto da oab': 'ESTATUTO - OAB',
  'execução penal': 'Lei 7.210 de 1984 - Lei de Execução Penal',
  'lei maria da penha': 'Lei 11.340 de 2006 - Maria da Penha',
  'lei de drogas': 'Lei 11.343 de 2006 - Lei de Drogas',
  'crimes hediondos': 'Lei 8.072 de 1990 - Crimes Hediondos',
  'abuso de autoridade': 'Lei 13.869 de 2019 - Abuso de Autoridade',
  'juizados especiais': 'Lei 9.099 de 1995 - Juizados Especiais',
};

function findVadeMecumTable(tema: string, subtema: string, enunciado: string): string | null {
  const searchText = `${tema} ${subtema} ${enunciado}`.toLowerCase();
  
  // Busca direta pelo tema
  const temaLower = tema.toLowerCase().trim();
  if (AREA_TO_VADEMECUM_TABLE[temaLower]) {
    return AREA_TO_VADEMECUM_TABLE[temaLower];
  }
  
  // Busca por palavras-chave no enunciado
  for (const [key, table] of Object.entries(AREA_TO_VADEMECUM_TABLE)) {
    if (searchText.includes(key)) return table;
  }
  
  // Busca por menção de código/lei
  if (/código\s*penal|art\.?\s*\d+.*cp\b/i.test(searchText)) return 'CP - Código Penal';
  if (/código\s*civil|art\.?\s*\d+.*cc\b/i.test(searchText)) return 'CC - Código Civil';
  if (/constituição|art\.?\s*\d+.*cf\b/i.test(searchText)) return 'CF - Constituição Federal';
  if (/clt|consolidação.*leis.*trabalho/i.test(searchText)) return 'CLT - Consolidação das Leis do Trabalho';
  if (/cdc|código.*defesa.*consumidor/i.test(searchText)) return 'CDC – Código de Defesa do Consumidor';
  if (/cpp|código.*processo\s*penal/i.test(searchText)) return 'CPP – Código de Processo Penal';
  if (/cpc|código.*processo\s*civil/i.test(searchText)) return 'CPC – Código de Processo Civil';
  
  return null;
}

// Busca artigos de lei na internet via Perplexity quando não encontra no Vade Mecum local
async function buscarArtigosNaInternet(enunciado: string, tema: string, subtema: string, perplexityKey: string): Promise<{ texto: string; fontes: string[] }> {
  try {
    // Extrair menções a leis no enunciado
    const leisMencionadas: string[] = [];
    const regexLeis = [
      /lei\s*(?:n[ºo°]?\s*)?(\d[\d.]*\/\d{4})/gi,
      /lei\s+(?:orgânica|complementar|federal|estadual|municipal)\s+[^,.;]+/gi,
      /(?:código|estatuto|decreto)[^,.;]{3,40}/gi,
      /lei\s+[\w\s]+(?:de\s+\d{4})/gi,
    ];
    
    for (const regex of regexLeis) {
      const matches = enunciado.match(regex);
      if (matches) leisMencionadas.push(...matches);
    }
    
    // Extrair artigos mencionados
    const artigosMatch = enunciado.match(/art(?:igo)?\.?\s*\d+[A-Z]?(?:[°ºª])?(?:\s*,\s*(?:§|inciso|parágrafo|alínea)\s*[^,.;]+)?/gi) || [];
    
    const contexto = leisMencionadas.length > 0
      ? `Leis mencionadas: ${leisMencionadas.join('; ')}`
      : `Tema: ${tema}${subtema ? ` - ${subtema}` : ''}`;
    
    const artigosRef = artigosMatch.length > 0
      ? `Artigos citados: ${artigosMatch.join(', ')}`
      : '';

    console.log(`[classificar] Buscando artigos na internet via Perplexity. ${contexto}. ${artigosRef}`);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente jurídico especializado em legislação brasileira. Sua tarefa é encontrar o texto EXATO de artigos de lei mencionados em questões de concurso. Retorne APENAS o texto dos artigos encontrados, sem comentários adicionais. Formato: "Art. X: [texto do artigo]". Se houver parágrafos e incisos relevantes, inclua-os.'
          },
          {
            role: 'user',
            content: `Encontre o texto exato dos artigos de lei mencionados nesta questão de concurso.\n\n${contexto}\n${artigosRef}\n\nTrecho da questão: "${enunciado.substring(0, 500)}"\n\nRetorne o texto dos artigos relevantes da legislação brasileira.`
          }
        ],
        search_domain_filter: ['planalto.gov.br', 'normas.leg.br'],
        temperature: 0.0,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('[classificar] Erro Perplexity (artigos internet):', response.status);
      return { texto: '', fontes: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations: string[] = data.citations || [];
    
    if (content && content.length > 20) {
      console.log(`[classificar] Perplexity encontrou artigos na internet (${content.length} chars). Fontes: ${citations.slice(0, 3).join(', ')}`);
      return {
        texto: `[FONTE: Internet - ${citations.slice(0, 2).join(', ')}]\n${content.substring(0, 1500)}`,
        fontes: citations.filter((c: string) => c && c.startsWith('http')).slice(0, 5)
      };
    }

    console.log('[classificar] Perplexity não encontrou artigos relevantes na internet');
    return { texto: '', fontes: [] };
  } catch (error) {
    console.error('[classificar] Erro ao buscar artigos na internet:', error);
    return { texto: '', fontes: [] };
  }
}

async function buscarMaterialApoio(
  supabase: any, tema: string, subtema: string, enunciado: string, perplexityKey?: string
): Promise<{ resumoTexto: string; artigosTexto: string; fontes: string[] }> {
  let resumoTexto = '';
  let artigosTexto = '';
  let fontes: string[] = [];

  try {
    // 1. Buscar na tabela RESUMO por tema
    const { data: resumos } = await supabase
      .from('RESUMO')
      .select('resumo_markdown, exemplos, termos')
      .or(`tema.ilike.%${tema}%,subtema.ilike.%${subtema || tema}%`)
      .limit(3);

    if (resumos && resumos.length > 0) {
      const trechos: string[] = [];
      for (const r of resumos) {
        if (r.resumo_markdown) {
          trechos.push(r.resumo_markdown.substring(0, 800));
        }
        if (r.exemplos) {
          trechos.push(`Exemplos: ${typeof r.exemplos === 'string' ? r.exemplos.substring(0, 300) : JSON.stringify(r.exemplos).substring(0, 300)}`);
        }
      }
      resumoTexto = trechos.join('\n\n').substring(0, 2000);
      console.log(`[classificar] Encontrados ${resumos.length} resumos de apoio (${resumoTexto.length} chars)`);
    }
  } catch (e) {
    console.warn('[classificar] Erro ao buscar RESUMO:', e);
  }

  try {
    // 2. Buscar artigos do Vade Mecum
    const tableName = findVadeMecumTable(tema, subtema, enunciado);
    if (tableName) {
      console.log(`[classificar] Buscando artigos em: ${tableName}`);
      
      const artigosMatch = enunciado.match(/art(?:igo)?\.?\s*(\d+[A-Z]?(?:-[A-Z])?)/gi) || [];
      const numeros = artigosMatch.map(m => {
        const n = m.match(/(\d+[A-Z]?(?:-[A-Z])?)/i);
        return n ? n[1] : null;
      }).filter(Boolean);

      let artigos: any[] = [];
      
      if (numeros.length > 0) {
        const { data } = await supabase
          .from(tableName)
          .select('"Número do Artigo", Artigo')
          .in('"Número do Artigo"', numeros.map(n => `Art. ${n}`))
          .limit(5);
        if (data && data.length > 0) artigos = data;
      }
      
      if (artigos.length === 0) {
        const palavrasChave = (subtema || tema).split(/[\s,]+/).filter(p => p.length > 3).slice(0, 3);
        if (palavrasChave.length > 0) {
          const { data } = await supabase
            .from(tableName)
            .select('"Número do Artigo", Artigo')
            .or(palavrasChave.map(p => `Artigo.ilike.%${p}%`).join(','))
            .limit(5);
          if (data && data.length > 0) artigos = data;
        }
      }

      if (artigos.length > 0) {
        artigosTexto = artigos
          .map((a: any) => `${a["Número do Artigo"]}: ${(a.Artigo || '').substring(0, 300)}`)
          .join('\n')
          .substring(0, 1500);
        fontes.push(`Vade Mecum local: ${tableName}`);
        console.log(`[classificar] Encontrados ${artigos.length} artigos de apoio (${artigosTexto.length} chars)`);
      }
    }
  } catch (e) {
    console.warn('[classificar] Erro ao buscar Vade Mecum:', e);
  }

  // 3. Fallback: se não encontrou artigos no Vade Mecum, buscar na internet
  if (!artigosTexto && perplexityKey) {
    console.log('[classificar] Nenhum artigo no Vade Mecum local. Buscando na internet...');
    const resultado = await buscarArtigosNaInternet(enunciado, tema, subtema, perplexityKey);
    artigosTexto = resultado.texto;
    fontes = [...fontes, ...resultado.fontes];
  }

  return { resumoTexto, artigosTexto, fontes };
}

async function buscarNoQConcursosPerplexity(enunciado: string, perplexityKey: string): Promise<{ tema: string; subtema: string } | null> {
  try {
    const trecho = enunciado.substring(0, 250).replace(/["\n\r]/g, ' ').trim();
    
    console.log('[classificar] Buscando classificação via Perplexity Sonar...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'Você busca questões no site qconcursos.com e extrai a classificação. A classificação no QConcursos aparece como "Disciplina > Assunto" ou "Disciplina > Assunto > Detalhe". Retorne SOMENTE JSON: {"tema": "Disciplina", "subtema": "Assunto completo"}. Se não encontrar, retorne {"tema": "", "subtema": ""}.'
          },
          {
            role: 'user',
            content: `Busque esta questão no qconcursos.com e extraia a classificação (disciplina e assunto) como aparece no site.\n\nTrecho: "${trecho}"\n\nRetorne APENAS JSON com tema e subtema.`
          }
        ],
        search_domain_filter: ['qconcursos.com'],
        temperature: 0.0,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('[classificar] Erro Perplexity:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];
    
    console.log('[classificar] Perplexity respondeu:', content.substring(0, 300));
    if (citations.length > 0) {
      console.log('[classificar] Fontes:', citations.slice(0, 3).join(', '));
    }

    if (/não (tenho|consigo|posso) acesso|cannot access|unable to/i.test(content)) {
      console.log('[classificar] Perplexity não conseguiu acessar QConcursos');
      return null;
    }

    const parsed = extractJsonFromResponse(content) as { tema?: string; subtema?: string } | null;
    
    if (parsed?.tema && parsed.tema.trim().length > 2) {
      console.log(`[classificar] Perplexity encontrou: tema="${parsed.tema}", subtema="${parsed.subtema || ''}"`);
      return { tema: parsed.tema.trim(), subtema: (parsed.subtema || '').trim() };
    }

    const temaMatch = content.match(/(?:disciplina|tema|matéria)[:\s]+["']?([A-Za-zÀ-ú\s]{3,})/i);
    const subtemaMatch = content.match(/(?:subtema|assunto)[:\s]+["']?([A-Za-zÀ-ú\s,\-]{3,})/i);
    
    if (temaMatch && temaMatch[1].trim().length > 2) {
      const tema = temaMatch[1].trim();
      const subtema = subtemaMatch ? subtemaMatch[1].trim() : '';
      console.log(`[classificar] Perplexity (text fallback): tema="${tema}", subtema="${subtema}"`);
      return { tema, subtema };
    }

    console.log('[classificar] Perplexity não encontrou classificação válida');
    return null;
  } catch (error) {
    console.error('[classificar] Erro na busca Perplexity:', error);
    return null;
  }
}

function extractJsonFromResponse(textoCru: string): Record<string, unknown> | null {
  const cleanText = textoCru
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();

  const candidates = [
    cleanText,
    ...(cleanText.match(/\{[\s\S]*\}/g) ?? []),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        const repaired = candidate
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[""]/g, '"')
          .replace(/['']/g, "'");
        return JSON.parse(repaired);
      } catch {
        // tenta próximo candidato
      }
    }
  }

  return null;
}

async function callGemini(
  prompt: string, geminiKeys: string[], maxTokens: number, temperature: number,
  model: string = 'gemini-2.5-flash'
): Promise<string | null> {
  for (const key of geminiKeys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens: maxTokens }
          })
        }
      );

      if (response.status === 429) { await response.text(); continue; }
      if (!response.ok) { await response.text(); continue; }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p: any) => p?.text ?? '').join('').trim();
      if (text) {
        console.log(`[classificar] ${model} respondeu (${text.length} chars)`);
        return text;
      }
    } catch { continue; }
  }
  
  // Fallback: se Pro falhar, tentar Flash
  if (model !== 'gemini-2.5-flash') {
    console.log(`[classificar] ${model} falhou em todas as chaves, tentando fallback flash...`);
    return callGemini(prompt, geminiKeys, maxTokens, temperature, 'gemini-2.5-flash');
  }
  
  return null;
}

async function callGeminiJSON(prompt: string, geminiKeys: string[], maxTokens: number): Promise<Record<string, unknown> | null> {
  const MODELS = ['gemini-2.5-flash'];
  
  for (const model of MODELS) {
    for (const key of geminiKeys) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: maxTokens,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (response.status === 429) { await response.text(); continue; }
        if (!response.ok) { await response.text(); continue; }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts ?? [];
        const text = parts.map((p: any) => p?.text ?? '').join('').trim();
        if (!text) continue;

        const parsed = extractJsonFromResponse(text);
        if (parsed) return parsed;
      } catch { continue; }
    }
  }
  return null;
}

async function classificarComGemini(
  enunciado: string, alternativas: string, gabarito: string, materia: string, geminiKeys: string[]
): Promise<{ tema: string; subtema: string }> {
  const prompt = `Você é um classificador de questões de concursos públicos brasileiros.

Analise esta questão e forneça:
1. TEMA: A matéria/disciplina específica da questão. NÃO use categorias genéricas como "Direito". Use a matéria específica. Exemplos: "Português", "Língua Portuguesa", "Direito Administrativo", "Direito Constitucional", "Raciocínio Lógico", "Informática", "Contabilidade".
2. SUBTEMA: O assunto específico dentro da matéria, seguindo o padrão do QConcursos. Exemplos: "Interpretação de Textos, Noções Gerais de Compreensão e Interpretação de Texto", "Improbidade Administrativa - Lei nº 8.429/1992", "Direitos e Garantias Fundamentais, Direitos e Deveres Individuais e Coletivos".

QUESTÃO:
${enunciado}

${alternativas ? `ALTERNATIVAS:\n${alternativas}` : '(Questão do tipo Certo/Errado, sem alternativas)'}

GABARITO: ${gabarito}
MATÉRIA INFORMADA: ${materia || 'Não especificada'}

Retorne SOMENTE JSON válido (sem markdown) neste formato:
{"tema": "...", "subtema": "..."}`;

  const parsed = await callGeminiJSON(prompt, geminiKeys, 300) as { tema?: string; subtema?: string } | null;
  
  if (parsed?.tema) {
    console.log(`[classificar] Gemini classificou: tema="${parsed.tema}", subtema="${parsed.subtema}"`);
    return { tema: parsed.tema, subtema: parsed.subtema || '' };
  }

  return { tema: materia || 'Direito', subtema: '' };
}

// 3 perfis de comparação para preview_compare
const COMPARISON_PROFILES = [
  {
    id: 'A',
    label: 'Precisão Máxima (IRAC)',
    modelo_preferido: 'gemini-2.5-pro',
    modelo_fallback: 'gemini-2.5-flash',
    mecanica: 'IRAC',
    buildPrompt: (gabLabel: string, tema: string, subtema: string, enunciado: string, alternativas: string, gabarito: string, secaoApoio: string) =>
      `Você é um jurista especialista em concursos públicos. Use o método IRAC para comentar esta questão.

FORMATO OBRIGATÓRIO:
**${gabLabel}. FUNDAMENTO:**

MÉTODO IRAC:
1. ISSUE (Questão): Identifique o ponto jurídico central
2. RULE (Regra): Cite o dispositivo legal EXATO (artigo, parágrafo, inciso)
3. APPLICATION (Aplicação): Aplique a regra ao caso da questão
4. CONCLUSION (Conclusão): Justifique por que a alternativa é correta

REGRAS CRÍTICAS:
- Comece EXATAMENTE com "**${gabLabel}. FUNDAMENTO:**"
- NUNCA invente artigos — cite APENAS os do material de apoio ou que tem certeza ABSOLUTA
- Se não souber o artigo exato, diga "conforme a legislação pertinente" em vez de inventar
- Use **negrito** para termos e artigos importantes
- 80 a 150 palavras. Termine com frase completa e ponto final.

TEMA: ${tema} | SUBTEMA: ${subtema}
QUESTÃO: ${enunciado}
${alternativas ? `ALTERNATIVAS:\n${alternativas}` : '(Certo/Errado)'}
GABARITO: ${gabarito}
${secaoApoio}
Comentário:`
  },
  {
    id: 'B',
    label: 'Checklist Normativo',
    modelo_preferido: 'gemini-2.5-flash',
    modelo_fallback: 'gemini-2.5-flash',
    mecanica: 'Checklist',
    buildPrompt: (gabLabel: string, tema: string, subtema: string, enunciado: string, alternativas: string, gabarito: string, secaoApoio: string) =>
      `Você é um professor de legislação para concursos. Comente esta questão usando checklist normativo factual.

FORMATO OBRIGATÓRIO:
**${gabLabel}. FUNDAMENTO:**

MÉTODO CHECKLIST NORMATIVO:
- Identifique QUAL LEI e QUAL ARTIGO se aplica
- Verifique se os REQUISITOS do artigo são cumpridos na questão
- Confirme se a alternativa correta atende aos requisitos legais
- Se a alternativa errada mais atrativa violar algum requisito, mencione brevemente

REGRAS CRÍTICAS:
- Comece EXATAMENTE com "**${gabLabel}. FUNDAMENTO:**"
- CITE APENAS artigos do material de apoio fornecido — NUNCA invente
- Se o artigo exato não estiver disponível, fundamente na doutrina sem inventar número
- Use **negrito** nos artigos e termos-chave
- 80 a 150 palavras. Termine com frase completa e ponto final.

TEMA: ${tema} | SUBTEMA: ${subtema}
QUESTÃO: ${enunciado}
${alternativas ? `ALTERNATIVAS:\n${alternativas}` : '(Certo/Errado)'}
GABARITO: ${gabarito}
${secaoApoio}
Comentário:`
  },
  {
    id: 'C',
    label: 'Refutação por Alternativas',
    modelo_preferido: 'gemini-2.5-pro',
    modelo_fallback: 'gemini-2.5-flash',
    mecanica: 'Refutação',
    buildPrompt: (gabLabel: string, tema: string, subtema: string, enunciado: string, alternativas: string, gabarito: string, secaoApoio: string) =>
      `Você é um especialista em bancas de concurso. Comente esta questão justificando a correta e refutando as incorretas.

FORMATO OBRIGATÓRIO:
**${gabLabel}. FUNDAMENTO:**

MÉTODO REFUTAÇÃO:
- Primeiro: explique POR QUE a alternativa correta está certa, citando o dispositivo legal
- Depois: refute as alternativas mais atrativas (pegadinhas), explicando o erro de cada uma
- Destaque a "armadilha" da banca se houver

REGRAS CRÍTICAS:
- Comece EXATAMENTE com "**${gabLabel}. FUNDAMENTO:**"
- CITE APENAS artigos reais do material de apoio — NUNCA invente artigos
- Se não tiver certeza do artigo exato, diga "nos termos da legislação aplicável"
- Use **negrito** para artigos e termos-chave
- 80 a 200 palavras. Termine com frase completa e ponto final.

TEMA: ${tema} | SUBTEMA: ${subtema}
QUESTÃO: ${enunciado}
${alternativas ? `ALTERNATIVAS:\n${alternativas}` : '(Certo/Errado)'}
GABARITO: ${gabarito}
${secaoApoio}
Comentário:`
  }
];

async function gerarComentarioComRevisao(
  enunciado: string, alternativas: string, gabarito: string, tema: string, subtema: string,
  ehCertoErrado: boolean, geminiKeys: string[],
  materialApoio: { resumoTexto: string; artigosTexto: string }
): Promise<string> {
  const gabLabel = ehCertoErrado
    ? (gabarito.toUpperCase() === 'C' || gabarito.toLowerCase() === 'certo' ? 'CERTO' : 'ERRADO')
    : `LETRA ${gabarito.toUpperCase()} CORRETA`;

  // Montar seção de material de apoio
  let secaoApoio = '';
  if (materialApoio.resumoTexto) {
    secaoApoio += `\n\n=== MATERIAL DE APOIO (RESUMO ACADÊMICO) ===\n${materialApoio.resumoTexto}\n`;
  }
  if (materialApoio.artigosTexto) {
    secaoApoio += `\n=== ARTIGOS DE LEI (VADE MECUM - USE COMO REFERÊNCIA) ===\n${materialApoio.artigosTexto}\n`;
  }

  // === PASS 1: Gerar com Gemini Pro + material de apoio ===
  const promptGerador = `Você é um professor de concursos públicos altamente qualificado. Elabore um comentário COMPLETO e FUNDAMENTADO sobre esta questão.

FORMATO OBRIGATÓRIO:
**${gabLabel}. FUNDAMENTO:** [explicação completa e fundamentada]

REGRAS:
- Comece EXATAMENTE com "**${gabLabel}. FUNDAMENTO:**"
- Cite artigos de lei REAIS quando aplicável, usando **negrito** — baseie-se nos artigos fornecidos abaixo
- Use **negrito** para termos jurídicos importantes
- Escreva entre 80 e 150 palavras
- OBRIGATÓRIO: termine o texto com uma frase completa seguida de ponto final
- NUNCA corte o texto no meio de uma frase
- NUNCA invente artigos de lei — cite APENAS os que estão no material de apoio abaixo ou que você tem certeza absoluta
- Se houver material de apoio disponível, USE-O para fundamentar a explicação

TEMA: ${tema} | SUBTEMA: ${subtema}

QUESTÃO: ${enunciado}
${alternativas ? `ALTERNATIVAS:\n${alternativas}` : '(Certo/Errado)'}
GABARITO: ${gabarito}
${secaoApoio}
Comentário:`;

  console.log(`[classificar] Pass 1: Gerando comentário com gemini-2.5-pro (apoio: resumo=${materialApoio.resumoTexto.length}chars, artigos=${materialApoio.artigosTexto.length}chars)...`);
  const comentarioInicial = await callGemini(promptGerador, geminiKeys, 4096, 0.5, 'gemini-2.5-pro');
  
  if (!comentarioInicial) {
    return `**${gabLabel}. FUNDAMENTO:** A alternativa indicada está alinhada com a legislação aplicável ao tema de **${tema}** e a interpretação predominante.`;
  }

  // === PASS 2: Revisar com Flash (mais rápido/barato) ===
  const promptRevisor = `Revise este comentário de questão de concurso. Verifique:
1. Artigos/leis citados estão corretos? Compare com os artigos de referência abaixo.
2. O texto está COMPLETO e termina com uma frase completa seguida de ponto final?
3. Começa com "**${gabLabel}. FUNDAMENTO:**"?
4. Se o texto está cortado ou incompleto, COMPLETE a explicação.
5. Se algum artigo citado estiver ERRADO ou INVENTADO, corrija usando os artigos de referência.

QUESTÃO: ${enunciado}
${alternativas ? `ALTERNATIVAS:\n${alternativas}` : '(Certo/Errado)'}
GABARITO: ${gabarito}
${materialApoio.artigosTexto ? `\n=== ARTIGOS DE REFERÊNCIA PARA VALIDAÇÃO ===\n${materialApoio.artigosTexto}\n` : ''}
COMENTÁRIO PARA REVISAR:
${comentarioInicial}

Se estiver correto e completo, retorne igual. Se houver erro, estiver incompleto ou cortado no meio de uma frase, corrija e COMPLETE. Retorne APENAS o comentário final:`;

  console.log('[classificar] Pass 2: Revisando com gemini-2.5-flash...');
  const comentarioRevisado = await callGemini(promptRevisor, geminiKeys, 4096, 0.2, 'gemini-2.5-flash');

  return comentarioRevisado || comentarioInicial;
}

// Gera um candidato com um perfil específico
async function gerarCandidato(
  profile: typeof COMPARISON_PROFILES[0],
  enunciado: string, alternativas: string, gabarito: string,
  tema: string, subtema: string, ehCertoErrado: boolean,
  geminiKeys: string[], materialApoio: { resumoTexto: string; artigosTexto: string }
): Promise<{ id: string; label: string; mecanica: string; modelo_solicitado: string; modelo_usado: string; comentario: string; fontes: string[] }> {
  const gabLabel = ehCertoErrado
    ? (gabarito.toUpperCase() === 'C' || gabarito.toLowerCase() === 'certo' ? 'CERTO' : 'ERRADO')
    : `LETRA ${gabarito.toUpperCase()} CORRETA`;

  let secaoApoio = '';
  if (materialApoio.resumoTexto) secaoApoio += `\n\n=== MATERIAL DE APOIO ===\n${materialApoio.resumoTexto}\n`;
  if (materialApoio.artigosTexto) secaoApoio += `\n=== ARTIGOS DE LEI (USE COMO REFERÊNCIA — NÃO INVENTE) ===\n${materialApoio.artigosTexto}\n`;

  const prompt = profile.buildPrompt(gabLabel, tema, subtema, enunciado, alternativas, gabarito, secaoApoio);

  console.log(`[compare] Gerando candidato ${profile.id} (${profile.mecanica}) com ${profile.modelo_preferido}...`);
  
  // Try preferred model first
  let resultado = await callGemini(prompt, geminiKeys, 4096, 0.3, profile.modelo_preferido);
  let modeloUsado = profile.modelo_preferido;
  
  if (!resultado && profile.modelo_fallback !== profile.modelo_preferido) {
    console.log(`[compare] Fallback para ${profile.modelo_fallback}...`);
    resultado = await callGemini(prompt, geminiKeys, 4096, 0.3, profile.modelo_fallback);
    modeloUsado = profile.modelo_fallback;
  }

  if (!resultado) {
    resultado = `**${gabLabel}. FUNDAMENTO:** Não foi possível gerar comentário com este perfil.`;
    modeloUsado = 'nenhum';
  }

  return {
    id: profile.id,
    label: profile.label,
    mecanica: profile.mecanica,
    modelo_solicitado: profile.modelo_preferido,
    modelo_usado: modeloUsado,
    comentario: resultado,
    fontes: []
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { questaoId, action = 'classify', candidatoId, comentario: comentarioEscolhido, fontes: fontesEscolhidas } = body;

    if (!questaoId) {
      throw new Error('questaoId é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // === ACTION: preview_apply — salvar candidato escolhido ===
    if (action === 'preview_apply') {
      if (!comentarioEscolhido) throw new Error('comentario é obrigatório para preview_apply');
      
      const { error: updateError } = await supabase
        .from('simulados_questoes')
        .update({
          comentario_ia: comentarioEscolhido,
          fontes_comentario: fontesEscolhidas || null,
        })
        .eq('id', questaoId);

      if (updateError) throw updateError;
      
      console.log(`[classificar] preview_apply: Comentário salvo para questão ${questaoId}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: questao, error: fetchError } = await supabase
      .from('simulados_questoes')
      .select('*')
      .eq('id', questaoId)
      .single();

    if (fetchError || !questao) {
      throw new Error(`Questão ${questaoId} não encontrada`);
    }

    const alternativasTexto = ['a', 'b', 'c', 'd', 'e']
      .map(l => questao[`alternativa_${l}`] ? `${l.toUpperCase()}) ${questao[`alternativa_${l}`]}` : '')
      .filter(Boolean).join('\n');

    const ehCertoErrado = /^(certo|errado|c|e|v|f)$/i.test(questao.gabarito || '') && 
      (!questao.alternativa_c && !questao.alternativa_d);

    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');

    const GEMINI_KEYS = [
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
    ].filter(Boolean) as string[];

    if (GEMINI_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    // === ACTION: preview_compare — gerar 3 candidatos sem salvar ===
    if (action === 'preview_compare') {
      // Precisamos de tema para buscar material de apoio
      let tema = questao.tema_qc || '';
      let subtema = questao.subtema_qc || '';
      
      if (!tema) {
        // Classificar rapidamente
        if (perplexityKey) {
          const qcResult = await buscarNoQConcursosPerplexity(questao.enunciado, perplexityKey);
          if (qcResult) { tema = qcResult.tema; subtema = qcResult.subtema; }
        }
        if (!tema) {
          const result = await classificarComGemini(questao.enunciado, alternativasTexto, questao.gabarito || '', questao.materia || '', GEMINI_KEYS);
          tema = result.tema; subtema = result.subtema;
        }
      }

      // Buscar material de apoio (compartilhado entre os 3)
      console.log(`[compare] Buscando material de apoio para tema="${tema}"...`);
      const materialApoio = await buscarMaterialApoio(supabase, tema, subtema, questao.enunciado, perplexityKey || undefined);
      
      // Gerar os 3 candidatos em paralelo
      const candidatos = await Promise.all(
        COMPARISON_PROFILES.map(profile =>
          gerarCandidato(profile, questao.enunciado, alternativasTexto, questao.gabarito || '',
            tema, subtema, ehCertoErrado, GEMINI_KEYS, materialApoio)
        )
      );

      // Adicionar fontes do material de apoio a cada candidato
      for (const c of candidatos) {
        c.fontes = [...materialApoio.fontes];
      }

      console.log(`[compare] 3 candidatos gerados. Modelos usados: ${candidatos.map(c => `${c.id}=${c.modelo_usado}`).join(', ')}`);

      return new Response(JSON.stringify({ candidatos, tema, subtema }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // === ACTION: classify (default) — fluxo original ===
    if (questao.tema_qc && questao.comentario_ia) {
      console.log(`[classificar] Questão ${questaoId} já classificada`);
      return new Response(JSON.stringify({
        tema_qc: questao.tema_qc,
        subtema_qc: questao.subtema_qc,
        comentario_ia: questao.comentario_ia,
        fonte: questao.fonte_classificacao || 'desconhecida',
        fontes_comentario: questao.fontes_comentario || null,
        cached: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let tema = '';
    let subtema = '';
    let fonte = 'gemini';

    if (perplexityKey) {
      const qcResult = await buscarNoQConcursosPerplexity(questao.enunciado, perplexityKey);
      if (qcResult) {
        tema = qcResult.tema;
        subtema = qcResult.subtema;
        fonte = 'qconcursos';
      }
    }

    if (!tema) {
      const result = await classificarComGemini(
        questao.enunciado, alternativasTexto, questao.gabarito || '', questao.materia || '', GEMINI_KEYS
      );
      tema = result.tema;
      subtema = result.subtema;
    }

    console.log(`[classificar] Buscando material de apoio para tema="${tema}", subtema="${subtema}"...`);
    const materialApoio = await buscarMaterialApoio(supabase, tema, subtema, questao.enunciado, perplexityKey || undefined);

    const comentario = await gerarComentarioComRevisao(
      questao.enunciado, alternativasTexto, questao.gabarito || '',
      tema, subtema, ehCertoErrado, GEMINI_KEYS, materialApoio
    );

    const fontesComentario = materialApoio.fontes.length > 0 ? materialApoio.fontes : null;

    const { error: updateError } = await supabase
      .from('simulados_questoes')
      .update({
        tema_qc: tema,
        subtema_qc: subtema,
        comentario_ia: comentario,
        fonte_classificacao: fonte,
        fontes_comentario: fontesComentario,
      })
      .eq('id', questaoId);

    if (updateError) {
      console.error('[classificar] Erro ao salvar:', updateError);
    }

    console.log(`[classificar] Classificada via ${fonte}: tema="${tema}", subtema="${subtema}", fontes=${fontesComentario?.length || 0}`);

    return new Response(JSON.stringify({
      tema_qc: tema,
      subtema_qc: subtema,
      comentario_ia: comentario,
      fonte,
      fontes_comentario: fontesComentario,
      cached: false
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[classificar] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
