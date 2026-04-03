import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { pcmToWav } from "../_shared/pcm-to-wav.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

async function updateProgresso(id: number, progresso: number, extra: Record<string, any> = {}) {
  const sb = getSupabase();
  await sb.from('gamificacao_casos_praticos').update({ progresso_geracao: progresso, ...extra }).eq('id', id);
}

async function callGemini(prompt: string): Promise<string> {
  const offset = Math.floor(Date.now() / 1000) % GEMINI_KEYS.length;
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = GEMINI_KEYS[(offset + i) % GEMINI_KEYS.length];
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.85, maxOutputTokens: 6000 },
          }),
        }
      );
      if (res.status === 429 || res.status === 503) continue;
      if (!res.ok) continue;
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch { continue; }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

async function ensureBucketExists() {
  const sb = getSupabase();
  // Try to check if bucket exists by listing
  const { error } = await sb.storage.getBucket('casos-praticos-capas');
  if (error) {
    console.log('Bucket not found, creating...');
    const { error: createError } = await sb.storage.createBucket('casos-praticos-capas', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (createError && !createError.message?.includes('already exists')) {
      console.error('Failed to create bucket:', createError);
      return false;
    }
  }
  return true;
}

async function gerarImagemCapa(descricao: string, artigo: string): Promise<string | null> {
  const offset = Math.floor(Date.now() / 1000) % GEMINI_KEYS.length;

  const prompt = `Generate a dramatic, cinematic illustration for a Brazilian criminal law case study. Scene: ${descricao.substring(0, 300)}. Style: dark moody courtroom drama illustration, warm red and amber tones, dramatic chiaroscuro lighting, detailed realistic scene with people, Brazilian setting. NO TEXT in the image. Horizontal composition 16:9.`;

  console.log('Generating image for article:', artigo);

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = GEMINI_KEYS[(offset + i) % GEMINI_KEYS.length];
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_modalities: ["TEXT", "IMAGE"],
            },
          }),
        }
      );

      if (res.status === 429 || res.status === 503) {
        console.log(`Key ${i} rate limited for image, trying next...`);
        continue;
      }
      if (!res.ok) {
        console.error('Image gen failed:', res.status, (await res.text()).substring(0, 200));
        continue;
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

      if (!imagePart?.inlineData?.data) {
        console.error('No image in Gemini response');
        continue;
      }

      console.log('Image received from Gemini, uploading...');
      await ensureBucketExists();

      const binaryData = Uint8Array.from(atob(imagePart.inlineData.data), c => c.charCodeAt(0));
      const mimeType = imagePart.inlineData.mimeType || 'image/png';
      const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
      const fileName = `art-${artigo.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}.${ext}`;

      const sb = getSupabase();
      const { error } = await sb.storage
        .from('casos-praticos-capas')
        .upload(fileName, binaryData, { contentType: mimeType, upsert: true });

      if (error) {
        console.error('Upload error:', JSON.stringify(error));
        return null;
      }

      const { data: urlData } = sb.storage.from('casos-praticos-capas').getPublicUrl(fileName);
      console.log('✅ Image uploaded:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (e) {
      console.error('Image gen exception with key', i, ':', e);
      continue;
    }
  }

  console.error('All keys failed for image generation');
  return null;
}

async function gerarAudioNarracao(texto: string): Promise<string | null> {
  if (!texto || texto.trim().length < 10) return null;
  
  const truncatedText = texto.substring(0, 5000);
  const offset = Math.floor(Date.now() / 1000) % GEMINI_KEYS.length;
  
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const apiKey = GEMINI_KEYS[(offset + i) % GEMINI_KEYS.length];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: truncatedText }] }],
          generationConfig: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: { voice_name: "Kore" }
              }
            }
          }
        }),
      });
      
      if (res.status === 429 || res.status === 503) continue;
      if (!res.ok) continue;
      
      const data = await res.json();
      const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!inlineData?.data) continue;
      
      // Convert raw PCM to valid WAV
      const rawPcm = Uint8Array.from(atob(inlineData.data), c => c.charCodeAt(0));
      const wavData = pcmToWav(rawPcm, 24000, 1, 16);
      
      // Upload to storage
      await ensureBucketExists();
      const sb = getSupabase();
      const fileName = `narracoes/caso-audio-${Date.now()}.wav`;
      
      const { error } = await sb.storage
        .from('casos-praticos-capas')
        .upload(fileName, wavData, { contentType: 'audio/wav', upsert: true });
      
      if (error) {
        console.error('Audio upload error:', error);
        return null;
      }
      
      const { data: urlData } = sb.storage.from('casos-praticos-capas').getPublicUrl(fileName);
      console.log('✅ Áudio da narração gerado:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (e) {
      console.error('Erro TTS com chave:', e);
      continue;
    }
  }
  
  console.error('Todas as chaves falharam para TTS');
  return null;
}

async function processarGeracaoEmBackground(recordId: number, numero_artigo: string, area: string, temaArtigo: string, conteudoArtigo: string) {
  try {
    await updateProgresso(recordId, 15);

    const prompt = `Você é um professor de Direito Penal brasileiro. Crie um CASO PRÁTICO baseado no seguinte artigo do ${area}:

ARTIGO: ${temaArtigo}
CONTEÚDO: ${conteudoArtigo}

Responda EXATAMENTE neste formato JSON (sem markdown, sem \`\`\`):
{
  "narrativa": "Uma narrativa envolvente de um caso prático real (4-5 parágrafos) que ilustre a aplicação deste artigo. Use nomes fictícios, descreva o cenário, os personagens e os fatos de forma cronológica como um storytelling. Seja detalhado e dramático. Inclua detalhes específicos como nomes de pessoas, locais, datas, horários, valores e ações concretas.",
  "descricao_capa": "Descrição visual detalhada da cena principal do caso para gerar uma ilustração dramática (2-3 frases descrevendo personagens, ambiente, ação)",
  "resumo_artigo": "Explicação resumida do artigo em 1-2 frases, como: 'Este artigo trata sobre...'",
  "termos_destaque": ["lista de 8-15 termos/frases ESPECÍFICOS deste caso que o estudante deve prestar atenção: nomes dos personagens, locais, horários, datas, objetos importantes, ações-chave, valores monetários, instituições mencionadas"],
  "questoes": [
    {
      "pergunta": "Pergunta sobre o caso",
      "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correta": 0,
      "explicacao": "Explicação detalhada citando o artigo"
    }
  ]
}

REGRAS:
- A narrativa deve ser cronológica (storytelling) e envolvente, com no mínimo 4 parágrafos
- A descricao_capa deve descrever uma cena visual dramática do caso (pessoas, lugar, ação)
- O resumo_artigo deve explicar brevemente o que o artigo determina
- termos_destaque: liste entre 8 e 15 termos/frases ESPECÍFICOS deste caso (nomes próprios, locais, datas, horários, objetos, ações concretas) que serão grifados na narrativa para o estudante prestar atenção
- Crie exatamente 10 questões com PROGRESSÃO DE DIFICULDADE:
  * Questões 1-3: IDENTIFICAÇÃO — Onde aconteceu? Quando? Quem são as partes envolvidas? (perguntas factuais simples sobre detalhes da narrativa)
  * Questões 4-6: FATOS — O que foi feito? Qual a sequência dos acontecimentos? Que ação desencadeou o problema?
  * Questões 7-10: ANÁLISE JURÍDICA — Qual artigo se aplica? Qual a consequência legal? Como classificar juridicamente a conduta?
- O campo "correta" é o índice (0-3) da opção correta
- Cada explicação deve citar o artigo relevante
- Use linguagem acessível mas juridicamente precisa`;

    await updateProgresso(recordId, 30);
    const geminiResponse = await callGemini(prompt);
    await updateProgresso(recordId, 55);

    let parsed: any;
    try {
      const cleaned = geminiResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Falha ao parsear resposta do Gemini');
      }
    }

    await updateProgresso(recordId, 65, {
      caso_narrativa: parsed.narrativa,
      questoes: parsed.questoes,
      resumo_artigo: parsed.resumo_artigo || null,
      termos_destaque: parsed.termos_destaque || null,
    });

    // Generate cover image
    let imagemUrl: string | null = null;
    try {
      console.log('Starting image generation...');
      imagemUrl = await gerarImagemCapa(parsed.descricao_capa || parsed.narrativa.substring(0, 300), numero_artigo);
      console.log('Image result:', imagemUrl ? 'SUCCESS' : 'FAILED');
    } catch (e) {
      console.error('Erro gerando imagem:', e);
    }

    await updateProgresso(recordId, 80, { imagem_capa_url: imagemUrl });

    // Generate audio narration
    let audioUrl: string | null = null;
    try {
      console.log('Gerando áudio da narração...');
      audioUrl = await gerarAudioNarracao(parsed.narrativa);
      console.log('Audio result:', audioUrl ? 'SUCCESS' : 'FAILED');
    } catch (e) {
      console.error('Erro gerando áudio:', e);
    }

    await updateProgresso(recordId, 100, {
      audio_url: audioUrl,
      status: 'concluido',
    });

    console.log(`✅ Caso prático gerado para Art. ${numero_artigo}, imagem: ${imagemUrl ? 'sim' : 'não'}, áudio: ${audioUrl ? 'sim' : 'não'}`);
  } catch (e) {
    console.error('Erro no background:', e);
    const sb = getSupabase();
    await sb.from('gamificacao_casos_praticos').update({
      status: 'erro',
      progresso_geracao: 0,
    }).eq('id', recordId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { numero_artigo, area = 'Código Penal', codigo = 'cp', regenerar_capa } = await req.json();
    if (!numero_artigo) throw new Error('numero_artigo é obrigatório');

    const sb = getSupabase();

    // Check if already exists and is complete
    const { data: existing } = await sb
      .from('gamificacao_casos_praticos')
      .select('*')
      .eq('area', area)
      .eq('codigo', codigo)
      .eq('numero_artigo', numero_artigo)
      .maybeSingle();

    // Handle cover regeneration for existing completed cases
    if (regenerar_capa && existing?.status === 'concluido') {
      const descricao = existing.caso_narrativa?.substring(0, 300) || `Caso prático do artigo ${numero_artigo}`;
      const bgPromise = (async () => {
        try {
          const imagemUrl = await gerarImagemCapa(descricao, numero_artigo);
          if (imagemUrl) {
            await sb.from('gamificacao_casos_praticos').update({ imagem_capa_url: imagemUrl }).eq('id', existing.id);
            console.log(`✅ Capa regenerada para Art. ${numero_artigo}: ${imagemUrl}`);
          }
        } catch (e) { console.error('Erro regenerando capa:', e); }
      })();
      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) { EdgeRuntime.waitUntil(bgPromise); }
      else { bgPromise.catch(e => console.error('BG error:', e)); }
      return new Response(JSON.stringify({ status: 'regenerando_capa', message: 'Capa sendo regenerada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existing?.status === 'concluido') {
      return new Response(JSON.stringify(existing), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (existing?.status === 'gerando') {
      return new Response(JSON.stringify(existing), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch article content from CP - Código Penal table
    const { data: artigo } = await sb
      .from('CP - Código Penal')
      .select('"Número do Artigo", Artigo')
      .eq('Número do Artigo', numero_artigo)
      .maybeSingle();

    const conteudoArtigo = artigo?.Artigo || `Artigo ${numero_artigo} do ${area}`;
    const temaArtigo = artigo?.["Número do Artigo"] || numero_artigo;

    let recordId: number;
    if (existing) {
      recordId = existing.id;
      await sb.from('gamificacao_casos_praticos').update({
        status: 'gerando', progresso_geracao: 5, titulo_artigo: temaArtigo
      }).eq('id', recordId);
    } else {
      const { data: inserted, error } = await sb.from('gamificacao_casos_praticos').insert({
        area, codigo, numero_artigo, titulo_artigo: temaArtigo, status: 'gerando', progresso_geracao: 5,
      }).select('id').single();
      if (error) throw error;
      recordId = inserted.id;
    }

    const responseData = {
      id: recordId, area, codigo, numero_artigo, titulo_artigo: temaArtigo,
      status: 'gerando', progresso_geracao: 5,
    };

    const backgroundPromise = processarGeracaoEmBackground(recordId, numero_artigo, area, temaArtigo, conteudoArtigo);
    
    // @ts-ignore
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundPromise);
    } else {
      backgroundPromise.catch(e => console.error('Background error:', e));
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Erro:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
