import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const VERSION = "v1.0.0-faculdade";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_PAGINAS = 35;
const MAX_TENTATIVAS = 3;
const MAX_CONCURRENT = 5;
const STALE_GENERATION_MINUTES = 30;

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { topico_id, force_restart } = body;

    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // === SISTEMA DE FILA ===
    const staleCutoff = new Date(Date.now() - STALE_GENERATION_MINUTES * 60 * 1000).toISOString();

    const { data: gerandoAtivos } = await supabase
      .from("faculdade_topicos")
      .select("id, titulo, updated_at")
      .eq("status", "gerando")
      .neq("id", topico_id);

    let ativosValidos = 0;
    if (gerandoAtivos && gerandoAtivos.length > 0) {
      for (const ativo of gerandoAtivos) {
        const isStale = !!ativo.updated_at && ativo.updated_at < staleCutoff;
        if (isStale) {
          console.log(`[Faculdade Watchdog] Geração travada: ${ativo.titulo} (ID: ${ativo.id})`);
          await supabase
            .from("faculdade_topicos")
            .update({ status: "erro", updated_at: new Date().toISOString() })
            .eq("id", ativo.id);
        } else {
          ativosValidos++;
        }
      }
    }

    if (ativosValidos >= MAX_CONCURRENT) {
      console.log(`[Faculdade Fila] ${ativosValidos} gerações ativas, enfileirando tópico ${topico_id}`);
      await supabase
        .from("faculdade_topicos")
        .update({ status: "na_fila", updated_at: new Date().toISOString() })
        .eq("id", topico_id);

      return new Response(
        JSON.stringify({ queued: true, message: "Adicionado à fila" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar tópico com disciplina
    const { data: topico, error: topicoError } = await supabase
      .from("faculdade_topicos")
      .select(`*, disciplina:faculdade_disciplinas(id, nome, area_conteudo, semestre)`)
      .eq("id", topico_id)
      .single();

    if (topicoError || !topico) {
      return new Response(
        JSON.stringify({ error: "Tópico não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "concluido" && !force_restart) {
      return new Response(
        JSON.stringify({ success: true, already_generated: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "gerando" && !force_restart) {
      return new Response(
        JSON.stringify({ message: "Geração já em andamento", background: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marcar como gerando
    await supabase
      .from("faculdade_topicos")
      .update({ status: "gerando", updated_at: new Date().toISOString() })
      .eq("id", topico_id);

    console.log(`[Faculdade] 🚀 Iniciando geração: ${topico.titulo} (${VERSION})`);

    EdgeRuntime.waitUntil(processarGeracaoBackground(supabase, supabaseUrl, supabaseServiceKey, topico_id, topico));

    return new Response(
      JSON.stringify({
        success: true,
        background: true,
        message: "Geração iniciada em background.",
        topico_id,
        titulo: topico.titulo
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[Faculdade] ❌ Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================
// PROCESSAMENTO EM BACKGROUND
// ============================================
async function processarGeracaoBackground(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  topico_id: number,
  topico: any
) {
  try {
    const areaNome = topico.disciplina?.area_conteudo || topico.disciplina?.nome || "";
    const disciplinaNome = topico.disciplina?.nome || "";
    const topicoTitulo = topico.titulo;
    const complemento = topico.complemento || "";

    console.log(`[Faculdade] Gerando: ${topicoTitulo} | Disciplina: ${disciplinaNome} | Área: ${areaNome}`);

    // Buscar resumos da área como base de conhecimento
    let conteudoResumo = "";
    const { data: resumos } = await supabase
      .from("RESUMO")
      .select("conteudo, subtema, tema")
      .eq("area", areaNome)
      .limit(20);

    if (resumos && resumos.length > 0) {
      // Filtrar resumos mais relevantes ao tópico
      const relevantes = resumos.filter((r: any) => {
        const sub = (r.subtema || "").toLowerCase();
        const tema = (r.tema || "").toLowerCase();
        const tit = topicoTitulo.toLowerCase();
        return sub.includes(tit.split(" ")[0]) || tit.includes(sub.split(" ")[0]) || tema.includes(tit.split(" ")[0]);
      });

      const fonte = relevantes.length > 0 ? relevantes : resumos.slice(0, 10);
      conteudoResumo = fonte.map((r: any) => {
        const sub = r.subtema ? `### ${r.subtema}\n` : "";
        return sub + (r.conteudo || "");
      }).join("\n\n");
      console.log(`[Faculdade] RESUMO: ${fonte.length} subtemas como base`);
    }

    // Configurar Gemini
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
    ].filter(Boolean);

    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // JSON utilities
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

    function repairJson(text: string): string {
      let repaired = text.trim();
      repaired = repaired.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonStart = repaired.indexOf("{");
      if (jsonStart === -1) return "{}";
      repaired = repaired.substring(jsonStart);
      let braceCount = 0, bracketCount = 0, inString = false, escapeNext = false, lastValidIndex = 0;
      for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') { braceCount--; if (braceCount === 0) lastValidIndex = i; }
          else if (char === '[') bracketCount++;
          else if (char === ']') bracketCount--;
        }
      }
      if (braceCount === 0 && bracketCount === 0) return repaired.substring(0, lastValidIndex + 1);
      repaired = repaired.replace(/,\s*$/, "");
      repaired = repaired.replace(/:\s*$/, ': null');
      repaired = repaired.replace(/"\s*$/, '"');
      while (bracketCount > 0) { repaired += "]"; bracketCount--; }
      while (braceCount > 0) { repaired += "}"; braceCount--; }
      return repaired;
    }

    async function gerarJSON(prompt: string, maxRetries = 2, maxTokens = 8192): Promise<any> {
      let lastError: any = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5 },
          });
          let text = result.response.text();
          const sanitized = sanitizeJsonString(text);
          const repaired = repairJson(sanitized);
          try { return JSON.parse(repaired); } catch {
            const fixed = repaired.replace(/,\s*([}\]])/g, "$1").replace(/([{,])\s*}/g, "$1}").replace(/\[\s*,/g, "[").replace(/,\s*,/g, ",");
            return JSON.parse(fixed);
          }
        } catch (err) { lastError = err; console.error(`[Faculdade] Tentativa ${attempt + 1} falhou:`, err); }
      }
      throw lastError;
    }

    // ============================================
    // PROMPT BASE - Estilo acadêmico universitário
    // ============================================
    const promptBase = `Você é um professor universitário de Direito, explicando o conteúdo de uma disciplina da graduação.
Seu estilo é como uma AULA presencial - claro, didático, acadêmico mas acessível.

═══ CONTEXTO ═══
Disciplina: ${disciplinaNome}
Tópico: ${topicoTitulo}${complemento ? `\nComplemento: ${complemento}` : ""}
Área do Direito: ${areaNome}

═══ PÚBLICO-ALVO ═══
Estudantes de graduação em Direito. Podem ser calouros ou alunos intermediários.

═══ TOM DE VOZ ═══
- Acadêmico mas acessível, como uma boa aula presencial
- Use expressões: "Percebeu?", "Faz sentido?", "Na prática...", "Veja bem...", "Note que..."
- Seguro e correto tecnicamente
- NUNCA infantilizado ou condescendente

═══ ESTRUTURA DIDÁTICA ═══
1. SIMPLES PRIMEIRO → TÉCNICO DEPOIS
2. TRADUÇÃO IMEDIATA de termos técnicos e latim
3. ANALOGIAS DO COTIDIANO para conceitos abstratos
4. ANTECIPE DÚVIDAS: "Você pode estar pensando..."

═══ GRIFO E ÊNFASE (OBRIGATÓRIO) ═══
• TERMOS TÉCNICOS: **'competência absoluta'**, **'litispendência'**
• LEIS E ARTIGOS: **'Art. 5º da CF'**, **'Lei 9.504/97'**
• PRAZOS/VALORES/DATAS: **'30 dias'**, **'R$ 5.000'**

═══ CITAÇÕES DE ARTIGOS ═══
Use BLOCKQUOTE: > "Art. XX - Texto..." (Lei)

═══ CUIDADOS ═══
- NÃO use emojis no texto corrido
- NÃO mencione "PDF", "material", "documento"
- NÃO comece slides com saudações (exceto intro da primeira seção)

═══ SAUDAÇÕES ═══
- "Caros alunos", "Prezados estudantes" ou qualquer saudação APENAS no slide de introdução da PRIMEIRA seção
- Em TODOS os demais slides, vá DIRETO ao conteúdo sem cumprimentos ou chamamentos
- NUNCA repita "Caros alunos" fora do primeiro slide

═══ ELEMENTOS VISUAIS OBRIGATÓRIOS ═══
- Cada seção DEVE ter pelo menos 1 slide visual (tabela, linha_tempo, termos, caso ou correspondências)
- Para cada 2-3 slides de "texto", intercale 1 tipo visual
- Tabelas comparativas: use para contrastar conceitos, requisitos, tipos
- Linha do tempo: use para sequências, procedimentos, evolução histórica
- Correspondências: use para exercícios práticos de associação termo-definição
- Caso prático: use para exemplos do dia-a-dia jurídico com situação real

═══ REFERÊNCIA DE ESTUDO ═══
${conteudoResumo ? conteudoResumo.substring(0, 12000) : "Use seu conhecimento sobre o tema."}
═══════════════════════`;

    // ETAPA 1: Estrutura
    console.log(`[Faculdade] ETAPA 1: Gerando estrutura...`);
    await supabase.from("faculdade_topicos").update({ status: "gerando", updated_at: new Date().toISOString() }).eq("id", topico_id);

    const promptEstrutura = `${promptBase}

═══ SUA TAREFA ═══
Crie a ESTRUTURA do conteúdo interativo para a disciplina de graduação.

Retorne JSON:
{
  "titulo": "${topicoTitulo}",
  "tempoEstimado": "20 min",
  "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
  "secoes": [
    {
      "id": 1,
      "titulo": "Nome da Seção",
      "paginas": [
        {"tipo": "introducao", "titulo": "O que você vai aprender"},
        {"tipo": "texto", "titulo": "Conceito X"},
        {"tipo": "quickcheck", "titulo": "Verificação"}
      ]
    }
  ]
}

REGRAS:
1. 5-7 seções para alcançar 35-45 páginas totais
2. Cada seção: 5-8 páginas
3. TIPOS: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck, correspondencias
4. "introducao" APENAS na primeira seção
5. Cada seção com mix de tipos
6. MANTENHA o título original: "${topicoTitulo}"

Retorne APENAS o JSON.`;

    let estrutura = await gerarJSON(promptEstrutura);
    if (!estrutura?.secoes || estrutura.secoes.length < 3) {
      throw new Error("Estrutura inválida");
    }
    console.log(`[Faculdade] ✓ Estrutura: ${estrutura.secoes.length} seções`);

    // ETAPA 2: Conteúdo por seção
    console.log(`[Faculdade] ETAPA 2: Gerando conteúdo por seção...`);
    const secoesCompletas: any[] = [];
    const totalSecoes = estrutura.secoes.length;

    for (let i = 0; i < totalSecoes; i++) {
      const secaoEstrutura = estrutura.secoes[i];
      console.log(`[Faculdade] Seção ${i + 1}/${totalSecoes}: ${secaoEstrutura.titulo}`);

      // Update progress
      const progresso = Math.round(20 + (i / totalSecoes) * 50);
      await supabase.from("faculdade_topicos").update({ status: "gerando", updated_at: new Date().toISOString() }).eq("id", topico_id);

      const promptSecao = `${promptBase}

═══ SUA TAREFA ═══
Gere o CONTEÚDO COMPLETO para a SEÇÃO ${i + 1}:
Título: "${secaoEstrutura.titulo}"

PÁGINAS A GERAR:
${JSON.stringify(secaoEstrutura.paginas, null, 2)}

Para CADA página, retorne o objeto completo:

1. tipo "introducao" (APENAS PRIMEIRA SEÇÃO):
   {"tipo": "introducao", "titulo": "${topicoTitulo}", "conteudo": "Nesta aula vamos estudar **${topicoTitulo}**..."}

2. tipo "texto" (MÍNIMO 250 PALAVRAS):
   {"tipo": "texto", "titulo": "...", "conteudo": "Explicação detalhada..."}

3. tipo "quickcheck":
   {"tipo": "quickcheck", "titulo": "Verificação", "conteudo": "Teste:", "pergunta": "Pergunta?", "opcoes": ["A) ...", "B) ...", "C) ...", "D) ..."], "resposta": 0, "feedback": "Explicação..."}

4. tipo "correspondencias":
   {"tipo": "correspondencias", "titulo": "Pratique!", "conteudo": "Conecte:", "correspondencias": [{"termo": "...", "definicao": "..."}]}

5. tipo "termos":
   {"tipo": "termos", "titulo": "...", "conteudo": "Termos:", "termos": [{"termo": "...", "definicao": "..."}]}

6. tipo "tabela":
   {"tipo": "tabela", "titulo": "...", "conteudo": "Comparação:", "tabela": {"cabecalhos": [...], "linhas": [...]}}

7. tipo "atencao":
   {"tipo": "atencao", "titulo": "⚠️ Atenção!", "conteudo": "Ponto importante..."}

8. tipo "dica":
   {"tipo": "dica", "titulo": "💡 Dica", "conteudo": "Técnica de memorização..."}

9. tipo "caso":
   {"tipo": "caso", "titulo": "Caso Prático", "conteudo": "Situação real..."}

10. tipo "resumo":
    {"tipo": "resumo", "titulo": "Resumo", "conteudo": "Recapitulando:", "pontos": ["..."]}

Retorne JSON:
{"id": ${secaoEstrutura.id}, "titulo": "${secaoEstrutura.titulo}", "slides": [...]}

REGRAS:
- TOM acadêmico acessível
- ${i === 0 ? 'INCLUA slide introducao com saudação "Caros alunos"' : 'NÃO inclua introducao. NÃO use "Caros alunos" ou saudações. Vá DIRETO ao conteúdo.'}
- USE **'negrito + aspas'** para termos-chave
- USE blockquote (>) para artigos de lei
- Páginas "texto": mínimo 250 palavras
- OBRIGATÓRIO: inclua pelo menos 1 slide visual (tabela, linha_tempo, termos, caso ou correspondencias) nesta seção
- VARIE os tipos: não repita o mesmo tipo visual em slides consecutivos

Retorne APENAS o JSON.`;

      try {
        const secaoCompleta = await gerarJSON(promptSecao, 2, 8192);
        if (secaoCompleta?.slides && Array.isArray(secaoCompleta.slides) && secaoCompleta.slides.length >= 2) {
          // Remove intro from non-first sections
          if (i > 0) {
            secaoCompleta.slides = secaoCompleta.slides.filter((s: any) => s.tipo !== 'introducao');
          }
          // Normalize quickcheck
          for (const slide of secaoCompleta.slides) {
            if (slide.tipo === 'quickcheck' && !slide.pergunta && slide.perguntas && Array.isArray(slide.perguntas) && slide.perguntas.length > 0) {
              const q = slide.perguntas[0];
              slide.pergunta = q.texto || q.pergunta || '';
              slide.opcoes = q.opcoes || [];
              slide.resposta = q.respostaCorreta ?? q.resposta ?? 0;
              slide.feedback = q.feedback || '';
              delete slide.perguntas;
            }
          }
          secoesCompletas.push(secaoCompleta);
          console.log(`[Faculdade] ✓ Seção ${i + 1}: ${secaoCompleta.slides.length} slides`);
        } else {
          throw new Error(`Seção ${i + 1} inválida`);
        }
      } catch (err) {
        console.error(`[Faculdade] ⚠️ Erro seção ${i + 1}:`, err);
        secoesCompletas.push({
          id: secaoEstrutura.id,
          titulo: secaoEstrutura.titulo,
          slides: [{ tipo: "texto", titulo: secaoEstrutura.titulo, conteudo: `Conteúdo da seção "${secaoEstrutura.titulo}" será regenerado.` }]
        });
      }
    }

    // ETAPA 3: Extras (flashcards + questões + termos)
    console.log(`[Faculdade] ETAPA 3: Gerando extras...`);

    const promptExtras = `${promptBase}

═══ SUA TAREFA ═══
Gere FLASHCARDS, QUESTÕES e TERMOS sobre "${topicoTitulo}" para a disciplina ${disciplinaNome}.

Retorne JSON:
{
  "flashcards": [
    {"frente": "Pergunta", "verso": "Resposta", "exemplo": "Exemplo prático"}
  ],
  "questoes": [
    {"pergunta": "Enunciado", "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."], "correta": 0, "explicacao": "Explicação"}
  ],
  "termos": [
    {"termo": "Termo jurídico", "definicao": "Explicação"}
  ],
  "exemplos": [
    {"titulo": "Título", "situacao": "Situação", "analise": "Análise", "conclusao": "Conclusão"}
  ]
}

QUANTIDADES:
- flashcards: 15 cards
- questoes: 10 questões
- termos: 8 termos
- exemplos: 4 casos

Retorne APENAS o JSON.`;

    let extras: any = { flashcards: [], questoes: [], termos: [], exemplos: [] };
    try {
      extras = await gerarJSON(promptExtras, 2, 6144);
    } catch (err) {
      console.error(`[Faculdade] ⚠️ Erro extras:`, err);
    }

    // Add síntese final section
    secoesCompletas.push({
      id: secoesCompletas.length + 1,
      titulo: "Síntese Final",
      slides: [{
        tipo: "resumo",
        titulo: "✅ Síntese Final",
        conteudo: `Parabéns! Você completou o estudo de **${topicoTitulo}**.`,
        pontos: secoesCompletas.slice(0, 5).map(s => s.titulo)
      }]
    });

    // Build final content
    const totalPaginas = secoesCompletas.reduce((acc: number, s: any) => acc + (s.slides?.length || 0), 0);
    console.log(`[Faculdade] Total: ${totalPaginas} páginas, ${secoesCompletas.length} seções`);

    const conteudoFinal = {
      versao: 1,
      titulo: topicoTitulo,
      tempoEstimado: estrutura.tempoEstimado || "20 min",
      area: areaNome,
      disciplina: disciplinaNome,
      objetivos: estrutura.objetivos || [],
      secoes: secoesCompletas,
      paginas: secoesCompletas.flatMap((s: any) => s.slides || []).map((slide: any) => ({
        titulo: slide.titulo,
        tipo: slide.tipo,
        markdown: slide.conteudo
      }))
    };

    // Save to database
    const { error: updateError } = await supabase
      .from("faculdade_topicos")
      .update({
        conteudo_gerado: conteudoFinal,
        flashcards: extras.flashcards || [],
        questoes: extras.questoes || [],
        termos: { glossario: extras.termos || [] },
        exemplos: extras.exemplos || [],
        status: "concluido",
        updated_at: new Date().toISOString(),
      })
      .eq("id", topico_id);

    if (updateError) throw updateError;

    console.log(`[Faculdade] ✅ Conteúdo salvo: ${topicoTitulo} (${totalPaginas} páginas)`);

    // Process next in queue
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

  } catch (error: any) {
    console.error("[Faculdade] ❌ Erro background:", error);
    try {
      await supabase
        .from("faculdade_topicos")
        .update({ status: "erro", updated_at: new Date().toISOString() })
        .eq("id", topico_id);
      await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
    } catch (e) {
      console.error("[Faculdade] Erro ao marcar erro:", e);
    }
  }
}

async function processarProximoDaFila(supabase: any, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    const { data: ativos } = await supabase
      .from("faculdade_topicos")
      .select("id")
      .eq("status", "gerando");

    const ativosCount = ativos?.length || 0;
    const slotsDisponiveis = MAX_CONCURRENT - ativosCount;
    if (slotsDisponiveis <= 0) return;

    const { data: proximos } = await supabase
      .from("faculdade_topicos")
      .select("id, titulo")
      .eq("status", "na_fila")
      .order("ordem", { ascending: true })
      .limit(slotsDisponiveis);

    if (!proximos || proximos.length === 0) return;

    console.log(`[Faculdade Fila] Disparando ${proximos.length} próximos`);
    for (const proximo of proximos) {
      fetch(`${supabaseUrl}/functions/v1/gerar-conteudo-faculdade-topico`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ topico_id: proximo.id }),
      }).catch(err => console.error("[Faculdade Fila] Erro:", err));
    }
  } catch (err) {
    console.error("[Faculdade Fila] Erro:", err);
  }
}
