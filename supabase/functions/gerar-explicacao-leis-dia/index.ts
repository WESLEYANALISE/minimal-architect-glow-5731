import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
].filter(Boolean) as string[];

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function callGemini(prompt: string, systemPrompt: string): Promise<string> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  
  for (const model of models) {
    for (let i = 0; i < GEMINI_KEYS.length; i++) {
      const key = GEMINI_KEYS[i];
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 8000 },
            }),
          }
        );
        if (!res.ok) continue;
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch {
        continue;
      }
    }
  }
  throw new Error("Todas as chaves Gemini falharam");
}

async function gerarCapaGemini(titulo: string, resumoLeis: string): Promise<string | null> {
  // Usar Gemini image generation
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = GEMINI_KEYS[i];
    try {
      const prompt = `Create a cinematic, photorealistic cover image (16:9) representing Brazilian law concept: "${titulo}". 
Scene: A dramatic real-life Brazilian scene (office, courthouse, street) with ethereal golden legal symbols (scales of justice, gavels, contracts) floating above. 
Style: Dramatic lighting, warm golden tones, silhouette or profile figures (no direct faces). 
NO text, NO cartoon, NO 3D. Pure cinematic photography style.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
              responseMimeType: "text/plain",
            },
          }),
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));
      
      if (imagePart?.inlineData?.data) {
        // Upload to storage
        const sb = getSupabase();
        const bytes = Uint8Array.from(atob(imagePart.inlineData.data), c => c.charCodeAt(0));
        const fileName = `explicacao-leis-dia/capa-${Date.now()}.png`;
        
        const { error: uploadError } = await sb.storage
          .from("explicacao-capas")
          .upload(fileName, bytes, { contentType: "image/png", upsert: true });
        
        if (uploadError) {
          // Try creating bucket first
          await sb.storage.createBucket("explicacao-capas", { public: true });
          await sb.storage
            .from("explicacao-capas")
            .upload(fileName, bytes, { contentType: "image/png", upsert: true });
        }
        
        const { data: urlData } = sb.storage.from("explicacao-capas").getPublicUrl(fileName);
        return urlData?.publicUrl || null;
      }
    } catch (e) {
      console.error(`[Capa] Erro com chave ${i}:`, e);
      continue;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data: dataParam } = await req.json().catch(() => ({ data: null }));
    const targetDate = dataParam || new Date().toISOString().split("T")[0];
    
    console.log(`[ExplicacaoLeisDia] Gerando para data: ${targetDate}`);
    
    const sb = getSupabase();

    // Verificar se já existe para esta data
    const { data: existing } = await sb
      .from("explicacao_leis_dia")
      .select("id, status")
      .eq("data", targetDate)
      .maybeSingle();

    if (existing?.status === "concluido") {
      return new Response(JSON.stringify({ ok: true, message: "Já existe explicação para esta data", id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar leis da resenha diária para esta data
    const { data: leis, error: leisError } = await sb
      .from("resenha_diaria")
      .select("id, numero_lei, ementa, texto_formatado, data_publicacao, areas_direito")
      .gte("data_publicacao", targetDate)
      .lte("data_publicacao", targetDate + "T23:59:59")
      .order("ordem_dou");

    if (leisError || !leis || leis.length === 0) {
      // Tentar buscar pelo created_at se data_publicacao não funcionar
      const { data: leisAlt } = await sb
        .from("resenha_diaria")
        .select("id, numero_lei, ementa, texto_formatado, data_publicacao, areas_direito")
        .gte("created_at", targetDate + "T00:00:00")
        .lte("created_at", targetDate + "T23:59:59")
        .order("created_at");

      if (!leisAlt || leisAlt.length === 0) {
        return new Response(JSON.stringify({ ok: false, message: "Nenhuma lei encontrada para esta data" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Usar leis alternativas
      return await processarLeis(sb, leisAlt, targetDate, existing?.id);
    }

    return await processarLeis(sb, leis, targetDate, existing?.id);
  } catch (e) {
    console.error("[ExplicacaoLeisDia] Erro:", e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processarLeis(sb: any, leis: any[], targetDate: string, existingId?: string) {
  const leisIds = leis.map((l: any) => l.id);
  
  // Criar ou atualizar registro como "gerando"
  let recordId = existingId;
  if (!recordId) {
    const { data: inserted, error: insertError } = await sb
      .from("explicacao_leis_dia")
      .insert({
        data: targetDate,
        titulo: `Leis do dia ${targetDate}`,
        status: "gerando",
        total_leis: leis.length,
        leis_ids: leisIds,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;
    recordId = inserted.id;
  } else {
    await sb.from("explicacao_leis_dia").update({ status: "gerando", leis_ids: leisIds, total_leis: leis.length }).eq("id", recordId);
  }

  // Montar contexto das leis
  const leisTexto = leis.map((lei: any, i: number) => {
    const areas = lei.areas_direito?.join(", ") || "Geral";
    return `--- LEI ${i + 1} ---
Número: ${lei.numero_lei}
Ementa: ${lei.ementa || "Sem ementa"}
Áreas: ${areas}
Texto (resumido): ${(lei.texto_formatado || "").substring(0, 2000)}`;
  }).join("\n\n");

  const systemPrompt = `Você é um professor de Direito brasileiro que explica leis de forma simples e acessível para leigos.
Seu estilo é conversacional, como se estivesse explicando para um amigo tomando café.
Use analogias do dia a dia, exemplos práticos e linguagem simples.
Quando usar termos técnicos, explique-os imediatamente entre parênteses.
Organize a explicação em seções claras com markdown.
Use emojis moderadamente para tornar a leitura mais agradável.`;

  const prompt = `Explique as seguintes leis publicadas hoje (${targetDate}) de forma simples e acessível para leigos:

${leisTexto}

INSTRUÇÕES:
1. Comece com um resumo geral do dia ("O que aconteceu hoje na legislação brasileira")
2. Para cada lei, explique:
   - O que ela muda na prática
   - Como isso afeta o cidadão comum
   - Termos técnicos explicados de forma simples
3. Faça conexões entre as leis quando possível
4. Use linguagem conversacional
5. Termine com "O que isso significa pra você" - um resumo prático

Formato: Markdown com títulos (##), bullets e destaques (**negrito**).`;

  // Gerar explicação
  const explicacao = await callGemini(prompt, systemPrompt);

  // Gerar título resumido
  const tituloPrompt = `Baseado nestas leis: ${leis.map((l: any) => l.numero_lei).join(", ")}
Crie um título curto e impactante (máximo 60 caracteres) para o resumo do dia. Apenas o título, sem aspas.`;
  
  let titulo = `Leis de ${targetDate}`;
  try {
    const tituloGerado = await callGemini(tituloPrompt, "Gere apenas o título, sem explicação.");
    if (tituloGerado && tituloGerado.length < 80) {
      titulo = tituloGerado.trim().replace(/^["']|["']$/g, "");
    }
  } catch { /* usar título padrão */ }

  // Gerar resumo da lei original para a aba "Lei Original"
  const leiOriginalResumo = leis.map((lei: any) => {
    return `## ${lei.numero_lei}\n\n**Ementa:** ${lei.ementa || "Sem ementa"}\n\n${lei.texto_formatado || "Texto não disponível"}\n\n---`;
  }).join("\n\n");

  // Gerar capa
  let capaUrl: string | null = null;
  try {
    capaUrl = await gerarCapaGemini(titulo, explicacao.substring(0, 500));
  } catch (e) {
    console.error("[ExplicacaoLeisDia] Erro ao gerar capa:", e);
  }

  // Atualizar registro
  await sb.from("explicacao_leis_dia").update({
    titulo,
    explicacao_texto: explicacao,
    lei_original_resumo: leiOriginalResumo,
    capa_url: capaUrl,
    status: "concluido",
    updated_at: new Date().toISOString(),
  }).eq("id", recordId);

  console.log(`[ExplicacaoLeisDia] ✅ Geração concluída para ${targetDate}`);

  return new Response(JSON.stringify({ ok: true, id: recordId, titulo }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
