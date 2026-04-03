import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Gerar prompt visual com IA — estilo CINEMATOGRÁFICO (vida real → Direito)
async function gerarPromptComIA(titulo: string, area: string): Promise<string> {
  const promptParaGerarPrompt = `You are a CINEMATIC CONCEPT ARTIST who creates ultra-realistic horizontal illustrations for legal education in Brazil. Your specialty is showing EVERYDAY LIFE situations transforming into LEGAL CONCEPTS.

CONTEXT:
- Legal Area: "${area}"
- Topic Title: "${titulo}"

YOUR MISSION:
Analyze this legal topic deeply. Understand what it MEANS in practice — the real-life situations, actors, and consequences. Then create a CINEMATIC IMAGE PROMPT showing everyday Brazilian moments connected to legal meaning.

DO NOT create generic images. Create a SPECIFIC SCENE that could ONLY represent THIS particular topic.

MANDATORY STYLE — CINEMATIC REALISTIC:
- Ultra realistic characters and environments
- Cinematic lighting: dramatic, warm golden tones, natural light
- Emotional storytelling composition — the viewer should FEEL the scene
- 16:9 horizontal landscape format
- High detail, concept art quality
- Warm color palette mixed with subtle golden legal light effects

SCENE COMPOSITION — VIDA REAL → DIREITO:
1. Show 2-3 EVERYDAY MOMENTS happening in sequence (left to right) that relate to "${titulo}"
   - Examples: people signing contracts, handshakes, buying things, family moments, work situations
   - Real Brazilian settings: bakeries, offices, homes, streets, courtrooms
2. ABOVE or AROUND these scenes, subtle GLOWING LEGAL SYMBOLS appear connecting everything:
   - Contract papers, scales of justice, signatures, legal documents floating softly
   - These symbols should be ethereal/translucent, not solid objects
3. The environment should GRADUALLY TRANSFORM from normal daily life into a symbolic legal world
4. Show that everyday decisions create legal consequences

CHARACTER GUIDELINES:
- Realistic Brazilian people of diverse backgrounds
- Natural expressions and body language
- Wearing everyday clothes (not formal legal attire, unless the scene demands it)
- Characters should be DOING something — interacting, signing, shaking hands, discussing

STRICTLY FORBIDDEN:
- ❌ Cartoon, anime, or stylized art styles
- ❌ Dark, somber, or gloomy atmospheres
- ❌ Generic stock photo compositions
- ❌ Isolated objects without human context
- ❌ Text, letters, words, numbers, labels, watermarks

OUTPUT:
- Write ONLY the image prompt in English (150-250 words)
- Start with: "Create a cinematic horizontal illustration (16:9) representing the concept of..."
- Describe SPECIFIC everyday scenes that connect to the legal topic
- Include the gradual transformation from daily life to legal symbolism
- End with: "ultra realistic, dramatic lighting, cinematic style, 16:9 horizontal composition, high detail, educational concept art"
- Generate ONLY the prompt, no explanations`;

  const API_KEYS = [
    { name: 'GEMINI_KEY_1', key: Deno.env.get('GEMINI_KEY_1') },
    { name: 'GEMINI_KEY_2', key: Deno.env.get('GEMINI_KEY_2') },
    { name: 'DIREITO_PREMIUM_API_KEY', key: Deno.env.get('DIREITO_PREMIUM_API_KEY') }
  ].filter(k => k.key);

  for (const { name, key } of API_KEYS) {
    try {
      console.log(`[gerar-capa-topico] Tentando ${name} para prompt...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptParaGerarPrompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 800 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const promptGerado = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (promptGerado) {
          console.log(`[gerar-capa-topico] ✅ Prompt gerado com ${name}`);
          return promptGerado;
        }
      }
      const errorText = await response.text();
      if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED')) {
        console.log(`[gerar-capa-topico] ⚠️ Quota excedida em ${name}`);
        continue;
      }
      continue;
    } catch (error) {
      console.error(`[gerar-capa-topico] Exceção com ${name}:`, error);
      continue;
    }
  }

  // Fallback
  console.log('[gerar-capa-topico] ⚠️ Usando prompt fallback');
  return `Create a cinematic horizontal illustration (16:9) representing the concept of "${titulo}" in everyday Brazilian life. The scene shows three everyday moments happening in sequence: a person buying bread at a bakery, two friends shaking hands while making a deal, and a couple signing a contract at a table. Above these scenes, subtle glowing legal symbols appear connecting everything: contract papers, scales of justice, signatures, and legal documents floating softly in the air. The environment gradually transforms from normal daily life into a symbolic legal world, showing that everyday decisions create legal consequences. Cinematic lighting, realistic characters, emotional storytelling composition. Color palette: warm tones mixed with subtle golden legal light effects. Ultra realistic, dramatic lighting, cinematic style, 16:9 horizontal composition, high detail, educational concept art.`;
}

// Gerar imagem com Hugging Face FLUX
async function gerarImagemComHuggingFace(prompt: string): Promise<Uint8Array> {
  const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
  if (!HF_TOKEN) throw new Error('HUGGING_FACE_ACCESS_TOKEN não configurado');

  console.log('[gerar-capa-topico] 🎨 Gerando com Hugging Face FLUX.1-dev...');

  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-dev',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[gerar-capa-topico] ❌ HuggingFace falhou:', response.status, errorText);
    throw new Error(`HuggingFace erro: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log(`[gerar-capa-topico] ✅ Imagem gerada (${arrayBuffer.byteLength} bytes)`);
  return new Uint8Array(arrayBuffer);
}

// Fallback: Pollinations.ai
async function gerarImagemComPollinations(prompt: string): Promise<Uint8Array> {
  console.log('[gerar-capa-topico] 🎨 Fallback: Gerando com Pollinations.ai...');
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=400&nologo=true`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Pollinations erro: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function gerarImagem(prompt: string): Promise<Uint8Array> {
  try {
    return await gerarImagemComHuggingFace(prompt);
  } catch (err) {
    console.warn('[gerar-capa-topico] ⚠️ HuggingFace falhou, tentando Pollinations...', err);
    return await gerarImagemComPollinations(prompt);
  }
}

async function uploadParaSupabase(supabase: any, bytes: Uint8Array, bucket: string, path: string, contentType: string): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`Upload erro: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

const TABELAS_PERMITIDAS = ['categorias_topicos', 'oab_trilhas_topicos', 'RESUMO'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topico_id, titulo, area, tabela } = await req.json();
    const tabelaAlvo = tabela || 'categorias_topicos';

    if (!topico_id || !titulo) {
      throw new Error('topico_id e titulo são obrigatórios');
    }

    if (!TABELAS_PERMITIDAS.includes(tabelaAlvo)) {
      throw new Error('Tabela inválida');
    }

    console.log(`[gerar-capa-topico] Gerando capa para: "${titulo}" (área: ${area}, tabela: ${tabelaAlvo})`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ESTÁGIO 1: Gerar prompt visual com IA
    console.log('[gerar-capa-topico] Etapa 1: Gerando prompt visual com IA...');
    const promptEspecifico = await gerarPromptComIA(titulo, area || 'Direito');

    // ESTÁGIO 2: Aplicar regras visuais cinematográficas
    const promptFinal = `${promptEspecifico}

MANDATORY: Ultra realistic cinematic illustration, 16:9 horizontal landscape. Dramatic warm lighting with golden legal light effects. Show EVERYDAY LIFE situations transforming into legal concepts — real people in real Brazilian settings with subtle glowing legal symbols (scales, contracts, documents) floating ethereally above. Emotional storytelling composition. Warm color palette. NO cartoon, NO anime, NO stylized art. NO text, letters, words, numbers, labels. NO dark/somber atmospheres. High detail, educational concept art quality.`;

    // Gerar imagem
    const imageBytes = await gerarImagem(promptFinal);

    // Upload
    const safeName = titulo.substring(0, 40).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const path = `capas-topicos/${safeName}_${topico_id}_${Date.now()}.png`;
    const publicUrl = await uploadParaSupabase(supabase, imageBytes, 'gerador-imagens', path, 'image/png');

    console.log(`[gerar-capa-topico] Upload OK: ${publicUrl}`);

    const { error: updateError } = await supabase
      .from(tabelaAlvo)
      .update({ capa_url: publicUrl })
      .eq('id', topico_id);

    if (updateError) {
      console.error('[gerar-capa-topico] Erro ao atualizar BD:', updateError);
    }

    return new Response(
      JSON.stringify({ success: true, capa_url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[gerar-capa-topico] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
