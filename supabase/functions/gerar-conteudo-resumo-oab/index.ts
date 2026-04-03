import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

// VERSÃO para debugging de deploy
const VERSION = "v2.6.0-resumo-cafe-correspondencias";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
].filter(Boolean) as string[];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function sanitizeJsonString(str: string): string {
  let result = "";
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = str.charCodeAt(i);
    
    if (escapeNext) { result += char; escapeNext = false; continue; }
    if (char === '\\') { result += char; escapeNext = true; continue; }
    if (char === '"') { inString = !inString; result += char; continue; }
    
    if (inString) {
      if (code === 0x0A) result += '\\n';
      else if (code === 0x0D) result += '\\r';
      else if (code === 0x09) result += '\\t';
      else if (code < 0x20 || code === 0x7F) continue;
      else result += char;
    } else {
      if (char === '\n' || char === '\r' || char === '\t' || char === ' ') result += char;
      else if (code < 0x20 || code === 0x7F) continue;
      else result += char;
    }
  }
  return result;
}

async function chamarGemini(prompt: string, maxTokens: number = 8192): Promise<string> {
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const keyIndex = attempt % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );

      if (response.status === 429) {
        console.log(`Rate limit na key ${keyIndex + 1}, tentando próxima...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`Erro Gemini: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
      console.error(`Erro na tentativa ${attempt + 1}:`, error);
      if (attempt === GEMINI_KEYS.length * 2 - 1) throw error;
    }
  }
  throw new Error("Todas as tentativas falharam");
}

async function gerarJSON(prompt: string, maxRetries = 2): Promise<any> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[OAB Resumo] Retry ${attempt}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
      
      const text = await chamarGemini(prompt, 8192);
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      
      const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!match) throw new Error("JSON não encontrado na resposta");
      
      const sanitized = sanitizeJsonString(match[0]);
      
      try {
        return JSON.parse(sanitized);
      } catch {
        const fixed = sanitized.replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(fixed);
      }
    } catch (err) {
      lastError = err;
      console.error(`[OAB Resumo] Tentativa ${attempt + 1} falhou:`, err);
    }
  }
  
  throw lastError;
}

// ============================================
// PROCESSAMENTO EM BACKGROUND (INCREMENTAL)
// ============================================

async function processarGeracaoConteudo(resumo_id: number) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Buscar dados do RESUMO
    const { data: resumo, error: resumoError } = await supabase
      .from("RESUMO")
      .select("*")
      .eq("id", resumo_id)
      .single();

    if (resumoError || !resumo) {
      console.error(`[OAB Resumo] Resumo ${resumo_id} não encontrado`);
      return;
    }

    const area = resumo.area || "";
    const tema = resumo.tema || "";
    const subtema = resumo.subtema || "";
    const conteudoOriginal = resumo.conteudo || "";

    // VALIDAÇÃO CRÍTICA: BLOQUEAR SE NÃO HOUVER CONTEÚDO FONTE
    if (!conteudoOriginal || conteudoOriginal.trim().length < 100) {
      console.error(`[OAB Resumo] BLOQUEADO: Conteúdo fonte vazio para resumo ${resumo_id}`);
      
      const erroMensagem = JSON.stringify({
        erro: true,
        mensagem: "Conteúdo fonte não disponível. Por favor, reprocesse o PDF do tópico.",
        detalhe: `O texto extraído do PDF está vazio ou muito curto (${conteudoOriginal?.length || 0} chars).`,
        acao: "Volte ao tópico e faça o upload/extração do PDF novamente."
      });
      
      await supabase
        .from("RESUMO")
        .update({ 
          conteudo_gerado: erroMensagem,
          ultima_atualizacao: new Date().toISOString()
        })
        .eq("id", resumo_id);
      
      return;
    }

    console.log(`[OAB Resumo] ══════════════════════════════════════════`);
    console.log(`[OAB Resumo] Iniciando geração INCREMENTAL: ${subtema}`);
    console.log(`[OAB Resumo] Área: ${area}, Tema: ${tema}`);
    console.log(`[OAB Resumo] Conteúdo fonte: ${conteudoOriginal.length} chars`);

    // ============================================
    // PROMPT BASE (TOM “CAFÉ” + REGRA DIDÁTICA UNIFICADA)
    // ============================================
    const promptBase = `Você é um professor experiente explicando Direito para uma pessoa LEIGA.
Seu estilo é como uma CONVERSA DE CAFÉ: descontraído, acolhedor e empolgado, como um amigo explicando.

REGRAS DE TOM (OBRIGATÓRIAS):
- Use expressões naturais ao longo do texto: "Percebeu?", "Faz sentido, né?", "Na prática...", "Veja bem...", "Note que..."
- Sem formalidades do tipo "Prezado"/"futuro colega".
- Não use emojis no texto.

REGRA DIDÁTICA DE OURO: SIMPLES PRIMEIRO → TERMO TÉCNICO DEPOIS.
Exemplo de formato:
"Sabe quando ...? Isso é o que o Direito chama de 'X' (definição rápida)."

Termos jurídicos: explique imediatamente entre parênteses.
Latim: traduza e contextualize imediatamente.

FIDELIDADE: use 100% do conteúdo fonte, mas NÃO mencione "PDF", "material" ou "documento".

**Área:** ${area}
**Tema:** ${tema}
**Subtema:** ${subtema}

═══ CONTEÚDO FONTE ═══
${conteudoOriginal}
═══════════════════════`;

    // ============================================
    // ETAPA 1: GERAR ESTRUTURA/ESQUELETO
    // ============================================
    console.log(`[OAB Resumo] ETAPA 1: Gerando estrutura/esqueleto...`);
    
    const promptEstrutura = `${promptBase}

═══ SUA TAREFA ═══
Crie APENAS a ESTRUTURA/ESQUELETO do conteúdo interativo.
NÃO gere o conteúdo completo agora, apenas títulos e tipos de página.

Retorne um JSON com esta estrutura EXATA:
{
  "titulo": "${subtema}",
  "tempoEstimado": "25 min",
  "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3", "Objetivo 4"],
  "secoes": [
    {
      "id": 1,
      "titulo": "Nome da Seção",
      "paginas": [
        {"tipo": "introducao", "titulo": "O que você vai aprender"},
        {"tipo": "texto", "titulo": "Conceito Principal X"},
        {"tipo": "termos", "titulo": "Termos Importantes"},
        {"tipo": "quickcheck", "titulo": "Verificação Rápida"}
      ]
    }
  ]
}

REGRAS:
1. Gere entre 5-7 seções
2. Cada seção deve ter 6-10 páginas (total final: 35-55 páginas)
3. TIPOS DISPONÍVEIS: introducao, texto, termos, correspondencias, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck
4. Distribua bem os tipos (não só "texto")
5. Cada seção deve ter pelo menos 1 quickcheck
6. Use títulos descritivos para cada página
7. Cubra TODO o conteúdo do material fonte

Retorne APENAS o JSON, sem texto adicional.`;

    let estrutura: any = null;
    try {
      estrutura = await gerarJSON(promptEstrutura);
      
      if (!estrutura?.secoes || !Array.isArray(estrutura.secoes) || estrutura.secoes.length < 3) {
        throw new Error("Estrutura inválida: menos de 3 seções");
      }
      
      const totalPaginasEstrutura = estrutura.secoes.reduce(
        (acc: number, s: any) => acc + (s.paginas?.length || 0), 0
      );
      console.log(`[OAB Resumo] ✓ Estrutura: ${estrutura.secoes.length} seções, ${totalPaginasEstrutura} páginas planejadas`);
    } catch (err) {
      console.error(`[OAB Resumo] ❌ Erro na estrutura:`, err);
      throw new Error(`Falha ao gerar estrutura: ${err}`);
    }

    // ============================================
    // ETAPA 2: GERAR CONTEÚDO POR SEÇÃO (INCREMENTAL)
    // ============================================
    console.log(`[OAB Resumo] ETAPA 2: Gerando conteúdo seção por seção...`);
    
    const secoesCompletas: any[] = [];
    const totalSecoes = estrutura.secoes.length;

    for (let i = 0; i < totalSecoes; i++) {
      const secaoEstrutura = estrutura.secoes[i];
      
      console.log(`[OAB Resumo] Gerando seção ${i + 1}/${totalSecoes}: ${secaoEstrutura.titulo}`);

       const promptSecao = `${promptBase}

═══ SUA TAREFA ═══
Gere o CONTEÚDO COMPLETO para a SEÇÃO ${i + 1}:
Título: "${secaoEstrutura.titulo}"

PÁGINAS A GERAR (com seus tipos):
${JSON.stringify(secaoEstrutura.paginas, null, 2)}

Para CADA página, retorne o objeto completo com:

1. Para tipo "introducao":
   {"tipo": "introducao", "titulo": "...", "conteudo": "Texto motivador sobre o que será aprendido..."}

2. Para tipo "texto":
   {"tipo": "texto", "titulo": "...", "conteudo": "Explicação EXTENSA (200-400 palavras) com exemplos práticos..."}

3. Para tipo "termos":
   {"tipo": "termos", "titulo": "...", "conteudo": "Introdução breve", "termos": [{"termo": "...", "definicao": "..."}]}

4. Para tipo "linha_tempo":
   {"tipo": "linha_tempo", "titulo": "...", "conteudo": "Contexto", "etapas": [{"titulo": "...", "descricao": "..."}]}

5. Para tipo "tabela":
   {"tipo": "tabela", "titulo": "...", "conteudo": "Descrição", "tabela": {"cabecalhos": [...], "linhas": [[...], [...]]}}

6. Para tipo "atencao":
   {"tipo": "atencao", "titulo": "...", "conteudo": "Ponto importante com exemplo..."}

7. Para tipo "dica":
   {"tipo": "dica", "titulo": "...", "conteudo": "Dica de memorização ou macete..."}

8. Para tipo "caso":
   {"tipo": "caso", "titulo": "...", "conteudo": "Descrição do caso prático com análise jurídica..."}

9. Para tipo "quickcheck":
   {"tipo": "quickcheck", "titulo": "...", "conteudo": "Teste seu conhecimento:", "pergunta": "...", "opcoes": ["A", "B", "C", "D"], "resposta": 0, "feedback": "Explicação..."}

10. Para tipo "resumo":
    {"tipo": "resumo", "titulo": "...", "conteudo": "Recapitulando:", "pontos": ["...", "...", "..."]}

 11. Para tipo "correspondencias" (gamificação: ligar termo x definição):
    {"tipo": "correspondencias", "titulo": "Ligar Termos", "conteudo": "Instruções curtas", "correspondencias": [{"termo": "...", "definicao": "..."}]}

Retorne um JSON com a seção COMPLETA:
{
  "id": ${secaoEstrutura.id},
  "titulo": "${secaoEstrutura.titulo}",
  "slides": [
    // Array com TODAS as páginas completas
  ]
}

REGRAS CRÍTICAS:
- NÃO inclua imagemPrompt nos slides (a capa é gerada separadamente)
- Páginas "texto" devem ter 200-400 palavras com exemplos práticos
- Use blockquotes (>) para citações e cards de atenção
- NUNCA use emojis no texto corrido

Retorne APENAS o JSON da seção, sem texto adicional.`;

      try {
        const secaoCompleta = await gerarJSON(promptSecao);
        
        if (!secaoCompleta?.slides || !Array.isArray(secaoCompleta.slides)) {
          throw new Error(`Seção ${i + 1} sem slides válidos`);
        }
        
        if (secaoCompleta.slides.length < 3) {
          throw new Error(`Seção ${i + 1} com apenas ${secaoCompleta.slides.length} slides`);
        }
        
        // PÓS-PROCESSAMENTO: Remover saudações proibidas de slides que não são introdução
        for (const slide of secaoCompleta.slides) {
          // Garantia extra: nunca deixar formalidades escaparem
          if (typeof slide?.conteudo === 'string') {
            slide.conteudo = slide.conteudo
              .replace(/^\s*(Prezado|Prezada|Futuro\s+colega|Cara\s+pessoa|Caro\s+estudante)[^\n]*\n?/i, '')
              .trim();
          }
        }
        
        secoesCompletas.push(secaoCompleta);
        console.log(`[OAB Resumo] ✓ Seção ${i + 1}: ${secaoCompleta.slides.length} páginas (sanitizado)`);
        
      } catch (err) {
        console.error(`[OAB Resumo] ❌ Erro na seção ${i + 1}:`, err);
        // Criar seção de fallback mínima
        secoesCompletas.push({
          id: secaoEstrutura.id,
          titulo: secaoEstrutura.titulo,
          slides: [{
            tipo: "texto",
            titulo: secaoEstrutura.titulo,
            conteudo: `Conteúdo da seção "${secaoEstrutura.titulo}" está sendo regenerado. Por favor, tente novamente.`
          }]
        });
      }
    }

    // ============================================
    // ETAPA 3: GERAR EXTRAS (flashcards, questões)
    // ============================================
    console.log(`[OAB Resumo] ETAPA 3: Gerando extras...`);

    const promptExtras = `${promptBase}

═══ SUA TAREFA ═══
Gere elementos de estudo complementares:

Retorne JSON com:
{
  "correspondencias": [
    {"termo": "Termo jurídico", "definicao": "Definição curta (máx 60 chars)"}
  ],
  "ligar_termos": [
    {"conceito": "Explicação simples", "termo": "Termo técnico"}
  ],
  "explique_com_palavras": [
    {"conceito": "Pergunta conceitual", "dica": "Dica curta"}
  ],
  "flashcards": [
    {"frente": "Pergunta", "verso": "Resposta", "exemplo": "Exemplo prático"}
  ],
  "questoes": [
    {"pergunta": "Enunciado", "alternativas": ["A) opção", "B) opção", "C) opção", "D) opção"], "correta": 0, "explicacao": "Explicação"}
  ]
}

QUANTIDADES: correspondencias: 8+, ligar_termos: 6+, explique_com_palavras: 4+, flashcards: 15-25, questoes: 15-20

Retorne APENAS o JSON.`;

    let extras: any = {};
    try {
      extras = await gerarJSON(promptExtras);
      console.log(`[OAB Resumo] ✓ Extras gerados`);
    } catch (err) {
      console.error(`[OAB Resumo] ❌ Erro nos extras (usando fallback):`, err);
      extras = { correspondencias: [], flashcards: [], questoes: [] };
    }

    // ============================================
    // ETAPA 4: MONTAR E VALIDAR ESTRUTURA FINAL
    // ============================================
    console.log(`[OAB Resumo] ETAPA 4: Montando estrutura final...`);

    const slidesData = {
      versao: 1,
      titulo: estrutura.titulo || subtema,
      tempoEstimado: estrutura.tempoEstimado || "25 min",
      objetivos: estrutura.objetivos || [],
      secoes: secoesCompletas
    };

    // VALIDAÇÃO CRÍTICA: Contar páginas totais
    const totalPaginas = secoesCompletas.reduce(
      (acc, s) => acc + (s.slides?.length || 0), 0
    );

    console.log(`[OAB Resumo] Validação: ${totalPaginas} páginas em ${secoesCompletas.length} seções`);

    // VALIDAÇÃO: Mínimo de 20 páginas para considerar válido
    if (totalPaginas < 20) {
      throw new Error(`Conteúdo insuficiente: apenas ${totalPaginas} páginas (mínimo: 20).`);
    }

    // Converter para formato compatível com conteudo_gerado antigo (fallback)
    const conteudoGeradoCompativel = {
      secoes: secoesCompletas,
      objetivos: estrutura.objetivos || [],
      correspondencias: extras.correspondencias || [],
      ligar_termos: extras.ligar_termos || [],
      explique_com_palavras: extras.explique_com_palavras || [],
      flashcards: extras.flashcards || [],
      questoes: extras.questoes || []
    };

    // ============================================
    // SALVAR NO BANCO
    // ============================================
    const { error: updateError } = await supabase
      .from("RESUMO")
      .update({
        slides_json: slidesData,
        conteudo_gerado: JSON.stringify(conteudoGeradoCompativel),
        ultima_atualizacao: new Date().toISOString()
      })
      .eq("id", resumo_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`[OAB Resumo] ══════════════════════════════════════════`);
    console.log(`[OAB Resumo] ✅ SUCESSO: ${subtema}`);
    console.log(`[OAB Resumo] ✅ ${totalPaginas} páginas em ${secoesCompletas.length} seções`);
    console.log(`[OAB Resumo] ══════════════════════════════════════════`);

    // ============================================
    // ETAPA 5: DISPARAR GERAÇÃO DE CAPA
    // ============================================
    console.log(`[OAB Resumo] Disparando geração de capa...`);
    
    fetch(`${supabaseUrl}/functions/v1/gerar-capa-subtema-resumo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        resumo_id: resumo_id,
        titulo: subtema,
        area: area
      })
    }).catch(err => {
      console.error("[OAB Resumo] Erro ao disparar capa:", err);
    });

  } catch (error: any) {
    console.error("[OAB Resumo] ══════════════════════════════════════════");
    console.error("[OAB Resumo] ❌ ERRO:", error.message || error);
    console.error("[OAB Resumo] ══════════════════════════════════════════");

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from("RESUMO")
        .update({
          conteudo_gerado: JSON.stringify({
            erro: true,
            mensagem: "Erro ao gerar conteúdo",
            detalhe: error.message || "Erro desconhecido"
          }),
          ultima_atualizacao: new Date().toISOString()
        })
        .eq("id", resumo_id);
    } catch (catchErr) {
      console.error("[OAB Resumo] Erro no fallback:", catchErr);
    }
  }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumo_id, force_regenerate } = await req.json();

    if (!resumo_id) {
      return new Response(
        JSON.stringify({ error: "resumo_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já tem conteúdo gerado
    const { data: resumo } = await supabase
      .from("RESUMO")
      .select("slides_json, conteudo_gerado")
      .eq("id", resumo_id)
      .single();

    if (resumo?.slides_json && !force_regenerate) {
      return new Response(
        JSON.stringify({ 
          status: "ja_existe", 
          message: "Conteúdo já existe (slides_json)" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[OAB Resumo] ══════════════════════════════════════════`);
    console.log(`[OAB Resumo] Iniciando geração para resumo ${resumo_id}`);
    console.log(`[OAB Resumo] 📦 VERSÃO: ${VERSION}`);
    console.log(`[OAB Resumo] Force regenerate: ${!!force_regenerate}`);
    console.log(`[OAB Resumo] ══════════════════════════════════════════`);

    // Usar EdgeRuntime.waitUntil para processamento em background
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(processarGeracaoConteudo(resumo_id));
    } else {
      // Fallback: processar de forma assíncrona
      processarGeracaoConteudo(resumo_id).catch(err => {
        console.error("[OAB Resumo] Erro no processamento:", err);
      });
    }

    return new Response(
      JSON.stringify({ 
        status: "gerando", 
        message: "Geração iniciada em background",
        resumo_id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[OAB Resumo] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
