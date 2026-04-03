import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { pcmToWav } from "../_shared/pcm-to-wav.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function registrarTokenUsage(params: Record<string, any>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) return;
  fetch(`${supabaseUrl}/functions/v1/registrar-token-usage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify(params),
  }).catch(err => console.error('[token-tracker] Erro:', err.message));
}

function sanitizePath(s: string): string {
  return s.replace(/[ºª°çãõáéíóúâêîôûàèìòùäëïöü\s]/gi, (c) => {
    const map: Record<string, string> = { 'º': 'o', 'ª': 'a', '°': '', 'ç': 'c', 'ã': 'a', 'õ': 'o', 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u', 'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u', 'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u', ' ': '_' };
    return map[c.toLowerCase()] || '';
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { numero_artigo, codigo = 'cp', etapa = 'texto', segmento_index } = await req.json()
    console.log(`[gerar-explicacao-artigo] Etapa=${etapa} Art.${numero_artigo} seg=${segmento_index ?? '-'}`)

    const { getRotatedKeyStrings } = await import("../_shared/gemini-keys.ts")
    const chaves = getRotatedKeyStrings()

    // ===== ETAPA 1: TEXTO =====
    if (etapa === 'texto') {
      const tabelaCodigo = 'CP - Código Penal'
      const { data: artigo, error: errArtigo } = await supabase
        .from(tabelaCodigo)
        .select('*')
        .eq('Número do Artigo', numero_artigo)
        .limit(1)
        .single()

      if (errArtigo || !artigo) {
        throw new Error(`Artigo ${numero_artigo} não encontrado`)
      }

      const textoArtigo = artigo['Conteúdo'] || artigo['Conteudo'] || artigo['conteudo'] || JSON.stringify(artigo)
      const tituloArtigo = artigo['Artigo'] || `Art. ${numero_artigo}`

      // Marcar como gerando
      await supabase.from('explicacoes_artigos_diarias').upsert({
        numero_artigo, codigo,
        titulo: tituloArtigo, texto_artigo: textoArtigo,
        status: 'gerando', progresso_geracao: 10,
      }, { onConflict: 'numero_artigo,codigo' })

      const promptExplicacao = `Você é um professor de Direito Penal brasileiro, especialista em tornar conceitos jurídicos acessíveis e memoráveis. Crie uma explicação DETALHADA e envolvente do artigo abaixo, estilo documentário educativo profissional.

ARTIGO: "${tituloArtigo}: ${textoArtigo}"

Crie EXATAMENTE 30 segmentos organizados nos blocos abaixo. Cada segmento tem:
1. "tipo" - Categoria (gancho/explicacao/contexto/exemplo/consequencia/resumo)
2. "texto" - Narração (2-3 frases, linguagem acessível, como professor jovem e didático)
3. "prompt_imagem" - Prompt EXTREMAMENTE DETALHADO em inglês para gerar uma ILUSTRAÇÃO CARTOON EDUCATIVA que represente FIELMENTE o que está sendo narrado no campo "texto". O prompt DEVE descrever com riqueza:
   - ESTILO: Cartoon editorial detalhado, traços expressivos, cores vibrantes, estilo infográfico educativo
   - CENÁRIO ILUSTRADO com muitos elementos simbólicos e metáforas visuais (balanças, martelos, cadeados, escudos, livros, correntes, etc.)
   - PERSONAGENS CARTOON com traços expressivos, olhos grandes, expressões faciais exageradas e roupas características (toga, terno, uniforme)
   - ÍCONES e SÍMBOLOS espalhados pela cena que reforcem o conceito jurídico explicado
   - COMPOSIÇÃO rica com vários elementos visuais interagindo (não apenas um personagem parado)
   - ATMOSFERA educativa mas dramática, com contrastes fortes e elementos que prendam a atenção
   PALETA OBRIGATÓRIA: tons escuros sofisticados (charcoal #1C1917, mogno profundo #3D1008), acentos em vermelho nobre (#9B2C2C, oxblood #8B2500), dourado elegante (#D4A574, #F5C518). Estilo cartoon premium e sofisticado. SEM texto, letras ou números na imagem.
4. "duracao_estimada" - Tempo em segundos (5-8)

BLOCOS OBRIGATÓRIOS:
- BLOCO 1 - GANCHO (2-3 segmentos tipo "gancho"): Abertura impactante, pergunta provocadora, dado surpreendente
- BLOCO 2 - O ARTIGO EM SI (10-12 segmentos tipo "explicacao"): Explicação detalhada do que o artigo diz, palavra por palavra, cada elemento, cada condição, cada exceção. Seja extremamente detalhista.
- BLOCO 3 - CONTEXTO HISTÓRICO (3-4 segmentos tipo "contexto"): Por que esse artigo existe, origem, necessidade social
- BLOCO 4 - CASO PRÁTICO (6-8 segmentos tipo "exemplo"): Um exemplo real detalhado com personagens fictícios, narrando passo a passo o que acontece, como o artigo se aplica
- BLOCO 5 - CONSEQUÊNCIAS (3-4 segmentos tipo "consequencia"): O que acontece se violar, penas, jurisprudência
- BLOCO 6 - RESUMO (2-3 segmentos tipo "resumo"): Recapitulação para fixação e frase marcante

Retorne APENAS JSON: { "titulo_explicacao": "...", "segmentos": [{ "tipo": "gancho", "texto": "...", "prompt_imagem": "...", "duracao_estimada": 6 }] }`

      let explicacaoData: any = null
      for (let i = 0; i < chaves.length; i++) {
        try {
          console.log(`Tentando GEMINI_KEY_${i + 1}...`)
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${chaves[i]}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptExplicacao }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 16384, responseMimeType: 'application/json' }
              })
            }
          )
          if (!resp.ok) { console.error(`Erro key ${i+1}: ${resp.status}`); continue }
          const data = await resp.json()
          const texto = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (!texto) continue
          registrarTokenUsage({ edge_function: 'gerar-explicacao-artigo', model: 'gemini-2.5-flash-lite', provider: 'gemini', tipo_conteudo: 'texto', input_tokens: data.usageMetadata?.promptTokenCount || 0, output_tokens: data.usageMetadata?.candidatesTokenCount || 0, custo_estimado_brl: 0, api_key_index: i, sucesso: true })
          explicacaoData = JSON.parse(texto)
          break
        } catch (e: any) { console.error(`Exceção key ${i+1}: ${e.message}`); continue }
      }

      if (!explicacaoData?.segmentos) throw new Error('Falha ao gerar explicação')

      await supabase.from('explicacoes_artigos_diarias').upsert({
        numero_artigo, codigo,
        titulo: explicacaoData.titulo_explicacao || tituloArtigo,
        texto_artigo: textoArtigo,
        explicacao_completa: explicacaoData.segmentos.map((s: any) => s.texto).join('\n\n'),
        segmentos: explicacaoData.segmentos,
        status: 'gerando', progresso_geracao: 30,
      }, { onConflict: 'numero_artigo,codigo' })

      console.log(`✅ Texto gerado: ${explicacaoData.segmentos.length} segmentos`)
      return new Response(JSON.stringify({ success: true, etapa: 'texto', total_segmentos: explicacaoData.segmentos.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ===== ETAPA 2: TTS (um segmento por vez) =====
    if (etapa === 'tts') {
      const si = segmento_index ?? 0
      const { data: registro } = await supabase.from('explicacoes_artigos_diarias').select('segmentos, titulo, texto_artigo').eq('numero_artigo', numero_artigo).eq('codigo', codigo).single()
      if (!registro?.segmentos) throw new Error('Registro não encontrado para TTS')

      const segmentos = registro.segmentos as any[]
      const seg = segmentos[si]
      if (!seg) throw new Error(`Segmento ${si} não existe para TTS`)

      // Pular se já tem audio_url
      if (seg.audio_url) {
        console.log(`TTS seg ${si+1}: já tem áudio, pulando`)
        return new Response(JSON.stringify({ success: true, etapa: 'tts', segmento: si, audio_url: seg.audio_url, skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const textoSegmento = seg.texto
      console.log(`TTS seg ${si+1}/${segmentos.length}: "${textoSegmento.substring(0, 60)}..."`)

      let audioUrl: string | null = null
      for (let i = 0; i < chaves.length; i++) {
        try {
          console.log(`TTS seg ${si+1} com key ${i+1}...`)
          const ttsResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${chaves[i]}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: textoSegmento }] }],
                generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
              })
            }
          )
          if (!ttsResp.ok) { console.error(`TTS erro seg ${si+1} key ${i+1}: ${ttsResp.status}`); continue }
          const ttsData = await ttsResp.json()
          const audioBase64 = ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
          if (!audioBase64) { console.error(`TTS sem áudio seg ${si+1} key ${i+1}`); continue }

          // Decode base64 to PCM (small per-segment, safe to use atob)
          const rawPcm = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
          const audioBytes = pcmToWav(rawPcm, 24000, 1, 16)
          
          const audioPath = `${sanitizePath(codigo)}/${sanitizePath(numero_artigo)}/seg_${si + 1}_audio.wav`
          await supabase.storage.from('explicacoes-artigos').upload(audioPath, audioBytes, { contentType: 'audio/wav', upsert: true })
          const { data: urlData } = supabase.storage.from('explicacoes-artigos').getPublicUrl(audioPath)
          audioUrl = urlData.publicUrl
          
          console.log(`✅ TTS seg ${si+1} OK (${rawPcm.length} bytes PCM)`)
          registrarTokenUsage({ edge_function: 'gerar-explicacao-artigo', model: 'gemini-2.5-flash-preview-tts', provider: 'gemini', tipo_conteudo: 'audio', input_tokens: Math.ceil(textoSegmento.length / 4), output_tokens: 0, custo_estimado_brl: 0, api_key_index: i, sucesso: true })
          break
        } catch (e: any) { console.error(`TTS exceção seg ${si+1} key ${i+1}: ${e.message}`); continue }
      }

      // Update segment with audio_url
      if (audioUrl) {
        segmentos[si] = { ...seg, audio_url: audioUrl }
      }
      const progresso = 30 + Math.round(((si + 1) / segmentos.length) * 20)
      await supabase.from('explicacoes_artigos_diarias').update({
        segmentos,
        progresso_geracao: progresso,
      }).eq('numero_artigo', numero_artigo).eq('codigo', codigo)

      return new Response(JSON.stringify({ success: true, etapa: 'tts', segmento: si, audio_url: audioUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ===== ETAPA 3: IMAGEM (uma por vez) =====
    if (etapa === 'imagem') {
      const si = segmento_index ?? 0
      const { data: registro } = await supabase.from('explicacoes_artigos_diarias').select('segmentos').eq('numero_artigo', numero_artigo).eq('codigo', codigo).single()
      if (!registro?.segmentos) throw new Error('Registro não encontrado para imagem')

      const segmentos = registro.segmentos as any[]
      const seg = segmentos[si]
      if (!seg) throw new Error(`Segmento ${si} não existe`)

      let imagemUrl: string | null = null
      for (let ki = 0; ki < chaves.length; ki++) {
        try {
          console.log(`Gerando imagem seg ${si+1} com key ${ki+1}...`)
          const imgResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${chaves[ki]}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `Generate a detailed educational cartoon illustration. NARRATIVE CONTEXT (the image must visually represent this): "${seg.texto}". VISUAL DIRECTION: ${seg.prompt_imagem}. MANDATORY COLOR PALETTE: Dark sophisticated tones (charcoal #1C1917, deep mahogany #3D1008), noble red accents (#9B2C2C, oxblood #8B2500), elegant gold highlights (#D4A574, #F5C518). STYLE: Vibrant and expressive cartoon illustration, editorial infographic style, rich in visual elements and metaphors, expressive cartoon characters with exaggerated features, many symbolic icons and visual elements filling the scene, bold outlines, dynamic composition, premium sophisticated cartoon look. Aspect ratio 9:16, absolutely NO text, letters, numbers or words in the image.` }] }],
                generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
              })
            }
          )
          if (!imgResp.ok) { console.error(`Img erro key ${ki+1}: ${imgResp.status}`); continue }
          const imgData = await imgResp.json()
          const parts = imgData.candidates?.[0]?.content?.parts || []
          const imgPart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'))
          if (!imgPart) { console.error(`Sem imagem key ${ki+1}`); continue }

          const imgBytes = Uint8Array.from(atob(imgPart.inlineData.data), c => c.charCodeAt(0))
          const ext = imgPart.inlineData.mimeType.includes('png') ? 'png' : 'jpg'
          const imgPath = `${sanitizePath(codigo)}/${sanitizePath(numero_artigo)}/seg_${si + 1}.${ext}`
          await supabase.storage.from('explicacoes-artigos').upload(imgPath, imgBytes, { contentType: imgPart.inlineData.mimeType, upsert: true })
          const { data: imgUrlData } = supabase.storage.from('explicacoes-artigos').getPublicUrl(imgPath)
          imagemUrl = imgUrlData.publicUrl
          console.log(`✅ Imagem ${si+1} salva`)
          break
        } catch (e: any) { console.error(`Img exceção key ${ki+1}: ${e.message}`); continue }
      }

      // Atualizar segmento com URL da imagem
      if (imagemUrl) {
        segmentos[si] = { ...seg, imagem_url: imagemUrl }
      }
      const progresso = 50 + Math.round(((si + 1) / segmentos.length) * 45)
      const isFinal = si >= segmentos.length - 1
      await supabase.from('explicacoes_artigos_diarias').update({
        segmentos,
        progresso_geracao: isFinal ? 100 : progresso,
        status: isFinal ? 'concluido' : 'gerando',
        ...(isFinal ? { data_publicacao: new Date().toISOString().split('T')[0] } : {}),
      }).eq('numero_artigo', numero_artigo).eq('codigo', codigo)

      return new Response(JSON.stringify({ success: true, etapa: 'imagem', segmento: si, imagem_url: imagemUrl, concluido: isFinal }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    throw new Error(`Etapa desconhecida: ${etapa}`)

  } catch (error: any) {
    console.error('[gerar-explicacao-artigo] Erro:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})