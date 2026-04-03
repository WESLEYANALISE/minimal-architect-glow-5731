import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let topicoIdForCatch: number | null = null;
  let supabaseForCatch: any = null;

  try {
    const { topico_id, force_restart } = await req.json();
    topicoIdForCatch = topico_id ?? null;
    
    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    supabaseForCatch = supabase;

    // ============================================
    // SISTEMA DE FILA - Permitir até 5 simultâneas
    // ============================================
    const MAX_CONCURRENT = 5;

    const { data: gerandoAtivos } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo")
      .eq("status", "gerando")
      .neq("id", topico_id);

    const ativosCount = gerandoAtivos?.length || 0;

    if (ativosCount >= MAX_CONCURRENT) {
      console.log(`[Conceitos Fila] ${ativosCount} gerações ativas, enfileirando`);
      
      const { data: maxPosicao } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      const { data: jaEnfileirado } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila, status")
        .eq("id", topico_id)
        .single();
      
      if (jaEnfileirado?.status === "na_fila") {
        return new Response(
          JSON.stringify({ queued: true, position: jaEnfileirado.posicao_fila }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      await supabase
        .from("conceitos_topicos")
        .update({ status: "na_fila", posicao_fila: novaPosicao })
        .eq("id", topico_id);
      
      return new Response(
        JSON.stringify({ queued: true, position: novaPosicao }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // BUSCAR TÓPICO
    // ============================================
    const { data: topico, error: topicoError } = await supabase
      .from("conceitos_topicos")
      .select(`*, materia:conceitos_materias(id, nome, codigo)`)
      .eq("id", topico_id)
      .single();

    if (topicoError || !topico) {
      return new Response(
        JSON.stringify({ error: "Tópico não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "gerando" && !force_restart) {
      return new Response(
        JSON.stringify({ message: "Geração já em andamento" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marcar como gerando
    await supabase
      .from("conceitos_topicos")
      .update({ status: "gerando", progresso: 5, posicao_fila: null })
      .eq("id", topico_id);

    const materiaNome = topico.materia?.nome || "";
    const topicoTitulo = topico.titulo;
    console.log(`[Conceitos] ══════════════════════════════════════════`);
    console.log(`[Conceitos] Iniciando geração INCREMENTAL: ${topicoTitulo}`);

    // ============================================
    // BUSCAR CONTEÚDO DO PDF
    // ============================================
    const { data: paginas } = await supabase
      .from("conceitos_topico_paginas")
      .select("pagina, conteudo")
      .eq("topico_id", topico_id)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter(p => p.conteudo && p.conteudo.trim().length > 0)
        .map(p => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
      console.log(`[Conceitos] PDF: ${paginas.length} páginas, ${conteudoPDF.length} chars`);
    }

    // ============================================
    // CONFIGURAR GEMINI
    // ============================================
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
    ].filter(Boolean);
    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Função para atualizar progresso
    const updateProgress = async (value: number) => {
      await supabase
        .from("conceitos_topicos")
        .update({ progresso: value })
        .eq("id", topico_id);
    };

    // Função para sanitizar JSON
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

    // Função para gerar e fazer parse de JSON com retry
    async function gerarJSON(prompt: string, maxRetries = 2): Promise<any> {
      let lastError: any = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[Conceitos] Retry ${attempt}/${maxRetries}...`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
          
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.5 },
          });
          
          let text = result.response.text();
          text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
          
          const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
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
          console.error(`[Conceitos] Tentativa ${attempt + 1} falhou:`, err);
        }
      }
      
      throw lastError;
    }

    // ============================================
    // PROMPT BASE
    // ============================================
    const promptBase = `Você é um professor experiente explicando Direito para uma pessoa LEIGA.
Seu estilo é como uma CONVERSA DE CAFÉ - descontraído, acolhedor e didático.

═══ PÚBLICO-ALVO ═══
Pessoas que NUNCA estudaram o tema. Assuma ZERO conhecimento prévio.

═══ TOM DE VOZ ═══
- Descontraído, claro e acolhedor
- Use expressões naturais: "Percebeu?", "Faz sentido, né?", "Na prática...", "Veja bem...", "Note que..."
- Perguntas guiadas: "E por que isso importa?", "Percebeu a diferença?"
- Seguro e correto tecnicamente
- Próximo, como conversa entre amigos reais
- NUNCA infantilizado ou condescendente

═══ ESTRUTURA DIDÁTICA OBRIGATÓRIA ═══

1. **SIMPLES PRIMEIRO → TÉCNICO DEPOIS (REGRA DE OURO)**
   ❌ ERRADO: "A jurisdição voluntária caracteriza-se por..."
   ✅ CERTO: "Sabe quando duas pessoas concordam com tudo, mas ainda precisam do juiz para oficializar? Isso é o que o Direito chama de 'jurisdição voluntária'."

2. **TRADUÇÃO IMEDIATA de termos técnicos e latim:**
   - "O 'pacta sunt servanda' (significa 'os pactos devem ser cumpridos' - ou seja, combinado é combinado!)"
   - "Isso é o que chamamos de 'trânsito em julgado' (quando não dá mais para recorrer de uma decisão)"
   - "O 'habeas corpus' (do latim 'que tenhas o corpo' - basicamente: traga a pessoa presa para o juiz ver)"

3. **DESMEMBRE conceitos difíceis:**
   Divida em partes menores, explicando passo a passo, como se estivesse "mastigando" o conteúdo para o aluno.

4. **ANALOGIAS DO COTIDIANO:**
   - "Pense na competência como o território de cada juiz. Assim como um policial de SP não pode multar alguém no RJ..."
   - "É tipo quando você pede um lanche: se vier errado, você pode reclamar - isso é o seu 'direito de consumidor'."

5. **ANTECIPE DÚVIDAS:**
   "Você pode estar pensando: 'Mas isso não seria injusto?' Veja bem..."

═══ CUIDADOS IMPORTANTES ═══
- NÃO use emojis no texto corrido (a interface já adiciona os ícones visuais)
- NÃO mencione "PDF", "material", "documento" - escreva como conhecimento SEU
- NÃO comece slides com saudações (exceto introdução da primeira seção)
- Slides tipo "caso" JÁ SÃO exemplo prático - não adicione outro dentro
- NUNCA seja formal demais ou use "juridiquês" sem explicação imediata

═══ PROFUNDIDADE ═══
- Mínimo 200-400 palavras em slides tipo "texto"
- Cite artigos de lei de forma acessível: "O artigo 5º da Constituição garante que todos são iguais perante a lei - parece óbvio, mas veja como isso funciona na prática..."
- Termos-chave entre aspas simples: 'tipicidade', 'culpabilidade', 'antijuridicidade'
- Cite juristas de forma acessível: "Como ensina Dinamarco (um dos grandes estudiosos do tema)..."

**Matéria:** ${materiaNome}
**Tópico:** ${topicoTitulo}

═══ REFERÊNCIA DE ESTUDO ═══
${conteudoPDF || "Conteúdo não disponível"}
═══════════════════════`;

    await updateProgress(10);

    // ============================================
    // ETAPA 1: GERAR ESTRUTURA/ESQUELETO
    // ============================================
    console.log(`[Conceitos] ETAPA 1: Gerando estrutura/esqueleto...`);
    
    const promptEstrutura = `${promptBase}

═══ SUA TAREFA ═══
Crie APENAS a ESTRUTURA/ESQUELETO do conteúdo interativo.
NÃO gere o conteúdo completo agora, apenas títulos e tipos de página.

Retorne um JSON com esta estrutura EXATA:
{
  "titulo": "${topicoTitulo}",
  "tempoEstimado": "25 min",
  "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3", "Objetivo 4"],
  "secoes": [
    {
      "id": 1,
      "titulo": "Nome da Seção",
      "paginas": [
        {"tipo": "introducao", "titulo": "O que você vai aprender"},
        {"tipo": "texto", "titulo": "Conceito Principal X"},
        {"tipo": "texto", "titulo": "Detalhamento de Y"},
        {"tipo": "termos", "titulo": "Termos Importantes"},
        {"tipo": "quickcheck", "titulo": "Verificação Rápida"}
      ]
    },
    {
      "id": 2,
      "titulo": "Segunda Seção",
      "paginas": [...]
    }
  ]
}

REGRAS:
1. Gere entre 5-7 seções
2. Cada seção deve ter 6-10 páginas (total final: 35-55 páginas)
3. TIPOS DISPONÍVEIS: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck
4. Distribua bem os tipos (não só "texto")
5. Cada seção deve ter pelo menos 1 quickcheck
6. Use títulos descritivos para cada página
7. Cubra TODO o conteúdo do PDF

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
      console.log(`[Conceitos] ✓ Estrutura: ${estrutura.secoes.length} seções, ${totalPaginasEstrutura} páginas planejadas`);
    } catch (err) {
      console.error(`[Conceitos] ❌ Erro na estrutura:`, err);
      throw new Error(`Falha ao gerar estrutura: ${err}`);
    }

    await updateProgress(15);

    // ============================================
    // ETAPA 2: GERAR CONTEÚDO POR SEÇÃO (BATCH INCREMENTAL)
    // ============================================
    console.log(`[Conceitos] ETAPA 2: Gerando conteúdo seção por seção...`);
    
    const secoesCompletas: any[] = [];
    const totalSecoes = estrutura.secoes.length;

    for (let i = 0; i < totalSecoes; i++) {
      const secaoEstrutura = estrutura.secoes[i];
      const progressoSecao = Math.round(20 + (i / totalSecoes) * 60); // 20% a 80%
      
      console.log(`[Conceitos] Gerando seção ${i + 1}/${totalSecoes}: ${secaoEstrutura.titulo}`);
      await updateProgress(progressoSecao);

      const promptSecao = `${promptBase}

═══ SUA TAREFA ═══
Gere o CONTEÚDO COMPLETO para a SEÇÃO ${i + 1}:
Título: "${secaoEstrutura.titulo}"

PÁGINAS A GERAR (com seus tipos):
${JSON.stringify(secaoEstrutura.paginas, null, 2)}

Para CADA página, retorne o objeto completo com:

1. Para tipo "introducao":
   {"tipo": "introducao", "titulo": "...", "conteudo": "Texto motivador sobre o que será aprendido...", "imagemPrompt": "CINEMATIC 16:9 horizontal illustration, EDGE-TO-EDGE composition, NO white borders, NO margins, FULL BLEED image extending to all edges, dark rich background covering entire frame, professional educational scene about..."}

2. Para tipo "texto":
   {"tipo": "texto", "titulo": "...", "conteudo": "Explicação EXTENSA (200-400 palavras) com exemplos, termos explicados, citações legais...", "imagemPrompt": "CINEMATIC 16:9 horizontal, FULL BLEED edge-to-edge, NO white corners, NO borders, dark moody background filling entire frame..."}

3. Para tipo "termos":
   {"tipo": "termos", "titulo": "...", "conteudo": "Introdução breve", "termos": [{"termo": "...", "definicao": "..."}], "imagemPrompt": "..."}

4. Para tipo "linha_tempo":
   {"tipo": "linha_tempo", "titulo": "...", "conteudo": "Contexto", "etapas": [{"titulo": "...", "descricao": "..."}], "imagemPrompt": "..."}

5. Para tipo "tabela":
   {"tipo": "tabela", "titulo": "...", "conteudo": "Descrição", "tabela": {"cabecalhos": [...], "linhas": [[...], [...]]}, "imagemPrompt": "..."}

6. Para tipo "atencao":
   {"tipo": "atencao", "titulo": "...", "conteudo": "⚠️ Ponto importante com exemplo...", "imagemPrompt": "..."}

7. Para tipo "dica":
   {"tipo": "dica", "titulo": "...", "conteudo": "💡 Dica de memorização ou macete...", "imagemPrompt": "..."}

8. Para tipo "caso":
   {"tipo": "caso", "titulo": "...", "conteudo": "💼 Descrição do caso prático com análise jurídica...", "imagemPrompt": "..."}

9. Para tipo "quickcheck":
   {"tipo": "quickcheck", "titulo": "...", "conteudo": "Teste seu conhecimento:", "pergunta": "...", "opcoes": ["A", "B", "C", "D"], "resposta": 0, "feedback": "Explicação...", "imagemPrompt": "..."}

10. Para tipo "resumo":
    {"tipo": "resumo", "titulo": "...", "conteudo": "Recapitulando:", "pontos": ["...", "...", "..."], "imagemPrompt": "..."}

Retorne um JSON com a seção COMPLETA:
{
  "id": ${secaoEstrutura.id},
  "titulo": "${secaoEstrutura.titulo}",
  "slides": [
    // Array com TODAS as páginas completas
  ]
}

REGRAS CRÍTICAS:
- imagemPrompt deve ser em INGLÊS, formato 16:9 HORIZONTAL OBRIGATÓRIO
- imagemPrompt DEVE incluir: "FULL BLEED edge-to-edge, NO white borders, NO white corners, NO margins, dark rich background extending to ALL edges"
- Páginas "texto" devem ter 200-400 palavras com exemplos práticos
- Use blockquotes (>) para citações e cards de atenção
- NUNCA use emojis no texto corrido (só nos cards especiais)

Retorne APENAS o JSON da seção, sem texto adicional.`;

      try {
        const secaoCompleta = await gerarJSON(promptSecao);
        
        if (!secaoCompleta?.slides || !Array.isArray(secaoCompleta.slides)) {
          throw new Error(`Seção ${i + 1} sem slides válidos`);
        }
        
        if (secaoCompleta.slides.length < 3) {
          throw new Error(`Seção ${i + 1} com apenas ${secaoCompleta.slides.length} slides`);
        }
        
        secoesCompletas.push(secaoCompleta);
        console.log(`[Conceitos] ✓ Seção ${i + 1}: ${secaoCompleta.slides.length} páginas`);
        
      } catch (err) {
        console.error(`[Conceitos] ❌ Erro na seção ${i + 1}:`, err);
        // Criar seção de fallback mínima
        secoesCompletas.push({
          id: secaoEstrutura.id,
          titulo: secaoEstrutura.titulo,
          slides: [{
            tipo: "texto",
            titulo: secaoEstrutura.titulo,
            conteudo: `Conteúdo da seção "${secaoEstrutura.titulo}" está sendo regenerado. Por favor, tente novamente em alguns instantes.`,
            imagemPrompt: "Educational placeholder illustration"
          }]
        });
      }
    }

    await updateProgress(85);

    // ============================================
    // ETAPA 3: GERAR EXTRAS (correspondências, flashcards, questões)
    // ============================================
    console.log(`[Conceitos] ETAPA 3: Gerando extras...`);

    const promptExtras = `${promptBase}

═══ SUA TAREFA ═══
Gere elementos de estudo complementares e gamificação:

Retorne JSON com:
{
  "correspondencias": [
    {"termo": "Termo técnico", "definicao": "Definição em linguagem simples (máx 60 chars)"}
  ],
  "ligar_termos": [
    {"conceito": "Descrição do conceito em linguagem simples", "termo": "Termo técnico correspondente"}
  ],
  "explique_com_palavras": [
    {"conceito": "Nome do conceito", "dica": "Como você explicaria para um vizinho?"}
  ],
  "exemplos": [
    {"titulo": "Título do caso", "situacao": "Descrição acessível", "analise": "Análise em linguagem simples", "conclusao": "Conclusão prática"}
  ],
  "termos": [
    {"termo": "Termo jurídico", "definicao": "Explicação como se fosse para um leigo completo"}
  ],
  "flashcards": [
    {"frente": "Pergunta clara", "verso": "Resposta didática", "exemplo": "Exemplo do dia a dia"}
  ],
  "questoes": [
    {"pergunta": "Enunciado prático", "alternativas": ["A) opção", "B) opção", "C) opção", "D) opção"], "correta": 0, "explicacao": "Explicação didática do porquê"}
  ]
}

QUANTIDADES:
- correspondencias: 8-10 pares
- ligar_termos: 6-8 pares (gamificação)
- explique_com_palavras: 4-6 desafios (gamificação)
- exemplos: 5-8 casos
- termos: 10-15 termos
- flashcards: 15-25 cards
- questoes: 8-15 questões

Retorne APENAS o JSON.`;

    let extras: any = {};
    try {
      extras = await gerarJSON(promptExtras);
      console.log(`[Conceitos] ✓ Extras gerados`);
    } catch (err) {
      console.error(`[Conceitos] ❌ Erro nos extras (usando fallback):`, err);
      extras = { correspondencias: [], exemplos: [], termos: [], flashcards: [], questoes: [] };
    }

    await updateProgress(90);

    // ============================================
    // ETAPA 4: MONTAR E VALIDAR ESTRUTURA FINAL
    // ============================================
    console.log(`[Conceitos] ETAPA 4: Montando estrutura final...`);

    const slidesData = {
      versao: 1,
      titulo: estrutura.titulo || topicoTitulo,
      tempoEstimado: estrutura.tempoEstimado || "25 min",
      objetivos: estrutura.objetivos || [],
      secoes: secoesCompletas
    };

    // VALIDAÇÃO CRÍTICA: Contar páginas totais
    const totalPaginas = secoesCompletas.reduce(
      (acc, s) => acc + (s.slides?.length || 0), 0
    );

    console.log(`[Conceitos] Validação: ${totalPaginas} páginas em ${secoesCompletas.length} seções`);

    // VALIDAÇÃO: Mínimo de 20 páginas para considerar válido
    if (totalPaginas < 20) {
      throw new Error(`Conteúdo insuficiente: apenas ${totalPaginas} páginas (mínimo: 20). A geração será marcada como erro.`);
    }

    // Validar que cada seção tem slides
    const secoesVazias = secoesCompletas.filter(s => !s.slides || s.slides.length === 0);
    if (secoesVazias.length > 0) {
      throw new Error(`${secoesVazias.length} seções sem conteúdo. A geração será marcada como erro.`);
    }

    // ============================================
    // MONTAR CORRESPONDÊNCIAS
    // ============================================
    let correspondencias = extras.correspondencias || [];
    if (!Array.isArray(correspondencias) || correspondencias.length < 6) {
      if (extras.termos && Array.isArray(extras.termos) && extras.termos.length >= 6) {
        correspondencias = extras.termos.slice(0, 10).map((t: any) => ({
          termo: t.termo || t.nome || String(t),
          definicao: (t.definicao || t.descricao || "Conceito jurídico").substring(0, 60)
        }));
      }
    }
    
    correspondencias = correspondencias
      .filter((c: any) => c && c.termo && c.definicao)
      .slice(0, 10)
      .map((c: any) => ({
        termo: String(c.termo).trim().substring(0, 50),
        definicao: String(c.definicao).trim().substring(0, 80)
      }));

    const termosComCorrespondencias = {
      glossario: extras.termos || [],
      correspondencias: correspondencias
    };

    // ============================================
    // SALVAR NO BANCO (SÓ SE VÁLIDO!)
    // ============================================
    const { error: updateError } = await supabase
      .from("conceitos_topicos")
      .update({
        exemplos: extras.exemplos || [],
        termos: termosComCorrespondencias,
        flashcards: extras.flashcards || [],
        questoes: extras.questoes || [],
        slides_json: slidesData,
        status: "concluido",
        progresso: 100,
        tentativas: (topico.tentativas || 0) + 1,
        posicao_fila: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topico_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`[Conceitos] ══════════════════════════════════════════`);
    console.log(`[Conceitos] ✅ SUCESSO: ${topicoTitulo}`);
    console.log(`[Conceitos] ✅ ${totalPaginas} páginas em ${secoesCompletas.length} seções`);
    console.log(`[Conceitos] ══════════════════════════════════════════`);

    // ============================================
    // DISPARAR BATCH DE IMAGENS
    // ============================================
    if (slidesData.secoes && Array.isArray(slidesData.secoes)) {
      const imagensParaBatch: Array<{id: number; slideId: string; prompt: string}> = [];
      
      slidesData.secoes.forEach((secao: any, secaoIdx: number) => {
        if (secao.slides && Array.isArray(secao.slides)) {
          secao.slides.forEach((slideItem: any, slideIdx: number) => {
            if (slideItem.imagemPrompt) {
              imagensParaBatch.push({
                id: imagensParaBatch.length,
                slideId: `${secaoIdx}-${slideIdx}`,
                prompt: slideItem.imagemPrompt
              });
            }
          });
        }
      });
      
      if (imagensParaBatch.length > 0) {
        console.log(`[Conceitos] Disparando batch para ${imagensParaBatch.length} imagens`);
        
        fetch(`${supabaseUrl}/functions/v1/batch-imagens-iniciar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            tipo: "imagens_slides",
            items: imagensParaBatch,
            materia_id: topico.materia?.id || null,
            topico_id: topico_id
          })
        }).catch(err => {
          console.error("[Conceitos] Erro ao iniciar batch de imagens:", err);
        });
      }
    }

    // Processar próximo da fila
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conteúdo gerado com sucesso (modo incremental)",
        topico_id,
        titulo: topicoTitulo,
        paginas: totalPaginas,
        secoes: secoesCompletas.length,
        stats: {
          correspondencias: correspondencias.length,
          exemplos: extras.exemplos?.length || 0,
          termos: extras.termos?.length || 0,
          flashcards: extras.flashcards?.length || 0,
          questoes: extras.questoes?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Conceitos] ══════════════════════════════════════════");
    console.error("[Conceitos] ❌ ERRO:", error.message || error);
    console.error("[Conceitos] ══════════════════════════════════════════");

    try {
      if (topicoIdForCatch && supabaseForCatch) {
        // Marcar como ERRO - nunca como concluído sem conteúdo válido!
        await supabaseForCatch
          .from("conceitos_topicos")
          .update({ 
            status: "erro", 
            progresso: 0,
            posicao_fila: null
          })
          .eq("id", topicoIdForCatch);

        await processarProximoDaFila(
          supabaseForCatch,
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
      }
    } catch (catchErr) {
      console.error("[Conceitos] Erro no fallback:", catchErr);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função auxiliar para processar próximo da fila
async function processarProximoDaFila(supabase: any, supabaseUrl: string, supabaseServiceKey: string) {
  const MAX_CONCURRENT = 5;
  try {
    // Contar quantos estão gerando
    const { data: ativos } = await supabase
      .from("conceitos_topicos")
      .select("id")
      .eq("status", "gerando");

    const ativosCount = ativos?.length || 0;
    const slotsDisponiveis = MAX_CONCURRENT - ativosCount;

    if (slotsDisponiveis <= 0) {
      console.log(`[Conceitos Fila] ${ativosCount} ativos, sem slots`);
      return;
    }

    const { data: proximos } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo")
      .eq("status", "na_fila")
      .order("posicao_fila", { ascending: true })
      .limit(slotsDisponiveis);

    if (!proximos || proximos.length === 0) {
      console.log("[Conceitos Fila] Fila vazia");
      return;
    }

    console.log(`[Conceitos Fila] Disparando ${proximos.length} próximos (${ativosCount} ativos)`);

    for (const proximo of proximos) {
      fetch(`${supabaseUrl}/functions/v1/gerar-conteudo-conceitos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ topico_id: proximo.id }),
      }).catch(err => console.error("[Conceitos Fila] Erro:", err));
    }
  } catch (err) {
    console.error("[Conceitos Fila] Erro:", err);
  }
}
