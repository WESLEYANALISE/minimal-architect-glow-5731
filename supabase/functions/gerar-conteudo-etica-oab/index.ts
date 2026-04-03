 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
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
     const { tema_id, topico_id, force_regenerate } = body;
     
     // Aceitar tema_id (novo) ou topico_id (legado)
     const targetId = tema_id || topico_id;
     const isTemaDireto = !!tema_id;
     
     if (!targetId) {
       return new Response(
         JSON.stringify({ error: "tema_id ou topico_id é obrigatório" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
     
     // Buscar dados do tema
     const tableName = isTemaDireto ? "oab_etica_temas" : "oab_etica_topicos";
     const { data: tema, error: temaError } = await supabase
       .from(tableName)
       .select("*")
       .eq("id", targetId)
       .single();
 
     if (temaError || !tema) {
       console.error("Erro ao buscar tema:", temaError);
       return new Response(
         JSON.stringify({ error: "Tema não encontrado" }),
         { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Verificar se já tem conteúdo
     if (tema.conteudo_markdown && !force_regenerate) {
       console.log(`Tema ${targetId} já tem conteúdo, retornando`);
       return new Response(
         JSON.stringify({ success: true, already_generated: true }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Atualizar status para gerando
     await supabase
       .from(tableName)
       .update({ status: "gerando" })
       .eq("id", targetId);
 
     // Processar em background
     EdgeRuntime.waitUntil(processarGeracaoBackground(
       supabase, 
       targetId, 
       tema,
       tableName
     ));
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         status: "gerando",
         background: true,
         message: "Geração iniciada em background.",
         tema_id: targetId,
         titulo: tema.titulo
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
 
   } catch (error) {
     console.error("Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
     return new Response(
      JSON.stringify({ error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });
 
 async function processarGeracaoBackground(
   supabase: any,
   temaId: number,
   tema: any,
   tableName: string
 ) {
   const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
   if (!geminiApiKey) {
     console.error("GEMINI_API_KEY não configurada");
     await supabase.from(tableName).update({ status: "erro" }).eq("id", temaId);
     return;
   }
 
   try {
     console.log(`\n[Ética OAB] 🚀 Iniciando geração para: "${tema.titulo}"`);
     
     const genAI = new GoogleGenerativeAI(geminiApiKey);
     const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
 
     // Prompt para gerar conteúdo didático
     const prompt = `Você é uma professora de Direito especializada em Ética Profissional para o Exame de Ordem (OAB).
 
 Crie um conteúdo didático completo sobre o tema: "${tema.titulo}"
 
 ${tema.subtopicos ? `Subtópicos a abordar: ${JSON.stringify(tema.subtopicos)}` : ''}
 
 O conteúdo deve:
 1. Ser escrito de forma clara e didática, como uma aula
 2. Incluir exemplos práticos quando possível
 3. Destacar pontos importantes para a prova da OAB
 4. Usar formatação Markdown (##, ###, **negrito**, listas)
 5. Ter entre 800 e 1500 palavras
 6. Incluir dicas de memorização quando aplicável
 
 Responda APENAS com o conteúdo em Markdown, sem introduções ou conclusões genéricas.`;
 
     const result = await model.generateContent(prompt);
     const conteudo = result.response.text();
 
     console.log(`[Ética OAB] ✅ Conteúdo gerado (${conteudo.length} caracteres)`);
 
     // Gerar flashcards
     const flashcardsPrompt = `Baseado no tema "${tema.titulo}" de Ética Profissional da OAB, crie 5 flashcards para revisão.
 
 Responda em JSON no formato:
 [
   { "frente": "Pergunta", "verso": "Resposta concisa" }
 ]
 
 Apenas o JSON, sem texto adicional.`;
 
     const flashcardsResult = await model.generateContent(flashcardsPrompt);
     let flashcards = [];
     try {
       const flashcardsText = flashcardsResult.response.text()
         .replace(/```json\n?/g, '')
         .replace(/```\n?/g, '')
         .trim();
       flashcards = JSON.parse(flashcardsText);
     } catch (e) {
       console.log(`[Ética OAB] ⚠️ Erro ao parsear flashcards`);
     }
 
     // Gerar questões
     const questoesPrompt = `Baseado no tema "${tema.titulo}" de Ética Profissional da OAB, crie 3 questões de múltipla escolha no estilo OAB.
 
 Responda em JSON no formato:
 [
   {
     "pergunta": "Enunciado da questão",
     "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."],
     "correta": 0,
     "explicacao": "Explicação da resposta correta"
   }
 ]
 
 Apenas o JSON, sem texto adicional.`;
 
     const questoesResult = await model.generateContent(questoesPrompt);
     let questoes = [];
     try {
       const questoesText = questoesResult.response.text()
         .replace(/```json\n?/g, '')
         .replace(/```\n?/g, '')
         .trim();
       questoes = JSON.parse(questoesText);
     } catch (e) {
       console.log(`[Ética OAB] ⚠️ Erro ao parsear questões`);
     }
 
     // Atualizar banco de dados
     const { error: updateError } = await supabase
       .from(tableName)
       .update({
         conteudo_markdown: conteudo,
         flashcards: flashcards,
         questoes: questoes,
         status: "concluido",
         updated_at: new Date().toISOString()
       })
       .eq("id", temaId);
 
     if (updateError) {
       console.error(`[Ética OAB] ❌ Erro ao atualizar:`, updateError);
       await supabase.from(tableName).update({ status: "erro" }).eq("id", temaId);
     } else {
       console.log(`[Ética OAB] ✅ Tema ${temaId} concluído com sucesso!`);
     }
 
   } catch (error) {
     console.error(`[Ética OAB] ❌ Erro na geração:`, error);
     await supabase.from(tableName).update({ status: "erro" }).eq("id", temaId);
   }
 }