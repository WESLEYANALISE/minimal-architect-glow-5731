import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

const API_KEYS = getRotatedKeyStrings();

async function transcreverVideo(videoId: string, prompt: string): Promise<string> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let lastError: Error | null = null;

  for (const apiKey of API_KEYS) {
    try {
      console.log(`Tentando transcrever ${videoId}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { fileData: { mimeType: "video/mp4", fileUri: youtubeUrl } },
                { text: prompt }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          console.log("Chave sem permissão, tentando próxima...");
          continue;
        }
        if (response.status === 429) {
          throw new Error("RATE_LIMIT");
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const transcricao = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!transcricao) throw new Error("Resposta vazia");
      
      return transcricao;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (lastError.message === "RATE_LIMIT") throw lastError;
      continue;
    }
  }

  throw lastError || new Error("Todas as chaves falharam");
}

async function processarEmBackground(supabase: any, limite: number) {
  const prompt = `Você é um transcritor profissional especializado em conteúdo jurídico brasileiro.
Transcreva TODO o áudio deste vídeo do YouTube de forma precisa e completa.
Instruções:
1. Transcreva cada fala com precisão
2. Identifique os oradores quando possível (ex: "Ministro:", "Advogado:")
3. Inclua timestamps aproximados [MM:SS]
4. Mantenha termos técnicos jurídicos exatos
5. Use formatação em Markdown
Transcreva o vídeo completo agora:`;

  // Buscar documentários sem transcrição
  const { data: docs, error } = await supabase
    .from("documentarios_juridicos")
    .select("id, video_id, titulo")
    .is("transcricao_texto", null)
    .limit(limite);

  if (error) {
    console.error("Erro ao buscar documentários:", error);
    return { processados: 0, erros: 0 };
  }

  if (!docs || docs.length === 0) {
    console.log("Nenhum documentário pendente");
    return { processados: 0, erros: 0 };
  }

  console.log(`Iniciando processamento de ${docs.length} documentários em background...`);

  let processados = 0;
  let erros = 0;

  for (const doc of docs) {
    try {
      console.log(`[${processados + erros + 1}/${docs.length}] Transcrevendo: ${doc.titulo}`);
      
      const transcricao = await transcreverVideo(doc.video_id, prompt);
      
      const { error: updateError } = await supabase
        .from("documentarios_juridicos")
        .update({
          transcricao_texto: transcricao,
          updated_at: new Date().toISOString()
        })
        .eq("id", doc.id);

      if (updateError) {
        console.error(`Erro ao salvar: ${doc.titulo}`, updateError);
        erros++;
      } else {
        console.log(`✅ Concluído: ${doc.titulo} (${transcricao.length} chars)`);
        processados++;
      }

      // Delay de 5s entre transcrições para evitar rate limit
      await new Promise(r => setTimeout(r, 5000));

    } catch (error: any) {
      console.error(`❌ Erro em ${doc.titulo}:`, error.message);
      erros++;
      
      if (error.message === "RATE_LIMIT") {
        console.log("⏳ Rate limit, aguardando 60s...");
        await new Promise(r => setTimeout(r, 60000));
      }
    }
  }

  console.log(`✅ Background finalizado: ${processados} sucesso, ${erros} erros`);
  return { processados, erros };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limite = 50 } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar quantos pendentes existem
    const { count } = await supabase
      .from("documentarios_juridicos")
      .select("id", { count: "exact", head: true })
      .is("transcricao_texto", null);

    console.log(`📋 ${count} documentários pendentes de transcrição`);

    // Iniciar processamento em background (sem await)
    processarEmBackground(supabase, limite).catch(e => 
      console.error("Erro no background:", e)
    );

    // Retornar imediatamente
    return new Response(
      JSON.stringify({ 
        message: `Processamento iniciado em background para até ${limite} vídeos`,
        pendentes: count,
        status: "processing"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
