import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

// VERSÃO para debugging de deploy
const VERSION = "v2.8.0-flashcards-questoes-fix";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Constantes de configuração
const MIN_PAGINAS = 40;
const MAX_TENTATIVAS = 3;

// Declarar EdgeRuntime para processamento em background
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { topico_id, resumo_id, force_restart, force_regenerate } = body;
    
    // Aceitar resumo_id OU topico_id
    const isResumoMode = !!resumo_id && !topico_id;
    
    if (!topico_id && !resumo_id) {
      return new Response(
        JSON.stringify({ error: "topico_id ou resumo_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // MODO RESUMO (Subtema): Gerar conteúdo para tabela RESUMO
    // ============================================
    if (isResumoMode) {
      console.log(`[OAB Trilhas] ══════════════════════════════════════════`);
      console.log(`[OAB Trilhas] 🚀 MODO RESUMO: Gerando subtema ID ${resumo_id}`);
      console.log(`[OAB Trilhas] 📦 VERSÃO: ${VERSION}`);
      console.log(`[OAB Trilhas] ══════════════════════════════════════════`);

      // Buscar dados do resumo
      const { data: resumo, error: resumoError } = await supabase
        .from("RESUMO")
        .select("*")
        .eq("id", resumo_id)
        .single();

      if (resumoError || !resumo) {
        return new Response(
          JSON.stringify({ error: "Resumo não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar se já tem conteúdo e não é force
      if (resumo.slides_json && !force_regenerate) {
        console.log(`[OAB Trilhas] Resumo ${resumo_id} já tem conteúdo, retornando`);
        return new Response(
          JSON.stringify({ success: true, already_generated: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Processar em background
      EdgeRuntime.waitUntil(processarGeracaoResumoBackground(
        supabase, 
        resumo_id, 
        resumo
      ));

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: "gerando",
          background: true,
          message: "Geração do subtema iniciada em background.",
          resumo_id,
          titulo: resumo.subtema
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // MODO TÓPICO: Fluxo original com fila
    // ============================================
    // === SISTEMA DE FILA - Permitir até 5 gerações simultâneas ===
    const MAX_CONCURRENT = 5;
    const STALE_GENERATION_MINUTES = 30;
    const staleCutoff = new Date(Date.now() - STALE_GENERATION_MINUTES * 60 * 1000).toISOString();

    const { data: gerandoAtivos, error: checkError } = await supabase
      .from("oab_trilhas_topicos")
      .select("id, titulo, updated_at, progresso")
      .eq("status", "gerando")
      .neq("id", topico_id);

    // Watchdog: marcar gerações travadas como erro
    let ativosValidos = 0;
    if (!checkError && gerandoAtivos && gerandoAtivos.length > 0) {
      for (const ativo of gerandoAtivos) {
        const updatedAt = ativo.updated_at as string | null;
        const isStale = !!updatedAt && updatedAt < staleCutoff;

        if (isStale) {
          console.log(`[OAB Watchdog] Geração travada (>${STALE_GENERATION_MINUTES}min). Marcando como erro: ${ativo.titulo} (ID: ${ativo.id})`);
          await supabase
            .from("oab_trilhas_topicos")
            .update({ status: "erro", progresso: 0, posicao_fila: null, updated_at: new Date().toISOString() })
            .eq("id", ativo.id);
        } else {
          ativosValidos++;
        }
      }
    }

    // Se já tem 5 ou mais ativos válidos, enfileirar
    if (ativosValidos >= MAX_CONCURRENT) {
      console.log(`[OAB Fila] ${ativosValidos} gerações ativas, enfileirando tópico ${topico_id}`);
      
      const { data: maxPosicao } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      const { data: jaEnfileirado } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila, status")
        .eq("id", topico_id)
        .single();
      
      if (jaEnfileirado?.status === "na_fila") {
        return new Response(
          JSON.stringify({ queued: true, position: jaEnfileirado.posicao_fila, message: `Já está na fila` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      await supabase
        .from("oab_trilhas_topicos")
        .update({ status: "na_fila", posicao_fila: novaPosicao, updated_at: new Date().toISOString() })
        .eq("id", topico_id);
      
      return new Response(
        JSON.stringify({ queued: true, position: novaPosicao, message: `Adicionado à fila na posição ${novaPosicao}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // VERIFICAR TÓPICO E MARCAR COMO GERANDO
    // ============================================
    const { data: topico, error: topicoError } = await supabase
      .from("oab_trilhas_topicos")
      .select(`
        *,
        materia:oab_trilhas_materias(id, nome)
      `)
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
        JSON.stringify({ message: "Geração já em andamento", background: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "gerando" && force_restart) {
      console.log(`[OAB Trilhas] 🔁 Force restart solicitado para topico_id=${topico_id}`);
    }

    const posicaoRemovida = topico.posicao_fila;
    
    // Marcar como gerando IMEDIATAMENTE
    await supabase
      .from("oab_trilhas_topicos")
      .update({ 
        status: "gerando", 
        progresso: 5,
        posicao_fila: null,
        updated_at: new Date().toISOString() 
      })
      .eq("id", topico_id);

    // Atualizar posições da fila
    if (posicaoRemovida) {
      const { data: filaParaAtualizar } = await supabase
        .from("oab_trilhas_topicos")
        .select("id, posicao_fila")
        .eq("status", "na_fila")
        .gt("posicao_fila", posicaoRemovida);
      
      if (filaParaAtualizar && filaParaAtualizar.length > 0) {
        for (const item of filaParaAtualizar) {
          await supabase
            .from("oab_trilhas_topicos")
            .update({ posicao_fila: (item.posicao_fila || 1) - 1 })
            .eq("id", item.id);
        }
        console.log(`[OAB Fila] Posições atualizadas: ${filaParaAtualizar.length} itens`);
      }
    }

    console.log(`[OAB Trilhas] ══════════════════════════════════════════`);
    console.log(`[OAB Trilhas] 🚀 Iniciando geração em BACKGROUND: ${topico.titulo}`);
    console.log(`[OAB Trilhas] ══════════════════════════════════════════`);

    // ============================================
    // PROCESSAR EM BACKGROUND - Retornar imediatamente
    // ============================================
    EdgeRuntime.waitUntil(processarGeracaoBackground(
      supabase, 
      supabaseUrl, 
      supabaseServiceKey, 
      topico_id, 
      topico
    ));

    // Retornar IMEDIATAMENTE - processamento continua em background
    return new Response(
      JSON.stringify({ 
        success: true, 
        background: true,
        message: "Geração iniciada em background. O progresso será atualizado automaticamente.",
        topico_id,
        titulo: topico.titulo
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[OAB Trilhas] ❌ Erro ao iniciar geração:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================
// FUNÇÃO DE PROCESSAMENTO EM BACKGROUND
// ============================================
async function processarGeracaoBackground(
  supabase: any, 
  supabaseUrl: string, 
  supabaseServiceKey: string,
  topico_id: number,
  topico: any
) {
  try {
    const updateProgress = async (value: number) => {
      await supabase
        .from("oab_trilhas_topicos")
        .update({ progresso: value, updated_at: new Date().toISOString() })
        .eq("id", topico_id);
    };

    const areaNome = topico.materia?.nome || "";
    const topicoTitulo = topico.titulo;
    const tentativasAtuais = topico.tentativas || 0;

    console.log(`[OAB Trilhas] ══════════════════════════════════════════`);
    console.log(`[OAB Trilhas] 🚀 Iniciando geração em BACKGROUND: ${topicoTitulo}`);
    console.log(`[OAB Trilhas] 📦 VERSÃO: ${VERSION}`);
    console.log(`[OAB Trilhas] ══════════════════════════════════════════`);
    console.log(`[OAB Trilhas] Gerando conteúdo INCREMENTAL: ${topicoTitulo} (tentativa ${tentativasAtuais + 1})`);

    // 1. Buscar conteúdo extraído das páginas do PDF
    await updateProgress(10);
    const { data: paginas } = await supabase
      .from("oab_trilhas_topico_paginas")
      .select("pagina, conteudo")
      .eq("topico_id", topico_id)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter((p: any) => p.conteudo && p.conteudo.trim().length > 0)
        .map((p: any) => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
      console.log(`[OAB Trilhas] PDF: ${paginas.length} páginas, ${conteudoPDF.length} chars`);
    } else {
      console.log("[OAB Trilhas] ALERTA: Nenhuma página do PDF encontrada!");
    }

    await updateProgress(15);

    // 2. Buscar contexto adicional do RESUMO se existir
    let conteudoResumo = "";
    const { data: resumos } = await supabase
      .from("RESUMO")
      .select("conteudo, subtema")
      .eq("area", areaNome)
      .eq("tema", topicoTitulo)
      .order("\"ordem subtema\"", { ascending: true })
      .limit(15);

    if (resumos && resumos.length > 0) {
      conteudoResumo = resumos.map((r: any) => {
        const sub = r.subtema ? `### ${r.subtema}\n` : "";
        return sub + (r.conteudo || "");
      }).join("\n\n");
      console.log(`[OAB Trilhas] RESUMO: ${resumos.length} subtemas`);
    }

    await updateProgress(20);

    // 3. Buscar contexto da Base de Conhecimento OAB
    let contextoBase = "";
    try {
      const { data: contextData } = await supabase.functions.invoke("buscar-contexto-base-oab", {
        body: { area: areaNome, topico: topicoTitulo, maxTokens: 5000 }
      });
      
      if (contextData?.contexto) {
        contextoBase = contextData.contexto;
        console.log(`[OAB Trilhas] Base OAB: ${contextData.tokensUsados} tokens`);
      }
    } catch (e) {
      console.log("[OAB Trilhas] Base de conhecimento não disponível");
    }

    await updateProgress(25);

    // 4. Configurar Gemini
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
    ].filter(Boolean);

    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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

    // Função para reparar JSON truncado/malformado
    function repairJson(text: string): string {
      let repaired = text.trim();
      
      // Remover markdown
      repaired = repaired.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      
      // Encontrar início do JSON
      const jsonStart = repaired.indexOf("{");
      if (jsonStart === -1) return "{}";
      repaired = repaired.substring(jsonStart);
      
      // Contar chaves e colchetes
      let braceCount = 0;
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      let lastValidIndex = 0;
      
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
      
      // Se JSON está completo, retornar
      if (braceCount === 0 && bracketCount === 0) {
        return repaired.substring(0, lastValidIndex + 1);
      }
      
      // Truncado: fechar estruturas abertas
      repaired = repaired.replace(/,\s*$/, ""); // Remover vírgula final
      repaired = repaired.replace(/:\s*$/, ': null'); // Fechar valor pendente
      repaired = repaired.replace(/"\s*$/, '"'); // Fechar string
      
      // Fechar arrays e objetos pendentes
      while (bracketCount > 0) { repaired += "]"; bracketCount--; }
      while (braceCount > 0) { repaired += "}"; braceCount--; }
      
      return repaired;
    }

    // Função para gerar e fazer parse de JSON com retry e reparo robusto
    async function gerarJSON(prompt: string, maxRetries = 2, maxTokens = 8192): Promise<any> {
      let lastError: any = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[OAB Trilhas] Retry ${attempt}/${maxRetries}...`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
          
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5 },
          });
          
          let text = result.response.text();
          
          // Tentar parse direto primeiro
          const sanitized = sanitizeJsonString(text);
          const repaired = repairJson(sanitized);
          
          try {
            return JSON.parse(repaired);
          } catch {
            // Segunda tentativa: limpar mais agressivamente
            const fixed = repaired
              .replace(/,\s*([}\]])/g, "$1")
              .replace(/([{,])\s*}/g, "$1}")
              .replace(/\[\s*,/g, "[")
              .replace(/,\s*,/g, ",");
            return JSON.parse(fixed);
          }
        } catch (err) {
          lastError = err;
          console.error(`[OAB Trilhas] Tentativa ${attempt + 1} falhou:`, err);
        }
      }
      
      throw lastError;
    }

    // ============================================
    // PROMPT BASE (ESTILO CONCEITOS - CONVERSA DESCONTRAÍDA)
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

═══ GRIFO E ÊNFASE (OBRIGATÓRIO) ═══
Para destacar termos-chave, use NEGRITO + ASPAS SIMPLES:

• TERMOS TÉCNICOS CRÍTICOS: **'competência absoluta'**, **'litispendência'**
• IDADES: **'16 anos'**, **'18 anos'**, **'35 anos de idade'**
• LEIS E ARTIGOS: **'Art. 5º da CF'**, **'Lei 9.504/97'**
• PRAZOS: **'30 dias'**, **'prazo de 15 dias'**
• VALORES: **'R$ 5.000'**, **'10 salários mínimos'**
• PORCENTAGENS: **'50%'**, **'10,5%'**
• DATAS: **'15 de agosto'**, **'1º de janeiro'**

EXEMPLO:
❌ ERRADO: "O prazo é de 30 dias para interpor recurso."
✅ CERTO: "O prazo é de **'30 dias'** para interpor recurso."

REGRA: Informações numéricas e termos técnicos DEVEM estar em negrito + aspas.

═══ CITAÇÕES DE ARTIGOS (OBRIGATÓRIO) ═══
Sempre que citar um artigo de lei, use BLOCKQUOTE do Markdown para destacar:

FORMATO:
> "Art. 5º - Todos são iguais perante a lei..." (CF/88)

EXEMPLOS:
✅ CERTO:
> "Art. 14, § 1º - O alistamento eleitoral e o voto são obrigatórios para os maiores de dezoito anos." (CF/88)

✅ CERTO:
> "Art. 121 - Matar alguém: Pena - reclusão, de seis a vinte anos." (Código Penal)

❌ ERRADO: Citar o artigo apenas no texto corrido sem destaque.

REGRA: Toda citação literal de artigo DEVE estar em blockquote (>).

═══ PROFUNDIDADE E DETALHAMENTO ═══
- Mínimo 250-400 palavras em slides tipo "texto"
- SEMPRE que usar um termo jurídico, explique-o INLINE imediatamente:
  ✅ "A **'competência absoluta'** (ou seja, regras que não podem ser mudadas pelas partes) determina..."
  ✅ "Isso configura a **'litispendência'** (quando já existe outra ação idêntica em andamento)"
- Cite artigos de lei de forma acessível: "O **'artigo 5º da Constituição'** garante que..."
- Estruture o texto com hierarquias claras:
  - Use parágrafos curtos (2-3 frases)
  - Separe conceitos principais de detalhes
  - Crie conexões: "Agora que você entendeu X, vamos ver como isso se aplica em Y..."
- Termos-chave em negrito + aspas: **'tipicidade'**, **'culpabilidade'**, **'antijuridicidade'**
- Cite juristas de forma acessível: "Como ensina Humberto Theodoro Júnior (um dos grandes estudiosos do tema)..."

**Matéria:** ${areaNome} - OAB 1ª Fase
**Tópico:** ${topicoTitulo}

═══ REFERÊNCIA DE ESTUDO ═══
${conteudoPDF || "Conteúdo não disponível"}
${conteudoResumo ? `\n═══ SUBTEMAS ═══\n${conteudoResumo}` : ""}
${contextoBase ? `\n═══ BASE OAB ═══\n${contextoBase}` : ""}
═══════════════════════`;

    // Função para remover saudações formais/repetitivas no início dos slides
    const limparSaudacoesProibidas = (texto: string): string => {
      if (!texto) return texto;
      const saudacoesProibidas = [
        // Saudações formais/artificiais que devem ser removidas
        /^Futuro\s+colega,?\s*/gi,
        /^Prezad[oa]\s+(advogad[oa]|coleg[ao]|estudante)[^.]*,?\s*/gi,
        /^Car[oa]\s+(colega|estudante|futuro)[^.]*,?\s*/gi,
        /^Coleg[ao],?\s*/gi,
        /^Estimad[oa]\s+(colega|estudante|futuro)[^.]*,?\s*/gi,
        /^E aí,?\s*(galera|futuro|colega|pessoal)?[!,.\s]*/gi,
        /^Olá[!,.\s]*/gi,
        /^Bem-vind[oa][!,.\s]*/gi,
        /^Tá preparad[oa][?!.\s]*/gi,
        /^Beleza[?!,.\s]*/gi,
        /^Partiu[!,.\s]*/gi,
        /^(Cara|Mano),?\s*/gi,
        /^Galera,?\s*/gi,
        /^Pessoal,?\s*/gi,
        /^Oi[!,.\s]*/gi,
        /^Olha só[,.:!]?\s*/gi,
      ];
      let resultado = texto;
      for (const regex of saudacoesProibidas) {
        resultado = resultado.replace(regex, '');
      }
      if (resultado.length > 0 && /^[a-z]/.test(resultado)) {
        resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
      }
      return resultado.trim();
    };

    // ============================================
    // ETAPA 1: GERAR ESTRUTURA/ESQUELETO
    // ============================================
    console.log(`[OAB Trilhas] ETAPA 1: Gerando estrutura/esqueleto...`);
    await updateProgress(30);
    
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

REGRAS OBRIGATÓRIAS:
1. Gere entre 6-8 seções (para alcançar 40-55 páginas totais)
2. Cada seção deve ter 6-9 páginas
3. TIPOS DISPONÍVEIS: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck, correspondencias

DISTRIBUIÇÃO MÍNIMA OBRIGATÓRIA:
- "introducao": 1 slide (APENAS na primeira seção)
- "texto": 15-20 slides (conteúdo principal detalhado)
- "atencao": 4-5 slides com "⚠️ ISSO CAI MUITO NA PROVA!" ou "CUIDADO: Pegadinha clássica!"
- "dica": 3-4 slides com técnicas de memorização e macetes
- "caso": 4-5 slides com exemplos práticos do cotidiano
- "tabela": 2-3 slides comparativos
- "quickcheck": 5-6 slides (pelo menos 1 por seção)
- "correspondencias": 1 slide no meio (entre páginas 25-30)
- "termos": 2-3 slides com vocabulário jurídico
- "resumo": 1 slide ao final de cada seção

4. NUNCA repita o slide "introducao" após a primeira seção - vá direto ao conteúdo
5. INCLUA frases de destaque nos slides "atencao": "⚠️ ISSO CAI MUITO NA PROVA!", "ATENÇÃO: A banca adora cobrar isso!"
6. Cada seção deve ter MIX de tipos - não apenas "texto"
7. INCLUA exatamente 1 slide "correspondencias" NA SEÇÃO DO MEIO (entre páginas 25-30) - gamificação de ligar termos
8. Use títulos descritivos para cada página
9. MANTENHA o título original: "${topicoTitulo}" (não altere)
10. Cubra TODO o conteúdo do material

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
      console.log(`[OAB Trilhas] ✓ Estrutura: ${estrutura.secoes.length} seções, ${totalPaginasEstrutura} páginas planejadas`);
    } catch (err) {
      console.error(`[OAB Trilhas] ❌ Erro na estrutura:`, err);
      throw new Error(`Falha ao gerar estrutura: ${err}`);
    }

    await updateProgress(35);

    // ============================================
    // ETAPA 2: GERAR CONTEÚDO POR SEÇÃO
    // ============================================
    console.log(`[OAB Trilhas] ETAPA 2: Gerando conteúdo seção por seção...`);
    
    const secoesCompletas: any[] = [];
    const totalSecoes = estrutura.secoes.length;

    for (let i = 0; i < totalSecoes; i++) {
      const secaoEstrutura = estrutura.secoes[i];
      const progressoSecao = Math.round(35 + (i / totalSecoes) * 40);
      
      console.log(`[OAB Trilhas] Gerando seção ${i + 1}/${totalSecoes}: ${secaoEstrutura.titulo}`);
      await updateProgress(progressoSecao);

      const promptSecao = `${promptBase}

═══ SUA TAREFA ═══
Gere o CONTEÚDO COMPLETO para a SEÇÃO ${i + 1}:
Título: "${secaoEstrutura.titulo}"

PÁGINAS A GERAR (com seus tipos):
${JSON.stringify(secaoEstrutura.paginas, null, 2)}

Para CADA página, retorne o objeto completo com TOM CONVERSACIONAL (como café com professor):

1. Para tipo "introducao" (APENAS NA PRIMEIRA SEÇÃO - ENGAJAMENTO OBRIGATÓRIO):
   {"tipo": "introducao", "titulo": "${topicoTitulo}", "conteudo": "☕ Prepare seu café, pois vamos mergulhar juntos em um tema muito importante para a OAB!\n\nNesta aula sobre **${topicoTitulo}**, vamos estudar de forma clara e prática. Ao final, você vai dominar:\n\n• **Conceito principal**: O que é e para que serve\n• **Requisitos legais**: O que a lei exige\n• **Casos práticos**: Como aplicar na prova\n• **Pegadinhas**: O que a banca adora cobrar\n• **Dicas de memorização**: Macetes para não esquecer\n\nVamos juntos? Bora começar! 🎯"}
   ⚠️ ATENÇÃO: O slide "introducao" SÓ aparece na PRIMEIRA seção. Nas demais seções, vá direto ao conteúdo.
   IMPORTANTE: MANTENHA o título original "${topicoTitulo}" - NÃO altere!

2. Para tipo "texto" (MÍNIMO 250 PALAVRAS - BEM DETALHADO):
   {"tipo": "texto", "titulo": "...", "conteudo": "Explicação EXTENSA e HIERÁRQUICA. Sempre use **'negrito + aspas'** para termos-chave: A **'competência absoluta'** (ou seja, regras que não podem ser mudadas pelas partes) determina...\n\nQuando citar artigos, use blockquote:\n\n> \"Art. XX - Texto do artigo...\" (Lei X)\n\nUse parágrafos curtos. Crie conexões: 'Agora que você entendeu X, vamos ver como isso se aplica em Y...'"}

3. Para tipo "correspondencias" (GAMIFICAÇÃO - COLOCAR NO MEIO DA AULA entre slides 25-30):
   {"tipo": "correspondencias", "titulo": "Vamos praticar?", "conteudo": "Conecte cada termo à sua definição correta:", "correspondencias": [
     {"termo": "Termo técnico 1", "definicao": "Definição simples 1"},
     {"termo": "Termo técnico 2", "definicao": "Definição simples 2"},
     {"termo": "Termo técnico 3", "definicao": "Definição simples 3"},
     {"termo": "Termo técnico 4", "definicao": "Definição simples 4"}
   ]}

4. Para tipo "termos":
   {"tipo": "termos", "titulo": "...", "conteudo": "Vamos conhecer os termos que você vai encontrar na prova:", "termos": [{"termo": "Termo Técnico", "definicao": "Explicação em linguagem simples, como se explicasse para um amigo que nunca estudou Direito"}]}

5. Para tipo "linha_tempo":
   {"tipo": "linha_tempo", "titulo": "...", "conteudo": "Passo a passo para entender o processo:", "etapas": [{"titulo": "1ª Etapa", "descricao": "Descrição clara e didática"}]}

6. Para tipo "tabela":
   {"tipo": "tabela", "titulo": "...", "conteudo": "Veja a comparação lado a lado:", "tabela": {"cabecalhos": [...], "linhas": [[...], [...]]}}

7. Para tipo "atencao" (ALERTA IMPORTANTE - COM INDICADOR DE PROVA):
   {"tipo": "atencao", "titulo": "⚠️ ISSO CAI MUITO NA PROVA!", "conteudo": "**Atenção redobrada aqui!**\n\nA banca ADORA cobrar esse ponto. Veja:\n\n> \"Art. XX - [texto do artigo relevante]\" (Lei X)\n\nMuita gente confunde [conceito A] com [conceito B], mas a diferença é crucial:\n\n• **'Conceito A'**: significa X\n• **'Conceito B'**: significa Y\n\n💡 **Dica para não errar**: Lembre-se que [macete de memorização]."}
   ⚠️ Obrigatório: 4-5 slides "atencao" por aula para destacar pegadinhas da banca!

8. Para tipo "dica" (TÉCNICA DE MEMORIZAÇÃO):
   {"tipo": "dica", "titulo": "💡 Macete para Memorizar", "conteudo": "**Técnica de Memorização: [Nome da técnica]**\n\nPara lembrar de **'[termo técnico]'**, use esta associação:\n\n📌 **Mnemônico**: [frase ou acrônimo]\n\n**Por que funciona?**\nQuando você [explicação simples da associação]...\n\n✅ **Teste agora**: Feche os olhos e repita o mnemônico 3 vezes!"}
   ⚠️ Obrigatório: 3-4 slides "dica" por aula com técnicas reais de memorização!

9. Para tipo "caso" (EXEMPLO PRÁTICO DO COTIDIANO):
   {"tipo": "caso", "titulo": "📋 Na Prática: Caso de [Contexto]", "conteudo": "**Situação Real:**\n\nImagine que João, um [profissão/situação], está enfrentando [problema concreto do dia-a-dia]...\n\n**Análise Jurídica:**\n\nAqui, aplica-se o **'[termo jurídico]'** (ou seja, [explicação simples]). Conforme:\n\n> \"Art. XX - [citação do artigo]\" ([Lei])\n\n**Conclusão Prática:**\n\nJoão [resultado/solução]. Isso mostra que, na prova, sempre que aparecer [situação similar], você deve pensar em [conceito-chave]."}
   ⚠️ Obrigatório: 4-5 slides "caso" por aula para contextualizar a teoria!

10. Para tipo "quickcheck" (FORMATO OBRIGATÓRIO - UMA PERGUNTA POR SLIDE):
   {"tipo": "quickcheck", "titulo": "Verificação Rápida", "conteudo": "Vamos testar se ficou claro:", "pergunta": "Qual é o prazo para interposição de recurso?", "opcoes": ["A) 5 dias", "B) 10 dias", "C) 15 dias", "D) 30 dias"], "resposta": 2, "feedback": "Correto! O prazo é de **'15 dias'** conforme o Art. X..."}
   ⚠️ ATENÇÃO: Use "pergunta" (singular), NÃO "perguntas" (plural). Cada slide quickcheck tem UMA pergunta só.

10. Para tipo "resumo":
    {"tipo": "resumo", "titulo": "...", "conteudo": "Recapitulando o que aprendemos:", "pontos": ["Ponto 1 com linguagem clara", "Ponto 2", "..."]}

Retorne um JSON com a seção COMPLETA:
{
  "id": ${secaoEstrutura.id},
  "titulo": "${secaoEstrutura.titulo}",
  "slides": [
    // Array com TODAS as páginas completas
  ]
}

REGRAS CRÍTICAS:
- Use TOM CONVERSACIONAL: "Percebeu?", "Faz sentido, né?", "Veja bem...", "Note que..."
- SIMPLES PRIMEIRO → TÉCNICO DEPOIS: Explique o conceito antes de dar o nome técnico
- EXPLICAÇÃO INLINE: Todo termo jurídico deve ser explicado entre parênteses imediatamente
- Tradução IMEDIATA de latim e juridiquês
- Páginas "texto" devem ter 250-400 palavras - BEM DETALHADAS
- Use HIERARQUIA clara: conceito principal → detalhes → aplicação prática
- Crie conexões entre os slides: "Lembra do que vimos antes? Agora..."
- Se esta seção está no MEIO (seções 3-4), inclua o slide "correspondencias"
- NUNCA use emojis no texto corrido (a interface já adiciona ícones)
- USE BLOCKQUOTE (>) para citações de artigos de lei
- USE **'negrito + aspas'** para termos-chave, prazos, valores e datas
- ESTA SEÇÃO ${i === 0 ? 'É a primeira - INCLUA slide introducao' : 'NÃO é a primeira - NÃO inclua slide introducao, vá direto ao conteúdo'}

Retorne APENAS o JSON da seção, sem texto adicional.`;

      try {
        const secaoCompleta = await gerarJSON(promptSecao);
        
        if (!secaoCompleta?.slides || !Array.isArray(secaoCompleta.slides)) {
          throw new Error(`Seção ${i + 1} sem slides válidos`);
        }
        
        if (secaoCompleta.slides.length < 3) {
          throw new Error(`Seção ${i + 1} com apenas ${secaoCompleta.slides.length} slides`);
        }
        
        // PÓS-PROCESSAMENTO: Remover saudações proibidas, normalizar quickcheck e remover introducao duplicada
        
        // Remover slides "introducao" de seções que não são a primeira
        if (i > 0) {
          secaoCompleta.slides = secaoCompleta.slides.filter(
            (slide: any) => slide.tipo !== 'introducao'
          );
        }
        
        for (const slide of secaoCompleta.slides) {
          const isPrimeiraSecaoIntro = i === 0 && slide.tipo === 'introducao';
          if (!isPrimeiraSecaoIntro && slide.conteudo) {
            slide.conteudo = limparSaudacoesProibidas(slide.conteudo);
          }
          
          // Normalizar quickcheck se Gemini gerou "perguntas" (plural)
          if (slide.tipo === 'quickcheck' && !slide.pergunta && slide.perguntas && Array.isArray(slide.perguntas) && slide.perguntas.length > 0) {
            const primeiraQuestao = slide.perguntas[0];
            slide.pergunta = primeiraQuestao.texto || primeiraQuestao.pergunta || '';
            slide.opcoes = primeiraQuestao.opcoes || [];
            slide.resposta = primeiraQuestao.respostaCorreta ?? primeiraQuestao.resposta ?? 0;
            slide.feedback = primeiraQuestao.feedback || '';
            delete slide.perguntas;
          }
        }
        
        secoesCompletas.push(secaoCompleta);
        console.log(`[OAB Trilhas] ✓ Seção ${i + 1}: ${secaoCompleta.slides.length} páginas`);
        
      } catch (err) {
        console.error(`[OAB Trilhas] ❌ Erro na seção ${i + 1}:`, err);
        secoesCompletas.push({
          id: secaoEstrutura.id,
          titulo: secaoEstrutura.titulo,
          slides: [{
            tipo: "texto",
            titulo: secaoEstrutura.titulo,
            conteudo: `Conteúdo da seção "${secaoEstrutura.titulo}" está sendo regenerado. Por favor, tente novamente em alguns instantes.`
          }]
        });
      }
    }

    await updateProgress(80);

    // ============================================
    // ETAPA 3: GERAR EXTRAS (dividido em 2 chamadas para evitar truncamento)
    // ============================================
    console.log(`[OAB Trilhas] [${VERSION}] ETAPA 3: Gerando extras em 2 partes...`);

    // PARTE A: Gamificação (correspondências, ligar_termos, explique_com_palavras, termos)
    const promptGamificacao = `${promptBase}

═══ SUA TAREFA ═══
Gere elementos de GAMIFICAÇÃO para estudo interativo sobre "${topicoTitulo}".

Retorne JSON com EXATAMENTE esta estrutura:
{
  "correspondencias": [
    {"termo": "Termo técnico", "definicao": "Definição curta (máx 50 chars)"}
  ],
  "ligar_termos": [
    {"conceito": "Descrição em linguagem simples do que significa", "termo": "Nome técnico"}
  ],
  "explique_com_palavras": [
    {"conceito": "Conceito a explicar", "dica": "Dica para ajudar"}
  ],
  "termos": [
    {"termo": "Termo jurídico", "definicao": "Explicação para leigo"}
  ],
  "exemplos": [
    {"titulo": "Título do caso", "situacao": "Situação", "analise": "Análise", "conclusao": "Conclusão"}
  ]
}

QUANTIDADES EXATAS:
- correspondencias: 8 pares
- ligar_termos: 6 pares (conceito simples → termo técnico)
- explique_com_palavras: 4 desafios
- termos: 10 termos
- exemplos: 5 casos

IMPORTANTE: Definições curtas, máximo 50 caracteres cada.
Retorne APENAS o JSON, nada mais.`;

    // PARTE B: Flashcards e Questões (AUMENTADO para 20-25 flashcards e 15-20 questões)
    const promptFlashQuestoes = `${promptBase}

═══ SUA TAREFA ═══
Gere FLASHCARDS e QUESTÕES estilo OAB sobre "${topicoTitulo}".

Retorne JSON com EXATAMENTE esta estrutura:
{
  "flashcards": [
    {"frente": "Pergunta direta sobre conceito-chave", "verso": "Resposta clara e objetiva", "exemplo": "Exemplo prático do cotidiano jurídico"}
  ],
  "questoes": [
    {"pergunta": "Enunciado completo da questão estilo OAB", "alternativas": ["A) Alternativa A", "B) Alternativa B", "C) Alternativa C", "D) Alternativa D"], "correta": 0, "explicacao": "Explicação detalhada de por que a alternativa correta está certa e as outras estão erradas"}
  ]
}

QUANTIDADES EXATAS (OBRIGATÓRIO):
- flashcards: EXATAMENTE 22 cards (entre 20 e 25)
- questoes: EXATAMENTE 17 questões estilo OAB (entre 15 e 20)

REGRAS PARA FLASHCARDS:
- Frente: Pergunta direta e objetiva
- Verso: Resposta clara, não muito longa (máx 100 palavras)
- Exemplo: Situação prática que ilustra o conceito

REGRAS PARA QUESTÕES:
- Enunciado claro e contextualizado (estilo OAB real)
- 4 alternativas plausíveis (A, B, C, D)
- Explicação que justifique a correta E refute as incorretas
- Variar os temas cobertos no conteúdo

Retorne APENAS o JSON, nada mais.`;

    let extras: any = { 
      correspondencias: [], 
      ligar_termos: [],
      explique_com_palavras: [],
      exemplos: [], 
      termos: [], 
      flashcards: [], 
      questoes: [] 
    };

    // Executar ambas as chamadas em paralelo
    try {
      const [gamificacao, flashQuestoes] = await Promise.all([
        gerarJSON(promptGamificacao, 2, 4096).catch(e => {
          console.error(`[OAB Trilhas] ⚠️ Erro gamificação:`, e.message);
          return {};
        }),
        gerarJSON(promptFlashQuestoes, 2, 6144).catch(e => {
          console.error(`[OAB Trilhas] ⚠️ Erro flash/questões:`, e.message);
          return {};
        })
      ]);

      // Mesclar resultados
      extras = {
        correspondencias: gamificacao.correspondencias || [],
        ligar_termos: gamificacao.ligar_termos || [],
        explique_com_palavras: gamificacao.explique_com_palavras || [],
        termos: gamificacao.termos || [],
        exemplos: gamificacao.exemplos || [],
        flashcards: flashQuestoes.flashcards || [],
        questoes: flashQuestoes.questoes || []
      };

      console.log(`[OAB Trilhas] ✓ Gamificação: ${extras.correspondencias.length} corresp, ${extras.ligar_termos.length} ligar, ${extras.explique_com_palavras.length} explicar`);
      console.log(`[OAB Trilhas] ✓ Estudo: ${extras.flashcards.length} flashcards, ${extras.questoes.length} questões`);
    } catch (err) {
      console.error(`[OAB Trilhas] ⚠️ Erro geral nos extras:`, err);
    }

    await updateProgress(85);

    // ============================================
    // VALIDAR PÁGINAS MÍNIMAS
    // ============================================
    const totalPaginas = secoesCompletas.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
    console.log(`[OAB Trilhas] Total de páginas geradas: ${totalPaginas}`);

    if (totalPaginas < MIN_PAGINAS) {
      console.log(`[OAB Trilhas] ⚠️ Apenas ${totalPaginas} páginas (mínimo: ${MIN_PAGINAS})`);
      
      const novasTentativas = tentativasAtuais + 1;
      
      if (novasTentativas >= MAX_TENTATIVAS) {
        console.log(`[OAB Trilhas] ❌ Máximo de tentativas atingido, marcando como erro`);
        await supabase.from("oab_trilhas_topicos")
          .update({ status: "erro", tentativas: novasTentativas, progresso: 0 })
          .eq("id", topico_id);
        
        await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
        return;
      }
      
      // Recolocar na fila
      const { data: maxPosicao } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      await supabase.from("oab_trilhas_topicos")
        .update({ 
          status: "na_fila", 
          posicao_fila: novaPosicao,
          tentativas: novasTentativas,
          conteudo_gerado: null,
          progresso: 0
        })
        .eq("id", topico_id);
      
      await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
      return;
    }

    // ============================================
    // ETAPA 4: GERAR SÍNTESE FINAL COMPLETA (Resumo + Termos + Dicas + Tabela)
    // ============================================
    console.log(`[OAB Trilhas] ETAPA 4: Gerando síntese final completa...`);
    
    const promptSintese = `${promptBase}

═══ SUA TAREFA ═══
Com base em TODO o conteúdo gerado sobre "${topicoTitulo}", crie uma SÍNTESE FINAL COMPLETA para ser usada como revisão rápida.

Esta síntese deve incluir 4 partes obrigatórias:

1. **RESUMO EXPLICATIVO** (texto corrido, 150-200 palavras)
   - Faça um resumo do que foi aprendido de forma conversacional
   - Destaque o que é mais cobrado na OAB
   - Linguagem clara e objetiva

2. **TERMOS-CHAVE** (8-12 termos)
   - Lista dos termos mais importantes do tema
   - Cada termo com definição curta (máx 30 palavras)

3. **DICAS DE MEMORIZAÇÃO** (4-6 dicas)
   - Macetes para memorizar
   - Associações úteis
   - Pegadinhas comuns da banca

4. **TABELA COMPARATIVA** (quando aplicável)
   - Compare conceitos semelhantes ou opostos
   - Ex: "Prazo X vs Prazo Y", "Requisitos A vs B"
   - 2-4 linhas com 2-3 colunas

Retorne um JSON com esta estrutura EXATA:
{
  "resumo_texto": "Texto explicativo do resumo geral...",
  "termos_chave": [
    {"termo": "Termo 1", "definicao": "Definição curta"},
    {"termo": "Termo 2", "definicao": "Definição curta"}
  ],
  "dicas_memorizacao": [
    "Dica 1: macete ou associação",
    "Dica 2: pegadinha comum",
    "Dica 3: como lembrar"
  ],
  "tabela_comparativa": {
    "cabecalhos": ["Aspecto", "Conceito A", "Conceito B"],
    "linhas": [
      ["Característica 1", "Valor A1", "Valor B1"],
      ["Característica 2", "Valor A2", "Valor B2"]
    ]
  }
}

Retorne APENAS o JSON, sem texto adicional.`;

    let sinteseFinal: any = {
      resumo_texto: "",
      termos_chave: [],
      dicas_memorizacao: [],
      tabela_comparativa: null
    };
    
    try {
      const sintese = await gerarJSON(promptSintese, 3, 8192);
      sinteseFinal = {
        resumo_texto: sintese?.resumo_texto || "",
        termos_chave: Array.isArray(sintese?.termos_chave) ? sintese.termos_chave.slice(0, 12) : [],
        dicas_memorizacao: Array.isArray(sintese?.dicas_memorizacao) ? sintese.dicas_memorizacao.slice(0, 6) : [],
        tabela_comparativa: sintese?.tabela_comparativa || null
      };
      console.log(`[OAB Trilhas] ✓ Síntese final: ${sinteseFinal.termos_chave.length} termos, ${sinteseFinal.dicas_memorizacao.length} dicas`);
    } catch (err) {
      console.error(`[OAB Trilhas] ⚠️ Erro na síntese final (usando fallback):`, err);
      sinteseFinal.resumo_texto = `Você completou o estudo de ${topicoTitulo}. Revise os pontos principais antes de prosseguir para os flashcards.`;
    }

    // Criar slides de Síntese Final (múltiplos slides para organização)
    const slidesSinteseFinal: any[] = [];
    
    // Slide 1: Resumo explicativo
    slidesSinteseFinal.push({
      tipo: "texto",
      titulo: "📚 Resumo Geral",
      conteudo: sinteseFinal.resumo_texto || `Você completou o estudo de **${topicoTitulo}**!\n\nAgora vamos revisar os pontos principais para fixar o conteúdo.`
    });
    
    // Slide 2: Termos-chave (usando tipo termos)
    if (sinteseFinal.termos_chave && sinteseFinal.termos_chave.length > 0) {
      slidesSinteseFinal.push({
        tipo: "termos",
        titulo: "🔑 Termos-Chave para Memorizar",
        conteudo: "Estes são os termos que você DEVE dominar para a OAB:",
        termos: sinteseFinal.termos_chave.map((t: any) => ({
          termo: t.termo || t,
          definicao: t.definicao || ""
        }))
      });
    }
    
    // Slide 3: Dicas de memorização
    if (sinteseFinal.dicas_memorizacao && sinteseFinal.dicas_memorizacao.length > 0) {
      const dicasFormatadas = sinteseFinal.dicas_memorizacao
        .map((d: string, i: number) => `**${i + 1}.** ${d}`)
        .join('\n\n');
      
      slidesSinteseFinal.push({
        tipo: "dica",
        titulo: "💡 Dicas de Memorização",
        conteudo: dicasFormatadas
      });
    }
    
    // Slide 4: Tabela comparativa (se houver)
    if (sinteseFinal.tabela_comparativa && 
        sinteseFinal.tabela_comparativa.cabecalhos && 
        sinteseFinal.tabela_comparativa.linhas) {
      slidesSinteseFinal.push({
        tipo: "tabela",
        titulo: "📊 Comparativo Rápido",
        conteudo: "Uma visão lado a lado para facilitar sua revisão:",
        tabela: sinteseFinal.tabela_comparativa
      });
    }
    
    // Slide 5: Mensagem final de conclusão
    slidesSinteseFinal.push({
      tipo: "resumo",
      titulo: "✅ Síntese Final",
      conteudo: `Parabéns! Você completou o estudo de **${topicoTitulo}**.\n\nAgora é hora de testar seus conhecimentos com os flashcards!`,
      pontos: [
        "Revise os termos-chave sempre que precisar",
        "Use as dicas de memorização para fixar o conteúdo",
        "Consulte a tabela comparativa para revisar conceitos parecidos",
        "Pratique com flashcards para memorização ativa",
        "Faça as questões para simular a prova da OAB"
      ]
    });

    const secaoSinteseFinal = {
      id: secoesCompletas.length + 1,
      titulo: "Síntese Final",
      slides: slidesSinteseFinal
    };
    secoesCompletas.push(secaoSinteseFinal);

    // Montar estrutura final
    const conteudoFinal = {
      versao: 1,
      titulo: topicoTitulo,
      tempoEstimado: estrutura.tempoEstimado || "25 min",
      area: areaNome,
      objetivos: estrutura.objetivos || [],
      secoes: secoesCompletas,
      paginas: secoesCompletas.flatMap(s => s.slides || []).map((slide: any) => ({
        titulo: slide.titulo,
        tipo: slide.tipo,
        markdown: slide.conteudo
      }))
    };

    await updateProgress(90);

    // Validar correspondências
    let correspondenciasValidas = extras.correspondencias || [];
    correspondenciasValidas = correspondenciasValidas
      .filter((c: any) => c && c.termo && c.definicao)
      .slice(0, 10)
      .map((c: any) => ({
        termo: String(c.termo).trim().substring(0, 50),
        definicao: String(c.definicao).trim().substring(0, 80)
      }));

    // Guardar toda a gamificação em um único JSON (campo "termos" já existente na tabela)
    const termosComGamificacao = {
      glossario: extras.termos || [],
      correspondencias: correspondenciasValidas,
      ligar_termos: Array.isArray(extras.ligar_termos) ? extras.ligar_termos : [],
      explique_com_palavras: Array.isArray(extras.explique_com_palavras) ? extras.explique_com_palavras : [],
    };

    // Salvar no banco
    const { error: updateError } = await supabase
      .from("oab_trilhas_topicos")
      .update({
        conteudo_gerado: conteudoFinal,
        exemplos: extras.exemplos || [],
        termos: termosComGamificacao,
        flashcards: extras.flashcards || [],
        questoes: extras.questoes || [],
        status: "concluido",
        progresso: 100,
        tentativas: tentativasAtuais + 1,
        posicao_fila: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topico_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`[OAB Trilhas] ✅ Conteúdo salvo com sucesso: ${topicoTitulo}`);
    console.log(`[OAB Trilhas] Stats: ${totalPaginas} páginas, ${secoesCompletas.length} seções`);
    console.log(`[OAB Trilhas] Gamificação: corresp=${termosComGamificacao.correspondencias.length}, ligar=${termosComGamificacao.ligar_termos.length}, explicar=${termosComGamificacao.explique_com_palavras.length}`);

    await updateProgress(95);

    // Gerar capa do tópico
    console.log(`[OAB Trilhas] Gerando capa do tópico...`);
    try {
      await supabase.functions.invoke("gerar-capa-topico-oab", {
        body: { 
          topico_id,
          titulo: topicoTitulo,
          area: areaNome
        }
      });
      console.log(`[OAB Trilhas] ✓ Capa solicitada`);
    } catch (e) {
      console.log(`[OAB Trilhas] ⚠️ Capa não gerada (continuando sem):`, e);
    }

    // Processar próximo da fila
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

  } catch (error: any) {
    console.error("[OAB Trilhas] ❌ Erro no processamento background:", error);

    try {
      const { data: topicoAtual } = await supabase
        .from("oab_trilhas_topicos")
        .select("tentativas")
        .eq("id", topico_id)
        .single();

      const tentativas = (topicoAtual?.tentativas || 0) + 1;

      if (tentativas < MAX_TENTATIVAS) {
        const { data: maxPos } = await supabase
          .from("oab_trilhas_topicos")
          .select("posicao_fila")
          .eq("status", "na_fila")
          .order("posicao_fila", { ascending: false })
          .limit(1)
          .single();

        const novaPosicao = (maxPos?.posicao_fila || 0) + 1;

        await supabase
          .from("oab_trilhas_topicos")
          .update({ 
            status: "na_fila", 
            posicao_fila: novaPosicao,
            tentativas,
            progresso: 0,
            conteudo_gerado: null,
            updated_at: new Date().toISOString()
          })
          .eq("id", topico_id);

        console.log(`[OAB Fila] ♻️ Erro recuperável, recolocando na fila (tentativa ${tentativas}/${MAX_TENTATIVAS})`);
      } else {
        await supabase
          .from("oab_trilhas_topicos")
          .update({ status: "erro", tentativas, progresso: 0, updated_at: new Date().toISOString() })
          .eq("id", topico_id);

        console.log(`[OAB Fila] ❌ Erro após ${MAX_TENTATIVAS} tentativas`);
      }
      
      await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
    } catch (catchErr) {
      console.error("[OAB Trilhas] Erro ao processar retry:", catchErr);
    }
  }
}

// Função auxiliar para processar próximo item da fila
async function processarProximoDaFila(supabase: any, supabaseUrl: string, supabaseServiceKey: string) {
  const MAX_CONCURRENT = 5;
  try {
    // Contar quantos estão gerando
    const { data: ativos } = await supabase
      .from("oab_trilhas_topicos")
      .select("id")
      .eq("status", "gerando");

    const ativosCount = ativos?.length || 0;
    const slotsDisponiveis = MAX_CONCURRENT - ativosCount;

    if (slotsDisponiveis <= 0) {
      console.log(`[OAB Fila] ${ativosCount} ativos, sem slots`);
      return;
    }

    const { data: proximos } = await supabase
      .from("oab_trilhas_topicos")
      .select("id, titulo")
      .eq("status", "na_fila")
      .order("posicao_fila", { ascending: true })
      .limit(slotsDisponiveis);

    if (!proximos || proximos.length === 0) {
      console.log("[OAB Fila] Fila vazia");
      return;
    }

    console.log(`[OAB Fila] Disparando ${proximos.length} próximos (${ativosCount} ativos)`);

    for (const proximo of proximos) {
      fetch(`${supabaseUrl}/functions/v1/gerar-conteudo-oab-trilhas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ topico_id: proximo.id }),
      }).catch(err => console.error("[OAB Fila] Erro:", err));
    }
  } catch (err) {
    console.error("[OAB Fila] Erro ao buscar próximo da fila:", err);
  }
}

// ============================================
// FUNÇÃO DE PROCESSAMENTO EM BACKGROUND PARA RESUMO (Subtema)
// ============================================
async function processarGeracaoResumoBackground(
  supabase: any, 
  resumo_id: number,
  resumo: any
) {
  try {
    const areaNome = resumo.area || "";
    const subtema = resumo.subtema || "";
    const conteudoFonte = resumo.conteudo || "";

    console.log(`[OAB Resumo] ══════════════════════════════════════════`);
    console.log(`[OAB Resumo] 🚀 Gerando conteúdo para subtema: ${subtema}`);
    console.log(`[OAB Resumo] 📦 VERSÃO: ${VERSION}`);
    console.log(`[OAB Resumo] ══════════════════════════════════════════`);

    if (!conteudoFonte || conteudoFonte.trim().length < 50) {
      console.log(`[OAB Resumo] ⚠️ Conteúdo fonte muito curto ou vazio`);
      await supabase
        .from("RESUMO")
        .update({
          conteudo_gerado: JSON.stringify({
            erro: true,
            mensagem: "Conteúdo fonte não disponível",
            detalhe: "O texto extraído do PDF para este subtema está vazio ou muito curto."
          })
        })
        .eq("id", resumo_id);
      return;
    }

    // Configurar Gemini
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
    ].filter(Boolean);

    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Funções auxiliares (reutilizáveis)
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
      
      let braceCount = 0;
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      let lastValidIndex = 0;
      
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
      
      if (braceCount === 0 && bracketCount === 0) {
        return repaired.substring(0, lastValidIndex + 1);
      }
      
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
          if (attempt > 0) {
            console.log(`[OAB Resumo] Retry ${attempt}/${maxRetries}...`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
          
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5 },
          });
          
          let text = result.response.text();
          const sanitized = sanitizeJsonString(text);
          const repaired = repairJson(sanitized);
          
          try {
            return JSON.parse(repaired);
          } catch {
            const fixed = repaired
              .replace(/,\s*([}\]])/g, "$1")
              .replace(/([{,])\s*}/g, "$1}")
              .replace(/\[\s*,/g, "[")
              .replace(/,\s*,/g, ",");
            return JSON.parse(fixed);
          }
        } catch (err) {
          lastError = err;
          console.error(`[OAB Resumo] Tentativa ${attempt + 1} falhou:`, err);
        }
      }
      
      throw lastError;
    }

    // Prompt base para subtema (mesmo estilo café)
    const promptBase = `Você é um professor experiente explicando Direito para uma pessoa LEIGA.
Seu estilo é como uma CONVERSA DE CAFÉ - descontraído, acolhedor e didático.

═══ PÚBLICO-ALVO ═══
Pessoas que NUNCA estudaram o tema. Assuma ZERO conhecimento prévio.

═══ TOM DE VOZ ═══
- Descontraído, claro e acolhedor
- Use expressões naturais: "Percebeu?", "Faz sentido, né?", "Na prática...", "Veja bem...", "Note que..."
- Perguntas guiadas: "E por que isso importa?", "Percebeu a diferença?"
- Seguro e correto tecnicamente
- NUNCA infantilizado ou condescendente

═══ ESTRUTURA DIDÁTICA OBRIGATÓRIA ═══

1. **SIMPLES PRIMEIRO → TÉCNICO DEPOIS (REGRA DE OURO)**
   ❌ ERRADO: "A jurisdição voluntária caracteriza-se por..."
   ✅ CERTO: "Sabe quando duas pessoas concordam com tudo, mas ainda precisam do juiz para oficializar? Isso é o que o Direito chama de 'jurisdição voluntária'."

2. **TRADUÇÃO IMEDIATA de termos técnicos e latim:**
   - "O 'pacta sunt servanda' (significa 'os pactos devem ser cumpridos')"
   - "Isso é o que chamamos de 'trânsito em julgado' (quando não dá mais para recorrer)"

3. **ANALOGIAS DO COTIDIANO**

═══ CUIDADOS ═══
- NÃO use emojis no texto corrido (a interface já adiciona ícones)
- NÃO mencione "PDF", "material", "documento"
- Slides tipo "caso" JÁ SÃO exemplo prático

═══ GRIFO E ÊNFASE (OBRIGATÓRIO) ═══
Para destacar termos-chave, use NEGRITO + ASPAS SIMPLES:

• TERMOS TÉCNICOS CRÍTICOS: **'competência absoluta'**, **'litispendência'**
• IDADES: **'16 anos'**, **'18 anos'**, **'35 anos de idade'**
• LEIS E ARTIGOS: **'Art. 5º da CF'**, **'Lei 9.504/97'**
• PRAZOS: **'30 dias'**, **'prazo de 15 dias'**
• VALORES: **'R$ 5.000'**, **'10 salários mínimos'**
• PORCENTAGENS: **'50%'**, **'10,5%'**
• DATAS: **'15 de agosto'**, **'1º de janeiro'**

EXEMPLO:
❌ ERRADO: "O prazo é de 30 dias para interpor recurso."
✅ CERTO: "O prazo é de **'30 dias'** para interpor recurso."

═══ CITAÇÕES DE ARTIGOS (OBRIGATÓRIO) ═══
Sempre que citar um artigo de lei, use BLOCKQUOTE do Markdown:

FORMATO:
> "Art. 5º - Todos são iguais perante a lei..." (CF/88)

EXEMPLOS:
✅ CERTO:
> "Art. 14, § 1º - O alistamento eleitoral e o voto são obrigatórios..." (CF/88)

❌ ERRADO: Citar o artigo apenas no texto corrido sem destaque.

**Área:** ${areaNome}
**Subtema:** ${subtema}

═══ CONTEÚDO FONTE ═══
${conteudoFonte.substring(0, 15000)}
═══════════════════════`;

    // ETAPA 1: Gerar estrutura
    console.log(`[OAB Resumo] ETAPA 1: Gerando estrutura...`);
    
    const promptEstrutura = `${promptBase}

═══ SUA TAREFA ═══
Crie APENAS a ESTRUTURA/ESQUELETO do conteúdo interativo para este subtema.

Retorne um JSON com esta estrutura:
{
  "titulo": "${subtema}",
  "tempoEstimado": "15 min",
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

REGRAS OBRIGATÓRIAS:
1. Gere entre 6-8 seções (OBRIGATÓRIO para alcançar 40-55 páginas totais)
2. Cada seção DEVE ter 6-9 páginas - NUNCA menos que 6
3. MÍNIMO TOTAL: 40 páginas - se tiver menos, adicione mais conteúdo detalhado
4. TIPOS: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck, correspondencias
5. INCLUA exatamente 1 slide "correspondencias" NA SEÇÃO DO MEIO (entre páginas 25-30) - gamificação
6. A introdução DEVE começar com "☕ Prepare seu café..." e listar os tópicos que serão abordados
7. MANTENHA o título original: "${subtema}" (não altere)
8. Cubra TODO o conteúdo fonte com explicações BEM DETALHADAS e termos jurídicos explicados INLINE
9. INCLUA pelo menos 2-3 slides tipo "tabela" no total (comparativos)
10. Cada seção DEVE ter pelo menos 1 quickcheck para testar o aprendizado

DISTRIBUIÇÃO MÍNIMA OBRIGATÓRIA:
- "introducao": 1 slide (APENAS na primeira seção)
- "texto": 15-20 slides (conteúdo principal detalhado)
- "atencao": 4-5 slides com "⚠️ ISSO CAI MUITO NA PROVA!" ou "CUIDADO: Pegadinha clássica!"
- "dica": 3-4 slides com técnicas de memorização e macetes
- "caso": 4-5 slides com exemplos práticos do cotidiano
- "tabela": 2-3 slides comparativos
- "quickcheck": 5-6 slides (pelo menos 1 por seção)
- "correspondencias": 1 slide no meio (entre páginas 25-30)

11. NUNCA repita o slide "introducao" após a primeira seção - vá direto ao conteúdo
12. INCLUA frases de destaque nos slides "atencao": "⚠️ ISSO CAI MUITO NA PROVA!"

⚠️ MUITO IMPORTANTE: O mínimo é 40 páginas! Se o conteúdo parecer curto, expanda com mais detalhes, exemplos práticos e explicações adicionais.

Retorne APENAS o JSON.`;

    let estrutura: any = null;
    let tentativasEstrutura = 0;
    const MAX_TENTATIVAS_ESTRUTURA = 3;
    
    while (tentativasEstrutura < MAX_TENTATIVAS_ESTRUTURA) {
      tentativasEstrutura++;
      try {
        estrutura = await gerarJSON(promptEstrutura);
        
        if (!estrutura?.secoes || !Array.isArray(estrutura.secoes) || estrutura.secoes.length < 4) {
          throw new Error("Estrutura inválida: menos de 4 seções");
        }
        
        // Validar mínimo de páginas
        const totalPaginasEstrutura = estrutura.secoes.reduce(
          (acc: number, s: any) => acc + (s.paginas?.length || 0), 0
        );
        
        console.log(`[OAB Resumo] Estrutura tentativa ${tentativasEstrutura}: ${estrutura.secoes.length} seções, ${totalPaginasEstrutura} páginas`);
        
        // Se tiver menos de 40 páginas, tentar novamente
        if (totalPaginasEstrutura < MIN_PAGINAS) {
          console.log(`[OAB Resumo] ⚠️ Apenas ${totalPaginasEstrutura} páginas (mínimo: ${MIN_PAGINAS}). Tentando novamente...`);
          if (tentativasEstrutura < MAX_TENTATIVAS_ESTRUTURA) {
            continue; // Tentar novamente
          } else {
            console.log(`[OAB Resumo] ⚠️ Após ${MAX_TENTATIVAS_ESTRUTURA} tentativas, prosseguindo com ${totalPaginasEstrutura} páginas`);
          }
        }
        
        console.log(`[OAB Resumo] ✓ Estrutura válida: ${estrutura.secoes.length} seções, ${totalPaginasEstrutura} páginas`);
        break; // Estrutura válida, sair do loop
        
      } catch (err) {
        console.error(`[OAB Resumo] ❌ Erro na estrutura (tentativa ${tentativasEstrutura}):`, err);
        if (tentativasEstrutura >= MAX_TENTATIVAS_ESTRUTURA) {
          throw new Error(`Falha ao gerar estrutura após ${MAX_TENTATIVAS_ESTRUTURA} tentativas: ${err}`);
        }
      }
    }

    // ETAPA 2: Gerar conteúdo por seção
    console.log(`[OAB Resumo] ETAPA 2: Gerando conteúdo por seção...`);
    
    const secoesCompletas: any[] = [];
    const totalSecoes = estrutura.secoes.length;

    for (let i = 0; i < totalSecoes; i++) {
      const secaoEstrutura = estrutura.secoes[i];
      console.log(`[OAB Resumo] Gerando seção ${i + 1}/${totalSecoes}: ${secaoEstrutura.titulo}`);

      const promptSecao = `${promptBase}

═══ SUA TAREFA ═══
Gere o CONTEÚDO COMPLETO para a SEÇÃO ${i + 1}:
Título: "${secaoEstrutura.titulo}"

PÁGINAS A GERAR:
${JSON.stringify(secaoEstrutura.paginas, null, 2)}

Para CADA página, retorne:

1. tipo "introducao" (APENAS NA PRIMEIRA SEÇÃO - ENGAJAMENTO OBRIGATÓRIO):
   {"tipo": "introducao", "titulo": "${subtema}", "conteudo": "☕ Prepare seu café, pois vamos mergulhar juntos em um tema muito importante para a OAB!\n\nNesta aula sobre **${subtema}**, vamos estudar de forma clara e prática. Ao final, você vai dominar:\n\n• **Conceito principal**: O que é e para que serve\n• **Requisitos legais**: O que a lei exige\n• **Casos práticos**: Como aplicar na prova\n• **Pegadinhas**: O que a banca adora cobrar\n• **Dicas de memorização**: Macetes para não esquecer\n\nVamos juntos? Bora começar!"}
   ⚠️ ATENÇÃO: O slide "introducao" SÓ aparece na PRIMEIRA seção. Nas demais, vá direto ao conteúdo.

2. tipo "texto" (MÍNIMO 300-400 PALAVRAS - BEM DETALHADO):
   {"tipo": "texto", "titulo": "...", "conteudo": "Explicação conversacional MUITO DETALHADA. Use **'negrito + aspas'** para termos-chave: A **'competência absoluta'** (ou seja, regras que não podem ser mudadas) determina...\n\nQuando citar artigos, use blockquote:\n\n> \"Art. XX - Texto do artigo...\" (Lei X)\n\nUse hierarquia clara e conexões entre slides."}

3. tipo "quickcheck" (FORMATO OBRIGATÓRIO - UMA PERGUNTA POR SLIDE):
   {"tipo": "quickcheck", "titulo": "Verificação Rápida", "conteudo": "Vamos testar se ficou claro:", "pergunta": "Qual é o prazo para interposição de recurso?", "opcoes": ["A) 5 dias", "B) 10 dias", "C) 15 dias", "D) 30 dias"], "resposta": 2, "feedback": "Correto! O prazo é de **'15 dias'** porque..."}
   ⚠️ ATENÇÃO: Use "pergunta" (singular), NÃO "perguntas" (plural).

4. tipo "correspondencias" (GAMIFICAÇÃO - COLOCAR NO MEIO):
   {"tipo": "correspondencias", "titulo": "Vamos praticar?", "conteudo": "Conecte cada termo à sua definição:", "correspondencias": [
     {"termo": "Termo 1", "definicao": "Definição curta 1"},
     {"termo": "Termo 2", "definicao": "Definição curta 2"},
     {"termo": "Termo 3", "definicao": "Definição curta 3"},
     {"termo": "Termo 4", "definicao": "Definição curta 4"}
   ]}

5. tipo "atencao" (ALERTA IMPORTANTE - COM INDICADOR DE PROVA):
   {"tipo": "atencao", "titulo": "⚠️ ISSO CAI MUITO NA PROVA!", "conteudo": "**Atenção redobrada aqui!**\n\nA banca ADORA cobrar esse ponto. Veja:\n\n> \"Art. XX - [texto do artigo]\" (Lei X)\n\nMuita gente confunde [conceito A] com [conceito B], mas a diferença é crucial:\n\n• **'Conceito A'**: significa X\n• **'Conceito B'**: significa Y\n\n💡 **Dica para não errar**: [macete de memorização]."}

6. tipo "dica" (TÉCNICA DE MEMORIZAÇÃO):
   {"tipo": "dica", "titulo": "💡 Macete para Memorizar", "conteudo": "**Técnica de Memorização:**\n\nPara lembrar de **'[termo técnico]'**, use esta associação:\n\n📌 **Mnemônico**: [frase ou acrônimo]\n\n**Por que funciona?**\nQuando você [explicação simples]...\n\n✅ **Teste agora**: Feche os olhos e repita o mnemônico 3 vezes!"}

7. tipo "caso" (EXEMPLO PRÁTICO DO COTIDIANO):
   {"tipo": "caso", "titulo": "📋 Na Prática: Caso de [Contexto]", "conteudo": "**Situação Real:**\n\nImagine que João está enfrentando [problema concreto]...\n\n**Análise Jurídica:**\n\nAqui, aplica-se o **'[termo jurídico]'** (ou seja, [explicação simples]). Conforme:\n\n> \"Art. XX - [citação]\" ([Lei])\n\n**Conclusão Prática:**\n\nJoão [resultado/solução]. Na prova, sempre que aparecer [situação similar], pense em [conceito-chave]."}

8. outros tipos: termos, resumo

RETORNE um JSON:
{
  "id": ${secaoEstrutura.id},
  "titulo": "${secaoEstrutura.titulo}",
  "slides": [...]
}

REGRAS CRÍTICAS:
- Use TOM CONVERSACIONAL: "Percebeu?", "Faz sentido, né?", "Veja bem...", "Note que..."
- EXPLICAÇÃO INLINE: Todo termo jurídico deve ser explicado entre parênteses
- Use HIERARQUIA clara: conceito → detalhes → aplicação
- Se esta seção está no MEIO, inclua o slide "correspondencias"
- USE BLOCKQUOTE (>) para citações de artigos de lei
- USE **'negrito + aspas'** para termos-chave, prazos, valores e datas
- ESTA SEÇÃO ${i === 0 ? 'É a primeira - INCLUA slide introducao' : 'NÃO é a primeira - NÃO inclua slide introducao, vá direto ao conteúdo'}`;

      try {
        const secaoGerada = await gerarJSON(promptSecao, 2, 8192);
        
        if (secaoGerada?.slides && Array.isArray(secaoGerada.slides)) {
          // Remover slides "introducao" de seções que não são a primeira
          let slidesProcessados = secaoGerada.slides;
          if (i > 0) {
            slidesProcessados = slidesProcessados.filter(
              (slide: any) => slide.tipo !== 'introducao'
            );
          }
          
          // Normalizar slides quickcheck (caso Gemini gere "perguntas" plural)
          const slidesNormalizados = slidesProcessados.map((slide: any) => {
            if (slide.tipo === 'quickcheck' && !slide.pergunta && slide.perguntas && Array.isArray(slide.perguntas) && slide.perguntas.length > 0) {
              const primeiraQuestao = slide.perguntas[0];
              return {
                ...slide,
                pergunta: primeiraQuestao.texto || primeiraQuestao.pergunta || '',
                opcoes: primeiraQuestao.opcoes || [],
                resposta: primeiraQuestao.respostaCorreta ?? primeiraQuestao.resposta ?? 0,
                feedback: primeiraQuestao.feedback || '',
                perguntas: undefined // Remove o campo plural
              };
            }
            return slide;
          });
          
          secoesCompletas.push({
            id: secaoEstrutura.id,
            titulo: secaoEstrutura.titulo,
            slides: slidesNormalizados
          });
          console.log(`[OAB Resumo] ✓ Seção ${i + 1}: ${slidesNormalizados.length} slides`);
        }
      } catch (err) {
        console.error(`[OAB Resumo] ⚠️ Erro na seção ${i + 1}:`, err);
      }
    }

    // Adicionar slide de Síntese Final
    const slideSinteseFinal = {
      tipo: "resumo",
      titulo: "Síntese Final",
      conteudo: `Parabéns! Você completou o estudo de **${subtema}**.`,
      pontos: secoesCompletas.flatMap(s => 
        (s.slides || []).slice(0, 2).map((slide: any) => slide.titulo || "")
      ).filter(Boolean).slice(0, 8)
    };

    secoesCompletas.push({
      id: secoesCompletas.length + 1,
      titulo: "Síntese Final",
      slides: [slideSinteseFinal]
    });

    // ============================================
    // ETAPA 3: GERAR FLASHCARDS E QUESTÕES (NOVO!)
    // ============================================
    console.log(`[OAB Resumo] ETAPA 3: Gerando flashcards e questões...`);
    
    const promptFlashQuestoesResumo = `${promptBase}

═══ SUA TAREFA ═══
Gere FLASHCARDS e QUESTÕES estilo OAB sobre "${subtema}".

Retorne JSON com EXATAMENTE esta estrutura:
{
  "flashcards": [
    {"frente": "Pergunta direta sobre conceito-chave", "verso": "Resposta clara e objetiva", "exemplo": "Exemplo prático do cotidiano jurídico"}
  ],
  "questoes": [
    {"pergunta": "Enunciado completo da questão estilo OAB", "alternativas": ["A) Alternativa A", "B) Alternativa B", "C) Alternativa C", "D) Alternativa D"], "correta": 0, "explicacao": "Explicação detalhada de por que a alternativa correta está certa e as outras estão erradas"}
  ]
}

QUANTIDADES EXATAS (OBRIGATÓRIO):
- flashcards: EXATAMENTE 22 cards (entre 20 e 25)
- questoes: EXATAMENTE 17 questões estilo OAB (entre 15 e 20)

REGRAS PARA FLASHCARDS:
- Frente: Pergunta direta e objetiva sobre conceito do tema
- Verso: Resposta clara, não muito longa (máx 100 palavras)
- Exemplo: Situação prática que ilustra o conceito

REGRAS PARA QUESTÕES:
- Enunciado claro e contextualizado (estilo OAB real)
- 4 alternativas plausíveis (A, B, C, D)
- Explicação que justifique a correta E refute as incorretas
- Variar os temas cobertos no conteúdo

Retorne APENAS o JSON, nada mais.`;

    let flashcards: any[] = [];
    let questoes: any[] = [];
    
    try {
      const flashQuestoes = await gerarJSON(promptFlashQuestoesResumo, 2, 8192);
      flashcards = Array.isArray(flashQuestoes?.flashcards) ? flashQuestoes.flashcards : [];
      questoes = Array.isArray(flashQuestoes?.questoes) ? flashQuestoes.questoes : [];
      console.log(`[OAB Resumo] ✓ Gerados: ${flashcards.length} flashcards, ${questoes.length} questões`);
    } catch (err) {
      console.error(`[OAB Resumo] ⚠️ Erro ao gerar flashcards/questões:`, err);
    }

    // Montar estrutura final
    const totalPaginas = secoesCompletas.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
    
    const slidesJson = {
      versao: 2,
      titulo: subtema,
      tempoEstimado: estrutura.tempoEstimado || "15 min",
      area: areaNome,
      objetivos: estrutura.objetivos || [],
      secoes: secoesCompletas,
      flashcards: flashcards,
      questoes: questoes
    };

    const conteudoGerado = {
      secoes: secoesCompletas,
      objetivos: estrutura.objetivos || [],
      flashcards: flashcards,
      questoes: questoes,
      paginas: secoesCompletas.flatMap(s => s.slides || []).map((slide: any) => ({
        titulo: slide.titulo,
        tipo: slide.tipo,
        markdown: slide.conteudo
      }))
    };

    // Salvar no banco (flashcards e questoes já estão dentro de slides_json e conteudo_gerado)
    const { error: updateError } = await supabase
      .from("RESUMO")
      .update({
        slides_json: slidesJson,
        conteudo_gerado: conteudoGerado
      })
      .eq("id", resumo_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`[OAB Resumo] ✅ Conteúdo salvo com sucesso: ${subtema}`);
    console.log(`[OAB Resumo] Stats: ${totalPaginas} slides, ${secoesCompletas.length} seções, ${flashcards.length} flashcards, ${questoes.length} questões`);

  } catch (error: any) {
    console.error("[OAB Resumo] ❌ Erro no processamento:", error);

    try {
      await supabase
        .from("RESUMO")
        .update({
          conteudo_gerado: JSON.stringify({
            erro: true,
            mensagem: "Erro ao gerar conteúdo",
            detalhe: error.message || "Erro desconhecido"
          })
        })
        .eq("id", resumo_id);
    } catch (catchErr) {
      console.error("[OAB Resumo] Erro ao salvar erro:", catchErr);
    }
  }
}
