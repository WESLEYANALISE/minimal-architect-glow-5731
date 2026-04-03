import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Tabelas e campos permitidos (whitelist)
const TABELAS_PERMITIDAS = ['conceitos_topicos', 'categorias_topicos'];
const CAMPOS_PERMITIDOS = ['slides_json', 'conteudo_gerado'];

// Gerar prompt visual com IA — estilo CINEMATOGRÁFICO (vida real → Direito)
async function gerarPromptComIA(titulo: string, conteudo: string, area: string): Promise<string> {
  const textoLimitado = conteudo.substring(0, 3000);

  const promptParaGerarPrompt = `You are a CINEMATIC ILLUSTRATION DIRECTOR who creates stunning, faithful visual representations of legal concepts for Brazilian law education.

CONTEXT:
- Legal Area: "${area}"
- Topic: "${titulo}"
- Content to illustrate: ${textoLimitado}

YOUR MISSION:
1. Carefully READ the content above and identify the SPECIFIC concept being taught
2. Create ONE SINGLE UNIFIED SCENE that visually represents EXACTLY what the text describes
3. The image must help the student UNDERSTAND the concept — not just decorate the slide

ABSOLUTE RULES — COMPOSITION:
- Create ONE single unified cinematic scene — NEVER split into panels, sections, triptychs, or sequential frames
- NEVER divide the image into 2, 3, or more separate scenes side by side
- ONE continuous composition, ONE moment in time, ONE visual story
- 16:9 horizontal landscape format

MANDATORY STYLE — CINEMATIC REALISTIC:
- Ultra realistic photography-quality rendering
- Cinematic lighting: warm golden tones, dramatic natural light, soft shadows
- Rich color palette with warm amber/golden accents
- High detail, concept art quality
- Emotional and evocative atmosphere

ANTI-DEFORMATION RULES (CRITICAL):
- Show human figures from BEHIND, in SILHOUETTE, in PROFILE VIEW, or with faces PARTIALLY LIT by dramatic lighting
- NEVER attempt detailed frontal faces — this causes deformations
- Characters can be seen from a distance, through windows, in shadow, or partially obscured
- Prioritize body language and posture over facial expressions
- When figures are closer, use dramatic side-lighting that leaves part of the face in shadow

SCENE GUIDELINES:
- Set the scene in realistic Brazilian environments: offices, courtrooms, homes, streets, universities
- Include subtle legal symbolism when appropriate: scales of justice, documents, gavels — but as NATURAL parts of the scene, not floating objects
- The scene should feel like a still frame from a high-budget documentary or film
- Diverse Brazilian characters in natural, contextually appropriate attire

STRICTLY FORBIDDEN:
- ❌ Splitting the image into multiple panels or sequential frames
- ❌ Cartoon, anime, 3D render, or stylized art styles
- ❌ Detailed frontal faces (causes deformation)
- ❌ Text, letters, words, numbers, labels, watermarks
- ❌ Dark, somber, or gloomy atmospheres
- ❌ Generic stock photo compositions
- ❌ Floating ethereal objects disconnected from the scene

OUTPUT:
- Write ONLY the image prompt in English (150-250 words)
- Start with: "Create a single cinematic horizontal photograph-style illustration (16:9) showing..."
- Describe ONE specific scene that faithfully represents the concept from the text
- Specify character positioning (silhouettes, profiles, from behind) to avoid facial deformation
- End with: "ultra realistic, dramatic golden lighting, cinematic style, 16:9 horizontal, single unified scene, high detail, no text"
- Generate ONLY the prompt, no explanations`;

  const API_KEYS = [
    { name: 'GEMINI_KEY_1', key: Deno.env.get('GEMINI_KEY_1') },
    { name: 'GEMINI_KEY_2', key: Deno.env.get('GEMINI_KEY_2') },
    { name: 'DIREITO_PREMIUM_API_KEY', key: Deno.env.get('DIREITO_PREMIUM_API_KEY') }
  ].filter(k => k.key);

  for (const { name, key } of API_KEYS) {
    try {
      console.log(`[gerar-imagem-conceito-slide] Tentando ${name} para prompt...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptParaGerarPrompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 1200 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const promptGerado = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (promptGerado) {
          console.log(`[gerar-imagem-conceito-slide] ✅ Prompt gerado com ${name} (${promptGerado.length} chars)`);
          return promptGerado;
        }
      }

      const errorText = await response.text();
      if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED')) {
        console.log(`[gerar-imagem-conceito-slide] ⚠️ Quota excedida em ${name}, tentando próxima...`);
        continue;
      }
      console.error(`[gerar-imagem-conceito-slide] Erro com ${name}:`, response.status);
      continue;
    } catch (error) {
      console.error(`[gerar-imagem-conceito-slide] Exceção com ${name}:`, error);
      continue;
    }
  }

  console.log('[gerar-imagem-conceito-slide] ⚠️ Nenhuma chave funcionou, usando prompt fallback');
  return `Create a single cinematic horizontal photograph-style illustration (16:9) showing the concept of "${titulo}" in a realistic Brazilian setting. A single unified scene depicting a professional environment where the legal concept naturally emerges: a figure seen from behind stands before a desk with legal documents, warm golden light streaming through a window illuminates the scene with dramatic shadows. The composition focuses on atmosphere and symbolism rather than facial details — all characters shown in silhouette, profile, or from behind. Rich warm color palette with amber tones. Ultra realistic, dramatic golden lighting, cinematic style, 16:9 horizontal, single unified scene, high detail, no text.`;
}

// ====== PLANO A: OpenAI (gpt-image-1) ======
async function gerarImagemComOpenAI(prompt: string): Promise<Uint8Array> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('OPENAI_API_KEY não configurada');

  console.log(`[gerar-imagem-conceito-slide] 🎨 Plano A: Gerando com OpenAI gpt-image-1...`);

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: '1536x1024',
      quality: 'low',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[gerar-imagem-conceito-slide] OpenAI erro: ${response.status} - ${errorText}`);
    throw new Error(`OpenAI API falhou: ${response.status}`);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI não retornou imagem');

  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  console.log(`[gerar-imagem-conceito-slide] ✅ OpenAI gerou ${bytes.length} bytes`);
  return bytes;
}

// ====== PLANO B: Gemini imagen (multiple models) ======
async function gerarImagemComGemini(prompt: string): Promise<Uint8Array> {
  const API_KEYS = [
    { name: 'GEMINI_KEY_1', key: Deno.env.get('GEMINI_KEY_1') },
    { name: 'GEMINI_KEY_2', key: Deno.env.get('GEMINI_KEY_2') },
  ].filter(k => k.key);

  // Try multiple imagen-capable models
  const IMAGEN_MODELS = [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-preview-image-generation',
  ];

  for (const model of IMAGEN_MODELS) {
    for (const { name, key } of API_KEYS) {
      try {
        console.log(`[gerar-imagem-conceito-slide] 🎨 Tentando ${model} com ${name}...`);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
              temperature: 0.8,
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED')) {
            console.log(`[gerar-imagem-conceito-slide] ⚠️ Quota excedida em ${name} (${model})`);
            continue;
          }
          console.error(`[gerar-imagem-conceito-slide] Gemini imagen erro ${name} (${model}): ${response.status} - ${errorText.substring(0, 200)}`);
          continue;
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts;
        if (!parts) {
          console.log(`[gerar-imagem-conceito-slide] ⚠️ ${name} (${model}) sem parts na resposta`);
          continue;
        }

        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            const b64 = part.inlineData.data;
            const binaryString = atob(b64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            console.log(`[gerar-imagem-conceito-slide] ✅ Gemini imagen gerou ${bytes.length} bytes via ${name} (${model})`);
            return bytes;
          }
        }

        console.log(`[gerar-imagem-conceito-slide] ⚠️ ${name} (${model}) não retornou imagem`);
      } catch (error) {
        console.error(`[gerar-imagem-conceito-slide] Exceção Gemini imagen ${name} (${model}):`, error);
        continue;
      }
    }
  }

  throw new Error('Todas as chaves Gemini imagen falharam');
}

// ====== FALLBACK: OpenAI → Gemini ======
async function gerarImagemComFallback(prompt: string): Promise<Uint8Array> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    try {
      return await gerarImagemComOpenAI(prompt);
    } catch (error) {
      console.log(`[gerar-imagem-conceito-slide] ⚠️ OpenAI falhou, tentando Gemini...`, error instanceof Error ? error.message : error);
    }
  } else {
    console.log(`[gerar-imagem-conceito-slide] ⚠️ OPENAI_API_KEY ausente, indo para Gemini`);
  }

  return await gerarImagemComGemini(prompt);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topico_id, secao_index, slide_index, titulo_slide, conteudo_slide, area, tabela_alvo, campo_json } = await req.json();

    if (!topico_id || secao_index === undefined || slide_index === undefined) {
      throw new Error('topico_id, secao_index e slide_index são obrigatórios');
    }

    const tabela = TABELAS_PERMITIDAS.includes(tabela_alvo) ? tabela_alvo : 'conceitos_topicos';
    const campo = CAMPOS_PERMITIDOS.includes(campo_json) ? campo_json : 'slides_json';

    console.log(`[gerar-imagem-conceito-slide] Gerando para tópico ${topico_id}, seção ${secao_index}, slide ${slide_index}: "${titulo_slide}" | tabela: ${tabela}, campo: ${campo}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ESTÁGIO 1: Gerar prompt visual com IA
    console.log(`[gerar-imagem-conceito-slide] Etapa 1: Gerando prompt visual com IA...`);
    const promptEspecifico = await gerarPromptComIA(
      titulo_slide || 'Conceito jurídico',
      conteudo_slide || '',
      area || 'Direito'
    );

    // ESTÁGIO 2: Reforçar estilo visual cinematográfico
    const promptFinal = `${promptEspecifico}

MANDATORY REINFORCEMENT: This must be ONE SINGLE unified scene — NEVER split into panels or sequential frames. Ultra realistic cinematic illustration, 16:9 horizontal landscape. Dramatic warm golden lighting. Show characters from behind, in silhouette, or profile — NEVER detailed frontal faces. Real Brazilian setting. NO cartoon, NO anime, NO stylized art. NO text, letters, words, numbers. NO floating disconnected objects. High detail, single continuous composition.`;

    // ESTÁGIO 3: Gerar imagem com fallback (OpenAI → Gemini)
    console.log(`[gerar-imagem-conceito-slide] Etapa 2: Gerando imagem...`);
    const bytes = await gerarImagemComFallback(promptFinal);

    console.log(`[gerar-imagem-conceito-slide] ✅ Imagem gerada, tamanho: ${bytes.length} bytes`);

    // Upload para Storage
    const safeName = (titulo_slide || 'slide').substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const path = `slides-conceitos/${topico_id}/${safeName}_s${secao_index}_p${slide_index}_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(path, bytes, { contentType: 'image/png', upsert: true });

    if (uploadError) throw new Error(`Upload erro: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('gerador-imagens').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    console.log(`[gerar-imagem-conceito-slide] ✅ Upload OK: ${publicUrl}`);

    // Atualizar no banco
    let persistido = false;
    const { data: topico, error: fetchError } = await supabase
      .from(tabela)
      .select(campo)
      .eq('id', topico_id)
      .maybeSingle();

    if (fetchError || !topico) {
      console.error(`[gerar-imagem-conceito-slide] Erro ao buscar tópico na tabela ${tabela}:`, fetchError);
    } else {
      const jsonData = topico[campo] as any;
      const secoes = jsonData?.secoes || (Array.isArray(jsonData) ? jsonData : null);
      
      if (secoes?.[secao_index]?.slides?.[slide_index]) {
        secoes[secao_index].slides[slide_index].imagemUrl = publicUrl;

        const updatedJson = jsonData?.secoes ? { ...jsonData, secoes } : secoes;

        const { error: updateError } = await supabase
          .from(tabela)
          .update({ [campo]: updatedJson })
          .eq('id', topico_id);

        if (updateError) {
          console.error(`[gerar-imagem-conceito-slide] Erro ao atualizar BD (${tabela}.${campo}):`, updateError);
        } else {
          persistido = true;
          console.log(`[gerar-imagem-conceito-slide] ✅ ${tabela}.${campo} atualizado no banco`);
        }
      } else {
        console.warn(`[gerar-imagem-conceito-slide] Seção ${secao_index} / slide ${slide_index} não encontrado no JSON`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, imagemUrl: publicUrl, persistido, tabela_alvo: tabela }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-imagem-conceito-slide] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
