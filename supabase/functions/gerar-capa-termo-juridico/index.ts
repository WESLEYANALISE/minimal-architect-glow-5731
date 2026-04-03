import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODELOS_IMAGEM = [
  'gemini-2.5-flash-image',
];

async function gerarImagemComGemini(prompt: string, apiKey: string, modelo: string): Promise<{ success: boolean; data?: string; error?: string; isQuotaError?: boolean; isNotFoundError?: boolean }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `${response.status}: ${errorText.substring(0, 200)}`,
        isQuotaError: response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED'),
        isNotFoundError: response.status === 404
      };
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.data);
    
    if (!imagePart?.inlineData?.data) {
      return { success: false, error: 'Imagem não gerada' };
    }
    
    return { success: true, data: imagePart.inlineData.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termoId } = await req.json();
    if (!termoId) throw new Error('termoId é obrigatório');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: termo, error } = await supabase
      .from('termos_juridicos_aulas')
      .select('*')
      .eq('id', termoId)
      .single();

    if (error || !termo) throw new Error('Termo não encontrado');

    if (termo.capa_url) {
      return new Response(JSON.stringify({ capa_url: termo.capa_url, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🎨 Gerando capa para: ${termo.termo}`);

    const apiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];

    const prompt = `MINIMALIST ICON: Create a single, clean, minimalist symbolic icon representing the legal term "${termo.termo}" (${termo.descricao_curta || ''}).

Category: ${termo.categoria || 'General Law'}
Origin: ${termo.origem || 'Latin'}

MANDATORY STYLE:
- ULTRA MINIMALIST single icon/symbol
- Simple flat 2D design with maximum 2-3 colors
- NO TEXT, NO LETTERS, NO WORDS whatsoever
- Dark navy/purple gradient background (#0f172a to #1e1b4b)
- Icon in soft gold/amber color (#f59e0b) with subtle glow
- Clean geometric shapes, professional and elegant
- Similar style to iOS app icons

⛔ FORBIDDEN: ANY text, letters, complex illustrations, people, 3D effects.
Square format (1:1).`;

    let imageBase64 = '';
    let lastError = '';

    for (const modelo of MODELOS_IMAGEM) {
      let modeloFalhou404 = false;
      for (let i = 0; i < apiKeys.length; i++) {
        const result = await gerarImagemComGemini(prompt, apiKeys[i], modelo);
        if (result.success && result.data) {
          imageBase64 = result.data;
          break;
        }
        lastError = result.error || '';
        if (result.isNotFoundError) { modeloFalhou404 = true; break; }
      }
      if (imageBase64) break;
    }

    if (!imageBase64) {
      throw new Error(`Falha em gerar imagem: ${lastError}`);
    }

    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const termoSlug = termo.termo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const path = `termos-juridicos/${termoSlug}_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(path, bytes, { contentType: 'image/png', upsert: true });

    if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('imagens').getPublicUrl(path);
    const capaUrl = urlData.publicUrl;

    await supabase
      .from('termos_juridicos_aulas')
      .update({ capa_url: capaUrl, capa_gerada_em: new Date().toISOString() })
      .eq('id', termoId);

    console.log(`✅ Capa salva: ${capaUrl}`);

    return new Response(JSON.stringify({ capa_url: capaUrl, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
