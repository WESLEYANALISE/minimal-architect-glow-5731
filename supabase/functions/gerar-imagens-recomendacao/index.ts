import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLACEHOLDER_KEYS = [
  "PLACEHOLDER_IMAGEM_1",
  "PLACEHOLDER_IMAGEM_2",
  "PLACEHOLDER_IMAGEM_3",
  "PLACEHOLDER_IMAGEM_4",
  "PLACEHOLDER_IMAGEM_5"
];

const MODELOS_IMAGEM = [
  'gemini-2.5-flash-image',
];

async function gerarPromptsDeImagem(titulo: string, conteudo: string): Promise<string[]> {
  const API_KEYS = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
  ].filter(Boolean) as string[];

  const prompt = `Baseado no livro "${titulo}" e no seguinte conteúdo explicativo, gere EXATAMENTE 5 prompts de imagem em inglês. Cada prompt deve representar visualmente uma seção ou conceito diferente do texto. Os prompts devem ser cinematográficos, dramáticos, com paleta de cores âmbar e dourada, estilo fotorrealista. Cada prompt deve ter 2-3 frases descritivas e terminar com "Ultra high resolution."

Conteúdo:
${conteudo.substring(0, 3000)}

Responda APENAS com um JSON array de 5 strings, sem markdown. Exemplo:
["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5"]`;

  for (const apiKey of API_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 2000 },
          })
        }
      );

      if (!response.ok) continue;
      const data = await response.json();
      let texto = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      texto = texto.trim();
      if (texto.startsWith('```')) {
        texto = texto.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const prompts = JSON.parse(texto);
      if (Array.isArray(prompts) && prompts.length === 5) {
        console.log('✅ Prompts dinâmicos gerados com sucesso');
        return prompts;
      }
    } catch (err) {
      console.log('Erro ao gerar prompts dinâmicos:', err);
    }
  }

  // Fallback: prompts genéricos
  console.log('⚠️ Usando prompts fallback');
  return [
    `A dramatic cinematic scene representing the book "${titulo}". Warm amber and golden lighting, photorealistic style. Ultra high resolution.`,
    `A young student deeply immersed in reading "${titulo}" in a grand library. Amber candlelight, dramatic shadows, photorealistic cinematic style. Ultra high resolution.`,
    `An artistic painting of scholars passionately debating concepts from "${titulo}". Classical oil painting style with amber and golden tones. Ultra high resolution.`,
    `A symbolic artistic composition representing the core themes of "${titulo}". Dark background with amber and golden highlights, dramatic lighting. Ultra high resolution.`,
    `A powerful scene of knowledge and wisdom inspired by "${titulo}". A person standing before towering bookshelves, golden light streaming in. Photorealistic cinematic style. Ultra high resolution.`,
  ];
}

async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  const API_KEYS = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
  ].filter(Boolean) as string[];

  if (API_KEYS.length === 0) throw new Error("Nenhuma chave GEMINI_KEY configurada");

  for (const modelo of MODELOS_IMAGEM) {
    for (let i = 0; i < API_KEYS.length; i++) {
      try {
        console.log(`Tentando ${modelo} com GEMINI_KEY_${i + 1}...`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${API_KEYS[i]}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseModalities: ["IMAGE", "TEXT"]
              }
            })
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.log(`${modelo} GEMINI_KEY_${i + 1} falhou: ${response.status} - ${errText.substring(0, 200)}`);
          if (response.status === 429) {
            await new Promise(r => setTimeout(r, 2000));
          }
          continue;
        }
        const data = await response.json();

        for (const part of data.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            console.log(`✅ Sucesso com ${modelo} GEMINI_KEY_${i + 1}`);
            return part.inlineData.data;
          }
        }
      } catch (err) {
        console.log(`${modelo} GEMINI_KEY_${i + 1} erro:`, err);
      }
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let dica_id: number | null = null;
    try {
      const body = await req.json();
      dica_id = body?.dica_id || null;
    } catch { /* body vazio do cron */ }

    // Se não recebeu dica_id, buscar a dica de hoje que ainda não tem imagens
    if (!dica_id) {
      const now = new Date();
      const brasiliaOffset = -3 * 60;
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const brasiliaDate = new Date(utcMs + brasiliaOffset * 60000);
      const dataHoje = brasiliaDate.toISOString().split('T')[0];
      console.log(`🔍 Buscando dica do dia para: ${dataHoje}`);

      const { data: dicaHoje } = await supabase
        .from("dicas_do_dia")
        .select("id")
        .eq("data", dataHoje)
        .is("imagens_conteudo", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!dicaHoje) {
        console.log("⏭️ Nenhuma dica sem imagens encontrada para hoje");
        return new Response(JSON.stringify({ message: "Nenhuma dica pendente de imagens" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      dica_id = dicaHoje.id;
      console.log(`✅ Dica encontrada: ID ${dica_id}`);
    }

    const { data: dica, error: dicaError } = await supabase
      .from("dicas_do_dia")
      .select("*")
      .eq("id", dica_id)
      .single();

    if (dicaError || !dica) throw new Error(`Dica não encontrada: ${dicaError?.message}`);

    console.log(`📖 Gerando prompts dinâmicos para: ${dica.livro_titulo}`);

    // Gerar prompts dinâmicos baseados no conteúdo do livro
    const imagePrompts = await gerarPromptsDeImagem(dica.livro_titulo, dica.porque_ler || dica.livro_sobre || '');

    console.log(`🎨 Gerando ${imagePrompts.length} imagens para dica: ${dica.livro_titulo}`);

    const imageUrls: string[] = [];

    for (let i = 0; i < imagePrompts.length; i++) {
      console.log(`Gerando imagem ${i + 1}/${imagePrompts.length}...`);
      console.log(`  Prompt: ${imagePrompts[i].substring(0, 100)}...`);

      const base64Data = await gerarImagemComGemini(imagePrompts[i]);

      if (!base64Data) {
        throw new Error(`Nenhuma imagem gerada para prompt ${i + 1}`);
      }

      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `dica-${dica_id}-img-${i + 1}-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("dicas-imagens")
        .upload(fileName, binaryData, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) throw new Error(`Falha no upload da imagem ${i + 1}: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from("dicas-imagens")
        .getPublicUrl(fileName);

      imageUrls.push(publicUrlData.publicUrl);
      console.log(`Imagem ${i + 1} salva: ${publicUrlData.publicUrl}`);

      // Delay entre gerações
      if (i < imagePrompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Substituir placeholders no conteúdo
    let conteudo = dica.porque_ler || "";
    for (let i = 0; i < PLACEHOLDER_KEYS.length; i++) {
      conteudo = conteudo.replace(PLACEHOLDER_KEYS[i], `![Ilustração](${imageUrls[i]})`);
    }

    const { error: updateError } = await supabase
      .from("dicas_do_dia")
      .update({ porque_ler: conteudo })
      .eq("id", dica_id);

    if (updateError) throw new Error(`Falha ao atualizar conteúdo: ${updateError.message}`);

    console.log(`✅ Todas as ${imagePrompts.length} imagens geradas e conteúdo atualizado!`);

    return new Response(JSON.stringify({
      success: true,
      imageUrls,
      message: `${imagePrompts.length} imagens geradas e inseridas no conteúdo`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Erro desconhecido"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
